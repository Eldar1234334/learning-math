# SPEC: Schools, roles and the one-link school kit

Built and tested in **SpellQuest: Math Adventure** (this repo, 2026-10-11/12). This spec describes it so the same system can be built in another game (the reading game) and work the same way. Everything here was tried live, including a second school in a Google Workspace account.

Reference code in this repo (copy and adapt, do not invent anew):
- `tools/apps-script/registry/Code.gs` + `appsscript.json`: the **Admin's list** (one per owner, for all schools).
- `tools/apps-script/progress/Code.gs` + `appsscript.json`: the **school script** (one copy per school, in the school's own Google account).
- `index.html`: the game side (search for `REGISTRY_URL`, `joinCode`, `adminAsk`, `ownOpen`, `ownShowNew`, `movedHome`, `checkSchoolOpen`).
- `tools/apps-script/SETUP-school.md`: the manual setup (fallback).
- Mock tests (local, not in git): a fake of the Google services that runs both scripts in a browser page. Rebuild it: it caught most bugs before they reached Google.

---------------------------------------------------------------------
## 1. Roles and who keeps what

| Role | Who | Signs in with | Sees |
|---|---|---|---|
| **Admin** | the games' owner | 🔑 Admin: an e-mail code (only the e-mail in the list's script property `ADMIN_EMAIL` gets one) | each school's name, code, status and **counts only** (students, played today, last active, script version) |
| **School owner** | the Google account that runs the school's script | 🔧 Teacher area: school code → e-mail → code | everything of that school; extra "🏫 School owner" part: teachers, school code, settings |
| **Teacher** | an e-mail the school owner added | the same e-mail code | only their classes |
| **Student** | child | school code once per device, then a student number | their own game only |

Data: the **school's sheet** (in the school's Google account) holds names, classes, progress, teachers, the log. The **Admin's list** holds no student data. The **child's device** never holds the real name or class.

---------------------------------------------------------------------
## 2. The Admin's list (registry)

A standalone Apps Script project + its own sheet ("Schools"), in the Admin's account, deployed as a web app (Execute as: Me, Access: Anyone).

Sheet columns: `id | name | code | web app | owner gmail | status | games | players | active today | last active | script version | created | setup token (hashed) | key | kit`.

Actions (all POST, JSON body, nothing secret in a URL):
- Devices: `resolve {code}` → `{ok, id, name, url, games}` or `code` / `suspended` / `busy` (rate limits: 40/min, misses 30/min). `status {id}` → active / suspended / gone.
- A school's script: `registerSchool {setup, url, code, version}` (once, with the one-time setup token; the list **pings the school's web app with the token, and the school answers with its owner's e-mail, which must equal the Gmail the Admin entered**; then the list stores a random key and both sides keep it). `schoolCode {id, key, code}` (the school changed its code; codes are unique across schools).
- Admin (session token from `adminCode` / `adminVerify`, 6 hours, kept in memory only): `schools`, `refresh` (asks every school for its counts with the key), `newSchool {name, owner, code}`, `newSetup {id}`, `setStatus {id, active|suspended}`, `deleteSchool {id}`, `homeStats` (home players from the counting service; properties `COUNT_URL`, `COUNT_KEY`).
- A daily trigger refreshes the counts.

**School numbers are never reused** (property `NEXT_ID`): a removed school's number must not go to a new school (it happened: a new school got a removed school's S1).

---------------------------------------------------------------------
## 3. The school script

One per school, in the school's Google account. Makes its own sheet. Tabs: Students (the game's progress table), Removed, Staff, Log, Classes, Cards, Moved, and (in a kit) Setup.

Actions it adds for this system (the game's own load/save stay as they were):
- `ping {setup}` → `{owner, version}` only with its own setup token. `stats {key}` → counts only. `signin` → does the old teacher password still work here?
- Staff: `staffCode {email}` (the same answer for every e-mail; codes 10 minutes, once, 5 tries) and `staffVerify` → a session. Every staff action takes `{sess}` (or the old password `{key}`, counted as the school owner, until it is turned off).
- The owner = `Session.getEffectiveUser()` (the account that runs the script) plus Staff rows marked owner. Teachers see and change **only their classes**; the script checks every call (hiding buttons is never the protection).
- Classes (`classAdd`, `classArchive`, the device's `classes` list for "I am new"), waiting list (`approveMany`, `rejectMany`), login cards printed (`cardsPrinted`), move to home (`moveHome`, `undoMove`, the device's `selfMove`), settings (`setSelfMove`, `setPassword`). Every staff change goes to the Log tab.
- A new school code is first checked with the Admin's list.
- **Compatibility:** the live game must keep working while the script changes (e.g. the class list is enforced only for games that send `menu: true`).

---------------------------------------------------------------------
## 4. The school kit (one link per school)

Goal: the school owner does not type any settings. The Admin's list makes a ready copy per school.

**Once (Admin):**
1. In the Admin's list run `makeTemplate()`: it makes the sheet "… school kit (template)" with a **Setup** tab (instructions, then the keys `SCHOOL_NAME`, `SCHOOL_CODE`, `REGISTRY_URL`, `SETUP_TOKEN` in column A, values empty).
2. Open the template **in a private window signed in only to the Admin's account** → Extensions → Apps Script (this creates the sheet's own script; with several accounts signed in Google shows "Page Not Found"). Then paste the school script (`Code.gs`; and `appsscript.json` after Project Settings → Show manifest). Name it "… – school". Do this again whenever the school script changes.
3. The list needs the Drive permission (to copy files): its manifest lists `spreadsheets`, `drive`, `script.external_request`, `script.send_mail`, `script.scriptapp`.

**Per school (Admin):** 🔑 Admin → ➕ New school: name, the school's Google account, **school code** → the list copies the template (`DriveApp.makeCopy`), writes the four values into the copy's Setup tab, shares it "anyone with the link can view", and shows **one link**: `https://docs.google.com/spreadsheets/d/<copy>/copy`. The code is reserved for that school. 🔑 New setup token makes a new kit (the old one goes to the bin).

**The school owner** (private window, only the school's account):
1. Opens the link → **Make a copy** (the copy, with its script, is now in the school's account: it is the school's data sheet).
2. Menu **🧙 SpellQuest → Set up my school** (an `onOpen` menu) → Allow. The script reads the Setup tab into its script properties, renames the sheet, makes the tabs (`setupSchool`).
3. **The one step a script cannot do:** deploy its web app. A box explains it (English and Hebrew): Extensions → Apps Script → Deploy → New deployment → ⚙️ Web app → Execute as Me, Access Anyone → Deploy → Authorize → **Copy the Web app URL → paste into the box**.
4. The script checks the link answers (`doGet` of its own web app), joins the list (`linkRegistry`), marks the token "(used)", and shows **"✅ … is ready"** with the school code and the next steps. The list puts the shared kit in the bin.

The school kit's manifest: `webapp {executeAs: USER_DEPLOYING, access: ANYONE_ANONYMOUS}` and scopes `spreadsheets`, `script.container.ui`, `script.external_request`, `script.send_mail`, `userinfo.email`.

Security: the kit is viewable by anyone with the link, but its setup token is single-use and only works for the Google account the Admin entered (the ping check), so a copy in another account cannot join.

---------------------------------------------------------------------
## 5. Google gotchas we hit (do not repeat them)

1. **Deploying a web app from a script (Apps Script API) is not practical.** The API must be enabled in the script's hidden Cloud project, which needs the Google Cloud console and its terms. A school owner cannot be asked to do that. → The owner deploys once, by hand, and pastes the link.
2. **`ScriptApp.getService().getUrl()` is not reliable.** Before any deployment it already returns a link that does not answer. → Use a link only after checking it answers (fetch it; expect the script's `doGet` text).
3. **Google Workspace links** look like `https://script.google.com/a/macros/<domain>/s/<id>/exec`. → Rewrite to `https://script.google.com/macros/s/<id>/exec` before checking or sending to the list.
4. **Several Google accounts signed in at once** break the sheet-attached script editor ("Page Not Found") and sometimes deploying ("Something went wrong": reload and deploy again). → Always a private window with one account. Open pages with `?authuser=<email>` and check the account before every change.
5. The first deploy asks "Authorize access" once more; unverified-app warnings need "Advanced → Go to … (unsafe)". Some Workspace admins block "Anyone" deployments or unverified apps: then the school's IT has to allow it.
6. A Gmail account sends about 100 e-mails a day (staff sign-in codes come from the school's own account); Workspace more.
7. Script property values are visible on the settings page: never take screenshots of it, never copy keys or passwords anywhere.

---------------------------------------------------------------------
## 6. The game side

- `CFG.REGISTRY_URL`. The school code goes to `resolve`; the device keeps `school_url`, `school_name`, `school_id` and the token. Fallback: a device that already knows its school keeps working when the list cannot be reached.
- 🔑 Admin link (only when `REGISTRY_URL` is set), separate from 🔧 Teacher area. **Both must open in the installed app too** (a rule copied from the reading game hid them there).
- Teacher area: the school owner's part grouped under **🏫 School owner** at the bottom; teachers do not see it. The "Use the teacher password instead" link hides when the school says the password is off (`signin`).
- A suspended school (checked at most hourly): "School access has ended" + "Keep my wizard (move to home)".
- "Played today N of M" uses the school script's time zone (`lastDay` / `today` from `list`).

---------------------------------------------------------------------
## 7. The checklists (what the Admin and the school owner do)

**Admin, before:** check the school's e-mail is a Google account (Workspace or Gmail; Outlook schools make a Gmail owned by the school); agree on a school code; 🔑 Admin → ➕ New school (name, the school's Google account exactly, code); copy the kit link; send it with the school owner's checklist. **During (first time, a short call):** be there for the deploy-and-paste step. **After:** the school is 🟢 active; counts refresh nightly; ⚠ update when the school script is older (the school owner pastes the new script and deploys a new version: Manage deployments → ✏️ → New version); ⏸ Suspend / ▶ Resume.

**School owner:** a private window with only the school's account; open the kit link → Make a copy; 🧙 SpellQuest → Set up my school → Allow; the last step (deploy, copy the Web app URL, paste); "✅ … is ready". Then in the game: 🔧 Teacher area → school code → e-mail → code; add teachers (👩‍🏫 Teachers) and classes; print login cards. Fallback without a kit: the 7-step manual setup (`SETUP-school.md`).

The shareable page with both checklists: a Claude artifact (private until shared from its Share menu).

---------------------------------------------------------------------
## 8. Order to build it in the other game

1. The Admin's list (copy the registry script; one list can serve both games: it has a `games` column, or give each game its own list).
2. The school script's new actions (§3), keeping the game's own load/save.
3. The game side (§6), on a test branch.
4. The kit (§4): `makeTemplate`, the template's script, `newSchool` with a code.
5. Tests: mock both scripts (sign-in, roles, class limits, kit, wrong owner, used token, Workspace links, numbers never reused), then one real dry run with a second school in a Workspace account, in a private window.
6. Go live only when the owner says so.
