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
    DROP_UNITS: [[1, 3, 5], [7, 4, 6], [13, 5, 8], [22, 6, 9]],   // [from math level, min, max] herb units in one drop (spec 04 §6); every won fight drops herbs, plenty for potions (owner, step 7)
    OWN_SHARE: 0.9,                    // how often a herb line is a problem of the easy step itself (the rest: review levels)
    RATIO_FROM: 16, RATIO_CHANCE: 0.35,  // ratio lines ("for every 2 leaves, 15 drops") from the easy step 16 (after division), in about 1 recipe of 3
    XP_LINE: 3                         // XP per right line (spec 04 §3.1)
  };
  // what each potion needs (spec 04 §3.2): herb lines, the rarities of its rare items (1 = stone, 2 = creature part, 3 = sky item, 4 = treasure), the cauldron
  const RECIPES = {
    heart: { caul: 0, herbs: 2, rare: [] },
    sound: { caul: 0, herbs: 1, rare: [1] },
    power: { caul: 1, herbs: 1, rare: [1, 1] },
    second: { caul: 1, herbs: 1, rare: [1, 2] },
    super: { caul: 2, herbs: 1, rare: [3, 3, 4] },
    forge1: { caul: 0, herbs: 2, rare: [3] },       // the Artificer's blueprint for an epic item (spec 04 §5.2): 1 epic ingredient + herb lines + a liquid
    forge2: { caul: 0, herbs: 2, rare: [4, 3], multi: true }   // the legendary upgrade: 1 legendary + 1 epic ingredient, at the current level, with a multi-step line
  };
  /* ---- brewing by rank (spec 04 §3.2): the Academy rank (the tests passed) decides what goes in the cauldron and which potions can be brewed ----
     rank 0: one ingredient type (herbs), one line, no stone, no liquid; Heart and Hint.  Ranks 1 and 2: two herb lines (herbs plus a second herb type),
     the potion's stone or creature part, no liquid; adds Power and Second chance.  Rank 3 and up: the full recipe with the liquid (the jug); adds Super.
     `rank` is left out for the Artificer's forge (owner decision: the forge keeps its own recipes) and for the older tests: the full recipe. */
  const FROM_RANK = { heart: 0, sound: 0, power: 1, second: 1, super: 3 };            // the rank that opens each potion
  const HERB_RANGE = { heart: [4, 10], sound: [3, 8], power: [3, 8], second: [3, 8], super: [3, 8] };   // herb units in one potion at a rank (spec 04 §3.4, approx.)
  const potionOpen = (potion, rank) => rank == null || FROM_RANK[potion] == null || rank >= FROM_RANK[potion];
  const rareFor = (potion, rank) => rank == null || rank >= 1 ? RECIPES[potion].rare : [];       // rank 0: no stone (Hint has none at rank 0)
  const herbLinesFor = (potion, rank) => rank == null || rank >= 3 ? RECIPES[potion].herbs : rank >= 1 ? Math.max(2, RECIPES[potion].herbs) : 1;
  const liquidOk = rank => rank == null || rank >= 3;
  const LIQUIDS = ['spring', 'moon', 'oil'];
  const easy = mlvl => Math.max(1, mlvl - 1);
  const lossChance = g => Math.min(CFG.LOSS[2], CFG.LOSS[0] + CFG.LOSS[1] * (g - 1));
  function dropUnits(mlvl, rnd = Math.random) { const row = CFG.DROP_UNITS.reduce((r, x) => mlvl >= x[0] ? x : r, CFG.DROP_UNITS[0]); return row[1] + Math.floor(rnd() * (row[2] - row[1] + 1)); }

  // the highest level ≤ L whose problems can have the answer t (whole numbers only exist up to some levels; the fraction levels use review)
  function levelFor(t, L) { const v = ME.I(t); for (let n = L; n >= 1; n--) if (CB.canMake(v, n)) return n; return null; }
  // a herb line with the amount t, as a problem of the easy step (or the nearest level below that has such problems)
  function herbProblem(t, L, avoid) { const n = levelFor(t, L); if (!n) return null; const p = ME.make(n, { target: ME.I(t), avoid }); return p ? Object.assign({}, p, { lv: n }) : null; }
  // o: { L (easy step), max (herb units owned of this herb, and the room left), keep (units to leave for the next lines), batch, rnd, avoid }
  function herbLine(o) {
    const rnd = o.rnd || Math.random, b = o.batch || 1, cap = Math.min(o.max, o.hmax ? o.hmax * b : CFG.MAX_HERBS * b), pk = a => a[Math.floor(rnd() * a.length)];
    if (b > 1) {   // a batch: "Each potion needs k leaves. Brew b potions." (multiplication)
      const kMax = Math.floor(cap / b); if (kMax < 1) return null; const k = kMax < 2 ? 1 : 2 + Math.floor(rnd() * (Math.min(kMax, 9) - 1));   // 2–9 each, if the herbs allow
      return { kind: 'herb', amount: ME.I(k * b), p: { lv: o.L, e: `${k} × ${b}`, a: ME.I(k * b), key: `batch ${k}×${b}`, form: 'batch', ops: { a: k, b, op: '×' } } };
    }
    if (cap < CFG.MIN_HERB_LINE) return null;
    // every amount that fits, sorted by where its problem comes from: the easy step itself, or a review level below it
    const own = [], rev = []; for (let t = Math.max(CFG.MIN_HERB_LINE, o.min || 0); t <= cap; t++) { const n = levelFor(t, o.L); if (n === o.L) own.push(t); else if (n) rev.push(t); }
    const roomy = a => a.filter(t => t !== CFG.MIN_HERB_LINE && t <= cap - (o.keep || 0));   // not always the smallest amount, and room left for the next line
    const first = rnd() < CFG.OWN_SHARE ? [own, rev] : [rev, own], pools = first.map(roomy).concat(first);
    for (const pool of pools) for (let tries = 0; tries < 4 && pool.length; tries++) {
      const t = pk(pool), p = herbProblem(t, o.L, o.avoid); if (p) return { kind: 'herb', amount: ME.I(t), p };   // (the pools are already filtered)
    }
    return null;
  }
  // a ratio line (spec 04 §3.3, "2 thorns for every 3 roots"): for every u of the first herb, v of this one; the recipe has H of the first herb.
  // unit: 'herb' (whole), or the liquid's jug: drops, cups (fraction levels) or litres (decimal levels). max: the most this line may hold.
  function ratioLine(H, L, max, rnd, kind) {
    const us = []; for (let u = 2; u < H && u <= 6; u++) if (H % u === 0) us.push(u); if (!us.length) return null;
    const type = ME.LV[L] && ME.LV[L].type, m0 = H, opts = [];
    const vs = kind === 'herb' ? [1, 2, 3, 4, 5].map(ME.I) : type === 'frac' && L >= 27 ? [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5]].map(([n, d]) => ME.F(n, d))
      : type === 'dec' ? [2, 3, 4, 5, 6, 8, 15, 25].map(x => ME.V(x, x === 15 || x === 25 ? 100 : 10, 'dec')) : [5, 10, 15, 20, 25, 30, 40, 50].map(ME.I);
    for (const u of us) for (const v of vs) { const a = ME.mul(ME.I(m0 / u), v); if (ME.num(a) <= max && ME.num(a) >= (kind === 'herb' ? 3 : 0) && !(ME.isWhole(v) && v.n === u)) opts.push([u, v, a]); }
    if (!opts.length) return null; const [u, v, a] = opts[Math.floor(rnd() * opts.length)];
    const vt = ME.isWhole(v) ? String(v.n) : v.k === 'dec' ? ME.decText(v) : `[${v.n}/${v.d}]`;
    return { amount: a, p: { lv: L, e: `${H} ÷ ${u} × ${vt}`, a, key: `ratio ${H}:${u}:${vt}`, form: 'ratio', ops: { a: u, b: vt, h: H } } };
  }
  // the liquid line: any problem of the easy step (its answer is poured with the jug)
  // Problems that are not an amount to pour are skipped ("[4/12] = [1/□]"); "how many scoops" problems are poured with a scoop; decimal problems with whole answers use litres.
  const NOT_LIQUID = ['simplify', '=n/□'], SCOOPS = ['=□/n', 'k÷a/n', 'a/m÷b/n'];
  function liquidLine(o) {
    for (let n = o.L; n >= 1 && n >= o.L - 2; n--) for (let k = 0; k < 30; k++) {
      const p = ME.make(n, { avoid: o.avoid }); if (!p || NOT_LIQUID.includes(p.form)) continue; const v = p.a;
      if (ME.num(v) <= 0 || ME.num(v) > 20000 || (!ME.isWhole(v) && v.k !== 'dec' && v.d > 24)) continue;
      const dec = v.k === 'dec' || [p.ops && p.ops.fa, p.ops && p.ops.fb].some(x => x && x.k === 'dec'), scale = jugScale(dec ? ME.V(v.n, v.d, 'dec') : v); if (SCOOPS.includes(p.form)) scale.unit = 'scoops';
      return { kind: 'liquid', liquid: LIQUIDS[Math.floor((o.rnd || Math.random)() * LIQUIDS.length)], amount: v, p: n === o.L ? p : Object.assign({}, p, { lv: n }), scale };
    }
    return null;
  }
  // the jug for an amount: whole drops, cups in fractions, or litres in decimals; the buttons are the steps (spec 04 §2)
  function jugScale(v) {
    if (ME.isWhole(v) && v.k !== 'dec') {
      const x = ME.num(v), nice = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000], max = nice.find(m => m >= x * 1.25) || 20000;
      return { type: 'whole', unit: 'drops', max, steps: [1000, 100, 10, 1].filter(s => s * 2 <= max || s === 1) };
    }
    if (v.k === 'dec') { const places = (ME.decText(v).split('.')[1] || '').length, max = Math.ceil(ME.num(v)) + 1; return { type: 'dec', unit: 'L', max, steps: [1000, 100, 10].filter(s => s * 2 <= max).concat([1, 0.1, 0.01, 0.001].slice(0, 1 + Math.min(3, places))) }; }
    return { type: 'frac', unit: 'cups', max: Math.ceil(ME.num(v)) + 1, d: v.d, steps: [1] };   // ± 1/d is the small step
  }
  // owned: { herbId: count } (common ingredients); returns { L, batch, lines } or null when the student lacks herbs
  function recipe(o) {
    const rnd = o.rnd || Math.random, R = RECIPES[o.potion], L = o.L || easy(o.mlvl), b = Math.max(1, Math.min(o.batch || 1, CFG.BATCH_MAX)), avoid = new Set(o.avoid || []);
    const rank = o.rank, ranked = rank != null && !!HERB_RANGE[o.potion], nHerb = ranked ? herbLinesFor(o.potion, rank) : R.herbs, hr = ranked ? HERB_RANGE[o.potion] : null;
    const herbs = Object.keys(o.owned).filter(id => o.owned[id] >= CFG.MIN_HERB_LINE).sort((x, y) => o.owned[y] - o.owned[x] || (rnd() < .5 ? -1 : 1));
    if (herbs.length < nHerb) return null;
    const ratio = b === 1 && L >= CFG.RATIO_FROM && rnd() < CFG.RATIO_CHANCE;   // one ratio line in some recipes (single potions)
    const lines = []; let room = (hr ? hr[1] : CFG.MAX_HERBS) * b;
    for (let i = 0; i < nHerb; i++) {
      const id = herbs[i], left = nHerb - i - 1, share = Math.max(CFG.MIN_HERB_LINE, room - left * CFG.MIN_HERB_LINE);
      let ln = null;
      if (ratio && i === 1) { const q = ratioLine(ME.num(lines[0].amount), L, Math.min(o.owned[id], room), rnd, 'herb'); if (q) ln = Object.assign({ kind: 'herb', ratio: lines[0].herb }, q); }
      const hl = min => herbLine({ L, max: Math.min(o.owned[id], share), keep: left * 3, batch: b, rnd, avoid, hmax: hr && hr[1], min });
      if (!ln) ln = hl(hr && nHerb === 1 ? hr[0] : 0) || (hr && nHerb === 1 ? hl(0) : null);   // (at the very first levels the smallest amounts may be the only ones with a problem)
      if (!ln) return null;
      ln.herb = id; lines.push(ln); avoid.add(ln.p.key); room -= ME.num(ln.amount);
    }
    let lq = null;
    if (!liquidOk(rank)) return { L, batch: b, lines };   // ranks 0 to 2: no liquids (the jug comes at rank 3)
    if (ratio && nHerb === 1) { const q = ratioLine(ME.num(lines[0].amount), L, 20000, rnd, 'liquid'); if (q) lq = Object.assign({ kind: 'liquid', ratio: lines[0].herb, liquid: LIQUIDS[Math.floor(rnd() * LIQUIDS.length)], scale: jugScale(q.amount) }, q); }
    if (!lq) lq = liquidLine({ L, rnd, avoid }); if (lq) lines.push(lq);
    if (R.multi) { const sc = scaleLine(L, rnd); if (sc) lines.push(sc); }   // the legendary recipe: "3 times the epic recipe, plus ¼ of it more"
    return { L, batch: b, lines };
  }
  // The legendary upgrade's multi-step line (spec 04 §5.2): "The legendary item needs k times the epic recipe's E drops, plus m more" (or "plus ¼ of it more" at the fraction levels; twice E plus m below multiplication)
  function scaleLine(L, rnd = Math.random) {
    const r = n => Math.floor(rnd() * n), max = L <= 1 ? 5 : L <= 4 ? 10 : L <= 6 ? 20 : L <= 16 ? 100 : 1000;
    for (let t = 0; t < 60; t++) {
      let E, k, a, e, ops;
      if (L >= 22) { const [n, d] = [[1, 2], [1, 4], [3, 4], [1, 3], [2, 3], [1, 5]][r(6)]; k = 2 + r(3); E = d * (2 + r(6)); a = k * E + E * n / d; e = `${k} × ${E} + {of:[${n}/${d}]|${E}}`; ops = { E, k, n, d }; }
      else if (L >= 11) { k = 2 + r(4); E = 2 + r(L >= 17 ? 90 : 14); const m = 1 + r(L >= 17 ? 60 : 9); a = k * E + m; e = `${k} × ${E} + ${m}`; ops = { E, k, m }; }
      else { E = 1 + r(Math.max(1, Math.floor(max / 3))); const m = 1 + r(Math.max(1, Math.floor(max / 4))); a = 2 * E + m; e = `${E} + ${E} + ${m}`; ops = { E, k: 2, m }; }
      if (a < 2 || a > (L >= 22 ? 400 : max)) continue;
      const v = ME.I(a); return { kind: 'liquid', liquid: 'moon', amount: v, scale: jugScale(v), p: { lv: L, e, a: v, key: 'scale ' + e, form: 'scale', ops } };
    }
    return null;
  }
  // The rare items for a batch (the student's feedback, step 7): each potion needs its slots filled with different items of the slot's rarity.
  // The chosen items are used first (once per potion); when one runs short, other items of the same rarity fill in, so the batch size stays.
  // slots: the rarities (RECIPES[p].rare); chosen: an item id per slot; pool: { rarity: { id: count } }. Returns { id: units used } or null.
  function rarePlan(slots, chosen, pool, b) {
    const use = {};
    for (const r of new Set(slots)) {
      const items = pool[r] || {}, mine = chosen.filter((c, k) => slots[k] === r && c);
      const order = mine.concat(Object.keys(items).filter(id => !mine.includes(id)).sort((x, y) => items[y] - items[x]));
      let left = slots.filter(x => x === r).length * b;   // no item more than once in a potion: at most b units of each
      for (const id of order) { if (!left) break; const n = Math.min(items[id] || 0, b, left); if (n > 0) { use[id] = n; left -= n; } }
      if (left) return null;
    }
    return use;
  }
  // the most potions the rare items and the herbs allow
  function maxBatch(slots, pool, herbUnits) {
    let b = 1; while (b < CFG.BATCH_MAX && rarePlan(slots, [], pool, b + 1) && herbUnits >= CFG.MIN_HERB_LINE * (b + 1)) b++;
    return b;
  }
  // the student's amounts → which lines are right
  const check = (lines, amounts) => lines.map((ln, i) => !!amounts[i] && ME.eq(amounts[i], ln.amount));

  const BR = { CFG, RECIPES, FROM_RANK, HERB_RANGE, potionOpen, rareFor, herbLinesFor, liquidOk, LIQUIDS, easy, lossChance, dropUnits, levelFor, herbLine, ratioLine, liquidLine, scaleLine, jugScale, recipe, rarePlan, maxBatch, check };
  if (typeof module === 'object' && module.exports) module.exports = BR; else root.BR = BR;
})(typeof globalThis !== 'undefined' ? globalThis : this);
