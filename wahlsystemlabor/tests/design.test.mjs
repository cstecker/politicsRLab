import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ATTRIBUTES, createSession, validSession, sessionRows, simulate, toCSV } from '../site/design.mjs';
import { estimateAMCE, tCritical } from '../site/stats.mjs';

test('Originaldesign: sechs Merkmale und stabile fünf unabhängige Profilpaare', () => {
  assert.deepEqual(ATTRIBUTES.map(a => a.levels.length), [3, 4, 3, 4, 2, 4]);
  const session = createSession(42, 'test');
  assert.equal(validSession(session), true);
  assert.equal(session.tasks.length, 5);
  assert.deepEqual(session, createSession(42, 'test'));
  assert.deepEqual(session, JSON.parse(JSON.stringify(session)));
  assert.notDeepEqual(session.order, createSession(43, 'other').order);
  assert.equal(validSession({ ...session, order: Array(6).fill('parties') }), false);
  assert.equal(validSession({ ...session, version: 'invalid' }), false);
  session.tasks[0].profiles[0].parties = 30;
  assert.equal(validSession(session), false);
});

test('Export enthält Gewinner und Verlierer ohne Vermischung mit Simulation', () => {
  const session = createSession(123, 'test');
  session.tasks.forEach((t, i) => { t.choice = i % 2; });
  const rows = sessionRows(session);
  assert.equal(rows.length, 10);
  assert.equal(rows.reduce((s, r) => s + r.chosen, 0), 5);
  assert.equal(new Set(rows.map(r => r.attribute_order)).size, 1);
  assert.equal(rows.every(r => r.source === 'local_test'), true);
  assert.equal(toCSV(rows).split('\r\n').filter(Boolean).length, 11);
  assert.deepEqual(sessionRows(JSON.parse(JSON.stringify(session))), rows);
});

test('Alle Ausprägungen werden annähernd gleich häufig gezogen; Reihenfolge variiert', () => {
  const rows = simulate(1000, 998, 'null');
  for (const a of ATTRIBUTES) for (let level = 0; level < a.levels.length; level++) {
    const share = rows.filter(r => r[a.id] === level).length / rows.length;
    assert.ok(Math.abs(share - 1 / a.levels.length) < .025);
  }
  assert.ok(new Set(rows.map(r => r.attribute_order)).size > 100);
});

test('Student-t-Quantile stimmen mit bekannten R-Werten überein', () => {
  assert.ok(Math.abs(tCritical(.95, 1) - 12.7062047364) < 1e-8);
  assert.ok(Math.abs(tCritical(.9, 149) - 1.6551445336) < 1e-8);
  assert.ok(Math.abs(tCritical(.95, 149) - 1.9760131777) < 1e-8);
});

test('Clusterzahl, Simulationsszenarien und fehlende Schätzbarkeit', () => {
  const proportional = estimateAMCE(simulate(500, 42, 'proportionality'));
  assert.equal(proportional.ok, true);
  assert.equal(proportional.g, 500);
  assert.equal(proportional.n, 5000);
  const equality = proportional.effects.find(e => e.attribute === 'proportionality' && e.level === 3);
  const majority = proportional.effects.find(e => e.attribute === 'majorities' && e.level === 3);
  assert.ok(equality.estimate > majority.estimate + .12);
  const nullModel = estimateAMCE(simulate(1000, 42, 'null'));
  assert.ok(nullModel.effects.every(e => Math.abs(e.estimate) < .06));
  const wider = estimateAMCE(simulate(150), .95);
  const narrower = estimateAMCE(simulate(150), .9);
  assert.ok(wider.effects.every((e, i) => e.low < narrower.effects[i].low && e.high > narrower.effects[i].high));
  assert.equal(estimateAMCE(simulate(1)).ok, false);
  const constant = simulate(30).map(r => ({ ...r, candidates: 0 }));
  assert.equal(estimateAMCE(constant).ok, false);
});
