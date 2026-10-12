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

   Script properties: ADMIN_EMAIL (the Admin's e-mail). SHEET_ID and SALT are made by the script itself.
   Run setup() once from the editor: it makes the sheet, asks for the permissions and starts the daily count.
*/
const VERSION = 1;
const HEAD = ['id', 'name', 'code', 'web app', 'owner gmail', 'status', 'games', 'players', 'active today', 'last active', 'script version', 'created', 'setup token', 'key'];
const C = { id: 0, name: 1, code: 2, url: 3, owner: 4, status: 5, games: 6, players: 7, today: 8, last: 9, ver: 10, created: 11, setup: 12, key: 13 };
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
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (a === 'registerSchool') return out(registerSchool(b));
    if (a === 'schoolCode') return out(schoolCode(b));
    if (['schools', 'refresh', 'newSchool', 'setStatus', 'deleteSchool'].includes(a)) return out(admin(a, b));
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
  put(f.row, C.status, 'active'); put(f.row, C.ver, String(num(ping.version))); put(f.row, C.setup, ''); put(f.row, C.key, key);
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
function admin(a, b) {
  if (!String(b.token || '') || cache().get('adm:' + hash(b.token)) !== '1') return { ok: false, error: 'login' };
  if (a === 'refresh') pullCounts();
  if (a === 'schools' || a === 'refresh') return { ok: true, schools: listSchools() };
  if (a === 'newSchool') {
    const name = txt(b.name, 60), owner = mail(b.owner), games = ['math'];   // only the math game for now (owner, 2026-10-11)
    if (name.length < 2 || !EMAIL_RE.test(owner)) return { ok: false, error: 'bad' };
    const ids = rows().map(r => num(String(r[C.id]).replace(/\D/g, ''))), id = 'S' + (Math.max(0, ...ids) + 1);
    const setup = Utilities.getUuid().replace(/-/g, '');
    book().appendRow([id, name, '', '', owner, 'waiting setup', games.join(','), 0, 0, '', '', new Date().toISOString(), hash(setup), '']);
    return { ok: true, id, setup };
  }
  const f = findRow(r => String(r[C.id]) === String(b.id || '') && r[C.status] !== 'deleted'); if (!f) return { ok: false, error: 'school' };
  if (a === 'setStatus') { if (!['active', 'suspended'].includes(b.status) || f.r[C.status] === 'waiting setup') return { ok: false, error: 'bad' }; put(f.row, C.status, b.status); return { ok: true }; }
  if (a === 'deleteSchool') { book().deleteRow(f.row); return { ok: true }; }
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
