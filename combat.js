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
    TWO_GOOD_FROM: 15,                         // two good options (easy + hard) from wizard level 15
    SUPPORT_FROM_CARDS: 4,                     // owner decision: every set of 4+ cards has one support card (a shield or healing), to choose between attacking and defending
    OTHER_UTIL_FROM_CARDS: 5,                  // (p) from 5 cards, one more utility card (control, summon, buff, special) when one is learned
    HARD_MIN_RATIO: 2,                         // the hard card's spell has at least twice the power of the easy card's
    REVIEW: 0.2, WEAK: 0.25,                   // review cards and weak spots (spec 01 §5)
    INCANT_FROM: 5, NUMPAD_FROM: 21,           // the incantation step from math level 5; a number pad (whole numbers and decimals) from level 21
    INCANT_BONUS: 1,                           // owner decision: no power bonus for a right incantation for now (spec 00 §4.1 suggested a small one); 1 = off
    HEART_POT_HEAL: 0.3, REST_HEAL: 0.25,      // Heart potion; a campfire on the path gives back 25% of max HP (owner approved)
    SHRINK: 0.5,                               // Shrinking Hex: the monster's attack is halved for 3 turns (owner approved)
    CONTROL_IN_SUPPORT: 1 / 3,                 // (p) owner decision: a control spell (Shadow Snare, Time Freeze) may take the support card's place; this is how often, when one is learned and HP is not low
    // monster abilities (spec 03 §4): the wizard level that unlocks each one
    ABILITIES: [['armored', 6], ['regen', 9], ['charging', 11], ['shifter', 13], ['group', 15], ['shielded', 18], ['double', 20]],
    ABILITY_CHANCE: [0.3, 0.6], ABILITY_FULL_AT: 20, BOSS_TWO_FROM: 20,   // 30% at the first unlock → 60% at wizard level 20; a boss always has one, two from level 20
    ARMOR_DMG_MULT: 0.5, ARMOR_CASTS: 1, HEAVY_ARMOR_CASTS: 2, HEAVY_ARMOR_FROM: 16, HEAVY_ARMOR_CHANCE: 0.5,   // (p) heavy armor: half of the armors from level 16
    REGEN: 0.1, CHARGE_EVERY: 3, CHARGE_MULT: 3, SHIFT_EVERY: 2,
    GROUP_SIZE: [2, 3], GROUP_HP_EACH: 0.5, GROUP_ATK_EACH: 0.4,          // (p) each monster of a group has half the HP and 40% of the attack of a single monster
    // XP (spec 03 §5.1)
    XP_FIGHT: 10, XP_FIGHT_PERFECT: 5, XP_BOSS: 40, XP_BOSS_PERFECT: 20, XP_CRAFT: 3
  };
  // armor (spec 03 §4.1): the elements that break each armor
  const ARMOR = { bark: { em: '🪵', breaks: ['fire'] }, ice: { em: '🧊', breaks: ['fire', 'light'] }, stone: { em: '🪨', breaks: ['water'] }, iron: { em: '⚙️', breaks: ['lightning'] }, shadow: { em: '🌑', breaks: ['light'] } };
  const OWN = { fire: 'fire', ice: 'ice', dark: 'shadow', plant: 'nature', storm: 'lightning', stone: 'stone' };   // a monster's own spell element (never its armor's breaker)

  /* ---- elements (spec 02 §2) ---- */
  const MON_EL = {
    fire: { weak: ['water', 'ice'], heal: ['fire', 'light'] }, ice: { weak: ['fire', 'light'], heal: ['ice'] }, dark: { weak: ['light', 'lightning'], heal: [] },
    plant: { weak: ['fire', 'lightning'], heal: ['water', 'light'] }, storm: { weak: ['stone', 'ice'], heal: ['lightning', 'water'] }, stone: { weak: ['water', 'lightning'], heal: ['stone'] }
  };
  const elemental = s => s && ['dmg', 'area'].includes((s.fx || {}).k) && !SB.ELEMENTS[s.el].util;   // spells whose effect depends on the monster's element
  // how a spell meets a monster: 'weak' (damage), 'heal' (the monster gets stronger), 'none' (no effect), 'util' (always works), 'fizzle' (no spell),
  // 'break' (an armored monster: the spell hits the armor). mon (optional): the monster's state, for its armor
  const armorUp = mon => !!(mon && mon.armor && mon.armor.hp > 0);
  function relation(spell, monEl, mon) {
    if (!spell) return 'fizzle';
    if (elemental(spell)) {
      if (armorUp(mon) && ARMOR[mon.armor.type].breaks.includes(spell.el)) return 'break';
      const m = MON_EL[monEl]; return m.weak.includes(spell.el) ? 'weak' : m.heal.includes(spell.el) ? 'heal' : 'none';
    }
    if ((spell.fx || {}).k === 'multi') return 'weak';   // Triple Strike (arcane) hits every element
    return 'util';
  }
  const isGood = rel => rel === 'weak' || rel === 'util' || rel === 'break';   // an effective pick (spec 01 §6.1, stage 1)

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

  /* ---- monster abilities (spec 03 §4) ---- */
  const abilitiesAt = g => CFG.ABILITIES.filter(([, w]) => g >= w).map(([k]) => k);
  function abilityChance(g) {
    const first = CFG.ABILITIES[0][1], [a, b] = CFG.ABILITY_CHANCE; if (g < first) return 0;
    return a + (b - a) * Math.min(1, (g - first) / (CFG.ABILITY_FULL_AT - first));
  }
  // armors this monster may wear: never one that breaks with its own element, and only when the student can break it (always winnable)
  const armorsFor = (el, learnedIds, mlvl) => Object.keys(ARMOR).filter(a => !ARMOR[a].breaks.includes(OWN[el]) &&
    learnedIds.some(id => { const s = SB.BY_ID[id]; return s && elemental(s) && ARMOR[a].breaks.includes(s.el) && buildable(s, mlvl); }));
  // o: { g, boss, el, learned, mlvl, rnd } → { ab: [ability keys], armor: armor type or null }
  function rollAbilities(o) {
    const rnd = o.rnd || Math.random, pick = a => a[Math.floor(rnd() * a.length)], armors = armorsFor(o.el, o.learned, o.mlvl);
    let open = abilitiesAt(o.g).filter(k => (k !== 'armored' || armors.length) && (k !== 'shifter' || shiftEls(o.el, o.learned, o.mlvl).length) && !(o.boss && k === 'group'));
    const n = o.boss ? Math.min(open.length, o.g >= CFG.BOSS_TWO_FROM ? 2 : 1) : (open.length && rnd() < abilityChance(o.g) ? 1 : 0), ab = [];
    while (ab.length < n && open.length) {   // armor and shapeshifting never together (the armor is chosen for the element)
      const k = pick(open); ab.push(k); open = open.filter(x => x !== k && !(['armored', 'shifter'].includes(k) && ['armored', 'shifter'].includes(x)));
    }
    return { ab, armor: ab.includes('armored') ? pick(armors) : null };
  }
  // the elements a shapeshifter may change into: ones the student can beat
  const shiftEls = (el, learnedIds, mlvl) => Object.keys(MON_EL).filter(e => e !== el && canBeat(e, learnedIds, mlvl));
  // a fight's monster: o = { g, boss, el, learned, mlvl, ab, armor, rnd } → { hp, max, el, boss, ab, armor, shield, charge, shift, shiftEls, pack }
  // A group (spec 03 §4): the monster in front takes single spells; the others wait in the pack; area spells hit all of them.
  function newMonster(o) {
    const rnd = o.rnd || Math.random, ab = o.ab || [], hp = monsterHP(o.mlvl, o.learned, o.g, o.boss, rnd);
    const m = { hp, max: hp, el: o.el, boss: !!o.boss, ab, armor: null, shield: ab.includes('shielded'), charge: 0, shift: 0, pack: [],
      shiftEls: ab.includes('shifter') ? [o.el].concat(shiftEls(o.el, o.learned, o.mlvl)) : [] };
    if (o.armor) {
      const casts = o.g >= CFG.HEAVY_ARMOR_FROM && rnd() < CFG.HEAVY_ARMOR_CHANCE ? CFG.HEAVY_ARMOR_CASTS : CFG.ARMOR_CASTS;
      const a = Math.max(1, Math.round(casts * pTyp(o.mlvl, o.learned) * S(o.g))); m.armor = { type: o.armor, hp: a, max: a, heavy: casts > 1 };
    }
    if (ab.includes('group')) {
      const n = CFG.GROUP_SIZE[0] + Math.floor(rnd() * (CFG.GROUP_SIZE[1] - CFG.GROUP_SIZE[0] + 1)), each = Math.max(2, Math.round(hp * CFG.GROUP_HP_EACH));
      m.hp = m.max = each; for (let i = 1; i < n; i++) m.pack.push({ hp: each, max: each });
    }
    return m;
  }
  const packLeft = mon => (mon.pack || []).filter(m => m.hp > 0);
  const defeated = st => st.mon.hp <= 0 && !packLeft(st.mon).length;
  function nextFront(st) {   // the front monster of a group fell: the next one steps forward
    if (st.mon.hp > 0) return false; const nx = packLeft(st.mon)[0]; if (!nx) return false;
    st.mon.pack.splice(st.mon.pack.indexOf(nx), 1); st.mon.hp = nx.hp; st.mon.max = nx.max; return true;
  }
  const charging = mon => (mon.ab || []).includes('charging') && mon.charge === CFG.CHARGE_EVERY - 1;   // the next monster turn is the big attack

  /* ---- a card set (spec 00 §3.4, spec 01 §5.2) ---- */
  // o: { mlvl, wlvl, learned (ids), monEl, avoid (Set of recent keys), facts (weak spots), hpLow, hpFull, rnd }
  // returns cards [{ p (the problem, p.src = 'cur' | 'review' | 'hard' | 'weak'), spell (or null), rel, role: 'good' | 'easy' | 'hard' | 'util' | 'trap' | 'fill' }]
  function buildSet(o) {
    const rnd = o.rnd || Math.random, pick = a => a[Math.floor(rnd() * a.length)], mlvl = o.mlvl, n = cardsFor(o.wlvl);
    const learned = o.learned.map(id => SB.BY_ID[id]).filter(Boolean), cards = [], used = [], avoid = new Set(o.avoid || []);
    const taken = v => used.some(u => ME.eq(u, v)), rel = s => relation(s, o.monEl, o.mon);
    const add = (spell, role, level, p) => {
      if (!p) { if (level == null) return false; p = ME.make(level, { target: spell.v, avoid }); if (!p) return false; p = Object.assign({}, p, { src: level < mlvl ? 'review' : role === 'hard' ? 'hard' : 'cur' }); }
      if (taken(p.a)) return false;
      const sp = spell || SB.SPELLS.find(s => ME.eq(s.v, p.a) && o.learned.includes(s.id)) || null;
      used.push(p.a); avoid.add(p.key); cards.push({ p, spell: sp, rel: rel(sp), role }); return true;
    };
    // while an armor is up, the good card breaks it (spec 03 §4.1: first the armor, then the weakness)
    const goodRel = armorUp(o.mon) && learned.some(s => rel(s) === 'break' && buildable(s, mlvl)) ? 'break' : 'weak';
    const weakS = learned.filter(s => rel(s) === goodRel && buildable(s, mlvl));
    const utilS = learned.filter(s => rel(s) === 'util' && buildable(s, mlvl));
    const isSupport = s => s.type === 'defense' || s.type === 'heal';
    const supportS = utilS.filter(s => isSupport(s) && !(o.hpFull && s.type === 'heal')), otherS = utilS.filter(s => !isSupport(s));   // no healing card at full HP
    const badS = learned.filter(s => ['heal', 'none'].includes(rel(s)) && buildable(s, mlvl));
    // 1. the good card(s)
    if (o.wlvl >= CFG.TWO_GOOD_FROM && weakS.length) {   // an easy card (a weaker spell, the level below) and a hard card (a stronger spell, the top of the level)
      const here = weakS.filter(s => canMake(s.v, mlvl)).sort((a, b) => b.power - a.power);
      const hard = here.length ? pick(here.filter(s => s.power === here[0].power)) : pick(weakS);
      add(hard, 'hard', canMake(hard.v, mlvl) ? mlvl : levelFor(hard.v, mlvl, rnd));
      const easy = weakS.filter(s => s !== hard && s.power * CFG.HARD_MIN_RATIO <= hard.power), easyAny = weakS.filter(s => s !== hard);
      const e = easy.length ? pick(easy) : easyAny.length ? pick(easyAny) : null;
      if (e) add(e, 'easy', mlvl > 1 && canMake(e.v, mlvl - 1) ? mlvl - 1 : levelFor(e.v, mlvl, rnd));
    } else {
      for (const s of shuffleBy(weakS, rnd)) if (add(s, 'good', levelFor(s.v, mlvl, rnd))) break;
      if (!cards.length) for (const s of shuffleBy(weakS.concat(utilS), rnd)) if (add(s, 'good', levelFor(s.v, mlvl, rnd))) break;
    }
    // the support card (4+ cards): a shield or healing, so the player chooses between attacking and defending; with low HP healing comes first
    if (n >= CFG.SUPPORT_FROM_CARDS && supportS.length) {
      const heals = supportS.filter(s => s.type === 'heal'), ctl = otherS.filter(s => s.type === 'control');
      const guard = supportS.filter(s => s.type === 'defense').concat(ctl);   // a big attack is coming: a shield or a control spell is the answer
      const pool = o.hpLow && heals.length ? heals : o.charging && guard.length ? guard : ctl.length && rnd() < CFG.CONTROL_IN_SUPPORT ? ctl : supportS;
      for (const s of shuffleBy(pool, rnd)) if (add(s, 'util', levelFor(s.v, mlvl, rnd))) break;
    }
    if (n >= CFG.OTHER_UTIL_FROM_CARDS && otherS.length && cards.length < n - 1) for (const s of shuffleBy(otherS, rnd)) if (add(s, 'util', levelFor(s.v, mlvl, rnd))) break;
    // 2. at least one trap: a spell the monster resists or that heals it, or a number that is no spell (fizzle)
    const fizzleCard = () => { for (let k = 0; k < 30; k++) { const p = ME.next(mlvl, { avoid, noReview: true }); if (!learned.some(s => ME.eq(s.v, p.a)) && add(null, 'trap', null, Object.assign({}, p, { src: 'cur' }))) return true; } return false; };
    const trapSpell = () => { for (const s of shuffleBy(badS, rnd)) if (add(s, 'trap', levelFor(s.v, mlvl, rnd))) return true; return false; };
    if (rnd() < 0.5) { if (!trapSpell()) fizzleCard(); } else if (!fizzleCard()) trapSpell();
    // 3. fill: more traps, sometimes a weak spot (spec 01 §5.4), never a second good option for a beginner
    for (let k = 0; cards.length < n && k < 60; k++) {
      if (o.facts && rnd() < CFG.WEAK) {
        const f = ME.next(mlvl, { facts: o.facts, avoid }); if (f.src === 'weak' || (f.src === 'review' && f.form === 'weak')) {
          const sp = learned.find(s => ME.eq(s.v, f.a));
          if (!isGood(rel(sp)) || o.wlvl >= CFG.TWO_GOOD_FROM) { add(sp || null, 'fill', null, f); continue; }
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
  // cast a spell (or fizzle). bonus: a right incantation. Returns one event: { k, rel, dmg, heal, monHeal, popped, armorHit, armorBroken, … }
  const HITS = ['dmg', 'area', 'multi', 'drain', 'halve'];   // spells that hit the monster
  function cast(st, spell, bonus = 1) {
    const mon = st.mon, ev = { k: 'fizzle', rel: relation(spell, mon.el, mon), spell };
    if (!spell) return ev;
    const f = spell.fx || {}, buff = st.fx.buff; st.fx.buff = 1;   // a buff works on the next spell only
    const mult = S(st.g) * buff * bonus;
    const hitOn = (m, x) => { const d = Math.max(1, Math.round(x * (armorUp(m) ? CFG.ARMOR_DMG_MULT : 1))); m.hp = Math.max(0, m.hp - d); return d; }, hit = x => hitOn(mon, x);   // an armor halves the damage
    const healOn = (m, x) => { const h = Math.min(Math.max(1, Math.round(x)), m.max - m.hp); m.hp += h; return h; };
    ev.k = f.k;
    if (mon.shield && HITS.includes(f.k)) { mon.shield = false; ev.popped = true; return ev; }   // Shielded: the first hit of the fight only breaks the shield
    switch (f.k) {
      case 'dmg': case 'area': {
        if (ev.rel === 'break') { const d = Math.max(1, Math.round(spell.power * mult)); mon.armor.hp = Math.max(0, mon.armor.hp - d); ev.armorHit = d; ev.armorBroken = mon.armor.hp <= 0; }   // the armor absorbs it (never heals)
        else if (ev.rel === 'weak') ev.dmg = hit(spell.power * mult);
        else if (ev.rel === 'heal') ev.monHeal = healOn(mon, spell.power * S(st.g));
        if (f.k === 'area') {   // the rest of a group: the same element rules (they wear no armor)
          const r = relation(spell, mon.el);
          for (const m of packLeft(mon)) { if (r === 'weak') ev.dmg = (ev.dmg || 0) + hitOn(m, spell.power * mult); else if (r === 'heal') ev.monHeal = (ev.monHeal || 0) + healOn(m, spell.power * S(st.g)); }
        }
        break;
      }
      case 'multi': ev.dmg = hit(f.hits * f.pw * mult); break;
      case 'shield': st.fx.shields.push({ part: f.part, n: f.n || 1 }); break;
      case 'heal': ev.heal = Math.min(st.hero.max - st.hero.hp, Math.max(1, Math.round(f.n * S(st.g)))); st.hero.hp += ev.heal; break;
      case 'healPart': ev.heal = Math.min(st.hero.max - st.hero.hp, Math.ceil(st.hero.max * f.part)); st.hero.hp += ev.heal; break;
      case 'fullHeal': ev.heal = st.hero.max - st.hero.hp; st.hero.hp = st.hero.max; st.fx.shrink = 0; st.fx.weaken = null; break;
      case 'skip': if (mon.boss) { if (!st.fx.bossCtl) { st.fx.skip = Math.max(st.fx.skip, 1); st.fx.bossCtl = true; ev.n = 1; } else ev.k = 'bossResist'; } else { st.fx.skip += f.n; ev.n = f.n; } break;
      case 'buff': st.fx.buff = f.x; ev.x = f.x; break;
      case 'summon': st.fx.summon = { turns: f.turns, pw: f.pw, el: f.el, em: f.em }; break;
      case 'reflect': st.fx.reflect = true; break;
      case 'drain': ev.dmg = hit(f.n * mult); ev.heal = Math.min(st.hero.max - st.hero.hp, ev.dmg); st.hero.hp += ev.heal; break;
      case 'revive': if (!st.fx.reviveUsed) st.fx.revive = true; break;
      case 'halve': { const d = Math.max(1, Math.floor(mon.hp * (mon.boss ? 1 / 4 : 1 / 2))); mon.hp -= d; ev.dmg = d; break; }
      case 'weaken': st.fx.weaken = f.part; break;
      case 'shrink': st.fx.shrink = f.turns; break;
    }
    return ev;
  }
  // the monster's turn (spec 03 §4): a familiar attacks first; then the monster (and the rest of its group) attacks, unless it skips.
  // Charging: every 3rd turn the first attack is ×3. Double attack: two attacks. Then a regenerating monster heals and a shapeshifter may change element.
  // Returns { familiar, next, skipped, hits: [{ dmg, blocked, reflected, big }], dmg, blocked, reflected, big, revived, regen, shifted, warn }
  function monsterTurn(st, rnd = Math.random) {
    const ev = { hits: [], dmg: 0 }, mon = st.mon, ab = mon.ab || [], fam = st.fx.summon;
    if (fam && fam.turns > 0) {
      const rel = fam.el === 'arcane' ? 'weak' : (MON_EL[mon.el].weak.includes(fam.el) ? 'weak' : MON_EL[mon.el].heal.includes(fam.el) ? 'heal' : 'none');
      ev.familiar = { em: fam.em, rel, dmg: 0 };
      if (rel === 'weak') { ev.familiar.dmg = Math.max(1, Math.round(fam.pw * S(st.g))); mon.hp = Math.max(0, mon.hp - ev.familiar.dmg); }
      fam.turns--; if (fam.turns <= 0) st.fx.summon = null;
      if (mon.hp <= 0) { if (!nextFront(st)) return ev; ev.next = true; }
    }
    let big = false;
    if (ab.includes('charging') && ++mon.charge >= CFG.CHARGE_EVERY) { big = true; mon.charge = 0; }   // a big attack lost to a control spell is lost
    if (st.fx.skip > 0) { st.fx.skip--; ev.skipped = true; }
    else {
      const base = monAttack(st.g, mon.boss), each = ab.includes('group') ? Math.max(1, base * CFG.GROUP_ATK_EACH) : base, atks = [];
      for (let i = 0; i < (ab.includes('double') ? 2 : 1); i++) atks.push(each * (big && i === 0 ? CFG.CHARGE_MULT : 1));
      for (let i = 0; i < packLeft(mon).length; i++) atks.push(each);
      if (big) ev.big = true;
      let mult = 1, reducedAll = false;
      if (st.fx.shrink > 0) { mult *= CFG.SHRINK; st.fx.shrink--; reducedAll = true; }
      if (st.fx.weaken != null) { mult *= st.fx.weaken; st.fx.weaken = null; reducedAll = true; }
      for (let i = 0; i < atks.length; i++) {
        let a = atks[i] * mult, reduced = reducedAll; const h = big && i === 0 ? { big: true } : {};
        if (st.fx.reflect) { st.fx.reflect = false; h.reflected = Math.max(1, Math.round(a)); mon.hp = Math.max(0, mon.hp - h.reflected); ev.reflected = (ev.reflected || 0) + h.reflected; ev.hits.push(h); continue; }
        if (st.fx.shields.length) { const s = st.fx.shields[0]; a *= (1 - s.part); reduced = true; h.blocked = s.part; if (ev.blocked == null) ev.blocked = s.part; if (--s.n <= 0) st.fx.shields.shift(); }
        h.dmg = reduced ? Math.floor(a + 1e-9) : Math.round(a);
        st.hero.hp = Math.max(0, st.hero.hp - h.dmg); ev.dmg += h.dmg; ev.hits.push(h);
        if (st.hero.hp <= 0 && st.fx.revive && !st.fx.reviveUsed) { st.fx.revive = false; st.fx.reviveUsed = true; st.hero.hp = Math.ceil(st.hero.max / 2); ev.revived = true; }
        if (st.hero.hp <= 0) break;
      }
    }
    if (mon.hp <= 0 && nextFront(st)) ev.next = true;
    if (mon.hp > 0 && ab.includes('regen')) { const h = Math.min(mon.max - mon.hp, Math.max(1, Math.round(mon.max * CFG.REGEN))); if (h > 0) { mon.hp += h; ev.regen = h; } }
    if (mon.hp > 0 && ab.includes('shifter') && ++mon.shift >= CFG.SHIFT_EVERY) {
      mon.shift = 0; const opts = (mon.shiftEls || []).filter(e => e !== mon.el); if (opts.length) { mon.el = opts[Math.floor(rnd() * opts.length)]; ev.shifted = mon.el; }
    }
    ev.warn = charging(mon);
    return ev;
  }

  const CB = { CFG, MON_EL, ARMOR, relation, isGood, elemental, S, wizMaxHP, monAttack, cardsFor, canMake, levelFor, pTyp, monsterHP, canBeat,
    abilitiesAt, abilityChance, armorsFor, rollAbilities, newMonster, packLeft, defeated, nextFront, charging, armorUp, buildSet, newFx, cast, monsterTurn, clamp };
  if (typeof module === 'object' && module.exports) module.exports = CB; else root.CB = CB;
})(typeof globalThis !== 'undefined' ? globalThis : this);
