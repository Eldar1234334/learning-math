/* SpellQuest: the villager visit (spec 05), pure logic only (no screen).
   A village project has two items. Each item is one ROUND, and the steps of a round depend on the math level:
     beginner (math level 1, wizard level 1): the answer only (no book, the item is told by the villager)
     math level 1: the answer, then the item from the conjuration book (no card that fits the story)
     math level 2 and up: the card that fits the story (one level lower), the answer, then the item
   Every action costs one mana, right or wrong (the villagers do not attack; in the fight mode the wizard's HP takes the hits).
   A right answer also fills the happy meter.
   The mana of a visit: 8 + 2 × (wizard level − 1) + 2 × math level.
   Tests: tests/helper.test.js. The screen is in index.html. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.HELPER = f(); })(typeof self !== 'undefined' ? self : this, function () {
  // the conjuration book: each item has a fixed number and the first math level where it is an answer (approved list)
  const BOOK = [
    { n: 1, lvl: 3, one: ['Hammer', 'פטיש'], many: ['Hammers', 'פטישים'], em: '🔨' },
    { n: 2, lvl: 1, one: ['Water', 'מים'], many: ['Water', 'מים'], em: '💧' },
    { n: 3, lvl: 1, one: ['Apple', 'תפוח'], many: ['Apples', 'תפוחים'], em: '🍎' },
    { n: 4, lvl: 1, one: ['Egg', 'ביצה'], many: ['Eggs', 'ביצים'], em: '🥚' },
    { n: 5, lvl: 1, one: ['Flour', 'קמח'], many: ['Flour', 'קמח'], em: '🌾' },
    { n: 6, lvl: 2, one: ['Rope', 'חבל'], many: ['Ropes', 'חבלים'], em: '🪢' },
    { n: 7, lvl: 2, one: ['Candle', 'נר'], many: ['Candles', 'נרות'], em: '🕯️' },
    { n: 8, lvl: 2, one: ['Nail', 'מסמר'], many: ['Nails', 'מסמרים'], em: '🔩' },
    { n: 9, lvl: 2, one: ['Seed', 'זרע'], many: ['Seeds', 'זרעים'], em: '🌰' },
    { n: 10, lvl: 2, one: ['Milk', 'חלב'], many: ['Milk', 'חלב'], em: '🥛' },
    { n: 11, lvl: 5, one: ['Salt', 'מלח'], many: ['Salt', 'מלח'], em: '🧂' },
    { n: 12, lvl: 5, one: ['Iron', 'ברזל'], many: ['Iron', 'ברזל'], em: '⚙️' },
    { n: 13, lvl: 5, one: ['Fire', 'אש'], many: ['Fire', 'אש'], em: '🔥' },
    { n: 14, lvl: 5, one: ['Bucket', 'דלי'], many: ['Buckets', 'דליים'], em: '🪣' },
    { n: 15, lvl: 5, one: ['Book', 'ספר'], many: ['Books', 'ספרים'], em: '📖' },
    { n: 16, lvl: 5, one: ['Sun', 'שמש'], many: ['Sun', 'שמש'], em: '☀️' },
    { n: 17, lvl: 5, one: ['Boat', 'סירה'], many: ['Boats', 'סירות'], em: '⛵' },
    { n: 18, lvl: 5, one: ['Net', 'רשת'], many: ['Nets', 'רשתות'], em: '🥅' },
    { n: 19, lvl: 5, one: ['Straw', 'קש'], many: ['Straw', 'קש'], em: '🌿' },
    { n: 20, lvl: 6, one: ['Cloth', 'בד'], many: ['Cloth', 'בד'], em: '🧶' },
    { n: 21, lvl: 8, one: ['Oil', 'שמן'], many: ['Oil', 'שמן'], em: '🫒' },
    { n: 22, lvl: 8, one: ['Ladder', 'סולם'], many: ['Ladders', 'סולמות'], em: '🪜' },
    { n: 23, lvl: 8, one: ['Basket', 'סל'], many: ['Baskets', 'סלים'], em: '🧺' },
    { n: 24, lvl: 8, one: ['Wood', 'עץ'], many: ['Wood', 'עץ'], em: '🪵' },
    { n: 25, lvl: 13, one: ['Fishing rod', 'חכה'], many: ['Fishing rods', 'חכות'], em: '🎣' },
    { n: 26, lvl: 10, one: ['Saw', 'מסור'], many: ['Saws', 'מסורים'], em: '🪚' },
    { n: 27, lvl: 10, one: ['Bread', 'לחם'], many: ['Bread', 'לחם'], em: '🍞' },
    { n: 28, lvl: 10, one: ['Cheese', 'גבינה'], many: ['Cheese', 'גבינה'], em: '🧀' },
    { n: 30, lvl: 7, one: ['Thread', 'חוט'], many: ['Thread', 'חוטים'], em: '🧵' },
    { n: 36, lvl: 14, one: ['Lamp', 'מנורה'], many: ['Lamps', 'מנורות'], em: '🏮' },
    { n: 40, lvl: 7, one: ['Needle', 'מחט'], many: ['Needles', 'מחטים'], em: '🪡' },
    { n: 42, lvl: 14, one: ['Chair', 'כיסא'], many: ['Chairs', 'כיסאות'], em: '🪑' },
    { n: 45, lvl: 14, one: ['Flag', 'דגל'], many: ['Flags', 'דגלים'], em: '🚩' },
    { n: 48, lvl: 14, one: ['Drum', 'תוף'], many: ['Drums', 'תופים'], em: '🥁' },
    { n: 49, lvl: 14, one: ['Flute', 'חליל'], many: ['Flutes', 'חלילים'], em: '🪈' },
    { n: 50, lvl: 7, one: ['Bed', 'מיטה'], many: ['Beds', 'מיטות'], em: '🛏️' },
    { n: 55, lvl: 16, one: ['Bell', 'פעמון'], many: ['Bells', 'פעמונים'], em: '🔔' },
    { n: 60, lvl: 7, one: ['Blanket', 'שמיכה'], many: ['Blankets', 'שמיכות'], em: '🧣' },
    { n: 64, lvl: 14, one: ['Flower', 'פרח'], many: ['Flowers', 'פרחים'], em: '🌸' }
  ];
  // the Hebrew gender of each item (for the verbs of the stories: "נשבר" or "נשברה"); the items are by their number
  const GENDER = { 1: 'm', 2: 'm', 3: 'm', 4: 'f', 5: 'm', 6: 'm', 7: 'm', 8: 'm', 9: 'm', 10: 'm', 11: 'm', 12: 'm', 13: 'f', 14: 'm', 15: 'm', 16: 'f',
    17: 'f', 18: 'f', 19: 'm', 20: 'm', 21: 'm', 22: 'm', 23: 'm', 24: 'm', 25: 'f', 26: 'm', 27: 'm', 28: 'f', 30: 'm', 36: 'f', 40: 'f', 42: 'm',
    45: 'm', 48: 'm', 49: 'm', 50: 'f', 55: 'm', 60: 'f', 64: 'm' };
  // the mass items (spec 05 §6): counted with a unit, "3 sacks of flour" / "3 שקי קמח"; [singular, plural, of-part, gender] in English and Hebrew
  const MASS = {
    2: { one: ['cup', 'כוס'], many: ['cups', 'כוסות'], of: ['of water', 'מים'], g: 'f' },
    5: { one: ['sack', 'שק'], many: ['sacks', 'שקי'], of: ['of flour', 'קמח'], g: 'm' },
    10: { one: ['cup', 'כוס'], many: ['cups', 'כוסות'], of: ['of milk', 'חלב'], g: 'f' },
    11: { one: ['spoon', 'כף'], many: ['spoons', 'כפות'], of: ['of salt', 'מלח'], g: 'f' },
    12: { one: ['bar', 'מוט'], many: ['bars', 'מוטות'], of: ['of iron', 'ברזל'], g: 'm' },
    13: { one: ['flame', 'להבה'], many: ['flames', 'להבות'], of: ['of fire', 'אש'], g: 'f' },
    19: { one: ['bundle', 'צרור'], many: ['bundles', 'צרורות'], of: ['of straw', 'קש'], g: 'm' },
    20: { one: ['roll', 'יריעה'], many: ['rolls', 'יריעות'], of: ['of cloth', 'בד'], g: 'f' },
    21: { one: ['bottle', 'בקבוק'], many: ['bottles', 'בקבוקים'], of: ['of oil', 'שמן'], g: 'm' },
    24: { one: ['plank', 'קורה'], many: ['planks', 'קורות'], of: ['of wood', 'עץ'], g: 'f' },
    27: { one: ['loaf', 'כיכר'], many: ['loaves', 'כיכרות'], of: ['of bread', 'לחם'], g: 'f' },
    28: { one: ['chunk', 'גוש'], many: ['chunks', 'גושי'], of: ['of cheese', 'גבינה'], g: 'm' }
  };
  const genderOf = item => (MASS[item.n] ? MASS[item.n].g : GENDER[item.n] || 'm');
  // the item as it reads in a story, with its count: "3 sacks of flour" / "1 sack of flour" / "3 cups" for a countable item
  const storyName = (item, n) => {
    const m = MASS[item.n];
    if (!m) return nameFor(item, n);
    const u = n === 1 ? m.one : m.many;
    return [`${u[0]} ${m.of[0]}`, `${u[1]} ${m.of[1]}`];
  };
  const itemOf = n => BOOK.find(x => x.n === n) || null;
  const itemByHe = he => BOOK.find(x => x.one[1] === he) || null;
  const nameFor = (item, count) => (count === 1 ? item.one : item.many);   // [English, Hebrew]
  const reachable = mlvl => BOOK.filter(x => x.lvl <= mlvl);   // the items a student can be asked for at this math level
  const pick = (a, r) => a[Math.floor(r() * a.length)];
  const int = (lo, hi, r) => lo + Math.floor(r() * (hi - lo + 1));

  // beginners: math level 1 and wizard level 1 (no conjuration book)
  const isBeginner = (mlvl, wlvl) => mlvl <= 1 && wlvl <= 1;
  // the amount problems are one level lower than the current math level (never below 1)
  const amountLevel = mlvl => Math.max(1, mlvl - 1);
  // the visit's plan: the mana (as the fight's HP grows with the wizard level), the steps of each item, the happy meter
  function plan(mlvl, wlvl, items = 2) {
    const beginner = isBeginner(mlvl, wlvl);
    // per item: step 1 = the item (card whose answer is the item's number, then that answer); step 2 = the amount (card that solves the story, then the answer)
    const cardStep = !beginner && mlvl >= 2, itemStep = !beginner;
    // an action is an answer: choosing the right card is free, the answer that follows it is the one action (the card and its answer are one step)
    const perItem = 1 + (itemStep ? 1 : 0);
    return { beginner, cardStep, itemStep, items, perItem, happyMax: items * perItem, mana: 8 + 2 * (wlvl - 1) + 2 * mlvl, lowLevel: amountLevel(mlvl) };
  }

  // ---------- the story problems of the amount step (spec 05 §5) ----------
  // Every type starts at the math level where its operation is ready (spec 05 §5.1 to §5.3). The numbers of a story follow the math ladder of that
  // level (spec 01 §3): the same ranges as the fight's cards. The amount level is the student's level minus one (see amountLevel).
  // Every story is a real problem: the answer (the amount) is never one of the numbers in the story, and a story is always a request ("conjure ...").
  //   join       level 1   "I have a. My friend gives me b more. Conjure as many as I have now."      a + b
  //   separate   level 3   "I had t. I gave b away. Conjure as many as I have left."                  t − b
  //   change     level 4   "I need t. I have a. Please conjure the rest."                              t − a
  //   part       level 4   "I need t: a for the hall, the rest for the kitchen."                       t − a
  //   compare    level 5   "The baker has t. I have a. Conjure enough to match."                       t − a
  //   start      level 6   "I had some. I used u, and r are left. Conjure as many as I had."           u + r
  //   two        level 9   "I need t. I have a, and my neighbour gives me b."                          t − (a + b)
  //   groups     level 11  "I have g boxes. Each box needs n. Conjure it all."                         g × n
  //   array      level 13  "My garden has r rows, c in each row."                                      r × c
  //   share      level 15  "t to share among k children. Conjure one child's share."                   t ÷ k
  //   group      level 15  "One for every n children. There are t children."                           t ÷ n
  //   mcompare   level 16  "The wall needs a. The tower needs k times as many."                         k × a
  //   ceil       level 20  "One for every group of n guests, even a smaller group. t guests."          t ÷ n, rounded up
  //   fracset    level 22  "I need ¾ of the 12 on my shelf."                                           a fraction of a set
  //   multi      level 24  "I need g boxes of n. I have a. Conjure the rest."                          g × n − a
  //   fracleft   level 25  "I had 20 and used ⅖ of them. Conjure as many as are left."                 the fraction that remains
  //   decimal    level 28  "I need 4.5 metres of rope. I have 2.75 metres. Conjure the rest."          a − b with decimals (measures only)
  //   percent    level 34  "25% of my 40 are spoiled. Conjure the same number to replace them."        a percent of an amount
  //   ratio      level 35  "For every 3 eggs I need 2 cups of flour. I have 9 eggs."                   a ratio
  //   mix        level 36  "I need ¾ of 12. I have 5. Conjure the rest."                                a fraction, then the rest
  const rnd2 = x => Math.round(x * 100) / 100;
  const FRAC = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙', '5/6': '⅚', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞' };
  const fr = (n, d) => FRAC[n + '/' + d] || (n + '/' + d);
  const fmtN = x => String(rnd2(x));   // a decimal without trailing zeros
  const T = (text, value) => ({ text, value: rnd2(value) });   // a card that is written out: "¾ × 12"
  // the items that are measured, with their unit: [English, Hebrew] (the decimal stories, level 28)
  const MEASURE = { 6: ['metres', 'מטר'], 20: ['metres', 'מטר'], 30: ['metres', 'מטר'], 2: ['litres', 'ליטר'], 10: ['litres', 'ליטר'], 21: ['litres', 'ליטר'], 5: ['kg', 'ק״ג'], 11: ['kg', 'ק״ג'], 12: ['kg', 'ק״ג'], 19: ['kg', 'ק״ג'] };
  const measureOf = item => MEASURE[item.n] || null;
  // "one bucket" / "תפוח אחד": one of the item, for the stories that need one for every group
  const oneName = item => { const n = storyName(item, 1); return ['one ' + n[0].toLowerCase(), n[1] + (genderOf(item) === 'f' ? ' אחת' : ' אחד')]; };
  // the numbers of a level for adding and taking away: [a, b], the whole is a + b (spec 01 §3: levels 1–10, then up to 1000; the village stories stay within 1000 at the higher levels)
  function pairFor(L, r) {
    if (L <= 1) { const s = int(2, 5, r), a = int(1, s - 1, r); return [a, s - a]; }
    if (L <= 4) { const s = int(2, 10, r), a = int(1, s - 1, r); return [a, s - a]; }
    if (L === 5) { const x = int(0, 8, r); return [10 + x, int(1, 9 - x, r)]; }   // up to 20, no crossing ten
    if (L === 6) { const a = int(5, 9, r); return [a, int(Math.max(2, 11 - a), 9, r)]; }   // up to 20, crossing ten
    if (L === 7) { const a = 10 * int(1, 8, r); return [a, 10 * int(1, 10 - a / 10, r)]; }   // whole tens
    if (L === 8) { const x = int(1, 8, r); return [10 * int(1, 8, r) + x, int(1, 9 - x, r)]; }   // two-digit and one-digit, no crossing
    if (L === 9) { const x = int(2, 9, r); return [10 * int(1, 8, r) + x, int(10 - x, 9, r)]; }   // crossing ten
    if (L <= 16) { const a = int(11, 89, r); return [a, int(11, 100 - a, r)]; }
    const a = int(100, 800, r); return [a, int(20, Math.min(400, 999 - a), r)];
  }
  // the numbers of a level for multiplying: [g, n] (spec 01 §3: levels 11–20, then two-digit by two-digit at 30)
  function mulPair(L, r) {
    if (L <= 11) return [pick([2, 5, 10], r), int(2, 10, r)];
    if (L === 12) return [pick([2, 3, 4, 5, 10], r), int(2, 10, r)];
    if (L === 13) return [int(2, 5, r), int(2, 10, r)];
    if (L === 14) return [int(6, 10, r), int(2, 10, r)];
    if (L <= 17) return [int(2, 10, r), int(2, 10, r)];
    if (L === 18) return r() < 0.5 ? [int(2, 12, r), pick([10, 100], r)] : [int(11, 30, r), int(2, 9, r)];
    if (L <= 29) return [int(2, 9, r), int(11, 110, r)];
    return [int(11, 25, r), int(11, 30, r)];
  }
  // the numbers for dividing: [k, q], the whole is k × q
  const divPair = (L, r) => (L <= 19 ? [int(2, 10, r), int(2, 10, r)] : [int(2, 9, r), int(12, 99, r)]);
  const mk = (kind, nums, amount, expr, extra) => ({ kind, nums, amount, expr, ...extra });
  // the fractions of a set: [numerator, denominator], the set is a multiple of the denominator
  const FRAC_SET = [[1, 2], [1, 3], [1, 4], [3, 4], [2, 3]], FRAC_MORE = [[1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [1, 8], [3, 8]];
  const fracPick = (L, r) => pick(L >= 25 ? FRAC_SET.concat(FRAC_MORE) : FRAC_SET, r);
  const subtractive = (id, from) => ({ id, from, make(L, r) {
    const [x, a] = pairFor(L, r), t = x + a;   // the need t and what is there a: the rest is x
    return mk(id, [t, a], x, { a: t, op: '−', b: a }, { v: { t, a }, names: { item: t }, show: { have: a, of: t } });
  } });
  const TYPES = [
    { id: 'join', from: 1, make(L, r) { const [a, b] = pairFor(L, r); return mk('join', [a, b], a + b, { a, op: '+', b }, { v: { a, b }, names: { item: a }, show: { have: a, plus: b } }); } },
    { id: 'separate', from: 3, make(L, r) { const [a, b] = pairFor(L, r), t = a + b; return mk('separate', [t, b], a, { a: t, op: '−', b }, { v: { t, b }, names: { item: t }, show: { have: t } }); } },
    subtractive('change', 4), subtractive('part', 4), subtractive('compare', 5),
    { id: 'start', from: 6, make(L, r) { const [u, left] = pairFor(L, r); return mk('start', [u, left], u + left, { a: u, op: '+', b: left }, { v: { u, r: left }, names: { item: u }, show: { have: left } }); } },
    { id: 'two', from: 9, make(L, r) {   // "I need t; I have a, and my neighbour gives me b" (the rest is t−a−b)
      const k = L <= 16 ? 1 : 10, a = k * int(L <= 16 ? 5 : 3, 30, r), b = k * int(L <= 16 ? 5 : 3, 30, r), x = k * int(L <= 16 ? 1 : 3, L <= 16 ? Math.min(40, 100 - a - b) : 30, r), t = a + b + x;
      return mk('two', [t, a, b], x, { a: t, op: '−', b: a + b }, { v: { t, a, b }, names: { item: t }, show: { have: a, of: t, plus: b } });
    } },
    { id: 'groups', from: 11, make(L, r) { const [g, n] = mulPair(L, r); return mk('groups', [g, n], g * n, { a: g, op: '×', b: n }, { v: { g, n }, names: { item: n } }); } },
    { id: 'array', from: 13, make(L, r) { const [rows, c] = mulPair(L, r); return mk('array', [rows, c], rows * c, { a: rows, op: '×', b: c }, { v: { r: rows, c }, names: { item: c } }); } },
    { id: 'share', from: 15, make(L, r) { const [k, q] = divPair(L, r), t = k * q; return mk('share', [t, k], q, { a: t, op: '÷', b: k }, { v: { t, k }, names: { item: t } }); } },
    { id: 'group', from: 15, make(L, r) { const [k, q] = divPair(L, r), t = k * q; return mk('group', [t, k], q, { a: t, op: '÷', b: k }, { v: { t, n: k }, one: true }); } },
    { id: 'mcompare', from: 16, make(L, r) { const k = int(2, L <= 17 ? 10 : 9, r), a = L <= 17 ? int(2, 10, r) : int(11, 60, r); return mk('mcompare', [a, k], k * a, { a: k, op: '×', b: a }, { v: { a, k }, names: { item: a } }); } },
    { id: 'ceil', from: 20, make(L, r) {   // the remainder in context: round up (spec 05 §5.2)
      const n = int(3, 9, r), q = int(2, 25, r), t = n * q + int(1, n - 1, r);
      return mk('ceil', [t, n], q + 1, T(`⌈${t} ÷ ${n}⌉`, q + 1), { v: { t, n }, one: true, wrong: [T(`⌊${t} ÷ ${n}⌋`, q), { a: t, op: '−', b: n }, { a: t, op: '+', b: n }, { a: n, op: '×', b: q }] });
    } },
    { id: 'fracset', from: 22, make(L, r) {
      const [n, d] = fracPick(L, r), q = int(2, 10, r), t = d * q, f = fr(n, d);
      return mk('fracset', [t], n * q, T(`${f} × ${t}`, n * q), { v: { fr: f, t }, names: { item: t }, wrong: [T(`${t} ÷ ${d}`, q), T(`${fr(d - n, d)} × ${t}`, (d - n) * q), T(`${t} − ${n}`, t - n), T(`${t} × ${n}`, t * n), T(`${t} ÷ ${f}`, t * d / n)] });
    } },
    { id: 'multi', from: 24, make(L, r) {   // order of operations in a story: g × n − a
      const g = L >= 30 ? int(3, 12, r) : int(2, 6, r), n = L >= 30 ? int(11, 30, r) : int(2, 9, r), whole = g * n, a = int(1, whole - 1, r);
      return mk('multi', [g, n, a], whole - a, T(`${g} × ${n} − ${a}`, whole - a), { v: { g, n, a }, names: { item: n }, wrong: [T(`${g} × ${n} + ${a}`, whole + a), T(`${g} + ${n} − ${a}`, g + n - a), T(`${g} × ${a} − ${n}`, g * a - n), T(`${g} × (${n} − ${a})`, g * (n - a))] });
    } },
    { id: 'fracleft', from: 25, make(L, r) {
      const [n, d] = fracPick(L, r), q = int(2, 10, r), t = d * q, f = fr(n, d), rest = fr(d - n, d);
      return mk('fracleft', [t], (d - n) * q, T(`${rest} × ${t}`, (d - n) * q), { v: { fr: f, t }, names: { item: t }, wrong: [T(`${f} × ${t}`, n * q), T(`${t} ÷ ${d}`, q), T(`${t} − ${n}`, t - n), T(`${t} − ${f} × ${t} + ${n}`, t - n * q + n)] });
    } },
    { id: 'decimal', from: 28, ok: ctx => !!(ctx.item && measureOf(ctx.item)), make(L, r, ctx) {   // measures: "4.5 metres, I have 2.75" (hundredths)
      const tenths = r() < 0.5, A = tenths ? 10 * int(15, 90, r) : int(150, 900, r), B = tenths ? 10 * int(5, Math.floor(A / 10) - 3, r) : int(50, A - 25, r), a = A / 100, b = B / 100;
      return mk('decimal', [a, b], rnd2(a - b), T(`${fmtN(a)} − ${fmtN(b)}`, a - b), { v: { a: fmtN(a), b: fmtN(b) }, measure: measureOf(ctx.item), wrong: [T(`${fmtN(a)} + ${fmtN(b)}`, a + b), T(`${fmtN(a)} − ${fmtN(b + 0.5)}`, a - b - 0.5), T(`${fmtN(a + 0.5)} − ${fmtN(b)}`, a - b + 0.5), T(`${fmtN(a)} − ${fmtN(b + 0.25)}`, a - b - 0.25)] });
    } },
    { id: 'percent', from: 34, make(L, r) {
      const p = pick(L >= 35 ? [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 120, 150] : [10, 20, 25, 50, 75], r), g = (x, y) => (y ? g(y, x % y) : x), step = 100 / g(p, 100), t = step * int(1, Math.floor(400 / step), r), amount = t * p / 100;
      return mk('percent', [p, t], amount, T(`${p}% × ${t}`, amount), { v: { p, t }, names: { item: t }, wrong: [T(`${100 - p}% × ${t}`, t - amount), T(`${t} − ${p}`, t - p), T(`${t} ÷ ${p}`, t / p), T(`${t} × ${p}`, t * p), T(`${t} + ${p}`, t + p)] });
    } },
    { id: 'ratio', from: 35, ok: ctx => !!(ctx.others && ctx.others.length), make(L, r, ctx) {   // "for every k of one thing, m of another"
      const k = int(2, 5, r), m = int(1, 6, r), q = int(2, 9, r), t = k * q, amount = m * q, other = pick(ctx.others, r);
      return mk('ratio', [k, m, t], amount, T(`${t} ÷ ${k} × ${m}`, amount), { v: { k, m, t }, other, wrong: [T(`${t} ÷ ${m} × ${k}`, t / m * k), T(`${t} − ${k} + ${m}`, t - k + m), T(`${t} × ${m}`, t * m), T(`${m} × ${k}`, m * k), T(`${t} + ${m}`, t + m)] });
    } },
    { id: 'mix', from: 36, make(L, r) {   // a fraction of a set, then the rest
      const [n, d] = fracPick(L, r), q = int(3, 10, r), t = d * q, a = int(1, n * q - 1, r), f = fr(n, d);
      return mk('mix', [t, a], n * q - a, T(`${f} × ${t} − ${a}`, n * q - a), { v: { fr: f, t, a }, names: { item: t }, wrong: [T(`${f} × ${t} + ${a}`, n * q + a), T(`${fr(d - n, d)} × ${t} − ${a}`, (d - n) * q - a), T(`${t} − ${a}`, t - a), T(`${f} × (${t} − ${a})`, n * (t - a) / d)] });
    } }
  ];
  const storyTypes = level => TYPES.filter(x => level >= x.from).map(x => x.id);
  // one amount problem at a level; ctx = { item, others }: the item decides if a measure story fits, the others are for the ratio story
  function makeAmount(level, r = Math.random, ctx = {}) {
    const avail = TYPES.filter(x => level >= x.from && (!x.ok || x.ok(ctx))), pool = [];
    for (const x of avail) for (let i = 0; i < (level - x.from < 5 ? 3 : 1); i++) pool.push(x);   // the newest types come up more often
    for (let tries = 0; tries < 60; tries++) {
      const p = pick(pool, r).make(level, r, ctx);
      if (p.amount > 0 && !p.nums.includes(p.amount) && !(p.kind === 'decimal' && Number.isInteger(p.amount))) return Object.assign(p, { level });   // the answer is never one of the numbers of the story
    }
    return Object.assign(TYPES[0].make(level, r, ctx), { level });
  }
  // the four cards of the card step: the story's own problem plus three that do not fit it (other operations on the story's numbers)
  function amountCards(p, r = Math.random) {
    const cap = Math.max(20, Math.ceil(p.amount * 2.5)), cands = [], ops = p.level >= 11 ? ['+', '−', '×', '÷'] : ['+', '−'];
    if (p.nums.every(Number.isInteger)) for (const a of p.nums) for (const b of p.nums) for (const op of ops) {
      if (a === b && (op === '−' || op === '÷')) continue;
      if (op === '÷' && (b < 2 || a % b !== 0)) continue;
      if (op === '×' && (a < 2 || b < 2)) continue;
      const value = cardValue({ a, op, b });
      if (value >= 0 && value <= cap) cands.push({ a, op, b, value });
    }
    for (const w of p.wrong || []) { const value = rnd2(cardValue(w)); if (value >= 0 && Number.isFinite(value)) cands.push({ ...w, value }); }
    for (let i = cands.length - 1; i > 0; i--) { const j = int(0, i, r); [cands[i], cands[j]] = [cands[j], cands[i]]; }
    const used = new Set([p.amount]), out = [];
    for (const c of cands) { if (out.length === 3) break; if (!used.has(c.value)) { used.add(c.value); out.push(c); } }
    // not enough other cards: look-alikes, an operation on the story's numbers with one number a little off
    for (let tries = 0; tries < 300 && out.length < 3 && p.nums.every(Number.isInteger); tries++) {
      const x = pick(p.nums, r), y = pick(p.nums, r), op = pick(ops, r), d = int(1, Math.max(2, Math.round(Math.max(x, y) / 10)), r) * (r() < 0.5 ? -1 : 1), c = { a: x, op, b: y + d };
      if (c.b < 1 || (op === '−' && c.b >= x) || (op === '÷' && (c.b < 2 || x % c.b !== 0)) || (op === '×' && (x < 2 || c.b < 2))) continue;
      const value = cardValue(c); if (value >= 0 && value <= cap && !used.has(value)) { used.add(value); out.push({ ...c, value }); }
    }
    while (out.length < 3) { const v = Number.isInteger(p.amount) ? int(0, cap, r) : rnd2(p.amount + (out.length + 1) * 0.5); if (!used.has(v)) { used.add(v); out.push(T(`${fmtN(v)} + 0`, v)); } }
    const cards = [{ ...p.expr, fits: true }, ...out.map(c => ({ ...c, fits: false }))];
    for (let i = cards.length - 1; i > 0; i--) { const j = int(0, i, r); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    return cards;
  }
  // the amount is typed on a pad when it has more than one digit to find in the buttons (above 10) or a decimal point
  const needsPad = p => !Number.isInteger(p.amount) || p.amount > 10;
  // after a wrong amount that was too few (spec 05 §4.1): the villager counts, and the second try is a new small problem from the new situation,
  // "I need 10. Now I have 9. Conjure the rest." The need is the first answer's total, the have is everything conjured so far.
  function retryProblem(p, total, have) {
    return { kind: p.kind, retry: true, nums: [total, have], amount: total - have, expr: { a: total, op: '−', b: have }, level: p.level, v: { t: total, a: have }, names: { item: total } };
  }
  // the second part of a two-part request (spec 05 §8, wizard level 9): one story names a second item and how its amount follows from the first:
  // "After that, conjure the ropes: 3 more than the first amount." The first amount a is known (the student has worked it out);
  // the second amount is a + k, a − k, or k for each one of a (from level 11). The answer is never a number of the story.
  function makeSecond(a, level, r = Math.random) {
    for (let tries = 0; tries < 60; tries++) {
      const opts = ['more']; if (a >= 3) opts.push('less'); if (level >= 11 && a >= 2) opts.push('each');
      const rel = pick(opts, r), small = level <= 10;
      let k, amount, op;
      if (rel === 'more') { k = small ? int(1, Math.max(2, Math.min(a, 10)), r) : int(2, 100, r); amount = a + k; op = '+'; }
      else if (rel === 'less') { k = int(1, Math.min(a - 1, small ? 10 : 100), r); amount = a - k; op = '−'; }
      else { k = int(2, 9, r); amount = a * k; op = '×'; }
      if (amount > 0 && amount <= 1000 && amount !== a && amount !== k) return { kind: 'rel_' + rel, rel, k, nums: [a, k], amount, expr: { a, op, b: k }, level, v: { k } };
    }
    return { kind: 'rel_more', rel: 'more', k: 1, nums: [a, 1], amount: a + 1, expr: { a, op: '+', b: 1 }, level, v: { k: 1 } };
  }
  // a card for a number, with numbers the student has reached: a sum or difference, or a times table from level 13
  function exprFor(v, mlvl, r = Math.random) {
    const pairs = []; for (let a = 2; a <= 11; a++) if (v % a === 0 && v / a >= 2 && v / a <= 11) pairs.push([a, v / a]);
    if (mlvl >= 13 && pairs.length && v > 20 && r() < 0.6) { const [a, b] = pick(pairs, r); return { a, op: '×', b, value: v }; }
    if (v <= 20) { const a = int(0, v, r); return { a, op: '+', b: v - a, value: v }; }
    if (r() < 0.5) { const b = int(1, 10, r); return { a: v - b, op: '+', b, value: v }; }
    const b = int(1, 10, r); return { a: v + b, op: '−', b, value: v };
  }
  // the item card step: four cards, one gives the item's number; the other numbers are items the student can already be asked for
  function itemCards(item, mlvl, r = Math.random) {
    const values = [item.n], others = reachable(mlvl).map(x => x.n).filter(n => n !== item.n);
    while (values.length < 4 && others.length) { const v = pick(others, r); if (!values.includes(v)) values.push(v); if (values.length >= 4) break; }
    const cards = values.map(v => ({ ...exprFor(v, mlvl, r), item: v }));
    for (let i = cards.length - 1; i > 0; i--) { const j = int(0, i, r); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    return cards;
  }
  // a card is written out as it is (text) or as a, op, b; the division sign is a parameter (':' in Hebrew)
  const cardText = (c, div = '÷') => (c.text ? c.text : `${fmtN(c.a)} ${c.op} ${fmtN(c.b)}`).replace(/÷/g, div);
  const cardValue = c => (c.text ? c.value : c.op === '+' ? c.a + c.b : c.op === '−' ? c.a - c.b : c.op === '×' ? c.a * c.b : c.a / c.b);
  const itemCardOk = (card, item) => card.value === item.n;
  // the answer of the item card's problem: the item's number among three numbers near it (shuffled)
  function itemAnswers(n, r = Math.random) {
    const out = [n]; for (const v of [n - 1, n + 1, n + 2, n - 2]) { if (out.length === 4) break; if (v >= 0 && !out.includes(v)) out.push(v); }
    for (let i = out.length - 1; i > 0; i--) { const j = int(0, i, r); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }
  const wrongItemFor = card => itemOf(card.value);

  // the amount the student enters: too few and too many say how far off it is
  function checkAmount(k, amount) {
    k = rnd2(k); amount = rnd2(amount);
    if (k === amount) return { ok: true };
    if (k < amount) return { ok: false, kind: 'few', have: k, more: rnd2(amount - k) };
    return { ok: false, kind: 'many', have: k, extra: rnd2(k - amount) };
  }

  // every action costs one mana, right or wrong (the villagers do not attack, so nothing else takes the mana away);
  // a right answer also fills the happy meter
  // an impatient villager (wizard level 6 and up) has a patience bar: it starts full and goes down by one on every action
  const PATIENCE = 5;
  // the patience of a visit: the right answers it needs, plus three points, so two mistakes never make an impatient villager leave
  const patienceFor = happyMax => happyMax + 3;
  const spend = (state, right) => ({ ...state, mana: Math.max(0, state.mana - 1), happy: Math.min(state.happyMax, state.happy + (right ? 1 : 0)), ...(state.patience !== undefined ? { patience: Math.max(0, state.patience - 1) } : {}) });
  // the visit is done when the happy meter is full; lost when the mana is gone first
  // done when the happy meter is full; lost when the mana is gone first; left when an impatient villager has had enough
  const visitOver = s => (s.happy >= s.happyMax ? 'done' : s.mana <= 0 ? 'lost' : s.patience !== undefined && s.patience <= 0 ? 'left' : null);
  // the impatient villager: from wizard level 6, one visit in three
  const isImpatient = (wlvl, r = Math.random) => wlvl >= 6 && r() < 1 / 3;

  // the conjuration book's themes (inspired by the spell book's tabs): each item is in one theme, so a student finds it fast
  const THEMES = [
    { k: 'food', em: '🍞', en: 'Food & kitchen', he: 'אוכל ומטבח', items: [3, 4, 5, 10, 11, 21, 27, 28] },
    { k: 'farm', em: '🌱', en: 'Farm & garden', he: 'חווה וגן', items: [9, 19, 23, 64] },
    { k: 'water', em: '🌊', en: 'Water & sea', he: 'מים וים', items: [2, 14, 17, 18, 25] },
    { k: 'light', em: '🕯️', en: 'Light & fire', he: 'אור ואש', items: [7, 13, 16, 36] },
    { k: 'tools', em: '🔨', en: 'Tools & metal', he: 'כלים ומתכת', items: [1, 6, 8, 12, 22, 26] },
    { k: 'wood', em: '🪵', en: 'Wood & home', he: 'עץ ובית', items: [24, 42, 50] },
    { k: 'cloth', em: '🧶', en: 'Cloth & sewing', he: 'בד ותפירה', items: [20, 30, 40, 60] },
    { k: 'party', em: '🎉', en: 'Festival & music', he: 'חג ומוזיקה', items: [15, 45, 48, 49, 55] }
  ];
  const themeOf = item => THEMES.find(t => t.items.includes(item.n)) || THEMES[THEMES.length - 1];
  // the word for the "some are gone" story: a blanket is torn (נקרעה), the others are broken (נשבר, נשברה, נשברו)
  const breakWord = (item, n) => {
    if (item.n === 60) return n === 1 ? ['torn', 'נקרעה'] : ['torn', 'נקרעו'];
    return n === 1 ? ['broke', genderOf(item) === 'f' ? 'נשברה' : 'נשבר'] : ['broke', 'נשברו'];
  };
  return { BOOK, THEMES, themeOf, breakWord, PATIENCE, patienceFor, genderOf, storyName, itemOf, itemByHe, nameFor, reachable, isBeginner, amountLevel, plan, storyTypes, makeAmount, amountCards, makeSecond, retryProblem, needsPad, oneName, measureOf, fmtN, exprFor, cardText, cardValue, itemCards, itemCardOk, itemAnswers, wrongItemFor, checkAmount, spend, visitOver, isImpatient };
});
