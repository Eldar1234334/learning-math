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

  test('every item has a Hebrew gender (m or f) and a plural form', () => {
    for (const x of H.BOOK) {
      assert(H.genderOf(x) === 'm' || H.genderOf(x) === 'f', 'gender of ' + x.n);
      assert(x.many && x.many[1] && x.one[1], 'forms of ' + x.n);
    }
    assert(H.itemOf(30).many[1] === 'חוטים', 'thread plural');
  });
  test('mass items read with a unit in a story: one sack, three sacks; countable items unchanged', () => {
    assert(H.storyName(H.itemOf(5), 1)[0] === 'sack of flour' && H.storyName(H.itemOf(5), 3)[0] === 'sacks of flour', 'flour en');
    assert(H.storyName(H.itemOf(5), 3)[1] === 'שקי קמח', 'flour he');
    assert(H.storyName(H.itemOf(2), 3)[1] === 'כוסות מים', 'water he');
    assert(H.storyName(H.itemOf(3), 3)[0] === 'Apples', 'apples unchanged');
    assert(H.genderOf(H.itemOf(5)) === 'm' && H.genderOf(H.itemOf(2)) === 'f', 'mass genders from the unit');
  });
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
    assert(!m1.cardStep && m1.itemStep && m1.perItem === 2, 'level 1: amount answer and item answer are the actions');
    assert(m2.cardStep && m2.itemStep && m2.perItem === 2, 'level 2: the cards are free, still two actions per item');
  });
  test('a project has two items: the happy meter is perItem × 2', () => {
    assert(H.plan(5, 5).happyMax === 4 && H.plan(1, 1).happyMax === 2 && H.plan(1, 3).happyMax === 4, 'happy max');
  });
  test('the item answer choices: the item number among three numbers near it', () => {
    for (let i = 0; i < 30; i++) { const c = H.itemAnswers(24, rnd); assert(c.length === 4 && c.includes(24) && new Set(c).size === 4, 'four different, with 24'); }
  });
  test('every story: the rest is the amount, and the need minus the have (or minus the two parts)', () => {
    for (let i = 0; i < 200; i++) {
      const p = H.makeAmount(9, rnd);
      assert(H.cardValue(p.expr) === p.amount, 'card value is the rest for ' + p.kind);
    }
  });
  const FROM = { join: 1, separate: 3, change: 4, part: 4, compare: 5, start: 6, two: 9, groups: 11, array: 13, share: 15, group: 15, mcompare: 16, ceil: 20, fracset: 22, multi: 24, fracleft: 25, decimal: 28, percent: 34, ratio: 35, mix: 36 };
  test('story types by level (spec 05 §5): each type starts at its level', () => {
    for (const [id, lvl] of Object.entries(FROM)) {
      assert(H.storyTypes(lvl).includes(id), id + ' from level ' + lvl);
      if (lvl > 1) assert(!H.storyTypes(lvl - 1).includes(id), id + ' not before level ' + lvl);
    }
    assert(H.storyTypes(1).join() === 'join', 'level 1: ' + H.storyTypes(1).join());
    assert(H.storyTypes(3).join() === 'join,separate', 'level 3: ' + H.storyTypes(3).join());
    assert(H.storyTypes(36).length === Object.keys(FROM).length, 'all the types at the top');
  });
  test('every story at every level is a real problem: the answer is not in the story, the story card computes it, the cards differ', () => {
    for (let lvl = 1; lvl <= 35; lvl++) for (let i = 0; i < 120; i++) {
      const item = H.BOOK[Math.floor(rnd() * H.BOOK.length)], others = H.BOOK.filter(x => x.n !== item.n);
      const p = H.makeAmount(lvl, rnd, { item, others });
      assert(H.storyTypes(lvl).includes(p.kind), p.kind + ' at level ' + lvl);
      assert(p.amount > 0 && p.amount < 10000 && isFinite(p.amount), 'amount ' + p.amount + ' for ' + p.kind);
      assert(!p.nums.includes(p.amount), 'the answer is in the story: ' + p.kind + ' ' + p.nums + ' ' + p.amount);
      assert(Math.abs(H.cardValue(p.expr) - p.amount) < 1e-9, 'story card value for ' + p.kind + ' at level ' + lvl);
      if (p.kind !== 'decimal') assert(Number.isInteger(p.amount), 'a whole amount for ' + p.kind); else assert(!Number.isInteger(p.amount), 'a decimal amount for a decimal story');
      const cards = H.amountCards(p, rnd);
      assert(cards.length === 4 && cards.filter(c => c.fits).length === 1, 'four cards, one fits: ' + p.kind);
      assert(new Set(cards.map(c => H.cardValue(c))).size === 4, 'four different values: ' + p.kind + ' at level ' + lvl);
      assert(cards.every(c => c.fits || Math.abs(H.cardValue(c) - p.amount) > 1e-9), 'no other card gives the amount: ' + p.kind);
    }
  });
  test('the numbers follow the ladder: up to 5, 10, 20, 100, 1000 as the level grows', () => {
    const top = lvl => { let m = 0; for (let i = 0; i < 400; i++) { const p = H.makeAmount(lvl, rnd, {}); m = Math.max(m, p.amount, ...p.nums); } return m; };
    assert(top(1) <= 5, 'level 1: ' + top(1)); assert(top(2) <= 10, 'level 2: ' + top(2)); assert(top(5) <= 20, 'level 5: ' + top(5));
    assert(top(8) <= 100, 'level 8: ' + top(8)); assert(top(16) <= 100, 'level 16: ' + top(16)); assert(top(20) <= 1000, 'level 20: ' + top(20));
    assert(top(19) > 100, 'bigger numbers at level 19: ' + top(19)); assert(top(35) <= 1000, 'level 35 stays within 1000: ' + top(35));
  });
  test('a measure story (decimal) only for a measured item, a ratio story only when there are other items', () => {
    for (let i = 0; i < 400; i++) { const p = H.makeAmount(35, rnd, { item: H.itemOf(3), others: [] }); assert(p.kind !== 'decimal' && p.kind !== 'ratio', 'no ' + p.kind + ' for an apple without others'); }
    let dec = false, rat = false;
    for (let i = 0; i < 800; i++) { const p = H.makeAmount(35, rnd, { item: H.itemOf(6), others: [H.itemOf(3), H.itemOf(4)] }); if (p.kind === 'decimal') { dec = true; assert(p.measure && p.measure[0] === 'metres', 'rope in metres'); } if (p.kind === 'ratio') { rat = true; assert(p.other, 'the other item'); } }
    assert(dec && rat, 'both appear: decimal ' + dec + ', ratio ' + rat);
  });
  test('cards use the division sign of the language, and decimals have no trailing zeros', () => {
    assert(H.cardText({ a: 24, op: '÷', b: 4 }) === '24 ÷ 4' && H.cardText({ a: 24, op: '÷', b: 4 }, ':') === '24 : 4', 'division sign');
    assert(H.cardText({ text: '⌈18 ÷ 4⌉', value: 5 }, ':') === '⌈18 : 4⌉', 'a written card');
    assert(H.cardText({ a: 4.5, op: '−', b: 2.75 }) === '4.5 − 2.75', 'decimals');
  });
  test('decimal amounts are compared by value', () => {
    assert(H.checkAmount(1.75, 1.75).ok && H.checkAmount(0.1 + 0.2, 0.3).ok, 'right');
    const f = H.checkAmount(1.5, 1.75); assert(!f.ok && f.kind === 'few' && f.more === 0.25, 'too few by 0.25: ' + f.more);
  });
  test('the amount is typed on a pad above 10 or with a decimal point', () => {
    assert(!H.needsPad({ amount: 10 }) && H.needsPad({ amount: 11 }) && H.needsPad({ amount: 1.75 }), 'needsPad');
  });
  test('"one of the item" for the stories with one for every group', () => {
    assert(H.oneName(H.itemOf(14))[0] === 'one bucket' && H.oneName(H.itemOf(14))[1] === 'דלי אחד', 'masculine');
    assert(H.oneName(H.itemOf(4))[1] === 'ביצה אחת', 'feminine');
    assert(H.oneName(H.itemOf(5))[0] === 'one sack of flour', 'mass item');
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
  test('an impatient villager: the patience bar goes down by one on every action; empty = the villager leaves', () => {
    let s = { mana: 9, happy: 0, happyMax: 6, patience: 2 };
    s = H.spend(s, true); assert(s.patience === 1 && s.happy === 1, 'right action');
    s = H.spend(s, false); assert(s.patience === 0 && s.mana === 7, 'mistake action too');
    assert(H.visitOver(s) === 'left', 'left when patience is empty');
    assert(H.visitOver({ mana: 4, happy: 6, happyMax: 6, patience: 0 }) === 'done', 'finished first is done');
  });
  test('an impatient villager survives two mistakes in a visit and finishes', () => {
    const pl = H.plan(5, 5, 2);
    let s = { mana: 30, happy: 0, happyMax: pl.happyMax, patience: H.patienceFor(pl.happyMax) };
    s = H.spend(s, false); s = H.spend(s, false);
    assert(H.visitOver(s) === null, 'still there after two mistakes');
    for (let i = 0; i < pl.happyMax; i++) s = H.spend(s, true);
    assert(H.visitOver(s) === 'done', 'finishes the visit');
  });
  test('impatient villagers only from wizard level 6, about one visit in three', () => {
    assert(!H.isImpatient(5, () => 0), 'not before level 6');
    assert(H.isImpatient(6, () => 0.2) && !H.isImpatient(6, () => 0.5), 'one in three');
  });
  test('the visit: done when the happy meter is full, lost when the mana is gone first', () => {
    assert(H.visitOver({ mana: 1, happy: 4, happyMax: 4 }) === 'done', 'happy full');
    assert(H.visitOver({ mana: 0, happy: 2, happyMax: 4 }) === 'lost', 'out of mana');
    assert(H.visitOver({ mana: 3, happy: 2, happyMax: 4 }) === null, 'still going');
  });

  test('the conjuration book themes: every item in exactly one theme', () => {
    const all = H.THEMES.flatMap(t => t.items);
    assert(all.length === 39 && new Set(all).size === 39, 'each of the 39 items in one theme: ' + all.length);
    for (const x of H.BOOK) assert(H.themeOf(x).items.includes(x.n), 'theme of ' + x.n);
  });
  test('the "some are gone" word: a blanket is torn, the others are broken, agreeing with the count and gender', () => {
    assert(H.breakWord(H.itemOf(60), 1)[0] === 'torn' && H.breakWord(H.itemOf(60), 1)[1] === 'נקרעה', 'one blanket torn');
    assert(H.breakWord(H.itemOf(60), 3)[1] === 'נקרעו', 'blankets torn');
    assert(H.breakWord(H.itemOf(5), 1)[0] === 'broke' && H.breakWord(H.itemOf(5), 2)[1] === 'נשברו', 'broken');
    assert(H.breakWord(H.itemOf(25), 1)[1] === 'נשברה', 'feminine');
  });

  const failed = results.filter(r => !r.ok);
  if (isNode) { for (const r of results) console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n      ' + r.msg)); console.log(`\n${results.length - failed.length} of ${results.length} helper tests passed`); if (failed.length) process.exitCode = 1; }
  else globalThis.HELPER_TEST_RESULTS = results;
})();
