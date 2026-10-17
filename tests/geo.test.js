/* Math Wizard: tests for the geometry track (geo.js, spec 11).
   Run in a browser: open tests/index.html. Run with Node: node tests/geo.test.js */
(function () {
  'use strict';
  const isNode = typeof module === 'object' && typeof require === 'function';
  const GEO = isNode ? require('../geo.js') : globalThis.GEO, ME = isNode ? require('../math.js') : globalThis.ME;
  const results = [];
  const test = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, msg: e.message }); } };
  const assert = (c, msg) => { if (!c) throw new Error(msg || 'assertion failed'); };
  let seed = 777; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };

  test('36 geometry levels, each with an English and a Hebrew topic', () => {
    assert(GEO.TOPICS.length === 37, 'topics ' + GEO.TOPICS.length);
    for (let i = 1; i <= 36; i++) assert(GEO.TOPICS[i] && GEO.TOPICS[i][0] && GEO.TOPICS[i][1], 'topic ' + i);
    assert(GEO.gradeOf(1) === 1 && GEO.gradeOf(6) === 1 && GEO.gradeOf(7) === 2 && GEO.gradeOf(36) === 6, 'six levels per grade');
  });
  test('placement: the first geometry level of the current math grade, once (spec 11 §3.2)', () => {
    assert(GEO.placeFor(22) === 19 && GEO.placeFor(1) === 1 && GEO.placeFor(6) === 1 && GEO.placeFor(7) === 7 && GEO.placeFor(36) === 31, 'by grade');
    const p = { mlvl: 22 }; GEO.place(p); assert(p.geo.level === 19 && p.geo.start === 19 && p.geo.place === 20, 'placed'); p.mlvl = 30; GEO.place(p); assert(p.geo.level === 19, 'only once');
  });
  test('the easy step: one geometry level below, except at the first level of a topic (spec 11 §3.3)', () => {
    assert(GEO.easyLevel(1) === 1 && GEO.easyLevel(3) === 3 && GEO.easyLevel(4) === 3 && GEO.easyLevel(6) === 5 && GEO.easyLevel(10) === 10 && GEO.easyLevel(15) === 14, 'easy levels');
  });
  test('moving: up at 85% over the last 10 to 12, down below 50% over the last 8, a window of 5 right after placement (spec 11 §14.1)', () => {
    const p = { mlvl: 1 }; GEO.place(p);
    let r = ''; for (let i = 0; i < 5 && !r; i++) r = GEO.record(p, true, 'siege'); assert(r === 'up' && p.geo.level === 2 && p.geo.hist.length === 0, 'five right siege answers move a new student up at once: ' + r);
    const q = { mlvl: 13 }; GEO.place(q); q.geo.place = 0; let mv = ''; for (let i = 0; i < 9; i++) mv = GEO.record(q, true, 'siege') || mv; assert(mv === '' && q.geo.level === 13, '9 right answers are not enough after placement');
    mv = GEO.record(q, true, 'siege') || mv; assert(mv === 'up' && q.geo.level === 14, '10 right answers move up');
    const d = { mlvl: 13 }; GEO.place(d); d.geo.place = 0; let down = ''; for (let i = 0; i < 8; i++) down = GEO.record(d, i < 3, 'siege') || down; assert(down === 'down' && d.geo.level === 12 && d.geo.hist.length === 0, 'under 50% over 8 moves down and clears the window: ' + down);
    const f = { mlvl: 1 }; GEO.place(f); f.geo.place = 0; for (let i = 0; i < 40; i++) GEO.record(f, false, 'siege'); assert(f.geo.level === 1, 'never below 1');
  });
  test('weights: Build and machine-building steps count 0.5 up and 1 down; siege aiming 1 and 1 (spec 11 §14.1)', () => {
    const p = { mlvl: 13 }; GEO.place(p); p.geo.place = 0; for (let i = 0; i < 12; i++) GEO.record(p, true, 'build'); assert(p.geo.level === 13, '12 right Build answers only fill 6 of the window');
    for (let i = 0; i < 8; i++) GEO.record(p, true, 'build'); assert(p.geo.level === 14, '20 right Build answers (weight 10) move up');
    const s = { mlvl: 13 }; GEO.place(s); s.geo.place = 0; GEO.record(s, false, 'build'); assert(s.geo.hist[0].d === 1 && s.geo.hist[0].u === .5, 'a mistake counts 1');
  });
  test('units: metric in Hebrew, imperial in English by default; both can be shown in either language', () => {
    assert(GEO.defaultUnits('he') === 'metric' && GEO.defaultUnits('en') === 'imperial', 'defaults');
    assert(GEO.unitText('metric', 'small', 'en') === 'cm' && GEO.unitText('imperial', 'small', 'en') === 'in' && GEO.unitText('metric', 'small', 'he') === 'ס״מ' && GEO.lengthText(7, 'metric', 'en') === '7 cm', 'unit names');
  });
  test('every geometry level 1 to 12 makes a well-formed task in both unit systems and at every math level', () => {
    for (let lv = 1; lv <= 12; lv++) for (const units of ['metric', 'imperial']) for (const mlvl of [1, 5, 10, 14, 25, 36]) for (let k = 0; k < 30; k++) {
      const t = GEO.task(lv, { rnd, units, mlvl }); assert(t && t.level === lv && t.text[0] && t.text[1] && /^(conjure|number|pick)$/.test(t.kind), 'task ' + lv);
      assert(t.topic === GEO.TOPICS[lv], 'topic of ' + lv);
      if (t.kind === 'conjure') assert(t.item && t.amount >= 1 && t.amount <= 10, `conjure amount ${lv}: ${t.amount}`);
      else if (t.kind === 'number') assert(Number.isInteger(t.answer) && t.answer >= 1 && t.answer <= 100, `number answer ${lv}: ${t.answer}`);
      else assert(t.choices.length >= 2 && t.answer >= 0 && t.answer < t.choices.length && t.choices.every(c => c.label[0] && c.label[1]), `pick ${lv}`);
      assert(!/undefined|NaN|\[object/.test(t.text.join(' ')), 'text of ' + lv + ': ' + t.text.join(' | '));
    }
    assert(GEO.task(13, { rnd }) === null, 'levels past 12 are not built yet');
  });
  test('arithmetic inside a task stays within the math level (spec 11 §3.3): products and divisions of levels 9, 10 and 12 fit a student before the times tables', () => {
    for (let k = 0; k < 200; k++) {
      const a = GEO.task(10, { rnd, mlvl: 5 }); assert(a.answer <= 10, 'level 10 at math level 5: ' + a.answer);
      const b = GEO.task(9, { rnd, mlvl: 5 }); assert(b.answer * 1 <= 9, 'level 9 answer ' + b.answer);
      const c = GEO.task(12, { rnd, mlvl: 5 }); assert(c.answer <= 18, 'level 12 at math level 5: ' + c.answer);
    }
  });
  test('the answer check: a number, a pick and a conjure amount; the answers of the tasks are right', () => {
    const n = GEO.task(10, { rnd }); assert(GEO.check(n, n.answer) && !GEO.check(n, n.answer + 1) && n.answer === n.w * n.h, 'level 10 is width times length');
    const c = GEO.task(2, { rnd }); assert(GEO.check(c, c.amount) && !GEO.check(c, c.amount + 1), 'conjure');
    for (let k = 0; k < 100; k++) {
      const p = GEO.task(3, { rnd }); assert(p.choices[p.answer].value === Math.max(...p.choices.map(x => x.value)), 'the longer plank');
      const s = GEO.task(4, { rnd }), sides = +/(\d+) sides/.exec(s.text[0])[1], right = s.choices[s.answer].id; assert(GEO.SHAPES[right].n[0] === sides, 'the shape with ' + sides + ' sides is ' + right);
      const a = GEO.task(11, { rnd }); if (a.deg) assert((a.deg === 90) === (a.answer === 0), 'right angle ' + a.deg); else assert(a.choices[a.answer].id === 'sym', 'the symmetrical gate');
    }
  });
  test('taskFor: places the student first, then sets a task at the easy step', () => {
    const p = { mlvl: 8 }; const t = GEO.taskFor(p, { rnd }); assert(p.geo && p.geo.level === 7 && t.level === 7, 'placed at 7, the first level of grade 2: ' + t.level);
    p.geo.level = 9; assert(GEO.taskFor(p, { rnd }).level === 9, 'level 9 is a topic start');
    p.geo.level = 8; assert(GEO.taskFor(p, { rnd }).level === 7, 'level 8 is set at 7'); p.geo.level = 12; assert(GEO.taskFor(p, { rnd }).level === 12, 'level 12 starts a topic: set at 12');
  });

  const failed = results.filter(r => !r.ok);
  if (isNode) {
    for (const r of results) console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n      ' + r.msg));
    console.log(`\n${results.length - failed.length} of ${results.length} geometry tests passed`); if (failed.length) process.exitCode = 1;
  } else globalThis.GEO_TEST_RESULTS = results;
})();
