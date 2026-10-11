# Math Wizard: Handoff to the Build Session

> From: the design session (game ideas and specs).
> To: the build session (GitHub, fine-tuning, test and live releases).
> Date: 2026-10-10.

## 1. What this is

**Math Wizard** is a math practice adventure for grades 1–6. It is built from the Hebrew reading game **`learning-to-read`**, but its combat, progression, shop and crafting are new. The project owner is a math teacher, and they decide on design questions.

The new repository already exists. Start it as a copy of `learning-to-read`.

## 2. The specs (read in this order)

| File | What it covers |
|---|---|
| `00-general.md` | The whole idea: spell-book combat, two leveling tracks, what is kept from the reading game |
| `01-math-ladder.md` | 36 math levels (grade 1–6), answer types, problem generation, moving up and down |
| `02-spells.md` | The spell book: elements, spell types, the ×10 tiers, the full catalog |
| `03-monsters-balance.md` | Damage, HP, monster abilities, armor, XP curve, economy, `CFG` values |
| `04-shop-brewing-artificer.md` | Recipe math, shop checkout tasks, money, the Artificer |

The specs are the source of truth. Each ends with a **decisions log**. **Do not change a decision in the log without asking the project owner.** If something is unclear or does not work in practice, ask instead of guessing, and note the answer in the spec.

## 3. Key decisions at a glance

- The hero is a wizard or a witch. Home, Shop and Artificer are kept; their questions become math activities.
- **Combat:** the student picks one of 3–6 problem cards (answers hidden). The answer is cast as the spell with that number. **Weakness → damage; any other element → no effect; the monster's own element → heals it.** The monster always attacks unless a spell stops it. The wizard has **HP that carries over** through the quest run.
- **Spells are keyed to exact numbers only** (no "odd/even" keys for now). **Spell numbers never change.** Higher tiers are ×10: `3` Fire Bolt → `30` Enhanced → `300` Greater → `3000` Legendary.
- **No equipping:** every learned spell is always available, and the spell book can be opened at any moment.
- **Two leveling tracks:** the math level (slow, adaptive, 36 levels) and the wizard level (fast, XP, 30 levels).
- **Math scoring:** levels 1–4 score the pick; from level 5 the student also gives the answer (the incantation), and that is the math score.
- **Language:** Hebrew and English UI with a toggle. Math is always written left to right. The division sign is `:` in Hebrew and `÷` in English.
- **Money:** fantasy base-10 money: copper, silver (10 copper), gold (10 silver).
- **Village Helper** is **not part of v1** (only an idea note in `00-general.md` §8).

## 4. Suggested build order

Each phase should end in a playable state on the **test** site.

| Phase | Work | Done when |
|---|---|---|
| 0. Setup | Copy the reading game. Rename the app (title, `manifest.webmanifest`, icons). Change the `localStorage` prefix (the reading game uses `aq_`) and the service worker cache name in `sw.js` to the new game's name. This is a safety measure only: the two games are on different GitHub accounts, so their saves are already separate. It matters only if they ever move to the same account or domain. Clear `CFG.SCRIPT_URL` until a new save sheet exists. Remove the reading content (letters, syllables, `syllables.wav`, `recorder.html`). | The app runs and does not touch the reading game's saves |
| 1. Language | A string table per language, a toggle on the menu, RTL/LTR switching, saved in the profile | Every screen works in both languages |
| 2. Math engine | The level table, value types (whole, fraction, decimal), canonical display, problem generators per level, distractors, weak-spot memory, the scoring window. **Unit tests** for generators and fraction math | Tests pass; a debug page lists sample problems for any level |
| 3. Spell book | Spell data, the two gates (math and wizard level), the book UI with sealed spells, "new spell" moments | The book shows the right spells for any (math level, wizard level) |
| 4. Combat | Card sets (target answers first), cast, element rules, monster turn, HP bars, the incantation step, the potions' new effects | A full quest run with a boss is playable |
| 5. Wizard progression | XP, wizard level, unlocks (cards per turn, spell types), monster abilities, armor, groups, cosmetic rewards | Every unlock in spec 03 §5 appears at its level |
| 6. Balance | A **fight simulator** script (not in the game) for good, average and guessing players; tune `CFG` | The goals in spec 03 §1 hold |
| 7. Brewing | Recipe generator per level, ingredient jars, measuring jug, free liquids, batches, loss chance, worked examples | Every recipe template in spec 04 §3.3 works |
| 8. Shop | Checkout tasks per level, coin tray (copper, silver, gold), daily sale | Every task in spec 04 §4.2 works |
| 9. Artificer | Recipe + payment, the legendary multi-step task, unlock at wizard level 8 | Both item versions can be forged |
| 10. Tutorial and polish | A new first-time tutorial (the owl), sounds, the hidden Village Helper ("coming soon") | A new student can start without help |
| 11. Saving | A **new Google Sheet + its own Apps Script web app**, in the **same Google account** as the reading game: `learningtoread.app@gmail.com` (decided by the project owner). **Never write math-game data to the reading game's sheet** (see §8). Start from a copy of the reading game's sheet and script, then change the columns for this game (`mlvl`, wizard level, …). Deploy it as a new web app and put its URL in `CFG.SCRIPT_URL`. The two games share the account's Apps Script daily quotas, which is fine at school scale. Decide separately whether the e-mail code service (`VERIFY_URL`) is reused | Progress saves and the teacher sees `mlvl` |

## 5. Where things are in the reading game's `index.html`

| Area | Look for |
|---|---|
| Settings | `CFG` |
| Elements and monsters | `EL`, `MON_DEF`, `AREA_MON`, `AREAS`, `MON_ART`, `BOSS`, `FIGHT` (backgrounds) |
| Questions and answers | `makeQ`, `qSpell`, `pickOption` (to be replaced by the math engine and the card sets) |
| Hearts and quest runs | `startQuest`, `loseHeart`, `CFG.MIN_FIGHTS` / `MAX_FIGHTS` |
| Leveling | `TIERS`, `UP_ACC` / `DOWN_ACC` / window keys in `CFG` |
| Potions and brewing | `POTIONS`, `RECIPES`, `CAULDRONS`, `pickIngredients`, `startCraft` |
| Ingredients and drops | `ING`, `RARITY`, `DROP` |
| Shop | `SHOP`, `DECOR` |
| Artificer | `MAGIC`, `FORGE` |
| Profile and saving | `newProfile`, `migrate`, `PROFILE_V`, `cloudSave`, `loadProfile` |
| Tutorial | `TUT`, `playTutorial` |

This is a **new game with new profiles**: there is no need to migrate reading-game saves. Start `PROFILE_V` again at 1.

## 6. Test and live

The reading game deploys with `.github/workflows/pages.yml`: `main` is the **live** site at the root, and the newest `test-*` branch is the **test** site under `/test/`. Keep the same flow for Math Wizard. Every phase goes to test first; the project owner approves before it goes live.

**Note:** the test site (`/test/`) and the live site are on the same address, so on one device they **share saved profiles**. A test build that changes the profile format can change a live student's save. Once real students play, test builds that change the save format should use a separate storage prefix (for example `mw_test_`).

## 7. Not in v1 (do not build yet)

- Village Helper mode (conjuring, word problems).
- Property spell keys (odd, even, bigger than…).
- Equipping or choosing spells before a quest (decided against).

## 8. Saving data: a separate sheet (required)

- Google account: **`learningtoread.app@gmail.com`**. The reading game already uses it, and the project owner is logged in.
- **Create a new, separate Google Sheet for Math Wizard** (for example "Math Wizard – progress"), with **its own Apps Script web app** and its own deployment URL.
- **Do not reuse or change the reading game's sheet, script or deployment.** Students' reading progress is in it.
- The easiest start: copy the reading game's sheet in that account (File → Make a copy, which also copies a script attached to the sheet), rename it, change the columns for this game, and deploy the copy as a **new** web app (Deploy → New deployment → Web app).
- Put the new URL in `CFG.SCRIPT_URL` of the math game only.
- Signing in to Google and deploying are done by the project owner in their own browser. The build session prepares the script code and step-by-step instructions.

## 8a. Decisions made during the build

- 2026-10-10: the installed app's e-mail code service (`VERIFY_URL`) is **separate from the reading game's**: Math Wizard gets its own small Apps Script service, set up in phase 11 together with the progress sheet (decided by the project owner). Until then the app offers offline play only.
- 2026-10-10: the credit line is "Created by Dr. Dadon Eldar" only (no HLA line).
- 2026-10-10: "counts ½ toward moving up" (spec 01 §6.1) means a right shop, brewing, forging or review answer is worth half an answer in the window; a mistake always counts as a full answer (confirmed by the owner).
- 2026-10-10: level 35 ratio problems are worded "the first part of 57 in the ratio 2:1" / "החלק הראשון של 57 ביחס 2:1" (confirmed by the owner). **Replaced later the same day:** the owner removed the ratio problems; level 35 is now "Harder percentages" / "אחוזים מתקדמים" (p% of a, p up to 150). This changes spec 01 §3 level 35.
- 2026-10-10: the game keeps the name "Math Wizard" also in Hebrew mode for now (the owner may choose a Hebrew name later).
- 2026-10-10: Light Spark (1) opens at math level 3, not 2: level 2 problems never have the answer 1 (owner decision; spec 02 §6.1 updated in spells.js).
- 2026-10-10: effects of the higher tiers not given in spec 02 (owner approved): Wind Shield 600 blocks 2 attacks, 6000 blocks 3; Healing Leaf 800 heals 6, 8000 heals 8; Shadow Snare 900 2 turns, 9000 3 turns; Time Freeze 190 3 turns; Arcane Echo 160 triple power.
- 2026-10-10: emoji are drawn with the Noto Color Emoji web font, so newer emoji (🪨 stone, 🪙 coin, 🪴 plant) also show on Windows 10.
- 2026-10-10: card sets (owner decision, changes spec 02 §4 "defense option from wizard level 22"): every set of 4 or more cards (wizard level 3+) has one support card, a shield or healing spell, so the player chooses between attacking and defending. With low HP it is a healing spell; at full HP never a healing spell. The utility card no longer replaces the attack card. Other utility spells (control, summon, buff, special) get one more slot from 5 cards (wizard level 15). A control spell (Shadow Snare, Time Freeze) may also take the support card's place (owner decision), about 1 time in 3 when HP is not low.
- 2026-10-10: no power bonus for a right incantation for now (owner decision; spec 00 §4.1 suggested a small one; `CB.CFG.INCANT_BONUS = 1`). Approved by the owner: the campfire heals 25% of max HP; Shrinking Hex halves the monster's attack.

- 2026-10-10 (phase 5, proposals waiting for the owner): a group's monsters each have half the HP and 40% of the attack of a single monster (`GROUP_HP_EACH`, `GROUP_ATK_EACH`); heavy armor on half of the armors from wizard level 16; titles at wizard levels 1, 2, 7, 14, 21, 25, 29, 30 and gifts (decoration 4, 17, 23, 27; wardrobe item 19, 24, 26, 28) on the other gap levels; armor and shapeshifting never on the same monster; a magic shield (Shielded) is broken by any attack spell, also one of an element that has no effect.

- 2026-10-10 (phase 5, owner decisions after the check; changes spec 02 §6.2 and spec 03 §4): the proposals above are approved. Ability schedule: armored 6, shapeshifter 9, charging 11, shielded 13, group 15, heavy armor 16, regenerating 17, double attack 20. Charging and the magic shield are traits any monster may get on top of its ability (25% / 20%, proposals). Armor is counted in layers: 2 (heavy 3), each breaking hit removes one. The attack spells 11–18 are area spells (type stays "attack", open from math level 5); 110–180 have power 8; 15 is renamed Blizzard / סופת שלגים; 19 Time Freeze holds every monster. Group fights: 2–3 monsters of different elements side by side (at least two share a weakness), every group monster attacks as hard as a single monster and has half its HP (owner decision), the student taps a target, casts 2 spells per turn from one card set and may change the cards once per turn; every monster attacks. The monster manual: from wizard level 12 (proposal) the student may leave it at home (no weakness hints, pouch 6 instead of 5), and take it back from the map outside a quest.

- 2026-10-11: owner decisions: the monster manual's place is the small shelf at Home (take it and put it back there; no map button); each group monster has 80% of a single monster's HP.
- 2026-10-11 (phase 6, balance from tools/sim.html; proposals waiting for the owner; changes spec 03 §3.2–3.3): BOSS_HP_MULT 2 (was 3), BOSS_ATK_MULT 1.5 (was 2), MON_ATK_EVERY 8 (was 6), a boss never gets the double attack, a regenerating boss heals 5% (REGEN_BOSS). Card sets: the good card follows the 80/20 own-level/review split; the strong card (wizard 15+) is the strongest good spell, also from review; Triple Strike counts as power 3; P_typ from wizard level 15 is the average of the strong and the easy card. All goals of spec 03 §1 pass in the simulator, which now runs on every upload.
- 2026-10-11 (owner decisions, spell visuals review): the Owl Familiar is now the Hawk Familiar (נץ מלווה, 🦅); the familiars use the owner's pictures (art/fam-*.webp); the Dragon familiar hits every element and every monster, each breath = DRAGON_SHARE (0.5) × P_typ × S(g). Spell looks per the owner's comments (see PROGRESS.md).
- 2026-10-11 (phase 7, proposals waiting for the owner): every won fight drops herbs (BR.CFG.DROP_UNITS) besides the usual item; rare items are not math lines; at fraction/decimal levels the herb lines come from the nearest level with whole answers, the liquid line carries the level's fractions/decimals. Brewing rules are in brew.js.
- 2026-10-11 (phase 7, owner decisions after the check): the three proposals above are approved; an average student should have plenty of herbs, so the herb drops are bigger: 3–5 units, 4–6 from math level 7, 5–8 from 13, 6–9 from 22. A batch never shrinks because one chosen rare item runs short: other items of the same rarity fill in (BR.rarePlan). Liquid lines are small stories ("The pitcher is ⅖ full. You pour ⅕ out of it. Pour in what is left."). Proposal waiting for the owner: ratio lines ("For every 3 leaves, pour 15 drops. The recipe has 9 leaves.") from the easy step 16, in about 1 recipe of 3 (BR.CFG.RATIO_FROM, RATIO_CHANCE); this is in recipes only, the math ladder still has no ratio problems (the level 35 decision stays).

## 9. Questions and changes

The design session stays open for new ideas and design questions. Bring back:
- any decision the specs do not cover
- any balance number that the simulator or playtests show is wrong
- anything that feels confusing for a 6-year-old
