/* Math Wizard: the progress sheet's web app (step 11).
   This script belongs to its OWN Google Sheet ("Math Wizard – progress"). It never reads or writes the reading game's sheet.

   What the game sends (index.html: cloudSave, loadProfile, adminCall):
   - GET  ?action=load&id=ID                        → { ok, found, data, deleted }
   - POST { id, nick, mlvl, wiz, xp, n, acc, min, coins, craftAcc, restarts, real, cls, data }   (a save; data = the whole profile as JSON)
                                                    → { ok } · { ok, conflict, data } (the sheet has a copy with more answers) · { ok, deleted } (the teacher deleted this student)
   - POST { action: 'list', key }                   → { ok, students: [ { id, nick, real, cls, tier, wiz, xp, accuracy, answers, minutes, coins, craftAcc, restarts, last } ] }
   - POST { action: 'student', key, id }            → { ok, data }
   - POST { action: 'deleteStudent', key, id }      → { ok }
   The teacher password is the script property ADMIN_KEY (File → Project settings → Script properties). After 5 wrong tries the teacher area locks for 10 minutes.

   Sheets (made by the script on first use):
   - "Students": one row per student: the summary columns (the teacher can read and sort them in the sheet too), then the profile JSON split into
     chunks of 45,000 characters (a Google Sheets cell holds at most 50,000).
   - "Deleted": the numbers of students the teacher deleted (so an old device cannot bring them back).
*/
const SHEET = 'Students', DELETED = 'Deleted';
const HEAD = ['id', 'nick', 'real name', 'class', 'math level', 'wizard level', 'XP', 'answers', 'accuracy %', 'minutes', 'coins', 'crafting %', 'restarts', 'last saved'];
const DATA_COL = HEAD.length + 1, CHUNK = 45000, MAX_CHUNKS = 40;   // up to 1.8 million characters of profile per student
const LOCK_TRIES = 5, LOCK_SECONDS = 600;

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function book() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet(name, head) {
  const ss = book(); let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); sh.setFrozenRows(1); }
  return sh;
}
function students() {   // the Students sheet, with room for the profile parts (a new sheet has only 26 columns)
  const sh = sheet(SHEET, HEAD.concat(['profile (JSON, in parts)'])), need = DATA_COL + MAX_CHUNKS - 1, have = sh.getMaxColumns();
  if (have < need) sh.insertColumnsAfter(have, need - have);
  return sh;
}
const deletedSheet = () => sheet(DELETED, ['id', 'deleted at']);
const cleanId = id => String(id || '').trim().slice(0, 80);

function rowOf(sh, id) {   // the row number of a student (or 0)
  const n = sh.getLastRow(); if (n < 2) return 0;
  const ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return i + 2;
  return 0;
}
function isDeleted(id) {
  const sh = deletedSheet(), n = sh.getLastRow(); if (n < 2) return false;
  return sh.getRange(2, 1, n - 1, 1).getValues().some(r => String(r[0]) === id);
}
function readData(sh, row) {   // the profile JSON, joined from its parts
  const parts = sh.getRange(row, DATA_COL, 1, MAX_CHUNKS).getValues()[0];
  return parts.map(String).join('');
}
function writeData(sh, row, json) {
  const parts = []; for (let i = 0; i < MAX_CHUNKS; i++) parts.push(json.slice(i * CHUNK, (i + 1) * CHUNK));
  if (json.length > CHUNK * MAX_CHUNKS) throw new Error('profile too big');
  sh.getRange(row, DATA_COL, 1, MAX_CHUNKS).setNumberFormat('@').setValues([parts]);
}
const num = v => { const x = Number(v); return isFinite(x) ? x : 0; };

/* ----- loading a student ----- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== 'load') return out({ ok: true, app: 'Math Wizard progress' });
  const id = cleanId(p.id); if (!id) return out({ ok: false, error: 'id' });
  if (isDeleted(id)) return out({ ok: true, found: false, deleted: true });
  const sh = students(), row = rowOf(sh, id);
  if (!row) return out({ ok: true, found: false });
  return out({ ok: true, found: true, data: readData(sh, row) });
}

/* ----- saving, and the teacher area ----- */
function doPost(e) {
  let b; try { b = JSON.parse(e.postData.contents); } catch (x) { return out({ ok: false, error: 'json' }); }
  if (b.action) return admin(b);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { return out(save(b)); } finally { lock.releaseLock(); }
}
function save(b) {
  const id = cleanId(b.id); if (!id || typeof b.data !== 'string') return { ok: false, error: 'bad' };
  if (isDeleted(id)) return { ok: true, deleted: true };
  const sh = students(); let row = rowOf(sh, id);
  if (row) {   // the copy with more answers wins (the game decides the same way when it loads)
    const old = sh.getRange(row, 1, 1, HEAD.length).getValues()[0], oldN = num(old[7]);
    if (oldN > num(b.n)) return { ok: true, conflict: true, data: readData(sh, row) };
  } else { row = sh.getLastRow() + 1; if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 100); }
  const summary = [id, String(b.nick || '').slice(0, 40), String(b.real || '').slice(0, 80), String(b.cls || '').slice(0, 40), num(b.mlvl), num(b.wiz), num(b.xp), num(b.n), num(b.acc), num(b.min), num(b.coins), num(b.craftAcc), num(b.restarts), new Date().toISOString()];
  sh.getRange(row, 1, 1, 1).setNumberFormat('@');   // a number like 12345 stays text
  sh.getRange(row, 1, 1, HEAD.length).setValues([summary]);
  writeData(sh, row, b.data);
  return { ok: true };
}
function keyOk(key) {   // the teacher password, with a lock after too many wrong tries
  const cache = CacheService.getScriptCache(), tries = num(cache.get('wrongTries'));
  if (tries >= LOCK_TRIES) return 'locked';
  const real = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (real && key === real) { cache.remove('wrongTries'); return 'ok'; }
  cache.put('wrongTries', String(tries + 1), LOCK_SECONDS);
  return 'wrong';
}
function admin(b) {
  const k = keyOk(String(b.key || '')); if (k !== 'ok') return out({ ok: false, error: k });
  const sh = students();
  if (b.action === 'list') {
    const n = sh.getLastRow(), rows = n < 2 ? [] : sh.getRange(2, 1, n - 1, HEAD.length).getValues();
    return out({ ok: true, students: rows.filter(r => r[0] !== '').map(r => ({ id: String(r[0]), nick: String(r[1]), real: String(r[2]), cls: String(r[3]), tier: num(r[4]), wiz: num(r[5]), xp: num(r[6]),
      answers: num(r[7]), accuracy: num(r[8]), minutes: num(r[9]), coins: num(r[10]), craftAcc: num(r[11]), restarts: num(r[12]), last: r[13] instanceof Date ? r[13].toISOString() : String(r[13]) })) });
  }
  const id = cleanId(b.id), row = id ? rowOf(sh, id) : 0;
  if (b.action === 'student') return row ? out({ ok: true, data: readData(sh, row) }) : out({ ok: false, error: 'not found' });
  if (b.action === 'deleteStudent') {
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try { const r = rowOf(sh, id); if (r) sh.deleteRow(r); if (id && !isDeleted(id)) deletedSheet().appendRow([id, new Date().toISOString()]); return out({ ok: true }); }
    finally { lock.releaseLock(); }
  }
  return out({ ok: false, error: 'action' });
}
