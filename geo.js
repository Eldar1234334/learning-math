/* Math Wizard: the geometry track (spec 11, engineering mode). No screen code: the game (index.html) draws it; the tests check the rules.
   The geometry level is its own ladder, 1 to 36, moved only by engineering answers (village Build and machine building, later the siege). It moves like the math level
   (spec 01 §6, via ME.judge); the math level is never changed by engineering.
   Step 1 holds: the ladder's topics, the one-time placement, the moving rules with their weights, the units (metric or imperial), and the task generators for geometry levels 1 to 12.
   Needs math.js (ME) when it moves a level. Everything about a student is kept in P.geo = { level, start, hist, place } and P.units. */
(function (root) {
  'use strict';
  const ME = (typeof module === 'object' && module.exports) ? require('./math.js') : root.ME;

  /* ---- the settings (spec 11 §14, starting values to be tuned by the simulator) ---- */
  const CFG = {
    MAX_LEVEL: 36,
    WEIGHT: { siege: { u: 1, d: 1 }, build: { u: 0.5, d: 1 } },   // §14.1: siege aiming 1 up and 1 down; Build and machine-building steps 0.5 up and 1 down
    TASK_LEVELS: 12                                               // the task generators below cover geometry levels 1 to 12 so far
  };

  /* ---- the topic of each geometry level (spec 11 §3.4): [English, Hebrew] ---- */
  const TOPICS = [null,
    ['Shapes: flat and solid', 'צורות שטוחות ותלת-ממדיות'], ['Sides and corners', 'צלעות ופינות'], ['Comparing shapes', 'השוואת צורות'], ['Straight and curved lines', 'קווים ישרים ועקומים'],
    ['Halves', 'חצאים'], ['Quarters', 'רבעים'], ['Triangles and quadrilaterals', 'משולשים ומרובעים'], ['Pentagons, hexagons and cubes', 'מחומשים, משושים וקוביות'],
    ['Equal parts', 'חלקים שווים'], ['Rectangles of square units', 'מלבנים מיחידות ריבועיות'], ['Right angles and symmetry', 'זוויות ישרות וסימטריה'], ['Introductory measurement', 'מדידה ראשונית'],
    ['Classifying quadrilaterals', 'סיווג מרובעים'], ['Area with square units (1)', 'שטח ביחידות ריבועיות (1)'], ['Area with square units (2)', 'שטח ביחידות ריבועיות (2)'], ['Perimeter', 'היקף'],
    ['Types of angles', 'סוגי זוויות'], ['Perpendicular and parallel lines', 'ישרים מאונכים ומקבילים'], ['Lines, rays and angles', 'ישרים, קרניים וזוויות'], ['The protractor', 'מד זווית'],
    ['Rectangles and squares', 'תכונות מלבנים וריבועים'], ['Perimeter and area of rectangles', 'היקף ושטח של מלבנים'], ['Symmetry', 'סימטריה'], ['Triangle angles add to 180°', 'סכום זוויות במשולש 180°'],
    ['The coordinate plane (1)', 'מערכת צירים (1)'], ['The coordinate plane (2)', 'מערכת צירים (2)'], ['Classifying flat shapes', 'סיווג צורות שטוחות'], ['Volume of boxes (1)', 'נפח תיבות (1)'],
    ['Volume of boxes (2)', 'נפח תיבות (2)'], ['Area of triangles and quadrilaterals', 'שטח משולשים ומרובעים'], ['Area of triangles and polygons', 'שטח משולשים ומצולעים'], ['Nets of solids', 'פריסות של גופים'],
    ['Surface area', 'שטח פנים'], ['Volume of solids', 'נפח גופים'], ['Polygons on the coordinate plane', 'מצולעים במערכת צירים'], ['Circles and composite figures', 'מעגלים וצורות מורכבות']
  ];
  const FIRST = new Set([1, 3, 5, 7, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 30, 31, 32, 33, 34, 35, 36]);   // the first level of a topic: its tasks are not set one step lower
  const gradeOf = lv => Math.ceil(lv / 6);
  const topicOf = lv => TOPICS[Math.max(1, Math.min(CFG.MAX_LEVEL, lv))];
  const easyLevel = lv => (lv <= 1 || FIRST.has(lv)) ? lv : lv - 1;   // §3.3: a task is one geometry level below the student's, except at a topic's first level

  /* ---- placement and moving (spec 11 §3.2, §14.1) ---- */
  // the first time the student opens engineering: the first geometry level of her current math grade (math level 22 → grade 4 → geometry level 19)
  const placeFor = mlvl => (ME.gradeOf(Math.max(1, Math.min(CFG.MAX_LEVEL, mlvl || 1))) - 1) * 6 + 1;
  function place(p) { if (!p.geo) { const lv = placeFor(p.mlvl); p.geo = { level: lv, start: lv, hist: [], place: 20 }; } return p.geo; }
  // a scored geometry answer: kind 'siege' (aiming) or 'build' (a Build or machine-building step). Returns 'up', 'down' or '' and moves the level.
  function record(p, ok, kind) {
    const g = place(p), w = CFG.WEIGHT[kind] || CFG.WEIGHT.build;
    g.hist.push({ ok: ok ? 1 : 0, u: w.u, d: w.d }); if (g.hist.length > 40) g.hist.splice(0, g.hist.length - 40);
    const placing = g.place > 0; if (placing) g.place--;   // a window of 5 for the first 20 answers after placement
    const move = ME.judge(g.hist, placing ? g.place + 1 : 0);
    if (move === 'up' && g.level < CFG.MAX_LEVEL) { g.level++; g.hist = []; return 'up'; }
    if (move === 'down' && g.level > 1) { g.level--; g.hist = []; return 'down'; }
    return '';
  }

  /* ---- units (spec 11 §4): metric in Hebrew, imperial in English by default; the student can switch ---- */
  const defaultUnits = lang => lang === 'he' ? 'metric' : 'imperial';
  const UNITS = {
    metric: { small: ['cm', 'ס״מ'], medium: ['m', 'מ׳'], area: ['cm²', 'סמ״ר'], areaM: ['m²', 'מ״ר'], vol: ['cm³', 'סמ״ק'], volM: ['m³', 'מ״ק'] },
    imperial: { small: ['in', 'אינץ׳'], medium: ['ft', 'רגל'], area: ['in²', 'אינץ׳ רבוע'], areaM: ['ft²', 'רגל רבועה'], vol: ['in³', 'אינץ׳ מעוקב'], volM: ['ft³', 'רגל מעוקבת'] }
  };
  const unitText = (units, key, lang) => UNITS[units === 'imperial' ? 'imperial' : 'metric'][key][lang === 'he' ? 1 : 0];
  // "7 cm" / "7 in" (the number and unit are written left to right in Hebrew too, as everywhere in the app)
  const lengthText = (n, units, lang, key) => `${n} ${unitText(units, key || 'small', lang)}`;

  /* ---- the task generators, geometry levels 1 to 12 (spec 11 §5.2) ----
     task(level, o) → { level, topic, kind, text: [English, Hebrew], ... }.  o: { rnd, units ('metric' | 'imperial'), mlvl (the math level: arithmetic stays within it, §3.3), lang }.
     kind 'conjure': conjure `amount` of `item` (the Builder's Grimoire, step 2).  kind 'number': type a number (`answer`).
     kind 'pick': tap one of `choices` ([{ id, label: [en, he], pic }]); `answer` is the index of the right one. */
  const maxProd = mlvl => (mlvl || 1) < 11 ? 10 : (mlvl || 1) < 15 ? 50 : 100;   // the largest product the student's math level can ask (before and after the times tables)
  const SHAPES = {   // sides = corners for the flat shapes
    triangle: { n: [3, 3], en: 'triangle', he: 'משולש', pl: ['triangles', 'משולשים'] }, square: { n: [4, 4], en: 'square', he: 'ריבוע', pl: ['squares', 'ריבועים'] },
    rectangle: { n: [4, 4], en: 'rectangle', he: 'מלבן', pl: ['rectangles', 'מלבנים'] }, pentagon: { n: [5, 5], en: 'pentagon', he: 'מחומש', pl: ['pentagons', 'מחומשים'] },
    hexagon: { n: [6, 6], en: 'hexagon', he: 'משושה', pl: ['hexagons', 'משושים'] }, circle: { n: [0, 0], en: 'circle', he: 'עיגול', pl: ['circles', 'עיגולים'] }
  };
  const mk = (level, kind, text, extra) => Object.assign({ level, topic: topicOf(level), kind, text }, extra);
  const pick = (a, rnd) => a[Math.floor(rnd() * a.length)];
  const range = (lo, hi, rnd) => lo + Math.floor(rnd() * (hi - lo + 1));
  const shuffled = (a, rnd) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const shapeChoices = (ids, right, rnd) => { const order = shuffled(ids, rnd); return { choices: order.map(id => ({ id, label: [SHAPES[id].en, SHAPES[id].he], pic: id })), answer: order.indexOf(right) }; };

  const GEN = {
    1: o => { const n = range(1, 5, o.rnd); return mk(1, 'conjure', [`I need ${n} square tiles. Conjure ${n} squares for the path.`, `אני צריך ${n} אריחים מרובעים. הקסימו ${n} ריבועים בשביל השביל.`], { item: 'square', amount: n }); },
    2: o => { const n = range(3, 10, o.rnd); return mk(2, 'conjure', [`The fence needs ${n} posts. Conjure ${n}.`, `הגדר צריכה ${n} עמודים. הקסימו ${n}.`], { item: 'post', amount: n }); },
    3: o => { const a = range(2, 14, o.rnd); let b = range(2, 14, o.rnd); if (b === a) b = a + 1; const u = o.units === 'imperial' ? 'in' : 'cm', uh = o.units === 'imperial' ? 'אינץ׳' : 'ס״מ';
      const order = o.rnd() < .5 ? [a, b] : [b, a];
      return mk(3, 'pick', [`Which plank is longer: ${order[0]} ${u} or ${order[1]} ${u}?`, `איזה קרש ארוך יותר: ${order[0]} ${uh} או ${order[1]} ${uh}?`], { choices: order.map(x => ({ id: 'len' + x, label: [`${x} ${u}`, `${x} ${uh}`], value: x })), answer: order[0] > order[1] ? 0 : 1 }); },
    4: o => { const k = pick([3, 4, 5, 6], o.rnd), right = { 3: 'triangle', 4: 'square', 5: 'pentagon', 6: 'hexagon' }[k], ids = shuffled(['triangle', 'square', 'pentagon', 'hexagon', 'circle'].filter(x => x !== right), o.rnd).slice(0, 3).concat(right);
      return mk(4, 'pick', [`Which shape has ${k} sides?`, `לאיזו צורה יש ${k} צלעות?`], shapeChoices(ids, right, o.rnd)); },
    5: o => { const n = range(1, 5, o.rnd); return mk(5, 'number', [`Cut ${n === 1 ? 'the plank' : n + ' planks'} in half. How many pieces do you get?`, `חותכים ${n === 1 ? 'את הקרש' : n + ' קרשים'} לחצי. כמה חלקים מקבלים?`], { answer: 2 * n }); },
    6: o => { const frac = [['1/2', 'a half', 'חצי'], ['1/4', 'a quarter', 'רבע'], ['1/3', 'a third', 'שליש']], parts = pick([[2, 0], [4, 1]], o.rnd), right = parts[1];
      return mk(6, 'pick', [`A bench is cut into ${parts[0]} equal pieces. What part of the bench is each piece?`, `ספסל נחתך ל-${parts[0]} חלקים שווים. איזה חלק מהספסל הוא כל חלק?`], { choices: frac.map(f => ({ id: f[0], label: [f[1], f[2]], frac: f[0] })), answer: right }); },
    7: o => { const q = pick([['triangle', 'corners', 3], ['square', 'corners', 4], ['pentagon', 'corners', 5], ['hexagon', 'corners', 6], ['triangle', 'sides', 3], ['rectangle', 'sides', 4], ['cube', 'corners', 8], ['cube', 'faces', 6]], o.rnd), [shape, what, n] = q;
      const nameEn = shape === 'cube' ? 'cube' : SHAPES[shape].en, nameHe = shape === 'cube' ? 'קובייה' : SHAPES[shape].he, whatHe = { corners: 'פינות', sides: 'צלעות', faces: 'פאות' }[what];
      return mk(7, 'number', [`How many ${what} does a ${nameEn} have?`, `כמה ${whatHe} יש ל${nameHe}?`], { answer: n, shape }); },
    8: o => { const s = pick(['triangle', 'square', 'pentagon', 'hexagon'], o.rnd), n = SHAPES[s].n[0];
      return mk(8, 'conjure', [`A ${n === 3 ? 'roof' : 'window frame'} is a ${SHAPES[s].en}. Conjure ${n} sticks.`, `${n === 3 ? 'גג' : 'מסגרת חלון'} הוא ${SHAPES[s].he}. הקסימו ${n} מקלות.`], { item: 'stick', amount: n, shape: s }); },
    9: o => { const k = pick([2, 3, 4, 5], o.rnd), m = range(2, Math.max(2, Math.min(9, Math.floor(maxProd(o.mlvl) / k))), o.rnd);
      return mk(9, 'number', [`Split a fence of ${k * m} posts into ${k} equal parts. How many posts in each part?`, `מחלקים גדר של ${k * m} עמודים ל-${k} חלקים שווים. כמה עמודים בכל חלק?`], { answer: m }); },
    10: o => { const lim = maxProd(o.mlvl), a = range(2, Math.min(6, Math.floor(lim / 2)), o.rnd), b = range(2, Math.max(2, Math.min(6, Math.floor(lim / a))), o.rnd);
      return mk(10, 'number', [`A garden bed is ${a} squares wide and ${b} squares long. How many squares is it?`, `ערוגה ברוחב ${a} ריבועים ובאורך ${b} ריבועים. כמה ריבועים יש בה?`], { answer: a * b, w: a, h: b }); },
    11: o => { const kind = pick(['angle', 'gate'], o.rnd);
      if (kind === 'angle') { const deg = pick([90, 90, 60, 120, 45, 135], o.rnd);
        return mk(11, 'pick', ['Is this corner a right angle?', 'האם הפינה הזו היא זווית ישרה?'], { choices: [{ id: 'yes', label: ['Yes', 'כן'] }, { id: 'no', label: ['No', 'לא'] }], answer: deg === 90 ? 0 : 1, deg }); }
      const sym = o.rnd() < .5;
      return mk(11, 'pick', ['Which gate is symmetrical? (Both halves match.)', 'איזה שער סימטרי? (שני החצאים זהים.)'], { choices: shuffled([{ id: 'sym', label: ['The matching gate', 'השער עם חצאים זהים'] }, { id: 'asym', label: ['The uneven gate', 'השער הלא שווה'] }], o.rnd), get answer() { return this.choices.findIndex(c => c.id === 'sym'); }, sym }); },
    12: o => { const lim = maxProd(o.mlvl), per = pick([1, 2], o.rnd), n = range(2, Math.max(2, Math.min(9, Math.floor(lim / per))), o.rnd), u = o.units === 'imperial' ? 'inches' : 'cm', uh = o.units === 'imperial' ? 'אינץ׳' : 'ס״מ';
      return mk(12, 'number', [`The beam is ${n} squares long. Each square is ${per} ${per === 1 ? u.replace('inches', 'inch') : u}. How many ${u} long is the beam?`, `הקורה באורך ${n} ריבועים. כל ריבוע הוא ${per} ${uh}. כמה ${uh} אורך הקורה?`], { answer: n * per, squares: n, per, unit: u }); }
  };
  // a task of the student's geometry level (set one step lower, §3.3), or of a given level
  function task(level, o) {
    o = Object.assign({ rnd: Math.random, units: 'metric', mlvl: 36 }, o || {});
    const lv = Math.max(1, Math.min(CFG.MAX_LEVEL, level)), g = GEN[lv]; return g ? g(o) : null;
  }
  const taskFor = (p, o) => task(easyLevel(place(p).level), Object.assign({ mlvl: p.mlvl }, o));
  // is the student's answer right? number: the typed number; pick: the chosen index; conjure: the conjured amount
  const check = (t, a) => t.kind === 'pick' ? a === t.answer : t.kind === 'conjure' ? a === t.amount : +a === t.answer;

  /* ---- the Builder's Grimoire (spec 11 §5.1): the conjuration book for buildings. Village items now; the machine parts come with the yard (step 3). ----
     An item is learned at its geometry level (from) or when a project first needs it. */
  const GRIMOIRE = [
    { id: 'square', sec: 'village', from: 1, em: '🟦', one: ['square tile', 'אריח מרובע'], many: ['square tiles', 'אריחים מרובעים'] },
    { id: 'post', sec: 'village', from: 2, em: '🚧', one: ['fence post', 'עמוד גדר'], many: ['fence posts', 'עמודי גדר'] },
    { id: 'stick', sec: 'village', from: 4, em: '🥢', one: ['stick', 'מקל'], many: ['sticks', 'מקלות'] },
    { id: 'plank', sec: 'village', from: 5, em: '🪵', one: ['plank', 'קרש'], many: ['planks', 'קרשים'] },
    { id: 'seed', sec: 'village', from: 9, em: '🌱', one: ['seed', 'זרע'], many: ['seeds', 'זרעים'] },
    { id: 'nail', sec: 'village', from: 10, em: '📌', one: ['nail', 'מסמר'], many: ['nails', 'מסמרים'] },
    { id: 'brick', sec: 'village', from: 11, em: '🧱', one: ['brick', 'לבנה'], many: ['bricks', 'לבנים'] },
    { id: 'tile', sec: 'village', from: 12, em: '🔶', one: ['roof tile', 'רעף'], many: ['roof tiles', 'רעפים'] },
    // the machine section (spec 11 §6.1): parts of three rarities, learned with the machine they first build (from = the machine's geometry level)
    { id: 'beam', sec: 'machine', from: 10, em: '🪵', rar: 'common', one: ['oak beam', 'קורת אלון'], many: ['oak beams', 'קורות אלון'] },
    { id: 'rope', sec: 'machine', from: 12, em: '🪢', rar: 'common', one: ['rope', 'חבל'], many: ['ropes', 'חבלים'] },
    { id: 'gear', sec: 'machine', from: 12, em: '⚙️', rar: 'uncommon', one: ['iron gear', 'גלגל שיניים'], many: ['iron gears', 'גלגלי שיניים'] },
    { id: 'plate', sec: 'machine', from: 10, em: '🛡️', rar: 'uncommon', one: ['iron plate', 'לוח ברזל'], many: ['iron plates', 'לוחות ברזל'] },
    { id: 'starsteel', sec: 'machine', from: 22, em: '⭐', rar: 'rare', one: ['star-steel bar', 'מוט פלדת כוכבים'], many: ['star-steel bars', 'מוטות פלדת כוכבים'] },
    { id: 'runecore', sec: 'machine', from: 26, em: '🔮', rar: 'rare', one: ['rune core', 'ליבת רונות'], many: ['rune cores', 'ליבות רונות'] }
  ];
  const ITEM = Object.fromEntries(GRIMOIRE.map(i => [i.id, i]));
  const itemName = (id, n, lang) => ITEM[id][n === 1 ? 'one' : 'many'][lang === 'he' ? 1 : 0];
  // the items the student has learned: by her geometry level, plus the ones a project taught her (p.grimoire = { village: [ids] })
  function learned(p, sec) {
    const lv = place(p).level, g = p.grimoire || {};
    return GRIMOIRE.filter(i => (!sec || i.sec === sec) && (i.from <= lv || (g[i.sec] || []).includes(i.id)));
  }
  function learn(p, id) { const it = ITEM[id]; if (!it) return; p.grimoire = p.grimoire || { village: [], machine: [] }; p.grimoire[it.sec] = p.grimoire[it.sec] || []; if (!learned(p).some(i => i.id === id)) p.grimoire[it.sec].push(id); }

  /* ---- Build: small jobs and village projects (spec 11 §5.2) ----
     A session is { type: 'jobs' | 'project', id, title, village, steps }. A step is a task (number, pick or conjure) with a `role`: 'measure' or 'conjure'.
     Below geometry level 10: three small jobs (tasks of the student's easy step). From level 10: a project with 2 to 4 steps (measure, then conjure). The projects that need the
     area, perimeter, angle, volume and circle tasks (geometry levels 13 and up) come when those tasks do. */
  const PROJECTS = {
    bridge: { id: 'bridge', from: 10, village: ['Maple Bridge', 'גשר המייפל'], title: ['The bridge', 'הגשר'], make(o) {
      const lim = maxProd(o.mlvl), m = unitText(o.units, 'medium', 'en'), mh = unitText(o.units, 'medium', 'he'), p = pick([2, 3, 4, 5], o.rnd), k = range(2, Math.max(2, Math.min(9, Math.floor(lim / p))), o.rnd), W = p * k;
      const per = (W % 2 === 0 && o.rnd() < .5) ? 2 : 1, s = W / per;
      return [
        mk(12, 'number', [`The river is ${s} squares wide. Each square is ${per} ${m}. How wide is the river in ${m}?`, `הנהר ברוחב ${s} ריבועים. כל ריבוע הוא ${per} ${mh}. מה רוחב הנהר ב${mh}?`], { answer: W, role: 'measure' }),
        mk(10, 'number', [`Each plank is ${p} ${m} long. How many planks close the ${W} ${m} gap?`, `כל קרש באורך ${p} ${mh}. כמה קרשים סוגרים את הפער של ${W} ${mh}?`], { answer: k, role: 'measure' }),
        mk(10, 'conjure', [`Conjure the planks for the bridge.`, `הקסימו את הקרשים לגשר.`], { item: 'plank', amount: k, role: 'conjure', teach: 'plank',
          bad: a => a < k ? [`${a} planks? The river is ${W} ${m}. The gap is not closed!`, `${a} קרשים? הנהר רחב ${W} ${mh}. הפער לא נסגר!`] : [`${a} planks is too many. Each plank is ${p} ${m}.`, `${a} קרשים זה יותר מדי. כל קרש באורך ${p} ${mh}.`] })
      ]; } },
    garden: { id: 'garden', from: 10, village: ['Sunny Hill', 'גבעת השמש'], title: ['The garden bed', 'ערוגת הירקות'], make(o) {
      const lim = maxProd(o.mlvl), a = range(2, Math.min(6, Math.floor(lim / 2)), o.rnd), b = range(2, Math.max(2, Math.min(6, Math.floor(lim / a))), o.rnd);
      return [
        mk(10, 'number', [`The garden bed is ${a} squares wide and ${b} squares long. How many squares is it?`, `הערוגה ברוחב ${a} ריבועים ובאורך ${b} ריבועים. כמה ריבועים יש בה?`], { answer: a * b, w: a, h: b, role: 'measure' }),
        mk(10, 'conjure', [`Plant one seed in every square. Conjure the seeds.`, `שותלים זרע אחד בכל ריבוע. הקסימו את הזרעים.`], { item: 'seed', amount: a * b, role: 'conjure', teach: 'seed',
          bad: x => x < a * b ? [`${x} seeds? Some squares stay empty!`, `${x} זרעים? כמה ריבועים יישארו ריקים!`] : [`${x} seeds is too many. One seed for every square.`, `${x} זרעים זה יותר מדי. זרע אחד בכל ריבוע.`] })
      ]; } }
  };
  const JOB_VILLAGERS = [['Mira', 'מירה'], ['Tomer', 'תומר'], ['Dana', 'דנה'], ['Gil', 'גיל'], ['Noa', 'נועה']];
  function buildSession(p, o) {
    o = Object.assign({ rnd: Math.random, units: p.units || 'metric', mlvl: p.mlvl }, o || {});
    const gl = place(p).level;
    if (gl >= 10) { const proj = PROJECTS[pick(Object.keys(PROJECTS), o.rnd)]; return { type: 'project', id: proj.id, title: proj.title, village: proj.village, steps: proj.make(o) }; }
    const steps = []; let prev = null;
    for (let i = 0; i < 3; i++) { let t = null; for (let k = 0; k < 8; k++) { t = taskFor(p, o); if (!prev || t.text[0] !== prev.text[0]) break; } steps.push(Object.assign(t, { role: t.kind === 'conjure' ? 'conjure' : 'measure' })); prev = t; }
    return { type: 'jobs', id: 'jobs', title: ['A small job', 'עבודה קטנה'], village: pick(JOB_VILLAGERS, o.rnd), steps };
  }
  // a conjure step: the right item and the right amount. Returns 'ok', 'item' (the wrong thing) or 'amount'.
  const checkConjure = (step, itemId, amount) => itemId !== step.item ? 'item' : +amount === step.amount ? 'ok' : 'amount';
  const badAmountText = (step, amount, lang) => (step.bad ? step.bad(amount) : ['Not quite. Count again.', 'לא בדיוק. ספרו שוב.'])[lang === 'he' ? 1 : 0];
  const BUILD_WIZ = 5;   // Build opens at wizard level 5 (spec 11 §2, §6.1)

  /* ---- the engineering yard: machines and scrolls (spec 11 §6) ---- */
  // rank = the Academy rank that opens the machine (08 §1), geo = the geometry level she needs; parts = [common, uncommon, rare] for the machine's three scrolls
  const MACHINES = {
    ram: { id: 'ram', rank: 0, geo: 10, em: '🐏', en: 'Battering ram', he: 'איל ניגוח', parts: ['beam', 'plate', 'starsteel'] },
    ballista: { id: 'ballista', rank: 1, geo: 12, em: '🏹', en: 'Ballista', he: 'בליסטרה', parts: ['rope', 'gear', 'starsteel'] },
    catapult: { id: 'catapult', rank: 2, geo: 22, em: '☄️', en: 'Catapult', he: 'קטפולטה', parts: ['beam', 'gear', 'runecore'] },
    trebuchet: { id: 'trebuchet', rank: 3, geo: 26, em: '🎯', en: 'Trebuchet', he: 'טרבושה', parts: ['rope', 'plate', 'runecore'] },
    tower: { id: 'tower', rank: 3, geo: 29, em: '🗼', en: 'Siege tower', he: 'מגדל מצור', parts: ['beam', 'plate', 'runecore'] }
  };
  const SCROLLS = {   // cost in copper (spec 11 §6.4, the owner's choice still open); power 1x, 2x, 3x; glow none, soft blue, stronger gold (06 §5)
    sketch: { id: 'sketch', cost: 0, power: 1, glow: '', em: '📜', en: 'Sketch Scroll', he: 'מגילת שרטוט', rars: ['common'] },
    enchanted: { id: 'enchanted', cost: 100, power: 2, glow: '#6fb7ff', em: '📘', en: 'Enchanted Scroll', he: 'מגילה מקוסמת', rars: ['common', 'uncommon'] },
    ancient: { id: 'ancient', cost: 200, power: 3, glow: '#ffd166', em: '📙', en: 'Ancient Scroll', he: 'מגילה עתיקה', rars: ['uncommon', 'rare'] }
  };
  const YARD_WIZ = 5;   // the yard opens at wizard level 5 (§6.1)
  // why a machine cannot be built now: null (it can), or { why: 'wiz' | 'rank' | 'geo', n }
  function machineLock(p, id, rank, wlvl) {
    const m = MACHINES[id]; if (wlvl < YARD_WIZ) return { why: 'wiz', n: YARD_WIZ };
    if (rank < m.rank) return { why: 'rank', n: m.rank }; const g = place(p).level; if (g < m.geo) return { why: 'geo', n: m.geo };
    return null;
  }
  // the measure step of each machine's build, from the machine's topic. big (Enchanted and Ancient scrolls: her current geometry level) allows larger numbers; every answer is 2 to 24 so it can be conjured.
  const fitProd = (dims, o) => { const lim = maxProd(o.mlvl); for (let k = 0; k < 40; k++) { const v = dims.map(([lo, hi]) => range(lo, hi, o.rnd)); if (v.reduce((x, y) => x * y, 1) <= lim) return v; } return dims.map(d => d[0]); };   // the product stays within the student's math level (§3.3)
  const MGEN = {
    ram: (o, big) => { const [a, b] = fitProd([[2, big ? 5 : 4], [2, big ? 6 : 5]], o); return mk(10, 'number', [`The ram's frame is ${a} squares wide and ${b} squares long. How many squares is it?`, `מסגרת האיל ברוחב ${a} ריבועים ובאורך ${b} ריבועים. כמה ריבועים יש בה?`], { answer: a * b, role: 'measure' }); },
    ballista: (o, big) => { const per = pick([1, 2], o.rnd), n = range(2, Math.max(2, Math.min(big ? 12 : 8, Math.floor(maxProd(o.mlvl) / per))), o.rnd), u = unitText(o.units, 'small', 'en'), uh = unitText(o.units, 'small', 'he');
      return mk(12, 'number', [`The ballista's arm is ${n} squares long. Each square is ${per} ${u}. How long is the arm, in ${o.units === 'imperial' ? 'inches' : 'cm'}?`, `זרוע הבליסטרה באורך ${n} ריבועים. כל ריבוע הוא ${per} ${uh}. מה אורך הזרוע ב${uh}?`], { answer: n * per, role: 'measure' }); },
    catapult: (o, big) => { const [a, b] = fitProd([[2, big ? 5 : 4], [2, big ? 6 : 5]], o), m = unitText(o.units, 'medium', 'en'), mh = unitText(o.units, 'medium', 'he'), a2 = unitText(o.units, 'areaM', 'en'), a2h = unitText(o.units, 'areaM', 'he');
      return mk(22, 'number', [`The arm frame is ${a} ${m} by ${b} ${m}. What is its area in ${a2}?`, `מסגרת הזרוע היא ${a} ${mh} על ${b} ${mh}. מה שטחה ב${a2h}?`], { answer: a * b, role: 'measure' }); },
    trebuchet: (o, big) => { const x = range(2, big ? 9 : 7, o.rnd), y = range(1, 5, o.rnd);
      return mk(26, 'number', [`The pivot post stands at (${x}, ${y}) on the grid. How many squares to the right of the corner (0, 0) is it?`, `עמוד הציר עומד בנקודה (${x}, ${y}) ברשת. כמה ריבועים הוא ימינה מהפינה (0, 0)?`], { answer: x, role: 'measure' }); },
    tower: (o, big) => { const [a, b, c] = fitProd([[2, 3], [2, 3], [2, big ? 3 : 2]], o), m = unitText(o.units, 'medium', 'en'), mh = unitText(o.units, 'medium', 'he'), v = unitText(o.units, 'volM', 'en'), vh = unitText(o.units, 'volM', 'he');
      return mk(29, 'number', [`The shield box is ${a} ${m} by ${b} ${m} by ${c} ${m}. What is its volume in ${v}?`, `תיבת המגן היא ${a} ${mh} על ${b} ${mh} על ${c} ${mh}. מה נפחה ב${vh}?`], { answer: a * b * c, role: 'measure' }); }
  };
  // building a machine is a short project (§6.3): measure, conjure the parts (the scroll decides their rarity), assemble (done when the last part is conjured)
  function machineSession(p, id, scrollId, o) {
    o = Object.assign({ rnd: Math.random, units: p.units || 'metric', mlvl: p.mlvl }, o || {}); const m = MACHINES[id], sc = SCROLLS[scrollId], big = scrollId !== 'sketch';
    const meas = MGEN[id](o, big), rarIdx = { common: 0, uncommon: 1, rare: 2 }, steps = [meas];
    sc.rars.forEach((rar, k) => { const part = m.parts[rarIdx[rar]], n = k === 0 ? meas.answer : range(2, 4, o.rnd);
      steps.push(mk(meas.level, 'conjure', [`Conjure ${n} ${itemName(part, n, 'en')} for the ${m.en.toLowerCase()}.`, `הקסימו ${n} ${itemName(part, n, 'he')} ל${m.he}.`], { item: part, amount: n, role: 'conjure', teach: part })); });
    return { type: 'machine', id, machine: id, scroll: scrollId, title: [m.en, m.he], village: null, steps };
  }
  // the machines she owns: p.machines = [{ type, scroll }]. Building one costs the scroll's copper, paid when it is assembled.
  function addMachine(p, id, scrollId) { const c = SCROLLS[scrollId].cost; if ((p.coins || 0) < c) return false; p.coins = Math.round(((p.coins || 0) - c) * 1000) / 1000; p.machines = p.machines || []; p.machines.push({ type: id, scroll: scrollId }); return true; }
  const machinesOf = p => p.machines || [];

  const GEO = { CFG, TOPICS, FIRST, gradeOf, topicOf, easyLevel, placeFor, place, record, defaultUnits, UNITS, unitText, lengthText, SHAPES, maxProd, task, taskFor, check,
    GRIMOIRE, ITEM, itemName, learned, learn, PROJECTS, buildSession, checkConjure, badAmountText, BUILD_WIZ,
    MACHINES, SCROLLS, YARD_WIZ, machineLock, machineSession, addMachine, machinesOf };
  if (typeof module === 'object' && module.exports) module.exports = GEO; else root.GEO = GEO;
})(typeof globalThis !== 'undefined' ? globalThis : this);
