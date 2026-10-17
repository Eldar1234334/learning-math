/* Math Wizard: the Home room (spec 13). No screen code: the game (index.html) draws the room; the tests check the rules.
   The Home is a room of FIXED PLACES (slots). Each slot holds one item of one kind; the student buys items (tiers follow the Academy rank, prices are also
   locked by math level) and taps a slot to choose which owned item stands there. Nothing is dragged.
   Needs nothing else (the art is in homeart.js, drawn on demand). */
(function (root) {
  'use strict';

  /* ---- the 18 kinds (spec 13 §3). mode: where it stands. multi: small items that can be bought more than once. pair: bought as a pair. ---- */
  const KINDS = [
    { id: 'sofa', en: 'sofa', he: 'ספה', mode: 'floor' }, { id: 'table', en: 'table', he: 'שולחן', mode: 'floor' }, { id: 'chair', en: 'chairs', he: 'כיסאות', mode: 'floor', pair: true },
    { id: 'desk', en: 'desk', he: 'שולחן כתיבה', mode: 'floor' }, { id: 'bed', en: 'bed', he: 'מיטה', mode: 'floor' }, { id: 'fireplace', en: 'fireplace', he: 'אח', mode: 'floor' },
    { id: 'rug', en: 'rug', he: 'שטיח', mode: 'rug' }, { id: 'window', en: 'window', he: 'חלון', mode: 'wall' }, { id: 'curtains', en: 'curtains', he: 'וילונות', mode: 'wall' },
    { id: 'picture', en: 'picture', he: 'תמונה', mode: 'wall', multi: true }, { id: 'clock', en: 'clock', he: 'שעון', mode: 'wall' }, { id: 'banner', en: 'banner', he: 'דגל', mode: 'wall' },
    { id: 'mirror', en: 'mirror', he: 'מראה', mode: 'wall' }, { id: 'lamp', en: 'lamp', he: 'מנורה', mode: 'floor', multi: true }, { id: 'plant', en: 'plant', he: 'צמח', mode: 'floor', multi: true },
    { id: 'pet', en: 'pet', he: 'חיית מחמד', mode: 'floor' }, { id: 'trinket', en: 'trinket', he: 'קישוט', mode: 'shelf' }, { id: 'light', en: 'ceiling light', he: 'תאורת תקרה', mode: 'ceiling' }
  ];
  const KIND = Object.fromEntries(KINDS.map(k => [k.id, k]));

  /* ---- the fixed places (spec 13 §3.1–3.2): x, y in scene units (x of the width, y of the 80-unit height); b = the size of the item there ---- */
  const SLOTS = [
    { id: 'sofa', kind: 'sofa', x: 71, y: 70, b: 22 }, { id: 'table', kind: 'table', x: 33, y: 76, b: 15 },
    { id: 'chair1', kind: 'chair', x: 23.5, y: 77, b: 7.5, pair: 'chair2' }, { id: 'chair2', kind: 'chair', x: 43, y: 77, b: 7.5, pair: 'chair1' },
    { id: 'desk', kind: 'desk', x: 72, y: 54, b: 15 }, { id: 'deskchair', kind: 'chair', x: 64, y: 59, b: 7 },
    { id: 'bed', kind: 'bed', x: 23, y: 62, b: 19 }, { id: 'fireplace', kind: 'fireplace', x: 33, y: 52, b: 15 },
    { id: 'rug', kind: 'rug', x: 50, y: 70 }, { id: 'window', kind: 'window', x: 51, y: 24, b: 14 }, { id: 'curtains', kind: 'curtains', x: 51, y: 24, b: 20 },
    { id: 'pic1', kind: 'picture', x: 32, y: 14, b: 6.5 }, { id: 'pic2', kind: 'picture', x: 40, y: 14, b: 6.5 }, { id: 'pic3', kind: 'picture', x: 62, y: 14, b: 6.5 },
    { id: 'clock', kind: 'clock', x: 51, y: 11, b: 5.5 }, { id: 'banner', kind: 'banner', x: 71, y: 13, b: 6 }, { id: 'mirror', kind: 'mirror', x: 25, y: 14, b: 6.5 },
    { id: 'lamp1', kind: 'lamp', x: 84, y: 60, b: 5 }, { id: 'lamp2', kind: 'lamp', x: 14, y: 78, b: 5 }, { id: 'tlamp', kind: 'lamp', x: 69, y: 49, b: 3.6 },
    { id: 'plant1', kind: 'plant', x: 86, y: 74, b: 7 }, { id: 'plant2', kind: 'plant', x: 22, y: 52, b: 6 }, { id: 'pet', kind: 'pet', x: 56, y: 76, b: 6 },
    { id: 'trinket1', kind: 'trinket', x: 26, y: 40.2, b: 3.6 }, { id: 'trinket2', kind: 'trinket', x: 31.5, y: 40.2, b: 3.6 }, { id: 'trinket3', kind: 'trinket', x: 37, y: 40.2, b: 3.6 },
    { id: 'light', kind: 'light', x: 50, y: 3, b: 6 }
  ];
  const SLOT = Object.fromEntries(SLOTS.map(s => [s.id, s]));

  /* ---- special places (spec 13 §3.5): open with a reward ---- */
  const SPECIAL = { statue: { test: 5 }, plaque: { level: 5 }, trophies: { level: 15 } };

  /* ---- tiers (spec 13 §4): follow the Academy rank (0 = Apprentice … 5 = High Sorcerer) ---- */
  const TIERS = 6;
  const PRICE = [[0, 15], [20, 60], [60, 150], [150, 350], [350, 700], [700, 1500]];   // copper, a range for each tier (spec 13 §4.2; to be tuned by the simulator)
  const MATH_BY_PRICE = [[60, 1], [150, 8], [350, 17], [1500, 21]];                   // (proposal) the minimum math level by price (spec 13 §4.3)
  const minMath = price => { for (const [up, lv] of MATH_BY_PRICE) if (price <= up) return lv; return 21; };

  /* ---- the tier 0 catalogue: 3 items of each kind (spec 13 §4). v = the variant the art draws. The first plain items of the starting kinds are free and in place. ---- */
  const T0 = {   // kind: [[en, he], [en, he], [en, he]]
    sofa: [['Plain sofa', 'ספה פשוטה'], ['Plain blue sofa', 'ספה כחולה פשוטה'], ['Plain green sofa', 'ספה ירוקה פשוטה']],
    table: [['Plain table', 'שולחן פשוט'], ['Round table', 'שולחן עגול'], ['Long table', 'שולחן ארוך']],
    chair: [['Plain chairs', 'כיסאות פשוטים'], ['Padded chairs', 'כיסאות מרופדים'], ['Stool pair', 'זוג שרפרפים']],
    desk: [['Plain desk', 'שולחן כתיבה פשוט'], ['Desk with a drawer', 'שולחן כתיבה עם מגירה'], ['Small desk', 'שולחן כתיבה קטן']],
    bed: [['Plain bed', 'מיטה פשוטה'], ['Blue bed', 'מיטה כחולה'], ['Bed with a red blanket', 'מיטה עם שמיכה אדומה']],
    fireplace: [['Brick fireplace', 'אח לבנים'], ['Stone fireplace', 'אח אבן'], ['Small fireplace', 'אח קטנה']],
    rug: [['Plain rug', 'שטיח פשוט'], ['Striped rug', 'שטיח פסים'], ['Round rug', 'שטיח עגול']],
    window: [['Plain window', 'חלון פשוט'], ['Round window', 'חלון עגול'], ['Arched window', 'חלון קשת']],
    curtains: [['Plain curtains', 'וילונות פשוטים'], ['Red curtains', 'וילונות אדומים'], ['Green curtains', 'וילונות ירוקים']],
    picture: [['Landscape picture', 'תמונת נוף'], ['Flower picture', 'תמונת פרחים'], ['Star picture', 'תמונת כוכבים']],
    clock: [['Plain clock', 'שעון פשוט'], ['Round clock', 'שעון עגול'], ['Wooden clock', 'שעון עץ']],
    banner: [['Red pennant', 'דגלון אדום'], ['Blue pennant', 'דגלון כחול'], ['Green pennant', 'דגלון ירוק']],
    mirror: [['Plain mirror', 'מראה פשוטה'], ['Round mirror', 'מראה עגולה'], ['Oval mirror', 'מראה אליפטית']],
    lamp: [['Plain lamp', 'מנורה פשוטה'], ['Candle', 'נר'], ['Oil lamp', 'מנורת שמן']],
    plant: [['Small plant', 'צמח קטן'], ['Cactus', 'קקטוס'], ['Fern', 'שרך']],
    pet: [['Pet cushion', 'כרית לחיית מחמד'], ['Cat', 'חתול'], ['Turtle', 'צב']],
    trinket: [['Little vase', 'אגרטל קטן'], ['Stack of books', 'ערימת ספרים'], ['Stone', 'אבן']],
    light: [['Plain ceiling light', 'מנורת תקרה פשוטה'], ['Paper lantern', 'פנס נייר'], ['Round lamp', 'מנורה עגולה']]
  };
  const START_FREE = ['sofa', 'table', 'desk', 'bed', 'rug', 'window'];   // the plain room the student starts with (spec 13 §2.1)
  const ITEMS = {};
  for (const k of KINDS) T0[k.id].forEach((nm, v) => {
    const price = v === 0 ? (START_FREE.includes(k.id) ? 0 : 5) : v === 1 ? 8 : 12;
    ITEMS[`${k.id}_0_${v}`] = { id: `${k.id}_0_${v}`, kind: k.id, tier: 0, v, price: k.pair ? price + 4 : price, en: nm[0], he: nm[1], buy: true };
  });
  const startItem = kind => `${kind}_0_0`;

  /* ---- the Academy's rewards (spec 13 §7): free items with their own art ---- */
  const GIFTS = {
    a_lamp: { kind: 'lamp', en: 'Reading lamp', he: 'מנורת קריאה', test: 1 }, a_ball: { kind: 'trinket', en: 'Crystal ball', he: 'כדור קריסטל', test: 2 },
    a_rug: { kind: 'rug', en: 'Glowing rug', he: 'שטיח זוהר', test: 3 }, a_wheel: { kind: 'picture', en: 'Fraction wheel', he: 'גלגל השברים', test: 4 },
    a_statue: { kind: 'statue', en: 'Golden statue', he: 'פסל זהב', test: 5 }
  };
  for (const [id, g] of Object.entries(GIFTS)) ITEMS[id] = { id, kind: g.kind, tier: g.test, v: 0, price: 0, en: g.en, he: g.he, gift: true };
  const GIFT_OF_OLD = { r_lamp: 'a_lamp', r_ball: 'a_ball', r_rug: 'a_rug', r_wheel: 'a_wheel', r_statue: 'a_statue' };   // the Academy gifts of the free-placement room

  /* ---- the older free-placement decorations: each becomes a collection item of the nearest kind (spec 13 §8 is a new game; the owner chose to keep them) ---- */
  const LEGACY = {
    d_plant: ['plant', 'Plant', 'צמח'], d_candle: ['lamp', 'Candle', 'נר'], d_books: ['trinket', 'Books', 'ספרים'], d_lamp: ['lamp', 'Oil lamp', 'מנורה'], d_cat: ['pet', 'Cat', 'חתול'], d_owl: ['pet', 'Owl', 'ינשוף'],
    d_picture: ['picture', 'Picture', 'תמונה'], d_egg: ['trinket', 'Dragon egg', 'ביצה'], d_clock: ['clock', 'Clock', 'שעון'], d_banner: ['banner', 'Pennant', 'דגל'], d_key: ['trinket', 'Old key', 'מפתח'],
    d_rug: ['rug', 'Rug', 'שטיח'], d_shield: ['picture', 'Shield', 'מגן'], d_chair: ['chair', 'Chair', 'כסא'], d_teddy: ['pet', 'Teddy bear', 'דובי'], d_turtle: ['pet', 'Turtle', 'צב'],
    d_cactus: ['plant', 'Cactus', 'קקטוס'], d_violin: ['picture', 'Violin', 'כנור'], d_scope: ['trinket', 'Telescope', 'טלסקופ'], d_map: ['picture', 'Map', 'מפה'], d_vase: ['trinket', 'Vase', 'אגרטל'], d_mirror: ['mirror', 'Mirror', 'מראה'],
    f_couch: ['sofa', 'Couch', 'ספה'], f_table: ['table', 'Coffee table', 'שולחן סלון'], f_armchair: ['chair', 'Armchair', 'כורסה'], f_bookcase: ['trinket', 'Bookcase', 'ספרייה'], f_fireplace: ['fireplace', 'Fireplace', 'אח'],
    f_bed: ['bed', 'Bed', 'מיטה'], f_floorlamp: ['lamp', 'Floor lamp', 'מנורה עומדת'], f_desk: ['desk', 'Writing desk', 'שולחן כתיבה'], f_piano: ['trinket', 'Piano', 'פסנתר'], f_aquarium: ['pet', 'Aquarium', 'אקווריום']
  };
  for (const [old, [kind, en, he]] of Object.entries(LEGACY)) ITEMS['lg_' + old] = { id: 'lg_' + old, kind, tier: 0, v: 0, price: 0, en, he, legacy: old };

  /* ---- wall and floor colours (spec 13 §3.6): 4 at tier 0, then 2 more for walls and 2 more for floors at each tier (a proposal) ---- */
  // a wall: [id, tier, en, he, top, bottom]; the side walls are derived (darker). A floor: [id, tier, en, he, far, near].
  const WALLS = [
    ['w0', 0, 'Lilac', 'לילך', '#5d4ba3', '#46397f'], ['w1', 0, 'Sage', 'מרווה', '#587a5c', '#41603f'], ['w2', 0, 'Sand', 'חול', '#a38a5c', '#85703f'], ['w3', 0, 'Sky', 'שמיים', '#4a78a8', '#385e88'],
    ['w4', 1, 'Rose clay', 'חימר ורוד', '#a05a6e', '#80445a'], ['w5', 1, 'Teal night', 'טורקיז לילה', '#2f7a80', '#215f66'],
    ['w6', 2, 'Storm grey', 'אפור סערה', '#5a6478', '#434c5e'], ['w7', 2, 'Deep blue', 'כחול עמוק', '#2f4a96', '#233878'],
    ['w8', 3, 'Starry violet', 'סגול כוכבים', '#6a3fa0', '#512f80'], ['w9', 3, 'Silver mist', 'ערפל כסף', '#8b92aa', '#6e7590'],
    ['w10', 4, 'Eclipse black', 'שחור ליקוי', '#24202e', '#17141f'], ['w11', 4, 'Amber dusk', 'ענבר ערב', '#a8693a', '#864f27'],
    ['w12', 5, 'Royal navy', 'כחול מלכותי', '#1d2c6a', '#131f50'], ['w13', 5, 'Gold cream', 'שמנת זהב', '#c8b27a', '#a8935c']
  ].map(([id, tier, en, he, top, bot]) => ({ id, tier, en, he, top, bot }));
  const FLOORS = [
    ['f0', 0, 'Oak', 'אלון', '#8a5a33', '#b98450'], ['f1', 0, 'Pine', 'אורן', '#a37a4a', '#d2a468'], ['f2', 0, 'Walnut', 'אגוז', '#5e3b22', '#8a5a36'], ['f3', 0, 'Slate', 'צפחה', '#575b66', '#7a7f8c'],
    ['f4', 1, 'Red brick', 'לבנים אדומות', '#8a4a3a', '#b06450'], ['f5', 1, 'Dark oak', 'אלון כהה', '#4a3020', '#6e4a30'],
    ['f6', 2, 'Blue stone', 'אבן כחולה', '#4a5f88', '#6a80aa'], ['f7', 2, 'Grey flagstone', 'אבני ריצוף', '#6a6a72', '#8e8e98'],
    ['f8', 3, 'Purple marble', 'שיש סגול', '#5a3f7a', '#7e5ea0'], ['f9', 3, 'Silver tile', 'אריחי כסף', '#7e8498', '#a6acc0'],
    ['f10', 4, 'Black marble', 'שיש שחור', '#26242e', '#3e3a4a'], ['f11', 4, 'Amber wood', 'עץ ענבר', '#9a6030', '#c88848'],
    ['f12', 5, 'Gold inlay', 'שיבוץ זהב', '#8a6a24', '#c8a042'], ['f13', 5, 'White marble', 'שיש לבן', '#b4b4c0', '#dcdce8']
  ].map(([id, tier, en, he, far, near]) => ({ id, tier, en, he, far, near }));

  /* ---- the rules ---- */
  const fresh = () => ({ slots: {}, owned: {}, new: [], wall: 'w0', floor: 'f0' });
  const count = (home, id) => (home.owned[id] || 0);
  const copiesOf = item => (item && item.pair) || (KIND[item.kind] && KIND[item.kind].pair) ? 2 : 1;   // chairs are bought as a pair
  // why this item cannot be bought now: null (it can), or { why: 'rank' | 'math' | 'have' | 'sold', n }
  function lock(item, rank, mlvl, home) {
    if (!item.buy) return { why: 'sold' };
    if (item.tier > rank) return { why: 'rank', n: item.tier };
    const m = minMath(item.price); if ((mlvl || 1) < m) return { why: 'math', n: m };
    if (home && count(home, item.id) > 0 && !(KIND[item.kind] && KIND[item.kind].multi)) return { why: 'have' };
    return null;
  }
  function give(home, id, n) {   // an item goes into the collection (bought, a gift, or the starting room); `new` marks it until it is placed
    const item = ITEMS[id]; if (!item) return false;
    home.owned[id] = count(home, id) + (n || copiesOf(item));
    if (!home.new.includes(id)) home.new.push(id);
    return true;
  }
  const placedCount = (home, id) => Object.values(home.slots).filter(x => x === id).length;
  // put an item in a slot (or empty it: id = null). Returns true when it was placed. A pair of chairs fills both dining chairs.
  function place(home, slotId, id) {
    const slot = SLOT[slotId]; if (!slot) return false;
    if (id == null) { delete home.slots[slotId]; return true; }
    const item = ITEMS[id]; if (!item || item.kind !== slot.kind || !count(home, id)) return false;
    const pairId = slot.pair && KIND[item.kind].pair ? slot.pair : null;
    const need = pairId ? 2 : 1;
    if (count(home, id) < need) return false;
    // not more copies in slots than the student owns: free the oldest slot holding it when all copies are in use
    const used = Object.keys(home.slots).filter(s => home.slots[s] === id && s !== slotId && s !== pairId);
    while (used.length + need > count(home, id)) delete home.slots[used.shift()];
    home.slots[slotId] = id; if (pairId) home.slots[pairId] = id;
    home.new = home.new.filter(x => x !== id);
    return true;
  }
  const owned = (home, kind) => Object.keys(home.owned).filter(id => home.owned[id] > 0 && ITEMS[id] && ITEMS[id].kind === kind);
  // the starting room (spec 13 §2.1): the plain sofa, table, desk, bed, rug and window are owned and in place
  function start(home) {
    for (const k of START_FREE) { const id = startItem(k); home.owned[id] = copiesOf(ITEMS[id]); home.slots[k] = id; }
    return home;
  }
  // an older hero (free-placement room): the old items go into the collection as items of the nearest kind and stand in the first free slot of that kind
  function migrate(p) {
    if (!p || p.home) return p.home;
    const home = start(fresh());
    const old = (p.own && p.own.decor) || [];
    for (const od of old) {
      const id = GIFT_OF_OLD[od] || (od.startsWith('c_cert') ? null : 'lg_' + od); if (!id || !ITEMS[id]) continue;
      if (count(home, id)) continue;
      home.owned[id] = copiesOf(ITEMS[id]);
      const slot = SLOTS.find(s => s.kind === ITEMS[id].kind && !home.slots[s.id] && !(s.pair && home.slots[s.pair]));
      if (slot) place(home, slot.id, id); else home.new.push(id);
    }
    p.home = home; return home;
  }
  const wallOf = id => WALLS.find(w => w.id === id) || WALLS[0], floorOf = id => FLOORS.find(f => f.id === id) || FLOORS[0];

  const HM = { KINDS, KIND, SLOTS, SLOT, SPECIAL, TIERS, PRICE, MATH_BY_PRICE, minMath, T0, START_FREE, ITEMS, GIFTS, GIFT_OF_OLD, LEGACY, WALLS, FLOORS, startItem,
    fresh, start, count, copiesOf, lock, give, place, placedCount, owned, migrate, wallOf, floorOf };
  if (typeof module === 'object' && module.exports) module.exports = HM; else root.HM = HM;
})(typeof globalThis !== 'undefined' ? globalThis : this);
