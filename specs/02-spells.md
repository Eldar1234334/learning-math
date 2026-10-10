# Math Wizard: Spec 02, The Spell Book v0.1

> Status: **draft for discussion**. Builds on `00-general.md` (§3 spells, §4 progression) and `01-math-ladder.md` (§5.1 key pools, fixed spell numbers).
> Power values here are in **power units**. Spec 03 (monsters and balance) turns them into HP numbers.

---

## 1. Rules

1. **A spell's number never changes.** Students learn their spells by heart.
2. **No two spells have the same value.** This includes value-equal forms (`½` and `0.5` cannot both be spells).
3. A spell is **learned** when both gates are open:
   - **Math gate:** the student's math level is at least the spell's `mreq` (its number is in the level's key pool).
   - **Game gate:** the wizard's game level is at least the `greq` of the spell's **type** (§3).
4. Math gate open, game gate closed → the spell appears in the book **sealed** (greyed, with a lock and "Unlocks at wizard level N"). This gives the student something to look forward to.
5. Game gate open, math gate closed → the spell is **not shown**. Math is never shown as a lock (no shame for a slow math pace).
6. **Every learned spell is always available.** There is no equipping and no spell slots. The full spell book can be opened at any moment, also in the middle of a fight, so a student who does not remember a spell can look it up.

---

## 2. Elements

The reading game's elements, simplified for spells. `rain` merges into water, `snow` into ice, `sun` into light.

**Attack elements:** fire, water, ice, light, lightning, stone.
**Utility elements** (no element match; they work the same on every monster): wind (defense), nature (heal), shadow (control), arcane (buff, summon, special).

| Monster element | Weak to (damage) | Gets stronger from (heals) |
|---|---|---|
| Fire | water, ice | fire, light |
| Ice | fire, light | ice |
| Dark | light, lightning | (shadow spells have no effect) |
| Plant | fire, lightning | water, light |
| Storm | stone, ice | lightning, water |
| Stone | water, lightning | stone |

- **Weakness → damage** (the spell's full power).
- **Any other attack element → no effect.** This keeps good options rare, so guessing does not pay.
- **"Gets stronger" → the monster heals** by the spell's power.

---

## 3. Spell types and game-level gates

| Type | Unlocks at wizard level (`greq`) | Effect |
|---|---|---|
| Attack | 1 | Damage × element match |
| Defense | 3 | Reduces or blocks the next monster attack |
| Heal | 5 | Restores wizard HP |
| Control | 8 | The monster skips turn(s). Bosses: one turn at most, once per fight |
| Summon | 10 | A familiar joins the fight and attacks for 3 turns |
| Buff | 12 | The next spell is stronger |
| Area (AOE) | 15 | Hits every monster (group fights start at wizard level 15) |
| Special | 18 | Unique effects (reflect, drain, revive…) |

---

## 4. Wizard-level unlocks (non-spell)

| Wizard level | Unlock |
|---|---|
| 1 | 3 cards per turn |
| 3 | **4 cards per turn** |
| 15 | **5 cards per turn**, sets with 2 good options (easy/weak + hard/strong); group fights |
| 22 | 6 cards per turn; defense and area options in the same set |

The XP curve is in spec 03. The aim (general spec §4.2): something new every session or two.

---

## 5. Spell tiers (the number pattern)

**Enhanced versions are the same digits, one place value bigger (×10).** This ties the spell book to place value, a core idea of the curriculum:

| Tier | Numbers | Power | Math gate | Example |
|---|---|---|---|---|
| Base | 1–9 | 2 | L1–L2 | `3` Fire Bolt |
| Strong | 11–19 | 4 | L5 (up to 20) | `13` Fireball |
| Enhanced | ×10 of base (10–90) | 6 | L7 (whole tens) | `30` Enhanced Fire Bolt |
| Greater | ×100 of base (100–900) | 10 | L17 | `300` Greater Fire Bolt |
| Enhanced strong | ×10 of strong (110–190) | 12 | L17 (up to 1000) | `130` Enhanced Fireball |
| Legendary | ×1000 of base (1000–9000) | 16 | L21 (up to 10,000) | `3000` Legendary Fire Bolt |

Each tier is clearly stronger than the one below (at least ×1.5, and strong = 2 × base), so a strong spell always feels strong (spec 03 §2).

Why ×10 and not `33` (repeated digits): ×10 numbers fit every level that produces them. The times table makes `30`, `40` … `90`; "multiply by 10 and 100" (L18) makes them directly; and level 7 (whole tens) is exactly the enhanced tier, so **grade 2 opens with "your spells became enhanced!"**. Repeated digits (`33`, `77`) can't come from the times table (levels 13–16), so the strong options would vanish there. **To confirm.**

---

## 6. The spell catalog

### 6.1 Base spells (1–9)

| # | Spell | עברית | Element | Type | Math gate | Notes |
|---|---|---|---|---|---|---|
| 1 | Light Spark | ניצוץ אור | light | attack | L2 | |
| 2 | Water Splash | התזת מים | water | attack | L1 | starting spell |
| 3 | Fire Bolt | חץ אש | fire | attack | L1 | starting spell |
| 4 | Stone Throw | זריקת אבן | stone | attack | L1 | starting spell |
| 5 | Ice Bolt | חץ קרח | ice | attack | L1 | starting spell |
| 6 | Wind Shield | מגן רוח | wind | defense | L2 | halves the next attack |
| 7 | Lightning Zap | הלם ברק | lightning | attack | L2 | |
| 8 | Healing Leaf | עלה מרפא | nature | heal | L2 | heals 2 |
| 9 | Shadow Snare | מלכודת צל | shadow | control | L2 | the monster skips 1 turn |

A new student starts with **2, 3, 4, 5** (all of level 1's key pool).

### 6.2 Strong spells (11–19), math level 5

| # | Spell | עברית | Element | Type | Notes |
|---|---|---|---|---|---|
| 11 | Sunburst | פרץ שמש | light | attack | |
| 12 | Tidal Wave | גל ענק | water | attack | |
| 13 | Fireball | כדור אש | fire | attack | |
| 14 | Rock Slide | מפולת סלעים | stone | attack | |
| 15 | Ice Spear | חנית קרח | ice | attack | |
| 16 | Arcane Echo | הד קסום | arcane | buff | the next spell has double power |
| 17 | Thunderstorm | סופת רעמים | lightning | attack | |
| 18 | Meteor Rain | גשם מטאורים | stone | area | hits all monsters |
| 19 | Time Freeze | הקפאת זמן | shadow | control | the monster skips 2 turns |

### 6.3 Higher tiers of 1–19
Every spell in 6.1 and 6.2 gets its higher tiers automatically (§5): ×10 = "Enhanced", ×100 = "Greater", ×1000 = "Legendary" (Hebrew: מוגבר, עליון, אגדי). The type and element stay the same; only the power grows. For non-attack spells the effect grows instead: `60` Enhanced Wind Shield blocks the next attack completely; `80` Enhanced Healing Leaf heals 4; `90` Enhanced Shadow Snare: 2 turns.

### 6.4 New families by grade

| Grade | # | Spell | עברית | Type | Math gate | Effect |
|---|---|---|---|---|---|---|
| 2 | 25 | Owl Familiar | ינשוף מלווה | summon | L8 | an owl attacks for 3 turns (power 1 each; arcane, hits every monster element) |
| 2 | 55 | Wolf Familiar | זאב מלווה | summon | L8 | a wolf attacks for 3 turns (power 2 each) |
| 2 | 99 | Dragon Familiar | דרקון מלווה | summon | L10 | a small dragon: 3 turns, fire, power 3 |
| 3 | 36 | Mirror Ward | מגן מראה | special | L13 | reflects the next attack back at the monster |
| 3 | 49 | Life Drain | יניקת חיים | special | L14 | damage 3 and heals the wizard by the same amount |
| 3 | 64 | Chain Lightning | ברק משורשר | area | L14 | lightning damage to every monster |
| 3 | 81 | Phoenix Feather | נוצת עוף החול | special | L14 | if HP reaches 0 this fight, come back with half HP (once per fight) |
| 5 | ½ | Half-Moon Hex | כישוף חצי הירח | special | L25 | the monster loses half its current HP (a boss: a quarter) |
| 5 | ¼ | Quarter Heal | ריפוי רבע | heal | L25 | heals a quarter of max HP |
| 5 | ¾ | Three-Quarter Shield | מגן שלושה רבעים | defense | L25 | blocks ¾ of the next attack |
| 5 | ⅓ | Triple Strike | מכה משולשת | attack (arcane: hits every element) | L26 | 3 hits of power 1 |
| 5 | 1½ | Echo and a Half | הד וחצי | buff | L26 | the next spell has 1½ power |
| 5 | 0.1 | Mist of Tenths | ערפל העשיריות | control | L28 | the next monster attack deals only a tenth |
| 6 | ⅛ | Shrinking Hex | כישוף הכיווץ | special | L31 | the monster's attack is smaller for 3 turns |
| 6 | 144 | Starfall | מטר כוכבים | area | L34 | light damage, power 6, to every monster |
| 6 | 360 | Full Circle | מעגל שלם | heal | L35 | full HP and removes bad effects |

---

## 7. Casting rules
- **Match by value** (`01-math-ladder.md` §4.1): an answer of `2/4` casts Half-Moon Hex.
- An answer that is **not a learned spell** fizzles. A **sealed** spell (§1, rule 4) also fizzles: it is not learned yet.
- **Hard and easy good options** (wizard level 15+): the easy card targets a lower-tier spell, and the hard card targets a higher tier of a spell that works on this monster. Example against a plant monster at math level 17: easy `21÷7` (level 16) → `3` Fire Bolt; hard `650−350` → `300` Greater Fire Bolt.
- After each cast, show the equation and the spell: `6×5 = 30 → Enhanced Fire Bolt!`

---

## 8. Spell book UI (summary; detailed UI in the build)
- A book with tabs by tier, opened from the menu and during a fight (pausing it).
- Each page: the number (big), name, element badge, type icon, power, and short effect text in the current UI language.
- Sealed spells: greyed with "Unlocks at wizard level N".
- On a new spell: a "You learned a new spell!" moment with the number and a short animation.

---

## 9. Decisions log
- Enhanced tiers are ×10 (`3` → `30` → `300` → `3000`). Confirmed.
- Spell names (Hebrew and English) confirmed.
- Starting spells 2, 3, 4, 5 confirmed; the first area teaches "Fire beats plants, Water feeds them".
- **No equipping:** every learned spell is always available, and the spell book can be opened at any moment.
