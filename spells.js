/* Math Wizard: the spell book (spec 02) and the wizard level (spec 03 §5.1).
   Used by the game (index.html), the tests (tests/) and the levels page (debug.html). Needs math.js (ME) for the spell numbers.

   - Every spell has a fixed number (its key). A spell's number never changes, and no two spells have the same value (spec 02 §1).
   - A spell is LEARNED when both gates are open: the math gate (math level ≥ mreq) and the game gate (wizard level ≥ greq of its type).
     Math gate open, game gate closed → SEALED (shown greyed, "Unlocks at wizard level N"). Math gate closed → not shown at all.
   - Effects are data (fx); the fight uses them from step 4. The numbers marked "proposal" are not in the spec yet and wait for the owner.
*/
(function (root) {
  'use strict';
  const ME = root.ME || (typeof require === 'function' ? require('./math.js') : null);

  /* ---- elements and types (spec 02 §2–3) ---- */
  const ELEMENTS = {   // attack elements match monsters; utility elements work the same on every monster
    fire: { em: '🔥', nm: ['Fire', 'אש'] }, water: { em: '💧', nm: ['Water', 'מים'] }, ice: { em: '🧊', nm: ['Ice', 'קרח'] }, light: { em: '✨', nm: ['Light', 'אור'] },
    lightning: { em: '⚡', nm: ['Lightning', 'ברק'] }, stone: { em: '🪨', nm: ['Stone', 'אבן'] },
    wind: { em: '💨', nm: ['Wind', 'רוח'], util: true }, nature: { em: '🌿', nm: ['Nature', 'טבע'], util: true }, shadow: { em: '🌑', nm: ['Shadow', 'צל'], util: true }, arcane: { em: '🔮', nm: ['Arcane', 'קסם'], util: true }
  };
  const TYPES = {   // greq = the wizard level that opens the type
    attack: { greq: 1, em: '⚔️', nm: ['Attack', 'התקפה'] }, defense: { greq: 3, em: '🛡️', nm: ['Defense', 'הגנה'] }, heal: { greq: 5, em: '💚', nm: ['Heal', 'ריפוי'] },
    control: { greq: 8, em: '⏸️', nm: ['Control', 'שליטה'] }, summon: { greq: 10, em: '🐾', nm: ['Summon', 'זימון'] }, buff: { greq: 12, em: '💫', nm: ['Buff', 'חיזוק'] },
    area: { greq: 15, em: '☄️', nm: ['Area', 'פגיעה אזורית'] }, special: { greq: 18, em: '🌟', nm: ['Special', 'מיוחד'] }
  };
  // tiers (spec 02 §5): power, math gate, and the number pattern (×10 of the base digits)
  const TIERS = {
    base: { power: 2, mul: 1, nm: ['Base', 'בסיס'], adj: null },
    strong: { power: 4, mul: 1, nm: ['Strong', 'חזק'], adj: null },
    enhanced: { power: 6, mul: 10, mreq: 7, nm: ['Enhanced', 'מוגבר'], adj: ['Enhanced', 'מוגבר', 'מוגברת'] },
    greater: { power: 10, mul: 100, mreq: 17, nm: ['Greater', 'עליון'], adj: ['Greater', 'עליון', 'עליונה'] },
    enhStrong: { power: 12, mul: 10, mreq: 17, nm: ['Enhanced strong', 'חזק מוגבר'], adj: ['Enhanced', 'מוגבר', 'מוגברת'] },
    legendary: { power: 16, mul: 1000, mreq: 21, nm: ['Legendary', 'אגדי'], adj: ['Legendary', 'אגדי', 'אגדית'] },
    family: { power: 0, mul: 1, nm: ['Special spells', 'כישופים מיוחדים'], adj: null }
  };

  /* ---- the catalog (spec 02 §6) ---- */
  // [number, English, Hebrew, Hebrew gender (m/f, for the tier adjective), element, type, math gate, effect by tier]
  // Effects of utility spells grow with the tier (spec 02 §6.3). Values marked (p) are proposals: the spec gives only 60, 80 and 90.
  const BASE = [
    [1, 'Light Spark', 'ניצוץ אור', 'm', 'light', 'attack', 2],
    [2, 'Water Splash', 'התזת מים', 'f', 'water', 'attack', 1],
    [3, 'Fire Bolt', 'חץ אש', 'm', 'fire', 'attack', 1],
    [4, 'Stone Throw', 'זריקת אבן', 'f', 'stone', 'attack', 1],
    [5, 'Ice Bolt', 'חץ קרח', 'm', 'ice', 'attack', 1],
    [6, 'Wind Shield', 'מגן רוח', 'm', 'wind', 'defense', 2, { base: { k: 'shield', part: 1 / 2 }, enhanced: { k: 'shield', part: 1 }, greater: { k: 'shield', part: 1, n: 2 }, legendary: { k: 'shield', part: 1, n: 3 } }],
    [7, 'Lightning Zap', 'הלם ברק', 'm', 'lightning', 'attack', 2],
    [8, 'Healing Leaf', 'עלה מרפא', 'm', 'nature', 'heal', 2, { base: { k: 'heal', n: 2 }, enhanced: { k: 'heal', n: 4 }, greater: { k: 'heal', n: 6 }, legendary: { k: 'heal', n: 8 } }],
    [9, 'Shadow Snare', 'מלכודת צל', 'f', 'shadow', 'control', 2, { base: { k: 'skip', n: 1 }, enhanced: { k: 'skip', n: 2 }, greater: { k: 'skip', n: 2 }, legendary: { k: 'skip', n: 3 } }]
  ];
  const STRONG = [   // math gate: level 5 (up to 20)
    [11, 'Sunburst', 'פרץ שמש', 'm', 'light', 'attack'],
    [12, 'Tidal Wave', 'גל ענק', 'm', 'water', 'attack'],
    [13, 'Fireball', 'כדור אש', 'm', 'fire', 'attack'],
    [14, 'Rock Slide', 'מפולת סלעים', 'f', 'stone', 'attack'],
    [15, 'Ice Spear', 'חנית קרח', 'f', 'ice', 'attack'],
    [16, 'Arcane Echo', 'הד קסום', 'm', 'arcane', 'buff', { strong: { k: 'buff', x: 2 }, enhStrong: { k: 'buff', x: 3 } }],
    [17, 'Thunderstorm', 'סופת רעמים', 'f', 'lightning', 'attack'],
    [18, 'Meteor Rain', 'גשם מטאורים', 'm', 'stone', 'area', { strong: { k: 'area' }, enhStrong: { k: 'area' } }],
    [19, 'Time Freeze', 'הקפאת זמן', 'f', 'shadow', 'control', { strong: { k: 'skip', n: 2 }, enhStrong: { k: 'skip', n: 3 } }]
  ];
  // new families by grade (spec 02 §6.4): [number text, English, Hebrew, element, type, math gate, effect]
  const FAMILY = [
    ['25', 'Owl Familiar', 'ינשוף מלווה', 'arcane', 'summon', 8, { k: 'summon', turns: 3, pw: 1, el: 'arcane', em: '🦉' }],
    ['55', 'Wolf Familiar', 'זאב מלווה', 'arcane', 'summon', 8, { k: 'summon', turns: 3, pw: 2, el: 'arcane', em: '🐺' }],
    ['99', 'Dragon Familiar', 'דרקון מלווה', 'fire', 'summon', 10, { k: 'summon', turns: 3, pw: 3, el: 'fire', em: '🐉' }],
    ['36', 'Mirror Ward', 'מגן מראה', 'arcane', 'special', 13, { k: 'reflect' }],
    ['49', 'Life Drain', 'יניקת חיים', 'arcane', 'special', 14, { k: 'drain', n: 3 }],
    ['64', 'Chain Lightning', 'ברק משורשר', 'lightning', 'area', 14, { k: 'area' }, 6],
    ['81', 'Phoenix Feather', 'נוצת עוף החול', 'arcane', 'special', 14, { k: 'revive' }],
    ['1/2', 'Half-Moon Hex', 'כישוף חצי הירח', 'arcane', 'special', 25, { k: 'halve' }],
    ['1/4', 'Quarter Heal', 'ריפוי רבע', 'nature', 'heal', 25, { k: 'healPart', part: 1 / 4 }],
    ['3/4', 'Three-Quarter Shield', 'מגן שלושה רבעים', 'wind', 'defense', 25, { k: 'shield', part: 3 / 4 }],
    ['1/3', 'Triple Strike', 'מכה משולשת', 'arcane', 'attack', 26, { k: 'multi', hits: 3, pw: 1 }],
    ['1 1/2', 'Echo and a Half', 'הד וחצי', 'arcane', 'buff', 26, { k: 'buff', x: 1.5 }],
    ['0.1', 'Mist of Tenths', 'ערפל העשיריות', 'shadow', 'control', 28, { k: 'weaken', part: 1 / 10 }],
    ['1/8', 'Shrinking Hex', 'כישוף הכיווץ', 'arcane', 'special', 31, { k: 'shrink', turns: 3 }],
    ['144', 'Starfall', 'מטר כוכבים', 'light', 'area', 34, { k: 'area' }, 6],
    ['360', 'Full Circle', 'מעגל שלם', 'nature', 'heal', 35, { k: 'fullHeal' }]
  ];

  const SPELLS = [], BY_ID = {};
  const add = s => { s.greq = TYPES[s.type].greq; s.id = ME.fmt(s.v); SPELLS.push(s); BY_ID[s.id] = s; };
  const tierName = (en, he, g, tier) => { const a = TIERS[tier].adj; return a ? [`${a[0]} ${en}`, `${he} ${g === 'f' ? a[2] : a[1]}`] : [en, he]; };
  const fxFor = (type, fx, tier) => type === 'attack' ? { k: 'dmg' } : (fx && fx[tier]) || null;
  for (const [n, en, he, g, el, type, mreq, fx] of BASE) {
    add({ v: ME.I(n), nm: [en, he], el, type, tier: 'base', power: TIERS.base.power, mreq, fx: fxFor(type, fx, 'base'), fam: n });
    for (const tier of ['enhanced', 'greater', 'legendary']) add({ v: ME.I(n * TIERS[tier].mul), nm: tierName(en, he, g, tier), el, type, tier, power: TIERS[tier].power, mreq: TIERS[tier].mreq, fx: fxFor(type, fx, tier), fam: n });
  }
  for (const [n, en, he, g, el, type, fx] of STRONG) {
    add({ v: ME.I(n), nm: [en, he], el, type, tier: 'strong', power: TIERS.strong.power, mreq: 5, fx: fxFor(type, fx, 'strong'), fam: n });
    add({ v: ME.I(n * 10), nm: tierName(en, he, g, 'enhStrong'), el, type, tier: 'enhStrong', power: TIERS.enhStrong.power, mreq: TIERS.enhStrong.mreq, fx: fxFor(type, fx, 'enhStrong'), fam: n });
  }
  for (const [txt, en, he, el, type, mreq, fx, power] of FAMILY) add({ v: ME.parse(txt), nm: [en, he], el, type, tier: 'family', power: power || (fx.pw || 0), mreq, fx: type === 'attack' && !fx ? { k: 'dmg' } : fx });
  // spell numbers that are decimals are shown as decimals (0.1), fractions as fractions (½, 1½)
  for (const s of SPELLS) if (s.id.includes('.')) s.v = ME.V(s.v.n, s.v.d, 'dec');

  /* ---- the gates (spec 02 §1) ---- */
  const isMathOpen = (s, mlvl) => mlvl >= s.mreq;
  const isGameOpen = (s, wlvl) => wlvl >= s.greq;
  // the book for a student: learned (both gates open), sealed (math open, wizard closed), and nothing else is shown.
  // known: spells the student learned before (they stay learned even if the math level goes down).
  function book(mlvl, wlvl, known) {
    const k = new Set(known || []), learned = [], sealed = [];
    for (const s of SPELLS) {
      if (k.has(s.id) || (isMathOpen(s, mlvl) && isGameOpen(s, wlvl))) learned.push(s);
      else if (isMathOpen(s, mlvl)) sealed.push(s);
    }
    return { learned, sealed };
  }
  const STARTING = ['2', '3', '4', '5'];   // spec 02 §6.1: a new student starts with these (all of level 1's numbers)
  // the spell an answer casts (matched by value, spec 02 §7): only a learned spell; a sealed or unknown number fizzles
  function cast(value, learnedIds) { const s = SPELLS.find(x => ME.eq(x.v, value)); return s && learnedIds.includes(s.id) ? s : null; }

  /* ---- wizard level (spec 03 §5.1): XP to go from level g to g + 1 = 40 + 20 × g; at most level 30 ---- */
  const MAX_WIZ = 30, xpStep = g => 40 + 20 * g;
  const xpFor = lv => { let x = 0; for (let g = 1; g < lv; g++) x += xpStep(g); return x; };   // the XP at which level lv starts
  const wizLevel = xp => { let lv = 1; while (lv < MAX_WIZ && xp >= xpFor(lv + 1)) lv++; return lv; };

  /* ---- texts for the book (both languages) ---- */
  const TXT = {
    dmg: ['Hurts monsters that are weak to {el}. Power {p}.', 'פוגע במפלצות שחלשות מול {el}. עוצמה {p}.'],
    shieldHalf: ['Halves the next monster attack.', 'מקטין בחצי את ההתקפה הבאה של המפלצת.'],
    shieldFull: ['Blocks the next monster attack.', 'חוסם את ההתקפה הבאה של המפלצת.'],
    shieldN: ['Blocks the next {n} monster attacks.', 'חוסם את {n} ההתקפות הבאות של המפלצת.'],
    shieldPart: ['Blocks {part} of the next monster attack.', 'חוסם {part} מההתקפה הבאה של המפלצת.'],
    heal: ['Heals you by {n}.', 'מרפא אתכם ב־{n}.'], healPart: ['Heals a quarter of your full HP.', 'מרפא רבע מהחיים המלאים שלכם.'], fullHeal: ['Heals you completely and removes bad effects.', 'מרפא אתכם עד הסוף ומסיר השפעות רעות.'],
    skip1: ['The monster skips its next turn. (A boss: once per fight.)', 'המפלצת מפסידה את התור הבא שלה. (בוס: פעם אחת בקרב.)'],
    skipN: ['The monster skips {n} turns. (A boss: one turn, once per fight.)', 'המפלצת מפסידה {n} תורות. (בוס: תור אחד, פעם אחת בקרב.)'],
    buff2: ['Your next spell has double power.', 'לכישוף הבא שלכם יש עוצמה כפולה.'], buff3: ['Your next spell has triple power.', 'לכישוף הבא שלכם יש עוצמה משולשת.'],
    buff15: ['Your next spell has 1½ times the power.', 'לכישוף הבא שלכם יש פי 1½ עוצמה.'],
    area: ['Hits every monster in the fight. Power {p}.', 'פוגע בכל המפלצות בקרב. עוצמה {p}.'],
    summon: ['{em} A familiar fights with you for {t} turns (power {p} each turn{any}).', '{em} חיה מלווה נלחמת לצדכם {t} תורות (עוצמה {p} בכל תור{any}).'],
    anyEl: [', hits every element', ', פוגעת בכל יסוד'],
    reflect: ['Sends the next monster attack back at the monster.', 'מחזיר את ההתקפה הבאה אל המפלצת עצמה.'],
    drain: ['Damage {n} to the monster, and heals you by the same amount.', 'נזק {n} למפלצת, ומרפא אתכם באותה כמות.'],
    revive: ['If your HP reaches 0 in this fight, you come back with half your HP (once per fight).', 'אם החיים שלכם מגיעים ל־0 בקרב הזה, אתם חוזרים עם חצי מהחיים (פעם אחת בקרב).'],
    halve: ['The monster loses half of its HP (a boss: a quarter).', 'המפלצת מאבדת חצי מהחיים שלה (בוס: רבע).'],
    multi: ['{n} hits of power {p}. Hits every element.', '{n} מכות בעוצמה {p}. פוגע בכל יסוד.'],
    weaken: ['The next monster attack deals only a tenth.', 'ההתקפה הבאה של המפלצת פוגעת רק בעשירית.'],
    shrink: ['The monster’s attack is smaller for {n} turns.', 'ההתקפה של המפלצת קטנה יותר במשך {n} תורות.'],
    q34: ['¾', '¾']
  };
  const tt = (k, L, v) => { let s = TXT[k][L === 'he' ? 1 : 0]; for (const [a, b] of Object.entries(v || {})) s = s.split('{' + a + '}').join(b); return s; };
  function describe(s, L) {   // the effect line on the spell's page
    const f = s.fx || {}, i = L === 'he' ? 1 : 0;
    switch (f.k) {
      case 'dmg': return tt('dmg', L, { el: ELEMENTS[s.el].nm[i], p: s.power });
      case 'shield': return f.part < 1 ? (f.part === 0.5 ? tt('shieldHalf', L) : tt('shieldPart', L, { part: TXT.q34[i] })) : f.n ? tt('shieldN', L, { n: f.n }) : tt('shieldFull', L);
      case 'heal': return tt('heal', L, { n: f.n });
      case 'healPart': return tt('healPart', L);
      case 'fullHeal': return tt('fullHeal', L);
      case 'skip': return f.n === 1 ? tt('skip1', L) : tt('skipN', L, { n: f.n });
      case 'buff': return tt(f.x === 2 ? 'buff2' : f.x === 3 ? 'buff3' : 'buff15', L);
      case 'area': return tt('area', L, { p: s.power });
      case 'summon': return tt('summon', L, { em: f.em, t: f.turns, p: f.pw, any: f.el === 'arcane' ? TXT.anyEl[i] : '' });
      case 'reflect': return tt('reflect', L);
      case 'drain': return tt('drain', L, { n: f.n });
      case 'revive': return tt('revive', L);
      case 'halve': return tt('halve', L);
      case 'multi': return tt('multi', L, { n: f.hits, p: f.pw });
      case 'weaken': return tt('weaken', L);
      case 'shrink': return tt('shrink', L, { n: f.turns });
      default: return '';
    }
  }
  // the tabs of the book (spec 02 §8), in reading order
  const TABS = [['base', ['1–9', '1–9']], ['strong', ['11–19', '11–19']], ['enhanced', ['Enhanced', 'מוגברים']], ['greater', ['Greater', 'עליונים']], ['legendary', ['Legendary', 'אגדיים']], ['family', ['Special', 'מיוחדים']]];
  const tabOf = s => s.tier === 'enhStrong' ? 'greater' : s.tier;   // 110–190 sit with the hundreds

  const SB = { ELEMENTS, TYPES, TIERS, SPELLS, BY_ID, STARTING, TABS, tabOf, book, cast, describe, isMathOpen, isGameOpen, MAX_WIZ, xpStep, xpFor, wizLevel };
  if (typeof module === 'object' && module.exports) module.exports = SB; else root.SB = SB;
})(typeof globalThis !== 'undefined' ? globalThis : this);
