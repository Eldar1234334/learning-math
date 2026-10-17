/* Math Wizard: tests for the Home room rules (home.js, spec 13).
   Run in a browser: open tests/index.html. Run with Node: node tests/home.test.js */
(function () {
  'use strict';
  const isNode = typeof module === 'object' && typeof require === 'function';
  const HM = isNode ? require('../home.js') : globalThis.HM;
  const results = [];
  const test = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, msg: e.message }); } };
  const assert = (c, msg) => { if (!c) throw new Error(msg || 'assertion failed'); };

  test('18 kinds, about 30 places, 3 items of each kind at tier 0 (spec 13 §3, §4)', () => {
    assert(HM.KINDS.length === 18, 'kinds ' + HM.KINDS.length);
    assert(HM.SLOTS.length >= 25 && HM.SLOTS.length <= 32, 'places ' + HM.SLOTS.length);
    for (const k of HM.KINDS) { const t0 = Object.values(HM.ITEMS).filter(i => i.kind === k.id && i.tier === 0 && i.buy); assert(t0.length === 3, k.id + ' has ' + t0.length + ' tier 0 items'); }
    for (const s of HM.SLOTS) assert(HM.KIND[s.kind], 'the place ' + s.id + ' has a kind');
    assert(new Set(HM.SLOTS.map(s => s.id)).size === HM.SLOTS.length, 'place ids are unique');
    for (const k of HM.KINDS) assert(HM.SLOTS.some(s => s.kind === k.id), 'every kind has a place: ' + k.id);
  });
  test('every item has an English and a Hebrew name, a kind and a price in its tier range', () => {
    for (const it of Object.values(HM.ITEMS)) {
      assert(it.en && it.he && (HM.KIND[it.kind] || it.kind === 'statue'), it.id + ' names and kind');
      if (it.buy) { const [lo, hi] = HM.PRICE[it.tier]; assert(it.price >= lo && it.price <= hi + (HM.KIND[it.kind].pair ? 4 : 0), `${it.id} price ${it.price}`); }
    }
  });
  test('the starting room: the plain sofa, table, desk, bed, rug and window in place; everything else empty (spec 13 §2.1)', () => {
    const h = HM.start(HM.fresh());
    for (const k of ['sofa', 'table', 'desk', 'bed', 'rug', 'window']) assert(h.slots[k] === k + '_0_0' && HM.count(h, k + '_0_0') >= 1, k);
    assert(Object.keys(h.slots).length === 6, 'only the six plain pieces are placed: ' + Object.keys(h.slots).join());
  });
  test('prices are locked by rank and by math level (spec 13 §4.3), small items can be bought again, others once', () => {
    const h = HM.start(HM.fresh()), cheap = HM.ITEMS.lamp_0_1, rich = { id: 'x', kind: 'sofa', tier: 3, price: 200, buy: true, en: 'x', he: 'x' };
    assert(HM.lock(cheap, 0, 1, h) === null, 'a tier 0 lamp at math level 1');
    assert(HM.lock(rich, 2, 30, h).why === 'rank' && HM.lock(rich, 3, 10, h).why === 'math' && HM.lock(rich, 3, 17, h) === null, 'rank then math level');
    assert([[60, 1], [61, 8], [150, 8], [151, 17], [350, 17], [351, 21], [1500, 21]].every(([p, l]) => HM.minMath(p) === l), 'math level by price');
    HM.give(h, 'lamp_0_1'); assert(HM.lock(HM.ITEMS.lamp_0_1, 0, 1, h) === null, 'a lamp can be bought more than once');
    HM.give(h, 'sofa_0_1'); assert(HM.lock(HM.ITEMS.sofa_0_1, 0, 1, h).why === 'have', 'a sofa only once');
    assert(HM.lock(HM.ITEMS.a_lamp, 5, 36, h).why === 'sold', 'a gift is not for sale');
  });
  test('placing: only items of the slot\'s kind, swapping is free, an item stands in one place at a time, empty clears the place', () => {
    const h = HM.start(HM.fresh()); HM.give(h, 'sofa_0_1'); HM.give(h, 'picture_0_0'); HM.give(h, 'picture_0_1');
    assert(HM.place(h, 'sofa', 'sofa_0_1') && h.slots.sofa === 'sofa_0_1', 'swap the sofa');
    assert(!HM.place(h, 'sofa', 'picture_0_0'), 'a picture does not fit the sofa place');
    assert(HM.place(h, 'pic1', 'picture_0_0') && HM.place(h, 'pic2', 'picture_0_0') && h.slots.pic1 !== 'picture_0_0' && h.slots.pic2 === 'picture_0_0', 'one copy is in one place: it moves');
    HM.give(h, 'picture_0_0'); assert(HM.place(h, 'pic1', 'picture_0_0') && h.slots.pic1 === 'picture_0_0' && h.slots.pic2 === 'picture_0_0', 'two copies fill two places');
    assert(HM.place(h, 'pic1', null) && !h.slots.pic1, 'empty a place');
    assert(!HM.place(h, 'sofa', 'sofa_0_2'), 'an item the student does not own cannot be placed');
  });
  test('a pair of chairs is bought together and fills both dining chairs (spec 13 §5.4)', () => {
    const h = HM.start(HM.fresh()); HM.give(h, 'chair_0_0'); assert(HM.count(h, 'chair_0_0') === 2, 'a pair = 2');
    assert(HM.place(h, 'chair1', 'chair_0_0') && h.slots.chair1 === 'chair_0_0' && h.slots.chair2 === 'chair_0_0', 'both places');
    assert(HM.place(h, 'chair1', null) && !h.slots.chair1, 'clear one'); HM.place(h, 'chair2', null);
    assert(HM.place(h, 'deskchair', 'chair_0_0') && h.slots.deskchair === 'chair_0_0', 'a chair of the pair at the desk');
  });
  test('"new!" marks an item until it is placed', () => {
    const h = HM.start(HM.fresh()); HM.give(h, 'plant_0_1'); assert(h.new.includes('plant_0_1'), 'new'); HM.place(h, 'plant1', 'plant_0_1'); assert(!h.new.includes('plant_0_1'), 'placed: no longer new');
  });
  test('the Academy gifts are free items of their kind (spec 13 §7)', () => {
    const h = HM.start(HM.fresh()); for (const id of ['a_lamp', 'a_ball', 'a_rug', 'a_wheel']) assert(HM.give(h, id), id);
    assert(HM.place(h, 'tlamp', 'a_lamp') && HM.place(h, 'trinket1', 'a_ball') && HM.place(h, 'rug', 'a_rug') && HM.place(h, 'pic3', 'a_wheel'), 'each goes in a place of its kind');
    assert(HM.ITEMS.a_statue.kind === 'statue' && HM.SPECIAL.statue.test === 5, 'the statue stands on the statue stand, from test 5');
  });
  test('an older hero keeps everything: old items become collection items of the nearest kind and are placed (the owner chose to keep them)', () => {
    const p = { own: { decor: ['d_plant', 'd_cat', 'd_lamp', 'f_couch', 'f_bed', 'r_lamp', 'r_ball', 'r_rug', 'c_cert1', 'd_cactus'] } };
    const h = HM.migrate(p); assert(h === p.home, 'saved on the hero');
    for (const id of ['lg_d_plant', 'lg_d_cat', 'lg_d_lamp', 'lg_f_couch', 'lg_f_bed', 'a_lamp', 'a_ball', 'a_rug', 'lg_d_cactus']) assert(HM.count(h, id) > 0, 'owned ' + id);
    assert(!Object.keys(h.owned).some(id => id.includes('cert')), 'certificates are not items (they hang on the wall by themselves)');
    assert(h.slots.sofa === 'lg_f_couch' || Object.values(h.slots).includes('lg_f_couch'), 'the couch stands in a sofa place');
    assert(Object.values(h.slots).includes('lg_d_plant') && Object.values(h.slots).includes('lg_d_cactus'), 'both plants are placed in the two plant places');
    assert(HM.count(HM.migrate({ own: { decor: [] } }), 'sofa_0_0') === 1, 'a hero with nothing gets the plain starting room');
    assert(HM.migrate(p) === h, 'migrating twice changes nothing');
  });
  test('wall and floor colours: 4 at tier 0, then 2 more of each at each of tiers 1 to 5 (a proposal), all different', () => {
    for (const list of [HM.WALLS, HM.FLOORS]) {
      for (let t = 0; t <= 5; t++) assert(list.filter(c => c.tier === t).length === (t === 0 ? 4 : 2), 'tier ' + t);
      assert(new Set(list.map(c => c.id)).size === list.length, 'unique ids');
    }
    assert(HM.wallOf('nope').id === 'w0' && HM.floorOf('nope').id === 'f0', 'unknown → the first colour');
  });

  const failed = results.filter(r => !r.ok);
  if (isNode) {
    for (const r of results) console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n      ' + r.msg));
    console.log(`\n${results.length - failed.length} of ${results.length} home tests passed`); if (failed.length) process.exitCode = 1;
  } else globalThis.HOME_TEST_RESULTS = results;
})();
