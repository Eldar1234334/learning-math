/* SpellQuest: Math Adventure: the school progress sheet's web app (step 11, part 2: school mode of the shared login design).
   This script belongs to its OWN Google Sheet ("SpellQuest Math – progress"). It never reads or writes the reading game's sheet.

   Everything is a POST with a JSON body (nothing secret ever goes in a URL):
   - { action: 'school', code }                         → { ok, token }  the school code on a device's first use; the device keeps the token
                                                          (changing the code later does not stop devices that are already set up)
   - { action: 'load', token, id }                      → { ok, found, status, data } · { ok, found: false, deleted | rejected }
                                                          game data only: never the real name or class. Limited per number and per minute.
   - { action: 'register', token, id, real, cls, data } → { ok } · { ok: false, error: 'taken' }   "I am new": a WAITING student (plays at once)
   - { action: 'save', token, id, nick, mlvl, wiz, xp, n, acc, min, coins, craftAcc, restarts, data }
                                                        → { ok } · { ok, conflict, data } · { ok, deleted } · { ok, rejected } · { ok: false, error: 'unknown' }
   Teacher area (the password is the script property ADMIN_KEY; 5 wrong tries lock it for 10 minutes):
   - { action: 'list', key }                            → { ok, students: [ { id, nick, real, cls, status, joined, tier, wiz, xp, accuracy, answers, minutes, coins, craftAcc, restarts, last } ] }
   - { action: 'student', key, id }                     → { ok, data, real, cls, status }
   - { action: 'approve' | 'reject' | 'deleteStudent', key, id } → { ok }
   - { action: 'addClass', key, cls, names: [...] }     → { ok, made: [ { id, real, cls } ] }   a class list: numbers for the login cards
   - { action: 'getCode' | 'setCode', key, code }       → { ok, code }

   Script properties (Project settings → Script properties): ADMIN_KEY (the teacher password), SCHOOL_CODE (for example SUNNY-7).
   SCHOOL_TOKEN is made by the script itself.
*/
const SHEET = 'Students', REMOVED = 'Removed';
const HEAD = ['id', 'nickname', 'real name', 'class', 'status', 'joined', 'math level', 'wizard level', 'XP', 'answers', 'accuracy %', 'minutes', 'coins', 'crafting %', 'restarts', 'last saved'];
const C = { id: 0, nick: 1, real: 2, cls: 3, status: 4, joined: 5, mlvl: 6, wiz: 7, xp: 8, n: 9, acc: 10, min: 11, coins: 12, craft: 13, restarts: 14, last: 15 };
const DATA_COL = HEAD.length + 1, CHUNK = 45000, MAX_CHUNKS = 40;   // the profile JSON in parts (a cell holds at most 50,000 characters)
const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LIMIT = { codeTries: [20, 600], loadPerId: [12, 60], loadAll: [400, 60], adminTries: [5, 600] };   // [how many, in how many seconds]

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
const props = () => PropertiesService.getScriptProperties();
const num = v => { const x = Number(v); return isFinite(x) ? x : 0; };
const cleanId = id => String(id || '').trim().toUpperCase().slice(0, 20);
const txt = (s, n) => String(s || '').trim().replace(/\s+/g, ' ').slice(0, n);
function over(name, lim) {   // a counter in the cache; true when this request goes over the limit
  const c = CacheService.getScriptCache(), k = 'lim:' + name, n = num(c.get(k)) + 1; c.put(k, String(n), lim[1]); return n > lim[0];
}
function sheet(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet(); let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); sh.setFrozenRows(1); }
  return sh;
}
function students() {   // the Students sheet, with room for the profile parts (a new sheet has only 26 columns)
  const sh = sheet(SHEET, HEAD.concat(['profile (game data, in parts)'])), need = DATA_COL + MAX_CHUNKS - 1, have = sh.getMaxColumns();
  if (have < need) sh.insertColumnsAfter(have, need - have);
  return sh;
}
const removedSheet = () => sheet(REMOVED, ['id', 'why', 'when']);
function rowOf(sh, id) {
  const n = sh.getLastRow(); if (n < 2) return 0;
  const ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return i + 2;
  return 0;
}
function removedWhy(id) {   // 'deleted', 'rejected' or ''
  const sh = removedSheet(), n = sh.getLastRow(); if (n < 2) return '';
  const r = sh.getRange(2, 1, n - 1, 2).getValues().find(x => String(x[0]) === id); return r ? String(r[1]) : '';
}
function newRow(sh) { const row = sh.getLastRow() + 1; if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 100); sh.getRange(row, 1).setNumberFormat('@'); return row; }
const gameOnly = json => { try { const p = JSON.parse(json); delete p.real; delete p.cls; return JSON.stringify(p); } catch (x) { return ''; } };   // never a real name or class in the game data
const readData = (sh, row) => sh.getRange(row, DATA_COL, 1, MAX_CHUNKS).getValues()[0].map(String).join('');
function writeData(sh, row, json) {
  if (json.length > CHUNK * MAX_CHUNKS) throw new Error('profile too big');
  const parts = []; for (let i = 0; i < MAX_CHUNKS; i++) parts.push(json.slice(i * CHUNK, (i + 1) * CHUNK));
  sh.getRange(row, DATA_COL, 1, MAX_CHUNKS).setNumberFormat('@').setValues([parts]);
}
function token() { const p = props(); let t = p.getProperty('SCHOOL_TOKEN'); if (!t) { t = Utilities.getUuid(); p.setProperty('SCHOOL_TOKEN', t); } return t; }
const normCode = s => String(s || '').trim().toUpperCase().replace(/\s+/g, '');
function newId(sh) {   // a number nobody has (letters and digits, no I, O, 0, 1)
  for (;;) {
    let s = ''; for (let i = 0; i < 5; i++) s += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
    if (/[A-Z]/.test(s) && /[2-9]/.test(s) && !rowOf(sh, s) && !removedWhy(s)) return s;
  }
}

function doGet() { return out({ ok: true, app: 'SpellQuest Math progress' }); }
function doPost(e) {
  let b; try { b = JSON.parse(e.postData.contents); } catch (x) { return out({ ok: false, error: 'json' }); }
  const a = b.action || 'save';
  if (a === 'school') return out(school(b));
  if (['list', 'student', 'approve', 'reject', 'deleteStudent', 'addClass', 'getCode', 'setCode'].includes(a)) return out(admin(a, b));
  if (String(b.token || '') !== token()) return out({ ok: false, error: 'school' });   // only devices set up with the school code
  if (a === 'load') return out(load(b));
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { return out(a === 'register' ? register(b) : a === 'save' ? save(b) : { ok: false, error: 'action' }); } finally { lock.releaseLock(); }
}
function school(b) {
  if (over('code', LIMIT.codeTries)) return { ok: false, error: 'busy' };
  const want = normCode(props().getProperty('SCHOOL_CODE')); if (!want) return { ok: false, error: 'nocode' };
  return normCode(b.code) === want ? { ok: true, token: token() } : { ok: false, error: 'code' };
}
function load(b) {
  const id = cleanId(b.id); if (!id) return { ok: false, error: 'id' };
  if (over('all', LIMIT.loadAll) || over('id:' + id, LIMIT.loadPerId)) return { ok: false, error: 'busy' };
  const why = removedWhy(id); if (why) return { ok: true, found: false, deleted: why === 'deleted', rejected: why === 'rejected' };
  const sh = students(), row = rowOf(sh, id); if (!row) return { ok: true, found: false };
  const r = sh.getRange(row, 1, 1, HEAD.length).getValues()[0], data = readData(sh, row);
  return { ok: true, found: true, status: String(r[C.status]), data: data ? gameOnly(data) : '' };   // '' = a login card not used yet
}
function register(b) {
  const id = cleanId(b.id), real = txt(b.real, 60), cls = txt(b.cls, 20); if (!id || real.length < 3 || !cls) return { ok: false, error: 'bad' };
  const sh = students(); if (rowOf(sh, id) || removedWhy(id)) return { ok: false, error: 'taken' };
  const row = newRow(sh); sh.getRange(row, 1, 1, HEAD.length).setValues([[id, txt(b.nick, 30), real, cls, 'waiting', new Date().toISOString(), 0, 0, 0, 0, 0, 0, 0, 0, 0, '']]);
  if (typeof b.data === 'string' && b.data) writeData(sh, row, gameOnly(b.data));   // a hero that moves from home or offline play keeps its progress
  return { ok: true };
}
function save(b) {
  const id = cleanId(b.id); if (!id || typeof b.data !== 'string') return { ok: false, error: 'bad' };
  const why = removedWhy(id); if (why) return why === 'rejected' ? { ok: true, rejected: true } : { ok: true, deleted: true };
  const sh = students(), row = rowOf(sh, id); if (!row) return { ok: false, error: 'unknown' };   // only numbers made by the teacher or "I am new"
  const r = sh.getRange(row, 1, 1, HEAD.length).getValues()[0];
  if (num(r[C.n]) > num(b.n) && readData(sh, row)) return { ok: true, conflict: true, data: gameOnly(readData(sh, row)) };   // the copy with more answers wins
  r[C.nick] = txt(b.nick, 30); r[C.mlvl] = num(b.mlvl); r[C.wiz] = num(b.wiz); r[C.xp] = num(b.xp); r[C.n] = num(b.n); r[C.acc] = num(b.acc); r[C.min] = num(b.min);
  r[C.coins] = num(b.coins); r[C.craft] = num(b.craftAcc); r[C.restarts] = num(b.restarts); r[C.last] = new Date().toISOString();
  sh.getRange(row, 1, 1, HEAD.length).setValues([r]); writeData(sh, row, gameOnly(b.data));
  return { ok: true };
}
function admin(a, b) {
  const c = CacheService.getScriptCache(), tries = num(c.get('adminWrong'));
  if (tries >= LIMIT.adminTries[0]) return { ok: false, error: 'locked' };
  const real = props().getProperty('ADMIN_KEY');
  if (!real || String(b.key || '') !== real) { c.put('adminWrong', String(tries + 1), LIMIT.adminTries[1]); return { ok: false, error: 'wrong' }; }
  c.remove('adminWrong');
  const sh = students(), id = cleanId(b.id);
  if (a === 'list') {
    const n = sh.getLastRow(), rows = n < 2 ? [] : sh.getRange(2, 1, n - 1, HEAD.length).getValues();
    const iso = v => v instanceof Date ? v.toISOString() : String(v || '');
    return { ok: true, students: rows.filter(r => r[C.id] !== '').map(r => ({ id: String(r[C.id]), nick: String(r[C.nick]), real: String(r[C.real]), cls: String(r[C.cls]), status: String(r[C.status]), joined: iso(r[C.joined]),
      tier: num(r[C.mlvl]), wiz: num(r[C.wiz]), xp: num(r[C.xp]), answers: num(r[C.n]), accuracy: num(r[C.acc]), minutes: num(r[C.min]), coins: num(r[C.coins]), craftAcc: num(r[C.craft]), restarts: num(r[C.restarts]), last: iso(r[C.last]) })) };
  }
  if (a === 'getCode') return { ok: true, code: props().getProperty('SCHOOL_CODE') || '' };
  if (a === 'setCode') { const code = normCode(b.code); if (code.length < 4 || code.length > 20) return { ok: false, error: 'code' }; props().setProperty('SCHOOL_CODE', code); return { ok: true, code }; }
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (a === 'addClass') {
      const cls = txt(b.cls, 20), names = (b.names || []).map(x => txt(x, 60)).filter(x => x.length >= 2).slice(0, 60); if (!cls || !names.length) return { ok: false, error: 'bad' };
      const made = names.map(real => { const nid = newId(sh), row = newRow(sh); sh.getRange(row, 1, 1, HEAD.length).setValues([[nid, '', real, cls, 'approved', new Date().toISOString(), 0, 0, 0, 0, 0, 0, 0, 0, 0, '']]); return { id: nid, real, cls }; });
      return { ok: true, made };
    }
    const row = id ? rowOf(sh, id) : 0;
    if (a === 'student') { if (!row) return { ok: false, error: 'not found' }; const r = sh.getRange(row, 1, 1, HEAD.length).getValues()[0]; return { ok: true, data: gameOnly(readData(sh, row) || '{}'), real: String(r[C.real]), cls: String(r[C.cls]), status: String(r[C.status]) }; }
    if (a === 'approve') { if (!row) return { ok: false, error: 'not found' }; sh.getRange(row, C.status + 1).setValue('approved'); return { ok: true }; }
    if (a === 'reject' || a === 'deleteStudent') {   // rejected: the device moves the hero to offline play; deleted: the device forgets the hero
      if (row) sh.deleteRow(row); if (id && !removedWhy(id)) removedSheet().appendRow([id, a === 'reject' ? 'rejected' : 'deleted', new Date().toISOString()]); return { ok: true };
    }
    return { ok: false, error: 'action' };
  } finally { lock.releaseLock(); }
}
