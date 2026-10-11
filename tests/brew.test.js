/* Math Wizard: tests for the brewing rules (brew.js).
   Run in a browser: open tests/index.html. Run with Node: node tests/brew.test.js */
(function () {
  'use strict';
  const isNode = typeof module === 'object' && typeof require === 'function';
  if (isNode) { globalThis.ME = require('../math.js'); globalThis.SB = require('../spells.js'); globalThis.CB = require('../combat.js'); }
  const ME = globalThis.ME, BR = isNode ? require('../brew.js') : globalThis.BR;
  const results = [];
  const test = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, msg: e.message }); } };
  const assert = (c, msg) => { if (!c) throw new Error(msg || 'assertion failed'); };
  let seed = 4242; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  ME.setRandom(rnd);

  test('the easy step, the loss chance and the drops (spec 04 §1, spec 03 §6.4, spec 04 §6)', () => {
    assert(BR.easy(1) === 1 && BR.easy(13) === 12, 'easy step');
    assert(Math.abs(BR.lossChance(1) - .1) < 1e-9 && Math.abs(BR.lossChance(11) - .3) < 1e-9 && BR.lossChance(30) === .5, 'loss 10% → 50%');
    for (let k = 0; k < 50; k++) { const a = BR.dropUnits(3, rnd), b = BR.dropUnits(25, rnd); assert(a >= 1 && a <= 2 && b >= 3 && b <= 5, 'drops ' + a + ' ' + b); }
  });
  const owned = { leaf: 12, grass: 9, seed: 6, root: 3 };
  test('every recipe at every level: herb lines within what the student owns (at most 12 per potion), a liquid line, a right answer for each', () => {
    let n = 0;
    for (let m = 1; m <= 36; m++) for (const potion of Object.keys(BR.RECIPES)) {
      const r = BR.recipe({ potion, mlvl: m, owned, rnd }); assert(r, 'no recipe ' + potion + ' at ' + m); n++;
      const herbs = r.lines.filter(l => l.kind === 'herb'), used = {};
      assert(herbs.length === BR.RECIPES[potion].herbs, 'herb lines ' + potion);
      for (const l of herbs) { assert(ME.isWhole(l.amount) && ME.num(l.amount) >= 2, 'whole herbs'); used[l.herb] = (used[l.herb] || 0) + ME.num(l.amount); assert(ME.eq(l.p.a, l.amount), 'the problem answers the line'); assert(l.p.lv <= BR.easy(m), 'not above the easy step: ' + l.p.lv); }
      assert(Object.keys(used).every(id => used[id] <= owned[id]), 'owned ' + JSON.stringify(used));
      assert(herbs.reduce((a, l) => a + ME.num(l.amount), 0) <= 12, 'at most 12 herbs');
      const lq = r.lines.find(l => l.kind === 'liquid'); assert(lq && ME.eq(lq.p.a, lq.amount), 'a liquid line at ' + m);
    }
    assert(n === 36 * 5, 'recipes ' + n);
  });
  test('most herb lines come from the easy step itself (the whole-number levels)', () => {
    let here = 0, all = 0; for (let k = 0; k < 200; k++) { const m = 2 + (k % 18), r = BR.recipe({ potion: 'heart', mlvl: m, owned, rnd }); for (const l of r.lines.filter(l => l.kind === 'herb')) { all++; if (l.p.lv === BR.easy(m)) here++; } }
    assert(here / all > .7, 'own level ' + (here / all).toFixed(2));
  });
  test('batches from level 11: "each potion needs k, brew b potions"', () => {
    const r = BR.recipe({ potion: 'power', mlvl: 14, owned: { leaf: 40 }, batch: 4, rnd }); const h = r.lines[0];
    assert(r.batch === 4 && h.p.form === 'batch' && h.p.ops.b === 4 && ME.num(h.amount) === h.p.ops.a * 4 && ME.num(h.amount) <= 40, 'batch line ' + h.p.e);
  });
  test('the jug fits the amount: whole drops, fraction cups, decimal litres', () => {
    for (let m = 1; m <= 36; m++) for (let k = 0; k < 6; k++) {
      const r = BR.recipe({ potion: 'sound', mlvl: m, owned, rnd }), lq = r.lines.find(l => l.kind === 'liquid'), s = lq.scale, v = lq.amount;
      assert(ME.num(v) <= s.max, 'room in the jug: ' + ME.fmt(v) + ' of ' + s.max);
      if (s.type === 'whole') assert(ME.isWhole(v) && s.steps.includes(1), 'whole');
      if (s.type === 'frac') assert(v.d === s.d, 'the jug marks fit the fraction');
      if (s.type === 'dec') { const step = s.steps[s.steps.length - 1]; assert(Math.abs(Math.round(ME.num(v) / step) * step - ME.num(v)) < 1e-9, 'the smallest step reaches ' + ME.fmt(v)); }
    }
  });
  test('checking the amounts', () => {
    const r = BR.recipe({ potion: 'heart', mlvl: 5, owned, rnd }), right = r.lines.map(l => l.amount), wrong = right.slice(); wrong[0] = ME.add(wrong[0], ME.I(1));
    assert(BR.check(r.lines, right).every(Boolean), 'all right'); assert(!BR.check(r.lines, wrong)[0] && BR.check(r.lines, wrong).slice(1).every(Boolean), 'one wrong line');
  });

  const failed = results.filter(r => !r.ok);
  if (isNode) { for (const r of results) console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n      ' + r.msg)); console.log(`\n${results.length - failed.length} of ${results.length} brewing tests passed`); if (failed.length) process.exitCode = 1; }
  else globalThis.BREW_TEST_RESULTS = results;
})();
