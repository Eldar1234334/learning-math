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

## Step 3: The spell book ✅ (checked by the owner)

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

**Your decisions (from your check)**
- Light Spark (1) now opens at math level 3 (level 2 problems never have the answer 1).
- The higher-tier effects I proposed are approved: Wind Shield 600/6000 block 2/3 attacks, Healing Leaf 800/8000 heal 6/8, Shadow Snare 900/9000 2/3 turns, Time Freeze 190 3 turns, Arcane Echo 160 triple power.
- The Hebrew tier names are approved.

**Fixed after your check**
- The stone 🪨 (and the coin 🪙, the potted plant 🪴 and other newer emoji) showed as an empty square on Windows 10, whose emoji font is older. The game now loads Google's free color-emoji font, so every device draws every emoji.
- Your question: in fights, the spell that flies is still always the right element, whatever answer you pick. That is the stand-in from step 0: the real casting (the answer is the spell number; a wrong element does nothing or heals the monster) comes in **step 4**.

**How to check**
1. Create a new hero (grade 1): open 📖 on the map. Four spells: 2, 3, 4, 5.
2. Teacher area → demo run → 🧪 Demo: choose math level 3, then wizard level 3. Back on the map: "You learned new spells" (1, 6, 7). Open the book: 8 and 9 are sealed (wizard levels 5 and 8).
3. In the demo choose math level 7: "Your spells became enhanced!" (10, 20, 30 …).
4. Choose math level 26 and wizard level 18, open the book, tab Special: the fraction spells ½, ¼, ¾, ⅓, 1½.
5. In a fight, tap 📖: the book opens over the fight; close it and the same question is waiting.

---

## Step 4: Fights with spell cards ✅ (on the test site, waiting for your check)

**Goal:** the real fight of spec 00 §3 and spec 03: pick a problem card, its answer is the spell that is cast, the element decides what happens, then the monster attacks. This fixes the issue you found in step 3 (the right element always flew).

**What changed**
- **Problem cards:** each turn shows 3 cards (4 from wizard level 3, 5 from 15, 6 from 22). The answers are hidden. The answer of the card is the number of the spell that is cast.
  - One card makes a spell the monster is weak to (the good card). The weakness is shown under the monster's name (for example "🌿 PLANT · weak to 🔥 ⚡").
  - At least one card is a trap: a spell of the monster's own element (it **heals** the monster), a spell of another element (**no effect**), or a number that is no spell (**fizzles** 💨). The game explains why in one short line.
  - The good card is built backward from the spell number at the student's level (for example at level 21: `3731 − 3724` → 7, Stone Throw). About 1 in 5 good cards is review from an earlier level.
  - From wizard level 15 there are two good cards: an easy one (a weaker spell) and a hard one (a spell at least twice as strong, from the top of the level).
  - From wizard level 22 a utility card (shield, healing, control) can also be offered. A healing card is not offered while the wizard has full HP.
- **The incantation (from math level 5):** after picking a card, the student says its answer (spec 00 §4.1). A right answer casts the spell 10% stronger; a wrong answer makes it fizzle. The first time, a short story moment explains this. Levels 1–4 cast straight from the pick.
  - Answer buttons (the right answer and 3 sensible wrong ones), and from **level 21 a number pad** for whole numbers and decimals (the keyboard works too: digits, Backspace, Enter).
- **Scoring:** at levels 1–4 the pick is the math answer (a good pick is right). From level 5 the incantation is the math answer, and the pick is only tactics: a bad pick wastes the turn but does not count against the math level. (The game already counts bad picks; step 5 uses them in the rewards.)
- **HP instead of hearts:** the wizard has 20 HP + 2 per wizard level, shown as a bar and numbers. Monsters have HP for about 3 good casts at the student's level (spec 03 §3.1), and attack for 1 HP (+1 every 6 wizard levels). Bosses have 3× HP and attack 2×.
  - After a victory you catch your breath: +20% HP. The campfire on the path heals 25%. HP carries over between the fights of a quest.
  - A knockout: start the quest again (with full HP; after 2 restarts in a row, a lucky charm gives +25% extra HP for that try).
- **Spell effects in fights** (spec 02): shields block, healing heals, Shadow Snare and Time Freeze make the monster skip turns (a boss once at most), familiars attack every turn, Mirror Ward reflects, Phoenix Feather revives, Half-Moon Hex halves the monster's HP (a quarter for a boss), Arcane Echo doubles the next spell, area spells hit hard.
- **Potions in fights** (spec 03 §6.2), one per turn:
  - ❤️ Heart: heals 30% of your HP.
  - 💡 Hint: shows the answers on the cards (that turn skips the incantation and does not count for the math level).
  - 💥 Power: the next spell has double power.
  - ⏪ Second chance: undoes your last cast (HP, the monster and the statistics go back).
  - 🌟 Super: finishes the fight at once (once per chapter; it does not count for the math level).
- **Tests:** 11 new fight tests (78 in all): elements, damage and healing, monster HP, the monster turn with every effect, card sets over many levels (always a good card, a trap, different answers), no dark monster before a light spell, no healing card at full HP.

**My proposals (please approve or change)**
- The incantation bonus: a right spoken answer makes the spell **10% stronger**.
- The campfire heals **25%** of your HP.
- Shrink (Shrink Ray) makes the monster's attacks **half** as strong.
- A utility card (instead of the attack card) comes about **15%** of the time.

**Good to know**
- At the fraction levels (25–27, 31–32) the good card is often a review problem from an earlier level, because the spell numbers are whole numbers and fractions there rarely have a whole answer. The fraction spells (½, ¼ …) join from wizard level 18.
- Until step 5 the XP, coins and loot still follow the reading game's numbers.

**How to check**
1. Create a hero (grade 1). Walk to the city gate and fight: 3 cards, answers hidden. Pick the card whose answer is a spell the monster is weak to (look at the weakness under its name): damage. Pick another card: no effect, the monster heals, or the spell fizzles, with a short explanation.
2. Watch the HP bars: the monster attacks after every cast. Win a fight: +20% HP. Lose all HP (or 🧪 Demo → 💥 Lose all HP): knocked out, start again.
3. Teacher area → demo run → 🧪 Demo → math level 9 → ⚔️ Start monster quest. The first fight shows the incantation moment; then pick a card and choose its answer. Choose a wrong answer once: the spell fizzles.
4. In the demo choose math level 21 and start a quest: the number pad. Type the answer (or use the keyboard) and tap Cast.
5. In a fight, 🧪 Demo → 🧪 5 of each potion, then try each potion (one per turn): Hint shows the answers on the cards, Second chance undoes the last cast, Super ends the fight.
6. Switch to עברית in the middle of a fight: the cards stay, the words change, the number pad keeps the phone layout.
7. Try it on a phone: the cards fit in a row (3) or a grid (4–6).
