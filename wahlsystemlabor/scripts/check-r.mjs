// Unabhängiger Vergleich der JS-Matrixrechnung mit R/lm und Cluster-Sandwich.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { simulate, toCSV } from '../site/design.mjs';
import { estimateAMCE } from '../site/stats.mjs';

mkdirSync('outputs', { recursive: true });
let maxDifference = 0;
for (const [n, seed, scenario, confidence] of [[40, 0, 'null', .95], [150, 2026, 'proportionality', .9], [500, 317, 'majorities', .95]]) {
  const rows = simulate(n, seed, scenario);
  const stem = `outputs/check-${n}-${seed}`;
  writeFileSync(`${stem}.csv`, toCSV(rows));
  const run = spawnSync(process.env.RSCRIPT || 'Rscript', ['site/auswertung.R', `${stem}.csv`, `${stem}-r.csv`, String(confidence)], { encoding: 'utf8' });
  if (run.status !== 0) throw new Error(run.stderr || run.error?.message || 'R konnte nicht ausgeführt werden.');
  const r = readFileSync(`${stem}-r.csv`, 'utf8').trim().split(/\r?\n/).slice(1).map(line => line.replaceAll('"', '').split(','));
  const js = estimateAMCE(rows, confidence);
  assert.equal(r.length, js.effects.length);
  for (const values of r) {
    const effect = js.effects.find(e => e.attribute === values[0] && e.level === Number(values[1]));
    assert.ok(effect);
    for (const [i, key] of ['estimate', 'se', 'low', 'high'].entries()) {
      const delta = Math.abs(effect[key] - Number(values[i + 2]));
      maxDifference = Math.max(maxDifference, delta);
      assert.ok(delta < 1e-9, `${n}: ${effect.attribute}/${effect.level}/${key}: ${delta}`);
    }
  }
}
writeFileSync('outputs/r-validation.json', JSON.stringify({ cases: 3, maxDifference, tolerance: 1e-9 }, null, 2));
console.log(`Drei Datensätze gegen R geprüft. Maximale absolute Abweichung: ${maxDifference}`);
