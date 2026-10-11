# Math Wizard: setting up saving (step 11)

Two small Google services, both **new** and **separate from the reading game**. Do them in the Google account `learningtoread.app@gmail.com`.
**Do not open, copy or change the reading game's sheet or scripts.**

You will choose one **teacher password** and use it in both (it opens the teacher area in the game).

---

## Part A: the progress sheet (students' progress)

1. Open **sheets.google.com** (signed in as `learningtoread.app@gmail.com`) → **Blank spreadsheet**. Name it **Math Wizard – progress**.
2. In the new sheet: **Extensions → Apps Script**. At the top, rename the project to **Math Wizard – progress**.
3. Delete everything in `Code.gs`, then paste the script from
   https://raw.githubusercontent.com/Eldar1234334/learning-math/test-phase11/tools/apps-script/progress/Code.gs
   (open the link, select all, copy). Click **💾 Save**.
4. **⚙️ Project Settings** (left side) → **Script properties** → **Add script property**:
   - Property: `ADMIN_KEY`   Value: *your teacher password* → **Save script properties**.
5. **Deploy → New deployment** → click ⚙️ next to "Select type" → **Web app**:
   - Description: `Math Wizard progress v1`
   - Execute as: **Me (learningtoread.app@gmail.com)**
   - Who has access: **Anyone**
   → **Deploy** → **Authorize access** → choose the account. Google warns that the app is not verified: **Advanced → Go to Math Wizard – progress (unsafe) → Allow** (it is your own script).
6. Copy the **Web app URL** (it ends with `/exec`). Open it in a new tab: you should see `{"ok":true,"app":"Math Wizard progress"}`.
7. Send me the URL.

## Part B: the e-mail code service (only for the installed app)

1. Open **script.google.com** → **New project**. Rename it **Math Wizard – e-mail codes**.
2. Delete everything in `Code.gs`, paste the script from
   https://raw.githubusercontent.com/Eldar1234334/learning-math/test-phase11/tools/apps-script/email-codes/Code.gs
   → **💾 Save**.
3. **⚙️ Project Settings → Script properties → Add script property**: `ADMIN_KEY` = **the same teacher password** as in Part A.
4. **Deploy → New deployment → Web app**: Execute as **Me**, Who has access **Anyone** → **Deploy** → authorize the same way. This time Google asks to **send e-mail as you** and **create spreadsheets** (it makes a small sheet "Math Wizard – app users" that keeps only a count of app users: no names, no e-mail addresses).
5. Copy the **Web app URL**, open it: you should see `{"ok":true,"app":"Math Wizard e-mail codes"}`.
6. Send me the URL.

---

## Later: if a script changes
Paste the new code → **💾 Save** → **Deploy → Manage deployments** → ✏️ → Version: **New version** → **Deploy**. The URL stays the same, so the game needs no change.

## What is kept where
- **Math Wizard – progress**, sheet *Students*: one row per student: number, nickname, real name, class, math level, wizard level, XP, answers, accuracy, minutes, coins, crafting accuracy, restarts, last saved, then the whole game profile (in parts). Sheet *Deleted*: numbers of students the teacher deleted.
- **Math Wizard – app users**: a one-way hash of each verified app address and the date. The installed app keeps its game data on the device only.
