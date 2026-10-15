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
   Staff sign-in (schools spec §3.4): an e-mail code, only for the school owner (the Google account that runs this script) and the e-mails in the Staff tab:
   - { action: 'signin' }                               → { ok, password }   does the old teacher password still work here?
   - { action: 'staffCode', email }                     → { ok }   always the same answer
   - { action: 'staffVerify', email, code }             → { ok, sess, email, role } · { ok: false, error: 'wrong' | 'expired' | 'locked' }
   Teacher area: every action below takes { sess } (a staff session, 6 hours) or { key } (the old teacher password, the script property ADMIN_KEY,
   which counts as the school owner; 5 wrong tries lock it for 10 minutes). A teacher sees and changes only the classes in their Staff row;
   adding or removing staff and changing the school code are for the school owner. Staff changes, approvals and deletions go to the Log tab.
   - { action: 'me' }                                   → { ok, email, role, classes }
   - { action: 'staffList' }                            → { ok, owner, staff: [ { email, role, classes, added } ] }
   - { action: 'staffAdd', email, role, classes }       → { ok }   classes: 'ALL' or '3A,3B'
   - { action: 'staffRemove', email }                   → { ok }
   - { action: 'approveMany' | 'rejectMany', items: [ { id, real?, cls? } ] } → { ok, done, skipped }   waiting students; the name and class can be fixed
   - { action: 'classAdd' | 'classArchive', cls }       → { ok, classes }   school owner only (the Classes tab: the "I am new" class menu)
   - { action: 'cardsPrinted', ids: [...] }             → { ok, marked }   login cards printed (the Cards tab); 'list' tells each student's card: true/false,
                                                          and lastDay / today in the school's time zone (for "Played today")
   - { action: 'moveHome', id, email? }                → { ok, file, mailed }   move to home: the hand-over file (and, with a parent's e-mail, sent to it); the row becomes 'moved'
   - { action: 'undoMove', id }                         → { ok }   school owner, within 30 days
   - { action: 'setSelfMove', on }                      → { ok, selfMove }   school owner: students may move their own wizard home
   - { action: 'setPassword', on }                      → { ok, password }   school owner: the old teacher password on or off (turning it off needs an e-mail sign-in)
   A device with the school token: { action: 'selfMove', token, id } → { ok }   allowed when the owner turned it on, or the school's access has ended
                                                          ('load' and 'save' answer { moved: true } for a moved student)
   A device with the school token: { action: 'classes', token } → { ok, classes: [ ... ] }   class names only
   - { action: 'list', key }                            → { ok, students: [ { id, nick, real, cls, status, joined, tier, wiz, xp, accuracy, answers, minutes, coins, craftAcc, restarts, last } ] }
   - { action: 'student', key, id }                     → { ok, data, real, cls, status }
   - { action: 'approve' | 'reject' | 'deleteStudent', key, id } → { ok }
   - { action: 'addClass', key, cls, names: [...] }     → { ok, made: [ { id, real, cls } ] }   a class list: numbers for the login cards
   - { action: 'getCode' | 'setCode', key, code }       → { ok, code }   a new code is first checked with the Admin's school list (it must be free)
   The Admin's school list (registry, schools spec §3.3, §3.5; it never gets names, classes or game data):
   - { action: 'ping', setup }                          → { ok, owner, version }   only with this school's one-time setup token
   - { action: 'stats', key }                           → { ok, players, today, last, version }   counts only; the key both sides got at registration
   A new school: run setupSchool() once from the editor (after the script property SCHOOL_CODE): it makes the school's own sheet. See SETUP-school.md.
   Run linkRegistry() once from the editor (after the script properties REGISTRY_URL and SETUP_TOKEN are set) to join the Admin's list.

   Script properties (Project settings → Script properties): ADMIN_KEY (the teacher password), SCHOOL_CODE (for example SUNNY-7), and SHEET_ID
   (the sheet's id from its link) when the script is a separate project rather than opened with Extensions → Apps Script.
   SCHOOL_TOKEN is made by the script itself. REGISTRY_ID and REGISTRY_KEY are written by linkRegistry().
   WEB_APP_URL (optional): this script's web app link, if linkRegistry() cannot find it by itself.
*/
const VERSION = 14;   // shown to the Admin, so outdated schools can be seen
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
function book() {   // the school's sheet: SHEET_ID, or the sheet this script is attached to, or (a new school) a sheet it makes in the school's own account
  const p = props(), id = p.getProperty('SHEET_ID'); let ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) { ss = SpreadsheetApp.create('SpellQuest Math – ' + (p.getProperty('SCHOOL_NAME') || 'school') + ' (students)'); p.setProperty('SHEET_ID', ss.getId()); }
  return ss;
}
function sheet(name, head) {
  const ss = book(); let sh = ss.getSheetByName(name);
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
  if (a === 'ping') return out(ping(b));
  if (a === 'stats') return out(stats(b));
  if (a === 'signin') return out({ ok: true, password: !!props().getProperty('ADMIN_KEY') && props().getProperty('PASSWORD_OFF') !== '1' });   // how staff sign in here (the game hides the password link when it is off)
  if (a === 'staffCode') return out(staffCode(b));
  if (a === 'staffVerify') return out(staffVerify(b));
  if (a === 'googleSignIn') return out(googleSignIn(b));
  if (a === 'signout') return out(signOut(b));
  if (a === 'sensitiveCode') return out(sensitiveCode(b));   // spec 07 G1: Google proves who you are; the staff list decides what you may do
  if (['me', 'list', 'student', 'approve', 'reject', 'deleteStudent', 'addClass', 'getCode', 'setCode', 'staffList', 'staffAdd', 'staffRemove', 'auditLog', 'approveMany', 'rejectMany', 'classAdd', 'classArchive', 'cardsPrinted', 'moveHome', 'undoMove', 'setSelfMove', 'setPassword'].includes(a)) return out(admin(a, b));
  if (String(b.token || '') !== token()) return out({ ok: false, error: 'school' });   // only devices set up with the school code
  if (a === 'load') return out(load(b));
  if (a === 'classes') return out({ ok: true, classes: classNames() });   // for the "I am new" class menu (class names only)
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { return out(a === 'register' ? register(b) : a === 'save' ? save(b) : a === 'selfMove' ? selfMove(b) : { ok: false, error: 'action' }); } finally { lock.releaseLock(); }
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
  const r = sh.getRange(row, 1, 1, HEAD.length).getValues()[0]; if (r[C.status] === 'moved') return { ok: true, found: false, moved: true };   // moved to home: the device turns the hero into a home hero
  const data = readData(sh, row);
  return { ok: true, found: true, status: String(r[C.status]), data: data ? gameOnly(data) : '', selfMove: props().getProperty('SELF_MOVE') === '1' };   // '' = a login card not used yet
}
function register(b) {
  const id = cleanId(b.id), real = txt(b.real, 60), typed = txt(b.cls, 20); if (!id || real.length < 3 || !typed) return { ok: false, error: 'bad' };
  const known = classNames(), cls = known.find(c => clsKey(c) === clsKey(typed)) || typed; if (b.menu && known.length && cls === typed && !known.includes(typed)) return { ok: false, error: 'class' };   // a class from the school's list (games older than the class menu still send a typed class)
  const sh = students(); if (rowOf(sh, id) || removedWhy(id)) return { ok: false, error: 'taken' };
  const row = newRow(sh); sh.getRange(row, 1, 1, HEAD.length).setValues([[id, txt(b.nick, 30), real, cls, 'waiting', new Date().toISOString(), 0, 0, 0, 0, 0, 0, 0, 0, 0, '']]);
  if (typeof b.data === 'string' && b.data) writeData(sh, row, gameOnly(b.data));   // a hero that moves from home or offline play keeps its progress
  return { ok: true };
}
function save(b) {
  const id = cleanId(b.id); if (!id || typeof b.data !== 'string') return { ok: false, error: 'bad' };
  const why = removedWhy(id); if (why) return why === 'rejected' ? { ok: true, rejected: true } : { ok: true, deleted: true };
  const sh = students(), row = rowOf(sh, id); if (!row) return { ok: false, error: 'unknown' };   // only numbers made by the teacher or "I am new"
  const r = sh.getRange(row, 1, 1, HEAD.length).getValues()[0]; if (r[C.status] === 'moved') return { ok: true, moved: true };
  if (num(r[C.n]) > num(b.n) && readData(sh, row)) return { ok: true, conflict: true, data: gameOnly(readData(sh, row)) };   // the copy with more answers wins
  r[C.nick] = txt(b.nick, 30); r[C.mlvl] = num(b.mlvl); r[C.wiz] = num(b.wiz); r[C.xp] = num(b.xp); r[C.n] = num(b.n); r[C.acc] = num(b.acc); r[C.min] = num(b.min);
  r[C.coins] = num(b.coins); r[C.craft] = num(b.craftAcc); r[C.restarts] = num(b.restarts); r[C.last] = new Date().toISOString();
  sh.getRange(row, 1, 1, HEAD.length).setValues([r]); writeData(sh, row, gameOnly(b.data));
  return { ok: true };
}
function admin(a, b) {
  const who = staffAuth(b); if (who.error) return { ok: false, error: who.error };
  const owner = who.role === 'owner', sees = cls => owner || who.classes === 'ALL' || who.classes.includes(clsKey(cls));   // a teacher sees only the classes they were given
  if (['staffList', 'staffAdd', 'staffRemove', 'setCode', 'classAdd', 'classArchive', 'undoMove', 'setSelfMove', 'setPassword', 'auditLog'].includes(a) && !owner) return { ok: false, error: 'owner' };
  if (a === 'auditLog') return { ok: true, rows: auditRows(200) };
  if (a === 'me') return { ok: true, email: who.email, role: who.role, classes: who.classes };
  if (a === 'staffList') return { ok: true, staff: staffRows().map(s => ({ email: s.email, role: s.role, classes: s.classes, added: s.added })), owner: ownerEmail() };
  const sh = students(), id = cleanId(b.id);
  if (a === 'list') {
    purgeMoved(sh);
    const n = sh.getLastRow(), rows = n < 2 ? [] : sh.getRange(2, 1, n - 1, HEAD.length).getValues();
    const iso = v => v instanceof Date ? v.toISOString() : String(v || '');
    const printed = cardsPrinted();
    return { ok: true, me: { email: who.email, role: who.role }, school: props().getProperty('SCHOOL_NAME') || '', tz: Session.getScriptTimeZone(), today: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'), classes: classNames().filter(sees), students: rows.filter(r => r[C.id] !== '' && sees(r[C.cls])).map(r => ({ id: String(r[C.id]), nick: String(r[C.nick]), real: String(r[C.real]), cls: String(r[C.cls]), status: String(r[C.status]), joined: iso(r[C.joined]),
      tier: num(r[C.mlvl]), wiz: num(r[C.wiz]), xp: num(r[C.xp]), answers: num(r[C.n]), accuracy: num(r[C.acc]), minutes: num(r[C.min]), coins: num(r[C.coins]), craftAcc: num(r[C.craft]), restarts: num(r[C.restarts]), last: iso(r[C.last]), lastDay: r[C.last] ? Utilities.formatDate(new Date(r[C.last]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '', card: !!printed[String(r[C.id])] })) };
  }
  if (a === 'getCode') return { ok: true, code: props().getProperty('SCHOOL_CODE') || '', selfMove: props().getProperty('SELF_MOVE') === '1', password: !!props().getProperty('ADMIN_KEY') && props().getProperty('PASSWORD_OFF') !== '1' };
  if (a === 'setPassword') {   // retire the old single teacher password (schools spec §11.8): only someone signed in by e-mail can turn it off, so nobody is locked out
    if (!b.on && !b.sess) return { ok: false, error: 'email' };
    if (!b.on && !sensitiveOK(b, who.email)) return { ok: false, error: 'confirm' };   // spec 07 §3: a sensitive change needs the e-mailed code
    props().setProperty('PASSWORD_OFF', b.on ? '0' : '1'); logIt(who.email, 'teacher password', b.on ? 'on' : 'off'); return { ok: true, password: !!b.on && !!props().getProperty('ADMIN_KEY') };
  }
  if (a === 'setSelfMove') { props().setProperty('SELF_MOVE', b.on ? '1' : '0'); logIt(who.email, 'students may move their wizard home', b.on ? 'on' : 'off'); return { ok: true, selfMove: !!b.on }; }
  if (a === 'setCode' && !sensitiveOK(b, who.email)) return { ok: false, error: 'confirm' };   // spec 07 §3: the school code needs the e-mailed code
  if (a === 'setCode') { const code = normCode(b.code); if (code.length < 4 || code.length > 20) return { ok: false, error: 'code' }; const reg = toRegistry({ action: 'schoolCode', code }); if (reg && !reg.ok) return { ok: false, error: reg.error === 'taken' ? 'taken' : 'registry' }; props().setProperty('SCHOOL_CODE', code); logIt(who.email, 'school code changed', ''); return { ok: true, code }; }
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (a === 'staffAdd') {
      const em = mailOf(b.email), role = b.role === 'owner' ? 'owner' : 'teacher', cls = b.classes === 'ALL' ? 'ALL' : String(b.classes || '').split(',').map(clsKey).filter(Boolean).slice(0, 30).join(',');
      if (!EMAIL_RE.test(em) || (!cls && role === 'teacher')) return { ok: false, error: 'bad' };
      if (role === 'owner') return { ok: false, error: 'one-owner' };   // spec 07 §4: exactly one owner per school (the account that runs this script)
      const st = staffSheet(), f = staffRows(true).find(s => s.email === em), rowVals = [em, role, cls, new Date().toISOString(), who.email, 'yes', f ? f.lastLogin : ''];
      if (f) st.getRange(f.row, 1, 1, 7).setValues([rowVals]); else st.appendRow(rowVals);
      logIt(who.email, f ? 'staff changed' : 'staff added', em + ' ' + role + ' ' + rowVals[2]); return { ok: true };
    }
    if (a === 'staffRemove') {   // their sessions end at once: every call checks the Staff tab again
      const em = mailOf(b.email), f = staffRows(true).find(s => s.email === em); if (!f || !f.active) return { ok: false, error: 'not found' };
      staffSheet().getRange(f.row, 6).setValue('no'); logIt(who.email, 'staff removed', em); return { ok: true };   // kept in the sheet (active "no"), so it can be undone and is in the log
    }
    if (a === 'cardsPrinted') {   // the login cards of these students were printed ("cards for new students only" leaves them out next time)
      const ids = (Array.isArray(b.ids) ? b.ids : []).map(cleanId).filter(Boolean).slice(0, 500), have = cardsPrinted(), cs = cardSheet(), now = new Date().toISOString();
      const add = ids.filter(x => !have[x] && rowOf(sh, x) && sees(sh.getRange(rowOf(sh, x), C.cls + 1).getValue())).map(x => [x, now, who.email]);
      if (add.length) cs.getRange(cs.getLastRow() + 1, 1, add.length, 3).setValues(add);
      return { ok: true, marked: add.length };
    }
    if (a === 'classAdd') { const cls = txt(b.cls, 20); if (!cls) return { ok: false, error: 'bad' }; ensureClass(cls); logIt(who.email, 'class created', cls); return { ok: true, classes: classNames() }; }
    if (a === 'classArchive') {   // the class leaves the "I am new" menu; its students stay
      const cs = classSheet(), n = cs.getLastRow(), k = clsKey(b.cls); if (n < 2) return { ok: false, error: 'not found' };
      const v = cs.getRange(2, 1, n - 1, 1).getValues(), i = v.findIndex(r => clsKey(r[0]) === k); if (i < 0) return { ok: false, error: 'not found' };
      cs.getRange(i + 2, 3).setValue(new Date().toISOString()); logIt(who.email, 'class archived', b.cls); return { ok: true, classes: classNames() };
    }
    if (a === 'approveMany' || a === 'rejectMany') {   // ticked waiting students; a teacher only in their classes; the name and class can be fixed before approving
      const items = (Array.isArray(b.items) ? b.items : []).slice(0, 200), known = classNames(); let done = 0, skipped = 0;
      for (const it of items) {
        const sid = cleanId(it && it.id), rw = sid ? rowOf(sh, sid) : 0; if (!rw) { skipped++; continue; }
        const r = sh.getRange(rw, 1, 1, HEAD.length).getValues()[0];
        if (!sees(r[C.cls]) || r[C.status] !== 'waiting') { skipped++; continue; }
        if (a === 'rejectMany') { sh.deleteRow(rw); if (!removedWhy(sid)) removedSheet().appendRow([sid, 'rejected', new Date().toISOString()]); logIt(who.email, 'rejected', sid); done++; continue; }
        const real = txt(it.real, 60) || r[C.real], want = txt(it.cls, 20), cls = want ? (known.find(c => clsKey(c) === clsKey(want)) || want) : r[C.cls];
        if (!sees(cls) || real.length < 2) { skipped++; continue; }
        sh.getRange(rw, C.real + 1, 1, 3).setValues([[real, cls, 'approved']]); ensureClass(cls); logIt(who.email, 'approved', sid + (cls !== r[C.cls] ? ' → ' + cls : '')); done++;
      }
      return { ok: true, done, skipped };
    }
    if (a === 'addClass') {
      const cls = txt(b.cls, 20), names = (b.names || []).map(x => txt(x, 60)).filter(x => x.length >= 2).slice(0, 60); if (!cls || !names.length) return { ok: false, error: 'bad' };
      if (!sees(cls)) return { ok: false, error: 'class' };
      ensureClass(cls);
      const made = names.map(real => { const nid = newId(sh), row = newRow(sh); sh.getRange(row, 1, 1, HEAD.length).setValues([[nid, '', real, cls, 'approved', new Date().toISOString(), 0, 0, 0, 0, 0, 0, 0, 0, 0, '']]); return { id: nid, real, cls }; });
      logIt(who.email, 'class added', cls + ': ' + made.length + ' students'); return { ok: true, made };
    }
    const row = id ? rowOf(sh, id) : 0, r = row ? sh.getRange(row, 1, 1, HEAD.length).getValues()[0] : null;
    if (r && !sees(r[C.cls])) return { ok: false, error: 'class' };   // checked here every time, not only by hiding buttons in the game
    if (a === 'moveHome') return moveHome(sh, row, r, id, b, who);
    if (a === 'undoMove') return undoMove(sh, row, r, id, who);
    if (a === 'student') { if (!row) return { ok: false, error: 'not found' }; return { ok: true, data: gameOnly(readData(sh, row) || '{}'), real: String(r[C.real]), cls: String(r[C.cls]), status: String(r[C.status]) }; }
    if (a === 'approve') { if (!row) return { ok: false, error: 'not found' }; sh.getRange(row, C.status + 1).setValue('approved'); logIt(who.email, 'approved', id); return { ok: true }; }
    if (a === 'reject' || a === 'deleteStudent') {   // rejected: the device moves the hero to offline play; deleted: the device forgets the hero
      if (!row && !owner) return { ok: false, error: 'not found' };
      if (row) sh.deleteRow(row); if (id && !removedWhy(id)) removedSheet().appendRow([id, a === 'reject' ? 'rejected' : 'deleted', new Date().toISOString()]); logIt(who.email, a === 'reject' ? 'rejected' : 'deleted', id); return { ok: true };
    }
    return { ok: false, error: 'action' };
  } finally { lock.releaseLock(); }
}

/* ----- the Admin's school list (registry): this school's script only ever sends it the school code, its own link and counts ----- */
const sameKey = (a, b) => !!a && !!b && String(a) === String(b);
function ping(b) {   // the Admin's list checks that this link belongs to the school owner it was told about
  if (over('ping', [10, 600])) return { ok: false, error: 'busy' };
  if (!sameKey(props().getProperty('SETUP_TOKEN'), b.setup)) return { ok: false, error: 'setup' };
  return { ok: true, owner: Session.getEffectiveUser().getEmail(), version: VERSION };
}
function stats(b) {   // counts only: never a name, a class, a number or game data
  if (over('stats', [20, 600])) return { ok: false, error: 'busy' };
  if (!sameKey(props().getProperty('REGISTRY_KEY'), b.key)) return { ok: false, error: 'key' };
  const sh = students(), n = sh.getLastRow(), rows = n < 2 ? [] : sh.getRange(2, 1, n - 1, HEAD.length).getValues();
  const tz = Session.getScriptTimeZone(), day = d => Utilities.formatDate(d, tz, 'yyyy-MM-dd'), today = day(new Date());
  let players = 0, played = 0, last = '';
  rows.forEach(r => {
    if (r[C.id] === '' || r[C.status] !== 'approved') return; players++;
    const t = r[C.last] instanceof Date ? r[C.last] : r[C.last] ? new Date(r[C.last]) : null; if (!t || isNaN(t)) return;
    if (day(t) === today) played++; const iso = t.toISOString(); if (iso > last) last = iso;
  });
  return { ok: true, players, today: played, last, version: VERSION };
}
function toRegistry(body) {   // null when this school is not on the Admin's list (then it works on its own, as before)
  const p = props(), url = p.getProperty('REGISTRY_URL'), id = p.getProperty('REGISTRY_ID'), key = p.getProperty('REGISTRY_KEY');
  if (!url || !id || !key) return null;
  try { return JSON.parse(UrlFetchApp.fetch(url, { method: 'post', contentType: 'text/plain', payload: JSON.stringify(Object.assign({ id, key }, body)), muteHttpExceptions: true, followRedirects: true }).getContentText()); }
  catch (x) { return { ok: false, error: 'registry' }; }
}
function linkRegistry() {   // run once from the editor, after setting the script properties REGISTRY_URL and SETUP_TOKEN (the Admin gives both)
  const p = props(), reg = p.getProperty('REGISTRY_URL'), setup = p.getProperty('SETUP_TOKEN'), code = p.getProperty('SCHOOL_CODE');
  if (!reg || !setup) throw new Error('Set the script properties REGISTRY_URL and SETUP_TOKEN first.');
  if (!code) throw new Error('Set the script property SCHOOL_CODE first.');
  let url = p.getProperty('WEB_APP_URL') || ''; if (!url) { try { url = ScriptApp.getService().getUrl() || ''; } catch (x) {} }
  url = normUrl(url);
  if (!/\/exec$/.test(url)) throw new Error('Deploy the web app first, then add its link (ending in /exec) as the script property WEB_APP_URL.');
  const j = JSON.parse(UrlFetchApp.fetch(reg, { method: 'post', contentType: 'text/plain', payload: JSON.stringify({ action: 'registerSchool', setup, url, code: normCode(code), version: VERSION }), muteHttpExceptions: true, followRedirects: true }).getContentText());
  if (!j.ok) throw new Error('The Admin\'s list said: ' + j.error + ({ setup: ' (the setup token is wrong or already used)', owner: ' (this script is not in the school owner\'s Google account the Admin entered)', taken: ' (another school has this code: change SCHOOL_CODE)', url: ' (WEB_APP_URL must end in /exec)', ping: ' (the list could not reach this web app: deploy it with access Anyone)' }[j.error] || ''));
  p.setProperty('REGISTRY_ID', j.id); p.setProperty('REGISTRY_KEY', j.key); p.setProperty('SCHOOL_NAME', j.name); p.deleteProperty('SETUP_TOKEN');
  Logger.log('Joined the Admin\'s list as ' + j.id + ' (' + j.name + ').');
}

/* ----- staff: the school owner and teachers sign in with an e-mail code (schools spec §3.4). The old teacher password (ADMIN_KEY) still works as the school owner. ----- */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const mailOf = s => String(s || '').trim().toLowerCase().slice(0, 80);
const clsKey = s => String(s || '').trim().toUpperCase().replace(/\s+/g, '');
const SESSION = 21600;   // 6 hours (the longest the cache keeps anything)
function ownerEmail() { try { return mailOf(Session.getEffectiveUser().getEmail()); } catch (x) { return ''; } }   // the Google account that runs this script owns the school
const staffSheet = () => sheet('Staff', ['email', 'role (owner/teacher)', 'classes (comma list or ALL)', 'added', 'added by', 'active (yes/no)', 'last login']);   // spec 07 §4: removing = active "no", never a hard delete
function staffRows(all) {   // the active staff (all = also the removed ones, for the owner's list)
  const sh = staffSheet(), n = sh.getLastRow(); if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, 7).getValues().map((r, i) => ({ row: i + 2, email: mailOf(r[0]), role: r[1] === 'owner' ? 'owner' : 'teacher', classes: String(r[2]).trim().toUpperCase() === 'ALL' ? 'ALL' : String(r[2]).split(',').map(clsKey).filter(Boolean), added: String(r[3] || ''), active: String(r[5] || 'yes').trim().toLowerCase() !== 'no', lastLogin: String(r[6] || '') })).filter(s => s.email && (all || s.active));
}
function touchStaff(em) { try { const s = staffRows(true).find(x => x.email === em); if (s) staffSheet().getRange(s.row, 7).setValue(new Date().toISOString().slice(0, 10)); } catch (x) {} }
function staffOf(em) {   // { email, role, classes } or null
  em = mailOf(em); if (!em) return null;
  if (em === ownerEmail()) return { email: em, role: 'owner', classes: 'ALL' };
  const s = staffRows().find(x => x.email === em); return s ? { email: s.email, role: s.role, classes: s.role === 'owner' ? 'ALL' : s.classes } : null;
}
const logSheet = () => sheet('Log', ['when', 'who', 'what', 'detail']);
function logIt(who, what, detail) { try { logSheet().appendRow([new Date().toISOString(), who, what, String(detail || '').slice(0, 200)]); } catch (x) {} }
const sig = s => Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(String(s), token()));
function staffAuth(b) {   // a staff session (e-mail code) or the old teacher password
  const c = CacheService.getScriptCache();
  if (b.sess) {
    const em = c.get('sess:' + sig(b.sess)); if (!em) return { error: 'login' };
    const s = staffOf(em); if (!s) { c.remove('sess:' + sig(b.sess)); return { error: 'login' }; }   // removed from the Staff tab: the session ends at once
    return s;
  }
  if (props().getProperty('PASSWORD_OFF') === '1') return { error: 'nopass' };   // this school signs in by e-mail only
  const tries = num(c.get('adminWrong')); if (tries >= LIMIT.adminTries[0]) return { error: 'locked' };
  const real = props().getProperty('ADMIN_KEY');
  if (!real || String(b.key || '') !== real) { c.put('adminWrong', String(tries + 1), LIMIT.adminTries[1]); return { error: 'wrong' }; }
  c.remove('adminWrong'); return { email: 'teacher password', role: 'owner', classes: 'ALL' };
}
function staffCode(b) {   // the same answer for every e-mail, so nobody can find out who is staff
  const em = mailOf(b.email);
  if (over('staffAll', [30, 60])) return { ok: false, error: 'busy' };
  if (!EMAIL_RE.test(em) || over('staff:' + sig(em), [5, 3600]) || !staffOf(em)) return { ok: true };
  const code = String(100000 + Math.floor(Math.random() * 900000));
  CacheService.getScriptCache().put('scode:' + sig(em), sig(code + ':' + em) + '|0', 600);
  const name = props().getProperty('SCHOOL_NAME') || 'your school';
  try { MailApp.sendEmail({ to: em, subject: 'SpellQuest Math teacher code: ' + code, name: 'SpellQuest Math', body: 'Your code for the teacher area of ' + name + ' is: ' + code + '\n\nIt works for 10 minutes, once. If you did not ask for it, you can ignore this e-mail.\n\nהקוד שלכם לאזור המורה: ' + code + '\nהקוד עובד 10 דקות, פעם אחת.' }); }
  catch (x) { return { ok: false, error: 'mail' }; }
  return { ok: true };
}
function staffVerify(b) {
  const em = mailOf(b.email), code = String(b.code || '').trim(), c = CacheService.getScriptCache(), k = 'scode:' + sig(em);
  if (over('staffAll', [30, 60])) return { ok: false, error: 'busy' };
  const rec = c.get(k); if (!rec) return { ok: false, error: 'expired' };
  const parts = rec.split('|'), tries = num(parts[1]);
  if (tries >= 5) { c.remove(k); return { ok: false, error: 'locked' }; }
  if (!/^\d{6}$/.test(code) || sig(code + ':' + em) !== parts[0]) { c.put(k, parts[0] + '|' + (tries + 1), 600); return { ok: false, error: 'wrong' }; }
  c.remove(k); const s = staffOf(em); if (!s) return { ok: false, error: 'wrong' };
  const sess = Utilities.getUuid() + Utilities.getUuid(); c.put('sess:' + sig(sess), em, SESSION);
  logIt(em, 'signed in', s.role); touchStaff(em); return { ok: true, sess, email: em, role: s.role };
}
/* ----- sensitive changes (spec 07 §3, decided by the owner): changing the school code or turning the teacher password off asks for a
   6-digit code, sent by e-mail to the owner's own address (10 minutes, once, 5 tries). ----- */
function sensitiveCode(b) {
  const who = staffAuth(b); if (who.error || who.role !== 'owner' || !who.email || who.email === 'teacher password') return { ok: false, error: 'owner' };
  if (over('sens:' + sig(who.email), [5, 3600])) return { ok: false, error: 'busy' };
  const code = String(100000 + Math.floor(Math.random() * 900000));
  CacheService.getScriptCache().put('sens:' + sig(who.email), sig(code + ':s:' + who.email) + '|0', 600);
  try { MailApp.sendEmail({ to: who.email, name: 'SpellQuest Math', subject: 'SpellQuest: confirm a sensitive change: ' + code, body: 'Your code is ' + code + '. It works for 10 minutes, once.\n\nSomeone asked to change the school code or to turn off the teacher password. If that was not you, ignore this e-mail.' }); }
  catch (x) { return { ok: false, error: 'mail' }; }
  logIt(who.email, 'confirmation code sent', 'sensitive change'); return { ok: true };
}
function sensitiveOK(b, email) {
  const c = CacheService.getScriptCache(), k = 'sens:' + sig(email), rec = c.get(k); if (!rec) return false;
  const parts = rec.split('|'), tries = num(parts[1]); if (tries >= 5) { c.remove(k); return false; }
  if (sig(String(b.confirm || '').trim() + ':s:' + email) !== parts[0]) { c.put(k, parts[0] + '|' + (tries + 1), 600); return false; }
  c.remove(k); return true;
}
function signOut(b) { if (b.sess) { const em = CacheService.getScriptCache().get('sess:' + sig(b.sess)); CacheService.getScriptCache().remove('sess:' + sig(b.sess)); if (em) logIt(em, 'signed out', ''); } return { ok: true }; }
function auditRows(limit) {   // the Log tab, newest first: who did what, when (spec 07 §6: owner sees its own school's log)
  const sh = logSheet(), n = sh.getLastRow(); if (n < 2) return [];
  const from = Math.max(2, n - limit + 1), v = sh.getRange(from, 1, n - from + 1, 4).getValues();
  return v.map(r => ({ when: String(r[0]), who: String(r[1]), what: String(r[2]), detail: String(r[3]) })).reverse();
}
function authorize() { MailApp.getRemainingDailyQuota(); staffSheet(); logSheet(); }   // run once from the editor after this update: e-mail permission and the new tabs

/* ----- classes (schools spec §4): the Classes tab gives the "I am new" class menu. A class is made by adding a class list or by the school owner. ----- */
const classSheet = () => sheet('Classes', ['class', 'created', 'archived']);
function classNames() {   // the school's classes, not archived; the first time, the classes the students already have
  const cs = classSheet(); let n = cs.getLastRow();
  if (n < 2 && !props().getProperty('CLASSES_SEEDED')) {
    props().setProperty('CLASSES_SEEDED', '1');
    const sh = students(), m = sh.getLastRow(), seen = {};
    if (m > 1) sh.getRange(2, C.cls + 1, m - 1, 1).getValues().forEach(r => { const c = txt(r[0], 20); if (c && !seen[clsKey(c)]) { seen[clsKey(c)] = 1; cs.appendRow([c, new Date().toISOString(), '']); } });
    n = cs.getLastRow();
  }
  if (n < 2) return [];
  return cs.getRange(2, 1, n - 1, 3).getValues().filter(r => r[0] !== '' && !r[2]).map(r => String(r[0])).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
function ensureClass(cls) {   // adds the class (or brings an archived one back)
  const cs = classSheet(), n = cs.getLastRow(), k = clsKey(cls);
  if (n > 1) { const v = cs.getRange(2, 1, n - 1, 3).getValues(), i = v.findIndex(r => clsKey(r[0]) === k); if (i >= 0) { if (v[i][2]) cs.getRange(i + 2, 3).setValue(''); return; } }
  cs.appendRow([cls, new Date().toISOString(), '']);
}
const cardSheet = () => sheet('Cards', ['id', 'card printed', 'by']);
function cardsPrinted() { const cs = cardSheet(), n = cs.getLastRow(), o = {}; if (n > 1) cs.getRange(2, 1, n - 1, 1).getValues().forEach(r => { o[String(r[0])] = 1; }); return o; }

/* ----- move to home (schools spec §6.4): the school gives the hero to the family. A hand-over file (the game's backup file: an offline hero
   on any device, which the family can sign up to play at home) is downloaded or e-mailed to a parent; the student's row becomes "moved".
   For 30 days the school owner can undo it (the name, class and progress are kept in the Moved tab and the row); then they are cleared, and
   only the number and the date stay, so the number is never used again. ----- */
const MOVED_DAYS = 30;
const movedSheet = () => sheet('Moved', ['id', 'moved', 'by', 'real name', 'class', 'cleared']);
const fnv = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };   // the same check as the game's backup file
function handOver(sh, row, r) {   // the game's backup file format (index.html saveHeroFile), as an offline hero
  let p = {}; try { p = JSON.parse(gameOnly(readData(sh, row)) || '{}'); } catch (x) {}
  if (!p.id) return '';   // a login card that was never used: nothing to hand over
  p.id = 'local-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8); p.mode = 'off'; p.local = true; delete p.real; delete p.cls;
  const prof = JSON.stringify(p);
  return JSON.stringify({ game: 'math', app: 'SpellQuest: Math Adventure', v: p.v || 1, saved: new Date().toISOString(), sum: fnv(prof), profile: prof, movedFrom: props().getProperty('SCHOOL_NAME') || '' });
}
function markMoved(sh, row, r, id, by) {
  movedSheet().appendRow([id, new Date().toISOString(), by, String(r[C.real]), String(r[C.cls]), '']);
  sh.getRange(row, C.status + 1).setValue('moved');
}
function moveHome(sh, row, r, id, b, who) {
  if (!row) return { ok: false, error: 'not found' };
  if (!['approved', 'waiting'].includes(String(r[C.status]))) return { ok: false, error: 'status' };
  const file = handOver(sh, row, r), em = mailOf(b.email);
  if (em) {
    if (!EMAIL_RE.test(em)) return { ok: false, error: 'email' };
    if (!file) return { ok: false, error: 'nohero' };
    const school = props().getProperty('SCHOOL_NAME') || 'the school', nick = String(r[C.nick] || 'the wizard');
    try {
      MailApp.sendEmail({ to: em, name: 'SpellQuest Math', subject: 'SpellQuest: Math Adventure: ' + nick + ' can keep playing at home',
        body: school + ' moved ' + nick + ' to play at home. The attached file is the wizard with all of its progress.\n\nOn the device the child will play on: open the game → "Load a hero" (at the bottom of the start screen) → choose this file. Then tap the 📴 badge next to the name → "Sign up to play at home" (a parent\'s e-mail).\n\n' +
          'בית הספר העביר את ' + nick + ' למשחק בבית. הקובץ המצורף הוא הקוסם עם כל ההתקדמות שלו. במכשיר של הילד: פותחים את המשחק ← "טעינת גיבור" ← בוחרים את הקובץ.\n\nWe do not keep this e-mail address. / איננו שומרים את כתובת המייל.',
        attachments: [Utilities.newBlob(file, 'application/json', 'SpellQuest-' + nick.replace(/[^\w֐-׿-]+/g, '_') + '.json')] });
    } catch (x) { return { ok: false, error: 'mail' }; }
  }
  markMoved(sh, row, r, id, who.email); logIt(who.email, 'moved to home', id + (em ? ' (file e-mailed to a parent)' : ' (hand-over file)'));
  return { ok: true, file, mailed: !!em };
}
function undoMove(sh, row, r, id, who) {
  if (!row || r[C.status] !== 'moved') return { ok: false, error: 'not found' };
  const ms = movedSheet(), n = ms.getLastRow(), v = n > 1 ? ms.getRange(2, 1, n - 1, 6).getValues() : [];
  let i = -1; for (let k = v.length - 1; k >= 0; k--) if (String(v[k][0]) === id) { i = k; break; }
  if (i < 0 || v[i][5]) return { ok: false, error: 'too late' };   // after 30 days the name and progress are gone
  sh.getRange(row, C.real + 1, 1, 3).setValues([[v[i][3], v[i][4], 'approved']]); ms.deleteRow(i + 2);
  logIt(who.email, 'move to home undone', id); return { ok: true };
}
function purgeMoved(sh) {   // after 30 days: keep only the number and the date
  const ms = movedSheet(), n = ms.getLastRow(); if (n < 2) return;
  const v = ms.getRange(2, 1, n - 1, 6).getValues(), old = Date.now() - MOVED_DAYS * 864e5;
  v.forEach((m, k) => {
    if (m[5] || new Date(m[1]).getTime() > old) return;
    const row = rowOf(sh, String(m[0]));
    if (row) { sh.getRange(row, C.nick + 1, 1, 3).setValues([['', '', '']]); sh.getRange(row, C.mlvl + 1, 1, HEAD.length - C.mlvl).setValue(''); sh.getRange(row, DATA_COL, 1, MAX_CHUNKS).setValue(''); }
    ms.getRange(k + 2, 4, 1, 3).setValues([['', '', new Date().toISOString()]]);
  });
}
function selfMove(b) {   // the student moves their own wizard home: when the school owner allows it, or when the school's access has ended (the device does the rest)
  const id = cleanId(b.id); if (!id) return { ok: false, error: 'id' };
  const sh = students(), row = rowOf(sh, id); if (!row) return { ok: false, error: 'unknown' };
  const r = sh.getRange(row, 1, 1, HEAD.length).getValues()[0]; if (r[C.status] === 'moved') return { ok: true };
  let allowed = props().getProperty('SELF_MOVE') === '1';
  if (!allowed) { const reg = toRegistry({ action: 'status' }); allowed = !!(reg && reg.status === 'suspended'); }
  if (!allowed) return { ok: false, error: 'not allowed' };
  markMoved(sh, row, r, id, 'the student'); logIt('the student', 'moved to home', id); return { ok: true };
}
function setupSchool() {   // a new school: run once from the editor (after the script property SCHOOL_CODE). Makes the school's sheet and its tabs, and asks for the permissions.
  if (!props().getProperty('SCHOOL_CODE')) throw new Error('First add the script property SCHOOL_CODE (the code students type, for example SUNNY-7).');
  MailApp.getRemainingDailyQuota(); UrlFetchApp.getRequest('https://script.google.com');
  students(); staffSheet(); logSheet(); classSheet(); removedSheet();
  const first = book().getSheetByName('Sheet1'); if (first && book().getSheets().length > 1 && first.getLastRow() === 0) book().deleteSheet(first);
  Logger.log('The school sheet: ' + book().getUrl() + '\nThe school owner (signs in to the teacher area): ' + ownerEmail() + '\nNext: Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).');
}

/* ----- the school kit (one link from the Admin): the school owner makes a copy of the kit sheet, then 🧙 SpellQuest → Set up my school
   does the rest: the settings (from the Setup tab), the sheet's tabs, the web app (through the Apps Script API), and joining the Admin's list. ----- */
const KIT_TAB = 'Setup', KIT_KEYS = ['SCHOOL_NAME', 'SCHOOL_CODE', 'REGISTRY_URL', 'SETUP_TOKEN'];
function onOpen() {
  try { SpreadsheetApp.getUi().createMenu('🧙 SpellQuest').addItem('Set up my school', 'setupKit').addItem('Show my school\'s links', 'kitInfo').addToUi(); } catch (x) {}
}
function kitSheet() { const ss = SpreadsheetApp.getActiveSpreadsheet(); return ss ? ss.getSheetByName(KIT_TAB) : null; }
function kitValues() {   // the Setup tab: a key in column A, its value in column B
  const sh = kitSheet(), o = {}; if (!sh || !sh.getLastRow()) return o;
  sh.getRange(1, 1, sh.getLastRow(), 2).getValues().forEach(r => { const k = String(r[0]).trim(); if (KIT_KEYS.includes(k)) o[k] = String(r[1]).trim(); });
  return o;
}
function kitSet(key, value) { const sh = kitSheet(); if (!sh) return; const v = sh.getRange(1, 1, sh.getLastRow(), 1).getValues(); for (let i = 0; i < v.length; i++) if (String(v[i][0]).trim() === key) { sh.getRange(i + 1, 2).setValue(value); return; } }
function setupKit() {
  const ui = SpreadsheetApp.getUi(), p = props(), v = kitValues();
  if (p.getProperty('REGISTRY_ID')) { kitInfo(); return; }   // already done
  KIT_KEYS.forEach(k => { if (v[k] && v[k] !== '(used)') p.setProperty(k, v[k]); });
  if (!p.getProperty('SCHOOL_CODE') || !p.getProperty('REGISTRY_URL') || !p.getProperty('SETUP_TOKEN')) { ui.alert('SpellQuest', 'This sheet has no setup values. Ask the Admin for your school\'s kit link, and make a copy of that one.', ui.ButtonSet.OK); return; }
  const ss = SpreadsheetApp.getActiveSpreadsheet(); ss.rename('SpellQuest Math – ' + (p.getProperty('SCHOOL_NAME') || 'school') + ' (students)');
  setupSchool();   // the sheet's tabs and the permissions
  let url = normUrl(p.getProperty('WEB_APP_URL') || '');
  if (url && !webAppWorks(url)) url = '';   // a link that does not answer (not deployed yet, or not for "Anyone")
  if (!url) { try { const u = normUrl(ScriptApp.getService().getUrl() || ''); if (/\/exec$/.test(u) && webAppWorks(u)) url = u; } catch (x) {} }   // the web app, once the school owner deployed it
  if (!url) {   // Google lets only the account owner deploy a web app: one short step, then this menu again
    const r = ui.prompt('SpellQuest: last step (2 minutes)',
      'Your school sheet is ready. The game now needs your school\'s web app link. In this same window:\n\n' +
      '1. Menu Extensions → Apps Script. A new tab opens.\n' +
      '2. In that tab: blue button Deploy → New deployment → ⚙️ (next to "Select type") → Web app.\n' +
      '3. Execute as: Me. Who has access: Anyone. → Deploy → Authorize access → your account → Allow.\n' +
      '4. Click Copy under "Web app URL". Come back to this tab and paste it here → OK.\n' +
      '(Already deployed? In the Apps Script tab: Deploy → Manage deployments → Copy.)\n\n' +
      'עוד צעד אחד: תפריט Extensions ← Apps Script. בלשונית שנפתחת: Deploy ← New deployment ← ⚙️ ← Web app. ' +
      'Execute as: Me, Who has access: Anyone ← Deploy ← Allow. מעתיקים את ה-Web app URL, חוזרים ללשונית הזו ומדביקים כאן ← OK.', ui.ButtonSet.OK_CANCEL);
    const pasted = normUrl(r.getSelectedButton() === ui.Button.OK ? r.getResponseText().trim() : '');
    if (!/^https:\/\/script\.google\.com\/.*\/exec$/.test(pasted)) { if (pasted) ui.alert('SpellQuest', 'That is not the Web app URL (it starts with https://script.google.com and ends with /exec). Choose 🧙 SpellQuest → Set up my school again.', ui.ButtonSet.OK); return; }
    if (!webAppWorks(pasted)) { ui.alert('SpellQuest', 'That link does not answer yet. In the deployment, "Who has access" must be Anyone (Deploy → Manage deployments → ✏️). Then choose 🧙 SpellQuest → Set up my school again.', ui.ButtonSet.OK); return; }
    url = pasted;
  }
  p.setProperty('WEB_APP_URL', url);
  try { linkRegistry(); } catch (e) { ui.alert('SpellQuest: almost done', e.message + '\n\nFix it, then 🧙 SpellQuest → Set up my school again.', ui.ButtonSet.OK); return; }
  kitSet('SETUP_TOKEN', '(used)');
  kitInfo();
}
function kitInfo() {
  const ui = SpreadsheetApp.getUi(), p = props();
  if (!p.getProperty('REGISTRY_ID')) { ui.alert('SpellQuest', 'Not set up yet: 🧙 SpellQuest → Set up my school.', ui.ButtonSet.OK); return; }
  ui.alert('✅ ' + (p.getProperty('SCHOOL_NAME') || 'Your school') + ' is ready',
    'School code (students type it once on each device): ' + p.getProperty('SCHOOL_CODE') + '\n\nThe game: https://eldar1234334.github.io/learning-math/\n\nNext: open the game → 🔧 Teacher area → the school code → your e-mail (' + ownerEmail() + ') → the code from your inbox. There you add teachers and classes.\n\nThis sheet keeps your school\'s data. Keep it in this Google account; only you can open it.', ui.ButtonSet.OK);
}
// A Google Workspace account writes its web app links as …/a/macros/<school domain>/s/<id>/exec; the same web app answers at …/macros/s/<id>/exec.
const normUrl = u => String(u || '').trim().replace(/^https:\/\/script\.google\.com\/a\/macros\/[^/]+\/s\//, 'https://script.google.com/macros/s/');
function webAppWorks(u) {   // does the link answer as this school's web app (deployed, for "Anyone")?
  try { const r = UrlFetchApp.fetch(u, { muteHttpExceptions: true, followRedirects: true }); return r.getResponseCode() === 200 && /SpellQuest Math progress/.test(r.getContentText()); } catch (x) { return false; }
}

/* ----- Sign in with Google (spec 07, G1): an extra option next to the e-mail code. Google proves the e-mail is real (the ID token is checked
   with Google's token service: our client, the Google issuer, a verified e-mail, not expired). The staff list still decides access, on every
   request, exactly as for the e-mail code. A Google account that is not on the staff list gets the same answer as a wrong e-mail. ----- */
const GOOGLE_CLIENT_ID = '640886464751-p6vril25pp5g5ijqprcs9o44039let2u.apps.googleusercontent.com';   // public (it appears in the page); the secret is never used here
function googleSignIn(b) {
  if (over('google', [30, 600])) return { ok: false, error: 'busy' };
  const cred = String(b.credential || ''); if (!cred || cred.length > 4000) return { ok: false, error: 'google' };
  let info = {};
  try { info = JSON.parse(UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(cred), { muteHttpExceptions: true }).getContentText() || '{}'); } catch (x) { return { ok: false, error: 'google' }; }
  const verified = info.email_verified === true || info.email_verified === 'true';
  if (info.aud !== GOOGLE_CLIENT_ID || !/^(https:\/\/)?accounts\.google\.com$/.test(String(info.iss || '')) || !verified || Number(info.exp) * 1000 < Date.now()) return { ok: false, error: 'google' };
  const em = mailOf(info.email), s = staffOf(em); if (over('g:' + sig(em), [10, 600])) return { ok: false, error: 'busy' };   // per account: a few tries a minute
  if (!s) return { ok: true, staff: false };   // the same answer as a wrong e-mail: nobody learns who is staff
  const sess = Utilities.getUuid() + Utilities.getUuid(); CacheService.getScriptCache().put('sess:' + sig(sess), em, SESSION);
  logIt(em, 'signed in with Google', s.role); touchStaff(em);
  return { ok: true, staff: true, sess, email: em, role: s.role };
}
