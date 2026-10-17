/* Math Wizard: tests for the spell book (spells.js) and the wizard level.
   Run in a browser: open tests/index.html. Run with Node: node tests/spells.test.js */
(function () {
  'use strict';
  const isNode = typeof module === 'object' && typeof require === 'function';
  const ME = isNode ? require('../math.js') : globalThis.ME;
  if (isNode) globalThis.ME = ME;
  const SB = isNode ? require('../spells.js') : globalThis.SB;
  const results = [];
  const test = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, msg: e.message }); } };
  const assert = (c, msg) => { if (!c) throw new Error(msg || 'assertion failed'); };
  const ids = list => list.map(s => s.id).sort((a, b) => ME.num(ME.parse(a)) - ME.num(ME.parse(b)));
  const has = (list, id) => list.some(s => s.id === id);

  test('every spell has its own number (no two spells with the same value, spec 02 §1)', () => {
    for (let i = 0; i < SB.SPELLS.length; i++) for (let j = i + 1; j < SB.SPELLS.length; j++) assert(!ME.eq(SB.SPELLS[i].v, SB.SPELLS[j].v), `${SB.SPELLS[i].id} and ${SB.SPELLS[j].id} have the same value`);
  });
  test('the catalog: 9 base, 9 strong, their tiers, and 17 special spells (the rare Meteor Storm is the 17th)', () => {
    const by = t => SB.SPELLS.filter(s => s.tier === t).length;
    assert(by('base') === 9 && by('strong') === 9 && by('enhanced') === 9 && by('greater') === 9 && by('legendary') === 9 && by('enhStrong') === 9 && by('family') === 17, JSON.stringify({ base: by('base'), strong: by('strong'), fam: by('family') }));
    assert(SB.BY_ID['3'].nm[0] === 'Fire Bolt' && SB.BY_ID['30'].nm[0] === 'Enhanced Fire Bolt' && SB.BY_ID['300'].nm[0] === 'Greater Fire Bolt' && SB.BY_ID['3000'].nm[0] === 'Legendary Fire Bolt', '×10 tiers of Fire Bolt');
    assert(SB.BY_ID['130'].nm[0] === 'Enhanced Fireball', '130 Enhanced Fireball');
    assert(SB.BY_ID['30'].nm[1] === 'חץ אש מוגבר' && SB.BY_ID['20'].nm[1] === 'התזת מים מוגברת', 'Hebrew adjectives agree with the noun');
    assert(SB.BY_ID['1/2'] && SB.BY_ID['1 1/2'] && SB.BY_ID['0.1'] && SB.BY_ID['144'] && SB.BY_ID['360'], 'special spells by number');
    assert(SB.BY_ID['0.1'].v.k === 'dec' && ME.fmt(SB.BY_ID['0.1'].v) === '0.1', '0.1 is shown as a decimal');
  });
  test('tier powers (spec 02 §5): base 2, strong 4, enhanced 6, greater 10, legendary 16; the enhanced area spells 110–180: 8 (owner decision)', () => {
    const p = id => SB.BY_ID[id].power; assert(p('3') === 2 && p('13') === 4 && p('30') === 6 && p('300') === 10 && p('130') === 8 && p('3000') === 16, 'powers');
  });
  test('a new student: the starting spells 2, 3, 4, 5 (spec 02 §6.1)', () => {
    const b = SB.book(1, 1); assert(ids(b.learned).join() === '2,3,4,5', 'learned ' + ids(b.learned)); assert(b.sealed.length === 0, 'nothing sealed at level 1');
  });
  test('math level 2, wizard level 1: 7 learned; 6, 8, 9 sealed (their types open later); 1 waits for level 3', () => {
    const b = SB.book(2, 1);
    for (const id of ['2', '3', '4', '5', '7']) assert(has(b.learned, id), id + ' learned');
    assert(!has(b.learned, '1') && !has(b.sealed, '1') && has(SB.book(3, 1).learned, '1'), 'Light Spark opens at math level 3 (owner decision)');
    for (const id of ['6', '8', '9']) assert(has(b.sealed, id) && !has(b.learned, id), id + ' sealed');
    assert(SB.BY_ID['6'].greq === 3 && SB.BY_ID['8'].greq === 5 && SB.BY_ID['9'].greq === 8, 'defense 3, heal 5, control 8');
  });
  test('the wizard level opens sealed spells', () => {
    assert(has(SB.book(2, 3).learned, '6') && has(SB.book(2, 3).sealed, '8'), 'wizard 3: Wind Shield; Healing Leaf still sealed');
    assert(has(SB.book(2, 5).learned, '8') && has(SB.book(2, 8).learned, '9'), 'wizard 5: Healing Leaf; wizard 8: Shadow Snare');
  });
  test('a math gate that is closed hides the spell (no lock for the math pace, spec 02 §1 rule 5)', () => {
    const b = SB.book(1, 30); for (const id of ['1', '6', '7', '8', '9', '13', '30']) assert(!has(b.learned, id) && !has(b.sealed, id), id + ' should be hidden');
  });
  test('math level 5: the strong spells 11–19; level 7: the enhanced tier ×10', () => {
    const b5 = SB.book(5, 15); for (const id of ['11', '13', '16', '18', '19']) assert(has(b5.learned, id), id); assert(!has(b5.learned, '30'), 'no enhanced at 5');
    const b7 = SB.book(7, 1); for (const id of ['10', '20', '30', '40', '50', '70']) assert(has(b7.learned, id), 'enhanced ' + id); for (const id of ['60', '80', '90']) assert(has(b7.sealed, id), 'sealed ' + id);
  });
  test('math level 17: greater and enhanced strong; 21: legendary', () => {
    const b = SB.book(17, 30); for (const id of ['300', '900', '130', '180']) assert(has(b.learned, id), id); assert(!has(b.learned, '3000'), 'no legendary at 17');
    assert(has(SB.book(21, 30).learned, '3000'), 'legendary at 21');
  });
  test('special families open at their grade', () => {
    assert(has(SB.book(8, 1).sealed, '25') && has(SB.book(8, 10).learned, '25'), 'Owl Familiar: level 8, wizard 10');
    assert(has(SB.book(14, 18).learned, '81') && has(SB.book(14, 15).learned, '64'), 'Phoenix Feather (special) and Chain Lightning (area)');
    assert(has(SB.book(25, 18).learned, '1/2') && has(SB.book(25, 5).learned, '1/4') && has(SB.book(25, 3).learned, '3/4'), 'grade 5 fraction spells');
    assert(has(SB.book(35, 5).learned, '360') && !has(SB.book(34, 30).learned, '360'), 'Full Circle at 35');
  });
  test('learned spells stay learned when the math level goes down', () => {
    const before = SB.book(7, 1).learned.map(s => s.id), after = SB.book(6, 1, before); assert(has(after.learned, '30'), 'Enhanced Fire Bolt stays');
  });
  test('casting matches by value: ½ = 2/4 = 0.5; a sealed or unknown number fizzles (spec 02 §7)', () => {
    const learned = SB.book(25, 30).learned.map(s => s.id);
    assert(SB.cast(ME.F(2, 4), learned).id === '1/2' && SB.cast(ME.D('0.5'), learned).id === '1/2', 'value match');
    assert(SB.cast(ME.I(3), ['2', '4']) === null, 'not learned → fizzle'); assert(SB.cast(ME.I(77), learned) === null, 'no spell → fizzle');
  });
  test('every spell has an effect text in both languages', () => {
    for (const s of SB.SPELLS) for (const L of ['en', 'he']) { const d = SB.describe(s, L); assert(d && !/\{|undefined|NaN/.test(d), `${s.id} ${L}: "${d}"`); }
  });
  test('wizard level (spec 03 §5.1): 40 + 20 × g XP per level, at most 30', () => {
    assert(SB.wizLevel(0) === 1 && SB.xpFor(2) === 60 && SB.xpFor(3) === 140, 'first levels');
    assert(SB.wizLevel(59) === 1 && SB.wizLevel(60) === 2 && SB.wizLevel(139) === 2 && SB.wizLevel(140) === 3, 'edges');
    assert(SB.wizLevel(1e9) === 30, 'maximum 30');
  });
  test('the Academy (spec 08): the ladder runs to 50 on request, and a spell tier opens only with its test', () => {
    assert(SB.wizLevel(1e9, 50) === 50 && SB.wizLevel(SB.xpFor(50), 50) === 50 && SB.wizLevel(SB.xpFor(49), 50) === 49, 'level 50');
    const need = id => SB.testNeed(SB.BY_ID[id]);
    assert(need('2') === 0 && need('11') === 1 && need('20') === 1 && need('200') === 2 && need('110') === 2 && need('3000') === 3 && need('25') === 4, 'tests needed per tier');
    const open = (p) => SB.book(30, 50, [], p).learned.map(s => s.id);
    assert(!open(0).includes('20') && open(1).includes('20') && !open(1).includes('200') && open(2).includes('200') && !open(3).includes('25') && open(4).includes('25'), 'tiers open by test');
    assert(open(undefined).includes('3000'), 'no gate when the passed count is left out (the live game)');
    assert(SB.book(30, 50, ['20'], 0).learned.some(s => s.id === '20'), 'a spell already known stays learned');
  });
  test('the rare spell 625 Meteor Storm (spec 08 §1a): tier 6, math level 19, opened only by test 5, and not in the live game', () => {
    const m = SB.BY_ID['625']; assert(m && m.nm[0] === 'Meteor Storm' && m.power === 20 && m.mreq === 19 && m.fx.k === 'area' && m.fx.storm, 'the spell');
    assert(SB.testNeed(m) === 5, 'opened by test 5');
    assert(!has(SB.book(30, 50).learned, '625') && !has(SB.book(30, 50).sealed, '625'), 'the live game (no Academy) does not show it at all');
    assert(has(SB.book(30, 50, [], 4).sealed, '625') && !has(SB.book(30, 50, [], 4).learned, '625'), 'sealed until test 5');
    assert(has(SB.book(30, 50, [], 5).learned, '625'), 'learned after test 5 when the math level is 19 or more');
    assert(!has(SB.book(18, 50, [], 5).learned, '625') && !has(SB.book(18, 50, [], 5).sealed, '625'), 'hidden below math level 19');
    for (const L of ['en', 'he']) assert(/\d/.test(SB.describe(m, L)) && !/\{|undefined/.test(SB.describe(m, L)), 'description ' + L);
  });
  test('every spell number is an answer at its own math level or below (so the cards can offer it)', () => {
    for (const s of SB.SPELLS) { let ok = false; for (let n = s.mreq; n >= 1 && !ok; n--) { const vals = ME.answers(n); if (vals ? vals.some(v => ME.eq(v, s.v)) : ME.make(n, { target: s.v })) ok = true; } assert(ok, `spell ${s.id} (math gate ${s.mreq}) is not an answer at level ${s.mreq} or below`); }
  });

  const failed = results.filter(r => !r.ok);
  if (isNode) {
    for (const r of results) console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n      ' + r.msg));
    console.log(`\n${results.length - failed.length} of ${results.length} spell tests passed`); if (failed.length) process.exitCode = 1;
  } else globalThis.SPELL_TEST_RESULTS = results;
})();
