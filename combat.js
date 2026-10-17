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
    // step 6 tuning (tools/sim.html, proposals): the spec's boss ×3 HP / ×2 attack and +1 attack every 6 levels made the runs too hard
    MON_ATK_BASE: 1, MON_ATK_EVERY: 8, BOSS_HP_MULT: 2, BOSS_ATK_MULT: 1.5,
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
    // owner decisions (step 5 check): shapeshifter from 9, magic shield from 13 and regenerating from 17 (when strong spells are on the cards every turn)
    ABILITIES: [['armored', 6], ['shifter', 9], ['charging', 11], ['shielded', 13], ['group', 15], ['regen', 17], ['double', 20]],
    TRAITS: { charging: 0.25, shielded: 0.2 },   // (p) on top of any ability: the chance that a monster charges / carries a magic shield (from their level; never in a group)
    ABILITY_CHANCE: [0.3, 0.6], ABILITY_FULL_AT: 20, BOSS_TWO_FROM: 20,   // 30% at the first unlock → 60% at wizard level 20; a boss always has one, two from level 20
    ARMOR_DMG_MULT: 0.5, ARMOR_LAYERS: 2, HEAVY_ARMOR_LAYERS: 3, HEAVY_ARMOR_FROM: 16, HEAVY_ARMOR_CHANCE: 0.5,   // owner decision: an armor holds for at least 2 breaking hits (layers); heavy: 3 (half of the armors from level 16)
    REGEN: 0.1, REGEN_BOSS: 0.05, CHARGE_EVERY: 3,   // (p) step 6: a regenerating boss heals 5% (it has twice the HP)
    CHARGE_MULT: 3, SHIFT_EVERY: 2,
    GROUP_SIZE: [2, 3], GROUP_HP_EACH: 0.8, GROUP_ATK_EACH: 1,            // owner decisions: each monster of a group has 80% of a single monster's HP, and attacks as hard as one
    DRAGON_SHARE: 0.5,                                                     // owner decision: each Dragon breath deals half of a typical good cast (P_typ × S) to every monster
    GROUP_CASTS: 2,                                                        // owner decision: in a group fight the student casts 2 spells every turn
    STORM_CHANCE: 0.08,                                                    // spec 08 §1a: the rare spell Meteor Storm is on a card set this often (about 1 card in 40), and never in two sets of one fight
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
  const isStorm = s => !!(s && s.fx && s.fx.storm);   // Meteor Storm (spec 08 §1a): it hits every monster, so it is always an effective pick (the power differs: see cast)
  function relation(spell, monEl, mon) {
    if (!spell) return 'fizzle';
    if (isStorm(spell)) return 'weak';
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
  // From wizard level 15 the cards offer two good spells (spec 03 §2): the strongest one the cards can make (hard) and a weaker one (easy);
  // then P_typ is their average, so the hard card ends a fight in about 2 casts and the easy one takes longer (step 6 tuning).
  function pTyp(mlvl, learnedIds, g = 1) {
    const atk = learnedIds.map(id => SB.BY_ID[id]).filter(s => s && elemental(s) && !isStorm(s) && s.power > 0);   // (the rare spell does not set the monsters' HP)
    if (g >= CFG.TWO_GOOD_FROM) {
      const can = atk.filter(s => buildable(s, mlvl)); if (can.length) {
        const top = Math.max(...can.map(s => s.power)), easy = can.filter(s => s.power * CFG.HARD_MIN_RATIO <= top), e = easy.length ? easy : can;
        return (top + e.reduce((a, s) => a + s.power, 0) / e.length) / 2;
      }
    }
    let use = atk.filter(s => canMake(s.v, mlvl)); if (!use.length) use = atk.filter(s => buildable(s, mlvl)); if (!use.length) use = atk;
    return use.length ? use.reduce((a, s) => a + s.power, 0) / use.length : 2;
  }
  function monsterHP(mlvl, learnedIds, g, boss, rnd = Math.random) {
    const base = CFG.MON_HITS * pTyp(mlvl, learnedIds, g) * S(g), spread = 1 + CFG.MON_HP_SPREAD * (rnd() * 2 - 1);
    return Math.max(3, Math.round(base * spread * (boss ? CFG.BOSS_HP_MULT : 1)));
  }
  // always winnable (spec 03 §3.4): the student has at least one learned spell that hurts a monster of this element, and the cards can offer it
  const canBeat = (monEl, learnedIds, mlvl) => learnedIds.some(id => { const s = SB.BY_ID[id]; return s && !isStorm(s) && relation(s, monEl) === 'weak' && buildable(s, mlvl); });   // (the rare spell is not what makes a fight winnable)

  /* ---- monster abilities (spec 03 §4, with the owner's step 5 changes) ---- */
  // A monster has at most one main ability (a boss: one, two from wizard level 20). The traits (charging, magic shield) come on top, by chance,
  // on any monster from their level (owner decision), but never in a group.
  const unlocked = (k, g) => CFG.ABILITIES.some(([a, w]) => a === k && g >= w);
  const abilitiesAt = g => CFG.ABILITIES.filter(([, w]) => g >= w).map(([k]) => k);
  function abilityChance(g) {
    const first = CFG.ABILITIES[0][1], [a, b] = CFG.ABILITY_CHANCE; if (g < first) return 0;
    return a + (b - a) * Math.min(1, (g - first) / (CFG.ABILITY_FULL_AT - first));
  }
  // armors this monster may wear: never one that breaks with its own element, and only when the student can break it (always winnable)
  const armorsFor = (el, learnedIds, mlvl) => Object.keys(ARMOR).filter(a => !ARMOR[a].breaks.includes(OWN[el]) &&
    learnedIds.some(id => { const s = SB.BY_ID[id]; return s && elemental(s) && !isStorm(s) && ARMOR[a].breaks.includes(s.el) && buildable(s, mlvl); }));
  // the elements a shapeshifter may change into: ones the student can beat
  const shiftEls = (el, learnedIds, mlvl) => Object.keys(MON_EL).filter(e => e !== el && canBeat(e, learnedIds, mlvl));
  // a group's elements: 2–3 monsters the student can beat, at least two of them weak to the same element the student can cast (null: no group possible)
  function groupEls(learnedIds, mlvl, rnd = Math.random) {
    const atkEls = [...new Set(learnedIds.map(id => SB.BY_ID[id]).filter(s => s && elemental(s) && buildable(s, mlvl)).map(s => s.el))];
    const beat = Object.keys(MON_EL).filter(e => canBeat(e, learnedIds, mlvl));
    const shared = atkEls.map(w => beat.filter(e => MON_EL[e].weak.includes(w))).filter(es => es.length >= 2);
    if (!shared.length) return null;
    const els = shuffleBy(shared[Math.floor(rnd() * shared.length)], rnd).slice(0, 2);
    const n = CFG.GROUP_SIZE[0] + Math.floor(rnd() * (CFG.GROUP_SIZE[1] - CFG.GROUP_SIZE[0] + 1));
    while (els.length < n) els.push(beat[Math.floor(rnd() * beat.length)]);
    return shuffleBy(els, rnd);
  }
  // o: { g, boss, el, learned, mlvl, rnd } → { ab: [ability keys], armor: armor type or null }
  function rollAbilities(o) {
    const rnd = o.rnd || Math.random, pick = a => a[Math.floor(rnd() * a.length)], armors = armorsFor(o.el, o.learned, o.mlvl);
    let open = abilitiesAt(o.g).filter(k => !(k in CFG.TRAITS) && (k !== 'armored' || armors.length) && (k !== 'shifter' || shiftEls(o.el, o.learned, o.mlvl).length)
      && (k !== 'group' || (!o.boss && groupEls(o.learned, o.mlvl, rnd))) && !(o.boss && k === 'double'));   // (p) step 6: a boss never attacks twice (it already hits harder)
    const n = o.boss ? Math.min(open.length, o.g >= CFG.BOSS_TWO_FROM ? 2 : 1) : (open.length && rnd() < abilityChance(o.g) ? 1 : 0), ab = [];
    while (ab.length < n && open.length) {   // armor and shapeshifting never together (the armor is chosen for the element)
      const k = pick(open); ab.push(k); open = open.filter(x => x !== k && !(['armored', 'shifter'].includes(k) && ['armored', 'shifter'].includes(x)));
    }
    if (!ab.includes('group')) for (const k of Object.keys(CFG.TRAITS)) if (unlocked(k, o.g) && rnd() < CFG.TRAITS[k]) ab.push(k);
    return { ab, armor: ab.includes('armored') ? pick(armors) : null };
  }
  // a fight's monster: o = { g, boss, el, learned, mlvl, ab, armor, rnd } → { hp, max, el, boss, ab, armor, shield, charge, shift, shiftEls, skip }
  // A group member has a share of a single monster's HP (GROUP_HP_EACH).
  function newMonster(o) {
    const rnd = o.rnd || Math.random, ab = o.ab || [], hp0 = monsterHP(o.mlvl, o.learned, o.g, o.boss, rnd);
    const hp = ab.includes('group') ? Math.max(2, Math.round(hp0 * CFG.GROUP_HP_EACH)) : hp0;
    const m = { hp, max: hp, el: o.el, boss: !!o.boss, ab, armor: null, shield: ab.includes('shielded'), charge: 0, shift: 0, skip: 0,
      shiftEls: ab.includes('shifter') ? [o.el].concat(shiftEls(o.el, o.learned, o.mlvl)) : [] };
    if (o.armor) { const n = o.g >= CFG.HEAVY_ARMOR_FROM && rnd() < CFG.HEAVY_ARMOR_CHANCE ? CFG.HEAVY_ARMOR_LAYERS : CFG.ARMOR_LAYERS; m.armor = { type: o.armor, hp: n, max: n, heavy: n > CFG.ARMOR_LAYERS }; }
    return m;
  }
  // the fight's monsters: st.foes (one, or a group side by side) and st.mon, the one the student aims at
  const foesOf = st => st.foes || [st.mon];
  const alive = st => foesOf(st).filter(f => f.hp > 0);
  const defeated = st => !alive(st).length;
  function retarget(st, i) {   // aim at monster i; or, when the target fell, at the first one still standing. true = the target changed
    const fs = foesOf(st);
    if (i != null) { if (fs[i] && fs[i].hp > 0 && fs[i] !== st.mon) { st.mon = fs[i]; return true; } return false; }
    if (st.mon.hp > 0) return false; const a = alive(st)[0]; if (!a) return false; st.mon = a; return true;
  }
  const charging = mon => (mon.ab || []).includes('charging') && mon.charge === CFG.CHARGE_EVERY - 1;   // the next monster turn is the big attack

  /* ---- a card set (spec 00 §3.4, spec 01 §5.2) ---- */
  // o: { mlvl, wlvl, learned (ids), monEl, mon (the target's state), foes (a group's monsters), avoid (Set of recent keys), facts (weak spots), hpLow, hpFull, charging, rnd }
  // returns cards [{ p (the problem, p.src = 'cur' | 'review' | 'hard' | 'weak'), spell (or null), rel, role: 'good' | 'easy' | 'hard' | 'util' | 'trap' | 'fill' }]
  // In a group a card's rel is its best effect on any monster still standing (an area spell that hurts one of them is good).
  const RANK = { weak: 5, break: 4, util: 3, none: 2, heal: 1, fizzle: 0 };
  function buildSet(o) {
    const rnd = o.rnd || Math.random, pick = a => a[Math.floor(rnd() * a.length)], mlvl = o.mlvl, n = cardsFor(o.wlvl);
    const learned = o.learned.map(id => SB.BY_ID[id]).filter(Boolean), cards = [], used = [], avoid = new Set(o.avoid || []);
    const fs = (o.foes || []).filter(f => f.hp > 0), group = fs.length > 1;
    const taken = v => used.some(u => ME.eq(u, v));
    const rel = s => group ? fs.map(f => relation(s, f.el, f)).sort((a, b) => RANK[b] - RANK[a])[0] : relation(s, o.monEl, o.mon);
    const add = (spell, role, level, p) => {
      if (!p) { if (level == null) return false; p = ME.make(level, { target: spell.v, avoid }); if (!p) return false; p = Object.assign({}, p, { src: level < mlvl ? 'review' : role === 'hard' ? 'hard' : 'cur' }); }
      if (taken(p.a)) return false;
      const sp = spell || SB.SPELLS.find(s => ME.eq(s.v, p.a) && o.learned.includes(s.id)) || null;
      used.push(p.a); avoid.add(p.key); cards.push({ p, spell: sp, rel: rel(sp), role }); return true;
    };
    // while an armor is up, the good card breaks it (spec 03 §4.1: first the armor, then the weakness)
    const goodRel = !group && armorUp(o.mon) && learned.some(s => rel(s) === 'break' && buildable(s, mlvl)) ? 'break' : 'weak';
    const weakS = learned.filter(s => !isStorm(s) && rel(s) === goodRel && buildable(s, mlvl));   // (the rare spell comes on its own chance, below)
    const utilS = learned.filter(s => rel(s) === 'util' && buildable(s, mlvl));
    const isSupport = s => s.type === 'defense' || s.type === 'heal';
    const supportS = utilS.filter(s => isSupport(s) && !(o.hpFull && s.type === 'heal')), otherS = utilS.filter(s => !isSupport(s));   // no healing card at full HP
    const badS = learned.filter(s => ['heal', 'none'].includes(rel(s)) && buildable(s, mlvl));
    // 1. the good card(s)
    if (o.wlvl >= CFG.TWO_GOOD_FROM && weakS.length) {   // an easy card (a weaker spell, the level below) and a hard card (a stronger spell, the top of the level)
      // the hard card: the strongest good spell the cards can make (from the student's own level when it has one of that power, else from review);
      // at the fraction levels the level's own good spells are small (½, ⅓), so the strong spell comes from an earlier level
      const top = Math.max(...weakS.map(s => s.power)), strongest = weakS.filter(s => s.power === top), here = strongest.filter(s => canMake(s.v, mlvl));
      const hard = pick(here.length ? here : strongest);
      add(hard, 'hard', canMake(hard.v, mlvl) ? mlvl : levelFor(hard.v, mlvl, rnd));
      const easy = weakS.filter(s => s !== hard && s.power * CFG.HARD_MIN_RATIO <= hard.power), easyAny = weakS.filter(s => s !== hard);
      const e = easy.length ? pick(easy) : easyAny.length ? pick(easyAny) : null;
      if (e) add(e, 'easy', mlvl > 1 && canMake(e.v, mlvl - 1) ? mlvl - 1 : levelFor(e.v, mlvl, rnd));
    } else {   // the good card's spell: one of the student's own level (about 80%) or an earlier one (review), like the monster's HP (P_typ) expects
      const here = weakS.filter(s => canMake(s.v, mlvl)), back = weakS.filter(s => !canMake(s.v, mlvl));
      const pool = here.length && (!back.length || rnd() >= CFG.REVIEW) ? here : back.length ? back : weakS;
      for (const s of shuffleBy(pool, rnd)) if (add(s, 'good', levelFor(s.v, mlvl, rnd))) break;
      for (const s of shuffleBy(weakS, rnd)) if (!cards.length && add(s, 'good', levelFor(s.v, mlvl, rnd))) break;
      if (!cards.length) for (const s of shuffleBy(weakS.concat(utilS), rnd)) if (add(s, 'good', levelFor(s.v, mlvl, rnd))) break;
    }
    // a group: an area spell (the one that hurts the most monsters), then a good card for every monster (by element) that no card hurts yet
    if (group && !cards.some(c => c.spell && c.spell.fx.k === 'area')) {
      const hurts = s => fs.filter(f => relation(s, f.el, f) === 'weak').length;
      const areaS = learned.filter(s => s.fx.k === 'area' && !isStorm(s) && hurts(s) > 0 && buildable(s, mlvl)), best = Math.max(0, ...areaS.map(hurts));
      for (const s of shuffleBy(areaS.filter(s => hurts(s) === best), rnd)) if (add(s, 'good', levelFor(s.v, mlvl, rnd))) break;
    }
    if (group) for (const f of fs) {
      if (cards.length >= n - 1 || cards.some(c => relation(c.spell, f.el, f) === 'weak')) continue;
      const mine = learned.filter(s => !isStorm(s) && relation(s, f.el, f) === 'weak' && buildable(s, mlvl));
      for (const s of shuffleBy(mine, rnd)) if (add(s, 'good', levelFor(s.v, mlvl, rnd))) break;
    }
    // the support card (4+ cards): a shield or healing, so the player chooses between attacking and defending; with low HP healing comes first
    if (n >= CFG.SUPPORT_FROM_CARDS && supportS.length && cards.length < n - 1) {
      const heals = supportS.filter(s => s.type === 'heal'), ctl = otherS.filter(s => s.type === 'control');
      const guard = supportS.filter(s => s.type === 'defense').concat(ctl);   // a big attack is coming: a shield or a control spell is the answer
      const pool = o.hpLow && heals.length ? heals : o.charging && guard.length ? guard : ctl.length && rnd() < CFG.CONTROL_IN_SUPPORT ? ctl : supportS;
      for (const s of shuffleBy(pool, rnd)) if (add(s, 'util', levelFor(s.v, mlvl, rnd))) break;
    }
    if (n >= CFG.OTHER_UTIL_FROM_CARDS && otherS.length && cards.length < n - 1) for (const s of shuffleBy(otherS, rnd)) if (add(s, 'util', levelFor(s.v, mlvl, rnd))) break;
    // the rare spell (spec 08 §1a): Meteor Storm, on one card of a set now and then, and never in two sets of one fight (o.stormSeen)
    const storm = learned.find(s => isStorm(s) && buildable(s, mlvl));
    if (storm && !o.stormSeen && cards.length < n - 1 && rnd() < CFG.STORM_CHANCE) add(storm, 'good', levelFor(storm.v, mlvl, rnd));
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
  // st = { g (wizard level), hero: { hp, max }, foes: [monsters], mon (the target, one of foes), fx: { … } }
  const newFx = () => ({ shields: [], buff: 1, summon: null, reflect: false, revive: false, reviveUsed: false, weaken: null, shrink: 0, bossCtl: false });
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // cast a spell (or fizzle) at the target; an area spell hits every monster still standing. bonus: a right incantation.
  // Returns { k, rel, dmg, heal, monHeal, popped, armorHit, armorBroken, per: [{ i, rel, dmg, monHeal, popped, armorHit, armorBroken }] (an area spell: each monster), … }
  const HITS = ['dmg', 'area', 'multi', 'drain', 'halve'];   // spells that hit a monster
  function cast(st, spell, bonus = 1) {
    const mon = st.mon, fs = foesOf(st), ev = { k: 'fizzle', rel: relation(spell, mon.el, mon), spell };
    if (!spell) return ev;
    const f = spell.fx || {}, buff = st.fx.buff; st.fx.buff = 1;   // a buff works on the next spell only
    if (buff > 1) ev.buffed = buff;   // (the screen shows the boosted spell with its echo)
    const mult = S(st.g) * buff * bonus;
    const hitOn = (m, x) => { const d = Math.max(1, Math.round(x * (armorUp(m) ? CFG.ARMOR_DMG_MULT : 1))); m.hp = Math.max(0, m.hp - d); return d; }, hit = x => hitOn(mon, x);   // an armor halves the damage
    const healOn = (m, x) => { const h = Math.min(Math.max(1, Math.round(x)), m.max - m.hp); m.hp += h; return h; };
    const strike = m => {   // an attack spell meets one monster: a magic shield, an armor layer, damage, healing, or nothing
      const r = relation(spell, m.el, m), o = { i: fs.indexOf(m), rel: r };
      if (m.shield) { m.shield = false; o.popped = true; }   // Shielded: the first hit only breaks the shield
      else if (r === 'break') { m.armor.hp -= 1; o.armorHit = 1; o.armorBroken = m.armor.hp <= 0; }   // the armor absorbs it (one layer, never heals)
      else if (r === 'weak') o.dmg = hitOn(m, spell.power * mult);   // (Meteor Storm is full power on every monster, whatever its element: its relation is always 'weak')
      else if (r === 'heal') o.monHeal = healOn(m, spell.power * S(st.g));
      return o;
    };
    ev.k = f.k;
    if (f.k === 'area') {
      ev.per = alive(st).map(strike);
      ev.rel = ev.per.map(o => o.rel).sort((a, b) => RANK[b] - RANK[a])[0] || ev.rel;
      for (const o of ev.per) { if (o.dmg) ev.dmg = (ev.dmg || 0) + o.dmg; if (o.monHeal) ev.monHeal = (ev.monHeal || 0) + o.monHeal; if (o.popped) ev.popped = true; if (o.armorHit) { ev.armorHit = 1; ev.armorBroken = ev.armorBroken || o.armorBroken; } }
      return ev;
    }
    if (mon.shield && HITS.includes(f.k)) { mon.shield = false; ev.popped = true; return ev; }
    switch (f.k) {
      case 'dmg': Object.assign(ev, strike(mon)); delete ev.i; break;
      case 'multi': ev.dmg = hit(f.hits * f.pw * mult); break;
      case 'shield': st.fx.shields.push({ part: f.part, n: f.n || 1 }); break;
      case 'heal': ev.heal = Math.min(st.hero.max - st.hero.hp, Math.max(1, Math.round(f.n * S(st.g)))); st.hero.hp += ev.heal; break;
      case 'healPart': ev.heal = Math.min(st.hero.max - st.hero.hp, Math.ceil(st.hero.max * f.part)); st.hero.hp += ev.heal; break;
      case 'fullHeal': ev.heal = st.hero.max - st.hero.hp; st.hero.hp = st.hero.max; st.fx.shrink = 0; st.fx.weaken = null; break;
      case 'skip': {   // Shadow Snare holds the target; Time Freeze (all) every monster. A boss: one turn at most, once per fight
        const ts = f.all ? alive(st) : [mon]; ev.n = 0;
        for (const m of ts) { if (m.boss) { if (!st.fx.bossCtl) { m.skip = Math.max(m.skip || 0, 1); st.fx.bossCtl = true; ev.n = Math.max(ev.n, 1); } } else { m.skip = (m.skip || 0) + f.n; ev.n = Math.max(ev.n, f.n); } }
        if (!ev.n) ev.k = 'bossResist'; else ev.all = !!f.all && ts.length > 1;
        break;
      }
      case 'buff': st.fx.buff = f.x; ev.x = f.x; break;
      case 'summon': st.fx.summon = { turns: f.turns, pw: f.area && st.ptyp ? st.ptyp * CFG.DRAGON_SHARE : f.pw, el: f.el, em: f.em, area: !!f.area }; break;   // the Dragon: half a typical good cast (st.ptyp) on every monster, each turn
      case 'reflect': st.fx.reflect = true; break;
      case 'drain': ev.dmg = hit(f.n * mult); ev.heal = Math.min(st.hero.max - st.hero.hp, ev.dmg); st.hero.hp += ev.heal; break;
      case 'revive': if (!st.fx.reviveUsed) st.fx.revive = true; break;
      case 'halve': { const d = Math.max(1, Math.floor(mon.hp * (mon.boss ? 1 / 4 : 1 / 2))); mon.hp -= d; ev.dmg = d; break; }
      case 'weaken': st.fx.weaken = f.part; break;
      case 'shrink': st.fx.shrink = f.turns; break;
    }
    return ev;
  }
  // the monsters' turn (spec 03 §4): a familiar attacks the target first; then every monster still standing attacks, one after the other, unless it is held.
  // Charging: every 3rd turn its first attack is ×3. Double attack: two attacks. Then regenerating monsters heal and shapeshifters may change element.
  // Returns { hpBefore, familiar, next, skipped, skips: [i], hits: [{ who, dmg, blocked, reflected, big, hp (the wizard's HP after this hit) }], dmg, blocked, reflected, big, revived, regen, regens: [{ i, h }], shifted, shifts: [{ i, el }], warn }
  function monsterTurn(st, rnd = Math.random) {
    const ev = { hits: [], dmg: 0, skips: [], regens: [], shifts: [], hpBefore: st.hero.hp }, fs = foesOf(st), fam = st.fx.summon;
    if (fam && fam.turns > 0) {
      // a familiar attacks the target; the Dragon breathes on every monster (area, owner decision). hits: [{ i, dmg }]
      const famRel = m => fam.el === 'arcane' ? 'weak' : (MON_EL[m.el].weak.includes(fam.el) ? 'weak' : MON_EL[m.el].heal.includes(fam.el) ? 'heal' : 'none');
      const tg = fam.area ? alive(st) : [st.mon], mon = st.mon;
      ev.familiar = { em: fam.em, rel: famRel(mon), dmg: 0, i: fs.indexOf(mon), area: !!fam.area, hits: [] };
      for (const m of tg) { const h = { i: fs.indexOf(m), dmg: 0 }; if (famRel(m) === 'weak') { h.dmg = Math.max(1, Math.round(fam.pw * S(st.g))); m.hp = Math.max(0, m.hp - h.dmg); } ev.familiar.hits.push(h); ev.familiar.dmg += h.dmg; }
      fam.turns--; if (fam.turns <= 0) st.fx.summon = null;
      if (retarget(st)) ev.next = true;
      if (defeated(st)) return ev;
    }
    let mult = 1, reducedAll = false;   // Shrinking Hex and Mist of Tenths weaken this whole turn
    if (st.fx.shrink > 0) { mult *= CFG.SHRINK; st.fx.shrink--; reducedAll = true; }
    if (st.fx.weaken != null) { mult *= st.fx.weaken; st.fx.weaken = null; reducedAll = true; }
    let down = false;
    for (const m of fs) {
      if (m.hp <= 0 || down) continue;
      const ab = m.ab || [], i = fs.indexOf(m);
      let big = false;
      if (ab.includes('charging') && ++m.charge >= CFG.CHARGE_EVERY) { big = true; m.charge = 0; }   // a big attack lost to a control spell is lost
      if (m.skip > 0) { m.skip--; ev.skips.push(i); continue; }
      const base = monAttack(st.g, m.boss), each = ab.includes('group') ? Math.max(1, base * CFG.GROUP_ATK_EACH) : base;
      for (let k = 0; k < (ab.includes('double') ? 2 : 1); k++) {
        let a = each * (big && k === 0 ? CFG.CHARGE_MULT : 1) * mult, reduced = reducedAll; const h = { who: i };
        if (big && k === 0) { h.big = true; ev.big = true; }
        if (st.fx.reflect) { st.fx.reflect = false; h.reflected = Math.max(1, Math.round(a)); m.hp = Math.max(0, m.hp - h.reflected); ev.reflected = (ev.reflected || 0) + h.reflected; ev.hits.push(h); if (m.hp <= 0) break; continue; }
        if (st.fx.shields.length) { const s = st.fx.shields[0]; a *= (1 - s.part); reduced = true; h.blocked = s.part; if (ev.blocked == null) ev.blocked = s.part; if (--s.n <= 0) st.fx.shields.shift(); }
        h.dmg = reduced ? Math.floor(a + 1e-9) : Math.round(a);
        st.hero.hp = Math.max(0, st.hero.hp - h.dmg); ev.dmg += h.dmg; ev.hits.push(h);
        if (st.hero.hp <= 0 && st.fx.revive && !st.fx.reviveUsed) { st.fx.revive = false; st.fx.reviveUsed = true; st.hero.hp = Math.ceil(st.hero.max / 2); ev.revived = true; h.revived = true; }
        h.hp = st.hero.hp;
        if (st.hero.hp <= 0) { down = true; break; }
      }
    }
    ev.skipped = ev.skips.length > 0 && !ev.hits.length;
    for (const m of fs) {
      if (m.hp <= 0) continue; const ab = m.ab || [], i = fs.indexOf(m);
      if (ab.includes('regen')) { const h = Math.min(m.max - m.hp, Math.max(1, Math.round(m.max * (m.boss ? CFG.REGEN_BOSS : CFG.REGEN)))); if (h > 0) { m.hp += h; ev.regens.push({ i, h }); ev.regen = (ev.regen || 0) + h; } }
      if (ab.includes('shifter') && ++m.shift >= CFG.SHIFT_EVERY) {
        m.shift = 0; const opts = (m.shiftEls || []).filter(e => e !== m.el); if (opts.length) { m.el = opts[Math.floor(rnd() * opts.length)]; ev.shifts.push({ i, el: m.el }); ev.shifted = m.el; }
      }
    }
    if (retarget(st)) ev.next = true;
    ev.warn = alive(st).some(charging);
    return ev;
  }

  const CB = { CFG, MON_EL, ARMOR, relation, isStorm, isGood, elemental, S, wizMaxHP, monAttack, cardsFor, canMake, levelFor, pTyp, monsterHP, canBeat,
    abilitiesAt, abilityChance, armorsFor, groupEls, rollAbilities, newMonster, foesOf, alive, defeated, retarget, charging, armorUp, buildSet, newFx, cast, monsterTurn, clamp };
  if (typeof module === 'object' && module.exports) module.exports = CB; else root.CB = CB;
})(typeof globalThis !== 'undefined' ? globalThis : this);
