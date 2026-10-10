/* Math Wizard: the math engine (spec 01, the math ladder).
   One file, used by the game (index.html), the tests (tests/) and the debug page (debug.html). It has no game state of its own.

   - Values: whole numbers, fractions and decimals are all exact fractions {n, d, k}. k is how the value is SHOWN: 'int', 'frac' or 'dec'.
     Answers are compared by value, never by text (½ = 2/4 = 0.5). Only the display is canonical (spec 01 §4.1).
   - Problems: { lv, e, a, key, ops, form }. e is the expression with neutral tokens: + − × ÷, □ for the missing number,
     [3/4] or [2 1/3] for fractions, {of:A|B}, {double:A}, {half:A}, {ratio:A|B} for problems with words. The game turns the tokens
     into the student's language; the ÷ sign becomes ':' in Hebrew. a is the answer (a value). key = e (also the statistics key).
   - Every level can build a problem BACKWARD from a target answer (spec 01 §5.2): make(lv, {target}).
*/
(function (root) {
  'use strict';

  /* ====================== VALUES ====================== */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const lcm = (a, b) => a / gcd(a, b) * b;
  function V(n, d = 1, k) {   // a value n/d, always in lowest terms with d > 0
    if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error('bad value ' + n + '/' + d);
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    return { n: n / g, d: d / g, k: k || (d / g === 1 ? 'int' : 'frac') };
  }
  const kindOf = (a, b) => a.k === 'dec' || b.k === 'dec' ? 'dec' : a.k === 'frac' || b.k === 'frac' ? 'frac' : 'int';
  const add = (a, b, k) => V(a.n * b.d + b.n * a.d, a.d * b.d, k || kindOf(a, b));
  const sub = (a, b, k) => V(a.n * b.d - b.n * a.d, a.d * b.d, k || kindOf(a, b));
  const mul = (a, b, k) => V(a.n * b.n, a.d * b.d, k || kindOf(a, b));
  const div = (a, b, k) => V(a.n * b.d, a.d * b.n, k || kindOf(a, b));
  const eq = (a, b) => a.n * b.d === b.n * a.d;
  const lt = (a, b) => a.n * b.d < b.n * a.d;
  const num = v => v.n / v.d;
  const I = n => V(n, 1, 'int');
  const F = (n, d) => V(n, d, 'frac');
  function D(s) {   // a decimal from its text, e.g. D('2.75') (never negative in this game)
    const [w, f = ''] = String(s).trim().split('.');
    return V(Number((w || '0') + f), 10 ** f.length, 'dec');
  }
  const isWhole = v => v.d === 1;
  // the decimal digits of a value whose denominator divides a power of ten (2s and 5s only); null when it has no finite decimal
  function decText(v) {
    let p = 0, pw = 1; while (p <= 8 && (v.n * pw) % v.d !== 0) { p++; pw *= 10; }
    if (p > 8) return null;
    const neg = v.n < 0, sc = Math.abs(v.n) * pw / v.d, s = String(sc).padStart(p + 1, '0');
    return (neg ? '-' : '') + (p ? s.slice(0, s.length - p) + '.' + s.slice(s.length - p) : s);
  }
  // the canonical TOKEN of a value inside an expression: 7, 2.5, [3/4], [2 1/3]
  function tok(v) {
    if (isWhole(v)) return String(v.n);
    if (v.k === 'dec') { const t = decText(v); if (t !== null) return t; }
    const w = Math.trunc(v.n / v.d), r = Math.abs(v.n % v.d);
    return w ? `[${w} ${r}/${v.d}]` : `[${v.n}/${v.d}]`;
  }
  const fmt = v => tokText(tok(v));          // plain text: 7, 2.5, 3/4, 2 1/3
  const fmtHtml = v => tokHtml(tok(v));      // HTML: fractions are stacked
  // fraction tokens → text or stacked HTML ([□/8] is allowed: a missing numerator or denominator)
  const FR_TOK = /\[(?:(\d+) )?([\d□]+)\/([\d□]+)\]/g;
  const tokText = s => s.replace(FR_TOK, (m, w, a, b) => (w ? w + ' ' : '') + a + '/' + b);
  const tokHtml = s => s.replace(FR_TOK, (m, w, a, b) => `<span class="frw">${w ? `<span class="frn">${w}</span>` : ''}<span class="fr"><span class="frt">${a}</span><span class="frb">${b}</span></span></span>`);
  // read a typed or stored answer back into a value ("3/4", "2 1/3", "2.5", "7")
  function parse(s) {
    s = String(s).trim().replace(/\s+/g, ' ');
    let m;
    if ((m = s.match(/^(\d+) (\d+)\/(\d+)$/))) return add(I(+m[1]), F(+m[2], +m[3]), 'frac');
    if ((m = s.match(/^(\d+)\/(\d+)$/))) return +m[2] ? F(+m[1], +m[2]) : null;
    if (/^\d*\.\d+$|^\d+\.\d*$/.test(s)) return D(s);
    if (/^\d+$/.test(s)) return I(+s);
    return null;
  }
  const valJSON = v => [v.n, v.d, v.k];
  const valFrom = j => Array.isArray(j) ? V(j[0], j[1], j[2]) : j;
  // problem parts saved in the profile (weak spots) store values as [n, d, k]; these turn them back into values
  const opsJSON = o => o ? JSON.parse(JSON.stringify(o, (k, v) => v && typeof v === 'object' && v.n !== undefined && v.d !== undefined ? valJSON(v) : v)) : null;
  const opsFrom = o => { if (!o) return null; const r = {}; for (const [k, v] of Object.entries(o)) r[k] = Array.isArray(v) && v.length === 3 ? valFrom(v) : v; return r; };

  /* ====================== RANDOM (replaceable for tests) ====================== */
  let rand = Math.random;
  const rint = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const pick = arr => arr[Math.floor(rand() * arr.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const range = (a, b, step = 1) => { const r = []; for (let x = a; x <= b; x += step) r.push(x); return r; };

  /* ====================== EXPRESSION HELPERS ====================== */
  const PLUS = '+', MINUS = '−', TIMES = '×', DIVS = '÷', BOX = '□';
  const P = (lv, e, a, form, ops) => ({ lv, e, a, key: e, form, ops: ops || null });
  const ft = (n, d) => `[${n}/${d}]`;                                  // a fraction token exactly as written (not simplified: [6/8] stays 6/8)
  const mixedTok = (w, n, d) => w ? `[${w} ${n}/${d}]` : ft(n, d);
  const ones = x => x % 10;

  /* ====================== THE LADDER ====================== */
  // Each level: name [English, Hebrew], grade, answer type, and either all() (every problem of the level, cached) or gen() + forT(target) for the levels with big numbers.
  const LV = {};
  const lv = (n, def) => { LV[n] = Object.assign({ n }, def); };

  // ---- Grade 1: up to 20 ----
  lv(1, { name: ['Addition up to 5', 'חיבור עד 5'], g: 1, type: 'int', all: () => {
    const o = []; for (let a = 1; a <= 4; a++) for (let b = 1; a + b <= 5; b++) o.push(P(1, `${a} ${PLUS} ${b}`, I(a + b), 'a+b', { a, b, op: '+' })); return o; } });
  lv(2, { name: ['Addition up to 10', 'חיבור עד 10'], g: 1, type: 'int', all: () => {
    const o = []; for (let a = 1; a <= 9; a++) for (let b = 1; a + b <= 10; b++) o.push(P(2, `${a} ${PLUS} ${b}`, I(a + b), 'a+b', { a, b, op: '+' })); return o; } });
  lv(3, { name: ['Subtraction up to 10', 'חיסור עד 10'], g: 1, type: 'int', all: () => {
    const o = []; for (let a = 2; a <= 10; a++) for (let b = 1; b < a; b++) o.push(P(3, `${a} ${MINUS} ${b}`, I(a - b), 'a-b', { a, b, op: '-' })); return o; } });
  lv(4, { name: ['Mixed and missing number up to 10', 'חיבור וחיסור, מספר חסר'], g: 1, type: 'int', all: () => {
    const o = [];
    for (let a = 1; a <= 9; a++) for (let b = 1; a + b <= 10; b++) {
      o.push(P(4, `${a} ${PLUS} ${b}`, I(a + b), 'a+b', { a, b, op: '+' }));
      o.push(P(4, `${a} ${PLUS} ${BOX} = ${a + b}`, I(b), 'a+□=c', { a: a + b, b: a, op: '-' }));   // the missing addend: c − a
      o.push(P(4, `${BOX} ${MINUS} ${a} = ${b}`, I(a + b), '□-b=c', { a: a, b, op: '+' }));        // the start: c + b
    }
    for (let a = 2; a <= 10; a++) for (let b = 1; b < a; b++) o.push(P(4, `${a} ${MINUS} ${b}`, I(a - b), 'a-b', { a, b, op: '-' }));
    return o; } });
  lv(5, { name: ['Up to 20, no crossing ten', 'עד 20 בלי מעבר עשרת'], g: 1, type: 'int', all: () => {
    const o = [];
    for (let x = 0; x <= 8; x++) for (let b = 1; x + b <= 9; b++) { const a = 10 + x; o.push(P(5, `${a} ${PLUS} ${b}`, I(a + b), 'a+b', { a, b, op: '+' })); if (x) o.push(P(5, `${b} ${PLUS} ${a}`, I(a + b), 'a+b', { a: b, b: a, op: '+' })); }
    for (let x = 1; x <= 9; x++) for (let b = 1; b <= x; b++) { const a = 10 + x; o.push(P(5, `${a} ${MINUS} ${b}`, I(a - b), 'a-b', { a, b, op: '-' })); }
    return o; } });
  lv(6, { name: ['Up to 20, crossing ten', 'עד 20 עם מעבר עשרת'], g: 1, type: 'int', all: () => {
    const o = [];
    for (let a = 2; a <= 9; a++) for (let b = 2; b <= 9; b++) if (a + b >= 11) {
      o.push(P(6, `${a} ${PLUS} ${b}`, I(a + b), 'a+b', { a, b, op: '+' }));
      o.push(P(6, `${a} ${PLUS} ${BOX} = ${a + b}`, I(b), 'a+□=c', { a: a + b, b: a, op: '-' }));
    }
    for (let a = 11; a <= 18; a++) for (let b = a - 9; b <= 9; b++) if (b > a - 10) {
      o.push(P(6, `${a} ${MINUS} ${b}`, I(a - b), 'a-b', { a, b, op: '-' }));
      o.push(P(6, `${BOX} ${MINUS} ${b} = ${a - b}`, I(a), '□-b=c', { a: a - b, b, op: '+' }));
    }
    return o; } });

  // ---- Grade 2: up to 100, first multiplication ----
  lv(7, { name: ['Whole tens', 'עשרות שלמות'], g: 2, type: 'int', all: () => {
    const o = []; for (let a = 10; a <= 90; a += 10) for (let b = 10; b <= 90; b += 10) {
      if (a + b <= 100) o.push(P(7, `${a} ${PLUS} ${b}`, I(a + b), 'a+b', { a, b, op: '+' }));
      if (a - b >= 10) o.push(P(7, `${a} ${MINUS} ${b}`, I(a - b), 'a-b', { a, b, op: '-' }));
    }
    for (let b = 10; b <= 90; b += 10) o.push(P(7, `100 ${MINUS} ${b}`, I(100 - b), 'a-b', { a: 100, b, op: '-' }));
    return o; } });
  lv(8, { name: ['Two-digit ± one-digit, no crossing', 'דו-ספרתי ועוד חד-ספרתי'], g: 2, type: 'int', all: () => {
    const o = []; for (let a = 10; a <= 99; a++) for (let b = 1; b <= 9; b++) {
      if (ones(a) + b <= 9) o.push(P(8, `${a} ${PLUS} ${b}`, I(a + b), 'a+b', { a, b, op: '+' }));
      if (b <= ones(a) && a - b >= 10) o.push(P(8, `${a} ${MINUS} ${b}`, I(a - b), 'a-b', { a, b, op: '-' }));
    }
    return o; } });
  lv(9, { name: ['Two-digit ± one-digit, crossing', 'דו-ספרתי ועוד חד-ספרתי, עם מעבר עשרת'], g: 2, type: 'int', all: () => {
    const o = []; for (let a = 11; a <= 99; a++) for (let b = 2; b <= 9; b++) {
      if (ones(a) && ones(a) + b >= 10 && a + b <= 100) o.push(P(9, `${a} ${PLUS} ${b}`, I(a + b), 'a+b', { a, b, op: '+' }));
      if (a >= 20 && b > ones(a)) o.push(P(9, `${a} ${MINUS} ${b}`, I(a - b), 'a-b', { a, b, op: '-' }));
    }
    return o; } });
  lv(10, { name: ['Two-digit ± two-digit', 'דו-ספרתי ועוד דו-ספרתי'], g: 2, type: 'int', all: () => {
    const o = []; for (let a = 10; a <= 90; a++) for (let b = 10; b <= 90; b++) {
      if (a + b <= 100) { o.push(P(10, `${a} ${PLUS} ${b}`, I(a + b), 'a+b', { a, b, op: '+' })); if (b % 3 === 0) o.push(P(10, `${a} ${PLUS} ${BOX} = ${a + b}`, I(b), 'a+□=c', { a: a + b, b: a, op: '-' })); }
      if (a - b >= 1) { o.push(P(10, `${a} ${MINUS} ${b}`, I(a - b), 'a-b', { a, b, op: '-' })); if (b % 3 === 1) o.push(P(10, `${BOX} ${MINUS} ${b} = ${a - b}`, I(a), '□-b=c', { a: a - b, b, op: '+' })); }
    }
    return o; } });
  lv(11, { name: ['Multiplication by 2, 5, 10', 'כפל ב-2, 5, 10'], g: 2, type: 'int', all: () => {
    const o = []; for (const f of [2, 5, 10]) for (let k = 1; k <= 10; k++) { o.push(P(11, `${f} ${TIMES} ${k}`, I(f * k), 'a×b', { a: f, b: k, op: '×' })); if (k !== f) o.push(P(11, `${k} ${TIMES} ${f}`, I(f * k), 'a×b', { a: k, b: f, op: '×' })); }
    return o; } });
  lv(12, { name: ['Multiplication, doubles and halves', 'כפל, כפולות וחצאים'], g: 2, type: 'int', all: () => {
    const o = []; for (const f of [2, 3, 4, 5, 10]) for (let k = 1; k <= 10; k++) { o.push(P(12, `${f} ${TIMES} ${k}`, I(f * k), 'a×b', { a: f, b: k, op: '×' })); if (k !== f) o.push(P(12, `${k} ${TIMES} ${f}`, I(f * k), 'a×b', { a: k, b: f, op: '×' })); }
    for (let k = 2; k <= 25; k++) o.push(P(12, `{double:${k}}`, I(2 * k), 'double', { a: k, b: 2, op: '×' }));
    for (let k = 1; k <= 25; k++) o.push(P(12, `{half:${2 * k}}`, I(k), 'half', { a: 2 * k, b: 2, op: '÷' }));
    return o; } });

  // ---- Grade 3: the multiplication table, up to 1000 ----
  const table = (n, aLo, aHi) => { const o = []; for (let a = aLo; a <= aHi; a++) for (let b = 1; b <= 10; b++) { o.push(P(n, `${a} ${TIMES} ${b}`, I(a * b), 'a×b', { a, b, op: '×' })); if (b < aLo || b > aHi) o.push(P(n, `${b} ${TIMES} ${a}`, I(a * b), 'a×b', { a: b, b: a, op: '×' })); } return o; };
  lv(13, { name: ['Times table 1–5', 'לוח הכפל 1–5'], g: 3, type: 'int', all: () => table(13, 1, 5) });
  lv(14, { name: ['Times table 6–10', 'לוח הכפל 6–10'], g: 3, type: 'int', all: () => table(14, 6, 10) });
  lv(15, { name: ['Division within the table', 'חילוק בלוח הכפל'], g: 3, type: 'int', all: () => {
    const o = []; for (let b = 2; b <= 10; b++) for (let q = 1; q <= 10; q++) o.push(P(15, `${b * q} ${DIVS} ${b}`, I(q), 'a÷b', { a: b * q, b, op: '÷' })); return o; } });
  lv(16, { name: ['Missing factor', 'כפל וחילוק, גורם חסר'], g: 3, type: 'int', all: () => {
    const o = []; for (let a = 2; a <= 10; a++) for (let b = 1; b <= 10; b++) {
      o.push(P(16, `${a} ${TIMES} ${BOX} = ${a * b}`, I(b), 'a×□=c', { a: a * b, b: a, op: '÷' }));
      o.push(P(16, `${BOX} ${DIVS} ${a} = ${b}`, I(a * b), '□÷b=c', { a: b, b: a, op: '×' }));
    }
    return o; } });
  // levels with big numbers: random problems are built around a random answer; forT builds one for a given answer
  const plusMinus = (n, lo, hi, step, minOp) => ({
    gen() { const t = Math.round(rint(lo, hi) / step) * step || step; return this.forT(I(t)); },
    forT(v) {
      if (!isWhole(v) || v.n < 1 || v.n > hi) return null; const t = v.n, s = t % step === 0 ? step : 1;
      const canPlus = t >= 2 * minOp, canMinus = t + minOp <= hi;
      if (!canPlus && !canMinus) return null;
      if (canPlus && (!canMinus || rand() < .5)) { const a = Math.round(rint(minOp, t - minOp) / s) * s; if (a >= minOp && t - a >= minOp) return P(n, `${a} ${PLUS} ${t - a}`, I(t), 'a+b', { a, b: t - a, op: '+' }); }
      const b = Math.round(rint(minOp, Math.max(minOp, hi - t)) / s) * s || minOp; if (t + b > hi) return null;
      return P(n, `${t + b} ${MINUS} ${b}`, I(t), 'a-b', { a: t + b, b, op: '-' });
    }
  });
  lv(17, Object.assign({ name: ['Addition and subtraction up to 1000', 'חיבור וחיסור עד 1000'], g: 3, type: 'int' }, plusMinus(17, 100, 1000, 1, 10)));
  lv(18, { name: ['Multiply by 10 and 100', 'כפל ב-10 וב-100'], g: 3, type: 'int', all: () => {
    const o = [];
    for (let a = 2; a <= 99; a++) o.push(P(18, `${a} ${TIMES} 10`, I(a * 10), 'a×10', { a, b: 10, op: '×' }));
    for (let a = 2; a <= 30; a++) o.push(P(18, `10 ${TIMES} ${a}`, I(a * 10), 'a×10', { a: 10, b: a, op: '×' }));
    for (let a = 2; a <= 9; a++) o.push(P(18, `${a} ${TIMES} 100`, I(a * 100), 'a×100', { a, b: 100, op: '×' }));
    for (let a = 11; a <= 44; a++) for (let b = 2; b <= 4; b++) if (ones(a) * b < 10 && Math.floor(a / 10) * b < 10) o.push(P(18, `${a} ${TIMES} ${b}`, I(a * b), 'a×b', { a, b, op: '×' }));
    return o; } });

  // ---- Grade 4: big numbers, first fractions ----
  lv(19, { name: ['Multiply by one digit', 'כפל במספר חד-ספרתי'], g: 4, type: 'int', all: () => {
    const o = []; for (let b = 2; b <= 9; b++) for (let a = 11; a * b <= 1000; a++) if (a % 10) o.push(P(19, `${a} ${TIMES} ${b}`, I(a * b), 'a×b', { a, b, op: '×' })); return o; } });
  lv(20, { name: ['Divide by one digit', 'חילוק במספר חד-ספרתי'], g: 4, type: 'int', all: () => {
    const o = []; for (let b = 2; b <= 9; b++) for (let q = 2; b * q <= 999; q++) if (b * q >= 20) o.push(P(20, `${b * q} ${DIVS} ${b}`, I(q), 'a÷b', { a: b * q, b, op: '÷' })); return o; } });
  lv(21, Object.assign({ name: ['Addition and subtraction up to 10,000', 'חיבור וחיסור עד 10,000'], g: 4, type: 'int' }, plusMinus(21, 1000, 10000, 10, 100)));
  const FRAC_OF = [[1, 2], [1, 3], [1, 4], [3, 4]];
  lv(22, { name: ['Fraction of an amount', 'שבר מכמות'], g: 4, type: 'int', all: () => {
    const o = []; for (const [n, d] of FRAC_OF) for (let k = 1; n * k <= 30; k++) { const m = d * k; if (m >= 4) o.push(P(22, `{of:${ft(n, d)}|${m}}`, I(n * k), 'frac of', { a: m, b: d, op: '÷' })); } return o; } });
  lv(23, { name: ['Equivalent fractions', 'שברים שקולים'], g: 4, type: 'int', all: () => {
    const o = []; for (let b = 2; b <= 6; b++) for (let a = 1; a < b; a++) if (gcd(a, b) === 1) for (let k = 2; b * k <= 12; k++) {
      o.push(P(23, `${ft(a, b)} = ${ft(BOX, b * k)}`, I(a * k), '=□/n', { a, b: k, op: '×' }));
      o.push(P(23, `${ft(a, b)} = ${ft(a * k, BOX)}`, I(b * k), '=n/□', { a: b, b: k, op: '×' }));
      o.push(P(23, `${ft(a * k, b * k)} = ${ft(a, BOX)}`, I(b), 'simplify', { a: b * k, b: k, op: '÷' }));
    }
    return o; } });
  lv(24, { name: ['Order of operations', 'סדר פעולות חשבון'], g: 4, type: 'int', all: () => {
    const o = [];
    for (let a = 1; a <= 9; a++) for (let b = 2; b <= 6; b++) for (let c = 2; c <= 6; c++) o.push(P(24, `${a} ${PLUS} ${b} ${TIMES} ${c}`, I(a + b * c), 'a+b×c', { a: (a + b) * c, b: a + b * c, op: 'order' }));
    for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) for (let c = 2; c <= 5; c++) o.push(P(24, `(${a} ${PLUS} ${b}) ${TIMES} ${c}`, I((a + b) * c), '(a+b)×c', { a: a + b * c, b: (a + b) * c, op: 'order' }));
    for (let a = 2; a <= 9; a++) for (let b = 2; b <= 9; b++) for (let c = 1; c <= 9; c++) if (a * b - c >= 1) o.push(P(24, `${a} ${TIMES} ${b} ${MINUS} ${c}`, I(a * b - c), 'a×b−c', { a: a * (b - c), b: a * b - c, op: 'order' }));   // the wrong order: a × (b − c)
    return o; } });

  // ---- Grade 5: fractions and decimals ----
  const DENS = [2, 3, 4, 5, 6, 8, 10, 12];
  lv(25, { name: ['Fractions, same denominator', 'חיבור וחיסור שברים, מכנה שווה'], g: 5, type: 'frac', all: () => {
    const o = []; for (const n of DENS) for (let a = 1; a < n; a++) for (let b = 1; b < n; b++) {
      o.push(P(25, `${ft(a, n)} ${PLUS} ${ft(b, n)}`, add(F(a, n), F(b, n), 'frac'), 'a/n+b/n', { fa: F(a, n), fb: F(b, n), op: '+' }));
      if (a > b) o.push(P(25, `${ft(a, n)} ${MINUS} ${ft(b, n)}`, sub(F(a, n), F(b, n), 'frac'), 'a/n−b/n', { fa: F(a, n), fb: F(b, n), op: '-' }));
    }
    return o; } });
  lv(26, { name: ['Fractions, different denominators', 'מכנים שונים, מספרים מעורבים'], g: 5, type: 'frac', all: () => {
    const o = [], D2 = [2, 3, 4, 5, 6, 8, 10, 12];
    for (const m of D2) for (const n of D2) if (m < n && lcm(m, n) <= 24) for (let a = 1; a < m; a++) for (let b = 1; b < n; b++) {
      if (gcd(a, m) !== 1 || gcd(b, n) !== 1) continue;
      for (let w = 0; w <= 2; w++) {
        const x = add(I(w), F(a, m), 'frac'), y = F(b, n), xs = mixedTok(w, a, m), ys = ft(b, n);
        if (w === 0 || (a + b) % 2 === 0) o.push(P(26, `${xs} ${PLUS} ${ys}`, add(x, y, 'frac'), 'a/m+b/n', { fa: x, fb: y, op: '+' }));
        if (lt(y, x) && (w > 0 || a * n !== b * m)) o.push(P(26, `${xs} ${MINUS} ${ys}`, sub(x, y, 'frac'), 'a/m−b/n', { fa: x, fb: y, op: '-' }));
      }
    }
    return o; } });
  const FD = [2, 3, 4, 5, 6, 8, 10];
  lv(27, { name: ['Fraction × whole number', 'שבר כפול מספר שלם'], g: 5, type: 'frac', all: () => {
    const o = []; for (const n of FD) for (let a = 1; a < n; a++) if (gcd(a, n) === 1) for (let k = 2; k <= 12; k++) {
      o.push(P(27, `${ft(a, n)} ${TIMES} ${k}`, mul(F(a, n), I(k), 'frac'), 'a/n×k', { fa: F(a, n), fb: I(k), op: '×' }));
      if (k % 3 === 0) o.push(P(27, `${k} ${TIMES} ${ft(a, n)}`, mul(F(a, n), I(k), 'frac'), 'k×a/n', { fa: I(k), fb: F(a, n), op: '×' }));
    }
    return o; } });
  const decTok = v => decText(v);
  lv(28, { name: ['Add and subtract decimals', 'חיבור וחיסור עשרוניים'], g: 5, type: 'dec',
    gen() { const h = rand() < .5 ? 10 : 1; return this.forT(V(rint(30 / h, 1500 / h) * h, 100, 'dec')); },
    forT(v) {   // works in hundredths: t = a ± b, with a and b having one or two decimal places
      const T = v.n * 100 / v.d; if (!Number.isInteger(T) || T < 2 || T > 3000) return null;
      const tenths = T % 10 === 0, step = tenths && rand() < .7 ? 10 : 1;
      if (rand() < .55 && T >= 2 * step) { let a = Math.round(rint(step, T - step) / step) * step; if (a <= 0 || a >= T) a = step; const A = V(a, 100, 'dec'), B = V(T - a, 100, 'dec'); return P(28, `${decTok(A)} ${PLUS} ${decTok(B)}`, V(T, 100, 'dec'), 'a+b', { fa: A, fb: B, op: '+' }); }
      const b = Math.round(rint(step, Math.max(step, 1500)) / step) * step, A = V(T + b, 100, 'dec'), B = V(b, 100, 'dec');
      return P(28, `${decTok(A)} ${MINUS} ${decTok(B)}`, V(T, 100, 'dec'), 'a−b', { fa: A, fb: B, op: '-' });
    } });
  lv(29, { name: ['Decimals × and ÷ 10, 100, 1000', 'כפל וחילוק עשרוני ב-10, 100, 1000'], g: 5, type: 'dec',
    gen() {   // at most three decimal places in any number
      for (;;) {
        const p = pick([10, 100, 1000]), x = V(rint(11, 999), pick([10, 100]), 'dec');
        if (!isWhole(x) && rand() < .5) return P(29, `${decTok(x)} ${TIMES} ${p}`, mul(x, I(p), 'dec'), 'a×p', { fa: x, fb: I(p), op: '×' });
        const y = rand() < .5 ? V(rint(2, 999), 1, 'dec') : x, r = div(y, I(p), 'dec');
        if ((decText(r).split('.')[1] || '').length <= 3) return P(29, `${decTok(y)} ${DIVS} ${p}`, r, 'a÷p', { fa: y, fb: I(p), op: '÷' });
      }
    },
    forT(v) {
      const p = pick([10, 100, 1000]), a = div(v, I(p), 'dec'), b = mul(v, I(p), 'dec');
      const okDec = x => decText(x) !== null && decText(x).replace(/^\d+\.?/, '').length <= 3 && num(x) < 10000 && num(x) > 0;
      if (rand() < .5 && okDec(a) && !isWhole(a)) return P(29, `${decTok(a)} ${TIMES} ${p}`, v, 'a×p', { fa: a, fb: I(p), op: '×' });
      if (okDec(b) && num(b) <= 9999) return P(29, `${decTok(b)} ${DIVS} ${p}`, v, 'a÷p', { fa: b, fb: I(p), op: '÷' });
      return okDec(a) ? P(29, `${decTok(a)} ${TIMES} ${p}`, v, 'a×p', { fa: a, fb: I(p), op: '×' }) : null;
    } });
  lv(30, { name: ['Two-digit × two-digit; long division', 'כפל דו-ספרתי, חילוק ארוך'], g: 5, type: 'int', all: () => {
    const o = []; for (let a = 11; a <= 40; a++) for (let b = 11; b <= 25; b++) if (a % 10 && b % 10) o.push(P(30, `${a} ${TIMES} ${b}`, I(a * b), 'a×b', { a, b, op: '×' }));
    for (let b = 11; b <= 25; b++) for (let q = 2; b * q <= 999; q++) if (b % 10) o.push(P(30, `${b * q} ${DIVS} ${b}`, I(q), 'a÷b', { a: b * q, b, op: '÷' }));
    for (let b = 3; b <= 9; b++) for (let q = 12; b * q <= 999; q++) if (b * q >= 100) o.push(P(30, `${b * q} ${DIVS} ${b}`, I(q), 'a÷b', { a: b * q, b, op: '÷' }));
    return o; } });

  // ---- Grade 6: all operations, percentages and ratios ----
  lv(31, { name: ['Multiply fractions', 'כפל שברים'], g: 6, type: 'frac', all: () => {
    const o = []; for (const m of FD) for (const n of FD) for (let a = 1; a < m; a++) for (let b = 1; b < n; b++) if (gcd(a, m) === 1 && gcd(b, n) === 1 && m <= n)
      o.push(P(31, `${ft(a, m)} ${TIMES} ${ft(b, n)}`, mul(F(a, m), F(b, n), 'frac'), 'a/m×b/n', { fa: F(a, m), fb: F(b, n), op: '×' }));
    return o; } });
  lv(32, { name: ['Divide fractions', 'חילוק שברים'], g: 6, type: 'frac', all: () => {
    const o = []; for (const m of [2, 3, 4, 5, 6, 8]) for (const n of [2, 3, 4, 5, 6, 8]) for (let a = 1; a < m; a++) for (let b = 1; b < n; b++) if (gcd(a, m) === 1 && gcd(b, n) === 1 && (m === n || m % n === 0 || n % m === 0))
      o.push(P(32, `${ft(a, m)} ${DIVS} ${ft(b, n)}`, div(F(a, m), F(b, n), 'frac'), 'a/m÷b/n', { fa: F(a, m), fb: F(b, n), op: '÷' }));
    for (let k = 1; k <= 6; k++) for (const n of [2, 3, 4, 5, 6, 8]) for (let a = 1; a < n; a++) if (gcd(a, n) === 1)
      o.push(P(32, `${k} ${DIVS} ${ft(a, n)}`, div(I(k), F(a, n), 'frac'), 'k÷a/n', { fa: I(k), fb: F(a, n), op: '÷' }));
    return o; } });
  lv(33, { name: ['Multiply decimals', 'כפל עשרוניים'], g: 6, type: 'dec', all: () => {
    const o = []; for (let x = 1; x <= 50; x++) for (let y = x; y <= 50; y++) if (x % 10 && y % 10 && (x < 10 || y < 10 || x * y <= 900)) {
      const A = V(x, 10, 'dec'), B = V(y, 10, 'dec'); o.push(P(33, `${decTok(A)} ${TIMES} ${decTok(B)}`, mul(A, B, 'dec'), 'a×b', { fa: A, fb: B, op: '×' }));
    }
    return o; } });
  lv(34, { name: ['Percent of an amount', 'אחוזים מכמות'], g: 6, type: 'int', all: () => {
    const o = []; for (const p of [10, 20, 25, 50, 75]) for (let m = 4; m <= 400; m += 2) if ((p * m) % 100 === 0 && p * m / 100 <= 100 && (m % 10 === 0 || p === 25 || p === 75 || p === 50)) o.push(P(34, `{of:${p}%|${m}}`, I(p * m / 100), 'p% of a', { a: m, b: p, op: '%' }));
    return o; } });
  lv(35, { name: ['Harder percentages', 'אחוזים מתקדמים'], g: 6, type: 'int', all: () => {   // owner decision: no ratio problems ("the first part of 9 in the ratio 1:2")
    const o = []; for (const p of [5, 15, 30, 40, 60, 80, 90, 110, 120, 125, 150]) for (let m = 10; m <= 200; m += 10) if ((p * m) % 100 === 0 && p * m / 100 <= 150) o.push(P(35, `{of:${p}%|${m}}`, I(p * m / 100), 'p% of a', { a: m, b: p, op: '%' }));
    return o; } });
  lv(36, { name: ['Multi-step mix', 'תרגילים משולבים'], g: 6, type: 'frac', all: () => {
    const o = [], FR = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5]];
    for (const [a, b] of FR) for (const [c, d] of FR) if (a * d < c * b || (a === c && b === d)) for (let k = 2; k <= 24; k++) {
      const s = add(F(a, b), F(c, d), 'frac'), r = mul(s, I(k), 'frac'); if (isWhole(r) && r.n <= 40) o.push(P(36, `(${ft(a, b)} ${PLUS} ${ft(c, d)}) ${TIMES} ${k}`, r, '(a+b)×k', { fa: s, fb: I(k), op: '×' }));
    }
    for (const [a, b] of FR) for (let k = 2; k <= 24; k++) for (let m = 1; m <= 5; m++) { const r = sub(mul(F(a, b), I(k), 'frac'), I(m), 'frac'); if (isWhole(r) && r.n >= 1) o.push(P(36, `${ft(a, b)} ${TIMES} ${k} ${MINUS} ${m}`, r, 'a×k−m', { fa: mul(F(a, b), I(k), 'frac'), fb: I(m), op: '-' })); }
    for (let x = 1; x <= 9; x++) for (let y = 1; y <= 9; y++) for (const k of [2, 4, 5, 10]) { const r = mul(add(V(x * 5, 10, 'dec'), V(y * 5, 10, 'dec'), 'dec'), I(k), 'dec'); o.push(P(36, `(${decText(V(x * 5, 10, 'dec'))} ${PLUS} ${decText(V(y * 5, 10, 'dec'))}) ${TIMES} ${k}`, r, '(a+b)×k dec', { fa: add(V(x * 5, 10, 'dec'), V(y * 5, 10, 'dec'), 'dec'), fb: I(k), op: '×' })); }
    return o; } });

  const MAX_LEVEL = 36;   // (the key pools of spec 01 §5.1, used to choose spell numbers, come with the spell book in step 3)

  /* ====================== MAKING PROBLEMS ====================== */
  const CACHE = {};
  function all(n) {   // every problem of an enumerated level, grouped by answer value
    if (!CACHE[n]) { const list = LV[n].all(), by = new Map(); for (const p of list) { const k = p.a.n + '/' + p.a.d; if (!by.has(k)) by.set(k, []); by.get(k).push(p); } CACHE[n] = { list, by, vals: [...by.values()].map(g => g[0].a).sort((a, b) => num(a) - num(b)) }; }
    return CACHE[n];
  }
  // the answers a level can produce (enumerated levels: exactly; levels with big numbers: null = "almost any number in the range")
  const answers = n => LV[n].all ? all(n).vals : null;
  // make(n, {target, hard, avoid}) → one problem of level n. target: a value to build backward to (null if the level cannot make it).
  // hard: an answer from the top of the level's range (spec 01 §5.2.5). avoid: a Set of keys not to repeat.
  function make(n, o = {}) {
    const L = LV[n]; if (!L) throw new Error('no level ' + n);
    const ok = p => p && !(o.avoid && o.avoid.has(p.key));
    if (L.all) {
      const c = all(n);
      if (o.target) { const g = c.by.get(o.target.n + '/' + o.target.d); if (!g) return null; const f = g.filter(ok); return pick(f.length ? f : g); }
      let vals = c.vals; if (o.hard) vals = vals.slice(Math.floor(vals.length * .7));
      for (let i = 0; i < 12; i++) { const g = c.by.get((v => v.n + '/' + v.d)(pick(vals))), p = pick(g); if (ok(p)) return p; }
      return pick(c.list);
    }
    if (o.target) { for (let i = 0; i < 20; i++) { const p = L.forT(o.target); if (ok(p)) return p; } return L.forT(o.target); }
    for (let i = 0; i < 20; i++) { const p = L.gen(); if (p && ok(p) && (!o.hard || hardEnough(n, p))) return p; }
    return L.gen();
  }
  const hardEnough = (n, p) => n === 17 ? p.a.n >= 600 : n === 21 ? p.a.n >= 6000 : num(p.a) >= 5;

  /* ====================== WRONG ANSWERS (spec 01 §5.3) ====================== */
  // Close and plausible: ±1, ±10, swapped digits, the wrong operation; for fractions a wrong numerator or denominator.
  // A wrong answer is never equal in value to the right one, never negative, and looks like the same kind of number.
  function distractors(p, count = 3) {
    const a = p.a, out = [], seen = new Set([a.n + '/' + a.d]), shown = new Set([fmt(a)]);
    const put = v => { if (!v || out.length >= count) return; if (v.n <= 0 && !(v.n === 0 && isWhole(a))) return; if (v.n < 0) return; const key = v.n + '/' + v.d, f = fmt(v); if (seen.has(key) || shown.has(f)) return; if (isWhole(a) !== isWhole(v) && a.k !== 'dec') return; if (a.k === 'dec' && decText(v) === null) return; seen.add(key); shown.add(f); out.push(v); };
    const o = p.ops || {};
    if (isWhole(a) && a.k !== 'dec') {
      const x = a.n, cands = [];
      if (o.op === '+' && o.a != null) cands.push(Math.abs(o.a - o.b));
      if (o.op === '-' && o.a != null) cands.push(o.a + o.b);
      if (o.op === '×' && o.a != null) cands.push(o.a + o.b, o.a * (o.b + 1), (o.a + 1) * o.b);
      if (o.op === '÷' && o.a != null) cands.push(o.a - o.b, Math.round(o.a / o.b) + o.b);
      if (o.op === 'order' && o.a != null) cands.push(o.a);
      if (o.op === '%' && o.a != null) cands.push(o.a - x, Math.round(o.a * o.b / 10) / 1, o.b);
      if (o.op === 'ratio' && o.a != null) cands.push(o.a - x, Math.round(o.a / o.b));
      const sw = String(x).length === 2 ? +String(x).split('').reverse().join('') : null; if (sw && sw !== x && sw >= 10) cands.push(sw);
      const near = shuffle([x + 1, x - 1, x + 10, x - 10, x + 2, x - 2]);
      const first = shuffle(cands.filter(c => Number.isInteger(c) && c >= 0 && c !== x && Math.abs(c - x) <= Math.max(20, x)));
      for (const c of first.slice(0, 1).concat(near.slice(0, 2), first.slice(1), near.slice(2))) put(I(c));
      for (let k = 3; out.length < count && k < 60; k++) { put(I(x + k)); put(I(x - k)); }
      return shuffle(out);
    }
    if (a.k === 'dec') {
      const t = decText(a), places = (t.split('.')[1] || '').length, u = V(1, 10 ** Math.max(1, places), 'dec');
      const cands = shuffle([add(a, u), sub(a, u), mul(a, I(10), 'dec'), div(a, I(10), 'dec'), add(a, I(1), 'dec'), sub(a, I(1), 'dec')]);
      if (o.fa && o.fb && o.op === '×') cands.unshift(add(o.fa, o.fb, 'dec'));
      for (const c of cands) put(V(c.n, c.d, 'dec'));
      for (let k = 2; out.length < count && k < 40; k++) { put(add(a, mul(u, I(k)), 'dec')); put(sub(a, mul(u, I(k)), 'dec')); }
      return shuffle(out);
    }
    // fractions and mixed numbers
    const cands = [V(a.n + 1, a.d, 'frac'), V(a.n - 1, a.d, 'frac'), V(a.n, a.d + 1, 'frac'), a.d > 2 ? V(a.n, a.d - 1, 'frac') : null, add(a, I(1), 'frac'), a.n > a.d ? sub(a, I(1), 'frac') : null];
    if (o.fa && o.fb) {
      const x = o.fa, y = o.fb;
      if (o.op === '+') cands.unshift(V(x.n + y.n, x.d + y.d, 'frac'));          // added the denominators
      if (o.op === '-') cands.unshift(add(x, y, 'frac'));
      if (o.op === '×') cands.unshift(V(x.n * y.d, x.d * y.n, 'frac'));          // divided instead
      if (o.op === '÷') cands.unshift(mul(x, y, 'frac'));                          // multiplied instead
    }
    const firstC = cands.slice(0, 1), rest = shuffle(cands.slice(1));
    for (const c of firstC.concat(rest)) if (c && c.n > 0) put(V(c.n, c.d, 'frac'));
    for (let k = 2; out.length < count && k < 30; k++) { put(V(a.n + k, a.d, 'frac')); put(V(a.n, a.d + k, 'frac')); }
    return shuffle(out);
  }

  /* ====================== CHOOSING THE NEXT PROBLEM ====================== */
  // spec 01 §5.2.4: about 80% from the current level, 20% review from earlier levels (weighted toward recent ones).
  // spec 01 §5.4: facts the student got wrong come back more often until they are answered right 3 times in a row.
  const REVIEW_SHARE = 0.2, WEAK_SHARE = 0.25, WEAK_CLEAR = 3, MAX_FACTS = 40;
  function reviewLevel(n) { if (n <= 1) return 1; const opts = []; for (let k = 1; k < n; k++) { const w = k === n - 1 ? 5 : k === n - 2 ? 3 : k === n - 3 ? 2 : 1; for (let i = 0; i < w; i++) opts.push(k); } return pick(opts); }
  function next(n, o = {}) {   // o: { facts (the profile's weak spots), avoid (Set of recent keys), noReview }
    const facts = o.facts || {}, weak = Object.values(facts).filter(f => f.lv <= n && f.w > 0 && f.s < WEAK_CLEAR && !(o.avoid && o.avoid.has(f.e)));
    if (weak.length && rand() < WEAK_SHARE) { const f = weighted(weak, f => f.w); return Object.assign(P(f.lv, f.e, valFrom(f.a), 'weak', opsFrom(f.ops)), { src: f.lv < n ? 'review' : 'weak' }); }
    if (!o.noReview && n > 1 && rand() < REVIEW_SHARE) { const r = reviewLevel(n), p = make(r, { avoid: o.avoid }); return Object.assign({}, p, { src: 'review' }); }
    return Object.assign({}, make(n, { avoid: o.avoid, hard: o.hard }), { src: 'cur' });
  }
  function weighted(list, w) { let t = 0; const ws = list.map(x => (t += w(x), t)); const r = rand() * t; return list[ws.findIndex(x => x > r)]; }
  // remember a weak spot: a wrong answer adds it; right answers in a row clear it
  function noteFact(facts, p, ok) {
    const f = facts[p.key];
    if (!ok) { const g = f || (facts[p.key] = { e: p.e, a: valJSON(p.a), lv: p.lv, w: 0, s: 0, ops: opsJSON(p.ops) }); g.w++; g.s = 0; g.t = Date.now(); }
    else if (f) { f.s++; if (f.s >= WEAK_CLEAR) delete facts[p.key]; }
    const ks = Object.keys(facts); if (ks.length > MAX_FACTS) ks.sort((a, b) => (facts[a].t || 0) - (facts[b].t || 0)).slice(0, ks.length - MAX_FACTS).forEach(k => delete facts[k]);
    return facts;
  }

  /* ====================== MOVING UP AND DOWN (spec 01 §6) ====================== */
  // Each scored answer is { ok: 1|0, u: weight toward moving up, d: weight toward moving down } (spec 01 §6.1):
  // a fight answer counts 1 (a right answer on a hard card 1.25); a right answer in the shop, brewing, forging or on a review card counts ½;
  // a mistake always counts 1. So 10 right shop answers are worth 5 answers: they fill only half of the window.
  // The window is measured in these weights: "the last 10–12 answers" = the most recent answers whose weights add up to 10–12.
  const RULES = { upAcc: 0.85, upMin: 10, upMax: 12, downAcc: 0.5, downWin: 8, placeWin: 5, placeAnswers: 20 };
  const WEIGHT = { cur: { u: 1, d: 1 }, hard: { u: 1.25, d: 1 }, review: { u: 0.5, d: 1 }, weak: { u: 1, d: 1 }, craft: { u: 0.5, d: 1 } };
  const wOf = e => e.ok ? e.u : e.d;
  // the most recent answers whose weights add up to (at most just past) size; returns their total weight and weighted accuracy
  function windowOf(hist, size) { let w = 0, r = 0; for (let i = hist.length - 1; i >= 0 && w < size; i--) { const e = hist[i]; w += wOf(e); if (e.ok) r += e.u; } return { w, acc: w ? r / w : 0 }; }
  const wacc = h => windowOf(h, Infinity).acc;
  // judge(hist, placementLeft) → 'up' | 'down' | ''. In the placement phase (the first answers of a new profile) the window is smaller, so a misplaced student moves fast.
  function judge(hist, placementLeft) {
    if (placementLeft > 0) { const p = windowOf(hist, RULES.placeWin); if (p.w < RULES.placeWin) return ''; return p.acc >= RULES.upAcc ? 'up' : p.acc < RULES.downAcc ? 'down' : ''; }
    const up = windowOf(hist, RULES.upMax); if (up.w >= RULES.upMin && up.acc >= RULES.upAcc) return 'up';
    const dn = windowOf(hist, RULES.downWin); if (dn.w >= RULES.downWin && dn.acc < RULES.downAcc) return 'down';
    return '';
  }

  const ME = {
    MAX_LEVEL, LV, RULES, WEIGHT,
    V, I, F, D, add, sub, mul, div, eq, lt, num, gcd, lcm, isWhole, decText, parse, valJSON, valFrom,
    tok, fmt, fmtHtml, tokText, tokHtml,
    make, next, all: n => LV[n].all ? all(n).list : null, answers, distractors, noteFact, judge, wacc, reviewLevel,
    gradeStart: g => (g - 1) * 6 + 1, gradeOf: n => Math.ceil(n / 6),
    setRandom: f => { rand = f || Math.random; }
  };
  if (typeof module === 'object' && module.exports) module.exports = ME; else root.ME = ME;
})(typeof globalThis !== 'undefined' ? globalThis : this);
