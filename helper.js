/* SpellQuest: Village Helper, slice 1 (the notice board).
   Pure logic only (no screen): the conjuration book, the requests, the cards and the checks.
   Slice 1: join stories only. "Result unknown" from math level 1, "change unknown" from level 4.
   The screen is in index.html (openHelper). Tests: tests/helper.test.js. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.HELPER = f(); })(typeof self !== 'undefined' ? self : this, function () {
  // the conjuration book: each item has a fixed number (it never changes)
  const BOOK = [
    { n: 1, one: ['Water', 'מים'], many: ['Water', 'מים'], em: '💧' },
    { n: 2, one: ['Apple', 'תפוח'], many: ['Apples', 'תפוחים'], em: '🍎' },
    { n: 3, one: ['Wood', 'עץ'], many: ['Wood', 'עץ'], em: '🪵' },
    { n: 4, one: ['Egg', 'ביצה'], many: ['Eggs', 'ביצים'], em: '🥚' },
    { n: 5, one: ['Flour', 'קמח'], many: ['Flour', 'קמח'], em: '🌾' },
    { n: 6, one: ['Rope', 'חבל'], many: ['Ropes', 'חבלים'], em: '🪢' },
    { n: 7, one: ['Candle', 'נר'], many: ['Candles', 'נרות'], em: '🕯️' },
    { n: 8, one: ['Nail', 'מסמר'], many: ['Nails', 'מסמרים'], em: '🔩' },
    { n: 9, one: ['Seed', 'זרע'], many: ['Seeds', 'זרעים'], em: '🌰' }
  ];
  const itemOf = n => BOOK.find(x => x.n === n) || null;
  // the item's name for a count (singular for 1), as [English, Hebrew]
  const nameFor = (item, count) => (count === 1 ? item.one : item.many);
  const pick = (a, r) => a[Math.floor(r() * a.length)];
  const int = (lo, hi, r) => lo + Math.floor(r() * (hi - lo + 1));

  // the story types of slice 1, with the math level they start at
  const TYPES = [{ id: 'result', from: 1 }, { id: 'change', from: 4 }];
  const typesFor = mlvl => TYPES.filter(x => mlvl >= x.from).map(x => x.id);

  // one request: the item the villager needs, the story numbers and how many to conjure
  //  result: "I have a. My friend gives me b. Conjure how many I have now."  → target a+b
  //  change: "I need t. I have a. Conjure the rest."                          → target t-a
  function makeRequest(mlvl, r = Math.random) {
    const type = pick(typesFor(mlvl), r), item = pick(BOOK, r);
    if (type === 'result') {
      const a = int(1, 4, r), b = int(1, 4, r);
      return { type, item, a, b, target: a + b };
    }
    const t = int(5, 10, r), a = int(1, t - 1, r);
    return { type, item, a, t, target: t - a };
  }

  // the cards of step 1: one card gives the item's number, the others give other numbers (1..9, all different)
  // a card is written as two numbers and a sign: a+b or a−b, with numbers from 0 to 10
  function cardFor(v, r = Math.random) {
    if (v <= 0 || v > 10) return null;
    if (r() < 0.5 || v + 1 > 10) { const a = int(0, v, r); return { a, op: '+', b: v - a, value: v }; }   // a + b = v
    const b = int(1, 10 - v, r); return { a: v + b, op: '−', b, value: v };   // (v+b) − b = v
  }
  function cardsFor(item, r = Math.random) {
    const values = [item.n], others = BOOK.map(x => x.n).filter(n => n !== item.n);
    while (values.length < 4) { const v = pick(others, r); if (!values.includes(v)) values.push(v); }
    const cards = values.map(v => cardFor(v, r));
    for (let i = cards.length - 1; i > 0; i--) { const j = int(0, i, r); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    return cards;
  }
  const cardText = c => `${c.a} ${c.op} ${c.b}`;
  const cardOk = (card, item) => card.value === item.n;

  // step 2: the amount the student enters. Too few and too many tell how far off it is.
  function checkAmount(k, target) {
    if (k === target) return { ok: true };
    if (k < target) return { ok: false, kind: 'few', have: k, more: target - k };
    return { ok: false, kind: 'many', have: k, extra: k - target };
  }

  // the wrong item for a wrong card: the item with the number on the card (for the villager's laugh)
  const wrongItemFor = card => itemOf(card.value);

  return { BOOK, itemOf, nameFor, typesFor, makeRequest, cardFor, cardsFor, cardText, cardOk, checkAmount, wrongItemFor };
});
