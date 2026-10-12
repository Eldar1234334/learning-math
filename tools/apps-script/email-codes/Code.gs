/* Math Wizard: the installed app's e-mail code service (step 11). Its OWN Apps Script project, separate from the reading game's (owner decision, HANDOFF §8a).
   The app keeps no names and no e-mails: a student signs in with an e-mail address, gets a 6-digit code, and the game data stays on the device.
   This service only sends the code, checks it, and counts verified users (by a one-way hash of the address, never the address itself).

   What the app sends (index.html: appPost, adminAppUsers):
   - POST { action: 'appCode', email }        → { ok } · { ok: false, error: 'email' | 'wait' | 'busy' | 'mail' }
   - POST { action: 'appVerify', email, code } → { ok } · { ok: false, error: 'wrong' | 'expired' | 'locked' }
   - POST { action: 'appStats', key }         → { ok, total, week, day }   (the teacher area; key = the script property ADMIN_KEY)
   Limits: one code a minute per address, codes live 10 minutes, 5 wrong tries lock the address for 10 minutes, and at most DAY_MAX e-mails a day
   (a free Google account may send about 100 e-mails a day).
   Storage: a sheet "App users" in this script's own spreadsheet (made on first use): the hash of each verified address and the date it was first verified.
*/
const CODE_TTL = 600, RESEND = 60, TRIES = 5, DAY_MAX = 90;
const SHEET = 'App users';
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
const cache = () => CacheService.getScriptCache();
const hash = s => Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'math-wizard:' + s).map(b => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');
const okEmail = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && e.length <= 120;
function users() {
  const props = PropertiesService.getScriptProperties(); let id = props.getProperty('SHEET_ID'), ss = null;
  if (id) try { ss = SpreadsheetApp.openById(id); } catch (x) { ss = null; }
  if (!ss) { ss = SpreadsheetApp.create('Math Wizard – app users'); props.setProperty('SHEET_ID', ss.getId()); }
  let sh = ss.getSheetByName(SHEET); if (!sh) { sh = ss.getSheets()[0]; sh.setName(SHEET); sh.clear(); sh.appendRow(['address hash', 'first verified']); sh.setFrozenRows(1); }
  return sh;
}

function doGet() { return out({ ok: true, app: 'Math Wizard e-mail codes' }); }
function doPost(e) {
  let b; try { b = JSON.parse(e.postData.contents); } catch (x) { return out({ ok: false, error: 'json' }); }
  const email = String(b.email || '').trim().toLowerCase();
  if (b.action === 'appCode') return out(sendCode(email));
  if (b.action === 'appVerify') return out(verify(email, String(b.code || '').trim()));
  if (b.action === 'appStats') return out(stats(String(b.key || '')));
  return out({ ok: false, error: 'action' });
}
function sendCode(email) {
  if (!okEmail(email)) return { ok: false, error: 'email' };
  const c = cache(), h = hash(email);
  if (c.get('sent:' + h)) return { ok: false, error: 'wait' };
  const day = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd'), props = PropertiesService.getScriptProperties(), dk = 'mails:' + day, sent = Number(props.getProperty(dk) || 0);
  if (sent >= DAY_MAX || MailApp.getRemainingDailyQuota() < 1) return { ok: false, error: 'busy' };
  const code = String(Math.floor(100000 + Math.random() * 900000));
  try {
    MailApp.sendEmail({ to: email, subject: 'SpellQuest: your code / הקוד שלכם',
      body: `Your SpellQuest: Math Adventure code is ${code}\nIt works for 10 minutes.\n\nהקוד שלכם ללחשים: הרפתקת חשבון: ${code}\nהוא עובד 10 דקות.\n\nIf you did not ask for it, you can ignore this e-mail.` });
  } catch (x) { return { ok: false, error: 'mail' }; }
  props.setProperty(dk, String(sent + 1));
  c.put('code:' + h, hash(code), CODE_TTL); c.put('sent:' + h, '1', RESEND); c.remove('tries:' + h);
  return { ok: true };
}
function verify(email, code) {
  const c = cache(), h = hash(email), tries = Number(c.get('tries:' + h) || 0);
  if (tries >= TRIES) return { ok: false, error: 'locked' };
  const want = c.get('code:' + h); if (!want) return { ok: false, error: 'expired' };
  if (hash(code) !== want) { c.put('tries:' + h, String(tries + 1), CODE_TTL); return { ok: false, error: tries + 1 >= TRIES ? 'locked' : 'wrong' }; }
  c.remove('code:' + h); c.remove('tries:' + h);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { const sh = users(), n = sh.getLastRow(), seen = n > 1 && sh.getRange(2, 1, n - 1, 1).getValues().some(r => r[0] === h); if (!seen) sh.appendRow([h, new Date().toISOString()]); }
  finally { lock.releaseLock(); }
  return { ok: true };
}
function stats(key) {
  const real = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY'); if (!real || key !== real) return { ok: false, error: 'wrong' };
  const sh = users(), n = sh.getLastRow(), dates = n > 1 ? sh.getRange(2, 2, n - 1, 1).getValues().map(r => new Date(r[0])) : [], now = Date.now();
  return { ok: true, total: dates.length, week: dates.filter(d => now - d < 7 * 864e5).length, day: dates.filter(d => now - d < 864e5).length };
}
