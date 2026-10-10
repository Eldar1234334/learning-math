# Math Wizard: build progress

What was done in each step, how to check it on the test site, and what is still temporary.

- **Test site:** https://eldar1234334.github.io/learning-math/test/ (the newest step)
- **Live site:** https://eldar1234334.github.io/learning-math/ (only after your approval)
- The full plan is in [specs/HANDOFF.md](specs/HANDOFF.md) §4 (steps 0–11).

**Tip:** after a new step is uploaded, refresh the test page once or twice. The game keeps a saved copy for offline play, so the first visit can still show the previous version.

**Teacher demo (from step 1):** on the login screen tap **🔧 Teacher area → ▶ Start a demo run**. A pretend student opens with a yellow **🧪 Demo** button (bottom corner) that jumps to any math level, place, monster or fight area, and gives coins and items. Nothing is saved. To leave the demo, tap ✖ Exit demo.

---

## Step 0: Setup ✅ (checked by the owner)

**Goal:** a copy of the reading game that runs as Math Wizard, with nothing shared with the reading game.

**What changed**
- The name is Math Wizard, and the icon is the wizard hat with a gold "+" badge.
- Saved data is separate from the reading game (its own storage names on the device).
- No online saving yet: progress stays on the device until step 11. The installed app offers "Play offline" only; Math Wizard's own e-mail service also comes in step 11.
- Reading content removed: letters, syllables, recorded sounds, Hebrew writing, the recorder, the voice sets.
- The 36 math levels of spec 01, with moving up (85% of the last 10–12 answers) and down (below 50% of the last 8).
- The credit line is "Created by Dr. Dadon Eldar".

**Temporary until later steps**
- Questions are simple stand-in problems (one per level, whole-number answers), shown as answer buttons. Fights, brewing, the shop and the workshop all use them. The real math engine comes in step 2; the spell cards in step 4; recipes, money and forging in steps 7–9.
- The Villagers board says "coming soon" (not in version 1).
- The owl tutorial is hidden (it taught reading); a new one comes in step 10.
- The Hint potion (was Sound) does nothing yet; it needs the spell cards (step 4).
- The workshop still opens at math level 8; it moves to wizard level 8 in step 9.

**How to check**
1. Tap "I am new", create a hero. The map shows "Level 1: Addition up to 5".
2. Go to the city gate, start a quest, walk on: the monster fight asks problems like `3 + 2`.
3. A wrong answer: the monster attacks (−1 ❤️). Right answers: the monster is beaten.
4. Brewing at Home, buying in the Shop: each asks a problem one level easier.

---

## Step 1: Hebrew and English ✅ (checked by the owner)

**Goal:** every screen works in Hebrew (right to left) and English (left to right), with a language button, and the choice saved in the student's profile.

**What changed**
- A language button (**עברית** / **English**) on the login, registration and hero screens, the map, Home, the shop, the workshop, the journey map and the fight screen. It can be switched at any moment, also in the middle of a fight: the same question stays, only the words change.
- The choice is saved in the student's profile, so the next login opens in the same language on any device. Before login, the device remembers the last choice (the first visit follows the device's language).
- In Hebrew the screens run right to left. The drawn scenes do not flip: the wizard stays on the left, facing the monster.
- **Math is always written left to right**, also in Hebrew (`56 : 8`). The division sign is `:` in Hebrew and `÷` in English. Problems with words follow the language: `¾ מ־12`, `25% מ־80`, `חצי מ־18`.
- Hebrew talks to the student in the plural (בחרו, לחצו, נסו שוב), so the same text fits a wizard and a witch.
- Everything is translated: menus, the 36 level names (Hebrew names from spec 01), monsters, areas, potions, ingredients, shop items, magic items, rewards and messages.
- The Sound potion is called **Hint / רמז** everywhere, also in the shop.
- The teacher area can now start a **demo run** even before the online sheet exists (see the tip at the top).
- On phones, the fight screen hides the volume slider (the speaker button stays), so the student's name and level fit.

**Not translated yet (on purpose)**
- The teacher area's student tables: they are rebuilt for the new sheet in step 11 and will be translated then.
- The demo panel itself (a testing tool, English only).
- The owl tutorial (hidden; the new math tutorial comes in step 10).

**Please check (you are the Hebrew expert)**
- The wording of the Hebrew texts. Anything that sounds unnatural for a 6–12-year-old, tell me the line and the better wording.
- The monster and area names in Hebrew (for example שדון הגחלים, קרפדת הביצה, יער הלחישות).
- The stand-in problems with words: `פי 2 מ־7` (double 7) and `חצי מ־18` (half of 18). The real wording comes with the math engine in step 2.
- Should the game keep the English name "Math Wizard" also in Hebrew mode, or have a Hebrew name?

**How to check**
1. Open the test site. Tap **עברית** (top corner). The login screen turns to Hebrew, right to left.
2. Create a hero or log in. Walk to the city gate and fight: the problem stays left to right, all the words are Hebrew.
3. In the middle of a fight, tap **English**, then **עברית** again: the question stays the same.
4. Log out and log in again: the game opens in the language you chose.
5. Visit Home, the Shop, the Workshop (Teacher area → demo run → 🧪 Demo → level 8 → ⚒️ Workshop) in both languages.

---

## Step 2: The math engine ✅ (on the test site, waiting for your check)

**Goal:** real math for all 36 levels of the ladder (spec 01), checked by automatic tests, with a page to review the problems of any level.

**New pages**
- **The levels page:** https://eldar1234334.github.io/learning-math/test/debug.html. Choose a level and see 30 sample problems with the answer and the three wrong answers the game would offer. **עברית** shows them as a Hebrew student sees them. Add `?level=26` to the address to open a level directly.
- **The tests page:** https://eldar1234334.github.io/learning-math/test/tests/. It runs all the tests in your browser (about 5 seconds). GitHub also runs them on every upload.

**What changed**
- **All 36 levels** produce their own problems: the forms and number ranges of spec 01 §3 (for example level 6 always crosses ten, level 22 uses ½ ⅓ ¼ ¾, level 33 has one decimal place in each number).
- **Fractions are written stacked** (numerator over denominator), as at school, in the problems and on the answer buttons. Improper fractions are shown as mixed numbers (2⅔), always in simplest form. Decimals have no trailing zeros (2.5, not 2.50). Answers are compared by value, so ½ = 2/4 = 0.5.
- **Wrong answers that make sense** (spec 01 §5.3): ±1, ±10, swapped digits (31/13), the wrong operation (8+5 → 3), and for fractions the classic mistakes (adding the denominators: ½ + ⅓ → 2/5). A wrong answer is never equal to the right one in value, and never negative.
- **Built backward from the answer** (spec 01 §5.2): the engine can make a problem for a given answer at any level. The spell cards in step 4 need this.
- **Review:** about 1 problem in 5 comes from earlier levels, mostly the recent ones.
- **Weak spots:** a problem the student got wrong comes back more often, until it is answered right 3 times in a row.
- **No repeats:** a problem does not come back within 10 turns.
- **Choosing a grade:** a new hero picks a grade (1–6) and starts at the first level of that grade (spec 01 §6.2).
- **Moving up and down** (spec 01 §6): up at 85% or more over the last 10–12 answers, down below 50% over the last 8. During the first 20 answers (placement) the window is only 5 answers, so a student who chose the wrong grade moves quickly.
- **Shop, brewing and forging count too:** they use problems one level easier (spec 01 §7), and their answers count toward the level: a right answer counts ½ toward moving up, a mistake counts fully. Review problems also count ½ toward moving up.
- Coins per fight follow the math level, as in spec 03 §6.1 (1 coin unit at levels 1–6, 2 at 7–18, 3 at 19–30, 4 at 31–36).

**My reading of the spec (please confirm)**
- "Counts ½ toward moving up" (spec 01 §6.1): I read it as "worth half an answer". So 10 right shop answers count like 5 fight answers, and 20 right shop answers alone can move a student up. A mistake always counts as a full answer.
- Spec 01 says the incantation step (saying the answer) starts at level 5. For now every level picks from answer buttons; the incantation comes with the spell cards in step 4.

**Please check (you are the math teacher)**
- Open the levels page and look through the levels, especially grade 4–6 (fractions, decimals, percentages, ratios). Tell me any problem that does not fit its level, or a form that is missing.
- Level 35's ratio problems are worded "the first part of 57 in the ratio 2:1" (החלק הראשון של 57 ביחס 2:1). Is that how you would ask it?
- Level 36 (multi-step mix) uses three templates: (½ + ¼) × 8, ¾ × 12 − 5, and (1.5 + 2.5) × 4. More can be added.

**How to check**
1. Create a new hero and choose a grade (for example 3rd grade → level 13, times table 1–5).
2. Fight: answer right 5 times in a row. During placement you move up a level quickly.
3. Answer a problem wrong, then keep playing: the same problem comes back later (a weak spot).
4. With a demo run (Teacher area), pick level 26 or 31 to see fractions in a fight, and level 33 for decimals.
