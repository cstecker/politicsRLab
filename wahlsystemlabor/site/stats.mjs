import { ATTRIBUTES } from './design.mjs';

function inverse(matrix) {
  const n = matrix.length;
  const m = matrix.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => Number(i === j))]);
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let j = i + 1; j < n; j++) if (Math.abs(m[j][i]) > Math.abs(m[pivot][i])) pivot = j;
    if (Math.abs(m[pivot][i]) < 1e-9) return null;
    [m[pivot], m[i]] = [m[i], m[pivot]];
    const divisor = m[i][i];
    m[i] = m[i].map(v => v / divisor);
    for (let j = 0; j < n; j++) if (j !== i) {
      const factor = m[j][i];
      for (let k = 0; k < n * 2; k++) m[j][k] -= factor * m[i][k];
    }
  }
  return m.map(row => row.slice(n));
}

// Log-Gamma nach Lanczos; Student-t-CDF über regulierte unvollständige Beta.
function logGamma(z) {
  const p = [676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406,
    12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = 0.9999999999998099;
  for (let i = 0; i < p.length; i++) x += p[i] / (z + i + 1);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaFraction(a, b, x) {
  const tiny = 1e-30;
  let c = 1, d = 1 - (a + b) * x / (a + 1);
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 250; m++) {
    let aa = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c; h *= delta;
    if (Math.abs(delta - 1) < 1e-13) break;
  }
  return h;
}

function betaI(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const factor = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log1p(-x));
  return x < (a + 1) / (a + b + 2)
    ? factor * betaFraction(a, b, x) / a
    : 1 - factor * betaFraction(b, a, 1 - x) / b;
}

export function tCritical(confidence, df) {
  if (!(confidence > 0 && confidence < 1 && df > 0)) throw new Error('Ungültiges Konfidenzniveau oder Freiheitsgrade.');
  const target = (1 + confidence) / 2;
  const cdf = t => 1 - 0.5 * betaI(df / (df + t * t), df / 2, 0.5);
  let lo = 0, hi = 1;
  while (cdf(hi) < target) hi *= 2;
  for (let i = 0; i < 90; i++) {
    const mid = (lo + hi) / 2;
    if (cdf(mid) < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export function estimateAMCE(rows, confidence = 0.9) {
  const terms = ATTRIBUTES.flatMap(a => a.levels.map((label, level) => ({ attribute: a.id, level, label }))
    .filter(t => t.level !== a.baseline));
  const k = terms.length + 1, n = rows.length;
  const groups = new Set(rows.map(r => r.respondent));
  const g = groups.size;
  if (g < 20 || n <= k) return { ok: false, message: 'Für die Ergebnisdemo werden mindestens 20 Personen mit vollständigen Paarvergleichen benötigt.', n, g };
  const x = rows.map(r => [1, ...terms.map(t => Number(r[t.attribute] === t.level))]);
  const xtx = Array.from({ length: k }, () => Array(k).fill(0));
  const xty = Array(k).fill(0);
  for (let i = 0; i < n; i++) for (let a = 0; a < k; a++) {
    xty[a] += x[i][a] * rows[i].chosen;
    for (let b = 0; b < k; b++) xtx[a][b] += x[i][a] * x[i][b];
  }
  const bread = inverse(xtx);
  if (!bread) return { ok: false, message: 'Die Merkmalsausprägungen reichen für eine eindeutige Schätzung nicht aus. Eine größere Simulation erzeugen.', n, g };
  const beta = bread.map(row => row.reduce((sum, v, j) => sum + v * xty[j], 0));
  const scores = new Map();
  for (let i = 0; i < n; i++) {
    const residual = rows[i].chosen - x[i].reduce((sum, v, j) => sum + v * beta[j], 0);
    if (!scores.has(rows[i].respondent)) scores.set(rows[i].respondent, Array(k).fill(0));
    const s = scores.get(rows[i].respondent);
    x[i].forEach((v, j) => { s[j] += v * residual; });
  }
  const correction = g / (g - 1) * (n - 1) / (n - k);
  const variance = Array(k).fill(0);
  for (const score of scores.values()) {
    const influence = bread.map(row => row.reduce((sum, v, j) => sum + v * score[j], 0));
    influence.forEach((v, j) => { variance[j] += v * v * correction; });
  }
  const critical = tCritical(confidence, g - 1);
  const effects = terms.map((t, i) => {
    const se = Math.sqrt(Math.max(0, variance[i + 1]));
    return { ...t, estimate: beta[i + 1], se, low: beta[i + 1] - critical * se, high: beta[i + 1] + critical * se };
  });
  return { ok: true, n, g, confidence, effects, coefficients: beta, critical, correction };
}
