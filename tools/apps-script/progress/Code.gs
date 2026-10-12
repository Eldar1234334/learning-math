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
   A device with the school token: { action: 'classes', token } → { ok, classes: [ ... ] }   class names only
   - { action: 'list', key }                            → { ok, students: [ { id, nick, real, cls, status, joined, tier, wiz, xp, accuracy, answers, minutes, coins, craftAcc, restarts, last } ] }
   - { action: 'student', key, id }                     → { ok, data, real, cls, status }
   - { action: 'approve' | 'reject' | 'deleteStudent', key, id } → { ok }
   - { action: 'addClass', key, cls, names: [...] }     → { ok, made: [ { id, real, cls } ] }   a class list: numbers for the login cards
   - { action: 'getCode' | 'setCode', key, code }       → { ok, code }   a new code is first checked with the Admin's school list (it must be free)
   The Admin's school list (registry, schools spec §3.3, §3.5; it never gets names, classes or game data):
   - { action: 'ping', setup }                          → { ok, owner, version }   only with this school's one-time setup token
   - { action: 'stats', key }                           → { ok, players, today, last, version }   counts only; the key both sides got at registration
   Run linkRegistry() once from the editor (after the script properties REGISTRY_URL and SETUP_TOKEN are set) to join the Admin's list.

   Script properties (Project settings → Script properties): ADMIN_KEY (the teacher password), SCHOOL_CODE (for example SUNNY-7), and SHEET_ID
   (the sheet's id from its link) when the script is a separate project rather than opened with Extensions → Apps Script.
   SCHOOL_TOKEN is made by the script itself. REGISTRY_ID and REGISTRY_KEY are written by linkRegistry().
   WEB_APP_URL (optional): this script's web app link, if linkRegistry() cannot find it by itself.
*/
const VERSION = 4;   // shown to the Admin, so outdated schools can be seen
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
  const id = props().getProperty('SHEET_ID'), ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet(); let sh = ss.getSheetByName(name);   // SHEET_ID: when the script is its own project (not opened from the sheet)
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
  if (a === 'staffCode') return out(staffCode(b));
  if (a === 'staffVerify') return out(staffVerify(b));
  if (['me', 'list', 'student', 'approve', 'reject', 'deleteStudent', 'addClass', 'getCode', 'setCode', 'staffList', 'staffAdd', 'staffRemove', 'approveMany', 'rejectMany', 'classAdd', 'classArchive'].includes(a)) return out(admin(a, b));
  if (String(b.token || '') !== token()) return out({ ok: false, error: 'school' });   // only devices set up with the school code
  if (a === 'load') return out(load(b));
  if (a === 'classes') return out({ ok: true, classes: classNames() });   // for the "I am new" class menu (class names only)
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
  const id = cleanId(b.id), real = txt(b.real, 60), typed = txt(b.cls, 20); if (!id || real.length < 3 || !typed) return { ok: false, error: 'bad' };
  const known = classNames(), cls = known.find(c => clsKey(c) === clsKey(typed)) || typed; if (known.length && cls === typed && !known.includes(typed)) return { ok: false, error: 'class' };   // a class from the school's list
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
  const who = staffAuth(b); if (who.error) return { ok: false, error: who.error };
  const owner = who.role === 'owner', sees = cls => owner || who.classes === 'ALL' || who.classes.includes(clsKey(cls));   // a teacher sees only the classes they were given
  if (['staffList', 'staffAdd', 'staffRemove', 'setCode', 'classAdd', 'classArchive'].includes(a) && !owner) return { ok: false, error: 'owner' };
  if (a === 'me') return { ok: true, email: who.email, role: who.role, classes: who.classes };
  if (a === 'staffList') return { ok: true, staff: staffRows().map(s => ({ email: s.email, role: s.role, classes: s.classes, added: s.added })), owner: ownerEmail() };
  const sh = students(), id = cleanId(b.id);
  if (a === 'list') {
    const n = sh.getLastRow(), rows = n < 2 ? [] : sh.getRange(2, 1, n - 1, HEAD.length).getValues();
    const iso = v => v instanceof Date ? v.toISOString() : String(v || '');
    return { ok: true, me: { email: who.email, role: who.role }, classes: classNames().filter(sees), students: rows.filter(r => r[C.id] !== '' && sees(r[C.cls])).map(r => ({ id: String(r[C.id]), nick: String(r[C.nick]), real: String(r[C.real]), cls: String(r[C.cls]), status: String(r[C.status]), joined: iso(r[C.joined]),
      tier: num(r[C.mlvl]), wiz: num(r[C.wiz]), xp: num(r[C.xp]), answers: num(r[C.n]), accuracy: num(r[C.acc]), minutes: num(r[C.min]), coins: num(r[C.coins]), craftAcc: num(r[C.craft]), restarts: num(r[C.restarts]), last: iso(r[C.last]) })) };
  }
  if (a === 'getCode') return { ok: true, code: props().getProperty('SCHOOL_CODE') || '' };
  if (a === 'setCode') { const code = normCode(b.code); if (code.length < 4 || code.length > 20) return { ok: false, error: 'code' }; const reg = toRegistry({ action: 'schoolCode', code }); if (reg && !reg.ok) return { ok: false, error: reg.error === 'taken' ? 'taken' : 'registry' }; props().setProperty('SCHOOL_CODE', code); logIt(who.email, 'school code changed', ''); return { ok: true, code }; }
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (a === 'staffAdd') {
      const em = mailOf(b.email), role = b.role === 'owner' ? 'owner' : 'teacher', cls = b.classes === 'ALL' ? 'ALL' : String(b.classes || '').split(',').map(clsKey).filter(Boolean).slice(0, 30).join(',');
      if (!EMAIL_RE.test(em) || (!cls && role === 'teacher')) return { ok: false, error: 'bad' };
      const st = staffSheet(), f = staffRows().find(s => s.email === em), rowVals = [em, role, role === 'owner' ? 'ALL' : cls, new Date().toISOString(), who.email];
      if (f) st.getRange(f.row, 1, 1, 5).setValues([rowVals]); else st.appendRow(rowVals);
      logIt(who.email, f ? 'staff changed' : 'staff added', em + ' ' + role + ' ' + rowVals[2]); return { ok: true };
    }
    if (a === 'staffRemove') {   // their sessions end at once: every call checks the Staff tab again
      const em = mailOf(b.email), f = staffRows().find(s => s.email === em); if (!f) return { ok: false, error: 'not found' };
      staffSheet().deleteRow(f.row); logIt(who.email, 'staff removed', em); return { ok: true };
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
const staffSheet = () => sheet('Staff', ['email', 'role (owner/teacher)', 'classes (comma list or ALL)', 'added', 'added by']);
function staffRows() {
  const sh = staffSheet(), n = sh.getLastRow(); if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, 5).getValues().map((r, i) => ({ row: i + 2, email: mailOf(r[0]), role: r[1] === 'owner' ? 'owner' : 'teacher', classes: String(r[2]).trim().toUpperCase() === 'ALL' ? 'ALL' : String(r[2]).split(',').map(clsKey).filter(Boolean), added: String(r[3] || '') })).filter(s => s.email);
}
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
  logIt(em, 'signed in', s.role); return { ok: true, sess, email: em, role: s.role };
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
