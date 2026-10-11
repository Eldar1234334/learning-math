/* Math Wizard: the fight simulator (spec 03 §7, step 6). Not part of the game.
   It plays quest runs with the real fight rules (combat.js: card sets, casting, monster turns, abilities, groups)
   for three kinds of players, and measures what spec 03 §1 asks for:
     1. a normal fight takes about 3 good casts;
     2. a good player finishes a run with HP left, a guessing player loses early;
     3. strong spells are clearly strong;
     4. at the same wizard level, fights are equally long whatever the math level.
   Run in a browser: open tools/sim.html. Run with Node: node tools/sim.js */
(function (root) {
  'use strict';
  const isNode = typeof module === 'object' && typeof require === 'function';
  if (isNode) { root.ME = require('../math.js'); root.SB = require('../spells.js'); root.CB = require('../combat.js'); }
  const ME = root.ME, SB = root.SB, CB = root.CB;

  // the players. pick: how often a tactical choice is the best one (else a random card); say: a right incantation (math level 5+);
  // heal: uses a healing or shield card when HP is low; aim: picks the best target in a group
  const PLAYERS = {
    good: { pick: 0.9, say: 0.9, heal: true, aim: true },
    average: { pick: 0.55, say: 0.7, heal: false, aim: false },
    guessing: { pick: 0, say: 0.25, heal: false, aim: false }
  };
  const RUN = { MIN: 5, MAX: 10, SPECIAL: 0.28, REST_SHARE: 0.4, PRE_BOSS_REST: 0.35, POUCH: { heart: 2, second: 2, power: 1 } };   // the game's run: 5–10 fights, campfires sometimes (index.html buildPath); a pouch of 5 potions from the starter set

  let seed = 1; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const RANK = { weak: 5, break: 4, util: 3, none: 2, heal: 1, fizzle: 0 };

  // what a card is worth against one monster (expected damage, or a break; utility is valued by the situation)
  function value(card, m, st, alive) {
    const s = card.spell; if (!s) return 0;
    const k = s.fx.k, mult = CB.S(st.g);
    if (k === 'area') return alive.reduce((a, f) => a + (CB.relation(s, f.el, f) === 'weak' ? s.power * mult * (CB.armorUp(f) ? .5 : 1) : CB.relation(s, f.el, f) === 'break' ? 6 : CB.relation(s, f.el, f) === 'heal' ? -s.power : 0), 0);
    const r = CB.relation(s, m.el, m);
    if (m.shield && ['dmg', 'multi', 'drain', 'halve'].includes(k)) return 3;
    if (r === 'break') return 6 + s.power;
    if (r === 'weak') return s.power * mult * (CB.armorUp(m) ? .5 : 1);
    if (k === 'multi') return s.fx.hits * s.fx.pw * mult;
    if (k === 'halve') return Math.floor(m.hp * (m.boss ? .25 : .5));
    if (k === 'drain') return s.fx.n * mult;
    if (r === 'heal') return -s.power;
    return 0;
  }
  // a player picks a card (and in a group a target)
  function choose(cards, used, st, P) {
    const free = cards.map((c, i) => i).filter(i => !used.includes(i)), alive = CB.alive(st), h = st.hero;
    if (rnd() >= P.pick) { const i = pick(free); const t = pick(alive); return { i, t }; }
    if (P.heal) {   // defend or heal when it matters
      const low = h.hp <= h.max * 0.35, big = alive.some(CB.charging);
      const want = free.filter(i => cards[i].spell && (low ? ['heal', 'healPart', 'fullHeal', 'drain'] : big ? ['shield', 'skip'] : []).includes(cards[i].spell.fx.k));
      if (want.length) return { i: want[0], t: st.mon };
    }
    let best = null;
    for (const i of free) for (const t of (P.aim ? alive : [st.mon])) {
      const v = value(cards[i], t, st, alive) + (t.hp > 0 ? 1 / (1 + t.hp) : 0);   // prefer finishing a weak monster
      if (!best || v > best.v) best = { i, t, v };
    }
    return best && best.v > 0 ? best : { i: pick(free), t: st.mon };
  }

  // one fight. Returns { won, turns, good (casts that hurt or broke an armor), taken (HP lost) }
  function fight(st, o, P) {
    const learned = o.learned; let turns = 0, good = 0; const hp0 = st.hero.hp;
    while (!CB.defeated(st) && st.hero.hp > 0 && turns < 60) {
      turns++;
      if (o.pouch.heart > 0 && st.hero.hp < st.hero.max * 0.3) { o.pouch.heart--; st.hero.hp = Math.min(st.hero.max, st.hero.hp + Math.ceil(st.hero.max * CB.CFG.HEART_POT_HEAL)); }   // a Heart potion when HP is low (one per turn)
      const casts = st.foes.length > 1 ? CB.CFG.GROUP_CASTS : 1, h = st.hero;
      const cards = CB.buildSet({ mlvl: o.mlvl, wlvl: o.g, learned, monEl: st.mon.el, mon: st.mon, foes: st.foes, hpLow: h.hp <= h.max * .35, hpFull: h.hp >= h.max, charging: CB.alive(st).some(CB.charging), rnd });
      const used = [];
      for (let k = 0; k < casts && !CB.defeated(st); k++) {
        const c = choose(cards, used, st, P); used.push(c.i); if (c.t && c.t.hp > 0) st.mon = c.t; CB.retarget(st);
        const card = cards[c.i], stage2 = o.mlvl >= CB.CFG.INCANT_FROM;
        let ok = !stage2 || rnd() < P.say;
        if (!ok && o.pouch.second > 0) { o.pouch.second--; ok = rnd() < P.say; }   // a Second chance potion undoes a wrong incantation (one more try)
        if (st.mon.boss && o.pouch.power > 0 && !o.powerUsed) { o.pouch.power--; o.powerUsed = true; st.fx.buff = Math.max(st.fx.buff, 2); }   // a Power potion against the boss
        const spell = ok ? SB.cast(card.p.a, learned) : null, ev = CB.cast(st, spell, ok && stage2 ? CB.CFG.INCANT_BONUS : 1);
        if (ev.dmg > 0 || ev.armorHit || ev.popped) good++;
        CB.retarget(st);
      }
      if (CB.defeated(st)) break;
      CB.monsterTurn(st, rnd);
    }
    return { won: CB.defeated(st), turns, good, taken: Math.max(0, hp0 - st.hero.hp) };
  }
  function foesFor(o, boss) {
    const beat = Object.keys(CB.MON_EL).filter(e => CB.canBeat(e, o.learned, o.mlvl)), el = pick(beat);
    const base = { g: o.g, boss, el, learned: o.learned, mlvl: o.mlvl, rnd };
    const roll = o.noAbilities ? { ab: [], armor: null } : CB.rollAbilities(base);
    const els = roll.ab.includes('group') && !boss ? CB.groupEls(o.learned, o.mlvl, rnd) : null;
    if (els) return els.map(e => CB.newMonster(Object.assign({}, base, { el: e, ab: ['group'], armor: null })));
    if (roll.ab.includes('group')) roll.ab = roll.ab.filter(k => k !== 'group');
    return [CB.newMonster(Object.assign(base, roll))];
  }
  // one quest run: 5–10 fights and a boss, 20% HP back after each win, campfires sometimes
  function run(o, P) {
    o.pouch = Object.assign({}, RUN.POUCH); o.powerUsed = false;
    const max = CB.wizMaxHP(o.g), hero = { hp: max, max }, n = RUN.MIN + Math.floor(rnd() * (RUN.MAX - RUN.MIN + 1)), fights = [];
    for (let i = 0; i <= n; i++) {
      const boss = i === n, foes = foesFor(o, boss), st = { g: o.g, hero, foes, mon: foes[0], fx: CB.newFx(), ptyp: CB.pTyp(o.mlvl, o.learned, o.g) };
      const f = fight(st, o, P); f.boss = boss; f.group = foes.length > 1; f.ab = foes[0].ab.slice(); fights.push(f);
      if (!f.won) return { won: false, fights, cleared: i, hpLeft: 0 };
      hero.hp = Math.min(max, hero.hp + Math.round(max * CB.CFG.WIN_REGEN));
      if (!boss && i > 0 && rnd() < RUN.SPECIAL * RUN.REST_SHARE) hero.hp = Math.min(max, hero.hp + Math.ceil(max * CB.CFG.REST_HEAL));
      if (i === n - 1 && n >= 6 && rnd() < RUN.PRE_BOSS_REST) hero.hp = Math.min(max, hero.hp + Math.ceil(max * CB.CFG.REST_HEAL));   // sometimes a breather before the boss
    }
    return { won: true, fights, cleared: n + 1, hpLeft: hero.hp / max };
  }
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  // o: { g (wizard level), mlvl, player, runs, noAbilities } → a summary
  function simulate(o) {
    seed = o.seed || 12345; ME.setRandom(rnd);
    const learned = SB.book(o.mlvl, o.g).learned.map(s => s.id), P = PLAYERS[o.player], runs = [];
    for (let k = 0; k < (o.runs || 100); k++) runs.push(run(Object.assign({}, o, { learned }), P));
    const fights = runs.flatMap(r => r.fights), normal = fights.filter(f => !f.boss && !f.group && !f.ab.length && f.won);
    return {
      g: o.g, mlvl: o.mlvl, player: o.player,
      winRate: avg(runs.map(r => r.won ? 1 : 0)), hpLeft: avg(runs.filter(r => r.won).map(r => r.hpLeft)), cleared: avg(runs.map(r => r.cleared)),
      goodCasts: avg(normal.map(f => f.good)), turns: avg(normal.map(f => f.turns)), taken: avg(normal.map(f => f.taken)),
      bossTurns: avg(fights.filter(f => f.boss && f.won).map(f => f.turns)), groupTurns: avg(fights.filter(f => f.group && f.won).map(f => f.turns)),
      bossTaken: avg(fights.filter(f => f.boss).map(f => f.taken)), groupTaken: avg(fights.filter(f => f.group).map(f => f.taken)), abTaken: avg(fights.filter(f => !f.boss && !f.group && f.ab.length).map(f => f.taken)),
      lostIn: (() => { const l = runs.filter(r => !r.won).map(r => r.fights[r.fights.length - 1]); return { boss: l.filter(f => f.boss).length, group: l.filter(f => f.group).length, ability: l.filter(f => !f.boss && !f.group && f.ab.length).length, normal: l.filter(f => !f.boss && !f.group && !f.ab.length).length }; })(),
      lostAt: avg(runs.filter(r => !r.won).map(r => r.cleared + 1))
    };
  }
  // goal 3: casts to defeat a normal monster with the strongest good spell vs the weakest (wizard level 15+: the hard and the easy card)
  function strongVsWeak(g, mlvl) {
    const learned = SB.book(mlvl, g).learned.map(s => s.id), hp = CB.CFG.MON_HITS * CB.pTyp(mlvl, learned, g) * CB.S(g);
    const atk = learned.map(id => SB.BY_ID[id]).filter(s => CB.elemental(s) && s.power > 0), ps = atk.map(s => s.power);
    return { hp: Math.round(hp), strongCasts: hp / (Math.max(...ps) * CB.S(g)), weakCasts: hp / (Math.min(...ps) * CB.S(g)) };
  }
  // the standard report: the pairs of (wizard level, math level) a student is likely to have, every player
  const PAIRS = [[1, 2], [3, 5], [6, 9], [10, 13], [15, 13], [15, 21], [20, 21], [20, 26], [25, 31], [30, 36]];
  const SAME_G = [[10, [5, 9, 13, 21]], [20, [13, 21, 26, 31]]];
  function report(runs = 60) {
    const rows = [];
    for (const [g, m] of PAIRS) for (const player of Object.keys(PLAYERS)) rows.push(simulate({ g, mlvl: m, player, runs }));
    const same = SAME_G.map(([g, ms]) => ({ g, rows: ms.map(m => simulate({ g, mlvl: m, player: 'good', runs })) }));
    const strong = [[15, 13], [15, 21], [20, 26], [25, 31]].map(([g, m]) => Object.assign({ g, mlvl: m }, strongVsWeak(g, m)));
    return { rows, same, strong, checks: checks(rows, same, strong) };
  }
  // the goals of spec 03 §1 as checks (the bounds are the build session's reading of "about")
  function checks(rows, same, strong) {
    const out = [], by = p => rows.filter(r => r.player === p);
    out.push({ goal: '1. A normal fight takes about 3 good casts (good player, 2–4; from wizard level 15 the strong card makes it shorter)', ok: by('good').every(r => r.goodCasts >= 2 && r.goodCasts <= 4), detail: by('good').map(r => `${r.g}/${r.mlvl}: ${r.goodCasts.toFixed(1)}`).join(' · ') });
    out.push({ goal: '2a. A good player wins most runs (≥ 85%)', ok: by('good').every(r => r.winRate >= .85), detail: by('good').map(r => `${r.g}/${r.mlvl}: ${Math.round(r.winRate * 100)}%`).join(' · ') });
    out.push({ goal: '2b. A guessing player loses (wins ≤ 10%); from math level 5 in the first fights', ok: by('guessing').every(r => r.winRate <= .1 && (r.mlvl < 5 || (r.lostAt || 0) <= 3)), detail: by('guessing').map(r => `${r.g}/${r.mlvl}: ${Math.round(r.winRate * 100)}%, fight ${r.lostAt.toFixed(1)}`).join(' · ') });
    out.push({ goal: '2c. An average player is in between (wins 15% or more, and less often than a good player at the higher levels)', ok: by('average').every(r => r.winRate >= .15) && by('average').filter(r => r.g >= 20).every(r => r.winRate < by('good').find(x => x.g === r.g && x.mlvl === r.mlvl).winRate), detail: by('average').map(r => `${r.g}/${r.mlvl}: ${Math.round(r.winRate * 100)}%`).join(' · ') });
    out.push({ goal: '3. The strongest spell ends a fight in about half the casts of the weakest or less', ok: strong.every(s => s.strongCasts * 2 <= s.weakCasts + 1e-9), detail: strong.map(s => `${s.g}/${s.mlvl}: ${s.strongCasts.toFixed(1)} vs ${s.weakCasts.toFixed(1)}`).join(' · ') });
    for (const s of same) { const ts = s.rows.map(r => r.turns), a = avg(ts); out.push({ goal: `4. Wizard level ${s.g}: fights equally long at every math level (±30%)`, ok: ts.every(x => Math.abs(x - a) <= .3 * a), detail: s.rows.map(r => `math ${r.mlvl}: ${r.turns.toFixed(1)} turns`).join(' · ') }); }
    return out;
  }

  const SIM = { PLAYERS, RUN, fight, foesFor, setSeed: s => { seed = s; ME.setRandom(rnd); }, simulate, strongVsWeak, report, checks, PAIRS };
  if (isNode && require.main === module) {
    const r = report(+(process.argv[2] || 40));
    for (const x of r.rows) console.log(`${x.player.padEnd(9)} wiz ${String(x.g).padStart(2)} math ${String(x.mlvl).padStart(2)} | win ${String(Math.round(x.winRate * 100)).padStart(3)}% | HP left ${Math.round(x.hpLeft * 100)}% | good casts ${x.goodCasts.toFixed(1)} | turns ${x.turns.toFixed(1)} | taken ${x.taken.toFixed(1)} | boss ${x.bossTurns.toFixed(1)} | group ${x.groupTurns.toFixed(1)}`);
    for (const c of r.checks) console.log((c.ok ? 'ok   ' : 'MISS ') + c.goal + '\n      ' + c.detail);
    if (r.checks.some(c => !c.ok)) process.exitCode = 1;   // the balance goals are a check on every upload (tests.yml)
  }
  if (isNode) module.exports = SIM; else root.SIM = SIM;
})(typeof globalThis !== 'undefined' ? globalThis : this);
