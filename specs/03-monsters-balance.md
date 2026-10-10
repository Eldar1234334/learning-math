# Math Wizard: Spec 03, Monsters and Balance v0.2

> Status: **draft for discussion**. Builds on `00-general.md`, `01-math-ladder.md` and `02-spells.md`.
> All numbers are **starting values** to tune in playtesting. They should all live in `CFG` (as in the reading game), never hard-coded.

### Changes since v0.1
- **Damage rule:** weakness → normal damage; other elements → **no damage**; the monster's own element → heals it. Fewer good options, so guessing pays less.
- **Tier powers spread out** so strong spells are clearly strong (base 2 · strong 4 · enhanced 6 · greater 10 · enhanced strong 12 · legendary 16).
- **Monster HP follows the spells the student's math level actually produces** (computed, not a fixed table).
- **Armored redesigned:** an armor bar that reduces damage until broken, with armor types that break with different elements.
- Confirmed: monster HP follows the math level, 20% HP back after a win, maximum wizard level 30.

---

## 1. Balance goals

1. A normal fight takes **about 3 good casts** (as the reading game's 3 right answers), whatever the student's math level.
2. A student who plays well finishes a quest run with HP left. A student who guesses loses the run early, and potions or healing spells can save a run that goes badly.
3. **Strong spells are significantly strong.** A higher-tier spell ends a fight clearly faster. That is the reward for harder math.
4. Students at the same wizard level have **equally long fights**, whatever their grade. Monster HP follows the student's math level, so older students do not one-shot everything.
5. The wizard level brings **something new every session or two**.

---

## 2. Damage

```
damage = power × S(g)            on the monster's WEAKNESS
         0                       any other attack element ("No effect!")
heal   = power × S(g)            the monster's OWN element (it gets stronger)
S(g)   = 1 + 0.1 × (g − 1)       g = wizard (game) level
```

Utility spells (defense, heal, control, summon, buff, arcane attacks) always work and ignore elements.

**Tier powers** (spec 02 §5): base 2 · strong 4 · enhanced 6 · greater 10 · enhanced strong 12 · legendary 16. Each tier is at least ×1.5 the one below.

**Strong-spell guarantee:** in a card set with two good options (wizard level 15+), the hard card's spell has **at least twice the power** of the easy card's spell. The generator picks targets to make that true.

Numbers on screen are rounded to whole numbers.

---

## 3. Monsters

### 3.1 Monster HP

```
HP = 3 × P_typ × S(g)            (about 3 good casts)
```

`P_typ` is the **typical good cast** at the student's math level. It is **computed, not set by hand**: the average power of the learned attack spells whose numbers are in the current level's key pool (`01-math-ladder.md` §5.1). This follows the real spells the generator will offer, including levels that go back to small numbers (for example levels 22–24, "fraction of an amount", produce answers 1–30). A ±10% random spread keeps fights from feeling identical.

Rough values for reference:

| Math levels | Typical good casts | P_typ (approx.) |
|---|---|---|
| 1–4 | base | 2 |
| 5–6 | base and strong | 3 |
| 7–16 | enhanced, some strong | 5–6 |
| 17–21 | greater, enhanced strong | 10–11 |
| 22–24 | base to enhanced | 4 |
| 30 | greater and legendary | 12 |

A cast of a **higher tier than typical** finishes the fight in 1–2 casts; a **lower tier** (review) takes longer.

### 3.2 Monster attack and wizard HP

```
Wizard max HP        = 20 + 2 × (g − 1)
Monster attack       = 1 + floor((g − 1) / 6)     (normal monster)
Boss attack          = 2 × monster attack
HP back after a win  = 20% of max HP              ("catching your breath")
```

**HP carries over through the whole quest run.** HP 0 → the run is lost, with the reading game's restart rules. After `SAFETY_RESTARTS` restarts in a row, the next try starts with **+25% bonus HP**.

### 3.3 Bosses
- HP ×3, attack ×2, and **always one special ability** (§4).
- Control spells (freeze, snare) stop a boss for **one turn at most, once per fight**.
- Half-Moon Hex takes a quarter of a boss's HP instead of half.
- Rewards: the reading game's `BOSS_MIN`–`BOSS_MAX` multiplier.

### 3.4 Monster list
Reuse all monsters, elements, areas and bosses from the reading game (`MON_DEF`, `AREA_MON`, `AREAS`, `MON_ART`). No new art is needed for v1. A special ability is shown as a **modifier** on the name and a small badge: "🪨 Stone-armored Ember Imp".

**Always winnable:** a monster is only chosen if the student has **at least one learned spell that hurts it** (and, for an armored monster, one that breaks its armor). Example: a level-1 student has no light or lightning spell yet, so dark monsters (ghost, bat, spider) are swapped for another monster of the area until those spells are learned.

---

## 4. Monster abilities (unlocked by wizard level)

Each new ability arrives with a short "New monster!" card that explains it, and teaches which spells help against it.

| Wizard level | Ability | עברית | Effect | Good answer |
|---|---|---|---|---|
| 6 | 🛡️ Armored | משוריין | an armor bar; damage is reduced until it breaks (§4.1) | break the armor with its element, then attack the weakness |
| 9 | 🌱 Regenerating | מתחדש | heals 10% of its HP every turn | strong and higher-tier spells |
| 11 | ⚡ Charging | טוען | every 3rd turn: a big attack (×3), shown a turn ahead | shield or control on that turn |
| 13 | 🎭 Shapeshifter | משנה צורה | changes element every 2 turns (the badge changes) | read the badge every turn |
| 15 | 👥 Group | קבוצה | 2–3 monsters in one fight | area spells; single spells hit the front monster |
| 18 | 🔮 Shielded | מוגן | a shield takes the first hit of the fight | any hit breaks it, then fight as usual |
| 20 | 💢 Double attack | התקפה כפולה | attacks twice per turn | defense, heal, control |

The chance that a normal monster has an ability starts at **30%** when the first ability unlocks and grows to **60%** at wizard level 20. A monster has at most one ability (a boss may have two from wizard level 20).

### 4.1 Armor

An armored monster has an **armor bar** over its HP bar, and an **armor type** shown as a badge.

| Armor | עברית | Breaks with |
|---|---|---|
| 🪵 Bark armor | שריון קליפה | fire |
| 🧊 Ice armor | שריון קרח | fire, light |
| 🪨 Stone armor | שריון אבן | water |
| ⚙️ Iron armor | שריון ברזל | lightning |
| 🌑 Shadow armor | שריון צל | light |

Rules:
- **While the armor is up**, a weakness hit does **half damage** to the HP.
- A spell of the armor's **breaking element** hits the **armor** for full power, even if that element is not the monster's weakness. The armor absorbs it, so it never heals the monster.
- Armor points = **1 typical cast** (`P_typ × S(g)`), so one good breaking cast removes it. From wizard level 16, armor can be **heavy** (2 casts).
- The game never gives a monster an armor that breaks with **its own element** (for example no bark armor on a fire monster).
- The tactic this teaches: **two-step thinking**, first break the armor with one element, then attack the weakness with another.

---

## 5. Wizard level: XP and unlocks

### 5.1 XP

| Event | XP |
|---|---|
| Win a normal fight | 10 |
| …with no bad picks (perfect tactics) | +5 |
| Win a boss fight | 40 |
| …with no bad picks | +20 |
| Brew a potion / buy in the shop / forge (correct) | 3 |

XP from a lost run is kept.

```
XP to go from level g to g + 1 = 40 + 20 × g          (maximum wizard level: 30)
```

A typical 10-minute session has about 8–10 fights (~100 XP):

| Wizard level | Sessions (approx.) | Main unlock |
|---|---|---|
| 3 | 1–2 | defense; 4 cards |
| 5 | 4 | heal |
| 6 | 5 | Armored monsters |
| 8 | 8 | control |
| 9 | 10 | Regenerating monsters |
| 10 | 13 | summon |
| 11 | 15 | Charging monsters |
| 12 | 18 | buff |
| 13 | 20 | Shapeshifter monsters |
| 15 | 27 | area spells, groups, 5 cards, 2 good options |
| 16 | 31 | heavy armor |
| 18 | 37 | special spells, Shielded monsters |
| 20 | 46 | Double-attack monsters |
| 22 | 55 | 6 cards |
| 30 | ~100 | end of the ladder for v1 (about a school year of daily play) |

### 5.2 Filling the gaps
Every level without a main unlock gives a **cosmetic reward**: a wardrobe item, a decoration for the room, or a new title. The titles reuse the reading game's ranks (`RANKS`), with new math names, for example "Number Apprentice" → "Archmage of Numbers".

---

## 6. Economy

### 6.1 Coins
Keep the reading game's coin rules (`FIGHT_UNITS`, a unit lost per mistake, boss multiplier, `EARLY_MULT`). The coin unit follows the **math level**:

| Math levels | 1–6 | 7–12 | 13–18 | 19–24 | 25–30 | 31–36 |
|---|---|---|---|---|---|---|
| Coin unit | 1 | 2 | 2 | 3 | 3 | 4 |

A mistake = a wrong incantation (stage 2) or a bad pick (stage 1).

### 6.2 Potions

| Potion | Effect in combat |
|---|---|
| ❤️ Heart | heals 30% of max HP |
| 💡 Hint (was Sound) | shows the answers on the current cards |
| 💥 Power | the next spell has double power |
| ⏪ Second chance | undoes the last cast (HP, monster and cards go back) |
| 🌟 Super | ends the fight at once (once per chapter) |

The starter set (`STARTER_POTIONS`) and the pouch size (`POUCH`) stay the same.

### 6.3 Magic items (Artificer)
Keep the three items as they are: amulet (if HP reaches 0, keep 1 HP and go on), staff (sends a non-boss monster away), belt (see the next four stops).

### 6.4 Failed brew
```
Chance to lose the ingredients = min(50%, 10% + 2% × (g − 1))
```
10% at wizard level 1, 50% from wizard level 21. Otherwise the ingredients go back to the satchel.

---

## 7. Balance check (sanity numbers)

Wizard level 1, math level 2: max HP 20; monster HP 6 (3 Fire Bolts of 2); monster attack 1. Cards: 3, of which 1 good, and the others are no-effect or heal the monster.

| Player | Turns per fight | Damage taken per fight | Net HP after the 20% regen | Over a 7-fight run + boss |
|---|---|---|---|---|
| Good (about 80% good picks) | ~4 | ~4 | about even | finishes with most HP |
| Average (about 50%) | ~6–7 | ~6–7 | ~−3 per fight | finishes low; a Heart potion helps |
| Guessing (about 33%, plus monster healing) | 10+ | 10+ | ~−7 per fight | loses around fight 2–3 |

**Recommendation for the build session:** write a small **fight simulator** (a script, not in the game) that plays thousands of runs with "good", "average" and "guessing" players at different wizard and math levels, and checks the goals in §1. Then tune the `CFG` values.

---

## 8. New `CFG` keys (summary)

```js
DMG_LEVEL_STEP: 0.1,          // S(g) = 1 + step × (g − 1)
TIER_POWER: { base: 2, strong: 4, enhanced: 6, greater: 10, enhStrong: 12, legendary: 16 },
HARD_MIN_RATIO: 2,            // hard card's spell ≥ 2 × easy card's spell
MON_HITS: 3, MON_HP_SPREAD: 0.1,   // P_typ is computed from the level's key pool
HP_BASE: 20, HP_PER_LEVEL: 2, WIN_REGEN: 0.2, SAFETY_HP_BONUS: 0.25,
MON_ATK_BASE: 1, MON_ATK_EVERY: 6, BOSS_HP_MULT: 3, BOSS_ATK_MULT: 2,
ABILITY_CHANCE: [0.3, 0.6],   // at first unlock → at wizard level 20
ARMOR_DMG_MULT: 0.5, ARMOR_CASTS: 1, HEAVY_ARMOR_CASTS: 2, HEAVY_ARMOR_FROM: 16,
XP_FIGHT: 10, XP_FIGHT_PERFECT: 5, XP_BOSS: 40, XP_BOSS_PERFECT: 20, XP_CRAFT: 3,
XP_NEXT: [40, 20], MAX_WIZ_LEVEL: 30,                  // 40 + 20 × g
COIN_BY_MLVL: [[1, 1], [7, 2], [19, 3], [31, 4]],
HEART_POT_HEAL: 0.3,
BREW_LOSS: [0.10, 0.02, 0.50],                         // base, per level, max
```

---

## 9. Decisions log
- Weakness → damage; other elements → no effect; own element → heals.
- Monster HP follows the math level (computed from the level's spells); strong spells stay significantly strong.
- 20% HP back after a won fight.
- Maximum wizard level 30 for v1.
- Armor: an armor bar with types that break with different elements.
