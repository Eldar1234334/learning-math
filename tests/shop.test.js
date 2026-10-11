/* Math Wizard: tests for the shop rules (shop.js).
   Run in a browser: open tests/index.html. Run with Node: node tests/shop.test.js */
(function () {
  'use strict';
  const isNode = typeof module === 'object' && typeof require === 'function';
  if (isNode) { globalThis.ME = require('../math.js'); globalThis.SB = require('../spells.js'); globalThis.CB = require('../combat.js'); globalThis.BR = require('../brew.js'); }
  const ME = globalThis.ME, CK = isNode ? require('../shop.js') : globalThis.CK;
  const results = [];
  const test = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, msg: e.message }); } };
  const assert = (c, msg) => { if (!c) throw new Error(msg || 'assertion failed'); };
  let seed = 777; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  ME.setRandom(rnd);
  const PRICES = [10, 15, 20, 25, 30, 35, 40, 45, 55, 60, 70, 80, 120, 220];

  test('money: copper, silver, gold (spec 04 §4.4) and the coins in the tray by level', () => {
    const s = CK.split(237); assert(s.g === 2 && s.s === 3 && s.c === 7, 'split 237');
    assert(CK.coinsAt(1).join() === 'c' && CK.coinsAt(5).join() === 'c,s' && CK.coinsAt(8).join() === 'c,s,g', 'coins by level');
  });
  test('every level, every price: a task whose answer is right, and the real amount to pay', () => {
    for (let m = 1; m <= 36; m++) for (const price of PRICES) for (const qty of [1, 3]) for (const bal of [40, 350, 2600]) {
      const L = CK.easy(m), sale = rnd() < .5 ? CK.saleForm(price, L, rnd) : null, k = CK.task({ mlvl: m, price, qty, sale, bal, rnd });
      const unit = sale ? sale.pay : price;
      assert(k && k.p && k.p.a && ME.num(k.p.a) > 0, 'a task at ' + m);
      assert(k.L <= L, 'not above the easy step: ' + k.L + ' > ' + L);
      assert(k.pay === qty * unit - (k.coupon || 0) && k.pay > 0, 'the real price ' + k.pay);
      if (k.input === 'tray') { assert(ME.isWhole(k.p.a) && ME.num(k.p.a) + k.placed === qty * unit, 'the tray adds up to the price: ' + k.kind); }
      else { const c = CK.choices(k); assert(c.length === 4 && ME.eq(c[0], k.p.a), 'four answers, one right: ' + k.kind + ' ' + c.map(ME.fmt));
        assert(new Set(c.map(v => v.n + '/' + v.d)).size === 4, 'different answers ' + c.map(ME.fmt)); }
    }
  });
  test('each band uses its own tasks when they fit (spec 04 §4.2)', () => {
    const at = (m, o) => CK.task(Object.assign({ mlvl: m, price: 45, qty: 1, bal: 80, rnd }, o));
    assert(at(2, { price: 10 }).input === 'tray', 'counting levels: the tray');
    assert(at(8, { price: 40 }).kind === 'silver', 'level 7: silver coins');
    assert(['change', 'left'].includes(at(10, { price: 37 }).kind), 'levels 8–10: change');
    assert(at(13, { price: 15, qty: 3 }).kind === 'several', 'buying several');
    assert(at(16, { price: 15, qty: 3 }).kind === 'afford', 'how many can you buy');
    const sale = CK.saleForm(40, 22, () => 0); assert(sale && sale.kind === 'frac' && sale.pay === 20, 'half price');
    assert(at(23, { price: 40, sale }).kind === 'sale', 'fraction sale');
    assert(at(29, { price: 45, bal: 830 }).kind === 'decleft', 'prices in silver with decimals');
    const pct = CK.saleForm(80, 34, () => 0); assert(pct.kind === 'pct' && at(35, { price: 80, sale: pct }).kind === 'sale', 'percent sale');
    assert(at(37, { price: 80, sale: pct }).kind === 'salechange', 'multi-step');
  });
  test('sales are whole copper and cheaper (spec 04 §4.3)', () => {
    for (let L = 1; L <= 35; L++) for (const price of PRICES) { const s = CK.saleForm(price, L, rnd); if (s) assert(Number.isInteger(s.pay) && s.pay > 0 && s.pay < price, 'sale ' + JSON.stringify(s)); }
    assert(CK.saleIds(['a', 'b', 'c', 'd', 'e'], rnd).length === CK.CFG.SALE_ITEMS, 'three items');
  });
  test('"10 off": the student works out the sale price when the level can (owner, step 8)', () => {
    const off = { kind: 'off', x: 10, pay: 30 };
    assert(!CK.offByStudent(off, 2), 'addition levels: the new price is shown');
    assert(CK.offByStudent(off, 7) && CK.offByStudent(off, 12), 'subtraction levels: the student works it out');
    const k = CK.task({ mlvl: 8, price: 40, qty: 1, sale: off, bal: 90, rnd }); assert(k.kind === 'saleoff' && k.input === 'tray' && ME.num(k.p.a) === 30 && k.pay === 30, 'on the tray ' + k.kind);
    const k2 = CK.task({ mlvl: 12, price: 40, qty: 1, sale: off, bal: 90, rnd }); assert(k2.kind === 'saleoff' && k2.input === 'choice', 'answer buttons ' + k2.kind);
  });
  test('the coin tray as help and the fee for a wrong answer', () => {
    const k = CK.task({ mlvl: 10, price: 37, bal: 80, rnd }); assert(CK.canHelp(k), 'help for ' + k.kind);
    assert(!CK.canHelp(CK.task({ mlvl: 4, price: 15, bal: 80, rnd })), 'no help when the tray is the task');
    assert(CK.fee({ pay: 70 }) === 7 && CK.fee({ pay: 4 }) === 1, 'a tenth of the price, at least 1');
    assert(ME.WEIGHT.craftHelp.u < ME.WEIGHT.craft.u, 'help counts less toward the math level');
  });
  test('after a worked example: a new task of the same kind', () => {
    const k = CK.task({ mlvl: 10, price: 37, bal: 80, rnd }), k2 = CK.task({ mlvl: 10, price: 37, bal: 80, rnd, t: k.t });
    assert(k2.t === k.t, k.t + ' → ' + k2.t);
  });

  const failed = results.filter(r => !r.ok);
  if (isNode) { for (const r of results) console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n      ' + r.msg)); console.log(`\n${results.length - failed.length} of ${results.length} shop tests passed`); if (failed.length) process.exitCode = 1; }
  else globalThis.SHOP_TEST_RESULTS = results;
})();
