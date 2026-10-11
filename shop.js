/* Math Wizard: shop rules (spec 04 §4, step 8). No screen code: the game (index.html) draws the counter, the coin tray and the answer buttons; the tests check the rules.
   Needs math.js (ME), combat.js (CB, which levels can make a number) and brew.js (BR, the easy step).

   Buying = one checkout task at the easy step (spec 04 §1). The task uses the real price, the real coin balance and the real daily sale:
   - the coin tray ("pay the exact price", "put the rest") at the counting levels;
   - answer buttons for the rest: change, what is left, several potions, paying in equal bags, sales with fractions and percentages, prices in silver with decimals.
   The student pays the real price (with today's sale). Each answer is one scored answer (weight ½ up, 1 down); after 2 wrong tries a worked example and a new task of the same kind.
   Money (spec 04 §4.4): copper 1, silver 10, gold 100. The balance is one number in copper.
*/
(function (root) {
  'use strict';
  const ME = root.ME || require('./math.js'), CB = root.CB || require('./combat.js'), BR = root.BR || require('./brew.js');

  const CFG = {
    TRIES_BEFORE_HELP: 2,                                      // wrong tries before the worked example (spec 04 §4.1)
    SALE_ITEMS: 3,                                             // items on sale each day (spec 04 §4.3)
    QTY_FROM: 11, QTY_MAX: 5,                                  // buying several potions at once: from the multiplication levels (easy step), up to 5
    MONEY: { c: 1, s: 10, g: 100 },
    MONEY_SHOW: [[1, ['c']], [5, ['c', 's']], [8, ['c', 's', 'g']]],   // [from the easy step, the coins in the tray] (spec 04 §6)
    PAY_MAX: [[1, 5], [2, 10], [5, 20], [7, 100], [17, 1000], [21, 10000]],   // the biggest amount the tray asks for, by the easy step
    OFF: [5, 10],                                              // a sale before the fraction levels: 5 or 10 copper off
    FEE: 0.1,                                                  // a wrong answer may cost a fee: this part of the price, with the brewing loss chance (owner, step 8)
    HELP_FROM: 8                                               // the coin tray as help for answer-button tasks (counts less toward the math level)
  };
  const easy = BR.easy;
  const pick = (a, rnd) => a[Math.floor(rnd() * a.length)];
  const coinsAt = L => CFG.MONEY_SHOW.reduce((r, x) => L >= x[0] ? x[1] : r, ['c']);
  const payMax = L => CFG.PAY_MAX.reduce((r, x) => L >= x[0] ? x[1] : r, 5);
  const split = n => ({ g: Math.floor(n / 100), s: Math.floor(n % 100 / 10), c: n % 10 });   // 237 → 2 gold, 3 silver, 7 copper
  const can = (v, L) => Number.isInteger(v) && v > 0 && CB.canMake(ME.I(v), L);
  const silver = n => ME.V(n, 10, 'dec');                     // copper → silver as a decimal (15 → 1.5)
  const decT = v => ME.decText(v);

  /* ----- the daily sale (spec 04 §4.3): its form follows the level; the price is real ----- */
  // { kind: 'off' (x copper off) | 'frac' (pay n/d of the price) | 'offfrac' (n/d off) | 'two' (n/d of the price, then n2/d2 of that) | 'pct' (p% off), pay: the sale price } or null
  function saleForm(price, L, rnd) {
    const opts = [];
    if (L < 22) for (const x of CFG.OFF) { if (x * 3 <= price) opts.push({ kind: 'off', x, pay: price - x }); }
    else if (L < 25) { if (price % 2 === 0) opts.push({ kind: 'frac', n: 1, d: 2, pay: price / 2 }); for (const d of [4, 5, 10]) if (price % d === 0) opts.push({ kind: 'offfrac', n: 1, d, pay: price - price / d }); }
    else if (L < 31 || L === 33) { for (const [n, d] of [[1, 3], [1, 4], [1, 5], [2, 5], [1, 2]]) if (price % d === 0) opts.push({ kind: 'offfrac', n, d, pay: price - price * n / d }); for (const [n, d] of [[3, 4], [2, 3]]) if (price % d === 0) opts.push({ kind: 'frac', n, d, pay: price * n / d }); }
    else if (L < 34) { for (const [n, d] of [[2, 3], [3, 4], [4, 5]]) for (const [n2, d2] of [[1, 2], [3, 4]]) { const v = price * n * n2 / (d * d2); if (Number.isInteger(v) && v > 0) opts.push({ kind: 'two', n, d, n2, d2, pay: v }); } }
    else for (const p of [10, 20, 25, 50]) { const v = price * (100 - p) / 100; if (Number.isInteger(v)) opts.push({ kind: 'pct', p, pay: v }); }
    return opts.length ? pick(opts, rnd) : null;
  }
  // "10 off": the student works out the sale price whenever the level can (owner, step 8); only below that is the new price shown
  const offByStudent = (s, L) => !!s && s.kind === 'off' && L >= 3 && (s.pay <= payMax(L) || can(s.pay, L));
  // today's sale: SALE_ITEMS of the candidate ids (seeded by the day, so it stays the same all day)
  function saleIds(ids, rnd) { const a = ids.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, CFG.SALE_ITEMS); }

  /* ----- the checkout tasks ----- */
  // A task: { kind, input: 'tray' | 'choice', v (the words' numbers), p: { lv, e, a, key, form, ops } (the math, for scoring and the worked example),
  //           alts (likely wrong answers), placed (tray: copper already on the counter), coins (tray: the coin kinds) }
  const P_ = (L, e, a, key, form, ops) => ({ lv: L, e, a, key: 'shop ' + key, form, ops: ops || {} });
  // o: { L (the easy step), price (one item), qty, unit (one item's price after the sale), pay (the real total), sale (the sale form or null), bal (coins), rnd }
  const T = {
    pay(o, L) { if (o.pay > payMax(L) || (L === 7 && o.pay % 10)) return null;
      return { kind: 'pay', input: 'tray', v: { pay: o.pay }, p: P_(L, String(o.pay), ME.I(o.pay), 'pay ' + o.pay, 'pay', { a: o.pay }), placed: 0 }; },
    rest(o, L) {   // "It costs 15. 9 are already on the counter. Put the rest."
      const rs = []; for (let r = 1; r < o.pay && r <= payMax(L); r++) if (can(r, L)) rs.push(r);
      if (!rs.length) return null; const mid = rs.filter(r => r >= o.pay * .25 && r <= o.pay * .75), big = rs.filter(r => r >= rs[rs.length - 1] / 2), r = pick(mid.length ? mid : big, o.rnd), placed = o.pay - r;   // a real part is already on the counter
      return { kind: 'rest', input: 'tray', v: { pay: o.pay, placed }, p: P_(L, `${placed} + □ = ${o.pay}`, ME.I(r), `rest ${o.pay}-${placed}`, 'a+□=c', { a: o.pay, b: placed, op: '-' }), placed }; },
    silver(o, L) {   // "40 copper: how many silver coins?"
      if (o.pay % 10 || o.pay > 100) return null;
      return { kind: 'silver', input: 'choice', v: { pay: o.pay }, p: P_(L, `${o.pay} ÷ 10`, ME.I(o.pay / 10), 'silver ' + o.pay, 'a÷b', { a: o.pay, b: 10, op: '÷' }) }; },
    change(o, L) {   // "It costs 37. You pay with 50. How much change?"
      const N = [50, 100, 200, 500, 1000].find(n => n > o.pay); if (!N || !can(N - o.pay, L)) return null;
      return { kind: 'change', input: 'choice', v: { pay: o.pay, n: N }, p: P_(L, `${N} − ${o.pay}`, ME.I(N - o.pay), `change ${N}-${o.pay}`, 'a-b', { a: N, b: o.pay, op: '-' }), alts: [N + o.pay, o.pay] }; },
    left(o, L) {   // "You have 347 coins. After paying 80, how many are left?" (the real balance)
      const x = o.bal - o.pay; if (L < 8 || x < 1 || o.bal > payMax(L) || o.bal * 10 < payMax(L) || !can(x, L)) return null;   // a balance that fits the level's numbers
      return { kind: 'left', input: 'choice', v: { pay: o.pay, bal: o.bal }, p: P_(L, `${o.bal} − ${o.pay}`, ME.I(x), `left ${o.bal}-${o.pay}`, 'a-b', { a: o.bal, b: o.pay, op: '-' }), alts: [o.bal + o.pay] }; },
    coins(o, L) {   // "It costs 2 gold, 2 silver and 0 copper. How many copper is that?"
      const s = split(o.pay); if (o.pay < 15 || (L < 18 && s.g)) return null;
      const e = (s.g ? `${s.g} × 100 + ` : '') + `${s.s} × 10 + ${s.c}`;
      return { kind: 'coins', input: 'choice', v: s, p: P_(L, e, ME.I(o.pay), 'coins ' + o.pay, 'coins', {}), alts: [s.g * 100 + s.c * 10 + s.s, s.g + s.s + s.c, s.g * 10 + s.s * 10 + s.c].filter(x => x !== o.pay) }; },
    several(o, L) {   // "3 heart potions at 15 each"
      if (o.qty < 2 || !can(o.qty * o.unit, L)) return null;
      return { kind: 'several', input: 'choice', v: { qty: o.qty, unit: o.unit }, p: P_(L, `${o.qty} × ${o.unit}`, ME.I(o.qty * o.unit), `several ${o.qty}x${o.unit}`, 'a×b', { a: o.qty, b: o.unit, op: '×' }) }; },
    afford(o, L) {   // "Potions cost 8 each. You put 40 aside. How many potions is that?"
      if (o.qty < 2 || !can(o.qty, L)) return null;
      return { kind: 'afford', input: 'choice', v: { pay: o.pay, unit: o.unit }, p: P_(L, `${o.pay} ÷ ${o.unit}`, ME.I(o.qty), `afford ${o.pay}/${o.unit}`, 'a÷b', { a: o.pay, b: o.unit, op: '÷' }) }; },
    split(o, L) {   // "Pay 40 in 4 equal bags. How many coins in each bag?"
      const ks = []; for (let k = 2; k <= 9; k++) if (o.pay % k === 0 && can(o.pay / k, L) && o.pay / k > 1) ks.push(k);
      if (!ks.length) return null; const k = pick(ks, o.rnd);
      return { kind: 'split', input: 'choice', v: { pay: o.pay, k }, p: P_(L, `${o.pay} ÷ ${k}`, ME.I(o.pay / k), `split ${o.pay}/${k}`, 'a÷b', { a: o.pay, b: k, op: '÷' }) }; },
    order(o, L) {   // "3 potions at 15, with a 5-coin coupon" (the coupon is real)
      if (o.qty < 2 || o.qty * o.unit <= 20) return null; const c = o.qty * o.unit > 40 ? 10 : 5, x = o.qty * o.unit - c;
      return { kind: 'order', input: 'choice', v: { qty: o.qty, unit: o.unit, c }, p: P_(L, `${o.qty} × ${o.unit} − ${c}`, ME.I(x), `order ${o.qty}x${o.unit}-${c}`, 'a×b−c', { a: o.qty * o.unit, b: x, op: 'order' }), alts: [o.qty * (o.unit - c), o.qty * o.unit], coupon: c }; },
    saleOff(o, L) {   // "Sale today! The plant costs 15, 5 off." (subtraction; on the tray at the counting levels)
      if (!offByStudent(o.sale, L)) return null; const s = o.sale, tray = L <= 7;
      return { kind: 'saleoff', input: tray ? 'tray' : 'choice', v: { price: o.price, s }, p: P_(L, `${o.price} − ${s.x}`, ME.I(s.pay), `saleoff ${o.price}-${s.x}`, 'a-b', { a: o.price, b: s.x, op: '-' }), placed: 0, alts: [o.price + s.x, o.price] }; },
    sale(o, L) {   // the sale with fractions or percentages: the student works out the sale price (per item)
      const s = o.sale; if (!s || s.kind === 'off') return null; const pr = o.price;
      if (s.kind === 'frac') return { kind: 'sale', input: 'choice', v: { price: pr, s }, p: P_(L, `{of:[${s.n}/${s.d}]|${pr}}`, ME.I(s.pay), `sale ${s.n}/${s.d} of ${pr}`, 'frac of', { a: pr, b: s.d, op: '÷' }), alts: [pr - s.pay] };
      if (s.kind === 'offfrac') return { kind: 'sale', input: 'choice', v: { price: pr, s }, p: P_(L, `${pr} − {of:[${s.n}/${s.d}]|${pr}}`, ME.I(s.pay), `sale ${s.n}/${s.d} off ${pr}`, 'off', { a: pr, b: pr - s.pay, op: '-' }), alts: [pr - s.pay, pr + pr - s.pay] };
      if (s.kind === 'two') return { kind: 'sale', input: 'choice', v: { price: pr, s }, p: P_(L, `${pr} × [${s.n}/${s.d}] × [${s.n2}/${s.d2}]`, ME.I(s.pay), `sale ${s.n}/${s.d} ${s.n2}/${s.d2} ${pr}`, 'two', {}), alts: [pr * s.n / s.d, pr * s.n2 / s.d2] };
      if (s.kind === 'pct') { const off = pr - s.pay;
        if (L >= 36 || o.multi) { const N = [50, 100, 200, 500].find(n => n > s.pay); if (N) return { kind: 'salechange', input: 'choice', v: { price: pr, s, n: N }, p: P_(L, `${N} − (${pr} − {of:${s.p}%|${pr}})`, ME.I(N - s.pay), `salechange ${s.p} ${pr} ${N}`, 'multi', {}), alts: [N - pr, N - off, s.pay] }; }
        return { kind: 'sale', input: 'choice', v: { price: pr, s }, p: P_(L, `${pr} − {of:${s.p}%|${pr}}`, ME.I(s.pay), `sale ${s.p}% off ${pr}`, 'p% off', { a: pr, b: s.p, op: '%' }), alts: [off, pr + off] }; }
      return null; },
    decLeft(o, L) {   // "You have 34.7 silver. The potion costs 1.5 silver. How much is left?"
      const x = o.bal - o.pay; if (x < 1 || o.pay % 10 === 0) return null;
      return { kind: 'decleft', input: 'choice', v: { bal: decT(silver(o.bal)), pay: decT(silver(o.pay)) }, p: P_(L, `${decT(silver(o.bal))} − ${decT(silver(o.pay))}`, silver(x), `decleft ${o.bal}-${o.pay}`, 'a−b', { fa: silver(o.bal), fb: silver(o.pay), op: '-' }) }; },
    decCoins(o, L) {   // "It costs 4.5 silver. How many copper is that?"
      if (o.pay % 10 === 0) return null;
      return { kind: 'deccoins', input: 'choice', v: { pay: decT(silver(o.pay)) }, p: P_(L, `${decT(silver(o.pay))} × 10`, ME.I(o.pay), `deccoins ${o.pay}`, 'a×p', { fa: silver(o.pay), fb: ME.I(10), op: '×' }), alts: [o.pay / 10, o.pay * 10].filter(Number.isInteger) }; },
    decSeveral(o, L) {   // "1.5 silver each, 3 potions"
      if (o.qty < 2 || o.unit % 10 === 0) return null;
      return { kind: 'decseveral', input: 'choice', v: { qty: o.qty, unit: decT(silver(o.unit)) }, p: P_(L, `${decT(silver(o.unit))} × ${o.qty}`, silver(o.qty * o.unit), `decseveral ${o.qty}x${o.unit}`, 'a×b', { fa: silver(o.unit), fb: ME.I(o.qty), op: '×' }) }; }
  };
  // which tasks each easy step tries, in order (spec 04 §4.2); a level whose tasks do not fit this purchase uses the level below (review)
  const BANDS = [[1, ['pay', 'rest']], [3, ['rest', 'pay']], [5, ['pay', 'rest']], [7, ['silver', 'pay']], [8, ['change', 'left', 'rest']], [11, ['several', 'coins']], [13, ['several', 'coins']],
    [15, ['afford', 'split']], [17, ['change', 'left']], [18, ['coins']], [19, ['several', 'coins']], [20, ['afford', 'split']], [21, ['left', 'change']], [22, ['sale']], [24, ['order']], [25, ['sale']],
    [28, ['decLeft', 'decCoins']], [29, ['decCoins']], [30, ['several', 'split']], [31, ['sale']], [33, ['decSeveral', 'sale']], [34, ['sale']], [36, ['sale']]];
  const bandOf = L => BANDS.reduce((r, x) => L >= x[0] ? x[1] : r, BANDS[0][1]);
  // o: { mlvl, price, qty, sale, bal, rnd, t (a task to repeat after the worked example) } → a task (with .L, the level it came from)
  function task(o) {
    const rnd = o.rnd || Math.random, L0 = easy(o.mlvl), qty = Math.max(1, o.qty || 1), unit = o.sale ? o.sale.pay : o.price;
    const c = { price: o.price, qty, unit, pay: qty * unit, sale: o.sale, bal: Math.floor(o.bal || 0), rnd };
    for (let L = L0; L >= 1; L--) {
      let names = bandOf(L).slice(); if (L === L0 && L >= 3 && L <= 4 && rnd() < .5) names.reverse(); if (c.sale && c.sale.kind === 'off' && (c.qty === 1 || L > 7)) names.unshift('saleOff');
      if (o.t && T[o.t]) names = [o.t].concat(names.filter(n => n !== o.t));   // after a worked example: a new task of the same kind
      for (const n of names) { const k = T[n](c, L); if (k) return Object.assign(k, { t: n, L, coins: coinsAt(L), pay: c.pay - (k.coupon || 0) }); }
    }
    const k = T.rest(c, 1) || { kind: 'pay', input: 'tray', v: { pay: c.pay }, p: P_(1, String(c.pay), ME.I(c.pay), 'pay ' + c.pay, 'pay', { a: c.pay }), placed: 0 };
    return Object.assign(k, { L: 1, coins: coinsAt(L0), pay: c.pay });
  }
  // the answers to choose from: the right one, the task's likely mistakes, then the engine's near misses
  function choices(k, n = 4) {
    const out = [k.p.a], key = v => v.n + '/' + v.d;
    for (const x of (k.alts || []).filter(x => typeof x !== 'number' || Number.isInteger(x) || k.p.a.k === 'dec')) { const v = typeof x === 'number' ? (k.p.a.k === 'dec' ? silver(x * 10) : ME.I(x)) : x; if (Number.isFinite(ME.num(v)) && ME.num(v) > 0 && !out.some(w => key(w) === key(v)) && out.length < n) out.push(v); }
    for (const v of ME.distractors(k.p, n + 2)) if (out.length < n && !out.some(w => key(w) === key(v))) out.push(v);
    return out;
  }
  // tray: is the amount the student put on the counter right? (placed coins are not counted)
  const checkTray = (k, added) => added === ME.num(k.p.a);

  // the coin tray can help with a task whose answer is a whole number of coins
  const canHelp = k => k.input === 'choice' && k.L >= CFG.HELP_FROM && ME.isWhole(k.p.a) && k.p.a.k !== 'dec' && ME.num(k.p.a) <= 2000;
  const fee = k => Math.max(1, Math.round(k.pay * CFG.FEE));
  const CK = { CFG, easy, coinsAt, payMax, split, saleForm, saleIds, offByStudent, task, choices, checkTray, canHelp, fee, BANDS };
  if (typeof module === 'object' && module.exports) module.exports = CK; else root.CK = CK;
})(typeof globalThis !== 'undefined' ? globalThis : this);
