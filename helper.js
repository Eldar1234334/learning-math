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
    const cardStep = !beginner && mlvl >= 2, itemStep = !beginner;
    const perItem = (cardStep ? 1 : 0) + 1 + (itemStep ? 1 : 0);
    return { beginner, cardStep, itemStep, items, perItem, happyMax: items * perItem, mana: 8 + 2 * (wlvl - 1) + 2 * mlvl, lowLevel: amountLevel(mlvl) };
  }

  // the story types of the amount problems (spec 05 §5.1), each from the math level where its operation is ready
  //   result  (join, result unknown)     level 1   "I have a. My friend gives me b. How many now?"       a + b
  //   separate (result unknown)          level 3   "I had t. b broke. How many are left?"                t − b
  //   change  (join, change unknown)     level 4   "I need t. I have a. Conjure the rest."               t − a
  //   part    (part-part-whole)          level 4   "I need t: a for the hall, the rest for the kitchen."  t − a
  //   compare (difference unknown)       level 5   "The baker has t. I have a. Conjure enough to match."  t − a
  //   start   (join, start unknown)      level 6   "I used u, and r are left. How many did I have?"       u + r
  //   two     (two steps)                level 9   "I need t. I have a, and my neighbour gives me b."    t − (a + b)
  const TYPES = [
    { id: 'result', from: 1 }, { id: 'separate', from: 3 }, { id: 'change', from: 4 }, { id: 'part', from: 4 },
    { id: 'compare', from: 5 }, { id: 'start', from: 6 }, { id: 'two', from: 9 }
  ];
  const storyTypes = level => TYPES.filter(x => level >= x.from).map(x => x.id);
  // one amount problem at a level (the story's numbers stay small at the first levels)
  function makeAmount(level, r = Math.random) {
    const type = pick(storyTypes(level), r);
    if (type === 'result') {
      const hi = level <= 1 ? 3 : 5, a = int(1, hi, r), b = int(1, hi, r);
      return { kind: type, nums: [a, b], a, b, amount: a + b, expr: { a, op: '+', b, value: a + b }, show: { have: a, of: a + b, plus: b } };
    }
    if (type === 'separate') {
      const tt = int(3, 10, r), b = int(1, tt - 1, r);
      return { kind: type, nums: [tt, b], t: tt, b, amount: tt - b, expr: { a: tt, op: '−', b, value: tt - b }, show: { have: tt, of: tt, minus: b } };
    }
    if (type === 'start') {
      const u = int(1, 9, r), rr = int(1, 10 - u, r);
      return { kind: type, nums: [u, rr], u, r: rr, amount: u + rr, expr: { a: u, op: '+', b: rr, value: u + rr }, show: { have: u, of: u + rr, plus: rr } };
    }
    if (type === 'two') {
      const tt = int(10, 20, r), a = int(1, 9, r), b = int(1, 9, r);
      if (tt - a - b < 1) return makeAmount(level, r);
      return { kind: type, nums: [tt, a, b], t: tt, a, b, amount: tt - a - b, expr: { a: tt, op: '−', b: a + b, value: tt - a - b }, show: { have: a, of: tt, plus: b } };
    }
    // change, part and compare share the numbers: a target t and what the student has, a
    const tt = int(5, 10, r), a = int(1, tt - 1, r);
    return { kind: type, nums: [tt, a], t: tt, a, amount: tt - a, expr: { a: tt, op: '−', b: a, value: tt - a }, show: { have: a, of: tt } };
  }
  // the four cards of the card step: the story's own problem plus three that do not fit it (all values different, from 0 to 20)
  function amountCards(p, r = Math.random) {
    const cands = [], nums = p.nums;
    for (const a of nums) for (const b of nums) for (const op of ['+', '−']) {
      if (a === b && op === '−') continue;
      const value = op === '+' ? a + b : a - b;
      if (value >= 0 && value <= 20 && value !== p.amount) cands.push({ a, op, b, value });
    }
    const used = new Set([p.amount]), out = [];
    for (let i = cands.length - 1; i > 0; i--) { const j = int(0, i, r); [cands[i], cands[j]] = [cands[j], cands[i]]; }
    for (const c of cands) { if (out.length === 3) break; if (!used.has(c.value)) { used.add(c.value); out.push(c); } }
    while (out.length < 3) { const v = int(0, 20, r); if (!used.has(v)) { used.add(v); out.push({ a: v, op: '+', b: 0, value: v }); } }
    const cards = [{ ...p.expr, fits: true }, ...out.map(c => ({ ...c, fits: false }))];
    for (let i = cards.length - 1; i > 0; i--) { const j = int(0, i, r); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    return cards;
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
  const cardText = c => `${c.a} ${c.op} ${c.b}`;
  const cardValue = c => (c.op === '+' ? c.a + c.b : c.op === '−' ? c.a - c.b : c.a * c.b);
  const itemCardOk = (card, item) => card.value === item.n;
  const wrongItemFor = card => itemOf(card.value);

  // the amount the student enters: too few and too many say how far off it is
  function checkAmount(k, amount) {
    if (k === amount) return { ok: true };
    if (k < amount) return { ok: false, kind: 'few', have: k, more: amount - k };
    return { ok: false, kind: 'many', have: k, extra: k - amount };
  }

  // every action costs one mana, right or wrong (the villagers do not attack, so nothing else takes the mana away);
  // a right answer also fills the happy meter
  // an impatient villager (wizard level 6 and up) has a patience bar: it starts full and goes down by one on every action
  const PATIENCE = 5;
  const spend = (state, right) => ({ ...state, mana: Math.max(0, state.mana - 1), happy: Math.min(state.happyMax, state.happy + (right ? 1 : 0)), ...(state.patience !== undefined ? { patience: Math.max(0, state.patience - 1) } : {}) });
  // the visit is done when the happy meter is full; lost when the mana is gone first
  // done when the happy meter is full; lost when the mana is gone first; left when an impatient villager has had enough
  const visitOver = s => (s.happy >= s.happyMax ? 'done' : s.mana <= 0 ? 'lost' : s.patience !== undefined && s.patience <= 0 ? 'left' : null);
  // the impatient villager: from wizard level 6, one visit in three
  const isImpatient = (wlvl, r = Math.random) => wlvl >= 6 && r() < 1 / 3;

  return { BOOK, PATIENCE, genderOf, storyName, itemOf, itemByHe, nameFor, reachable, isBeginner, amountLevel, plan, storyTypes, makeAmount, amountCards, exprFor, cardText, cardValue, itemCards, itemCardOk, wrongItemFor, checkAmount, spend, visitOver, isImpatient };
});
