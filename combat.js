/* Math Wizard: the fight rules (spec 00 §3, spec 02 §2 and §7, spec 03 §2–3). No screen code: the game (index.html) draws the fight,
   the tests (tests/) check the rules, and the balance simulator (step 6) will play thousands of fights with them.
   Needs math.js (ME) and spells.js (SB).

   A turn: the student picks one of several problem cards (answers hidden) → the answer is cast as the spell with that number →
   weakness: damage · the monster's own element: it heals · any other attack element: no effect · utility spells always work · no spell: fizzle →
   the monster attacks, unless a spell stopped it.
*/
(function (root) {
  'use strict';
  const ME = root.ME || require('./math.js'), SB = root.SB || require('./spells.js');

  // starting values from spec 03 §8 (to tune in step 6). Values marked (p) are proposals, not in the spec.
  const CFG = {
    DMG_LEVEL_STEP: 0.1,                       // S(g) = 1 + step × (g − 1)
    MON_HITS: 3, MON_HP_SPREAD: 0.1,           // monster HP = about 3 good casts, ±10%
    HP_BASE: 20, HP_PER_LEVEL: 2, WIN_REGEN: 0.2, SAFETY_HP_BONUS: 0.25,
    MON_ATK_BASE: 1, MON_ATK_EVERY: 6, BOSS_HP_MULT: 3, BOSS_ATK_MULT: 2,
    CARDS: [[1, 3], [3, 4], [15, 5], [22, 6]],  // cards per turn by wizard level (spec 02 §4)
    TWO_GOOD_FROM: 15, UTIL_IN_SET_FROM: 22,   // two good options (easy + hard) from wizard level 15; a defense/area option in the set from 22
    HARD_MIN_RATIO: 2,                         // the hard card's spell has at least twice the power of the easy card's
    REVIEW: 0.2, WEAK: 0.25,                   // review cards and weak spots (spec 01 §5)
    INCANT_FROM: 5, NUMPAD_FROM: 21,           // the incantation step from math level 5; a number pad (whole numbers and decimals) from level 21
    INCANT_BONUS: 1.1,                         // (p) a right incantation adds 10% power (spec 00 §4.1 asks for "a small power bonus")
    HEART_POT_HEAL: 0.3, REST_HEAL: 0.25,      // Heart potion; (p) a campfire on the path gives back 25% of max HP
    SHRINK: 0.5,                               // (p) Shrinking Hex: the monster's attack is halved for 3 turns
    UTIL_GOOD: 0.15                            // (p) how often the one good card of a beginner's set is a utility spell (shield, heal…) instead of an attack
  };

  /* ---- elements (spec 02 §2) ---- */
  const MON_EL = {
    fire: { weak: ['water', 'ice'], heal: ['fire', 'light'] }, ice: { weak: ['fire', 'light'], heal: ['ice'] }, dark: { weak: ['light', 'lightning'], heal: [] },
    plant: { weak: ['fire', 'lightning'], heal: ['water', 'light'] }, storm: { weak: ['stone', 'ice'], heal: ['lightning', 'water'] }, stone: { weak: ['water', 'lightning'], heal: ['stone'] }
  };
  const elemental = s => s && ['dmg', 'area'].includes((s.fx || {}).k) && !SB.ELEMENTS[s.el].util;   // spells whose effect depends on the monster's element
  // how a spell meets a monster: 'weak' (damage), 'heal' (the monster gets stronger), 'none' (no effect), 'util' (always works), 'fizzle' (no spell)
  function relation(spell, monEl) {
    if (!spell) return 'fizzle';
    if (elemental(spell)) { const m = MON_EL[monEl]; return m.weak.includes(spell.el) ? 'weak' : m.heal.includes(spell.el) ? 'heal' : 'none'; }
    if ((spell.fx || {}).k === 'multi') return 'weak';   // Triple Strike (arcane) hits every element
    return 'util';
  }
  const isGood = rel => rel === 'weak' || rel === 'util';   // an effective pick (spec 01 §6.1, stage 1)

  /* ---- numbers (spec 03 §2–3) ---- */
  const S = g => 1 + CFG.DMG_LEVEL_STEP * (g - 1);
  const wizMaxHP = g => CFG.HP_BASE + CFG.HP_PER_LEVEL * (g - 1);
  const monAttack = (g, boss) => (CFG.MON_ATK_BASE + Math.floor((g - 1) / CFG.MON_ATK_EVERY)) * (boss ? CFG.BOSS_ATK_MULT : 1);
  const cardsFor = wl => CFG.CARDS.reduce((n, [from, c]) => wl >= from ? c : n, 3);

  /* ---- which levels can make a number (cached) ---- */
  const MAKE = {};
  function canMake(v, n) {
    const k = n + ':' + v.n + '/' + v.d; if (k in MAKE) return MAKE[k];
    const vals = ME.answers(n); return (MAKE[k] = vals ? vals.some(x => ME.eq(x, v)) : !!ME.make(n, { target: v }));
  }
  // the level a card for answer v comes from: the student's own level (about 80%), or review from an earlier level that can make it (spec 01 §5.2)
  function levelFor(v, mlvl, rnd) {
    const here = canMake(v, mlvl), back = []; for (let n = mlvl - 1; n >= 1; n--) if (canMake(v, n)) back.push(n);
    if (here && (!back.length || rnd() >= CFG.REVIEW)) return mlvl;
    if (!back.length) return here ? mlvl : null;
    const w = back.map((n, i) => i === 0 ? 5 : i === 1 ? 3 : i === 2 ? 2 : 1), t = w.reduce((a, b) => a + b, 0); let r = rnd() * t;
    for (let i = 0; i < back.length; i++) { r -= w[i]; if (r < 0) return back[i]; } return back[0];
  }
  const buildable = (s, mlvl) => { for (let n = mlvl; n >= 1; n--) if (canMake(s.v, n)) return true; return false; };

  /* ---- monster HP (spec 03 §3.1): about 3 typical good casts. P_typ is computed from the spells the cards will really offer ---- */
  function pTyp(mlvl, learnedIds) {
    const atk = learnedIds.map(id => SB.BY_ID[id]).filter(s => s && elemental(s) && s.power > 0);
    let use = atk.filter(s => canMake(s.v, mlvl)); if (!use.length) use = atk.filter(s => buildable(s, mlvl)); if (!use.length) use = atk;
    return use.length ? use.reduce((a, s) => a + s.power, 0) / use.length : 2;
  }
  function monsterHP(mlvl, learnedIds, g, boss, rnd = Math.random) {
    const base = CFG.MON_HITS * pTyp(mlvl, learnedIds) * S(g), spread = 1 + CFG.MON_HP_SPREAD * (rnd() * 2 - 1);
    return Math.max(3, Math.round(base * spread * (boss ? CFG.BOSS_HP_MULT : 1)));
  }
  // always winnable (spec 03 §3.4): the student has at least one learned spell that hurts a monster of this element, and the cards can offer it
  const canBeat = (monEl, learnedIds, mlvl) => learnedIds.some(id => { const s = SB.BY_ID[id]; return s && relation(s, monEl) === 'weak' && buildable(s, mlvl); });

  /* ---- a card set (spec 00 §3.4, spec 01 §5.2) ---- */
  // o: { mlvl, wlvl, learned (ids), monEl, avoid (Set of recent keys), facts (weak spots), hpLow, hpFull, rnd }
  // returns cards [{ p (the problem, p.src = 'cur' | 'review' | 'hard' | 'weak'), spell (or null), rel, role: 'good' | 'easy' | 'hard' | 'util' | 'trap' | 'fill' }]
  function buildSet(o) {
    const rnd = o.rnd || Math.random, pick = a => a[Math.floor(rnd() * a.length)], mlvl = o.mlvl, n = cardsFor(o.wlvl);
    const learned = o.learned.map(id => SB.BY_ID[id]).filter(Boolean), cards = [], used = [], avoid = new Set(o.avoid || []);
    const taken = v => used.some(u => ME.eq(u, v));
    const add = (spell, role, level, p) => {
      if (!p) { if (level == null) return false; p = ME.make(level, { target: spell.v, avoid }); if (!p) return false; p = Object.assign({}, p, { src: level < mlvl ? 'review' : role === 'hard' ? 'hard' : 'cur' }); }
      if (taken(p.a)) return false;
      const sp = spell || SB.SPELLS.find(s => ME.eq(s.v, p.a) && o.learned.includes(s.id)) || null;
      used.push(p.a); avoid.add(p.key); cards.push({ p, spell: sp, rel: relation(sp, o.monEl), role }); return true;
    };
    const weakS = learned.filter(s => relation(s, o.monEl) === 'weak' && buildable(s, mlvl));
    const utilS = learned.filter(s => relation(s, o.monEl) === 'util' && buildable(s, mlvl) && !(o.hpFull && /heal/i.test(s.fx.k)));   // no healing card at full HP
    const badS = learned.filter(s => ['heal', 'none'].includes(relation(s, o.monEl)) && buildable(s, mlvl));
    // 1. the good card(s)
    if (o.wlvl >= CFG.TWO_GOOD_FROM && weakS.length) {   // an easy card (a weaker spell, the level below) and a hard card (a stronger spell, the top of the level)
      const here = weakS.filter(s => canMake(s.v, mlvl)).sort((a, b) => b.power - a.power);
      const hard = here.length ? pick(here.filter(s => s.power === here[0].power)) : pick(weakS);
      add(hard, 'hard', canMake(hard.v, mlvl) ? mlvl : levelFor(hard.v, mlvl, rnd));
      const easy = weakS.filter(s => s !== hard && s.power * CFG.HARD_MIN_RATIO <= hard.power), easyAny = weakS.filter(s => s !== hard);
      const e = easy.length ? pick(easy) : easyAny.length ? pick(easyAny) : null;
      if (e) add(e, 'easy', mlvl > 1 && canMake(e.v, mlvl - 1) ? mlvl - 1 : levelFor(e.v, mlvl, rnd));
    } else {
      const useUtil = utilS.length && (rnd() < CFG.UTIL_GOOD || (o.hpLow && utilS.some(s => /heal/i.test(s.fx.k))));
      const pool = useUtil ? (o.hpLow && utilS.some(s => /heal/i.test(s.fx.k)) ? utilS.filter(s => /heal/i.test(s.fx.k)) : utilS) : weakS;
      for (const s of shuffleBy(pool, rnd)) if (add(s, useUtil ? 'util' : 'good', levelFor(s.v, mlvl, rnd))) break;
      if (!cards.length) for (const s of shuffleBy(weakS.concat(utilS), rnd)) if (add(s, 'good', levelFor(s.v, mlvl, rnd))) break;
    }
    if (o.wlvl >= CFG.UTIL_IN_SET_FROM && utilS.length && cards.length < n) for (const s of shuffleBy(utilS, rnd)) if (add(s, 'util', levelFor(s.v, mlvl, rnd))) break;
    // 2. at least one trap: a spell the monster resists or that heals it, or a number that is no spell (fizzle)
    const fizzleCard = () => { for (let k = 0; k < 30; k++) { const p = ME.next(mlvl, { avoid, noReview: true }); if (!learned.some(s => ME.eq(s.v, p.a)) && add(null, 'trap', null, Object.assign({}, p, { src: 'cur' }))) return true; } return false; };
    const trapSpell = () => { for (const s of shuffleBy(badS, rnd)) if (add(s, 'trap', levelFor(s.v, mlvl, rnd))) return true; return false; };
    if (rnd() < 0.5) { if (!trapSpell()) fizzleCard(); } else if (!fizzleCard()) trapSpell();
    // 3. fill: more traps, sometimes a weak spot (spec 01 §5.4), never a second good option for a beginner
    for (let k = 0; cards.length < n && k < 60; k++) {
      if (o.facts && rnd() < CFG.WEAK) {
        const f = ME.next(mlvl, { facts: o.facts, avoid }); if (f.src === 'weak' || (f.src === 'review' && f.form === 'weak')) {
          const sp = learned.find(s => ME.eq(s.v, f.a)), rel = relation(sp, o.monEl);
          if (!isGood(rel) || o.wlvl >= CFG.TWO_GOOD_FROM) { add(sp || null, 'fill', null, f); continue; }
        }
      }
      if (rnd() < 0.5 && badS.length) trapSpell(); else fizzleCard();
    }
    return shuffleBy(cards, rnd);
  }
  function shuffleBy(a, rnd) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* ---- the fight state ---- */
  // st = { g (wizard level), hero: { hp, max }, mon: { hp, max, el, boss }, fx: { … } }
  const newFx = () => ({ shields: [], skip: 0, buff: 1, summon: null, reflect: false, revive: false, reviveUsed: false, weaken: null, shrink: 0, bossCtl: false });
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // cast a spell (or fizzle). bonus: a right incantation. Returns one event: { k, rel, dmg, heal, monHeal, … }
  function cast(st, spell, bonus = 1) {
    const ev = { k: 'fizzle', rel: relation(spell, st.mon.el), spell };
    if (!spell) return ev;
    const f = spell.fx || {}, buff = st.fx.buff; st.fx.buff = 1;   // a buff works on the next spell only
    const mult = S(st.g) * buff * bonus, hit = x => { const d = Math.max(1, Math.round(x)); st.mon.hp = Math.max(0, st.mon.hp - d); return d; };
    ev.k = f.k;
    switch (f.k) {
      case 'dmg': case 'area':
        if (ev.rel === 'weak') ev.dmg = hit(spell.power * mult);
        else if (ev.rel === 'heal') { const h = Math.max(1, Math.round(spell.power * S(st.g))); ev.monHeal = Math.min(h, st.mon.max - st.mon.hp); st.mon.hp += ev.monHeal; }
        break;
      case 'multi': ev.dmg = hit(f.hits * f.pw * mult); break;
      case 'shield': st.fx.shields.push({ part: f.part, n: f.n || 1 }); break;
      case 'heal': ev.heal = Math.min(st.hero.max - st.hero.hp, Math.max(1, Math.round(f.n * S(st.g)))); st.hero.hp += ev.heal; break;
      case 'healPart': ev.heal = Math.min(st.hero.max - st.hero.hp, Math.ceil(st.hero.max * f.part)); st.hero.hp += ev.heal; break;
      case 'fullHeal': ev.heal = st.hero.max - st.hero.hp; st.hero.hp = st.hero.max; st.fx.shrink = 0; st.fx.weaken = null; break;
      case 'skip': if (st.mon.boss) { if (!st.fx.bossCtl) { st.fx.skip = Math.max(st.fx.skip, 1); st.fx.bossCtl = true; ev.n = 1; } else ev.k = 'bossResist'; } else { st.fx.skip += f.n; ev.n = f.n; } break;
      case 'buff': st.fx.buff = f.x; ev.x = f.x; break;
      case 'summon': st.fx.summon = { turns: f.turns, pw: f.pw, el: f.el, em: f.em }; break;
      case 'reflect': st.fx.reflect = true; break;
      case 'drain': ev.dmg = hit(f.n * mult); ev.heal = Math.min(st.hero.max - st.hero.hp, ev.dmg); st.hero.hp += ev.heal; break;
      case 'revive': if (!st.fx.reviveUsed) st.fx.revive = true; break;
      case 'halve': { const d = Math.max(1, Math.floor(st.mon.hp * (st.mon.boss ? 1 / 4 : 1 / 2))); st.mon.hp -= d; ev.dmg = d; break; }
      case 'weaken': st.fx.weaken = f.part; break;
      case 'shrink': st.fx.shrink = f.turns; break;
    }
    return ev;
  }
  // the monster's turn: a familiar attacks first; then the monster attacks unless it skips. Returns { familiar, skipped, dmg, reflected, blocked, revived }
  function monsterTurn(st) {
    const ev = {};
    const fam = st.fx.summon;
    if (fam && fam.turns > 0) {
      const rel = fam.el === 'arcane' ? 'weak' : (MON_EL[st.mon.el].weak.includes(fam.el) ? 'weak' : MON_EL[st.mon.el].heal.includes(fam.el) ? 'heal' : 'none');
      ev.familiar = { em: fam.em, rel, dmg: 0 };
      if (rel === 'weak') { ev.familiar.dmg = Math.max(1, Math.round(fam.pw * S(st.g))); st.mon.hp = Math.max(0, st.mon.hp - ev.familiar.dmg); }
      fam.turns--; if (fam.turns <= 0) st.fx.summon = null;
      if (st.mon.hp <= 0) return ev;
    }
    if (st.fx.skip > 0) { st.fx.skip--; ev.skipped = true; return ev; }
    let atk = monAttack(st.g, st.mon.boss), reduced = false;
    if (st.fx.shrink > 0) { atk *= CFG.SHRINK; st.fx.shrink--; reduced = true; }
    if (st.fx.weaken != null) { atk *= st.fx.weaken; st.fx.weaken = null; reduced = true; }
    if (st.fx.reflect) { st.fx.reflect = false; ev.reflected = Math.max(1, Math.round(atk)); st.mon.hp = Math.max(0, st.mon.hp - ev.reflected); return ev; }
    if (st.fx.shields.length) { const s = st.fx.shields[0]; atk *= (1 - s.part); reduced = true; ev.blocked = s.part; if (--s.n <= 0) st.fx.shields.shift(); }
    ev.dmg = reduced ? Math.floor(atk + 1e-9) : Math.round(atk);
    st.hero.hp = Math.max(0, st.hero.hp - ev.dmg);
    if (st.hero.hp <= 0 && st.fx.revive && !st.fx.reviveUsed) { st.fx.revive = false; st.fx.reviveUsed = true; st.hero.hp = Math.ceil(st.hero.max / 2); ev.revived = true; }
    return ev;
  }

  const CB = { CFG, MON_EL, relation, isGood, elemental, S, wizMaxHP, monAttack, cardsFor, canMake, levelFor, pTyp, monsterHP, canBeat, buildSet, newFx, cast, monsterTurn, clamp };
  if (typeof module === 'object' && module.exports) module.exports = CB; else root.CB = CB;
})(typeof globalThis !== 'undefined' ? globalThis : this);
