/* SpellQuest: Math Adventure: the Admin's school list ("registry", schools spec §3.1). It lives in the ADMIN's Google account, in its own
   project and its own sheet. It never holds a student's name, class, progress or answers: only one row per school and that school's counts.

   Everything is a POST with a JSON body (nothing secret ever goes in a URL):
   Devices (anyone):
   - { action: 'resolve', code }                       → { ok, id, name, url, games } · { ok: false, error: 'code' | 'suspended' | 'busy' }
   - { action: 'status', id }                          → { ok, status }   'active' · 'suspended' · 'gone'
   A school's own script:
   - { action: 'registerSchool', setup, url, code, version } → { ok, id, key, name }   once, with the one-time setup token the Admin gave
   - { action: 'schoolCode', id, key, code }           → { ok }  · { ok: false, error: 'taken' }   the school changed its code
   The Admin (an e-mail code, then a session token; only the e-mail in the script property ADMIN_EMAIL gets a code):
   - { action: 'adminCode', email }                    → { ok }   always the same answer, so nobody learns who the Admin is
   - { action: 'adminVerify', email, code }            → { ok, token } · { ok: false, error: 'wrong' | 'expired' | 'locked' }
   - { action: 'schools' | 'refresh', token }          → { ok, schools: [ ... ] }   refresh first asks every active school for its counts
   - { action: 'newSchool', token, name, owner, games }→ { ok, id, setup }   the setup token goes to the school owner
   - { action: 'setStatus', token, id, status }        → { ok }   'active' · 'suspended'
   - { action: 'deleteSchool', token, id }             → { ok }   only the row here; the school keeps its own sheet
   - { action: 'newSetup', token, id }                 → { ok, setup }   a new setup token for a school still waiting
   - { action: 'homeStats', token }                    → { ok, total, week, day, playedDay, playedWeek }   the 🏠 home players (needs COUNT_URL, COUNT_KEY)

   Script properties: ADMIN_EMAIL (the Admin's e-mail); COUNT_URL and COUNT_KEY (the 🏠 home players' counting service and its key, for the
   home counts on the Admin screen). SHEET_ID and SALT are made by the script itself.
   Run setup() once from the editor: it makes the sheet, asks for the permissions and starts the daily count.
*/
const VERSION = 6;
const HEAD = ['id', 'name', 'code', 'web app', 'owner gmail', 'status', 'games', 'players', 'active today', 'last active', 'script version', 'created', 'setup token', 'key', 'kit'];
const C = { id: 0, name: 1, code: 2, url: 3, owner: 4, status: 5, games: 6, players: 7, today: 8, last: 9, ver: 10, created: 11, setup: 12, key: 13, kit: 14 };
const LIMIT = { resolve: [40, 60], miss: [30, 60], status: [300, 60], register: [10, 600], adminCode: [5, 3600], adminAll: [30, 60] };   // [how many, in how many seconds]
const URL_RE = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]{20,}\/exec$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SESSION = 21600;   // an Admin session lasts 6 hours (the longest the cache keeps anything)

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
const props = () => PropertiesService.getScriptProperties();
const cache = () => CacheService.getScriptCache();
const num = v => { const x = Number(v); return isFinite(x) ? x : 0; };
const txt = (s, n) => String(s || '').trim().replace(/\s+/g, ' ').slice(0, n);
const normCode = s => String(s || '').trim().toUpperCase().replace(/\s+/g, '');
const mail = s => String(s || '').trim().toLowerCase();
function over(name, lim) { const c = cache(), k = 'lim:' + name, n = num(c.get(k)) + 1; c.put(k, String(n), lim[1]); return n > lim[0]; }
function hash(s) { let salt = props().getProperty('SALT'); if (!salt) { salt = Utilities.getUuid(); props().setProperty('SALT', salt); } return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(String(s), salt)); }

function book() {   // its own small sheet, made on first use (this script is not attached to a spreadsheet)
  const p = props(), id = p.getProperty('SHEET_ID'); let ss;
  if (id) ss = SpreadsheetApp.openById(id); else { ss = SpreadsheetApp.create('SpellQuest Math – schools (Admin: counts only)'); p.setProperty('SHEET_ID', ss.getId()); }
  let sh = ss.getSheetByName('Schools');
  if (!sh) { sh = ss.getSheets()[0]; sh.setName('Schools'); sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]); sh.setFrozenRows(1); sh.getRange('A:N').setNumberFormat('@'); }
  else if (sh.getRange(1, HEAD.length).getValue() !== HEAD[HEAD.length - 1]) sh.getRange(1, HEAD.length).setValue(HEAD[HEAD.length - 1]);   // a sheet from before the kit column
  return sh;
}
function rows() { const sh = book(), n = sh.getLastRow(); return n < 2 ? [] : sh.getRange(2, 1, n - 1, HEAD.length).getValues(); }
function findRow(pred) { const r = rows(); for (let i = 0; i < r.length; i++) if (pred(r[i])) return { row: i + 2, r: r[i] }; return null; }
function put(row, col, v) { book().getRange(row, col + 1).setValue(v); }
const codeTaken = (code, exceptId) => !!findRow(r => normCode(r[C.code]) === code && String(r[C.id]) !== String(exceptId || '') && r[C.status] !== 'deleted');

function doGet() { return out({ ok: true, app: 'SpellQuest Math schools' }); }
function doPost(e) {
  let b; try { b = JSON.parse(e.postData.contents); } catch (x) { return out({ ok: false, error: 'json' }); }
  const a = b.action;
  if (a === 'resolve') return out(resolve(b));
  if (a === 'status') return out(status(b));
  if (a === 'adminCode') return out(adminCode(b));
  if (a === 'adminVerify') return out(adminVerify(b));
  if (a === 'googleSignIn') return out(adminGoogle(b));
  if (a === 'sensitiveCode') return out(adminSensitiveCode(b));
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (a === 'registerSchool') return out(registerSchool(b));
    if (a === 'schoolCode') return out(schoolCode(b));
    if (['schools', 'refresh', 'newSchool', 'setStatus', 'deleteSchool', 'homeStats', 'newSetup', 'auditLog'].includes(a)) return out(admin(a, b));
    return out({ ok: false, error: 'action' });
  } finally { lock.releaseLock(); }
}

/* ---------- devices ---------- */
function resolve(b) {
  if (over('resolve', LIMIT.resolve)) return { ok: false, error: 'busy' };
  const code = normCode(b.code); if (code.length < 4 || code.length > 20) return { ok: false, error: 'code' };
  const f = findRow(r => normCode(r[C.code]) === code && (r[C.status] === 'active' || r[C.status] === 'suspended'));
  if (!f) { if (over('miss', LIMIT.miss)) return { ok: false, error: 'busy' }; return { ok: false, error: 'code' }; }
  if (f.r[C.status] === 'suspended') return { ok: false, error: 'suspended', name: String(f.r[C.name]) };
  return { ok: true, id: String(f.r[C.id]), name: String(f.r[C.name]), url: String(f.r[C.url]), games: String(f.r[C.games] || 'math').split(',') };
}
function status(b) {
  if (over('status', LIMIT.status)) return { ok: false, error: 'busy' };
  const f = findRow(r => String(r[C.id]) === String(b.id || '')); if (!f || f.r[C.status] === 'deleted') return { ok: true, status: 'gone' };
  return { ok: true, status: f.r[C.status] === 'suspended' ? 'suspended' : 'active' };
}

/* ---------- a school's own script ---------- */
function registerSchool(b) {
  if (over('register', LIMIT.register)) return { ok: false, error: 'busy' };
  const setup = String(b.setup || ''), url = String(b.url || '').trim(), code = normCode(b.code);
  if (setup.length < 20) return { ok: false, error: 'setup' };
  const f = findRow(r => r[C.status] === 'waiting setup' && String(r[C.setup]) === hash(setup)); if (!f) return { ok: false, error: 'setup' };
  if (!URL_RE.test(url)) return { ok: false, error: 'url' };
  if (code.length < 4 || code.length > 20) return { ok: false, error: 'code' };
  if (codeTaken(code, f.r[C.id])) return { ok: false, error: 'taken' };
  let ping;   // the link must really be the school owner's script: it answers with its owner only to someone who holds the setup token
  try { ping = JSON.parse(UrlFetchApp.fetch(url, { method: 'post', contentType: 'text/plain', payload: JSON.stringify({ action: 'ping', setup }), muteHttpExceptions: true, followRedirects: true }).getContentText()); }
  catch (x) { return { ok: false, error: 'ping' }; }
  if (!ping || !ping.ok) return { ok: false, error: 'ping' };
  if (mail(ping.owner) !== mail(f.r[C.owner])) return { ok: false, error: 'owner' };
  const key = Utilities.getUuid() + Utilities.getUuid(), sh = book();
  sh.getRange(f.row, C.code + 1, 1, 2).setValues([[code, url]]);
  put(f.row, C.status, 'active'); put(f.row, C.ver, String(num(ping.version))); put(f.row, C.setup, ''); put(f.row, C.key, key); dropKit(f.r[C.kit]); put(f.row, C.kit, '');   // the kit did its job: the shared copy goes to the bin
  return { ok: true, id: String(f.r[C.id]), key, name: String(f.r[C.name]) };
}
function bySchoolKey(b) { const f = findRow(r => String(r[C.id]) === String(b.id || '') && r[C.status] !== 'deleted'); return f && String(b.key || '') && String(f.r[C.key]) === String(b.key) ? f : null; }
function schoolCode(b) {
  const f = bySchoolKey(b); if (!f) return { ok: false, error: 'key' };
  const code = normCode(b.code); if (code.length < 4 || code.length > 20) return { ok: false, error: 'code' };
  if (codeTaken(code, f.r[C.id])) return { ok: false, error: 'taken' };
  put(f.row, C.code, code); return { ok: true };
}

/* ---------- the Admin ---------- */
function adminCode(b) {
  const em = mail(b.email), want = mail(props().getProperty('ADMIN_EMAIL'));
  if (over('adminAll', LIMIT.adminAll)) return { ok: false, error: 'busy' };
  if (!EMAIL_RE.test(em) || em !== want || over('adminCode:' + hash(em), LIMIT.adminCode)) return { ok: true };   // the same answer for everyone
  const code = String(100000 + Math.floor(Math.random() * 900000));
  cache().put('acode', hash(code) + '|0', 600);
  MailApp.sendEmail({ to: em, subject: 'SpellQuest Math Admin code: ' + code, name: 'SpellQuest Math', body: 'Your Admin code is: ' + code + '\n\nIt works for 10 minutes, once. If you did not ask for it, you can ignore this e-mail.' });
  return { ok: true };
}
function adminVerify(b) {
  const em = mail(b.email), want = mail(props().getProperty('ADMIN_EMAIL')), code = String(b.code || '').trim();
  if (over('adminAll', LIMIT.adminAll)) return { ok: false, error: 'busy' };
  const c = cache(), rec = c.get('acode'); if (!rec) return { ok: false, error: 'expired' };
  const [h, t] = rec.split('|'), tries = num(t);
  if (tries >= 5) { c.remove('acode'); return { ok: false, error: 'locked' }; }
  if (!want || em !== want || !/^\d{6}$/.test(code) || hash(code) !== h) { c.put('acode', h + '|' + (tries + 1), 600); return { ok: false, error: 'wrong' }; }
  c.remove('acode');
  const token = Utilities.getUuid() + Utilities.getUuid(); c.put('adm:' + hash(token), '1', SESSION);
  return { ok: true, token };
}
/* ----- Google sign-in for the Admin (spec 07): Google proves the e-mail (our client ID, Google's issuer, verified, not expired);
   only the ADMIN_EMAIL gets a session. Any other account gets the same plain answer, so nobody learns who the Admin is. ----- */
const GOOGLE_CLIENT_ID = '640886464751-p6vril25pp5g5ijqprcs9o44039let2u.apps.googleusercontent.com';   // public (the secret is never used)
function adminGoogle(b) {
  if (over('adminAll', LIMIT.adminAll)) return { ok: false, error: 'busy' };
  const cred = String(b.credential || ''); if (!cred || cred.length > 4000) return { ok: false, error: 'google' };
  let info = {};
  try { info = JSON.parse(UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(cred), { muteHttpExceptions: true }).getContentText() || '{}'); } catch (x) { return { ok: false, error: 'google' }; }
  const verified = info.email_verified === true || info.email_verified === 'true';
  if (info.aud !== GOOGLE_CLIENT_ID || !/^(https:\/\/)?accounts\.google\.com$/.test(String(info.iss || '')) || !verified || Number(info.exp) * 1000 < Date.now()) return { ok: false, error: 'google' };
  const em = mail(info.email), want = mail(props().getProperty('ADMIN_EMAIL'));
  if (!want || em !== want) return { ok: true, admin: false };   // the same answer for every other account
  const token = Utilities.getUuid() + Utilities.getUuid(); cache().put('adm:' + hash(token), '1', SESSION);
  return { ok: true, admin: true, token };
}
/* ----- spec 07 (G3): a sensitive admin action asks for a 6-digit code, e-mailed to the Admin's own address (10 minutes, once, 5 tries),
   and every admin action is written to the Log tab (who, what, when). ----- */
function adminSensitiveCode(b) {
  if (!String(b.token || '') || cache().get('adm:' + hash(b.token)) !== '1') return { ok: false, error: 'login' };
  const em = mail(props().getProperty('ADMIN_EMAIL')); if (!em) return { ok: false, error: 'setup' };
  if (over('asens', [5, 3600])) return { ok: false, error: 'busy' };
  const code = String(100000 + Math.floor(Math.random() * 900000));
  cache().put('asens:' + hash(em), hash(code + ':s:' + em) + '|0', 600);
  try { MailApp.sendEmail({ to: em, name: 'SpellQuest Math', subject: 'SpellQuest Math: confirm a sensitive change: ' + code, body: 'Your code is ' + code + '. It works for 10 minutes, once.\n\nSomeone asked to delete a school. If that was not you, ignore this e-mail.' }); }
  catch (x) { return { ok: false, error: 'mail' }; }
  return { ok: true };
}
function adminSensOK(b) {
  const em = mail(props().getProperty('ADMIN_EMAIL')), k = 'asens:' + hash(em), c = cache(), rec = c.get(k); if (!rec) return false;
  const parts = rec.split('|'), tries = num(parts[1]); if (tries >= 5) { c.remove(k); return false; }
  if (hash(String(b.confirm || '').trim() + ':s:' + em) !== parts[0]) { c.put(k, parts[0] + '|' + (tries + 1), 600); return false; }
  c.remove(k); return true;
}
function alog(who, what, detail) { try { const ss = book().getParent(); let sh = ss.getSheetByName('Log'); if (!sh) { sh = ss.insertSheet('Log'); sh.appendRow(['when', 'who', 'what', 'detail']); } sh.appendRow([new Date().toISOString(), who, what, String(detail || '').slice(0, 200)]); } catch (x) {} }
function admin(a, b) {
  if (!String(b.token || '') || cache().get('adm:' + hash(b.token)) !== '1') return { ok: false, error: 'login' };
  if (a === 'auditLog') { const sh = book().getParent().getSheetByName('Log'), n = sh ? sh.getLastRow() : 0; const v = n > 1 ? sh.getRange(Math.max(2, n - 199), 1, Math.min(200, n - 1), 4).getValues() : []; return { ok: true, rows: v.map(r => ({ when: String(r[0]), who: String(r[1]), what: String(r[2]), detail: String(r[3]) })).reverse() }; }
  if (a === 'refresh') pullCounts();
  if (a === 'schools' || a === 'refresh') return { ok: true, schools: listSchools() };
  if (a === 'homeStats') return homeStats();
  if (a === 'newSchool') {
    const name = txt(b.name, 60), owner = mail(b.owner), games = ['math'];   // only the math game for now (owner, 2026-10-11)
    if (name.length < 2 || !EMAIL_RE.test(owner)) return { ok: false, error: 'bad' };
    const code = normCode(b.code);   // with a code, the school gets a kit (one link for the school owner), and the code is kept for it
    if (code && (code.length < 4 || code.length > 20)) return { ok: false, error: 'code' };
    if (code && codeTaken(code)) return { ok: false, error: 'taken' };
    const ids = rows().map(r => num(String(r[C.id]).replace(/\D/g, ''))), p = props();   // numbers are never used twice, even after a school is removed
    const n = Math.max(num(p.getProperty('NEXT_ID')), Math.max(0, ...ids) + 1, 3), id = 'S' + n; p.setProperty('NEXT_ID', String(n + 1));   // (S1 and S2 were used before this counter)
    const setup = Utilities.getUuid().replace(/-/g, '');
    book().appendRow([id, name, code, '', owner, 'waiting setup', games.join(','), 0, 0, '', '', new Date().toISOString(), hash(setup), '', '']);
    alog('admin', 'school added', name + ' ' + id + ' ' + owner); const kit = code ? makeKit(id, name, code, setup) : null;
    return { ok: true, id, setup, kit: kit && kit.link, kitError: kit && kit.error };
  }
  const f = findRow(r => String(r[C.id]) === String(b.id || '') && r[C.status] !== 'deleted'); if (!f) return { ok: false, error: 'school' };
  if (a === 'newSetup') {   // a new one-time setup token for a school still waiting (the old one stops working)
    if (f.r[C.status] !== 'waiting setup') return { ok: false, error: 'bad' };
    const setup = Utilities.getUuid().replace(/-/g, ''); put(f.row, C.setup, hash(setup));
    const kit = f.r[C.code] ? makeKit(String(f.r[C.id]), String(f.r[C.name]), String(f.r[C.code]), setup) : null;
    return { ok: true, setup, kit: kit && kit.link, kitError: kit && kit.error };
  }
  if (a === 'setStatus') { if (!['active', 'suspended'].includes(b.status) || f.r[C.status] === 'waiting setup') return { ok: false, error: 'bad' }; put(f.row, C.status, b.status); alog('admin', 'school ' + b.status, f.r[C.name]); return { ok: true }; }
  if (a === 'deleteSchool') {   // spec 07 §3: deleting a school needs the e-mailed code (the owner's decision: a code instead of the password)
    if (!adminSensOK(b)) return { ok: false, error: 'confirm' };
    alog('admin', 'school deleted', f.r[C.name] + ' ' + f.r[C.id]); dropKit(f.r[C.kit]); book().deleteRow(f.row); return { ok: true };
  }
  return { ok: false, error: 'action' };
}
function listSchools() {   // never the key or the setup token
  return rows().filter(r => r[C.id] !== '').map(r => ({ id: String(r[C.id]), name: String(r[C.name]), code: String(r[C.code]), owner: String(r[C.owner]), status: String(r[C.status]),
    games: String(r[C.games]), players: num(r[C.players]), today: num(r[C.today]), last: String(r[C.last] || ''), version: String(r[C.ver] || ''), created: String(r[C.created] || '') }));
}
function pullCounts() {   // asks each active or suspended school for its counts only (with the key both sides got at registration)
  const sh = book(), rs = rows();
  rs.forEach((r, i) => {
    if (!URL_RE.test(String(r[C.url])) || !['active', 'suspended'].includes(r[C.status])) return;
    try {
      const j = JSON.parse(UrlFetchApp.fetch(String(r[C.url]), { method: 'post', contentType: 'text/plain', payload: JSON.stringify({ action: 'stats', key: String(r[C.key]) }), muteHttpExceptions: true, followRedirects: true }).getContentText());
      if (j && j.ok) sh.getRange(i + 2, C.players + 1, 1, 4).setValues([[num(j.players), num(j.today), String(j.last || ''), String(num(j.version))]]);
    } catch (x) {}
  });
}
function daily() { pullCounts(); }
function setup() {   // run once from the editor
  book(); MailApp.getRemainingDailyQuota(); UrlFetchApp.getRequest('https://script.google.com');
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'daily')) ScriptApp.newTrigger('daily').timeBased().everyDays(1).atHour(5).create();
  Logger.log('Sheet: ' + SpreadsheetApp.openById(props().getProperty('SHEET_ID')).getUrl());
}
function homeStats() {   // the 🏠 home players (the counting service shared with the reading game): counts only. Script property COUNT_URL and COUNT_KEY.
  const p = props(), url = p.getProperty('COUNT_URL'), key = p.getProperty('COUNT_KEY'); if (!url || !key) return { ok: false, error: 'setup' };
  try { const j = JSON.parse(UrlFetchApp.fetch(url, { method: 'post', contentType: 'text/plain', payload: JSON.stringify({ action: 'appStats', game: 'math', key }), muteHttpExceptions: true, followRedirects: true }).getContentText());
    return j.ok ? { ok: true, total: j.total, week: j.week, day: j.day, playedDay: j.playedDay, playedWeek: j.playedWeek } : { ok: false, error: j.error || 'count' }; }
  catch (x) { return { ok: false, error: 'count' }; }
}

/* ----- the school kit: a Google Sheet with the school script inside (its own copy: the template, made once by makeTemplate(); the school
   script is pasted into it by hand, again whenever it changes). For each new school with a code, newSchool copies the template, writes the
   school's values into its Setup tab and shares it "anyone with the link can view"; the school owner opens the …/copy link, which makes the
   school's own copy in the school's Google account, and its 🧙 SpellQuest menu does the rest. ----- */
function kitTab(ss) {   // the Setup tab the school owner sees first
  const sh = ss.getSheets()[0]; sh.setName('Setup'); sh.clear();
  sh.getRange(1, 1, 9, 2).setValues([
    ['🧙 SpellQuest: Math Adventure: your school kit', ''],
    ['1. Make sure you are signed in with the school\'s Google account (top right corner).', ''],
    ['2. File → Make a copy (if you opened the kit link, you already did).', ''],
    ['3. In your copy: the 🧙 SpellQuest menu (top, next to Help) → Set up my school → Allow. It then explains one short Google step (Deploy).', ''],
    ['Your school\'s data stays in this sheet, in your Google account. The game\'s owner sees only counts.', ''],
    ['SCHOOL_NAME', ''], ['SCHOOL_CODE', ''], ['REGISTRY_URL', ''], ['SETUP_TOKEN', '']]);
  sh.getRange(1, 1).setFontSize(14).setFontWeight('bold'); sh.setColumnWidth(1, 560); sh.setColumnWidth(2, 420); sh.getRange('A6:A9').setFontColor('#777777');
}
function makeTemplate() {   // run once from the editor: the template sheet. Then open it → Extensions → Apps Script, and paste the school script (Code.gs and appsscript.json) into it.
  const p = props(); let id = p.getProperty('TEMPLATE_ID');
  if (!id) { const ss = SpreadsheetApp.create('SpellQuest Math – school kit (template)'); id = ss.getId(); p.setProperty('TEMPLATE_ID', id); }
  const ss = SpreadsheetApp.openById(id); if (!ss.getSheetByName('Setup') || ss.getSheetByName('Setup').getRange(6, 1).getValue() !== 'SCHOOL_NAME') kitTab(ss);
  Logger.log('The kit template: ' + ss.getUrl() + '\nOpen it → Extensions → Apps Script → paste the school script (Code.gs, and appsscript.json after Project Settings → Show "appsscript.json") → Save. Do it again whenever the school script changes.');
}
function makeKit(id, name, code, setup) {   // → { link } or { error }
  const t = props().getProperty('TEMPLATE_ID'); if (!t) return { error: 'no template (run makeTemplate)' };
  try {
    const f = DriveApp.getFileById(t).makeCopy('SpellQuest Math – ' + name + ' (school kit)'), ss = SpreadsheetApp.openById(f.getId()), sh = ss.getSheetByName('Setup');
    const self = props().getProperty('SELF_URL') || ScriptApp.getService().getUrl(); if (!URL_RE.test(self)) throw new Error("this list's own link is unknown: add the script property SELF_URL");
    const vals = { SCHOOL_NAME: name, SCHOOL_CODE: code, REGISTRY_URL: self, SETUP_TOKEN: setup };
    const keys = sh.getRange(1, 1, sh.getLastRow(), 1).getValues(); keys.forEach((r, i) => { if (r[0] in vals) sh.getRange(i + 1, 2).setValue(vals[r[0]]); });
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const row = findRow(r => String(r[C.id]) === id); if (row) { dropKit(row.r[C.kit]); put(row.row, C.kit, f.getId()); }
    return { link: 'https://docs.google.com/spreadsheets/d/' + f.getId() + '/copy' };
  } catch (x) { return { error: String(x.message || x) }; }
}
function dropKit(fileId) { if (!fileId) return; try { DriveApp.getFileById(String(fileId)).setTrashed(true); } catch (x) {} }
