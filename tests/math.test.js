/* Math Wizard: tests for the math engine (math.js).
   Run in a browser: open tests/index.html. Run with Node: node tests/math.test.js (GitHub runs this on every upload).
   Every problem is checked with an independent calculator (evalExpr below), so a generator that writes the wrong answer is caught. */
(function () {
  'use strict';
  const isNode = typeof module === 'object' && typeof require === 'function';
  const ME = isNode ? require('../math.js') : globalThis.ME;
  const results = []; let current = '';
  const test = (name, fn) => { current = name; try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, msg: e.message }); } };
  const assert = (c, msg) => { if (!c) throw new Error(msg || 'assertion failed'); };
  const eqv = (a, b, msg) => assert(ME.eq(a, b), (msg || '') + ` expected ${ME.fmt(b)} got ${ME.fmt(a)}`);
  // a repeatable random sequence, so a failure can be reproduced
  let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  ME.setRandom(rnd);

  /* ----- an independent calculator for the expression tokens ----- */
  const { V, I, add, sub, mul, div } = ME;
  function evalSide(s) {   // + − × ÷, parentheses, whole numbers, decimals, [a/b], [w a/b], p%, and the word forms
    s = s.replace(/\{of:([^|}]+)\|([^}]+)\}/g, '($1) × ($2)').replace(/\{double:([^}]+)\}/g, '2 × ($1)').replace(/\{half:([^}]+)\}/g, '($1) ÷ 2')
      .replace(/\{ratio:(\d+)\|(\d+):(\d+)\}/g, (m, t, x, y) => `${t} × ${x} ÷ (${x} + ${y})`);
    const toks = s.match(/\[\d+ \d+\/\d+\]|\[\d+\/\d+\]|\d+(?:\.\d+)?%?|[+−×÷()]/g) || [];
    let i = 0;
    const val = t => { let m; if ((m = t.match(/^\[(\d+) (\d+)\/(\d+)\]$/))) return add(I(+m[1]), V(+m[2], +m[3], 'frac'), 'frac'); if ((m = t.match(/^\[(\d+)\/(\d+)\]$/))) return V(+m[1], +m[2], 'frac'); if (t.endsWith('%')) return V(+t.slice(0, -1), 100, 'frac'); return t.includes('.') ? ME.D(t) : I(+t); };
    const prim = () => { const t = toks[i++]; if (t === '(') { const v = expr(); i++; return v; } return val(t); };
    const term = () => { let v = prim(); while (toks[i] === '×' || toks[i] === '÷') { const op = toks[i++], r = prim(); v = op === '×' ? mul(v, r) : div(v, r); } return v; };
    const expr = () => { let v = term(); while (toks[i] === '+' || toks[i] === '−') { const op = toks[i++], r = term(); v = op === '+' ? add(v, r) : sub(v, r); } return v; };
    const v = expr(); assert(i === toks.length, 'could not read the whole expression: ' + s); return v;
  }
  function evalExpr(e, ans) {   // an equation with □ is checked by putting the answer in the box
    const tokAns = ME.tok(ans);
    if (e.includes('=')) {
      const [l, r] = e.split(' = ');
      const fill = x => x.replace(/\[□\/(\d+)\]/, (m, d) => `[${ans.n * 1}/${d}]`).replace(/\[(\d+)\/□\]/, (m, n) => `[${n}/${ans.n}]`).replace('□', tokAns);
      const L = evalSide(fill(l)), R = evalSide(fill(r)); return ME.eq(L, R);
    }
    return ME.eq(evalSide(e), ans);
  }

  /* ----- values ----- */
  test('values: lowest terms and equality by value', () => {
    const h = ME.F(2, 4); assert(h.n === 1 && h.d === 2, '2/4 should become 1/2');
    assert(ME.eq(ME.F(1, 2), ME.D('0.5')), '½ = 0.5'); assert(ME.eq(ME.F(4, 8), ME.F(1, 2)), '4/8 = 1/2'); assert(!ME.eq(ME.F(1, 3), ME.F(1, 2)), '⅓ ≠ ½');
  });
  test('values: arithmetic', () => {
    eqv(ME.add(ME.F(1, 3), ME.F(1, 6)), ME.F(1, 2), '⅓ + ⅙'); eqv(ME.sub(ME.F(3, 4), ME.F(1, 4)), ME.F(1, 2), '¾ − ¼');
    eqv(ME.mul(ME.F(2, 3), ME.I(6)), ME.I(4), '⅔ × 6'); eqv(ME.div(ME.I(3), ME.F(3, 4)), ME.I(4), '3 ÷ ¾');
    eqv(ME.add(ME.D('2.5'), ME.D('1.75')), ME.D('4.25'), '2.5 + 1.75'); eqv(ME.mul(ME.D('1.2'), ME.D('0.5')), ME.D('0.6'), '1.2 × 0.5');
  });
  test('values: canonical display (spec 01 §4.1)', () => {
    assert(ME.fmt(ME.F(8, 3)) === '2 2/3', 'improper → mixed: ' + ME.fmt(ME.F(8, 3)));
    assert(ME.fmt(ME.F(6, 8)) === '3/4', 'simplest form'); assert(ME.fmt(ME.mul(ME.F(2, 3), ME.I(6), 'frac')) === '4', 'whole result shown whole');
    assert(ME.fmt(ME.D('2.50')) === '2.5', 'no trailing zeros: ' + ME.fmt(ME.D('2.50'))); assert(ME.fmt(ME.D('0.05')) === '0.05', '0.05');
    assert(ME.fmt(ME.I(7)) === '7', 'whole'); assert(ME.decText(ME.F(1, 3)) === null, '⅓ has no finite decimal');
    assert(ME.tok(ME.F(7, 3)) === '[2 1/3]', 'mixed token'); assert(/class="fr"/.test(ME.fmtHtml(ME.F(3, 4))), 'stacked fraction HTML');
  });
  test('values: reading answers back', () => {
    eqv(ME.parse('2 1/3'), ME.F(7, 3)); eqv(ME.parse('3/4'), ME.F(3, 4)); eqv(ME.parse('2.5'), ME.F(5, 2)); eqv(ME.parse('12'), ME.I(12));
    assert(ME.parse('abc') === null, 'nonsense is null');
  });

  /* ----- every level ----- */
  const N = isNode ? 400 : 250;
  const LIMITS = {   // number ranges from the ladder (spec 01 §3), checked on the numbers written in the problem and the answer
    1: { max: 5 }, 2: { max: 10 }, 3: { max: 10 }, 4: { max: 10 }, 5: { max: 20 }, 6: { max: 20 }, 7: { max: 100 }, 8: { max: 99 }, 9: { max: 100 }, 10: { max: 100 },
    11: { max: 100 }, 12: { max: 100 }, 13: { max: 50 }, 14: { max: 100 }, 15: { max: 100 }, 16: { max: 100 }, 17: { max: 1000 }, 18: { max: 990 }, 19: { max: 1000 }, 20: { max: 999 }, 21: { max: 10000 },
    22: { max: 120 }, 23: { max: 12 }, 24: { max: 100 }
  };
  for (let n = 1; n <= ME.MAX_LEVEL; n++) {
    test(`level ${n} (${ME.LV[n].name[0]}): right answers, ranges and wrong answers`, () => {
      for (let k = 0; k < N; k++) {
        const p = ME.make(n);
        assert(p && p.lv === n, 'no problem'); assert(!/-/.test(p.e.replace(/[−]/g, '')), 'ASCII minus in ' + p.e);
        assert(p.a.n >= 0, 'negative answer ' + p.e); assert(p.key === p.e, 'key');
        assert(evalExpr(p.e, p.a), `wrong answer: ${p.e} = ${ME.fmt(p.a)}`);
        const L = LIMITS[n]; if (L) for (const x of (p.e.match(/\d+/g) || []).map(Number).concat(ME.num(p.a))) assert(x <= L.max, `${x} is above ${L.max} in ${p.e}`);
        if (ME.LV[n].type === 'int') assert(ME.isWhole(p.a), 'a whole-number level gave ' + ME.fmt(p.a));
        const ds = ME.distractors(p, 3);
        assert(ds.length === 3, `only ${ds.length} wrong answers for ${p.e} = ${ME.fmt(p.a)}`);
        const shown = new Set(ds.map(ME.fmt)); assert(shown.size === 3 && !shown.has(ME.fmt(p.a)), 'wrong answers repeat or show the answer: ' + p.e);
        for (const d of ds) { assert(!ME.eq(d, p.a), 'a wrong answer equals the answer in value: ' + p.e); assert(d.n >= 0, 'negative wrong answer'); if (ME.isWhole(p.a) && p.a.k !== 'dec') assert(ME.isWhole(d), 'a fraction among whole-number answers: ' + p.e); }
      }
    });
  }
  test('specific forms from the ladder', () => {
    const many = (n, k = 600) => Array.from({ length: k }, () => ME.make(n));
    for (const p of many(5)) { const [a, , b] = p.e.split(' ').map(Number); if (p.form === 'a+b') assert((a % 10) + (b % 10) <= 9, 'level 5 crosses ten: ' + p.e); }
    for (const p of many(6)) if (p.form === 'a+b') { const [a, , b] = p.e.split(' ').map(Number); assert(a + b > 10, 'level 6 should cross ten: ' + p.e); }
    for (const p of many(7)) for (const x of p.e.match(/\d+/g).map(Number)) assert(x % 10 === 0, 'level 7 whole tens: ' + p.e);
    for (const p of many(15)) assert(p.a.n >= 1 && p.a.n <= 10, 'level 15 quotient 1–10: ' + p.e);
    for (const p of many(22)) assert(/^\{of:\[(1\/2|1\/3|1\/4|3\/4)\]\|\d+\}$/.test(p.e), 'level 22 fractions ½ ⅓ ¼ ¾: ' + p.e);
    for (const p of many(25)) { const ds = p.e.match(/\/(\d+)\]/g).map(x => +x.slice(1, -1)); assert(ds[0] === ds[1] && ds[0] <= 12, 'level 25 same denominator ≤ 12: ' + p.e); }
    for (const p of many(33)) for (const x of p.e.match(/\d+\.\d+/g)) assert(x.split('.')[1].length === 1, 'level 33 one decimal place: ' + p.e);
    for (const p of many(34)) assert([10, 20, 25, 50, 75].includes(+p.e.match(/(\d+)%/)[1]), 'level 34 easy percentages: ' + p.e);
  });

  /* ----- building backward from a target answer (spec 01 §5.2) ----- */
  test('every answer of every enumerated level can be built backward', () => {
    for (let n = 1; n <= ME.MAX_LEVEL; n++) { const vals = ME.answers(n); if (!vals) continue; for (const v of vals) { const p = ME.make(n, { target: v }); assert(p && ME.eq(p.a, v), `level ${n}: cannot build ${ME.fmt(v)}`); } }
  });
  test('levels with big numbers build backward', () => {
    for (let t = 20; t <= 1000; t += 7) { const p = ME.make(17, { target: ME.I(t) }); assert(p && ME.eq(p.a, ME.I(t)) && evalExpr(p.e, p.a), 'level 17 target ' + t); }
    for (let t = 200; t <= 10000; t += 137) { const p = ME.make(21, { target: ME.I(t) }); assert(p && ME.eq(p.a, ME.I(t)) && evalExpr(p.e, p.a), 'level 21 target ' + t); }
    for (const s of ['0.5', '1.25', '3.7', '12.05', '7']) { const p = ME.make(28, { target: ME.D(s) }); assert(p && ME.eq(p.a, ME.D(s)) && evalExpr(p.e, p.a), 'level 28 target ' + s); }
    for (const s of ['0.37', '45', '3.7', '0.045']) { const p = ME.make(29, { target: ME.D(s) }); assert(p && ME.eq(p.a, ME.D(s)) && evalExpr(p.e, p.a), 'level 29 target ' + s); }
    assert(ME.make(2, { target: ME.I(50) }) === null, 'an impossible target gives null');
  });
  test('old spells stay reachable at higher levels (spec 01 §5.1 example: 3)', () => {
    for (const n of [15, 22]) { const p = ME.make(n, { target: ME.I(3) }); assert(p && ME.eq(p.a, ME.I(3)), 'level ' + n + ' cannot make 3'); }
    assert(ME.make(7, { target: ME.I(3) }) === null, 'level 7 (whole tens) cannot make 3');
  });

  /* ----- choosing the next problem: review share and weak spots ----- */
  test('about 20% review from earlier levels (spec 01 §5.2)', () => {
    let rev = 0; const T = 2000; for (let k = 0; k < T; k++) { const p = ME.next(10, {}); if (p.src === 'review') { rev++; assert(p.lv < 10, 'review from a higher level'); } }
    assert(rev / T > 0.14 && rev / T < 0.26, 'review share ' + (rev / T).toFixed(2));
    const lvs = {}; for (let k = 0; k < 3000; k++) { const r = ME.reviewLevel(10); lvs[r] = (lvs[r] || 0) + 1; } assert(lvs[9] > lvs[8] && lvs[8] > lvs[1], 'review favours recent levels');
  });
  test('weak spots come back until answered right 3 times in a row (spec 01 §5.4)', () => {
    const facts = {}, p = ME.make(14); ME.noteFact(facts, p, false); assert(facts[p.key] && facts[p.key].w === 1, 'a mistake is remembered');
    let back = 0; for (let k = 0; k < 400; k++) if (ME.next(14, { facts }).key === p.key) back++; assert(back > 60, 'the weak spot comes back often: ' + back);
    const q = ME.next(14, { facts: { x: Object.assign({}, facts[p.key]) } }); assert(q.ops === null || typeof q.ops === 'object', 'rebuilt weak spot'); ME.distractors(q, 3);
    ME.noteFact(facts, p, true); ME.noteFact(facts, p, true); assert(facts[p.key], 'still weak after 2'); ME.noteFact(facts, p, true); assert(!facts[p.key], 'cleared after 3 right in a row');
    const fr = ME.make(31); const f2 = {}; ME.noteFact(f2, fr, false); const back2 = ME.next(31, { facts: f2 }); if (back2.key === fr.key) assert(ME.distractors(back2, 3).length === 3, 'a saved fraction weak spot still gets wrong answers');
  });
  test('recent problems are not repeated', () => {
    const avoid = new Set(); for (let k = 0; k < 10; k++) { const p = ME.next(13, { avoid, noReview: true }); assert(!avoid.has(p.key), 'repeated ' + p.key); avoid.add(p.key); }
  });

  /* ----- moving up and down (spec 01 §6) ----- */
  const H = (spec) => spec.split('').map(c => c === '1' ? { ok: 1, u: 1, d: 1 } : c === '0' ? { ok: 0, u: 1, d: 1 } : c === 'c' ? { ok: 1, u: .5, d: 1 } : { ok: 0, u: .5, d: 1 });
  test('move up: 85% over the last 10–12 answers', () => {
    assert(ME.judge(H('1111111111'), 0) === 'up', '10 of 10'); assert(ME.judge(H('111111111'), 0) === '', '9 answers are too few');
    assert(ME.judge(H('011111111111'), 0) === 'up', '11 of 12 = 92%'); assert(ME.judge(H('001111111111'), 0) === '', '10 of 12 = 83% is not enough');
  });
  test('move down: below 50% over the last 8 answers', () => {
    assert(ME.judge(H('00000000'), 0) === 'down', '0 of 8'); assert(ME.judge(H('00010001'), 0) === 'down', '2 of 8'); assert(ME.judge(H('01010101'), 0) === '', '4 of 8 = 50% stays');
  });
  test('shop and review answers count half toward moving up, a mistake counts fully', () => {
    assert(ME.judge(H('cccccccccc'), 0) === '', '10 shop answers = 5: not enough to move up');
    assert(ME.judge(H('cccccccccccccccccccc'), 0) === 'up', '20 right shop answers move up');
    assert(ME.judge(H('mmmmmmmm'), 0) === 'down', '8 wrong shop answers move down');
  });
  test('placement: a window of 5 for a new student', () => {
    assert(ME.judge(H('11111'), 15) === 'up', 'placement up after 5'); assert(ME.judge(H('00000'), 15) === 'down', 'placement down after 5'); assert(ME.judge(H('1111'), 15) === '', 'too few');
  });
  test('grades: the first level of each grade', () => { assert(ME.gradeStart(1) === 1 && ME.gradeStart(3) === 13 && ME.gradeStart(6) === 31, 'grade starts'); assert(ME.gradeOf(13) === 3, 'gradeOf'); });

  /* ----- report ----- */
  const failed = results.filter(r => !r.ok);
  if (isNode) {
    for (const r of results) console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n      ' + r.msg));
    console.log(`\n${results.length - failed.length} of ${results.length} tests passed`); if (failed.length) process.exitCode = 1;
  } else globalThis.MATH_TEST_RESULTS = results;
})();
