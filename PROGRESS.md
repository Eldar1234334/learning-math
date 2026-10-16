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

## Step 4: Fights with spell cards ✅ (checked by the owner)

**Goal:** the real fight of spec 00 §3 and spec 03: pick a problem card, its answer is the spell that is cast, the element decides what happens, then the monster attacks. This fixes the issue you found in step 3 (the right element always flew).

**What changed**
- **Problem cards:** each turn shows 3 cards (4 from wizard level 3, 5 from 15, 6 from 22). The answers are hidden. The answer of the card is the number of the spell that is cast.
  - One card makes a spell the monster is weak to (the good card). The weakness is shown under the monster's name (for example "🌿 PLANT · weak to 🔥 ⚡").
  - At least one card is a trap: a spell of the monster's own element (it **heals** the monster), a spell of another element (**no effect**), or a number that is no spell (**fizzles** 💨). The game explains why in one short line.
  - The good card is built backward from the spell number at the student's level (for example at level 21: `3731 − 3724` → 7, Stone Throw). About 1 in 5 good cards is review from an earlier level.
  - From wizard level 15 there are two good cards: an easy one (a weaker spell) and a hard one (a spell at least twice as strong, from the top of the level).
  - From 4 cards (wizard level 3) every set has one **support card**: a shield or healing spell, so the player chooses between attacking and defending (your decision). With low HP it is a healing spell; at full HP never a healing spell.
  - From 5 cards (wizard level 15) one more utility card can join: summon, buff or a special spell. A control spell (Shadow Snare) can already take the support card's place from 4 cards.
- **The incantation (from math level 5):** after picking a card, the student says its answer (spec 00 §4.1). A right answer casts the spell; a wrong answer makes it fizzle. The first time, a short story moment explains this. Levels 1–4 cast straight from the pick.
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

**Your decisions (from your check)**
- No power bonus for a right spoken answer for now (it only casts the spell).
- Approved: the campfire heals 25% of your HP; Shrink makes the monster's attacks half as strong.
- Shadow Snare (and Time Freeze) may take the support card's place, about 1 time in 3 (never when HP is low). Familiars, buffs and special spells get their own card slot from 5 cards (wizard level 15).
- Every set of 4+ cards has one support card (shield or healing); the utility card no longer replaces the attack card.
- The ratio problems are removed. Level 35 is now "Harder percentages" / "אחוזים מתקדמים" (for example `15% of 60`, `125% of 80`).
- A wrong incantation: the spell fizzles (nothing is cast, and it counts as a math mistake). A spoken number is never cast as a different spell.

**Fixed after your check**
- 3 cards: the third card was narrower, on its own row. Now the 3 cards are equal, in one row.
- A sealed spell, a number that is no spell, or a wrong incantation: nothing flies to the monster any more. A puff of smoke comes from the staff and the wizard shakes.
- A spell the monster ignores ("No effect"): it flies, glances off the monster and drops.
- Shields, healing, buffs and familiars now glow around the wizard instead of flying at the monster.
- Wind Shield: a blue bubble around the wizard (and a 🛡️ icon) until it blocks; it flashes when it blocks.
- Shadow Snare: shadow bonds hold the monster (it turns grey and dark, with a ⛓️ icon and the number of turns), and it rattles in them on its skipped turn.
- Small icons also show Mirror Ward 🪞, Phoenix Feather 🪶, a buff 💪 and a familiar, and Shrink 🔽 on the monster.

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
8. Demo → wizard level 10 → a fight: every turn has 4 cards, one of them a shield (6, 60) or healing (8, 80) spell. Cast the shield: the bubble. Cast Shadow Snare (9) when it comes from 5 cards (wizard level 15): the shadow bonds.

---

## Step 5: Wizard progression and monster abilities ✅ (checked by the owner)

**Goal:** spec 03 §4–5: XP from fights, a wizard level that brings something new every session or two, and 7 kinds of special monsters.

**What changed**
- **XP (spec 03 §5.1):** XP now comes from winning, not from single answers.
  - Win a fight: +10 XP. Win a boss: +40 XP.
  - **Perfect tactics** (no bad card picks in the fight): +5, or +20 for a boss.
  - Brewing a potion, buying in the shop, forging an item: +3 XP each.
  - The bar under the name (in fights, Home, the shop) now shows the progress to the next wizard level.
- **A new wizard level** shows a window with what it brings:
  - New kinds of spells (defense 3, heal 5, control 8, summon 10, buff 12, area 15, special 18) together with the new spells.
  - More cards (4 at level 3, 5 at 15, 6 at 22), two good cards from level 15.
  - New kinds of monsters (see below) and heavy armor (16).
  - **Levels without a main unlock** (spec 03 §5.2) give a **title** or a **gift**:
    - Titles: Number Apprentice (1), Spark Counter (2), Rune Reader (7), Spell Scribe (14), Sage of Sums (21), Master of Numbers (25), Number Legend (29), Archmage of Numbers (30). In Hebrew a witch gets the feminine form. The title shows on the map next to the wizard level.
    - Gifts: a free decoration for Home (levels 4, 17, 23, 27) or a wardrobe item (19, 24, 26, 28), one the student does not own yet.
- **Monster abilities (spec 03 §4):** from wizard level 6, some monsters have a special ability: 30% of monsters at level 6, growing to 60% at level 20. A boss always has one ability (two from level 20). The first time each kind appears, a **"New monster!"** card explains it and gives a tip. The ability shows as a tag under the weakness badge.
  - 🛡️ **Armored** (6): a grey armor bar over the HP bar and an armor tag ("🪵 Bark armor · breaks with 🔥"). While the armor is up, attacks do half damage; a spell of the armor's element hits the armor at full power (and never heals the monster). The cards offer the armor-breaking spell first. Types: bark (🔥 fire), ice (🔥 fire or ✨ light), stone (💧 water), iron (⚡ lightning), shadow (✨ light), never one that breaks with the monster's own element. From level 16 some armors are heavy (2 casts).
  - 🌱 **Regenerating** (9): heals 10% of its HP every turn.
  - ⚡ **Charging** (11): every 3rd turn a huge attack (×3). The ⚡ tag lights up yellow one turn before, and that turn the support card is a shield or a control spell.
  - 🎭 **Shapeshifter** (13): changes element every 2 turns (the battlefield colour, the badge and the weakness change).
  - 👥 **Group** (15): 2–3 monsters. The others wait behind, smaller, with their own HP bars. A spell hits the one in front; area spells hit all of them. When the front one falls, the next one steps forward.
  - 🔮 **Shielded** (18): a purple magic shield takes the first hit of the fight (any attack spell breaks it).
  - 💢 **Double attack** (20): attacks twice every turn.
- **Tests:** 9 new tests (87 in all) for the abilities, the armor, groups and the card sets.

**My proposals (please approve or change)**
- A group: each monster has **half** the HP of a single monster and attacks with **40%** of its strength (so 3 monsters together hit a bit harder than one, and take about 1.5 fights to beat).
- Heavy armor: **half** of the armors from wizard level 16.
- The titles and the gift levels listed above.
- The ability names in Hebrew are the spec's (משוריין, מתחדש, טוען, משנה צורה, קבוצה, מוגן, התקפה כפולה).

**Good to know**
- The fight lengths are not tuned yet (some fights at higher levels take 6–7 casts). That is step 6: a fight simulator plays thousands of fights and the numbers get tuned to "about 3 good casts".

**How to check**
1. Win a fight: the victory window shows +10 XP, and "Perfect tactics: +5 XP" when you picked no bad card. Brew a potion: +3 XP.
2. Teacher area → demo run → 🧪 Demo → wizard level 10: the window lists what levels 8–10 bring (control, Regenerating monsters, summon) and the new spells. Try 24: a title, 6 cards and gifts (look at Home and the wardrobe).
3. Demo → **Monster abilities** → 🛡️ Armored → a monster from the Monsters list: the "New monster!" card, the armor tag and the grey bar. Break the armor with its element, then attack the weakness.
4. The same with the other abilities (they open at their wizard level in real play, but the demo can force any of them): ⚡ Charging (watch for the yellow tag), 🎭 Shapeshifter (the badge changes), 👥 Group (the monsters behind), 🔮 Shielded (the purple bubble), 💢 Double attack. Tap 🎲 Random again to go back to normal.
5. Demo → wizard level 20 → a boss: it has two abilities.

### Step 5, round 2 (after your check) ✅ (checked by the owner)

**Your decisions**
- Kept as proposed: groups (half HP each), heavy armor from level 16, the titles and gifts, the Hebrew ability names, the magic shield rule.
- **New schedule of monster abilities:** Armored 6 · Shapeshifter 9 (was 13) · Charging 11 · Magic shield 13 (was 18) · Groups 15 · Heavy armor 16 · Regenerating 17 (was 9, now when a strong card is offered every turn) · Double attack 20.
- **Charging and the magic shield are extra traits:** from their level any monster may have them on top of its ability (charging 1 in 4, magic shield 1 in 5; my proposal), also bosses; never in a group.
- **Armor holds for at least 2 hits:** every hit with the breaking element breaks one layer, whatever its power. 2 layers, 3 for heavy armor. The grey bar shows one part per layer.
- **Area spells:** 11–18 (Sunburst, Tidal Wave, Fireball, Rock Slide, Blizzard, Thunderstorm, Meteor Rain) hit every monster, and stay open from math level 5 for everyone. Their enhanced versions 110–180 have power 8 (between 4 and 12). 16 Arcane Echo stays a buff; 19 Time Freeze freezes the whole group.
- **Ice Spear is now Blizzard / סופת שלגים.**
- **Group fights:**
  - 2–3 monsters stand side by side, each with its own element, HP bar and attack; at least two share a weakness the student can use.
  - **Tap a monster to aim at it** (the gold ▼). Single spells hit the target; area spells hit all of them, and each monster shows its own damage.
  - **2 spells every turn** from the same cards ("spell 1 of 2", the used card is greyed). **🔄 New cards** once per turn.
  - The cards always include an area spell (when the student has one) and a good card for every monster.
  - Every monster attacks, one after the other.
- **The monster manual:** at wizard level 12 (my proposal) the student may leave it at home: no weakness hints in fights (also not on the armor tag), and 6 potions in the pouch instead of 5. The 📕 button on the map takes it back (not during a quest).

**Also fixed**
- Wording: "Strong spells defeat it before it heals" / "כישופים חזקים מביסים אותה…", and "פי 3 יותר חזק".
- Home: the room no longer shakes when the mouse moves.
- The spell book can be sorted: **by tier** (as before), **by number** (one list) or **by type**.
- **Spells look different:** bigger and brighter for stronger tiers, with a trail in the element's colour; area spells rain down on every monster.
- **Monster attacks are visible:** each monster lunges and shoots its element at the wizard; a double attacker shoots twice.
- **Shapeshifter:** it shimmers and wavers, and when it changes element it twists in a puff of smoke and takes the new element's colours.

**How to check**
1. Demo → wizard level 16 → Monster abilities → 👥 Group → a monster: 2–3 monsters side by side. Tap one (▼ moves), cast an area spell (Thunderstorm 17, Tidal Wave 12 …): each monster shows its damage. Cast a second card; try 🔄 New cards.
2. Demo → 🛡️ Armored: the bar has 2 parts (3 for heavy armor at level 16+); each breaking hit removes one.
3. Demo → 🎭 Shapeshifter: watch it change colour after 2 turns. 💢 Double attack: two shots.
4. Demo → wizard level 11, then 12: the level-up window offers to leave the monster manual at home. Then a fight shows only the monster's element. 📕 on the map takes it back.
5. 📖 → Sort: by number, by type.
6. Home: move the mouse over the room; it stays still.

**Changed after your second look**
- Every monster of a group now attacks as hard as a single monster (it was 40%); each still has half the HP.
- The wizard's HP bar drops after each monster's shot, not at the end of the monsters' turn.
- 📖 By type → Attack: the attack spells are grouped by element (🔥 Fire, 💧 Water, 🧊 Ice, ✨ Light, ⚡ Lightning, 🪨 Stone).

**Your last changes (done with step 6)**
- The monster manual has its own place on the small shelf at Home (left wall, next to the candle): 📕 when it is at home, a faded outline when it is in your bag. Tap it to take it or put it back. (The 📕 button on the map is gone.)
- Each monster of a group has 80% of a single monster's HP (it was 50%).

---

## Step 6: Balance ✅ (on the test site, waiting for your check)

**Goal:** spec 03 §7: a fight simulator that plays thousands of quest runs with the real fight rules, and tuning so that the goals of spec 03 §1 hold.

**The simulator** (not part of the game)
- **Page:** https://eldar1234334.github.io/learning-math/test/tools/sim.html. Tap ▶ Run (about 10 seconds). It shows each goal with ✔ or ✘, and a table per (wizard level, math level) and player.
- It plays whole runs (5–10 fights and a boss, 20% HP back after a win, campfires) with the game's own card sets, spells, monsters, abilities and groups, and a pouch of 5 potions (2 Heart, 2 Second chance, 1 Power).
- Three players: **good** (picks the best card 90% of the time, 90% right answers, heals and shields when it matters), **average** (55%, 70%), **guessing** (random cards, 25% right answers).
- GitHub now runs it on every upload, so a later change that breaks the balance is caught.

**What the first run showed (the spec's numbers)**
- From wizard level 3, even good players lost most runs, almost always at the boss (×3 HP, ×2 attack: 9–24 turns).
- From wizard level 20 a boss with a double attack beat a wizard with full HP in 5 turns.
- At the fraction levels (26, 31) the "strong" card was always ⅓ (Triple Strike, the weakest spell), and at level 36 a fight took 1 cast.

**Changes (my proposals, please approve)**
- **Bosses:** ×2 HP (was ×3), ×1.5 attack (was ×2). A boss never gets the double attack. A regenerating boss heals 5% per turn (others 10%), because it has twice the HP.
- **Monster attack:** +1 every 8 wizard levels (was every 6). The wizard's HP grows 2 per level, so with every 6 the monsters got relatively stronger and stronger.
- **The good card:** comes from the student's own level about 80% of the time and 20% review (spec 01 §5.2), like the monster's HP expects.
- **The strong card (wizard level 15+):** the strongest good spell the student can cast, also from an earlier level when the current level has only small spells (fractions). Triple Strike counts as power 3 (3 hits of 1).
- **Monster HP from wizard level 15:** follows the two good cards (the average of the strong and the easy spell). The strong card ends a fight in about 2 casts, the easy one takes about 6 or more.
- Unchanged: 20% HP back after a win, the campfire 25%, 3 good casts per fight.

**The result (60 runs per row)**
| Wizard / math | Good player wins | Average wins | Guessing wins | Good casts per fight |
|---|---|---|---|---|
| 1 / 2 | 100% | 95% | 2% | 3.1 |
| 3 / 5 | 100% | 70% | 0% | 3.7 |
| 6 / 9 | 100% | 70% | 0% | 3.8 |
| 10 / 13 | 100% | 92% | 0% | 3.5 |
| 15 / 13 | 100% | 100% | 0% | 2.6 |
| 15 / 21 | 100% | 97% | 0% | 2.5 |
| 20 / 21 | 95% | 43% | 0% | 2.5 |
| 20 / 26 | 98% | 45% | 0% | 2.6 |
| 25 / 31 | 100% | 32% | 0% | 2.4 |
| 30 / 36 | 100% | 43% | 0% | 2.4 |

All 7 checks pass: about 3 good casts per fight (a bit fewer with the strong card), good players win, guessing players lose (from math level 5 in the first 1–2 fights; at level 1 around fight 5, because the beginner's monsters are gentle), average players are in between, strong spells end a fight in a third of the casts of weak ones, and at the same wizard level fights are equally long at every math level.

**Good to know**
- A guessing student at level 1–4 (no incantation yet) survives about 5 fights before losing; from level 5 the incantation makes guessing fail fast.
- The simulator's players are simple. Real students also use the hint potion and the super potion, so they do a little better.

**How to check**
1. Open the simulator page and tap ▶ Run: every goal ✔.
2. Play a few runs at different demo levels: a normal fight takes about 3 good casts; a boss takes longer but is beatable with HP to spare.
3. At Home: the monster manual on the small shelf (from wizard level 12). Tap it to take it or put it back.

### Spell visuals review (with the owner, before step 7)
Every spell was shown in the browser one family at a time; your comments were built in right away.
- **Arrows:** Water Splash, Fire Bolt and Ice Bolt (all tiers) fly as glowing arrows in their element's colours.
- **Healing:** a bright green glow (stronger for higher tiers) and red hearts, one per tier. Quarter Heal and Full Circle: a red circle under the wizard, a red glow and one big heart (with 25% for the quarter).
- **Area spells:** Sunburst (a sun, golden beams; red glow for 110), Tidal Wave (a wave from the wizard, small / big), Fireball (a ball of fire that explodes; bigger for 130), Blizzard (a snowstorm with a frosty haze), Thunderstorm (dark clouds, purple lightning), Meteor Rain (burning meteors that hit with dust). Rock Slide keeps the falling rocks.
- **Arcane Echo:** a spinning rune circle, a glowing ×2/×3 orb on the staff, and the boosted spell flies purple with an echo.
- **Time Freeze:** a clock over the monsters and a pale-blue ripple; frozen monsters stand still with ⏳ (Shadow Snare keeps its dark shadows and chains).
- **Familiars:** the Owl is now the **Hawk Familiar / נץ מלווה**. The hawk, wolf and dragon use your pictures (art/). The hawk flies over and claws, the wolf runs over and bites, the **Dragon** rises and breathes on **every monster**: always its weakness (Fireball fire, purple lightning, a water jet, Blizzard snow; a purple arcane flame if nothing else fits). Each breath does half of a typical good spell at the student's level (your approval).
- The simulator's check for average players at the top levels was set to "15% or more" (it moves between about 15% and 30% from one sample to the next there).
- **Special spells (second part of the review):** Mirror Ward (a glass mirror; the shot bounces back, then it shatters), Life Drain (red life-orbs flow back to the wizard), Chain Lightning (a purple bolt jumps from monster to monster), Phoenix Feather (a golden feather waits above the wizard; on a knockout fiery wings spread and the wizard is reborn), Half-Moon Hex (a crescent moon and a moonlight slash; half the monster darkens), Three-Quarter Shield (a ring of 4 quarters, 3 lit, with ¾), Triple Strike (three separate arcane bolts), Echo and a Half (the Arcane Echo look with ×1.5), Mist of Tenths (a mist with 0.1 numbers; the monster's shot comes out tiny), Shrinking Hex (the monsters shrink for 3 turns, smaller shots), Starfall (night sky, twinkling stars, shooting stars).
- After the review: the small element icons above group monsters were removed (tap a monster to see its element under the area name).

---

## Step 7: Brewing ✅ (checked by the owner)

**Goal:** spec 04 §3: the recipe is the math. The student measures each line of a recipe card into the cauldron, then brews.

**What changed**
- **The recipe card** is written at the **easy step** (one math level below the student's, spec 04 §1). It has:
  - **herb lines**: herbs the student owns (leaf, grass, seeds…), whole counts, at most 12 per potion. Each line is a small problem of the level, written as a recipe: "11 in all; 9 already in. Add the rest." · "4 handfuls of 3" · "Share 64 equally among 8 bottles. Put in one share." · "Double 7" · "You used 3 and 5 were left. Put in as many as you had at first." Other kinds show the calculation: "Measure ¾ of 12", "Measure 2.5 × 2.8".
  - **a liquid line**: free spring water 💧, moon water 🌙 or oil 🫒. It carries the level's real numbers: hundreds and thousands of drops, cups in fractions, litres in decimals.
  - **the rare items** of the potion (stones, creature parts, sky items, treasures): 1 of each, chosen before brewing; they are not a math task.
- **The tools:** a jar for each herb (➖ ➕, and +5 in a batch) and a **measuring jug** with a scale; tap the jug to fill it roughly, then the buttons fine-tune: ±1000 ±100 ±10 ±1 drops, ±1 and ±1/d cups, ±10 ±1 ±0.1 ±0.01 litres (only the steps the amount needs).
- **Brew!** Every line is checked. Each line is one scored answer (½ toward moving up, 1 toward moving down).
  - All right: the potion is made, **+3 XP per line**.
  - A wrong line: the brew fails, and a **worked example** shows the right amount with a picture: dots (adding and taking away), an array (multiplication), groups (sharing), fraction bars, or the filled jug. Then a roll: the ingredients are lost (10% at wizard level 1, +2% per level, at most 50%), or "Lucky! Your ingredients are safe." The liquids are always free. "Try again" writes a new recipe.
- **Batches** (from math level 12, the multiplication levels): brew 2–5 potions at once: "Each potion needs 5. Brew 3 potions." The rare items are used once per potion.
- **What each potion needs** (spec 04 §3.2): Heart: 2 herb lines · Hint: 1 herb line + 1 stone · Power: 1 herb line + 2 stones · Second chance: 1 herb line + 1 stone + 1 creature part · Super: 1 herb line + 2 sky items + 1 treasure. Plus the liquid line.
- **Herbs from fights:** every won fight now also drops herbs, 1–2 at the first math levels, 2–3 from level 7, 2–4 from 13, 3–5 from 22 (spec 04 §6), besides the usual item.
- **Tests:** 6 new brewing tests (98 in all): every potion at all 36 levels, amounts within what the student owns, the jug fits every amount, batches, checking.

**My proposals (please approve or change)**
- The herbs drop **in every won fight** (spec 04 says drops grow with the level; I added herbs to every fight so that potions do not take many more fights than before, even for a student who plays well and gets rare items).
- The rare items are not a math line (spec: "herbs carry the math").
- At the fraction and decimal levels the herb lines are whole numbers from a review level when the level itself has no whole answers (for example "Measure 2 × 5 − 8" at level 27), and the liquid line carries the fractions and decimals.

**How to check**
1. Win a few fights: the victory window shows the item and the herbs (for example "Seed + Leaf ×2").
2. Home → cauldron → Heart potion: the brewing screen. Read the recipe, set the jars and the jug, tap Brew!
3. Put a wrong amount on purpose: the worked example and the loss roll.
4. Teacher area → demo → math level 16 → Home → Power potion: choose the stones and ×3: a batch.
5. Demo math level 27 or 30: the jug in cup fractions or litres.

### Step 7, round 2 (after your check) ✅ (checked by the owner)

**Your three proposals are approved** (herbs from every win, rare items are not math, review herb lines at the fraction/decimal levels).

**What changed**
- **Effects:** the cauldron steams all the time, and harder while brewing. Success: the potion rises out of the cauldron in a golden glow, then the "ready" window. Failure: a dark puff of smoke, then the worked example.
- **Brew another:** the "ready" window has **Brew another 🫕** (back to the recipe list, any potion). The brewing screen has a **📜 button** next to 🏡 to go back to the recipes, and the failure window has **📜 Back to the recipes**.
- **Herb amounts vary:** the amounts were often 2 for two reasons. At some levels the level's own problems can't make small numbers (level 5 starts at 10). Also, a big first line left only 2 for the second line. Now the amount is chosen among everything that fits, never mostly the smallest. It is a problem of the level itself 9 times in 10, otherwise from a review level, and room is left for the next line. A test checks that 2 is rare.
- **More herbs:** every win drops 3–5 herbs (4–6 from math level 7, 5–8 from 13, 6–9 from 22), so an average student has plenty for potions.
- **Batches:** if you don't have enough of a chosen rare item, other items of the same kind fill in. The recipe card lists what goes in and says "♻️ Not enough of what you chose, so the cauldron uses other items of the same kind." The batch size only stops where all your items of that kind run out. A batch line now asks for 2–9 herbs per potion.
- **Liquid lines are stories** in the jug's unit, not only a calculation:
  - "Pour 15 drops, then 7 drops more." · "The pitcher has 60 drops. You pour 30 drops out of it. Pour in what is left."
  - "The pitcher is ⅜ full. You pour ⅖ out of it. Pour in what is left (cups)." · "The potion needs 63 drops. 28 drops are already in. Pour the rest."
  - "You poured 7 drops out of the pitcher and 2 were left. Pour as much as it had at first." · "Share 60 drops equally among 6 bottles. Pour one bottle." · "6 bottles have 8 drops each. Pour them all."
  - "10 times the small recipe of 57 drops." · "Pour ¼ of 64 drops." · "¼ cup for each potion. The recipe is for 9 potions." · "Pour ⅞ of the 9/10 cup." · "Pour 80% of 170 drops."
  - Equivalent fractions and fraction division use a **scoop**: "The recipe says ¼ cup, but your scoop holds ⅛ cup. Pour that many scoops." · "Your scoop holds ⅛ cup. How many scoops make 6 cups?"
  - Decimal problems always use litres (no more "82.6 drops"). Problems that are not an amount ("4/12 = 1/□") are not used for liquids.
- **Proportions (ratio lines):** from the easy step 16 (after division), about 1 recipe in 3 has a ratio line tied to the first herb:
  - "For every 3 🍃 leaves in this recipe, pour 15 drops." The amount of leaves is not written: it is the answer of the leaf line above (9 leaves → 45 drops). (Your comment: do not say the amount.)
  - in the Heart potion between the two herbs: "For every 2 🍃 leaves in this recipe, put in 3." (6 leaves → 9 grass)
  - At the fraction levels the liquid is in cups ("for every 2 leaves, ¾ cup"), at the decimal levels in litres ("for every 3 leaves, 0.25 L").
  - The worked example shows the leaves in groups with "+15" under each group.
- **Hebrew:** calculations in recipe lines read left to right ("3 × 5 − 9" was shown reversed).
- **Tests:** 4 new brewing tests (102 in all): herb amounts vary, ratio lines, filling in rare items, liquid lines.

**Owner decisions**
- **Ratio lines** from the easy step 16, in about 1 recipe of 3: **approved by the owner**, without writing the amount of the first herb (the student uses the answer of the line above).

**How to check**
1. Demo math level 17 → Home → cauldron → Heart: watch the steam; brew right (the potion rises) and wrong (the smoke). In the "ready" window, tap **Brew another**.
2. On the brewing screen, tap 📜 to go back to the recipes.
3. Keep 1 Fire stone and a few other stones → Power potion → choose the Fire stone ×4: the card fills in with other stones.
4. Brew a few recipes at levels 3–10: the herb amounts vary; the liquid lines are stories.
5. Levels 17+ (a few recipes): a ratio line. Levels 24, 27, 30, 33: cups, scoops and litres.

---

## Step 8: The shop ✅ (checked by the owner)

**Goal:** spec 04 §4. Buying is the math: to buy, the student answers the merchant's checkout task, and pays the real price.

**What changed**
- **The checkout screen:** the merchant asks one task about this purchase, at the **easy step** (one math level below the student's). The task uses the **real price**, the student's **real coin balance**, and today's **real sale**. Two kinds of input:
  - the **coin tray** at the counting levels: tap copper 🟤 (1), silver ⚪ (10) and gold 🟡 (100) coins onto the counter; tap a coin on the counter to take it back; then **Pay**. Coins are grouped in fives.
  - **answer buttons** for the rest.
- **The tasks by easy-step level** (spec 04 §4.2):
  - 1–6: "The heart potion costs 15. 8 are already on the counter. Put the rest." · "The candle costs 10. Put the coins on the counter." (silver from 5)
  - 7: "The plant costs 40 copper. How many silver coins is that?"
  - 8–10: "The candle costs 10. You pay with 50. How much change do you get?" · "You have 85 coins. The rug costs 30. How many will you have left?" (gold coins from 8)
  - 11–14: "3 × Heart potion at 15 each." · "The plant costs 4 silver and 5 copper. How many copper is that?"
  - 15–16: "Heart potion costs 8 each. You put 40 aside. How many can you buy?" · "Pay 40 in 4 equal bags. How many coins in each bag?"
  - 17: change and what is left with hundreds · 18: "2 gold, 2 silver, 0 copper: how many copper?" · 19–20: several potions, equal bags · 21: what is left with your real balance in thousands
  - 22–23: "Sale today! The violin costs 55, ⅕ off. How much do you pay?" · 24: "3 potions at 15 each, and a coupon for 10 off" · 25–27: "⅓ off", "¾ of the price"
  - 28: "You have 34.7 silver. The potion costs 1.5 silver. How much silver will you have left?" · 29: "It costs 4.5 silver. How many copper is that?" · 30: bulk potions and equal bags
  - 31–32: "⅔ of the price, then ½ of that" · 33: "1.5 silver each, 3 potions" · 34–35: "25% off" · 36: "20% off 60, you pay with 100: how much change?"
  - When this purchase does not fit the level's task (for example an item that is not on sale at the fraction levels), the task comes from the level below (review).
- **Wrong answer:** "Not quite. Try again!" After **2 wrong tries** the merchant shows a worked example (the calculation, and the coins for money amounts), then a **new task of the same kind** (spec 04 §4.1). The item is bought only after a right answer. Every answer counts toward the math level (½ up, 1 down), and a purchase gives +3 XP.
- **The daily sale** (spec 04 §4.3): 3 items a day, from today's shelf and the potions, with a red 🏷️ tag. The sale's form follows the level: "5 off" / "10 off" before the fraction levels (the new price is shown), then ½ price and ⅕ off, ⅓ off and ¾ of the price, a fraction of a fraction, then 10–50% off. From the fraction levels the tag shows only the form, because working out the price is the task. The student pays the real sale price.
- **Buying several potions** (1–5 at once) from the multiplication levels: a "How many?" choice in the item's window.
- **The wallet:** the coins are shown as gold, silver and copper (237 = 2 🟡 3 ⚪ 7 🟤) in the shop and at checkout (spec 04 §4.4).
- The old "the merchant asks you a question" screen is gone.
- **Tests:** 5 new shop tests (107 in all): money, every level and price gives a right task and the real price, each band's tasks, sales, a new task of the same kind.

**My proposals (please approve or change)**
1. At the counting levels, when the price is bigger than the level's numbers, part of the price is **already on the counter** and the student puts the rest (spec example "A candle costs 7" is below the real prices, which start at 10).
2. Some tasks use the student's **real balance** ("You have 85 coins… how many will you have left?").
3. Buying **several potions at once** (up to 5) from the multiplication levels.
4. **The sale:** 3 items a day. Before the fraction levels the sale is 5 or 10 copper off and the new price is shown; from then on the student works out the sale price.
5. At level 24 (order of operations), the task "3 potions at 15 and a coupon for 10 off" uses a real coupon, only when buying several potions.

**How to check**
1. Teacher area → demo → math level 4 → Shop → a heart potion: the coin tray ("8 are already on the counter. Put the rest."). Pay wrong twice: the worked example and a new task.
2. Demo level 9: buy a decoration: change or "how many will you have left".
3. Demo level 14 → Potions → Heart → ×3: "3 × Heart potion at 15 each".
4. Demo level 24: look for the red 🏷️ sale tags; buy a sale item: "⅕ off".
5. Demo level 29 and 35: prices in silver with decimals; percent sales.

### Step 8, round 2 (after your check) ✅ (checked by the owner)

**Your decisions:** the coins already on the counter at the counting levels are good (the tray makes the difference); the level 24 coupon is approved; real balance and several potions stay as built.

**What changed**
- **A fee for wrong answers:** each wrong answer may cost a fee of a tenth of the price (at least 1 coin). The chance is the same as losing ingredients in brewing: 10% at wizard level 1, +2% per level, at most 50%. "Not quite. Try again! The merchant kept a fee of 7 🪙."
- **The side walls:**
  - right wall: **potion shelves**; tap them for the potions;
  - left wall: a **wardrobe** (the robes);
  - left corner: a **mannequin** with a hat and a necklace (the accessories).
  Each glows on hover and opens its own list. The buttons under the room still work.
- **Fixed:** the result of the last purchase ("✅ 50 − 10 = 40") no longer shows when you buy the next item.
- **Stacks and changing coins:** on the counter, every 10 coins of one kind stand in a stack, with a ⇄ button that changes them for 1 coin of the next kind (10 copper → 1 silver, 10 silver → 1 gold). Tapping a stack takes all 10 back.
- **The coin tray as help** (from easy step 8, tasks with answer buttons whose answer is a number of coins): a "🪙 Use the coin tray (help)" button opens the tray to model the money. With help, the answer counts **¼ instead of ½** toward moving up the math level (moving down stays 1), and the purchase gives **2 XP instead of 3**.
- **Sales the student can work out:** "10 off" no longer shows the new price when the student's level can subtract it (from easy step 3). The task is then the sale: "Sale today! The telescope costs 80, 10 off. How much do you pay?" On the coin tray at the counting levels: "…Put the sale price on the counter." Only at the addition levels (easy steps 1–2), or when the numbers are too big for the level, is the new price shown.
- **Tests:** 2 new shop tests (109 in all).

**How to check**
1. Demo level 9 → Shop: the wardrobe, the mannequin and the potion shelves open their lists.
2. A "10 off" item: the merchant asks you to work out the sale price. Tap **Use the coin tray (help)**, put 12 copper: a stack of 10 with ⇄; tap it for 1 silver.
3. Answer wrong a few times: sometimes the merchant keeps a fee.
4. Buy two things in a row: the second checkout starts clean.

### Step 8, round 3 (after your check)
- **Your decision:** the coin-tray help counts ¼ toward moving up and gives 1 XP less: approved.
- The Potions / Robes and accessories buttons under the shop room are gone: the potion shelves, the wardrobe and the mannequin open the lists.
- Coin tray: the numbers on the coins have no shadow; a side display shows the sum on the tray ("On the tray: 23 🪙").
- **The shop room is your picture** (art/shop-room.webp). The wardrobe (robes), the mannequin (accessories) and the potion shelves (potions) are tap areas: they glow softly every few seconds and light up on hover. Today's 8 items stand on the two middle shelves with their prices on the painted tags; the merchant stands behind the counter, the next cauldron is on the counter.

### Step 8, round 4 (after your check)
- **The shop sign in Hebrew:** the painted "SHOP" sign is covered by a matching purple sign that says "חנות" when the game is in Hebrew.
- **Furniture for Home** (your request: Home should be something the student wants to decorate, with big items as long-term goals):
  - 10 big pieces, each with its own large drawing: couch 220, coffee table 110, armchair 130, bookcase 160, fireplace 260 (the fire flickers), bed 240, floor lamp 70, desk 150, piano 320, aquarium 180.
  - In the shop: a **furniture catalog** book on the counter opens the list with big pictures. Buying works like any other item (the checkout task).
  - At Home: furniture stands on the floor at its full size, smaller toward the back wall, and the student can drag it anywhere (🧹 puts it back). The default places leave the cauldron free.
  - Furniture is not on the daily shelves (they keep the small decorations) and is never given as a level-up gift.
- **My proposal:** the prices above (70–320) make furniture a goal of several days. More pieces (a rug set, curtains, a dragon statue, a bean bag…) can be added any time; tell me what you'd like.

**How to check**
1. Switch to Hebrew in the shop: the sign says חנות.
2. Shop → tap the book on the counter: the furniture catalog. Buy a couch.
3. Home: the couch is in the room; drag it around.

---

## Step 9: The Artificer ✅ (checked by the owner)

**Goal:** spec 04 §5: forging a magic item = a recipe (the blueprint) + a payment.

**What changed**
- **The workshop opens at wizard level 8** (it was math level 8), with the same "💡 A light in the window!" moment.
- **Forging has two steps:**
  1. **The blueprint** on the brewing screen ("Step 1 of 2"): the chosen rare ingredients, two herb lines and a liquid line, measured with the jars and the jug. Right: the item glows over the cauldron.
  2. **The payment** at the counter with the artificer ("Step 2 of 2"): a checkout task for the price, with the coin tray or answer buttons, the fee and the help, like the shop.
- **Nothing is used up and no coins are paid until both steps are done.** A wrong blueprint: the worked example and the brewing loss rule (the ingredients may be lost; the coins never are).
- **Epic item** (150 coins): 1 epic ingredient + herb lines + a liquid, at the easy step; the payment at the easy step.
- **Legendary upgrade** (300 coins): 1 legendary + 1 epic ingredient, at the student's **current** level, with a **multi-step line**:
  - from the fraction levels: "The legendary item needs 3 times the epic recipe's 12 drops, plus ¼ of it more."
  - from multiplication: "…4 times the epic recipe's 9 drops, plus 6 more."
  - before multiplication: "The epic recipe had 26 drops. The legendary item needs it twice, plus 18 more."
  - The payment is at the current level, with **a discount for a returning customer** (its form follows the level like the shop's sales: 5/10 off, ½ price, ⅓ off, 25% off…): "A discount for a returning customer! The legendary amulet costs 300, 25% off. How much do you pay?"
- The old placeholder question screen for crafting and forging is removed.
- **Tests:** 1 new test (110 in all): epic blueprints at the easy step, legendary at the current level with a right multi-step line.

**My proposals (please approve or change)**
1. The epic blueprint keeps the reading game's ingredients (1 epic + common), where the common ones are the herb lines; the legendary one is 1 legendary + 1 epic.
2. If the student leaves during the payment, nothing is lost, and the blueprint has to be made again.
3. The returning customer's discount uses the shop's sale forms at the current level.

**How to check**
1. Teacher area → demo → wizard level 7, then 8: the workshop lights up.
2. Workshop → Make (you need an epic ingredient such as ⭐ Star, herbs and 150 coins): the blueprint, then the payment.
3. After it is made: Upgrade (a legendary ingredient such as 💎 Diamond + an epic one + 300 coins): the multi-step line and the returning customer's discount.
4. Make a wrong blueprint on purpose: the smoke and the loss roll; your coins stay.

### Step 9, round 2 (after your check) ✅ (checked by the owner)
- **Fixed: forging did not start.** When a student had only a few herbs of each kind (2–4), making the recipe crashed: "Start" closed the window and nothing happened. The same bug could also stop brewing potions with few herbs. A new test checks every recipe at every level with few herbs (111 tests).
- **The workshop is your picture** (art/workshop-room.webp). The artificer stands behind the workbench; the ingredient jars, the stray wizard and the cauldron are gone.
- **Forging is smithing, not brewing:** the blueprint screen has an **anvil** with a glowing ingot. Sparks fly from it, and the hammer strikes when you tap **🔨 Forge!**. The liquid is **molten silver** 🔥. A right blueprint: the item glows over the anvil; a wrong one: a puff of smoke.

**How to check:** demo wizard level 9 → Workshop → Make (any item) → pick a sky item → Start: the anvil. Measure, tap 🔨 Forge!, then pay the artificer.

### Step 9, round 3 (after your check) ✅ (checked by the owner)
- **Straight to the payment:** a right blueprint goes directly to the artificer's counter. A green note at the top says "✨ The blueprint works! Step 2 of 2: pay the artificer for…". A **✖ Stop forging** button asks "Stop forging?" and goes back to the workshop: nothing is used and no coins are paid.
- **The mannequin at Home** (in front of the wardrobe, once the workshop is open) wears every forged item: the amulet at the neck, the belt at the waist, the staff at its side, blue for epic and gold for legendary. New kinds of items can get a place on it later.
- **Tap the mannequin:** "Your magic items" lists every forged item. Each has **✓ I take it** / **Stays at home**. Only the items you take work on quests (in the item bar and on the map). A new item is taken automatically.

**How to check:** forge an item (it goes straight to the payment; try ✖ Stop forging once), then go Home and tap the mannequin.
- **Using items in a fight** (your report: the staff did not seem to be there): the item buttons under the battle now show the item's name and "tap to use · 1 use left" (the amulet: "works by itself"), and the first fight with a new item says "Staff of banishing is ready! Tap it under the battle to use it." The staff works on any monster except a boss.
- **The mannequin, fixed** (your report: "Leave at home" and "Take it" seemed reversed — the button showed the item's state, not what tapping does):
  - Each item now says where it is ("🎒 With you on quests" in green / "🏠 At home, on the mannequin" in gold), and the button says what it does ("Leave at home 🏠" / "Take it 🎒").
  - **The mannequin holds only the items left at home**, up to 2 of each kind (room for the second one is ready for when more items come). An item you take disappears from it, so you can see at a glance what is with you.

---

## Step 10: Tutorial and polish ✅ (checked by the owner)

**Goal:** a new student can start without help (HANDOFF phase 10).

**What changed**
- **A new math tutorial with Pip the owl** (it replaces the reading game's word tutorial). It plays once right after a new hero is created; Pip on the map replays it any time. About two minutes, in English or Hebrew, with Pip's voice in the game's language (Hebrew voice when the device has one; 🔊 Hear again, Voice on/off, Skip):
  1. The map: tap the city gate.
  2. A monster: the Ember Imp is fire 🔥; the badge shows it is weak to water 💧 and ice 🧊.
  3. The spell book: open it; spell 2 is water, 5 ice, 3 fire, 4 stone; close it.
  4. The cards: "Which card casts spell 2, water?" (1 + 1, 2 + 1, 3 + 1). From math level 5 the student also says the answer to cast it, like in the game.
  5. A wrong card is explained: fire heals a fire monster, stone does nothing, and the monster attacks (watch your HP).
  6. "Now you": which card casts spell 5, ice? The monster is beaten: coins and herbs.
  7. A short look at Home (brewing, decorating) and the shop (potions, clothes, furniture; paying is math too).
  The tutorial never changes the student's level, XP, coins or HP; only "tutorial done" is saved.
- **Sounds:** coins clink on the counter (and a little cascade when you pay or change 10 coins), the hammer clangs on the anvil, the cauldron bubbles, the jars tick and the jug drips.
- **Village Helper** stays hidden: the notice board on the map says "Coming soon" (as before).
- **Fixed:** tapping the workshop on the map still checked math level 8; it now checks wizard level 8 (like its light).

**How to check**
1. Make a new hero (or tap Pip the owl on the map): the tutorial. Try a wrong card once.
2. Switch to Hebrew and replay it: Hebrew text and voice.
3. Shop, brew and forge with the sound on.
- Fixed after your check: in the tutorial, "say the spell" showed 3 answers in an odd 2 + 1 layout. It now looks like the game: the problem written large above, 4 answers in a 2 × 2 grid. Step 10 is approved.

---

## Step 11: Login and saving (in parts; part 1 on the test site)

**Goal:** progress saves to a **new, separate** Google Sheet with its own Apps Script, and the teacher sees the math level (HANDOFF §8).

**What I prepared**
- **The progress sheet's script** (`tools/apps-script/progress/Code.gs`), written new for Math Wizard (not a copy of the reading game's, so nothing of the reading game is opened or touched). It loads and saves students (the copy with more answers wins, like the game), keeps students the teacher deleted from coming back, and serves the teacher area (password, list, one student, delete; 5 wrong passwords lock it for 10 minutes). A profile of any size fits (it is split over several cells).
- **The e-mail code service** for the installed app (`tools/apps-script/email-codes/Code.gs`), its own project as you decided: a 6-digit code by e-mail (a minute between codes, 10 minutes to use it, 5 wrong tries lock it). It keeps no names and no addresses: only a one-way hash, to count app users for the teacher area.
- Both scripts were tested here against a pretend Google Sheet: saving and loading a large profile, conflicts, the teacher list, deleting, the password lock, sending and checking codes.
- The game now also saves the **wizard level**, and the teacher table has a **Wizard** column.
- **Setup steps for you:** `tools/apps-script/SETUP.md`.

**Next:** you create the two services in `learningtoread.app@gmail.com` (about 10 minutes) and send me the two URLs; I put them in the game, test saving on the test site, and report.
- **The game's new name** (owner): **SpellQuest: Math Adventure** / **לחשים: הרפתקת חשבון**: the page title (it follows the language), the login and start screens, the installed app's name (short: SpellQuest), and the app's code e-mail. The new icon is your picture of the wizard hat with + − × ÷ (app icons, the Apple icon and the browser tab).
- **Waiting:** your logging spec (it may change how the progress sheet works), before you set up the two services.

### Step 11, part 1: the start screen with three modes ✅ (on the test site, waiting for your check)
The shared login and privacy design (from the design session; kept locally, not in this public repo) replaces the old plan for this step. Your decisions: the two games **share the reading game's counting service** (I prepare its small change, you deploy it), and the step is built **in parts**.
- **The start screen** (the same in the web version and the installed app): heroes on this device first ("Continue as:", each with its badge), then three modes:
  - 🏫 **I'm a school student**: the student number, or "I am new" (the school sheet, the school code, class lists and teacher approval come in part 2).
  - 🏠 **Play at home**: a parent's e-mail code (it opens in part 3, with the counting service; until then it says so and suggests offline play).
  - 📴 **Play offline**: make a hero right away; nothing is sent anywhere.
- **Device heroes** (home and offline) are listed on the start screen; school heroes are not (shared devices: each student types their number). The menu shows the hero's badge (🏫 / 🏠 / 📴).
- **Only school heroes are saved online.** A device hero keeps no real name or class, and the game asks the browser to keep its data.
- **💾 Save my hero** (menu, device heroes) downloads a backup file; **📂 Load a hero** (start screen) restores it on any device. The file is checked (game, version, a checksum), has no real name or class, and a school hero cannot be loaded this way.
- **🔒 Privacy** (start screen) explains in both languages what each mode saves and where.
- Earlier in this step: the new name **SpellQuest: Math Adventure / לחשים: הרפתקת חשבון**. The new icon is your wizard hat with + − × ÷ (also the browser tab icon).

**How to check:** open the test site → the start screen. Play offline (a hero is made, the tutorial runs), save the hero file from the menu, log out: the hero is listed; Load a hero restores it. Tap 🔒 Privacy.
- After your check: the menu button is now **🚪 Switch hero** (not every player is a student), and "Load a hero" is a small link at the bottom of the start screen ("Have a backup file of your hero? 📂 Load a hero"): it restores a home or offline hero from its 💾 backup file on a new device or after the browser's data was cleared.

### Step 11, part 2: school mode ✅ (live on the test site, waiting for your check)
- **The school sheet's script** (`tools/apps-script/progress/Code.gs`, rewritten): everything is a POST (nothing secret in a URL); loading returns **game data only** (never the real name or class) and is **limited** per number and per minute; only devices with the **school code** can load or save; the teacher password locks after 5 wrong tries.
- **School code:** the first time school mode is used on a device, it asks for the code (it is on the login cards). The device keeps a school token, so changing the code later does not stop devices that are already set up.
- **"I am new"** registers a **waiting** student (real name and class go to the sheet only). The student plays at once.
- **The teacher area** (once the sheet is set up):
  - **⏳ Waiting for approval:** ✅ Student (joins the class) or ❌ Not a student (removed; that device moves the hero to offline play, keeping its progress). A student waiting 14+ days is marked.
  - **🏫 Classes and login cards:** type a class and a list of names → each gets a student number → **🖨 Print cards** (name, class, number, school code, 8 to a page, to cut out). A student signs in with the number from the card and makes the hero.
  - **🔑 School code:** see and change it.
- **The real name and class are never on the device** (not in the local copy, not in the game data, not in the backup file); the teacher sees them from the sheet.
- **Moving a hero** (tap the mode badge next to the name in the menu): an offline or home hero can **🏫 Join my school** (name and class; its progress goes to the sheet; the teacher approves) or save a backup; a school hero can **📴 Also play on this device** (a copy; the school copy stays with the teacher); an offline hero can sign up to play at home (part 3).
- The installed app can be a school device too (school mode saves online in the app as well).
- I removed the separate e-mail service I wrote earlier: home players will use the reading game's counting service (your decision).
- Everything was tested here with the real script running against a pretend sheet: a new student (code, "I am new", waiting), the teacher list, adding a class, the login cards, a card login, approve, reject (the device moves the hero offline), delete, joining the school from offline, copying a school hero.

**What you need to do:** set up the school sheet with the steps in `tools/apps-script/SETUP.md` (about 5 minutes; you choose a teacher password and a school code) and send me the URL. I then put it in the game and we check it together on the test site.
- **The school sheet is set up** (2026-10-12), in `learningtoread.app@gmail.com`: the sheet **SpellQuest Math – progress** and its script, a separate Apps Script project with the same name (Google's editor would not open from the sheet with several accounts signed in, so the script finds the sheet by `SHEET_ID`). You set the teacher password and the school code and allowed the script; I did the rest in your Chrome. The game on the test site now saves school heroes to it.

---

## 🚀 Live (2026-10-12)
The owner approved going live. `main` now has everything up to step 11 part 2, so the game is at https://eldar1234334.github.io/learning-math/ (the test site stays at /test/). Still to come: step 11 part 3 (🏠 play at home, with the reading game's counting service), then the Village Helper spec.

### Step 11, part 3: play at home (live 2026-10-11)
- **🏠 Play at home is on:** a parent's e-mail gets a 6-digit code from the counting service **shared with the reading game** (every call says `game: 'math'`). After the code, the student makes a 🏠 hero that lives on the device only; the e-mail address is not kept anywhere in the game.
- **"Played today":** on the first play of each day, a home hero's device sends only `+1` with the game and the date (no id, nothing that tells devices or people apart).
- **Teacher area:** "🏠 Home players: … total · … new this week · … new today", and "played today / this week" once the service reports it.
- **The shared counting service now knows the game:** each sign-up is stored with its game (older rows count as the reading game's, and a call without a game is still the reading game's, so the reading game works unchanged). "Played today" is counted per game and day, and the code e-mail names the right game (the math one also in Hebrew). One family playing both games is counted once in each. The owner deployed it as a new version (same URL); its code stays in the owner's Apps Script project, not in this repo. Checked live with the owner: the code e-mail, sign-up, and the teacher area's home counts.

## Phase 12: schools and roles (the owner's schools spec, math game only)
The owner's spec (kept locally, not in this repo) turns the one-school sheet into many schools: an **Admin** (the game's owner) with a list of schools and their counts only, and each school keeping all of its students' data in its own Google account. Built in parts on `test-phase12`.

### Part 1: the Admin's school list (test site)
- **🔑 Admin** (a new link at the bottom of the start screen, only once the list is set up) is separate from the **🔧 Teacher area**. The Admin signs in with an e-mail code (only the Admin's e-mail gets one; every other e-mail gets the same answer and no mail). It shows each school's name, code, status, students, played today, last active and script version, never a student. The Admin adds a school (name and the Gmail that keeps its data), suspends or resumes it, or removes it from the list.
- **The Admin's list** (`tools/apps-script/registry/Code.gs`, its own project and sheet in the Admin's account): a school code gives that school's own link. A school joins once with a one-time setup token, and only from the Gmail the Admin entered (the list checks it). It asks each school for its counts daily and on "Ask the schools for counts".
- **The school script** (version 2): answers the list's check and its counts (approved students, played today, last active; never names); a new school code is first checked with the list, so two schools never share a code. A school that is not on the list works as before.
- **Students:** the school code is looked up in the list, and the device keeps its school's link and name ("🏫 Sunny School" above the number). A suspended school's code says that its access has ended. If the list cannot be reached, a device that already has its school keeps working.
- Tested with a mock of Google's services: 30 checks (sign-in, single-use codes, wrong owner, used token, taken code, suspended, counts with no names, rate limits) and the game screens.

### Part 2: teachers sign in with an e-mail code (test site)
- **🔧 Teacher area sign-in:** the school code (only on a device that does not know its school yet), then the teacher's e-mail; the school's own script e-mails a 6-digit code (10 minutes, once, 5 tries). Any other e-mail gets the same answer and no mail. "Use the teacher password instead" still works and counts as the school owner, until the owner retires it.
- **Roles:** the **school owner** is the Google account that runs the school's script (and anyone the owner marks as "also a school owner"). Only the owner sees **👩‍🏫 Teachers** (add by e-mail with their classes, or all classes; remove: signed out at once) and the school code. A **teacher** sees, opens, approves and deletes only students of their own classes; the school script checks this on every call, not only the screen.
- **Log tab** in the school's sheet: sign-ins, staff changes, approvals, deletions, code changes, with the staff e-mail.
- The 🏠 home-players count shows only with the teacher password (it belongs to the Admin; an e-mail sign-in must not use up that service's wrong-key tries).
- School script version 3. Mock tests: 20 staff checks (codes, roles, class limits, removal, log) and the 30 checks of part 1; the game screens tried as owner and as a teacher.

### Part 3: the class menu and the waiting list (test site)
- **"I am new" and "Join my school"** pick the class from a menu: the school's class list (the new *Classes* tab). A school without a list yet, or a device that cannot reach it, still types the class. The school script accepts only a class from the list (any upper/lower case; it keeps the list's spelling).
- **The class list** is made from class lists added in the teacher area, and the first time from the classes the students already have. The school owner adds a class with no students yet, or takes one off the menu (its students stay).
- **⏳ Waiting for approval** (red count): tick boxes, a class filter ("All my classes" or one class), Select all, **✅ Approve selected**, **✅ Approve all** (in the filter, with one short question: "Approve 14 students in class 3A?"), **❌ Reject selected**. The name and class can be fixed in the row before approving. A teacher approves or rejects only in their own classes and cannot move a student to another class; the script checks every student.
- School script version 4. Mock tests: 19 class checks, and the 50 checks of parts 1 and 2; the game screens tried ("I am new" with the menu, fixing a name, approve selected, approve all in 4B).

### Part 4: the students list, login cards and "Played today" (test site)
- **Students list:** a class filter ("All my classes" or one class) next to the search; a **Class** column (sortable); tick boxes with a select-all box in the header.
- **🟢 Played today: N of M** for what is shown (the whole school, or one class), by the school script's own time zone (the student's last save today).
- **🖨 Print login cards** (moved from the classes card): for the ticked students, or else everyone shown; "only students who never got a card" leaves out students already printed (the new *Cards* tab; a 🪪 next to their number). The card now also shows the school's name and three short "how to log in" lines in English and Hebrew.
- Not built (yet): minutes played today, and a QR code on the cards.
- School script version 5 (still works with the live game). Mock tests: all 70 checks; the screens tried (class filter, played today, ticking, cards for ticked, cards for new only).

### Part 5: move to home (test site)
- **🏠 Move to home** next to each student's name (teacher area): a hand-over file to download, or the file e-mailed to a parent by the school's own Gmail (the address is not kept). The file is the game's backup file, an offline hero with all its progress and no real name or class; on any device, "Load a hero" opens it, and the 📴 badge offers the parent's e-mail sign-up for home play.
- The student's row becomes **moved**: no longer counted as a player. For 30 days the name, class and progress stay, and the school owner can **↩ Undo** (the *Moved* tab and the "🏠 Moved to home" card); after that only the number and the date stay, so the number is never used again. A teacher moves only students of their classes. Moves and undos go to the Log.
- **The child's device:** the next load or save hears "moved"; the hero becomes a device hero with all its progress, and the game offers the parent's e-mail sign-up.
- **The student moves their own wizard** ("🏠 Move my wizard to home" in the hero's mode menu): when the school owner turns it on (a new setting in the school code card, off by default), or always when the school's access has ended.
- **A suspended school** (the Admin's list): school heroes check at most once an hour when online. Then "School access has ended": no school play or saving; **🏠 Keep my wizard (move to home)**.
- School script version 6. Mock tests: 22 move checks and the 70 earlier checks; the game's 111 tests; tried end to end in the game (move, the device turning home, the file on a new device, a suspended school).

### Part 6: the Admin screen with counts; the school owner's part (test site)
- **🔑 Admin:** the **🏠 home players** count moved here from the teacher area (the Admin's list asks the counting service for the math game's counts; script properties COUNT_URL and COUNT_KEY of the Admin's list). Schools with an older school script are marked "⚠ update". A school still waiting for setup gets **🔑 New setup token** (the old one stops working). The counts refresh daily and on "Ask the schools for counts".
- **🔧 Teacher area:** the school owner's cards (👩‍🏫 Teachers, the school code and the self-move setting) are grouped at the bottom under **🏫 School owner** (schools spec §7: the school owner's screen is the teacher screen with extra parts). Teachers do not see it.
- Admin's list script version 2. Mock tests: 34 list checks; the screens tried.
- Still open from spec §7 (a later part, if wanted): rename classes and move students between classes, "New school year", school settings (time zone, approve new students automatically, require real name), export / delete all school data.

### Part 7: a new school sets itself up; the checklist (test site)
- **The school script makes its own sheet:** a new school pastes `Code.gs` into a new Apps Script project in its own Google account, adds SCHOOL_CODE, and runs **setupSchool** once: it makes the sheet "SpellQuest Math – school (students)" in that account with all its tabs, and asks for the permissions. No template sheet to copy, and no teacher password (the school owner signs in by e-mail code).
- **tools/apps-script/SETUP-school.md:** the Admin's checklist for the setup call (before, on, and after the call; updates; what stays where).
- School script version 7. Mock tests: 11 new-school checks (a second school in another account: its own sheet and code, the list sends each code to its own school, no student data in the other school or in the Admin's list), and all 96 earlier checks.
- **Dry run (2026-10-12), a real second school:** "HLA (test)" set up by the checklist in the Google Workspace account edadon@hlacharterschool.org (the owner's teacher account): `setupSchool` made its own sheet in that account; the web app could be deployed for "Anyone" (the school's Workspace allows it); `linkRegistry` joined the Admin's list as S2. Checked live: the code HLA-TEST reaches only HLA's script, the first school refuses it, and HLA's counts need the list's key. Learned: the first deploy can fail with "Something went wrong" when several Google accounts are signed in (reload and deploy again), and the deploy asks "Authorize access" once more (both are now in SETUP-school.md).

### Part 8: retiring the old teacher password (test site)
- **🏫 School owner → "The old teacher password still opens this area"**: the school owner turns it off once everyone signs in by e-mail, and can turn it on again. Only someone signed in **by e-mail** can turn it off (so nobody is locked out); then the password answers "This school no longer uses the teacher password". New schools never had one.
- The owner decides when; my suggestion: after phase 12 is live and you have signed in by e-mail on the live site.
- School script version 8. Mock tests: 25 staff checks (5 new), 112 in all; the game's 111 tests.

## 🚀 Phase 12 live (2026-10-12)
The owner approved going live: `main` has the schools and roles (parts 1–8). Devices already in the first school keep working; the old teacher password still works until the school owner turns it off.
- **Fix (2026-10-12):** after a school turns its teacher password off, the sign-in box no longer offers "Use the teacher password instead" (the school script says how staff sign in: action `signin`, version 9). A device that does not know its school yet asks the school after the code, and explains instead of asking for the password.

### The school kit: one link for a new school (test site)
- **🔑 Admin → ➕ New school** now also takes the **school code**. The Admin's list then makes a **school kit**: a copy of the kit template (a Google Sheet with the school script inside) with that school's name, code, the list's link and the one-time setup token in its *Setup* tab, shared "anyone with the link can view". The Admin sends one link (…/copy).
- **The school owner:** opens the link signed in to the school's Google account → **Make a copy** → menu **🧙 SpellQuest → Set up my school** → **Allow**. The script (version 10) reads the Setup tab and makes the school's tabs in that copy. Google lets only the owner deploy a web app, so it then explains one short step (Extensions → Apps Script → Deploy → Web app, Anyone) and takes the link by itself on the next run (or a pasted link); then it joins the Admin's list, marks the token used and shows "✅ … is ready" with the school code and the next steps. (A first version deployed through the Apps Script API: that needs the API switched on in each script's hidden Cloud project, which a school owner cannot reasonably do, so it was dropped.)
- When the school joins, the shared kit goes to the bin by itself; **🔑 New setup token** makes a new kit (the old one goes to the bin). A copy in another Google account cannot join (the token is single-use and only for the Google account the Admin entered).
- The Admin's list (version 3) keeps the template: `makeTemplate()` makes the sheet once; the school script is pasted into it (Extensions → Apps Script) once, and again after each school script change.
- Mock tests: 14 kit checks, and all 114 earlier checks; the game's 111 tests.
- **Fix from the HLA test (2026-10-12):** before the school owner deployed anything, Google already gave the kit a web app link that did not answer, and a Google Workspace account writes its links as `…/a/macros/<domain>/s/<id>/exec`. The kit (school script version 11) now uses a link only after checking that it answers as the school's web app, and writes Workspace links the normal way.
- **From the HLA kit test (2026-10-12):** the kit test school joined the list. Google's own lookup of a sheet's web app link does not give a working link, so the last step is: deploy in the Apps Script tab, copy the Web app URL, paste it into the kit's box. That box (school script version 12) now says exactly that, in English and Hebrew. The Admin's list (version 4) never gives a removed school's number to a new school (a counter; it had reused S1).
- **Fix (2026-10-12):** the installed app (opened from the home screen) ignored the 🔧 Teacher area and 🔑 Admin links: a rule from the reading game, whose app was only for home players. The app now opens both, like the website.

## 🚀 The school kit live (2026-10-12)
The owner approved going live: `main` has the school kit (the Admin screen's school code, one kit link per school), the clearer last step, numbers never reused, and the staff areas in the installed app.

## Phase 13: small changes (the design session's spec 06, agreed with the owner; the spec stays local)

### ⚡ Quick pack and treasure chests (test site)
- **⚡ Quick pack** on the "Pack your potions" screen (spec 06 §1): the pouch empties to home, then one of each potion type in the potion order (Heart → Hint → Power → Second chance → Super), then more in rounds in the same order until the pouch is full (5, or 6 with the manual at home). The student can still change it with ➖ / ➕.
- **Treasure chests** (§7): on a monster quest, a treasure stop is a drawn chest (wood with gold bands; closed ahead, open with a gold shine once reached), and the chest window's title shows it too. The village keeps its 🧺 basket.
- **Small changes 3–5 (hero), test site:** one item per place: a crown replaces the basic hat, a magic amulet replaces a necklace, a magic staff replaces the star wand. Magic items on the hero with a 👁️ switch in the wardrobe's new **✨ Magic items** tab (the item's effect in quests does not change). Legendary items have a bigger gold halo with sparkles; epic keeps the blue halo. The item buttons and workshop cards still use the earlier glow (to do).
- **Demo run on the 🔑 Admin screen** (the teacher area has one too).
- **Small changes, the rest (test site):** the Quick pack button is yellow like Start the quest. **Legendary glow** also on the item buttons and the workshop cards (a gold halo that pulses slowly, with sparkles). **What I earned** (spec 06 §2): a 🎒 satchel with this quest's items (tap or hover for the panel: grouped by rarity, with the coins), the coins this quest on the journey map, and the summary when a chapter is complete or a run is lost (the coins of a lost run are kept). **Monster variety** (§6): about 40% of normal stops are visitors from other elements; every learned attack element is the right answer at least once per quest (forced near the end of a quest); no more than 2 of the same element in a row; a brand-new student's first quest goes plant → fire → stone → storm. Tests: 111 pass; checked in the browser.
- **Fight and map fixes (test site):** the Quick pack button is gold-outlined (distinct from Start the quest). The weakness badge is signs only: the creature's element sign, the elements it is weak to on red, and the ones that strengthen it on green. The satchel panel is placed on screen (fixed), so the map no longer hides it. The satchel sits on the potion row, a little apart. Signposts are gone from the path (rests and chests remain). After an encounter, "Continue the path ▶" walks to the next circle and starts that encounter. The potion bottles on the fight row now have the pack screen's size.
- **Fixes before going live (2026-10-15):** the weakness badge is the monster's type sign, a green pill with what strengthens it, and a red pill with what it is weak to (the owner's picture). The satchel panel is a page-level panel: it opens below the bag, or above it when there is no room, and never on the map. The 🧪 emoji beside the potion count is the real potion bottle.

## Phase 14: Google sign-in and roles (spec 07, on test-phase14)
Decisions from the owner: Google is an extra option next to the e-mail code (not the main way in); sensitive admin actions ask for an e-mail code again (not the password).
- **G1 (done on the test site):** "Sign in with Google" in the teacher sign-in dialog, as an extra option. The game sends Google's ID token to the school's script in a POST body. The school script checks it with Google's token service (our client ID, the Google issuer, a verified e-mail, not expired), then the staff list decides access, on every request. A Google account not on the staff list gets the same answer as a wrong e-mail. School script version 13. Tests: 11 Google checks (valid owner, other app, other issuer, unverified, expired, non-staff, staff teacher, class limits, removal ends the session, no token).
- **Client ID:** 640886464751-p6vril25pp5g5ijqprcs9o44039let2u.apps.googleusercontent.com (Google Cloud project "SpellQuest", external, testing mode; test users are the owner's and the HLA owner's accounts). It is public; the secret is not used or stored.
- **G2 (done on the test site):** roles on the Staff tab (exactly one owner: "Also a school owner" removed); a removed staff member stays in the sheet as active "no" and is reused if added again; last login per person; sign-out ends the session; per-account rate limit for Google sign-in. School script version 14.
- **G3 (done on the test site):** owner screen has a Log card (sign-ins, staff changes, approvals, code changes, sign-outs); sensitive actions (school code change, turning off the teacher password, and on the Admin's list deleting a school) ask for a 6-digit e-mail code (10 minutes, one use, 5 tries) instead of the password. The Admin's list has its own log of school adds, status changes and deletions.
- **Deviations to report to the owner:** session length is 6 hours (CacheService caps at 6 hours; the spec asked for 8). The audit log keeps the last 200 rows; the one-school-year retention is not built yet (spec 07 §15, owner decision).
- **Tests:** staff-test 39 checks, reg-test 38, newschool 11, gsi-test 11, kit 14, move 22, class 20 (all pass); tests/index.html 111 pass.
- **Next:** G4 (home players by hashed Google ID; the counting script change is for the owner to deploy), G5 (the security checks of spec §12). Going live waits for the owner's check on the test site.

## Phase 16: villager visit, slice 1 (spec 05, on test-phase14; replaces the pop-up tried earlier)
- **Where:** a village site on the quest map opens the visit (the stop used to start the fight screen).
- **Two items per villager:** each item is a round. (1) The amount: the wizard chooses the card that fits the villager's story (one level lower than the current math level), then works out the amount. (2) The item (not for beginners): the wizard chooses the card whose number is the item in the conjuration book, like choosing a spell.
- **Beginners** (math level 1, wizard level up to 2): no conjuration book; each item is only the amount round.
- **Mana (blue bar):** 10 at the start of a visit; every action costs 1, right or wrong. Running out of mana loses the run (the run starts again).
- **Happy meter:** starts at zero, +1 for each right action (3 per item, 2 for beginners). Full = the villager thanks the wizard and says to come back tomorrow; the stop is done.
- **Leave for now:** back to the map, the stop waits, nothing is lost.
- **Logic:** `helper.js`, with `tests/helper.test.js` (13 checks; tests/index.html 124 pass).
- **Not in slice 1:** the other villagers and story types, read-aloud, Hebrew plurals and gender, the endurance potion (it will restore mana), rewards, the score-by-type column, the wizard-level abilities.
- **Open points to confirm:** with mistakes, the wizard crafts more than two items to fill the happy meter; the simple numbers here are not yet the math ladder.

## Phase 17: the village run (spec 05, on test-phase14)
- **Start:** the notice board starts a village run on the journey map (like the gate starts a fight run).
- **Stops:** a village stop is a visit: the villager asks for the two items of a project. The festival (the last stop) is a visit with the festival projects (feast, decorations, music, as far as the student has reached).
- **Projects:** two items each (the first two needs). A project unlocks at the math level of its items.
- **Items:** the conjuration book has 39 items with fixed numbers (the approved list, chair 42 at level 14). The item cards only use numbers the student has reached; times tables from level 13.
- **Steps per item:** beginner (math 1, wizard 1): the answer only. Math level 1: the answer and the item. From math level 2: the card that fits the story (one level lower), the answer, the item.
- **Mana:** 8 + 2 × (wizard level − 1) + 2 × math level. Every action costs one mana, right or wrong (the villagers do not attack). The happy meter fills on right answers. Full = done; no mana = the run is lost.
- **Not in this slice:** the endurance potion, rewards for villagers, read-aloud, Hebrew plurals and gender, score by type, wizard-level abilities. The old village encounter (smileys) is no longer used on this path.
- **Tests:** helper.test.js (14 checks); tests/index.html passes.
- **Mana potion (village visits):** the Heart potion restores 30% of the visit's mana (as it heals 30% of HP in a fight); once per item. Fights keep the Heart potion.
- **Story types (spec 05 §5.1, slice 2):** separate (from level 3), part-part-whole and change (from 4), compare (5), start unknown (6), two steps (9). The result and change stories are as before. The count on screen never shows the answer.
- **Reading support (spec 05 §6, part):** the story is read aloud automatically at math levels 1–12, and the 🔊 button reads it again. Hebrew uses the device's Hebrew voice (silent without one); English uses the device's English voice.
