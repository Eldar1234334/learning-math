/* SpellQuest: the villager visit (spec 05), pure logic only (no screen).
   A village project has two items. Each item is one ROUND, and the steps of a round depend on the math level:
     beginner (math level 1, wizard level 1): the answer only (no book, the item is told by the villager)
     math level 1: the answer, then the item from the conjuration book (no card that fits the story)
     math level 2 and up: the card that fits the story (one level lower), the answer, then the item
   Mistakes cost one mana (as the fight mode's mistakes cost HP). Right answers cost nothing and fill the happy meter.
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
    { n: 30, lvl: 7, one: ['Thread', 'חוט'], many: ['Thread', 'חוט'], em: '🧵' },
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

  // one amount problem at a level: result unknown (levels 1–3: "I have a. My friend gives me b.") and change unknown
  // (level 4 and up: "I need t. I have a. Conjure the rest.")
  function makeAmount(level, r = Math.random) {
    if (level < 4) {
      const hi = level <= 1 ? 3 : 5, a = int(1, hi, r), b = int(1, hi, r);
      return { kind: 'result', a, b, amount: a + b, expr: { a, op: '+', b, value: a + b } };
    }
    const t = int(5, 10, r), a = int(1, t - 1, r);
    return { kind: 'change', a, t, amount: t - a, expr: { a: t, op: '−', b: a, value: t - a } };
  }
  // the four cards of the card step: the story's own problem plus three that do not fit it (all values different)
  function amountCards(p, r = Math.random) {
    const cands = [];
    const add = (a, op, b) => { const value = op === '+' ? a + b : a - b; if (value >= 0 && value <= 20 && value !== p.amount) cands.push({ a, op, b, value }); };
    if (p.kind === 'result') { add(p.a, '−', p.b); add(p.b, '−', p.a); add(p.a + 1, '+', p.b); add(p.a, '+', p.b + 1); add(p.a, '+', p.b + 2); }
    else { add(p.t, '+', p.a); add(p.t + 1, '−', p.a); add(p.t, '−', p.a + 1); add(p.t, '−', p.a - 1); add(p.a, '+', 1); }
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

  // a mistake costs one mana; a right answer fills the happy meter and costs nothing
  const spend = (state, right) => (right ? { ...state, happy: Math.min(state.happyMax, state.happy + 1) } : { ...state, mana: Math.max(0, state.mana - 1) });
  // the visit is done when the happy meter is full; lost when the mana is gone first
  const visitOver = s => (s.happy >= s.happyMax ? 'done' : s.mana <= 0 ? 'lost' : null);

  return { BOOK, itemOf, itemByHe, nameFor, reachable, isBeginner, amountLevel, plan, makeAmount, amountCards, exprFor, cardText, cardValue, itemCards, itemCardOk, wrongItemFor, checkAmount, spend, visitOver };
});
