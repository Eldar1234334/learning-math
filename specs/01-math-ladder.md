# Math Wizard: Spec 01, The Math Ladder v0.1

> Status: **draft for discussion**. Builds on `00-general.md` (§4.1 math level, §3.4 problem generation, §7.0 crafting difficulty).
> The level list follows the Israeli elementary math curriculum and is reviewed by the project owner (a math teacher). Levels are easy to move, split or merge because everything is driven by the level table.

---

## 1. Purpose

The math ladder is the single source of truth for **what math the student practices**. It drives:
- the **problem cards** in combat (§3.2 of the general spec)
- the **numbers on the spells** (the key pool, §5 below)
- the **recipe, shop and Artificer tasks** (one sub-level easier, §7)
- **moving up and down** (§6)

---

## 2. Terms

| Term | Meaning |
|---|---|
| **Math level** | A step on the ladder (1 to 36). Each level is one skill with set number ranges. |
| **Problem** | One card: an expression plus its answer, for example `8+5 = 13`. |
| **Form** | The shape of a problem: `a+b`, `a−b`, `a+□=c` (missing number), `a×b`, `½ of a`, … |
| **Answer type** | `int` (whole number), `frac` (fraction or mixed number), `dec` (decimal). |
| **Key pool** | The answers a level produces naturally. Spell numbers are chosen from it. |
| **Easy step** | The level below the current one (used for easy cards and for crafting). |

---

## 3. The ladder

36 levels, 6 per grade. The grade is a guide only: a student moves by results, not by age.

### Grade 1: up to 20

| # | Skill | עברית | Forms | Ranges | Example |
|---|---|---|---|---|---|
| 1 | Addition up to 5 | חיבור עד 5 | `a+b` | sum 2–5 | `2+3` |
| 2 | Addition up to 10 | חיבור עד 10 | `a+b` | sum 2–10 | `6+3` |
| 3 | Subtraction up to 10 | חיסור עד 10 | `a−b` | a ≤ 10, answer 1–9 | `9−4` |
| 4 | Mixed and missing number up to 10 | חיבור וחיסור, מספר חסר | `a±b`, `a+□=c`, `□−b=c` | up to 10 | `3+□=7` |
| 5 | Up to 20, no crossing ten | עד 20 בלי מעבר עשרת | `a±b` | `12+5`, `17−4` | `14+3` |
| 6 | Up to 20, crossing ten | עד 20 עם מעבר עשרת | `a±b`, missing number | `8+5`, `13−6` | `7+6` |

**The incantation step (stage 2) starts at level 5.** Levels 1–4 are pick-only (stage 1).

### Grade 2: up to 100, first multiplication

| # | Skill | עברית | Forms | Ranges | Example |
|---|---|---|---|---|---|
| 7 | Whole tens | עשרות שלמות | `a±b` | multiples of 10 up to 100 | `30+40` |
| 8 | Two-digit ± one-digit, no crossing | דו-ספרתי ועוד חד-ספרתי | `a±b` | up to 99 | `43+5` |
| 9 | Two-digit ± one-digit, crossing | עם מעבר עשרת | `a±b` | up to 100 | `47+6` |
| 10 | Two-digit ± two-digit | דו-ספרתי ועוד דו-ספרתי | `a±b`, missing number | up to 100 | `36+27` |
| 11 | Multiplication by 2, 5, 10 | כפל ב-2, 5, 10 | `a×b` | factors 1–10 | `5×4` |
| 12 | Multiplication by 2, 3, 4, 5, 10, doubles and halves | כפל, כפולות וחצאים | `a×b`, `double a`, `half of a` | factors 1–10 | `half of 18` |

### Grade 3: the multiplication table, up to 1000

| # | Skill | עברית | Forms | Ranges | Example |
|---|---|---|---|---|---|
| 13 | Times table 1–5 | לוח הכפל 1–5 | `a×b` | a 1–5, b 1–10 | `4×7` |
| 14 | Times table 6–10 | לוח הכפל 6–10 | `a×b` | a 6–10, b 1–10 | `8×7` |
| 15 | Division within the table | חילוק בלוח הכפל | `a÷b` (exact) | quotient 1–10 | `56÷8` |
| 16 | Multiplication and division, missing factor | כפל וחילוק, גורם חסר | `a×□=c`, `□÷b=c` | within the table | `6×□=42` |
| 17 | Addition and subtraction up to 1000 | חיבור וחיסור עד 1000 | `a±b` | up to 1000 | `356+128` |
| 18 | Multiply by 10 and 100; two-digit × one-digit (simple) | כפל ב-10 וב-100 | `a×10`, `a×100`, `a×b` | `14×3` | `23×10` |

### Grade 4: big numbers, first fractions

| # | Skill | עברית | Forms | Ranges | Example |
|---|---|---|---|---|---|
| 19 | Two- and three-digit × one-digit | כפל במספר חד-ספרתי | `a×b` | product up to 1000 | `47×6` |
| 20 | Division by one digit (exact) | חילוק במספר חד-ספרתי | `a÷b` | 2–3 digits ÷ 1 digit | `96÷4` |
| 21 | Addition and subtraction up to 10,000 | חיבור וחיסור עד 10,000 | `a±b` | up to 10,000 | `4250−1380` |
| 22 | Fraction of an amount | שבר מכמות | `½ of a`, `⅓ of a`, `¼ of a`, `¾ of a` | whole-number answers | `¾ of 12` |
| 23 | Equivalent fractions | שברים שקולים | `½ = □/8` | denominators up to 12 | `⅔ = □/9` |
| 24 | Order of operations | סדר פעולות חשבון | `a+b×c`, `(a+b)×c` | small numbers | `3+4×2` |

### Grade 5: fractions and decimals

| # | Skill | עברית | Forms | Ranges | Example |
|---|---|---|---|---|---|
| 25 | Add and subtract fractions, same denominator | חיבור וחיסור שברים, מכנה שווה | `a/n ± b/n` | denominators up to 12 | `⅜+⅝` |
| 26 | Add and subtract fractions, different denominators | מכנים שונים, מספרים מעורבים | `a/m ± b/n`, mixed numbers | simple common denominators | `½+⅓` |
| 27 | Fraction × whole number | שבר כפול מספר שלם | `a/n × k` | | `⅔×6` |
| 28 | Add and subtract decimals | חיבור וחיסור עשרוניים | `a±b` | tenths, hundredths | `2.5+1.75` |
| 29 | Multiply and divide decimals by 10, 100, 1000 | כפל וחילוק עשרוני ב-10, 100, 1000 | `a×10`, `a÷100` | | `3.7×100` |
| 30 | Two-digit × two-digit; long division | כפל דו-ספרתי, חילוק ארוך | `a×b`, `a÷b` | `24×15`, `384÷8` | `12×13` |

### Grade 6: all operations, percentages and ratios

| # | Skill | עברית | Forms | Ranges | Example |
|---|---|---|---|---|---|
| 31 | Multiply fractions | כפל שברים | `a/m × b/n` | | `⅔×¾` |
| 32 | Divide fractions | חילוק שברים | `a/m ÷ b/n`, `k ÷ a/n` | | `3÷¾` |
| 33 | Multiply decimals | כפל עשרוניים | `a×b` | one decimal place each | `1.2×0.5` |
| 34 | Percent of an amount (easy percentages) | אחוזים מכמות | `p% of a` | p = 10, 20, 25, 50, 75 | `25% of 80` |
| 35 | Percentages and ratios | אחוזים ויחס | `p% of a`, "share a in ratio m:n" | p up to 150 | `15% of 60` |
| 36 | Multi-step mix | תרגילים משולבים | order of operations with fractions and decimals | | `(½+¼)×8` |

---

## 4. Answers

### 4.1 Answer types and display
- `int`: whole numbers. **No negative answers** anywhere in the game.
- `frac`: always shown in **simplest form**. An improper fraction is shown as a **mixed number** (`8/3` → `2⅔`). From level 23 on, a whole-number result of a fraction problem is shown as a whole number (`⅔×6` → `4`).
- `dec`: no trailing zeros (`2.50` → `2.5`).
- **Answers are compared by value**, never by text. `4/8`, `½` and `0.5` are equal. Only the display is canonical.
- Math is always written **left to right**, also in Hebrew mode. The division sign is `:` in Hebrew mode (as in Israeli schools) and `÷` in English mode.

### 4.2 Incantation input (stage 2)
- **Levels 5–20:** the student chooses the answer from **4 number buttons** (the right answer plus 3 close distractors, §5.3).
- **From level 21 on** (or by a setting): a **number pad** for `int` and `dec` answers. `frac` answers always use the buttons, because typing fractions is hard on a tablet.

---

## 5. Problem generation

### 5.1 Key pool (spell numbers)
Each level defines a **key pool**: the answers it produces naturally. Spell numbers are chosen from this pool.

| Levels | Key pool |
|---|---|
| 1 | 2–5 |
| 2–4 | 1–10 |
| 5–6 | 1–20 |
| 7 | multiples of 10 up to 100 |
| 8–10 | 10–100 |
| 11–12 | products and halves within the level (2–50) |
| 13–16 | numbers in the times table (1–100) |
| 17, 21 | rounded "nice" numbers (multiples of 10 or 50) |
| 18–20, 30 | results within the level's range |
| 22–24 | 1–30 |
| 25–27, 31–32 | fractions and mixed numbers with denominators 2, 3, 4, 5, 6, 8 |
| 28–29, 33 | decimals with one or two places |
| 34–36 | whole numbers 1–100 (the forms are designed to give whole answers) |

**Spell numbers never change.** Once a spell is learned, its number is fixed forever, so the student learns the old spells by heart. When the student reaches new math levels, the spell book **grows**:
1. **New spells** with numbers from the new level's key pool.
2. **Enhanced versions** of known spells: the same spell with a bigger number and more power. For example, `3` is Fire Bolt and `33` is Enhanced Fire Bolt. An enhanced version is learned when the student reaches a level whose key pool contains its number. (The full naming and numbering pattern is part of spec 02, the spell list.)

**Old spells at higher levels.** Old numbers stay reachable through problems of the new level, which is a good review:
- `3` at level 15: `21÷7`; at level 22: `¼ of 12`; at level 28: `1.5+1.5`; at level 34: `25% of 12`.
- When a level's forms cannot produce an old number (for example level 7, whole tens only, cannot make `3`), that card comes from the **review share** (an earlier level) instead.

This turns a math level-up into a visible event: "You learned new spells!"

### 5.2 Building a card set (combat)
1. Choose the **target answers**:
   - the good card(s): the numbers of spells that work against this monster
   - the trap card(s): spells that the monster resists, or numbers that match no spell (fizzle)
2. For each target, **build a problem backward**: pick a form for the level, then fill in numbers that give the target. Example, level 6, target 13: `8+5`, `7+6`, `20−7`, `□−4=9`.
3. Check: **all answers in a set are different**, no problem repeats within the last 10 turns, and every number stays inside the level's ranges.
4. Mix in review: **about 80% of cards are from the current level, 20% from earlier levels** (weighted toward recent ones).
5. For advanced wizards with two or more good options (general spec §3.2.1): the **easy card** comes from the easy step (the level below), the **hard card** from the current level at the top of its range. Never above the current level.

### 5.3 Incantation distractors
The 3 wrong buttons are **close and plausible**: ±1, ±10, swapped digits (`31`/`13`), or the result of the wrong operation (`8+5` → `3`). For fractions: a wrong numerator or denominator (`⅖` for `½+⅓`). A distractor must never be equal in value to the answer (so `2/4` is never offered against `½`).

### 5.4 Weak spots
As in the reading game (`pickIngredient` favours hard words), the game remembers **facts the student got wrong** (for example `7×8`) and shows them again more often until they are answered right a few times in a row.

---

## 6. Moving up and down

Reuse the reading game's sliding-window logic (`UP_ACC / DOWN_ACC / MIN_WINDOW / MAX_WINDOW`).

| Rule | Value (starting proposal) |
|---|---|
| Move up | accuracy ≥ 85% over the last 10–12 scored answers |
| Move down | accuracy < 50% over the last 8 scored answers |
| After a move | the window is cleared |
| Placement phase (first 20 answers of a new profile) | smaller window (5), so a misplaced student moves fast |

### 6.1 What counts as a scored answer

| Source | Correct | Mistake | Weight toward up | Weight toward down |
|---|---|---|---|---|
| Combat, stage 1 (levels 1–4) | an effective pick | a pick that strengthens the monster or fizzles | 1 | 1 |
| Combat, stage 2 (level 5 on) | a right incantation | a wrong incantation | 1 (hard card: 1.25) | 1 |
| Shop, brewing, Artificer | a right answer | a wrong answer | 0.5 | 1 |
| Review cards (earlier levels) | a right answer | a wrong answer | 0.5 | 1 |

In stage 2 the **pick itself is not scored for math**; it is the tactics score (XP and rewards).

### 6.2 Starting level
- The teacher (in the class sheet) or the profile setup chooses the **grade**. The student starts at the **first level of that grade**.
- The placement phase moves the student quickly to the right level.
- The teacher can also set the **exact level** directly (as with the reading game's tier).

---

## 7. Crafting difficulty (shop, brewing, Artificer)

- Tasks use the **easy step**: one level below the student's current level (level 1 stays at level 1).
- The **task type** (recipe, coins, change, discount; see general spec §7) matches the skill of that level. For example, a student at level 14 brews from a level-13 recipe: "3 handfuls of 7 seeds".
- The detailed task list per level is part of spec 04.

---

## 8. Profile data (new fields)

| Field | Meaning |
|---|---|
| `mlvl` | current math level (1–36) |
| `mhist` | the sliding window: recent scored answers with their weights |
| `mfacts` | weak spots: problem key → wrong / right-in-a-row counts |
| `mplace` | answers left in the placement phase |
| `spells` | the spells the student has learned (each with its fixed number) |

The reading game's `tier` / `hist` fields are replaced by these. The cloud save sheet gets a `mlvl` column so the teacher can follow progress.

---

## 9. Decisions log
- Spell numbers are fixed forever; the spell book grows with new spells and enhanced versions (§5.1).
- Division sign: `:` in Hebrew mode, `÷` in English mode (confirmed).
- The level list is reviewed by the project owner (a math teacher).
