/* Math Wizard: tests for the fight rules (combat.js).
   Run in a browser: open tests/index.html. Run with Node: node tests/combat.test.js */
(function () {
  'use strict';
  const isNode = typeof module === 'object' && typeof require === 'function';
  if (isNode) { globalThis.ME = require('../math.js'); globalThis.SB = require('../spells.js'); }
  const ME = globalThis.ME, SB = globalThis.SB, CB = isNode ? require('../combat.js') : globalThis.CB;
  const results = [];
  const test = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, msg: e.message }); } };
  const assert = (c, msg) => { if (!c) throw new Error(msg || 'assertion failed'); };
  let seed = 777; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  ME.setRandom(rnd);
  const learnedAt = (m, w) => SB.book(m, w).learned.map(s => s.id);
  const st = (o = {}) => ({ g: o.g || 1, hero: { hp: o.hp || 20, max: o.max || 20 }, mon: { hp: o.mhp || 6, max: o.mmax || 6, el: o.el || 'fire', boss: !!o.boss }, fx: CB.newFx() });

  test('elements (spec 02 §2): weakness → damage, own element → heals, others → no effect, utility always works', () => {
    const r = (id, el) => CB.relation(SB.BY_ID[id], el);
    assert(r('2', 'fire') === 'weak' && r('5', 'fire') === 'weak' && r('3', 'fire') === 'heal' && r('1', 'fire') === 'heal' && r('4', 'fire') === 'none', 'fire');
    assert(r('3', 'plant') === 'weak' && r('7', 'plant') === 'weak' && r('2', 'plant') === 'heal' && r('1', 'plant') === 'heal', 'plant: fire beats plants, water feeds them');
    assert(r('4', 'storm') === 'weak' && r('7', 'storm') === 'heal' && r('3', 'storm') === 'none', 'storm'); assert(r('1', 'dark') === 'weak' && r('7', 'dark') === 'weak', 'dark');
    assert(r('6', 'fire') === 'util' && r('8', 'ice') === 'util' && r('1/3', 'stone') === 'weak', 'shield/heal always work; Triple Strike hits every element');
    assert(CB.relation(null, 'fire') === 'fizzle', 'no spell fizzles');
  });
  test('numbers (spec 03): S(g), wizard HP, monster attack', () => {
    assert(CB.S(1) === 1 && Math.abs(CB.S(11) - 2) < 1e-9, 'S'); assert(CB.wizMaxHP(1) === 20 && CB.wizMaxHP(30) === 78, 'HP 20 + 2(g−1)');
    assert(CB.monAttack(1) === 1 && CB.monAttack(7) === 2 && CB.monAttack(1, true) === 2, 'attack 1 + ⌊(g−1)/6⌋, boss ×2');
    assert(CB.cardsFor(1) === 3 && CB.cardsFor(3) === 4 && CB.cardsFor(15) === 5 && CB.cardsFor(22) === 6, 'cards per turn');
  });
  test('monster HP is about 3 good casts (spec 03 §1 and §3.1)', () => {
    const hp = CB.monsterHP(1, ['2', '3', '4', '5'], 1, false, () => .5); assert(hp === 6, 'level 1 → 6, got ' + hp);
    assert(CB.monsterHP(1, ['2', '3', '4', '5'], 1, true, () => .5) === 18, 'boss ×3');
    const hp7 = CB.monsterHP(7, learnedAt(7, 1), 1, false, () => .5); assert(hp7 >= 12 && hp7 <= 18, 'level 7 (enhanced) ' + hp7);
  });
  test('always winnable: no dark monsters before a light or lightning spell (spec 03 §3.4)', () => {
    assert(!CB.canBeat('dark', learnedAt(1, 1), 1), 'level 1 has no light'); assert(CB.canBeat('dark', learnedAt(3, 1), 3), 'level 3 has Light Spark');
    for (const el of ['fire', 'ice', 'plant', 'storm', 'stone']) assert(CB.canBeat(el, learnedAt(1, 1), 1), el + ' at level 1');
  });
  // card sets over many levels, wizard levels and monsters
  const CASES = []; for (const m of [1, 2, 3, 5, 6, 7, 10, 13, 15, 17, 20, 22, 25, 26, 28, 31, 34, 36]) for (const w of [1, 3, 15, 22]) for (const el of ['fire', 'ice', 'dark', 'plant', 'storm', 'stone']) CASES.push([m, w, el]);
  test('every card set has a good option, a trap, different answers, and the right number of cards', () => {
    let sets = 0;
    for (const [m, w, el] of CASES) {
      const learned = learnedAt(m, w); if (!CB.canBeat(el, learned, m)) continue;
      for (let k = 0; k < 6; k++) {
        const cards = CB.buildSet({ mlvl: m, wlvl: w, learned, monEl: el, rnd }); sets++;
        const where = `math ${m} wizard ${w} ${el}: ` + cards.map(c => ME.fmt(c.p.a) + c.role[0]).join(' ');
        assert(cards.length >= 3 && cards.length <= CB.cardsFor(w), 'card count ' + where);
        assert(cards.some(c => CB.isGood(c.rel)), 'no good card ' + where);
        if (cards.length >= 3) assert(cards.some(c => !CB.isGood(c.rel)), 'no trap ' + where);
        for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) assert(!ME.eq(cards[i].p.a, cards[j].p.a), 'two cards with the same answer ' + where);
        for (const c of cards) { assert(c.p.lv <= m, 'a card above the student\'s level ' + where); if (c.spell) assert(learned.includes(c.spell.id), 'a card for a spell that is not learned'); }
        if (w < CB.CFG.TWO_GOOD_FROM) assert(cards.filter(c => c.rel === 'weak').length === 1, 'a beginner set has exactly 1 attack option ' + where);
        const support = learned.some(id => ['defense', 'heal'].includes(SB.BY_ID[id].type) && CB.relation(SB.BY_ID[id], el) === 'util');
        if (support && CB.cardsFor(w) >= 4 && cards.length >= 4) assert(cards.some(c => c.spell && ['defense', 'heal', 'control'].includes(c.spell.type)), 'a set of 4+ cards has a support card (shield, healing, or a control spell in its place) ' + where);
      }
    }
    assert(sets > 500, 'sets tested: ' + sets);
  });
  test('advanced wizards (15+): an easy card and a hard card, the hard spell at least twice as strong when possible', () => {
    let both = 0, strong = 0;
    for (const m of [7, 13, 17, 21]) for (const el of ['fire', 'plant', 'stone']) for (let k = 0; k < 10; k++) {
      const cards = CB.buildSet({ mlvl: m, wlvl: 15, learned: learnedAt(m, 15), monEl: el, rnd }), h = cards.find(c => c.role === 'hard'), e = cards.find(c => c.role === 'easy');
      if (h && e) { both++; if (h.spell.power >= 2 * e.spell.power) strong++; assert(h.p.lv === m || h.p.src === 'review', 'the hard card comes from the student\'s level'); }
    }
    assert(both > 80, 'easy + hard sets: ' + both); assert(strong / both > .7, 'hard is at least ×2 in ' + strong + ' of ' + both);
  });
  test('Shadow Snare sometimes takes the support card\'s place (before 5 cards)', () => {
    let ctl = 0, all = 0; for (let k = 0; k < 300; k++) { const cards = CB.buildSet({ mlvl: 9, wlvl: 10, learned: learnedAt(9, 10), monEl: 'fire', rnd }); all++; if (cards.some(c => c.spell && c.spell.type === 'control')) ctl++; }
    assert(ctl / all > .2 && ctl / all < .5, 'control share ' + (ctl / all).toFixed(2));
  });
  test('no healing card when the wizard has full HP', () => {
    let heals = 0;
    for (const el of ['fire', 'plant', 'stone']) for (let k = 0; k < 150; k++) {
      const cards = CB.buildSet({ mlvl: 21, wlvl: 22, learned: learnedAt(21, 22), monEl: el, hpFull: true, rnd });
      heals += cards.filter(c => c.spell && CB.isGood(c.rel) && /heal/i.test(c.spell.fx.k)).length;
      assert(cards.some(c => CB.isGood(c.rel)), 'still a good card');
    }
    assert(heals === 0, 'healing cards at full HP: ' + heals);
  });
  test('about 20% of the good cards are review from earlier levels', () => {
    let rev = 0, all = 0; for (let k = 0; k < 400; k++) { const c = CB.buildSet({ mlvl: 13, wlvl: 3, learned: learnedAt(13, 3), monEl: 'fire', rnd }).find(c => c.role === 'good'); if (c) { all++; if (c.p.src === 'review') rev++; } }
    assert(rev / all > .1 && rev / all < .35, 'review share ' + (rev / all).toFixed(2));
  });
  test('casting: damage on a weakness, healing on the own element, no effect, fizzle', () => {
    let s = st(); let e = CB.cast(s, SB.BY_ID['2']); assert(e.dmg === 2 && s.mon.hp === 4, 'Water Splash on fire: 2');
    s = st({ mhp: 3 }); e = CB.cast(s, SB.BY_ID['3']); assert(e.monHeal === 2 && s.mon.hp === 5, 'Fire Bolt heals a fire monster');
    s = st({ mhp: 6 }); e = CB.cast(s, SB.BY_ID['3']); assert(e.monHeal === 0 && s.mon.hp === 6, 'never above its full HP');
    s = st(); e = CB.cast(s, SB.BY_ID['4']); assert(!e.dmg && s.mon.hp === 6 && e.rel === 'none', 'Stone Throw does nothing to fire');
    s = st(); e = CB.cast(s, null); assert(e.k === 'fizzle' && s.mon.hp === 6, 'fizzle');
    s = st({ g: 11, mhp: 30, mmax: 30 }); e = CB.cast(s, SB.BY_ID['20']); assert(e.dmg === 12, 'Enhanced Water Splash at wizard 11: 6 × 2');
    s = st(); e = CB.cast(s, SB.BY_ID['2'], CB.CFG.INCANT_BONUS); assert(e.dmg === 2, 'the incantation bonus rounds');
  });
  test('the monster turn: attacks, shields, control, reflect, familiars, revive', () => {
    let s = st(); let e = CB.monsterTurn(s); assert(e.dmg === 1 && s.hero.hp === 19, 'attack 1');
    s = st({ g: 7 }); CB.cast(s, SB.BY_ID['6']); e = CB.monsterTurn(s); assert(e.dmg === 1 && e.blocked === .5, 'Wind Shield halves 2 → 1');
    s = st(); CB.cast(s, SB.BY_ID['60']); e = CB.monsterTurn(s); assert(e.dmg === 0, 'Enhanced Wind Shield blocks');
    s = st(); CB.cast(s, SB.BY_ID['9']); assert(CB.monsterTurn(s).skipped && CB.monsterTurn(s).dmg === 1, 'Shadow Snare: one turn');
    s = st({ boss: true }); CB.cast(s, SB.BY_ID['19']); assert(CB.monsterTurn(s).skipped && !CB.monsterTurn(s).skipped, 'a boss skips one turn at most'); assert(CB.cast(s, SB.BY_ID['9']).k === 'bossResist', 'and only once per fight');
    s = st({ mhp: 10, mmax: 10 }); CB.cast(s, SB.BY_ID['36']); e = CB.monsterTurn(s); assert(e.reflected === 1 && s.hero.hp === 20 && s.mon.hp === 9, 'Mirror Ward reflects');
    s = st({ mhp: 10, mmax: 10 }); CB.cast(s, SB.BY_ID['25']); for (let k = 0; k < 4; k++) CB.monsterTurn(s); assert(s.mon.hp === 7, 'the owl hits 3 times (power 1, any element)');
    s = st({ hp: 1 }); CB.cast(s, SB.BY_ID['81']); e = CB.monsterTurn(s); assert(e.revived && s.hero.hp === 10, 'Phoenix Feather: back with half HP');
    s = st({ hp: 10 }); CB.cast(s, SB.BY_ID['8']); assert(s.hero.hp === 12, 'Healing Leaf heals 2');
    s = st({ mhp: 20, mmax: 20 }); CB.cast(s, SB.BY_ID['1/2']); assert(s.mon.hp === 10, 'Half-Moon Hex halves'); s = st({ mhp: 20, mmax: 20, boss: true }); CB.cast(s, SB.BY_ID['1/2']); assert(s.mon.hp === 15, 'a boss loses a quarter');
    s = st({ mhp: 20, mmax: 20 }); CB.cast(s, SB.BY_ID['16']); const d = CB.cast(s, SB.BY_ID['2']).dmg; assert(d === 4, 'Arcane Echo doubles the next spell'); assert(CB.cast(s, SB.BY_ID['2']).dmg === 2, 'only the next one');
  });
  test('a fight at level 1 ends in about 3 good casts', () => {
    const s = st({ mhp: CB.monsterHP(1, ['2', '3', '4', '5'], 1, false, () => .5), mmax: 6 }); let casts = 0; while (s.mon.hp > 0 && casts < 10) { CB.cast(s, SB.BY_ID['2']); casts++; } assert(casts === 3, 'casts ' + casts);
  });

  // ---- monster abilities (spec 03 §4) ----
  const mon = (o = {}) => Object.assign({ hp: 20, max: 20, el: 'fire', boss: false, ab: [], armor: null, shield: false, charge: 0, shift: 0, pack: [], shiftEls: [] }, o);
  const stm = (m, o = {}) => ({ g: o.g || 1, hero: { hp: o.hp || 40, max: o.max || 40 }, mon: m, fx: CB.newFx() });
  test('ability chance: none before wizard level 6, 30% at 6, 60% at 20', () => {
    assert(CB.abilityChance(5) === 0 && Math.abs(CB.abilityChance(6) - .3) < 1e-9 && Math.abs(CB.abilityChance(20) - .6) < 1e-9 && Math.abs(CB.abilityChance(30) - .6) < 1e-9, 'chance');
    assert(CB.abilitiesAt(5).length === 0 && CB.abilitiesAt(6).join() === 'armored' && CB.abilitiesAt(20).length === 7, 'unlocks');
  });
  test('rolling abilities: a boss always has one (two from level 20), never a group; armor never breaks with the own element and can always be broken', () => {
    for (let k = 0; k < 200; k++) {
      const el = ['fire', 'ice', 'plant', 'storm', 'stone', 'dark'][k % 6], learned = learnedAt(21, 20);
      const b = CB.rollAbilities({ g: k % 2 ? 20 : 9, boss: true, el, learned, mlvl: 21, rnd });
      assert(b.ab.length === (k % 2 ? 2 : 1) && !b.ab.includes('group'), 'boss abilities ' + b.ab);
      assert(!(b.ab.includes('armored') && b.ab.includes('shifter')), 'armor and shapeshifting never together');
      const n = CB.rollAbilities({ g: 20, boss: false, el, learned, mlvl: 21, rnd }); assert(n.ab.length <= 1, 'one ability at most');
      for (const r of [b, n]) if (r.armor) { assert(!(el === 'fire' && r.armor === 'bark') && !(el === 'storm' && r.armor === 'iron'), 'own element ' + el + ' ' + r.armor); assert(CB.armorsFor(el, learned, 21).includes(r.armor), 'breakable'); }
    }
    assert(CB.rollAbilities({ g: 5, boss: true, el: 'fire', learned: learnedAt(3, 5), mlvl: 3, rnd }).ab.length === 0, 'nothing before level 6');
  });
  test('armor: a weakness hit does half damage; the breaking element hits the armor and never heals; then the fight is as usual', () => {
    const m = mon({ el: 'plant', armor: { type: 'stone', hp: 4, max: 4 } }), s = stm(m);   // stone armor breaks with water (water heals a plant!)
    assert(CB.relation(SB.BY_ID['2'], 'plant', m) === 'break' && CB.isGood('break'), 'water breaks stone armor');
    let e = CB.cast(s, SB.BY_ID['3']); assert(e.dmg === 1 && m.hp === 19, 'Fire Bolt on an armored plant: half of 2');
    e = CB.cast(s, SB.BY_ID['2']); assert(e.armorHit === 2 && m.armor.hp === 2 && !e.monHeal && m.hp === 19, 'water hits the armor, no healing');
    CB.cast(s, SB.BY_ID['2']); assert(m.armor.hp === 0 && CB.relation(SB.BY_ID['2'], 'plant', m) === 'heal', 'armor broken: water heals the plant again');
    e = CB.cast(s, SB.BY_ID['3']); assert(e.dmg === 2, 'full damage after the armor');
  });
  test('the cards break the armor first', () => {
    const m = mon({ el: 'plant', armor: { type: 'stone', hp: 4, max: 4 } });
    for (let k = 0; k < 40; k++) { const cards = CB.buildSet({ mlvl: 3, wlvl: 3, learned: learnedAt(3, 3), monEl: 'plant', mon: m, rnd }); assert(cards.some(c => c.rel === 'break'), 'a breaking card: ' + cards.map(c => ME.fmt(c.p.a) + c.rel).join(' ')); }
  });
  test('a big attack is coming: the support card is a shield or a control spell', () => {
    for (let k = 0; k < 60; k++) { const cards = CB.buildSet({ mlvl: 9, wlvl: 10, learned: learnedAt(9, 10), monEl: 'fire', charging: true, rnd }); assert(cards.some(c => c.spell && ['defense', 'control'].includes(c.spell.type)), 'guard card: ' + cards.map(c => ME.fmt(c.p.a)).join(' ')); }
  });
  test('shielded: the first hit only breaks the shield', () => {
    const m = mon({ shield: true }), s = stm(m); let e = CB.cast(s, SB.BY_ID['6']); assert(!e.popped && m.shield, 'a shield spell is no hit');
    e = CB.cast(s, SB.BY_ID['4']); assert(e.popped && !m.shield && m.hp === 20, 'any hit breaks it'); e = CB.cast(s, SB.BY_ID['2']); assert(e.dmg === 2, 'then as usual');
  });
  test('regenerating, charging, double attack, shapeshifter', () => {
    let m = mon({ hp: 10, ab: ['regen'] }), s = stm(m); let e = CB.monsterTurn(s); assert(e.regen === 2 && m.hp === 12, 'regen 10%');
    m = mon({ ab: ['charging'] }); s = stm(m); e = CB.monsterTurn(s); assert(e.dmg === 1 && !e.warn, 'turn 1'); e = CB.monsterTurn(s); assert(e.dmg === 1 && e.warn && CB.charging(m), 'turn 2 warns');
    e = CB.monsterTurn(s); assert(e.dmg === 3 && e.big, 'turn 3: ×3'); assert(CB.monsterTurn(s).dmg === 1, 'and again small');
    m = mon({ ab: ['charging'], charge: 1 }); s = stm(m); s.fx.skip = 1; e = CB.monsterTurn(s); assert(e.skipped && m.charge === 2, 'charging while snared'); CB.cast(s, SB.BY_ID['6']); e = CB.monsterTurn(s); assert(e.big && e.dmg === 1, 'a shield halves the big attack');
    m = mon({ ab: ['double'] }); s = stm(m); e = CB.monsterTurn(s); assert(e.hits.length === 2 && e.dmg === 2, 'two attacks');
    m = mon({ ab: ['shifter'], shiftEls: ['fire', 'ice', 'plant'] }); s = stm(m); e = CB.monsterTurn(s); assert(!e.shifted && m.el === 'fire', 'not yet'); e = CB.monsterTurn(s); assert(e.shifted && m.el !== 'fire' && ['ice', 'plant'].includes(m.el), 'every 2 turns');
  });
  test('a group: single spells hit the front monster, area spells hit all, the next one steps forward', () => {
    const m = CB.newMonster({ g: 15, el: 'fire', learned: learnedAt(13, 15), mlvl: 13, ab: ['group'], rnd: () => .99 }); assert(m.pack.length === 2, 'three monsters');
    const s = stm(m, { g: 15 }); const e = CB.monsterTurn(s); assert(e.hits.length === 3, '3 attacks (each 40%)');
    m.hp = 1; CB.cast(s, SB.BY_ID['2']); assert(m.hp === 0 && !CB.defeated(s) && CB.nextFront(s) && m.hp === m.max && m.pack.length === 1, 'the next one steps forward');
    const area = SB.SPELLS.find(x => x.fx.k === 'area' && ['water', 'ice'].includes(x.el)); if (area) { const before = m.hp + m.pack[0].hp; CB.cast(s, area); assert(m.hp + m.pack[0].hp < before && m.pack[0].hp < m.pack[0].max, 'area hits the pack too'); }
  });

  const failed = results.filter(r => !r.ok);
  if (isNode) { for (const r of results) console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n      ' + r.msg)); console.log(`\n${results.length - failed.length} of ${results.length} combat tests passed`); if (failed.length) process.exitCode = 1; }
  else globalThis.COMBAT_TEST_RESULTS = results;
})();
