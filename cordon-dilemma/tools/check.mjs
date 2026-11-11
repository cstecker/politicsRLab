import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { FEATURES, makeState, validState, longRows, toCSV } = require('../site/app.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'site/study-data.js'), 'utf8'), context);
const data = context.window.CORDON_STUDY;
assert.equal(data.meta.profiles, 16548);
assert.equal(data.meta.conjoint_people, 2773);
assert.equal(data.meta.pairs * 2, data.meta.profiles);
assert.equal(data.counts.reduce((n, r) => n + r.profiles, 0), data.meta.profiles);
assert.equal(data.counts.reduce((n, r) => n + r.selected, 0), data.meta.pairs);
assert.equal(data.estimates.length, 44 * FEATURES.reduce((n, f) => n + f.levels.length, 0));
for (const r of data.estimates) {
  assert.ok(FEATURES.find(f => f.key === r.feature)?.levels.includes(r.level), 'Unbekannte Ausprägung');
  assert.ok(Number.isFinite(r.estimate) && r.lower <= r.estimate && r.upper >= r.estimate);
  assert.ok(r.estimate >= (r.outcome === 'choice' ? 0 : -5) && r.estimate <= (r.outcome === 'choice' ? 1 : 5));
}
for (const count of data.counts) {
  const r = data.estimates.find(r => r.group === 'all' && r.moderator === 'none' && r.outcome === 'choice' && r.feature === 'cj_afdtreatment' && r.level === count.cj_afdtreatment);
  assert.ok(Math.abs(r.estimate - count.selected / count.profiles) < 1e-9, 'MM stimmt nicht mit Auswahlanteil überein');
}
const shares = new Map();
for (const r of data.agreement) shares.set(r.group + '/' + r.item, (shares.get(r.group + '/' + r.item) || 0) + r.share);
for (const share of shares.values()) assert.ok(Math.abs(share - 1) < 1e-8, 'Falscher Nenner der Zustimmungsanteile');
const s = makeState(() => .42);
assert.ok(validState(s));
assert.ok(longRows(s).every(r => r.cj_elect === null && r.cj_skalo === null), 'Unbeantwortet darf nicht als 0 erscheinen');
s.rounds.forEach((r, i) => { r.choice = i % 2; r.ratings = [0, -5]; });
const rows = longRows(s);
assert.equal(rows.length, 6);
assert.equal(rows.filter(r => r.cj_elect === 1).length, 3);
assert.equal(rows.filter(r => r.cj_skalo === 0).length, 3, 'Neutrale Bewertung 0 muss erhalten bleiben');
assert.ok(toCSV(rows).includes('"PERSON"'));
assert.ok(!JSON.stringify(data).includes('"ResponseId"'), 'Originalkennungen dürfen nicht exportiert werden');
const html = fs.readFileSync(path.join(root, 'site/index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'Doppelte HTML-IDs');
console.log(`OK: ${data.estimates.length} Schätzwerte, ${shares.size} Zustimmungsverteilungen, Paarstruktur, Missingness und Export geprüft.`);
