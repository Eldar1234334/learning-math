/* Math Wizard: tests for the Village Helper logic (helper.js), slice 1.
   Run in a browser: open tests/index.html. Run with Node: node tests/helper.test.js */
(function () {
  'use strict';
  const isNode = typeof module === 'object' && typeof require === 'function';
  const H = isNode ? require('../helper.js') : globalThis.HELPER;
  const results = [];
  const test = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, msg: e.message }); } };
  const assert = (c, msg) => { if (!c) throw new Error(msg || 'assertion failed'); };
  let seed = 4242; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const evalCard = c => (c.op === '+' ? c.a + c.b : c.a - c.b);

  test('the book has nine items, numbered 1 to 9, each once', () => {
    const ns = H.BOOK.map(x => x.n).sort((a, b) => a - b);
    assert(ns.join() === '1,2,3,4,5,6,7,8,9', 'numbers ' + ns.join());
  });
  test('the book item for 3 is wood', () => {
    assert(H.itemOf(3).one[0] === 'Wood', 'item 3 is ' + H.itemOf(3).one[0]);
  });
  test('plural names: one apple, two apples', () => {
    assert(H.nameFor(H.itemOf(2), 1)[0] === 'Apple' && H.nameFor(H.itemOf(2), 2)[0] === 'Apples', 'apple forms');
  });
  test('level 1 has only result-unknown stories; level 4 adds change-unknown', () => {
    assert(H.typesFor(1).join() === 'result', 'level 1: ' + H.typesFor(1).join());
    assert(H.typesFor(3).join() === 'result', 'level 3: ' + H.typesFor(3).join());
    assert(H.typesFor(4).join() === 'result,change', 'level 4: ' + H.typesFor(4).join());
  });
  test('result-unknown requests: the target is the total, a and b in range', () => {
    for (let i = 0; i < 300; i++) {
      const q = H.makeRequest(1, rnd);
      assert(q.type === 'result', 'type at level 1');
      assert(q.a >= 1 && q.a <= 4 && q.b >= 1 && q.b <= 4, 'a/b range');
      assert(q.target === q.a + q.b, 'target ' + q.target);
      assert(H.itemOf(q.item.n) === q.item, 'item from the book');
    }
  });
  test('change-unknown requests: the target is the rest, numbers in range', () => {
    let seen = 0;
    for (let i = 0; i < 400; i++) {
      const q = H.makeRequest(4, rnd);
      if (q.type !== 'change') continue;
      seen++;
      assert(q.t >= 5 && q.t <= 10, 't range ' + q.t);
      assert(q.a >= 1 && q.a <= q.t - 1, 'a range ' + q.a);
      assert(q.target === q.t - q.a && q.target >= 1, 'target ' + q.target);
    }
    assert(seen > 50, 'change requests seen: ' + seen);
  });
  test('a card for every number 1 to 9, with a true sum or difference and numbers from 0 to 10', () => {
    for (let v = 1; v <= 9; v++) for (let i = 0; i < 40; i++) {
      const c = H.cardFor(v, rnd);
      assert(c && c.value === v && evalCard(c) === v, 'card for ' + v + ': ' + JSON.stringify(c));
      assert(c.a >= 0 && c.a <= 10 && c.b >= 0 && c.b <= 10, 'numbers in range: ' + JSON.stringify(c));
    }
  });
  test('step 1 cards: four cards, exactly one gives the item number, values all different', () => {
    for (const item of H.BOOK) for (let i = 0; i < 20; i++) {
      const cards = H.cardsFor(item, rnd);
      assert(cards.length === 4, 'four cards');
      assert(cards.filter(c => H.cardOk(c, item)).length === 1, 'one correct card for item ' + item.n);
      assert(new Set(cards.map(c => c.value)).size === 4, 'values all different');
      assert(cards.every(c => evalCard(c) === c.value), 'every card computes its value');
    }
  });
  test('step 2: correct, too few, too many', () => {
    assert(H.checkAmount(7, 7).ok === true, 'correct');
    const few = H.checkAmount(6, 7);
    assert(few.ok === false && few.kind === 'few' && few.have === 6 && few.more === 1, 'too few');
    const many = H.checkAmount(9, 7);
    assert(many.ok === false && many.kind === 'many' && many.have === 9 && many.extra === 2, 'too many');
  });
  test('a wrong card points to the item with that number', () => {
    const c = H.cardFor(5, rnd);
    assert(H.wrongItemFor(c).n === 5, 'wrong item for 5');
  });

  const failed = results.filter(r => !r.ok);
  if (isNode) { for (const r of results) console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n      ' + r.msg)); console.log(`\n${results.length - failed.length} of ${results.length} helper tests passed`); if (failed.length) process.exitCode = 1; }
  else globalThis.HELPER_TEST_RESULTS = results;
})();
