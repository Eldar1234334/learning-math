# SpellQuest: Math Adventure: setting up the school sheet (step 11, part 2)

A **new** Google Sheet with its own script, **separate from the reading game**. Do it in the Google account `learningtoread.app@gmail.com`.
**Do not open, copy or change the reading game's sheet or scripts.**

You choose two things first:
- a **teacher password** (it opens the teacher area in the game);
- a **school code** (students type it once on each device, for example `SUNNY-7`; you can change it later in the teacher area).

## The school sheet

1. Open **sheets.google.com** (signed in as `learningtoread.app@gmail.com`) → **Blank spreadsheet**. Name it **SpellQuest Math – progress**.
2. In the new sheet: **Extensions → Apps Script**. At the top, rename the project to **SpellQuest Math – progress**.
3. Delete everything in `Code.gs`, then paste the script from
   https://raw.githubusercontent.com/Eldar1234334/learning-math/test-phase11/tools/apps-script/progress/Code.gs
   (open the link, select all, copy). Click **💾 Save**.
4. **⚙️ Project Settings** (left side) → **Script properties** → **Add script property** twice:
   - `ADMIN_KEY` = *your teacher password*
   - `SCHOOL_CODE` = *your school code*
   → **Save script properties**.
5. **Deploy → New deployment** → click ⚙️ next to "Select type" → **Web app**:
   - Description: `SpellQuest Math v1`
   - Execute as: **Me (learningtoread.app@gmail.com)**
   - Who has access: **Anyone**
   → **Deploy** → **Authorize access** → choose the account. Google warns that the app is not verified: **Advanced → Go to SpellQuest Math – progress (unsafe) → Allow** (it is your own script).
6. Copy the **Web app URL** (it ends with `/exec`). Open it in a new tab: you should see `{"ok":true,"app":"SpellQuest Math progress"}`.
7. Send me the URL.

## Later: if the script changes
Paste the new code → **💾 Save** → **Deploy → Manage deployments** → ✏️ → Version: **New version** → **Deploy**. The URL stays the same.

## What the sheet keeps
- *Students*: one row per student: number, nickname, real name, class, status (approved / waiting), joined, math level, wizard level, XP, answers, accuracy, minutes, coins, crafting accuracy, restarts, last saved, then the game data (in parts). The real name and class are only here, never on the devices.
- *Removed*: numbers of students the teacher deleted or did not approve (so a device cannot bring them back).
- The script itself keeps a school token (made automatically): devices that entered the school code keep working after the code changes.

## Play at home (part 3)
Home players use the counting service shared with the reading game (every call says `game: 'math'`). That service is updated in its own Apps Script project, not from this repo: paste the new code → 💾 Save → Deploy → Manage deployments → ✏️ → New version → Deploy.

## The Admin's school list (schools spec, part 1)
One small sheet and script that only the Admin (the game's owner) uses. It turns a school code into that school's own link and keeps each school's **counts only** (students, played today, script version). No names, classes, numbers or progress ever go there.

1. Signed in as the Admin's Google account, open **script.google.com → New project**. Name it **SpellQuest Math – schools (Admin)**.
2. Paste https://raw.githubusercontent.com/Eldar1234334/learning-math/test-phase12/tools/apps-script/registry/Code.gs → **💾 Save**.
3. **⚙️ Project Settings → Script properties → Add**: `ADMIN_EMAIL` = the e-mail that should get the Admin's sign-in codes → **Save**.
4. Back in the editor, choose the function **setup** → **▶ Run** → allow the permissions. It makes the sheet "SpellQuest Math – schools (Admin: counts only)" and a daily count.
5. **Deploy → New deployment → Web app**: Execute as **Me**, access **Anyone** → **Deploy**. Send me the link (ending in `/exec`); it goes into the game as `REGISTRY_URL`.

### Adding a school
1. In the game: **🔑 Admin** (bottom of the start screen) → your e-mail → the code from the e-mail.
2. **➕ New school**: the school's name and the Gmail of the account that will keep its data. The game shows `REGISTRY_URL` and a one-time `SETUP_TOKEN`.
3. In that account, the school's script (the steps at the top of this page, with the newest Code.gs): add the script properties `REGISTRY_URL`, `SETUP_TOKEN` and `WEB_APP_URL` (its own web app link) → choose the function **linkRegistry** → **▶ Run** → allow. The school is now **active**: its code works, and its counts reach your list.
4. The school's code is changed only in that school's teacher area. Two schools can never have the same code.
