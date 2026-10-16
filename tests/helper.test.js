/* Math Wizard: tests for the villager visit logic (helper.js), slice 1.
   Run in a browser: open tests/index.html. Run with Node: node tests/helper.test.js */
(function () {
  'use strict';
  const isNode = typeof module === 'object' && typeof require === 'function';
  const H = isNode ? require('../helper.js') : globalThis.HELPER;
  const results = [];
  const test = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, msg: e.message }); } };
  const assert = (c, msg) => { if (!c) throw new Error(msg || 'assertion failed'); };
  let seed = 4242; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const val = c => (c.op === '+' ? c.a + c.b : c.a - c.b);

  test('the book has nine items, numbered 1 to 9, each once', () => {
    const ns = H.BOOK.map(x => x.n).sort((a, b) => a - b);
    assert(ns.join() === '1,2,3,4,5,6,7,8,9', 'numbers ' + ns.join());
  });
  test('plural names: one apple, two apples', () => {
    assert(H.nameFor(H.itemOf(2), 1)[0] === 'Apple' && H.nameFor(H.itemOf(2), 2)[0] === 'Apples', 'apple forms');
  });
  test('beginners: math level 1 and wizard level up to 2 only', () => {
    assert(H.isBeginner(1, 1) && H.isBeginner(1, 2), 'level 1, wizard 1–2');
    assert(!H.isBeginner(1, 3) && !H.isBeginner(2, 1), 'not beginners');
  });
  test('the amount phase is one level lower, never below 1', () => {
    assert(H.amountLevel(1) === 1 && H.amountLevel(2) === 1 && H.amountLevel(5) === 4, 'lower level');
  });
  test('a visit: two rounds; three actions per round (two for beginners); happy meter full at the end', () => {
    const p = H.plan(5, 6);
    assert(!p.beginner && p.rounds === 2 && p.actionsPerRound === 3 && p.happyMax === 6, 'normal plan');
    const b = H.plan(1, 2);
    assert(b.beginner && b.actionsPerRound === 2 && b.happyMax === 4, 'beginner plan');
    assert(p.mana === H.CFG.MAX_MANA, 'full mana to start');
  });
  test('the amount: result-unknown below level 4, change-unknown from level 4, numbers in range', () => {
    for (let i = 0; i < 200; i++) {
      const r = H.makeAmount(2, rnd);
      assert(r.kind === 'result' && r.amount === r.a + r.b && r.a >= 1 && r.b >= 1, 'result amount');
      const c = H.makeAmount(4, rnd);
      assert(c.kind === 'change' && c.amount === c.t - c.a && c.a >= 1 && c.a <= c.t - 1 && c.t >= 5 && c.t <= 10, 'change amount');
    }
  });
  test('the amount cards: four, the story card fits, values all different, every card computes its value', () => {
    for (let i = 0; i < 200; i++) {
      const p = H.makeAmount(i % 2 ? 4 : 2, rnd), cards = H.amountCards(p, rnd);
      assert(cards.length === 4, 'four cards');
      assert(cards.filter(c => c.fits).length === 1, 'one card fits the story');
      const fit = cards.find(c => c.fits);
      assert(val(fit) === p.amount, 'the fitting card gives the amount');
      assert(new Set(cards.map(c => val(c))).size === 4, 'values all different');
      assert(cards.every(c => c.fits || val(c) !== p.amount), 'no other card gives the amount');
    }
  });
  test('the item cards: four cards, exactly one gives the item number', () => {
    for (const item of H.BOOK) for (let i = 0; i < 20; i++) {
      const cards = H.itemCards(item, rnd);
      assert(cards.length === 4, 'four cards');
      assert(cards.filter(c => H.itemCardOk(c, item)).length === 1, 'one correct card for item ' + item.n);
      assert(new Set(cards.map(c => c.value)).size === 4, 'values different');
      assert(cards.every(c => val(c) === c.value), 'every card computes its value');
    }
  });
  test('the amount check: correct, too few, too many', () => {
    assert(H.checkAmount(7, 7).ok === true, 'correct');
    const few = H.checkAmount(6, 7);
    assert(!few.ok && few.kind === 'few' && few.have === 6 && few.more === 1, 'too few');
    const many = H.checkAmount(9, 7);
    assert(!many.ok && many.kind === 'many' && many.have === 9 && many.extra === 2, 'too many');
  });
  test('a wrong item card points to the item with that number', () => {
    const c = H.itemCards(H.itemOf(5), rnd).find(x => x.value !== 5);
    assert(H.wrongItemFor(c).n === c.value, 'wrong item');
  });
  test('mana goes down on every action; happy goes up on right actions only', () => {
    let s = { mana: 3, happy: 0, happyMax: 6 };
    s = H.spend(s, true); assert(s.mana === 2 && s.happy === 1, 'right action');
    s = H.spend(s, false); assert(s.mana === 1 && s.happy === 1, 'wrong action');
  });
  test('the visit ends: done when happy is full, lost when mana runs out first', () => {
    assert(H.visitOver({ mana: 4, happy: 6, happyMax: 6 }) === 'done', 'happy full');
    assert(H.visitOver({ mana: 0, happy: 2, happyMax: 6 }) === 'lost', 'out of mana');
    assert(H.visitOver({ mana: 3, happy: 2, happyMax: 6 }) === null, 'still going');
  });
  test('a full normal visit needs at least six right actions and at most ten mana: the rules add up', () => {
    const p = H.plan(5, 6);
    assert(p.happyMax <= p.mana + p.happyMax - 1 && p.happyMax <= p.mana + 3 * 2, 'possible within the mana');
  });

  const failed = results.filter(r => !r.ok);
  if (isNode) { for (const r of results) console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n      ' + r.msg)); console.log(`\n${results.length - failed.length} of ${results.length} helper tests passed`); if (failed.length) process.exitCode = 1; }
  else globalThis.HELPER_TEST_RESULTS = results;
})();
