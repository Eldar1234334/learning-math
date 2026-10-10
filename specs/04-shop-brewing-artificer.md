# Math Wizard: Spec 04, Shop, Brewing and Artificer v0.1

> Status: **draft for discussion**. Builds on `00-general.md` §7, `01-math-ladder.md` §7 and `03-monsters-balance.md` §6.
> In the reading game, buying, brewing and forging each ask a Hebrew reading question. In the math game the **activity itself is the math**: measuring a recipe, paying, getting change.

---

## 1. Shared rules

- **Difficulty:** tasks use the **easy step**: one math level below the student's current level (level 1 stays at level 1). The help they need for the adventure should feel within reach.
- **Scoring** (`01-math-ladder.md` §6.1): every answer counts toward the math level with **weight 0.5 toward moving up and 1 toward moving down**. In a recipe, **each ingredient line is one scored answer**.
- **Wrong answer → a worked example.** The game shows the solution with a picture model that fits the level: a ten-frame or number line (grades 1–2), groups or an array (multiplication), a bar model (fractions, percentages, ratios), a measuring jug (liquids). Then the student tries again.
- **Real numbers.** Tasks use the real prices, the real coin balance and the real ingredients in the satchel, so the math has real consequences.
- **XP:** 3 XP per correct task (spec 03 §5.1).
- The same task screen is used everywhere, with three kinds of input (§2).

---

## 2. Input tools

| Tool | Used for | How it works |
|---|---|---|
| **Ingredient jars** | counting ingredients | each jar has ➖ / ➕ buttons and shows how many are in the cauldron; ingredients can also be dragged in |
| **Measuring jug** | liquids (free, from the cauldron tap) | a jug with a scale; tap or drag to set the level. The scale fits the level: whole drops (up to 10, 20, 100, 1000), cup fractions (halves, quarters, eighths, thirds), decimal litres (0.1, 0.25) |
| **Coin tray** | paying and change | drag coins to the counter: 🟤 copper, ⚪ silver, 🟡 gold (§4.4). Breaking a coin (1 silver → 10 copper) is a tap |
| **Number pad / answer buttons** | totals, "how many" questions | as the incantation (`01-math-ladder.md` §4.2) |

**Liquids are free** (spring water, moon water, oil from the cauldron tap). They carry the **big numbers** (hundreds, thousands, fractions, decimals), so the recipe math can grow without costing many ingredients.

---

## 3. Brewing potions

### 3.1 Flow
1. At Home, choose a potion (as now; cauldron upgrades still unlock potions).
2. The game writes a **recipe card** for that potion, using **ingredients the student owns** of the needed rarity (as now: herbs = common, stones = uncommon, …).
3. The student measures each line into the cauldron with the jars and the jug, then taps **Brew!**
4. Every line is checked:
   - **All right** → the potion is made, with a bubbling animation and +3 XP per line.
   - **A line is wrong** → the brew fails. A worked example shows the right amounts. **The chance of losing the ingredients** follows spec 03 §6.4 (10% at wizard level 1, up to 50%); otherwise they go back to the satchel. Liquids are never lost.

### 3.2 Recipe size and cost
- Each potion has a fixed **ingredient cost by rarity** (as in the reading game's `RECIPES`), now in **units**:

| Potion | Cauldron | Ingredients (approx.) |
|---|---|---|
| ❤️ Heart | clay pot | 4–10 herbs |
| 💡 Hint | clay pot | 3–8 herbs + 1 stone |
| 💥 Power | iron | 2 stones + 3–8 herbs |
| ⏪ Second chance | iron | 1 stone + 1 creature part + herbs |
| 🌟 Super | silver | 2 sky items + 1 treasure + herbs |

- Herbs carry the math; rare items stay at 1–2 units.
- A single potion uses **at most about 12 herb units**. Bigger numbers go into liquids or into **batches** (making 2–5 potions at once, which multiplies the recipe).
- **Drops scale with the recipe size:** a fight drops 1–2 units at the first math levels, and more later, so a potion costs about the same number of fights as in the reading game. Exact drop amounts go in `CFG`.

### 3.3 Recipe templates by math level

The template is chosen by the **easy step** level. Examples:

| Level | Skill | Recipe example |
|---|---|---|
| 1 | addition up to 5 | "Put in 3 mushrooms and 2 grass." |
| 2 | addition up to 10 | "6 herbs in all: 2 leaves, the rest grass." |
| 3 | subtraction up to 10 | "The recipe needs 9 seeds. You already put in 4. Add the rest." |
| 4 | missing number | "You had some roots. You used 3 and 5 are left. Put in as many roots as you had at first." |
| 5–6 | up to 20 | "Pour 15 drops of spring water, then 7 more." |
| 7 | whole tens | "Pour 30 drops of water and 40 drops of moon water." |
| 8–10 | up to 100 | "The potion needs 63 drops. The jug has 28. Fill it up to the right amount." |
| 11–12 | first multiplication | "3 handfuls of 4 seeds." · "Double this recipe." |
| 13–16 | times table, division | "Each potion needs 6 leaves. Brew 4 potions." · "Share 24 drops of oil equally among 3 bottles." |
| 17 | up to 1000 | "The flask holds 500 drops. It has 350. Fill it." |
| 18 | ×10, ×100 | "10 times the drops of this small recipe." |
| 19–20 | multi-digit × and ÷ | "Each bottle takes 125 drops. Fill 4 bottles." |
| 21 | up to 10,000 | "The big cauldron needs 2500 drops; 1350 are in." |
| 22 | fraction of an amount | "12 herbs: ¾ grass, the rest leaves." |
| 23 | equivalent fractions | "The recipe says ½ cup, but your scoop holds ⅛ cup. How many scoops?" |
| 24 | order of operations | "3 handfuls of 4 seeds, plus 2 more seeds." |
| 25–26 | add/subtract fractions | "⅜ cup of water and ⅝ cup of oil. Fill the jug to the total." · "½ cup and ⅓ cup." |
| 27 | fraction × whole | "⅔ cup per potion, 3 potions." |
| 28–29 | decimals | "0.25 L of moon water plus 0.5 L of spring water." · "Dilute: 10 times this 0.3 L." |
| 30 | multi-digit | "24 bottles of 15 drops each." |
| 31–32 | fraction × and ÷ fraction | "Use ⅔ of the ¾ cup." · "How many ¼-cup scoops make 3 cups?" |
| 33 | decimal × | "1.5 L per potion, 3 potions." |
| 34 | percentages | "20 herbs: 25% leaves, the rest grass." |
| 35 | percentages and ratios | "2 thorns for every 3 roots, 15 in all." |
| 36 | multi-step | "Make ¾ of a recipe of 8 leaves and 0.5 L water." |

The detailed generator rules (number ranges per level) follow the ladder in spec 01.

---

## 4. The shop

### 4.1 Flow
1. Choose an item (as now: cauldrons, potions, decorations, clothes).
2. A **checkout task** appears. Its type follows the easy step level (§4.2).
3. Right answer → the item is bought, and the **real price** comes off the balance.
4. Wrong answer → try again. After **2 wrong tries**, the shopkeeper shows a worked example, and the student gets a **new task of the same kind** to finish the purchase.

### 4.2 Checkout tasks by math level

| Level | Task | Example |
|---|---|---|
| 1–4 | **Pay the exact price** with copper | "A candle costs 7 copper. Put the coins on the counter." |
| 5–6 | Pay up to 20 | "15 copper = 1 silver and 5 copper." |
| 7 | Pay with silver | "40 copper: how many silver coins?" |
| 8–10 | **Totals and change** | "A plant 15 and a rug 30: what is the total?" · "Price 37; you pay with 50. How much change?" |
| 11–12 | Buying several | "3 candles at 5 each." |
| 13–16 | Times table and division | "Potions cost 6 each. How many can you buy with 42?" · "4 potions at 8." |
| 17 | Up to 1000 | expensive items (silver cauldron 220): "pay with 100s, 50s, 20s" |
| 18 | ×10, ×100 | "A box of 10 candles at 10 each." |
| 19–20 | Multi-digit | "Share the 96-copper bill equally among 4 friends." |
| 21 | Big numbers | totals in the thousands (shopping lists) |
| 22–23 | **Fraction sales** | "Half price today: ½ of 40." · "¼ off." |
| 24 | Order of operations | "2 potions at 15, a candle at 10, and a 5-copper coupon." |
| 25–27 | Fraction discounts | "⅓ off 60." · "Pay ¾ of the price." |
| 28–29, 33 | **Prices in silver with decimals** | "A bottle costs 2.5 silver (2 silver and 5 copper). You buy 4." Copper is a tenth of a silver, so the coins are a model of decimals |
| 30 | Bulk orders | "12 rugs at 25." |
| 31–32 | Fraction of a fraction | "½ of the ⅔ price." |
| 34–35 | **Percent discounts** | "25% off 80." · "The price went up 10%." |
| 36 | Multi-step | "20% off 60, and you pay with 100: change?" |

### 4.3 Sales are real
The shop has a **daily sale** on a few items. Its form follows the student's level (half price, ⅓ off, 25% off), and the student pays the **real discounted price**. Getting the math right really saves coins.

### 4.4 The wallet
The game has its own fantasy money, the same in every country:

| Coin | עברית | Value |
|---|---|---|
| 🟤 Copper | נחושת | 1 |
| ⚪ Silver | כסף | 10 copper |
| 🟡 Gold | זהב | 10 silver = 100 copper |

- **The money is base 10, a model of place value:** 237 copper = 2 gold, 3 silver, 7 copper. Paying, getting change and breaking a coin are the same as carrying and borrowing.
- The balance is still **one number in copper** (as now), shown as gold, silver and copper (for example "2🟡 3⚪ 7🟤"). All prices and coin rewards are in copper; the existing prices (10–220) stay.
- The coin tray is a **model** of the balance, not separate items. At grade 1 levels the tray shows copper (and silver from level 5); gold from level 8 or so.

---

## 5. The Artificer

### 5.1 Unlock
In the reading game, the workshop opens at reading level 8. In the math game it opens at **wizard level 8**, with the same "a light in the window!" moment.

### 5.2 Forging = recipe + payment
The three items stay the same (amulet, staff, belt; epic, then legendary).

| Step | What happens | Based on |
|---|---|---|
| 1. Blueprint | a **recipe** of rare ingredients and liquids (§3) | the existing `FORGE` rarity slots |
| 2. Payment | a **checkout task** for the forging price (§4) | 150 copper (epic), 300 copper (legendary) |

- **Epic item:** a recipe + a payment, each at the easy step.
- **Legendary upgrade:** a **multi-step** task at the student's **current** level (not the easy step), for example: "The legendary amulet needs 3 times the epic recipe, plus ¼ more moon water", then a payment with a percentage discount for returning customers.
- A failed forge uses the same loss rule as brewing (spec 03 §6.4), but the coins are only paid when the forge succeeds.

---

## 6. Profile and `CFG`

New `CFG` keys:

```js
CRAFT_TRIES_BEFORE_HELP: 2,
DROP_UNITS: [[1, 1, 2], [7, 2, 3], [13, 2, 4], [22, 3, 5]],   // [from math level, min, max] units per drop
MAX_HERBS_PER_POTION: 12,
BATCH_MAX: 5,
SALE_ITEMS_PER_DAY: 3,
WORKSHOP_WIZ_LEVEL: 8,
MONEY: { copper: 1, silver: 10, gold: 100 },
MONEY_SHOW: [[1, ['copper']], [5, ['copper', 'silver']], [8, ['copper', 'silver', 'gold']]],   // [from math level, coins in the tray]
```

Profile: the satchel and inventory now hold **counts per ingredient** (in the reading game they already are counts, so no change of shape is needed). A `sale` field stores today's sale (date, items, discount form).

---

## 7. Decisions log
- Fantasy money, base 10: copper, silver (10 copper), gold (10 silver). Universal, not tied to any country.
- Free liquids carry the big numbers.
- Shop after 2 wrong tries: a worked example, then a new task of the same kind; the item is bought only after a correct answer.
