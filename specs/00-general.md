# Math Wizard: Game Spec v0.3 (general idea)

> Status: **draft for discussion**. This is the high-level concept. Detailed specs (spell list, math curriculum ladder, balancing numbers) will follow as separate documents.
> Base project: `learning-to-read` (Hebrew reading game). Single-file PWA (`index.html`), GitHub Pages, progress saved to a Google Sheet via Apps Script.
> **Repo:** a new, separate repository (already created), started as a copy of `learning-to-read`.

### Changes since v0.2
- **Cards per turn grow with the game level:** 3, then 4 early on, and 5 or more for advanced wizards. Advanced wizards also get **several good options**: an easy problem for a weaker spell, or a hard problem for a stronger one (§3.2.1).
- **New spell type:** area spells (AOE), for fights with groups of monsters (§3.3).
- Shop, brewing and forging problems are **a bit easier than the student's level**, and count toward the math level **with their own rules** (§7.0).
- A failed brew **may lose the ingredients**. The chance **grows** as the wizard levels up (§7.1).
- The most advanced recipe level is **fractions**.
- Confirmed: the incantation step starts at addition and subtraction up to 20.

### Changes since v0.1
- Math scoring decided: **two stages**. Young students only pick a card; from a later level the student also says the answer (§4.1).
- UI is **Hebrew and English with a language toggle** (§2.1).
- HP **carries over** for the whole quest run (§3.5).
- **Property keys removed** for now: spells are keyed to **exact numbers only** (§3.1).
- Shop, brewing and Artificer become **math activities** (§7).

---

## 1. Summary

A math practice adventure for elementary school students (grades 1 to 6). The student plays a wizard or a witch who fights monsters by **casting spells from a spell book**. Each spell is tied to a **number** (for example `3`). On each turn the student picks one of several math problems. The **answer** to that problem is what the wizard casts, and it triggers the matching spell.

The game has two separate progression tracks:
1. **Math level:** slow, adaptive, and based on what the student actually knows.
2. **Game level:** fast and reward-driven. The wizard grows stronger, learns new spells and meets new kinds of monsters.

Because of this split, a first grader who only works on addition and subtraction still sees new spells, monsters and tactics often, while the math difficulty rises slowly.

---

## 2. What carries over from the Hebrew game

| Part | Status |
|---|---|
| Hero creation (wizard / witch, looks, wardrobe) | Same |
| World map with places | Same |
| Home (room, decorations, potions storage) | Same |
| Shop | Same items; **buying becomes a money-math activity** (§7.2) |
| Brewing potions | Same potions; **brewing becomes a recipe-math activity** (§7.1) |
| Artificer (magic items) | Same items; **forging combines recipe and money math** (§7.3) |
| Coins, ingredients, rarity, quest runs, bosses, chapters/areas | Same structure, retuned |
| Profiles, cloud save, daily 10-minute goal, streaks, tutorial | Same mechanics, new content |
| Monster Hunter mode (gate) | **Redesigned:** spell-book combat (§3) |
| Village Helper mode (board) | **Redesigned later** (§8 note) |

### 2.1 Language
- The UI is available in **Hebrew (right to left) and English (left to right)**.
- A **toggle button** switches between them (on the menu, and reachable during play). The choice is saved in the profile.
- All UI text lives in one string table per language (no hard-coded strings). Math notation is always shown left to right, also in Hebrew mode.

---

## 3. Core mechanic: the spell book

### 3.1 Spells
- The wizard owns a **spell book**. **Every learned spell is always available**, with no choosing or equipping. The book can be opened at any moment (also mid-fight) to look up a spell the student does not remember.
- Each spell has:
  - a **number key**: the answer that triggers it (`3`, `12`, `100`, …). Every spell has a different number. *(Property keys such as "odd" or "bigger than 10" are postponed and may come back later.)*
  - an **element**: fire, ice, water, light, dark, stone, storm, plant… (reuse the Hebrew game's element system)
  - a **type**: attack / defense / heal / control / buff (§3.3)
  - a **power** value that grows with the game level
- **A spell's number never changes**, so students learn their spells by heart. As the math level rises, the student learns **new spells** with bigger numbers, and **enhanced versions** of known spells (`3` Fire Bolt → `33` Enhanced Fire Bolt, with more power). See `01-math-ladder.md` §5.1.

### 3.2 A combat turn
1. The screen shows **3 or 4 problem cards** (for example `1+2`, `2+3`, `7−4`, `4+4`). The answers are **hidden**.
2. The student works out the problems, checks the spell book, and picks one.
3. **Casting:**
   - **Stage 1 (pick only):** the answer appears big on screen, together with the spell it matches.
   - **Stage 2 (incantation):** the student first says the answer by choosing or typing it (§4.1).
4. **The spell takes effect** against the monster:
   - The spell's element is the monster's weakness → **damage**
   - Same element as the monster → **the monster gets stronger** (heals)
   - Any other element → **no effect** (this keeps good options rare, so guessing does not pay)
   - Utility spells (defense, heal, control, buff…) work on every monster
   - **The answer matches no spell → the spell fizzles** (nothing happens)
5. **Monster turn:** the monster **always attacks** unless a spell stopped it (shield, freeze, stun).
6. A new set of problem cards appears. Repeat until the monster or the wizard is defeated.

**Example:** A Fire Imp. The wizard knows *Fire Bolt (3)* and *Ice Bolt (5)*. The student picks `1+2`, so `3` is cast: Fire Bolt hits the imp and makes it stronger. The imp attacks. New cards appear, the student picks `2+3`, so `5` is cast: Ice Bolt damages the imp.

#### 3.2.1 Cards per turn and risk/reward choices
The number of cards grows with the **game level**, not the math level:

| Wizard stage | Cards | Good options per set |
|---|---|---|
| Beginner (first levels) | 3 | 1 |
| Early (unlocked quickly, after a few fights) | 4 | 1 |
| Advanced (big spell book) | 5 or more | **2 or more** |

For advanced wizards, a set can hold **several good options at different difficulties**:
- **an easy problem** → a **weaker** effective spell (safe, low reward)
- **a hard problem** → a **stronger** effective spell (risky: a wrong incantation fizzles, but a right one hits hard)
- for the most advanced wizards, also **defense** and **area (AOE)** options, so the student chooses a tactic: attack now, protect, or hit the whole group.

Difficulty within a set: the "easy" card is a step below the student's math level, and the "hard" card is at the top of the student's current level (never above it). Proposal: a correct answer on a hard card counts a little more in the math window (detailed spec).

### 3.3 Spell types

| Type | Example | Effect |
|---|---|---|
| Attack | Ice Bolt (5) | Damages the monster according to element match |
| Defense | Stone Shield (8) | Blocks or reduces the next monster attack |
| Heal | Healing Light (10) | Restores wizard HP |
| Control | Frost Bind (7) | The monster skips its next turn |
| Buff / combo | Arcane Echo (12) | The next spell has double power |
| Area (AOE), advanced | Meteor Rain (20) | Hits every monster in the fight (needs fights with **groups of monsters**, introduced for advanced wizards) |

Higher game levels unlock **advanced spells**: stronger effects and new spell types. A later idea is two-step casts (the next step is "double the answer").

### 3.4 Problem generation rules
- Every set of cards must contain **at least one good option** (effective against the current monster), and usually **at least one trap** (a spell the monster resists, or a fizzle).
- All problems in the set come from the student's **current math level**.
- The generator works backward: it picks **target answers** from the learned spells' numbers (plus a few non-spell numbers that fizzle), then builds problems that produce them.
- **No two cards in one set have the same answer.**

### 3.5 HP and the fight
- The **wizard has an HP bar** (it replaces the 3 hearts of the Hebrew game in combat).
- The **monster has an HP bar** (as it does now).
- **HP carries over across the whole quest run** (a series of fights followed by a boss). It is restored by Heal spells and Heart potions. HP 0 = the run is lost, with the same restart rules as now (including the safety extra HP after repeated restarts).

---

## 4. Two progression tracks

### 4.1 Math level (slow, adaptive)
- A ladder of math skills from grade 1 to grade 6 (a detailed ladder will be a separate spec). A rough outline:
  - **Grade 1:** addition and subtraction up to 10, then up to 20; comparing numbers
  - **Grade 2:** addition and subtraction up to 100; introduction to multiplication
  - **Grade 3:** the multiplication table; division; up to 1000
  - **Grade 4:** multi-digit operations; introduction to fractions
  - **Grade 5:** fractions; decimals
  - **Grade 6:** percentages; ratios; order of operations
- The student moves up when accuracy over a sliding window passes a threshold, and down when it falls below one. This reuses the existing `UP_ACC / DOWN_ACC / window` logic.
- A teacher (or the profile setup) can set the **starting grade**.

#### Math scoring: two stages
**Stage 1: pick only** (the first math levels: early grade 1)
- The student picks a card, and the game shows the answer and casts.
- Score: **an effective pick counts as correct**; a pick that strengthens the monster or fizzles counts as a mistake.
- Guessing does not move the student up: with about 1 good card in 4, a random guess is right about 25% of the time, which is far below the level-up threshold.
- Why start like this: the youngest students learn the game first, with no typing and no extra step.

**Stage 2: incantation** (from a set math level, proposed: addition and subtraction up to 20)
- After picking a card, the student **says the answer**: chooses it from 4 number buttons (and later types it on a number pad).
- A wrong answer → the spell **fizzles** and the monster attacks. A right answer → the spell is cast.
- Score: **the incantation's correctness is the math score** (a clean signal: did the student solve this problem?). The quality of the pick is a **tactics** score. It affects XP and rewards but not the math level.
- The switch is introduced as a story moment ("You are ready to speak spells yourself!"), and a correct incantation gives a small power bonus. That way the extra step feels like a reward, not a chore.

### 4.2 Game level (fast, rewarding)
- Every fight gives **XP**. Wizard levels unlock:
  - **new spells** in the spell book (new spell types)
  - **more cards per turn**, and later several good options at different difficulties (§3.2.1)
  - **more HP** and **more spell power**
  - **new spell types** (defense, then control, then buffs and combos)
  - **new monster mechanics:** armored (only strong spells work), shapeshifter (changes element), regenerating, twins, monsters that attack twice
- The aim: **something new every session or two**, at any math level.

---

## 5. Monsters
- Reuse the existing monsters, elements, areas and bosses (`MON_DEF`, `AREA_MON`, `EL`).
- New monster fields: `hp`, `attack`, `special` (a mechanic from §4.2).
- A boss = more HP, a special mechanic, and the reward multiplier as it is now.

## 6. Feedback and learning support
- The spell book and the monster's weakness badge are always visible, so the student can plan the cast.
- After a cast, show the full equation (`2+3 = 5 → Ice Bolt!`).
- A short "why" line on resist/strengthen, as in the existing `EL.why` text.
- Hint potion (it replaces the Sound potion): reveals the answers on the cards.

---

## 7. Shop, brewing and Artificer: math everywhere

Outside combat, the math is about **real quantities**: amounts, money, recipes.

### 7.0 Difficulty and scoring
- These are the student's way to **prepare for the adventure**, so the problems are **a bit easier than the student's math level** (about one sub-level below). Making the help they need should feel within reach.
- Their answers **count toward the math level, but with different rules from quests**. The proposal:
  - **Going down:** a mistake counts as in quests, because a mistake on easier material is a strong sign the student is struggling.
  - **Going up:** a correct answer counts with **less weight** (for example half), because the material is easier than the student's level.
  - Exact weights go in the balancing spec.

### 7.1 Brewing potions: recipes
The student gets a **recipe** and must put the right amount of each ingredient into the cauldron (drag ingredients in, or set counts with + and − buttons). The difficulty follows the math level:

| Level | Recipe example |
|---|---|
| Counting | "3 mushrooms and 2 grass" |
| Missing part | "5 ingredients: 3 mushrooms, the rest grass" |
| Addition/subtraction | "8 leaves in total; you already put in 5" |
| Multiplication | "3 handfuls of 4 seeds" |
| Division | "12 roots, split evenly into 3 bottles" |
| Fractions | "12 ingredients: ½ mushrooms, ¼ grass, the rest leaves" |
| Ratios | "2 thorns for every 3 roots, 15 in total" |
| Percentages | "20 ingredients: 25% fire stones, the rest seeds" |
| Advanced fractions | "⅔ of the 18 leaves" or "¾ cup of water plus ⅝ cup of oil" (fractions of amounts, adding fractions, mixed numbers) |

- A correct brew → the potion is made.
- A wrong amount → the brew fails, with a gentle explanation of the right amounts. There is a **chance (X%) that the ingredients are lost**; otherwise they come back to the satchel. **X grows as the wizard levels up**: beginners are protected while they learn, and experienced wizards take real risks (for example about 10% for a beginner, up to about 50% for an advanced wizard; the exact curve goes in the balancing spec).

### 7.2 Shop: money math

| Level | Shop task example |
|---|---|
| Counting | Count out the coins to pay for an item (drag coins onto the counter) |
| Addition | Buy two items: what is the total? |
| Subtraction | Pay with 50; how much change do you get? |
| Multiplication | 3 potions at 12 coins each |
| Fractions/percentages | "Sale: 25% off!" or "Half price today" |

- Coins of different values (1, 2, 5, 10, …) make "pay the exact amount" a real puzzle.

### 7.3 Artificer: recipe + money
- Forging a magic item = a **recipe** (rare ingredients in the right amounts, as in §7.1) **plus a payment** (as in §7.2).
- Upgrading an item to Legendary = a harder multi-step version.

---

## 8. Village Helper mode: note only (to be designed later)
Ideas to develop later:
- **Conjuration spells** create the items villagers need.
- Villagers present **word problems**. The student solves the problem to find out **how many units** to conjure (for example: "I need 3 baskets with 4 apples in each. How many apples?").

---

## 9. Open questions
None for the general idea. The detailed specs, in writing order (each in this folder):
1. **Math ladder** (`01-math-ladder.md`): the levels from grade 1 to grade 6, with problem types and number ranges for each level.
2. **Spell list:** the spells, their numbers, elements, types, powers, and the game level that unlocks each.
3. **Monsters and balance:** HP, attack, special mechanics, groups, bosses, the XP curve, and the brew-loss curve.
4. **Shop, brewing and Artificer tasks:** the exact task types per level, and the UI for each.
