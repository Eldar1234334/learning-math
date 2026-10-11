/* Math Wizard: brewing rules (spec 04 §3, step 7). No screen code: the game (index.html) draws the recipe card, the jars and the jug; the tests check the rules.
   Needs math.js (ME) and combat.js (CB, for which levels can make a number).

   A recipe is written at the "easy step" (one math level below the student's, spec 04 §1). It has:
   - herb lines: common ingredients the student owns, whole counts (at most 12 per potion, more in a batch), each line a small problem of the level;
   - one liquid line: free spring water, moon water or oil, which carries the level's real numbers (hundreds, fractions, decimals) and is poured with the jug;
   - the rare items of the potion (stones, creature parts, sky items, treasures), 1 each, chosen by the student; they are not a math task.
   Each herb and liquid line is one scored answer (weight ½ up, 1 down).
*/
(function (root) {
  'use strict';
  const ME = root.ME || require('./math.js'), CB = root.CB || require('./combat.js');

  const CFG = {
    MAX_HERBS: 12,                     // herb units in one potion (spec 04 §3.2)
    MIN_HERB_LINE: 2,                  // the smallest herb amount a line asks for
    BATCH_FROM: 11, BATCH_MAX: 5,      // batches (2–5 potions at once) from the multiplication levels (spec 04 §3.2–3.3)
    LOSS: [0.10, 0.02, 0.50],          // a failed brew loses the ingredients: 10% + 2% per wizard level, at most 50% (spec 03 §6.4)
    DROP_UNITS: [[1, 1, 2], [7, 2, 3], [13, 2, 4], [22, 3, 5]],   // [from math level, min, max] herb units in one drop (spec 04 §6)
    XP_LINE: 3                         // XP per right line (spec 04 §3.1)
  };
  // what each potion needs (spec 04 §3.2): herb lines, the rarities of its rare items (1 = stone, 2 = creature part, 3 = sky item, 4 = treasure), the cauldron
  const RECIPES = {
    heart: { caul: 0, herbs: 2, rare: [] },
    sound: { caul: 0, herbs: 1, rare: [1] },
    power: { caul: 1, herbs: 1, rare: [1, 1] },
    second: { caul: 1, herbs: 1, rare: [1, 2] },
    super: { caul: 2, herbs: 1, rare: [3, 3, 4] }
  };
  const LIQUIDS = ['spring', 'moon', 'oil'];
  const easy = mlvl => Math.max(1, mlvl - 1);
  const lossChance = g => Math.min(CFG.LOSS[2], CFG.LOSS[0] + CFG.LOSS[1] * (g - 1));
  function dropUnits(mlvl, rnd = Math.random) { const row = CFG.DROP_UNITS.reduce((r, x) => mlvl >= x[0] ? x : r, CFG.DROP_UNITS[0]); return row[1] + Math.floor(rnd() * (row[2] - row[1] + 1)); }

  // the highest level ≤ L whose problems can have the answer t (whole numbers only exist up to some levels; the fraction levels use review)
  function levelFor(t, L) { const v = ME.I(t); for (let n = L; n >= 1; n--) if (CB.canMake(v, n)) return n; return null; }
  // a herb line with the amount t, as a problem of the easy step (or the nearest level below that has such problems)
  function herbProblem(t, L, avoid) { const n = levelFor(t, L); if (!n) return null; const p = ME.make(n, { target: ME.I(t), avoid }); return p ? Object.assign({}, p, { lv: n }) : null; }
  // o: { L (easy step), max (herb units owned of this herb, and the room left), batch, rnd, avoid }
  function herbLine(o) {
    const rnd = o.rnd || Math.random, b = o.batch || 1, cap = Math.min(o.max, CFG.MAX_HERBS * b);
    if (b > 1) {   // a batch: "Each potion needs k leaves. Brew b potions." (multiplication)
      const kMax = Math.floor(cap / b); if (kMax < 1) return null; const k = 1 + Math.floor(rnd() * Math.min(kMax, 8));
      return { kind: 'herb', amount: ME.I(k * b), p: { lv: o.L, e: `${k} × ${b}`, a: ME.I(k * b), key: `batch ${k}×${b}`, form: 'batch', ops: { a: k, b, op: '×' } } };
    }
    if (cap < CFG.MIN_HERB_LINE) return null;
    const ts = []; for (let t = CFG.MIN_HERB_LINE; t <= cap; t++) ts.push(t);
    for (let tries = 0; tries < 12 && ts.length; tries++) {   // prefer an amount the easy step itself can make
      const t = ts.splice(Math.floor(rnd() * ts.length), 1)[0], p = herbProblem(t, o.L, o.avoid);
      if (p && (p.lv === o.L || tries > 6)) return { kind: 'herb', amount: ME.I(t), p };
    }
    const p = herbProblem(CFG.MIN_HERB_LINE, o.L, o.avoid); return p ? { kind: 'herb', amount: p.a, p } : null;
  }
  // the liquid line: any problem of the easy step (its answer is poured with the jug)
  function liquidLine(o) {
    for (let k = 0; k < 20; k++) {
      const p = ME.make(o.L, { avoid: o.avoid }); if (!p) continue; const v = p.a;
      if (ME.num(v) <= 0 || ME.num(v) > 20000) continue;
      return { kind: 'liquid', liquid: LIQUIDS[Math.floor((o.rnd || Math.random)() * LIQUIDS.length)], amount: v, p, scale: jugScale(v) };
    }
    return null;
  }
  // the jug for an amount: whole drops, cups in fractions, or litres in decimals; the buttons are the steps (spec 04 §2)
  function jugScale(v) {
    if (ME.isWhole(v)) {
      const x = ME.num(v), nice = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000], max = nice.find(m => m >= x * 1.25) || 20000;
      return { type: 'whole', unit: 'drops', max, steps: [1000, 100, 10, 1].filter(s => s * 2 <= max || s === 1) };
    }
    if (v.k === 'dec') { const places = (ME.decText(v).split('.')[1] || '').length, max = Math.ceil(ME.num(v)) + 1; return { type: 'dec', unit: 'L', max, steps: [100, 10].filter(s => s * 2 <= max).concat([1, 0.1, 0.01, 0.001].slice(0, 1 + Math.min(3, places))) }; }
    return { type: 'frac', unit: 'cups', max: Math.ceil(ME.num(v)) + 1, d: v.d, steps: [1] };   // ± 1/d is the small step
  }
  // owned: { herbId: count } (common ingredients); returns { L, batch, lines } or null when the student lacks herbs
  function recipe(o) {
    const rnd = o.rnd || Math.random, R = RECIPES[o.potion], L = easy(o.mlvl), b = Math.max(1, Math.min(o.batch || 1, CFG.BATCH_MAX)), avoid = new Set(o.avoid || []);
    const herbs = Object.keys(o.owned).filter(id => o.owned[id] >= CFG.MIN_HERB_LINE * (b > 1 ? 1 : 1)).sort((x, y) => o.owned[y] - o.owned[x]);
    if (herbs.length < R.herbs) return null;
    const lines = []; let room = CFG.MAX_HERBS * b;
    for (let i = 0; i < R.herbs; i++) {
      const id = herbs[i], left = R.herbs - i - 1, share = Math.max(CFG.MIN_HERB_LINE, room - left * CFG.MIN_HERB_LINE);
      const ln = herbLine({ L, max: Math.min(o.owned[id], share), batch: b, rnd, avoid }); if (!ln) return null;
      ln.herb = id; lines.push(ln); avoid.add(ln.p.key); room -= ME.num(ln.amount);
    }
    const lq = liquidLine({ L, rnd, avoid }); if (lq) lines.push(lq);
    return { L, batch: b, lines };
  }
  // the most potions the rare items allow (each chosen rare item is used once per potion)
  const maxBatch = (chosenCounts) => Math.max(1, Math.min(CFG.BATCH_MAX, ...chosenCounts.concat([CFG.BATCH_MAX])));
  // the student's amounts → which lines are right
  const check = (lines, amounts) => lines.map((ln, i) => !!amounts[i] && ME.eq(amounts[i], ln.amount));

  const BR = { CFG, RECIPES, LIQUIDS, easy, lossChance, dropUnits, levelFor, herbLine, liquidLine, jugScale, recipe, maxBatch, check };
  if (typeof module === 'object' && module.exports) module.exports = BR; else root.BR = BR;
})(typeof globalThis !== 'undefined' ? globalThis : this);
