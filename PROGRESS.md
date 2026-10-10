# Math Wizard: build progress

What was done in each step, how to check it on the test site, and what is still temporary.

- **Test site:** https://eldar1234334.github.io/learning-math/test/ (the newest step)
- **Live site:** https://eldar1234334.github.io/learning-math/ (only after your approval)
- The full plan is in [specs/HANDOFF.md](specs/HANDOFF.md) §4 (steps 0–11).

**Tip:** after a new step is uploaded, refresh the test page once or twice. The game keeps a saved copy for offline play, so the first visit can still show the previous version.

**Teacher demo (from step 1):** on the login screen tap **🔧 Teacher area → ▶ Start a demo run**. A pretend student opens with a yellow **🧪 Demo** button (bottom corner) that jumps to any math level, wizard level, place, monster or fight area, opens the spell book, and gives coins and items. Nothing is saved. To leave the demo, tap ✖ Exit demo.

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

## Step 2: The math engine ✅ (checked by the owner; the reading of "½ toward moving up" and the ratio wording were confirmed)

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

---

## Step 3: The spell book ✅ (on the test site, waiting for your check)

**Goal:** the spell book of spec 02: every spell with its fixed number, the two gates (math level and wizard level), sealed spells, and the "new spell" moments.

**What changed**
- **The catalog of spec 02:** 9 base spells (1–9), 9 strong spells (11–19), their higher tiers with the same digits ×10 (`3` Fire Bolt → `30` Enhanced → `300` Greater → `3000` Legendary, and `130` Enhanced Fireball), and the 16 special spells of the grades (`25` Owl Familiar … `½` Half-Moon Hex … `360` Full Circle). 70 spells in all, every one with its own value.
- **The two gates** (spec 02 §1): a spell is learned when the math level reaches its number **and** the wizard level opens its type (attack 1, defense 3, heal 5, control 8, summon 10, buff 12, area 15, special 18).
  - Math open, wizard closed → the spell is in the book **sealed** (grey, 🔒 "Unlocks at wizard level N").
  - Math closed → the spell is not shown at all (no lock for the math pace).
  - A learned spell stays learned, also if the math level goes down.
- **The spell book 📖:** a button on the map, on the journey map and in fights (the fight and the daily clock wait while the book is open). Tabs: 1–9, 11–19, Enhanced, Greater, Legendary, Special. Each page: the number (big; fractions stacked), the name, the element, the type and the effect.
- **New spells are celebrated:** back on the map or on the path after a level-up: "✨ You learned a new spell!" with the new spells' pages. The first enhanced spells (math level 7) get their own moment: "✨ Your spells became enhanced!"
- **A new student** starts with 2, 3, 4, 5 (spec 02 §6.1). A student who starts at a higher grade starts with all the spells of that level.
- **Wizard level:** shown on the map ("🧙 Wizard level 3"), with the XP bar filling toward the next one. The curve is spec 03 §5.1 (40 + 20 × level XP per level, at most 30). The XP rewards themselves are still the reading game's for now; step 5 sets them to spec 03.
- **The levels page** has a new part: "📖 The spell book at this math level" with a wizard level menu: the learned, sealed and hidden spells for any pair of levels.
- **Tests:** 15 new tests (67 in all): unique numbers, the tiers, the gates at many (math, wizard) pairs, matching by value (½ = 2/4 = 0.5), texts in both languages, and the wizard level curve.

**Still to come**
- Casting spells in fights (cards with hidden answers, elements, effects): step 4. Until then, fights still use answer buttons.

**Please decide**
1. **Light Spark (1) at math level 2.** Spec 02 opens it at level 2, but no level-2 problem has the answer 1 (level 2 is addition, sums 2–10). The first problems with the answer 1 are at level 3 (subtraction). Options: (a) keep it at level 2 (it is in the book, and the cards start offering it from level 3), or (b) move its math gate to level 3.
2. **Effects of the higher tiers that the spec does not give** (my proposals, easy to change):
   - Wind Shield: `6` halves the next attack (spec), `60` blocks it (spec), `600` blocks the next 2 attacks, `6000` the next 3.
   - Healing Leaf: `8` heals 2 (spec), `80` heals 4 (spec), `800` heals 6, `8000` heals 8.
   - Shadow Snare: `9` 1 turn (spec), `90` 2 turns (spec), `900` 2 turns, `9000` 3 turns. Time Freeze `19` 2 turns (spec), `190` 3 turns.
   - Arcane Echo: `16` double power (spec), `160` triple power.
3. **The Hebrew names of the tiers:** מוגבר / עליון / אגדי (from spec 02), with the adjective agreeing with the spell (חץ אש מוגבר, התזת מים מוגברת). Please check a few in the book.

**How to check**
1. Create a new hero (grade 1): open 📖 on the map. Four spells: 2, 3, 4, 5.
2. Teacher area → demo run → 🧪 Demo: choose math level 2, then wizard level 3. Back on the map: "You learned new spells" (1, 6, 7). Open the book: 8 and 9 are sealed (wizard levels 5 and 8).
3. In the demo choose math level 7: "Your spells became enhanced!" (10, 20, 30 …).
4. Choose math level 26 and wizard level 18, open the book, tab Special: the fraction spells ½, ¼, ¾, ⅓, 1½.
5. In a fight, tap 📖: the book opens over the fight; close it and the same question is waiting.
