/* SpellQuest: the villager visit (spec 05, slice 1), pure logic only (no screen).
   A villager at a site asks for two items. Each item is one ROUND:
     1. the amount: choose the card that fits the villager's story, then work out the amount (the story's problem is one level lower)
     2. the item: choose the card whose number is the item in the conjuration book (like choosing a spell)
   Beginners (math level 1, wizard level up to 2): no conjuration book; each item is one round of the amount only.
   The wizard has mana (one point per action, right or wrong); the villager's happy meter fills with each right action.
   Tests: tests/helper.test.js. The screen is in index.html (openVisit). */
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
  const CFG = { MAX_MANA: 10, ROUNDS: 2 };
  const itemOf = n => BOOK.find(x => x.n === n) || null;
  const nameFor = (item, count) => (count === 1 ? item.one : item.many);   // [English, Hebrew]
  const pick = (a, r) => a[Math.floor(r() * a.length)];
  const int = (lo, hi, r) => lo + Math.floor(r() * (hi - lo + 1));

  // beginners: math level 1 and wizard level up to 2 (no conjuration book)
  const isBeginner = (mlvl, wlvl) => mlvl <= 1 && wlvl <= 2;
  // the amount phase is one level lower than the current math level (never below 1)
  const amountLevel = mlvl => Math.max(1, mlvl - 1);
  // a visit: how many rounds, how many right actions fill the happy meter, the beginner rule
  function plan(mlvl, wlvl) {
    const beginner = isBeginner(mlvl, wlvl);
    return { beginner, rounds: CFG.ROUNDS, actionsPerRound: beginner ? 2 : 3, happyMax: CFG.ROUNDS * (beginner ? 2 : 3), mana: CFG.MAX_MANA, lowLevel: amountLevel(mlvl) };
  }

  // the amount problem at a level: result unknown (levels 1–3: "I have a, my friend gives me b, how many now?")
  // and change unknown (level 4 and up: "I need t, I have a, how many more?")
  function makeAmount(level, r = Math.random) {
    if (level < 4) {
      const hi = level <= 1 ? 3 : 5, a = int(1, hi, r), b = int(1, hi, r);
      return { kind: 'result', a, b, amount: a + b, expr: { a, op: '+', b, value: a + b } };
    }
    const t = int(5, 10, r), a = int(1, t - 1, r);
    return { kind: 'change', a, t, amount: t - a, expr: { a: t, op: '−', b: a, value: t - a } };
  }
  // the four cards of the amount phase: the story's own problem plus three that do not fit it (all values different, from 0 to 20)
  function amountCards(p, r = Math.random) {
    const cands = [];
    const add = (a, op, b) => { const value = op === '+' ? a + b : a - b; if (value >= 0 && value <= 20 && value !== p.amount) cands.push({ a, op, b, value }); };
    if (p.kind === 'result') { add(p.a, '−', p.b); add(p.b, '−', p.a); add(p.a + 1, '+', p.b); add(p.a, '+', p.b + 1); add(p.a, '+', p.b + 2); }
    else { add(p.t, '+', p.a); add(p.t + 1, '−', p.a); add(p.t, '−', p.a + 1); add(p.t, '−', p.a - 1); add(p.a, '+', 1); }
    const used = new Set([p.amount]), out = [];
    for (let i = cands.length - 1; i > 0; i--) { const j = int(0, i, r); [cands[i], cands[j]] = [cands[j], cands[i]]; }
    for (const c of cands) { if (out.length === 3) break; if (!used.has(c.value)) { used.add(c.value); out.push(c); } }
    while (out.length < 3) { const v = int(0, 20, r); if (!used.has(v)) { used.add(v); out.push({ a: v, op: '+', b: 0, value: v }); } }   // a fallback card (rare)
    const cards = [{ ...p.expr, fits: true }, ...out.map(c => ({ ...c, fits: false }))];
    for (let i = cards.length - 1; i > 0; i--) { const j = int(0, i, r); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    return cards;
  }
  const cardText = c => `${c.a} ${c.op} ${c.b}`;

  // the item phase: the card whose number is the item's number (1 to 9), the others are other items
  function itemCards(item, r = Math.random) {
    const values = [item.n], others = BOOK.map(x => x.n).filter(n => n !== item.n);
    while (values.length < 4) { const v = pick(others, r); if (!values.includes(v)) values.push(v); }
    const cards = values.map(v => {
      if (r() < 0.5 || v + 1 > 10) { const a = int(0, v, r); return { a, op: '+', b: v - a, value: v, item: v }; }
      const b = int(1, 10 - v, r); return { a: v + b, op: '−', b, value: v, item: v };
    });
    for (let i = cards.length - 1; i > 0; i--) { const j = int(0, i, r); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    return cards;
  }
  const itemCardOk = (card, item) => card.value === item.n;
  const wrongItemFor = card => itemOf(card.value);

  // the amount the student enters: too few and too many say how far off it is
  function checkAmount(k, amount) {
    if (k === amount) return { ok: true };
    if (k < amount) return { ok: false, kind: 'few', have: k, more: amount - k };
    return { ok: false, kind: 'many', have: k, extra: k - amount };
  }

  // the visit's state changes: mana is spent on every action, happy grows with every right action
  function spend(state, right) { return { ...state, mana: Math.max(0, state.mana - 1), happy: Math.min(state.happyMax, state.happy + (right ? 1 : 0)) }; }
  const visitOver = s => s.mana <= 0 && s.happy < s.happyMax ? 'lost' : (s.happy >= s.happyMax ? 'done' : null);

  return { BOOK, CFG, itemOf, nameFor, isBeginner, amountLevel, plan, makeAmount, amountCards, cardText, itemCards, itemCardOk, wrongItemFor, checkAmount, spend, visitOver };
});
