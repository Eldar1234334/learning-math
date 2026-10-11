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
    for (let k = 0; k < 50; k++) { const a = BR.dropUnits(3, rnd), b = BR.dropUnits(25, rnd); assert(a >= 3 && a <= 5 && b >= 6 && b <= 9, 'drops ' + a + ' ' + b); }
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
    assert(n === 36 * Object.keys(BR.RECIPES).length, 'recipes ' + n);
  });
  test('most herb lines come from the easy step itself (the whole-number levels)', () => {
    let here = 0, all = 0; for (let k = 0; k < 200; k++) { const m = 2 + (k % 18), r = BR.recipe({ potion: 'heart', mlvl: m, owned, rnd }); for (const l of r.lines.filter(l => l.kind === 'herb')) { all++; if (l.p.lv === BR.easy(m)) here++; } }
    assert(here / all > .65, 'own level ' + (here / all).toFixed(2));   // about 0.7: some easy steps cannot make small amounts (level 5 starts at 10), so those lines come from review
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
  test('herb amounts vary (not mostly the smallest amount, the owner\'s feedback)', () => {
    for (const m of [3, 6, 9, 14, 20, 27]) { const c = {}; let all = 0; for (let k = 0; k < 120; k++) for (const l of BR.recipe({ potion: 'heart', mlvl: m, owned, rnd }).lines.filter(l => l.kind === 'herb')) { all++; c[ME.num(l.amount)] = (c[ME.num(l.amount)] || 0) + 1; }
      assert((c[2] || 0) / all < .25 && Object.keys(c).length >= 3, 'level ' + m + ': ' + JSON.stringify(c)); }
  });
  test('ratio lines: "for every u of the first herb, v" (from the easy step 16, single potions)', () => {
    let n = 0; for (let k = 0; k < 300; k++) { const m = 17 + (k % 20), r = BR.recipe({ potion: k % 2 ? 'heart' : 'sound', mlvl: m, owned, rnd });
      for (const l of r.lines.filter(l => l.p.form === 'ratio')) { n++; const H = ME.num(r.lines[0].amount), o = l.p.ops;
        assert(o.h === H && H % o.a === 0 && o.a < H, 'groups of the first herb ' + l.p.e); assert(ME.eq(l.amount, l.p.a), 'answer');
        if (l.kind === 'herb') assert(ME.isWhole(l.amount) && r.lines.filter(x => x.kind === 'herb').reduce((a, x) => a + ME.num(x.amount), 0) <= 12, 'herbs ' + l.p.e); else assert(ME.num(l.amount) <= l.scale.max, 'jug'); } }
    assert(n > 40, 'ratio lines ' + n);
    for (let k = 0; k < 50; k++) assert(!BR.recipe({ potion: 'sound', mlvl: 10, owned, rnd }).lines.some(l => l.p.form === 'ratio'), 'none before 16');
  });
  test('rare items for a batch: other items of the same rarity fill in when the chosen one runs short', () => {
    const pool = { 1: { fire: 1, water: 4, wind: 3 }, 2: { claw: 2 } };
    const u = BR.rarePlan([1, 1], ['fire', 'water'], pool, 4); assert(u && u.fire === 1 && u.water === 4 && u.wind === 3, 'fills in ' + JSON.stringify(u));
    assert(!BR.rarePlan([1, 1], ['fire', 'water'], pool, 5), 'not enough for 5');
    assert(JSON.stringify(BR.rarePlan([1, 2], ['wind', 'claw'], pool, 1)) === '{"wind":1,"claw":1}', 'single potion: the chosen items');
    assert(BR.maxBatch([1, 1], pool, 40) === 4 && BR.maxBatch([1, 2], pool, 40) === 2 && BR.maxBatch([1, 1], pool, 5) === 2, 'max batch');
  });
  test('liquid lines are amounts to pour: no "1/□" problems, scoops for "how many", litres for decimals', () => {
    for (let k = 0; k < 400; k++) { const m = 24 + (k % 13), l = BR.recipe({ potion: 'sound', mlvl: m, owned, rnd }).lines.find(l => l.kind === 'liquid');
      assert(!['simplify', '=n/□'].includes(l.p.form), 'skipped ' + l.p.form); if (['=□/n', 'k÷a/n', 'a/m÷b/n'].includes(l.p.form)) assert(l.scale.unit === 'scoops', 'scoops');
      if (l.p.ops && [l.p.ops.fa, l.p.ops.fb].some(x => x && x.k === 'dec')) assert(l.scale.type === 'dec', 'litres for ' + l.p.e);
      if (l.scale.type === 'frac') assert(l.scale.d <= 24, 'jug marks ' + l.scale.d); }
  });
  test('the Artificer\'s blueprints (spec 04 §5.2): epic at the easy step, legendary at the current level with a multi-step line', () => {
    for (let m = 1; m <= 36; m++) {
      const e = BR.recipe({ potion: 'forge1', mlvl: m, owned, rnd }), l = BR.recipe({ potion: 'forge2', mlvl: m, L: m, owned, rnd });
      assert(e && e.L === BR.easy(m) && !e.lines.some(x => x.p.form === 'scale'), 'epic at the easy step ' + m);
      const sc = l && l.lines.find(x => x.p.form === 'scale'); assert(l && l.L === m && sc, 'legendary at the current level, with a multi-step line ' + m);
      assert(ME.eq(sc.amount, sc.p.a) && ME.isWhole(sc.amount) && ME.num(sc.amount) <= sc.scale.max, 'the multi-step line ' + sc.p.e);
      const o = sc.p.ops; assert(ME.num(sc.amount) === (o.d ? o.k * o.E + o.E * o.n / o.d : o.k * o.E + o.m), 'k × E + more ' + sc.p.e);
    }
  });
  test('few herbs owned (2–4 of a kind): every recipe still works (a bug found by the owner, step 9)', () => {
    const few = { leaf: 4, flower: 3, seed: 3, root: 2, mushroom: 2 };
    for (let m = 1; m <= 36; m++) for (const potion of Object.keys(BR.RECIPES)) for (let k = 0; k < 3; k++) {
      const r = BR.recipe({ potion, mlvl: m, L: potion === 'forge2' ? m : undefined, owned: few, rnd }); assert(r, 'a recipe: ' + potion + ' at ' + m);
      for (const l of r.lines.filter(l => l.kind === 'herb')) assert(ME.num(l.amount) <= few[l.herb], 'owned ' + l.herb);
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
