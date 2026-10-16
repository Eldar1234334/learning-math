/* Math Wizard: tests for the villager visit logic (helper.js).
   Run in a browser: open tests/index.html. Run with Node: node tests/helper.test.js */
(function () {
  'use strict';
  const isNode = typeof module === 'object' && typeof require === 'function';
  const H = isNode ? require('../helper.js') : globalThis.HELPER;
  const results = [];
  const test = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, msg: e.message }); } };
  const assert = (c, msg) => { if (!c) throw new Error(msg || 'assertion failed'); };
  let seed = 4242; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };

  test('the book has the 39 approved items, each number once', () => {
    assert(H.BOOK.length === 39, 'items: ' + H.BOOK.length);
    assert(new Set(H.BOOK.map(x => x.n)).size === 39, 'numbers unique');
  });
  test('the approved numbers: chair is 42 from level 14, the numbers are the approved ones', () => {
    assert(H.itemOf(42).one[0] === 'Chair' && H.itemOf(42).lvl === 14, 'chair');
    assert(H.itemOf(1).lvl === 3 && H.itemOf(55).lvl === 16 && H.itemOf(25).lvl === 13, 'levels');
  });
  test('every project item (the first two needs of each project) is in the book', () => {
    const he = ['קמח', 'ביצה', 'חלב', 'מים', 'מלח', 'ברזל', 'אש', 'פטיש', 'חבל', 'דלי', 'תפוח', 'ספר', 'נר', 'זרע', 'שמש', 'סירה', 'חכה', 'רשת', 'קש', 'בד', 'חוט', 'מחט', 'מיטה', 'שמיכה', 'שמן', 'סולם', 'סל', 'עץ', 'מסמר', 'מסור', 'לחם', 'גבינה', 'מנורה', 'דגל', 'פרח', 'תוף', 'חליל', 'פעמון', 'כיסא'];
    for (const w of he) assert(H.itemByHe(w), 'missing ' + w);
  });
  test('beginners: math level 1 and wizard level 1 only', () => {
    assert(H.isBeginner(1, 1), 'level 1, wizard 1');
    assert(!H.isBeginner(1, 2) && !H.isBeginner(2, 1), 'not beginners');
  });
  test('the mana: 8 + 2 × (wizard − 1) + 2 × math; a beginner has 10', () => {
    assert(H.plan(1, 1).mana === 10, 'beginner ' + H.plan(1, 1).mana);
    assert(H.plan(1, 2).mana === 12, 'math 1, wizard 2');
    assert(H.plan(5, 6).mana === 8 + 10 + 10, 'math 5, wizard 6');
  });
  test('the steps per item: beginner answer only; math level 1 answer and item; from level 2 card, answer and item', () => {
    const b = H.plan(1, 1), m1 = H.plan(1, 3), m2 = H.plan(2, 3);
    assert(b.beginner && !b.cardStep && !b.itemStep && b.perItem === 1, 'beginner steps');
    assert(!m1.cardStep && m1.itemStep && m1.perItem === 2, 'level 1 steps');
    assert(m2.cardStep && m2.itemStep && m2.perItem === 3, 'level 2 steps');
  });
  test('a project has two items: the happy meter is perItem × 2', () => {
    assert(H.plan(5, 5).happyMax === 6 && H.plan(1, 1).happyMax === 2 && H.plan(1, 3).happyMax === 4, 'happy max');
  });
  test('story types by level: only result at level 2; separate from 3; change and part from 4; compare 5; start 6; two steps 9', () => {
    assert(H.storyTypes(2).join() === 'result', 'level 2: ' + H.storyTypes(2).join());
    assert(H.storyTypes(4).includes('change') && H.storyTypes(4).includes('separate'), 'level 4');
    assert(!H.storyTypes(5).includes('two') && H.storyTypes(9).includes('two') && H.storyTypes(6).includes('start'), 'levels 5–9');
  });
  test('every story type: the amount is the value of its story card, and the amount stays in range', () => {
    for (const lvl of [1, 3, 4, 5, 6, 9, 12]) for (let i = 0; i < 150; i++) {
      const p = H.makeAmount(lvl, rnd);
      assert(H.storyTypes(lvl).includes(p.kind), 'type ' + p.kind + ' at level ' + lvl);
      assert(H.cardValue(p.expr) === p.amount, 'card value for ' + p.kind);
      assert(p.amount >= 1 && p.amount <= 20, 'amount in range ' + p.amount);
    }
  });
  test('the card step: four cards, the story card fits, values all different', () => {
    for (let i = 0; i < 200; i++) {
      const p = H.makeAmount(i % 2 ? 4 : 2, rnd), cards = H.amountCards(p, rnd);
      assert(cards.length === 4 && cards.filter(c => c.fits).length === 1, 'four cards, one fits');
      assert(new Set(cards.map(c => H.cardValue(c))).size === 4, 'values different');
      assert(cards.every(c => c.fits || H.cardValue(c) !== p.amount), 'no other card gives the amount');
    }
  });
  test('the item cards: four cards, exactly one gives the item number, every card computes its value', () => {
    for (const item of H.reachable(5)) for (let i = 0; i < 20; i++) {
      const cards = H.itemCards(item, 5, rnd);
      assert(cards.length === 4, 'four cards for ' + item.n);
      assert(cards.filter(c => H.itemCardOk(c, item)).length === 1, 'one correct card for ' + item.n);
      assert(new Set(cards.map(c => c.value)).size === 4, 'values different');
      assert(cards.every(c => H.cardValue(c) === c.value), 'every card computes its value');
    }
  });
  test('item cards only use numbers the student has reached', () => {
    for (let i = 0; i < 50; i++) {
      const cards = H.itemCards(H.itemOf(5), 1, rnd);
      assert(cards.every(c => H.reachable(1).some(x => x.n === c.value)), 'reachable at level 1');
    }
  });
  test('times tables from level 13: 42 can be a card (6 × 7 or 7 × 6)', () => {
    let seen = false;
    for (let i = 0; i < 300; i++) { const c = H.exprFor(42, 14, rnd); if (c.op === '×') { seen = true; assert(c.a * c.b === 42, '6 × 7'); } }
    assert(seen, 'a product appears at level 14');
  });
  test('the amount check: correct, too few, too many', () => {
    assert(H.checkAmount(7, 7).ok === true, 'correct');
    const few = H.checkAmount(6, 7);
    assert(!few.ok && few.kind === 'few' && few.have === 6 && few.more === 1, 'too few');
    const many = H.checkAmount(9, 7);
    assert(!many.ok && many.kind === 'many' && many.have === 9 && many.extra === 2, 'too many');
  });
  test('every action costs one mana, right or wrong; a right answer also fills the happy meter', () => {
    let s = { mana: 3, happy: 0, happyMax: 4 };
    s = H.spend(s, true); assert(s.mana === 2 && s.happy === 1, 'right costs mana too');
    s = H.spend(s, false); assert(s.mana === 1 && s.happy === 1, 'mistake costs mana');
  });
  test('the mana of a full project covers its actions: beginner 2 actions, math 1 with 4, from level 2 with 6', () => {
    assert(H.plan(1, 1, 2).mana >= 2, 'beginner');
    assert(H.plan(1, 3, 2).mana >= 4, 'math 1');
    assert(H.plan(2, 1, 2).mana >= 6, 'math 2');
    assert(H.plan(14, 1, 6).mana >= 18, 'festival at math 14');
  });
  test('the visit: done when the happy meter is full, lost when the mana is gone first', () => {
    assert(H.visitOver({ mana: 1, happy: 4, happyMax: 4 }) === 'done', 'happy full');
    assert(H.visitOver({ mana: 0, happy: 2, happyMax: 4 }) === 'lost', 'out of mana');
    assert(H.visitOver({ mana: 3, happy: 2, happyMax: 4 }) === null, 'still going');
  });

  const failed = results.filter(r => !r.ok);
  if (isNode) { for (const r of results) console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n      ' + r.msg)); console.log(`\n${results.length - failed.length} of ${results.length} helper tests passed`); if (failed.length) process.exitCode = 1; }
  else globalThis.HELPER_TEST_RESULTS = results;
})();
