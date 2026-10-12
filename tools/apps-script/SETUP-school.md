# Setting up a new school (checklist for the Admin, on a call with the school owner)

The school owner is the person whose Google account will keep **all** of the school's data. You (the Admin) never see it: you only see the school's counts.
Takes about 10 minutes. The school owner shares their screen; they do every step in **their own** Google account.

## Before the call (you, the Admin)
1. In the game: **🔑 Admin** (bottom of the start screen) → your e-mail → the code from the e-mail.
2. **➕ New school**: the school's name and the school owner's Google account (Gmail or the school's Google Workspace e-mail).
3. Keep the two lines the game shows: **REGISTRY_URL** and **SETUP_TOKEN** (the token is shown once; if it is lost: **🔑 New setup token** next to the school).
4. Agree on a **school code** with the school (letters and digits, for example `SUNNY-7`). Two schools can never share a code.

## On the call (the school owner, in their own Google account)
1. Open **script.google.com** (check the account in the top right corner) → **New project**. Rename it **SpellQuest Math – school**.
2. Delete everything in `Code.gs`. Open https://raw.githubusercontent.com/Eldar1234334/learning-math/main/tools/apps-script/progress/Code.gs → select all → copy → paste → **💾 Save**.
3. **⚙️ Project Settings**:
   - **Time zone**: the school's (it decides what "played today" means).
   - **Script properties → Add script property**: `SCHOOL_CODE` = the school code, `REGISTRY_URL` and `SETUP_TOKEN` = the two lines from the Admin → **Save script properties**.
4. Back in the editor: choose the function **setupSchool** → **▶ Run** → **Review permissions** → the owner's account → (if Google warns that the app is not verified: **Advanced → Go to SpellQuest Math – school (unsafe)**) → **Allow**. The log shows the link of the school's new sheet.
5. **Deploy → New deployment** → ⚙️ **Web app**: Execute as **Me**, Who has access **Anyone** → **Deploy** → **Authorize access** → the owner's account → **Allow** → copy the **Web app URL** (ends in `/exec`; also in **Deploy → Manage deployments**).
   *If Google says "Something went wrong" (it happens when several Google accounts are signed in at once): reload the page and deploy again.*
   *If "Anyone" is not offered, the school's Google Workspace does not allow it: its IT admin has to allow it, or use another Google account.*
6. **⚙️ Project Settings → Script properties**: add `WEB_APP_URL` = that link → **Save**.
7. Editor: choose **linkRegistry** → **▶ Run** → **Allow**. The log says **"Joined the Admin's list as S…"**. Your Admin screen now shows the school as 🟢 active.

## After the call (the school owner, in the game)
1. **🔧 Teacher area** → the school code → their e-mail → the code from the e-mail.
2. **👩‍🏫 Teachers** (at the bottom, under 🏫 School owner): add each teacher's e-mail and classes.
3. **🏫 Classes and login cards**: paste each class list (or let students tap "I am new" and approve them), then **🖨 Print login cards**.

## When the school script changes
You see **⚠ update** next to the school on your Admin screen. The school owner pastes the new `Code.gs` (step 2) → **💾 Save** → **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. The link stays the same.

## What stays where
- **The school's Google account:** the school's sheet (students, real names, classes, progress, teachers, the log) and its script. Only the school owner can open it.
- **Your Admin list:** the school's name, code, link, the owner's e-mail, status, and counts (students, played today, last active, script version). No names, classes or progress.
- **The child's device:** only the child's own game data (never the real name or class).
