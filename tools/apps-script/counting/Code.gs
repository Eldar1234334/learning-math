/*
   SpellQuest: Math Adventure: the counting service for 🏠 play at home.
   Its own service, NOT shared with the reading game. It keeps no names and no e-mail addresses:
   a parent is only a one-way fingerprint, and the Admin sees counts only.
   POST only, JSON body (nothing secret in a URL):
   - { action: 'appCode', email }            → { ok }   a 6-digit code by e-mail (10 minutes, once, 5 tries, 5 codes an hour per address)
   - { action: 'appVerify', email, code }    → { ok, isNew } · { ok: false, error: 'wrong' | 'expired' | 'locked' }
   - { action: 'appGoogle', credential }     → { ok, isNew } · { ok: false, error: 'google' | 'busy' }   Google proves the parent (our client ID, Google's issuer, verified, not expired); only the Google ID's fingerprint is kept
   - { action: 'played' }                    → { ok }   one more game played today (anonymous: no id, no fingerprint)
   - { action: 'appStats', key }             → { ok, total, week, day, playedDay, playedWeek }   for the Admin's list; key = script property ADMIN_KEY
   Script properties: ADMIN_KEY (the key the Admin's list uses), sheet_id and app_salt (made by the script itself).
   Run authorize() once from the editor to give it its permissions.
*/
const GOOGLE_CLIENT_ID = '640886464751-p6vril25pp5g5ijqprcs9o44039let2u.apps.googleusercontent.com';   // public (the secret is never used)
const GAME_NAME = 'SpellQuest: Math Adventure';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const APP_SHEET = 'app_users', PLAYED_SHEET = 'played';

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function salt_() { const p = PropertiesService.getScriptProperties(); let s = p.getProperty('app_salt'); if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('app_salt', s); } return s; }
function hex_(bytes) { let o = ''; for (let i = 0; i < bytes.length; i++) { const v = bytes[i] < 0 ? bytes[i] + 256 : bytes[i]; o += ('0' + v.toString(16)).slice(-2); } return o; }
function fp_(text) { return hex_(Utilities.computeHmacSha256Signature(String(text), salt_())); }
function day_(d) { return Utilities.formatDate(d || new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
function book_() {   // this script is not attached to a spreadsheet, so it keeps its own (fingerprints, dates and counts only)
  const p = PropertiesService.getScriptProperties(), id = p.getProperty('sheet_id');
  if (id) return SpreadsheetApp.openById(id);
  const ss = SpreadsheetApp.create('SpellQuest Math: home players (counts only, no names, no e-mails)'); p.setProperty('sheet_id', ss.getId()); return ss;
}
function appSheet_() {   // fingerprint, first_seen, how ('email' or 'google')
  const ss = book_(); let sh = ss.getSheetByName(APP_SHEET);
  if (!sh) { sh = ss.getSheets()[0]; sh.setName(APP_SHEET); sh.getRange(1, 1, 1, 3).setValues([['fingerprint', 'first_seen', 'how']]); }
  return sh;
}
function playedSheet_() {   // day, count: the anonymous "played today"
  const ss = book_(); let sh = ss.getSheetByName(PLAYED_SHEET);
  if (!sh) { sh = ss.insertSheet(PLAYED_SHEET); sh.getRange(1, 1, 1, 2).setValues([['day', 'count']]); }
  return sh;
}
function over_(name, max, seconds) {   // a simple limit: how many in how many seconds (for the whole service)
  const c = CacheService.getScriptCache(), n = Number(c.get('lim_' + name) || 0) + 1; c.put('lim_' + name, String(n), seconds); return n > max;
}
function doGet() { return out_({ ok: true, msg: GAME_NAME + ' home players' }); }

function doPost(e) {
  let b; try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad request' }); }
  if (b.action === 'appCode') return appCode_(b);
  if (b.action === 'appVerify') return appVerify_(b);
  if (b.action === 'appGoogle') return appGoogle_(b);
  if (b.action === 'played') return played_();
  if (b.action === 'appStats') return appStats_(b);
  return out_({ ok: false, error: 'unknown action' });
}

function appCode_(b) {
  const em = String(b.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(em) || em.length > 80) return out_({ ok: false, error: 'email' });
  const h = fp_('email:' + em), cache = CacheService.getScriptCache(), n = Number(cache.get('rl_' + h) || 0);
  if (n >= 5) return out_({ ok: false, error: 'wait' });
  if (over_('codes', 80, 21600)) return out_({ ok: false, error: 'busy' });   // a safety limit for the whole service (a free Gmail account sends about 100 e-mails a day)
  cache.put('rl_' + h, String(n + 1), 3600);
  const code = String(100000 + Math.floor(Math.random() * 900000));
  cache.put('code_' + h, fp_(code + ':' + h) + '|0', 600);   // only a scrambled copy of the code is kept, for 10 minutes
  const body = 'Your ' + GAME_NAME + ' code is: ' + code + '\n\nIt works for 10 minutes. If you did not ask for it, you can ignore this email.\n\nPrivacy: we do not keep your email address. We only count how many people use the app.';
  try { MailApp.sendEmail({ to: em, subject: 'Your ' + GAME_NAME + ' code: ' + code, body: body, name: GAME_NAME }); }
  catch (err) { return out_({ ok: false, error: 'mail' }); }
  return out_({ ok: true });
}

function appVerify_(b) {
  const em = String(b.email || '').trim().toLowerCase(), code = String(b.code || '').trim();
  if (!EMAIL_RE.test(em) || !/^\d{6}$/.test(code)) return out_({ ok: false, error: 'wrong' });
  const h = fp_('email:' + em), cache = CacheService.getScriptCache(), rec = cache.get('code_' + h);
  if (!rec) return out_({ ok: false, error: 'expired' });
  const parts = rec.split('|'), tries = Number(parts[1]) || 0;
  if (tries >= 5) { cache.remove('code_' + h); return out_({ ok: false, error: 'locked' }); }
  if (fp_(code + ':' + h) !== parts[0]) { cache.put('code_' + h, parts[0] + '|' + (tries + 1), 600); return out_({ ok: false, error: 'wrong' }); }
  cache.remove('code_' + h);
  return record_(h, 'email');
}

function appGoogle_(b) {
  const cred = String(b.credential || '');
  if (!cred || cred.length > 4000) return out_({ ok: false, error: 'google' });
  if (over_('google', 60, 600)) return out_({ ok: false, error: 'busy' });
  let info = {};
  try { info = JSON.parse(UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(cred), { muteHttpExceptions: true }).getContentText() || '{}'); }
  catch (x) { return out_({ ok: false, error: 'google' }); }
  const verified = info.email_verified === true || info.email_verified === 'true';
  if (info.aud !== GOOGLE_CLIENT_ID || !/^(https:\/\/)?accounts\.google\.com$/.test(String(info.iss || '')) || !verified || !info.sub || Number(info.exp) * 1000 < Date.now()) return out_({ ok: false, error: 'google' });
  return record_(fp_('google:' + info.sub), 'google');   // only the fingerprint of the Google ID is kept: no e-mail, no name
}

function record_(h, how) {   // one row per parent, however often they come back
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sh = appSheet_(), last = sh.getLastRow();
    let seen = false;
    if (last > 1) { const v = sh.getRange(2, 1, last - 1, 1).getValues(); for (let i = 0; i < v.length; i++) if (v[i][0] === h) { seen = true; break; } }
    if (!seen) sh.appendRow([h, new Date(), how]);
    return out_({ ok: true, isNew: !seen });
  } finally { lock.releaseLock(); }
}

function played_() {   // one more game today (no id, no fingerprint)
  if (over_('played', 600, 600)) return out_({ ok: false, error: 'busy' });
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sh = playedSheet_(), last = sh.getLastRow(), today = day_();
    let row = 0;
    if (last > 1) { const v = sh.getRange(2, 1, last - 1, 1).getValues(); for (let i = v.length - 1; i >= 0 && i >= v.length - 10; i--) { const d = v[i][0] instanceof Date ? day_(v[i][0]) : String(v[i][0]); if (d === today) { row = i + 2; break; } } }
    if (row) sh.getRange(row, 2).setValue((Number(sh.getRange(row, 2).getValue()) || 0) + 1);
    else { sh.appendRow([today, 1]); sh.getRange(sh.getLastRow(), 1).setNumberFormat('@').setValue(today); }
    return out_({ ok: true });
  } finally { lock.releaseLock(); }
}

function appStats_(b) {   // counts only, for the Admin's list
  const cache = CacheService.getScriptCache(), bad = Number(cache.get('bad_key') || 0);
  if (bad >= 10) return out_({ ok: false, error: 'locked' });
  const key = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY') || '';
  if (!key || String(b.key || '') !== key) { cache.put('bad_key', String(bad + 1), 600); return out_({ ok: false, error: 'auth' }); }
  const now = new Date().getTime(), sh = appSheet_(), last = sh.getLastRow();
  let total = 0, wk = 0, dy = 0;
  if (last > 1) { const v = sh.getRange(2, 2, last - 1, 1).getValues(); for (let i = 0; i < v.length; i++) { total++; const t = v[i][0] instanceof Date ? v[i][0].getTime() : 0; if (now - t < 7 * 864e5) wk++; if (now - t < 864e5) dy++; } }
  const ps = playedSheet_(), pl = ps.getLastRow(), today = day_(), week = {};
  let pd = 0, pw = 0;
  for (let k = 0; k < 7; k++) week[day_(new Date(now - k * 864e5))] = true;
  if (pl > 1) { const p = ps.getRange(2, 1, pl - 1, 2).getValues(); for (let j = 0; j < p.length; j++) { const d = p[j][0] instanceof Date ? day_(p[j][0]) : String(p[j][0]); if (d === today) pd += Number(p[j][1]) || 0; if (week[d]) pw += Number(p[j][1]) || 0; } }
  return out_({ ok: true, total: total, week: wk, day: dy, playedDay: pd, playedWeek: pw });
}

function authorize() { MailApp.getRemainingDailyQuota(); UrlFetchApp.getRequest('https://oauth2.googleapis.com'); appSheet_(); playedSheet_(); }   // run once from the editor: gives the permissions (mail, outside requests, the sheet)
