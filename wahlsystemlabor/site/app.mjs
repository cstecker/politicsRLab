import { ATTRIBUTES, VERSION, TASKS, SCENARIOS, createSession, validSession, profile, random, sessionRows, simulate, toCSV } from './design.mjs';
import { estimateAMCE } from './stats.mjs';

const main = document.querySelector('main');
const KEY = 'politicsrlab-wahlsystem-v1';
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const number = (n, digits = 1) => n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const byID = id => ATTRIBUTES.find(a => a.id === id);
let session = null, index = 0, route = 'start', resetArmed = false, storageAvailable = true;
let demo = { n: 150, seed: 2026, scenario: 'proportionality', confidence: .9 };
let simulationRows = null, prediction = '';
let example = null, exampleCount = 0, highlighted = null;

try {
  const stored = JSON.parse(localStorage.getItem(KEY));
  if (validSession(stored)) session = stored;
} catch { storageAvailable = false; }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(session)); } catch { storageAvailable = false; }
}

function newSession() {
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  session = createSession(seed, `test_${seed.toString(16)}`); index = 0; save();
}

function go(view) {
  location.hash = view;
  if (route === view) render();
}

function definitions() {
  return `<details><summary>Was bedeuten die sechs Eigenschaften?</summary><dl class="definitions">${ATTRIBUTES.map(a => `<div><dt>${a.label}</dt><dd>${a.help}</dd></div>`).join('')}</dl><p class="caption">Eigene Erläuterungen für die Lehre. Die sechs Merkmale und Ausprägungen folgen Tabelle 1 der Studie (S. 230).</p></details>`;
}

function renderStart() {
  const done = session?.tasks.filter(t => t.choice !== null).length ?? 0;
  return `<div class="intro-grid"><section><p class="eyebrow">Ein Experiment zum Mitmachen</p>
    <h1>Welches Wahlsystem würden Sie wählen?</h1>
    <p class="lead">Mehr Parteien im Parlament, klare Mehrheiten oder möglichst gleiche Stimmen- und Sitzanteile? Entscheiden Sie zwischen zwei Wahlsystemen – fünfmal.</p>
    <div class="meta-row"><span><strong>5</strong> Entscheidungen</span><span>etwa <strong>3–5 Minuten</strong></span><span>keine richtigen oder falschen Antworten</span></div>
    <div class="actions"><button data-action="start">${done === TASKS ? 'Eigene Entscheidungen ansehen' : done ? `Fortsetzen (${done} von 5)` : 'Experiment ausprobieren'} <span aria-hidden="true">→</span></button></div>
    <p class="caption">Testfassung: Ihre Entscheidungen bleiben ausschließlich in diesem Browser. Es werden keine gemeinsamen Hörsaalantworten erhoben.</p>
    ${!storageAvailable ? '<p class="notice">Der Browser erlaubt keine dauerhafte Speicherung. Bitte diese Seite bis zum Abschluss geöffnet lassen.</p>' : ''}
    </section><aside class="panel panel-tinted"><h2>Von der Entscheidung zur Methode</h2><ol class="steps"><li><strong>Wahlsysteme vergleichen</strong><br>Welches der beiden Systeme bevorzugen Sie für Deutschland?</li><li><strong>Die Logik entdecken</strong><br>Wie lassen sich die Wirkungen einzelner Eigenschaften untersuchen?</li><li><strong>Ergebnisse verstehen</strong><br>Eine simulierte Gruppe auswerten und die Originalstudie einordnen.</li></ol></aside></div>
    ${definitions()}
    <section class="section-line"><p class="eyebrow">Für die gemeinsame Besprechung</p><div class="mini-grid"><div class="panel"><h3>Conjoint verstehen</h3><p class="muted">Profile auslosen und eine Eigenschaft gezielt verändern.</p><a class="button secondary" href="#methode">Lehrmodus öffnen</a></div><div class="panel"><h3>Ergebnisdemo</h3><p class="muted">150 simulierte Personen, fünf Vergleiche und eine Effektschätzung.</p><a class="button secondary" href="#ergebnisse">Simulation öffnen</a></div><div class="panel"><h3>Studie & Materialien</h3><p class="muted">Quellen, Grenzen des Entwurfs und ein R-Skript zur Auswertung.</p><a class="button secondary" href="#info">Materialien ansehen</a></div></div></section>`;
}

function profileTable(profiles, order, { choices = false, selected = null, changed = null } = {}) {
  return `<table class="profile-table"><caption>${choices ? 'Welches dieser beiden Wahlsysteme bevorzugen Sie für Deutschland?' : 'Zwei illustrative Wahlsysteme. Diese Profile gehen in keine Auswertung ein.'}</caption><thead><tr><th scope="col">Eigenschaft</th><th scope="col"><span class="choice-letter">A</span> Wahlsystem A</th><th scope="col"><span class="choice-letter">B</span> Wahlsystem B</th></tr></thead><tbody>${order.map(id => {
    const a = byID(id);
    return `<tr><th scope="row">${a.label}</th>${profiles.map((p, side) => `<td class="${selected === side ? 'selected ' : ''}${changed?.id === id && changed.side === side ? 'changed' : ''}">${a.levels[p[id]]}</td>`).join('')}</tr>`;
  }).join('')}</tbody>${choices ? `<tfoot><tr><th scope="row">Ihre Entscheidung</th>${[0, 1].map(side => `<td><button data-choice="${side}" ${selected === side ? 'aria-pressed="true"' : 'aria-pressed="false"'}><span class="choice-letter">${side === 0 ? 'A' : 'B'}</span>${selected === side ? 'Ausgewählt' : 'Wähle ich'}</button></td>`).join('')}</tr></tfoot>` : ''}</table>`;
}

function renderParticipation() {
  if (!session) newSession();
  const task = session.tasks[index];
  return `<div class="page-top"><div><p class="eyebrow">Ihre Präferenz zählt</p><h1>Zwei Systeme. Ihre Entscheidung.</h1></div><p class="progress-label">Vergleich ${index + 1} von ${TASKS}</p></div>
    <progress value="${index}" max="${TASKS}" aria-label="Abgeschlossene Vergleiche"></progress>
    ${profileTable(task.profiles, session.order, { choices: true, selected: task.choice })}
    <div class="actions"><button class="secondary" data-action="previous" ${index === 0 ? 'disabled' : ''}>← Zurück</button><button data-action="next" ${task.choice === null ? 'disabled' : ''}>${index === TASKS - 1 ? 'Test abschließen' : 'Nächster Vergleich'} →</button><a href="#start">Zur Übersicht</a></div>
    <p class="caption">Beide Systeme können Eigenschaften verbinden, die Ihnen ungewöhnlich erscheinen. Beurteilen Sie die dargestellte Kombination. Es gibt keine Musterlösung.</p>
    ${definitions()}${!storageAvailable ? '<p class="notice">Dauerhafte Browserspeicherung ist nicht verfügbar. Ihre Auswahl bleibt bis zum Schließen dieser Seite im Arbeitsspeicher erhalten.</p>' : ''}`;
}

function renderDone() {
  if (!session || session.tasks.some(t => t.choice === null)) return '<h1>Noch nicht abgeschlossen</h1><p>Bitte treffen Sie zunächst alle fünf Entscheidungen.</p><button data-action="start">Zum Experiment</button>';
  return `<p class="eyebrow">Fünf Vergleiche abgeschlossen</p><h1>Ihre Entscheidungen sind gespeichert.</h1><p class="lead">Sie haben fünfmal ein ganzes Wahlsystem ausgewählt. Wie erfahren wir daraus, welche einzelne Eigenschaft die Auswahl wahrscheinlicher macht?</p>
    <div class="notice">Dies war eine lokale Testteilnahme. Ihre fünf Entscheidungen sind keine ausreichende Grundlage für eine AMCE-Schätzung und werden nicht mit den simulierten Daten vermischt.</div>
    <ul class="summary-list">${session.tasks.map((t, i) => `<li><span>Vergleich ${i + 1}: <strong>Wahlsystem ${t.choice === 0 ? 'A' : 'B'}</strong></span><button class="secondary" data-review="${i}">Ansehen</button></li>`).join('')}</ul>
    <div class="actions"><a class="button" href="#methode">Die Methode entdecken →</a><a class="button secondary" href="#ergebnisse">Ergebnisdemo öffnen</a><button class="text-button" data-action="export-own">Eigene Testdaten als CSV</button></div>
    <details><summary>Welche Daten werden exportiert?</summary><p>Für jedes Vergleichspaar beide Profile, alle sechs Merkmalsausprägungen und die Auswahl (1 = gewählt, 0 = nicht gewählt): insgesamt zehn Zeilen. Zusätzlich enthalten: eine zufällige Testkennung, Designversion, Startwert der Auslosung und die feste Merkmalsreihenfolge. Namen oder Kontaktdaten werden nicht erhoben.</p></details>`;
}

function tabs(active) {
  return `<nav class="tabs" aria-label="Lehrmodus"><a class="button secondary" href="#start">Übersicht</a><button class="secondary" data-route="methode" ${active === 'methode' ? 'aria-current="page"' : ''}>1 · Conjoint verstehen</button><button class="secondary" data-route="ergebnisse" ${active === 'ergebnisse' ? 'aria-current="page"' : ''}>2 · Ergebnisse untersuchen</button></nav>`;
}

function renderMethod() {
  if (!example) { const rng = random(1234); example = [profile(rng), profile(rng)]; }
  return `${tabs('methode')}<p class="eyebrow">Wie funktioniert ein Conjoint?</p><h1>Ein Bündel wählen.<br>Einzelne Wirkungen untersuchen.</h1>
    <p class="lead">Die Merkmale werden unabhängig kombiniert. Über viele Entscheidungen hinweg können wir vergleichen, wie sich eine Ausprägung auf die Auswahlwahrscheinlichkeit auswirkt.</p>
    <div class="actions"><button data-action="reroll">Zwei neue Profile auslosen</button><button class="secondary" data-action="vary">Nur Stimmen-Sitz-Gleichheit in A verändern</button></div>
    <div aria-live="polite">${profileTable(example, ATTRIBUTES.map(a => a.id), { changed: highlighted })}<p class="caption">${highlighted ? 'Gelb markiert: Eine Eigenschaft in A wurde verändert; alle anderen Eigenschaften bleiben gleich. Das ist eine gedankliche Gegenüberstellung.' : 'Alle Merkmale beider Profile wurden unabhängig ausgelost. Auch ungewöhnliche Kombinationen bleiben möglich.'}</p></div>
    <div class="mini-grid section-line"><section class="panel"><p class="kicker-number">01</p><h3>Zufällig kombinieren</h3><p>Der Zufall löst die typischen Zusammenhänge zwischen Eigenschaften. Klare Mehrheiten und proportionale Sitzanteile dürfen daher zusammen auftreten.</p></section><section class="panel"><p class="kicker-number">02</p><h3>Viele Vergleiche sammeln</h3><p>Der Effekt wird über unterschiedliche Ausprägungen der übrigen Merkmale gemittelt. Ein einzelnes Paar zeigt den Effekt noch nicht.</p></section><section class="panel"><p class="kicker-number">03</p><h3>Personen berücksichtigen</h3><p>Jede Person entscheidet fünfmal. Die zehn Profilzeilen einer Person sind abhängig; die Unsicherheit wird auf Personenebene berechnet.</p></section></div>
    <details><summary>Was folgt hier genau dem Original?</summary><p>Sechs Merkmale mit den Ausprägungen aus Tabelle 1 (S. 230), fünf Paarvergleiche, unabhängig ausgeloste Merkmalsausprägungen und eine pro Person zufällige, danach konstante Zeilenreihenfolge. Identische und ungewöhnliche Profile werden nicht nachträglich aussortiert.</p><p>Einführung, Erläuterungen und Gestaltung sind für die Lehre neu formuliert. Das ist eine didaktische Rekonstruktion, keine wortgetreue Replikation des Originalfragebogens. Die Originalstudie arbeitet mit 1.039 Befragten und einer Gewichtung; die Simulation bleibt ungewichtet.</p></details>
    <div class="actions"><a class="button" href="#ergebnisse">Effekte in der Simulation untersuchen →</a></div>`;
}

function effectChart(result) {
  const width = 1000, left = 365, right = 880, top = 48, line = 29;
  const items = ATTRIBUTES.flatMap(a => [{ heading: a.short }, ...a.levels.map((label, level) => ({ label, level, a,
    effect: result.effects.find(e => e.attribute === a.id && e.level === level) }))]);
  const height = top + items.length * line + 70;
  const extent = Math.max(.2, ...result.effects.flatMap(e => [Math.abs(e.low), Math.abs(e.high)]));
  const limit = Math.ceil(extent * 10) / 10;
  const x = value => left + (value + limit) / (limit * 2) * (right - left);
  const axisY = top + items.length * line;
  const ticks = [-limit, -limit / 2, 0, limit / 2, limit];
  const content = items.map((item, i) => {
    const y = top + i * line;
    if (item.heading) return `<text class="attribute-label" x="12" y="${y + 3}">${item.heading}</text>`;
    const e = item.effect;
    return `<text x="26" y="${y + 3}" font-size="14">${item.label}</text>${e
      ? `<line class="ci" x1="${x(e.low)}" x2="${x(e.high)}" y1="${y}" y2="${y}"/><circle class="estimate" cx="${x(e.estimate)}" cy="${y}" r="4.5"/><text x="${right + 15}" y="${y + 4}" font-size="13">${e.estimate > 0 ? '+' : ''}${number(e.estimate * 100)} PP</text>`
      : `<circle class="baseline" cx="${x(0)}" cy="${y}" r="4"/><text x="${right + 15}" y="${y + 4}" font-size="12">Referenz</text>`}`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">AMCE der simulierten Entscheidungen mit ${result.confidence * 100}-Prozent-Konfidenzintervallen</title><desc id="chart-desc">Jeder Punkt zeigt den Unterschied zur markierten Referenzausprägung in Prozentpunkten. Positive Werte erhöhen die Auswahlwahrscheinlichkeit. Alle Werte stehen zusätzlich in der Datentabelle.</desc>${ticks.map(t => `<line x1="${x(t)}" x2="${x(t)}" y1="15" y2="${axisY}" stroke="${t === 0 ? '#778a9b' : '#edf0f3'}" ${t === 0 ? 'stroke-dasharray="4 4"' : ''}/><text class="axis-label" x="${x(t)}" y="${axisY + 25}" text-anchor="middle">${number(t * 100, 0)}</text>`).join('')}${content}<text class="axis-label" x="${(left + right) / 2}" y="${axisY + 55}" text-anchor="middle">Änderung der Auswahlwahrscheinlichkeit · Prozentpunkte</text></svg>`;
}

function dataTable(result) {
  return `<div class="data-scroll"><table class="data-table"><thead><tr><th>Eigenschaft / Ausprägung</th><th>AMCE (PP)</th><th>Untergrenze</th><th>Obergrenze</th></tr></thead><tbody>${ATTRIBUTES.map(a => `<tr><th colspan="4">${a.short} · Referenz: ${a.levels[a.baseline]}</th></tr>${result.effects.filter(e => e.attribute === a.id).map(e => `<tr><td>${e.label}</td><td class="numeric">${number(e.estimate * 100, 2)}</td><td class="numeric">${number(e.low * 100, 2)}</td><td class="numeric">${number(e.high * 100, 2)}</td></tr>`).join('')}`).join('')}</tbody></table></div>`;
}

function renderResults() {
  if (!simulationRows) simulationRows = simulate(demo.n, demo.seed, demo.scenario);
  const result = estimateAMCE(simulationRows, demo.confidence);
  return `${tabs('ergebnisse')}<span class="demo-label">SIMULIERTE DATEN · keine Original- oder Hörsaalantworten</span><h1>Welche Eigenschaft macht den Unterschied?</h1><p class="lead">Verändern Sie die angenommene Präferenzstruktur und die Gruppengröße. Beobachten Sie, wie sich Effekte und Unsicherheit verändern.</p>
    <form id="simulation-form" class="panel controls"><div class="control-wide"><label for="scenario">Annahme der Simulation</label><select id="scenario" name="scenario">${Object.entries(SCENARIOS).map(([id, s]) => `<option value="${id}" ${demo.scenario === id ? 'selected' : ''}>${s.label}</option>`).join('')}</select></div><div class="control-small"><label for="persons">Personen</label><input id="persons" name="persons" type="number" min="40" max="500" step="10" value="${demo.n}" required></div><div class="control-small"><label for="seed">Startwert</label><input id="seed" name="seed" type="number" min="0" max="4294967295" value="${demo.seed}" required></div><button type="submit">Neu simulieren</button></form>
    <div class="stats-row"><div class="stat"><strong>${demo.n}</strong><span>simulierte Personen</span></div><div class="stat"><strong>${number(demo.n * 5, 0)}</strong><span>Paarentscheidungen</span></div><div class="stat"><strong>${number(demo.n * 10, 0)}</strong><span>Profilzeilen · ${demo.n} Personencluster</span></div></div>
    <div class="page-top"><div><h2>Effekt auf die Auswahlwahrscheinlichkeit</h2><p class="caption">AMCE relativ zur jeweiligen Referenz · ungewichtet · Standardfehler nach Personen geclustert</p></div><div><label for="confidence">Konfidenzintervall</label><select id="confidence"><option value="0.9" ${demo.confidence === .9 ? 'selected' : ''}>90 %</option><option value="0.95" ${demo.confidence === .95 ? 'selected' : ''}>95 %</option></select></div></div>
    ${result.ok ? `<div class="chart-wrap">${effectChart(result)}<p class="legend"><span>● Schätzwert mit Intervall</span><span>○ Referenz = 0</span></p></div><p class="caption">Auf kleinen Bildschirmen lässt sich die Grafik seitlich verschieben. Alle Werte stehen auch in der Tabelle.</p><details><summary>Alle Schätzwerte als Tabelle</summary>${dataTable(result)}</details>` : `<p class="notice">${result.message}</p>`}
    <div class="notice"><strong>So lesen Sie die Grafik:</strong> +10 Prozentpunkte bedeutet: Diese Ausprägung erhöht die Auswahlwahrscheinlichkeit im Mittel um 10 Prozentpunkte gegenüber der angegebenen Referenz. Gemittelt wird über die zufälligen Ausprägungen aller übrigen Merkmale. Das ist keine absolute Auswahlwahrscheinlichkeit.</div>
    <section class="panel section-line"><h2>Erst vorhersagen, dann vergleichen</h2><label for="prediction">Welcher Eigenschaft würden Sie in der Originalstudie den größten Unterschied zwischen ihren Ausprägungen zutrauen?</label><select id="prediction"><option value="">Eigene Erwartung festhalten …</option>${ATTRIBUTES.map(a => `<option value="${a.id}" ${prediction === a.id ? 'selected' : ''}>${a.short}</option>`).join('')}</select><p class="caption">Die Erwartung bleibt in diesem geöffneten Tab. Vergleichen Sie sie anschließend mit dem Befund.</p>
    <details id="original-result"><summary>Den Befund der Originalstudie aufdecken</summary><p><strong>Stimmen-Sitz-Gleichheit hatte den stärksten Effekt.</strong> „Immer garantiert“ erhöhte die Auswahlwahrscheinlichkeit gegenüber „nicht garantiert“ um mehr als 15 Prozentpunkte. Verständlichkeit wirkte schwächer. Jankowski/Linhart/Tepe 2019, Abb. 2 auf S. 233; Interpretation S. 233–234.</p><p>Original: 1.039 Befragte, fünf Paarvergleiche, 10.390 Profilzeilen; Gewichtung nach Alter, Geschlecht und Bildung. Die Originalgrafik verwendet 90%-Konfidenzintervalle. Die hier erzeugten Simulationswerte sind keine Rekonstruktion der Originalschätzungen.</p><p><a href="https://link.springer.com/article/10.1007/s11615-019-00152-2" target="_blank" rel="noopener">Artikel und Originalabbildung ↗</a></p><p><strong>Übertragen:</strong> Weshalb macht zufällige Merkmalszuteilung eine Hörsaalgruppe noch nicht repräsentativ für alle Wählerinnen und Wähler?</p></details></section>
    <div class="actions"><button class="secondary" data-action="export-simulation">Simulierte Profildaten als CSV</button><a class="button secondary" href="./auswertung.R" download>Auswertung in R</a></div>
    <details><summary>Modell und Grenzen</summary><p>Lineares Wahrscheinlichkeitsmodell mit Indikatoren aller sechs Merkmale und Konstante. Referenzen stehen in der Tabelle. Clusterrobuste Varianz CR1 mit Korrektur G/(G−1) × (N−1)/(N−K), Student-t-Intervalle mit G−1 Freiheitsgraden. G bezeichnet Personen, N Profilzeilen und K Modellparameter.</p><p>Die Simulation erzeugt Entscheidungen aus ausdrücklich angenommenen Nutzengewichten. Im Zufallsszenario sind die wahren Effekte null; einzelne geschätzte Effekte können trotzdem von null abweichen. Ein größeres N ändert die Informationsmenge, es garantiert keinen repräsentativen Datensatz.</p><p>Diese Fassung hat keine gemeinsame Rundenerhebung, keine Dozentenanmeldung und keine serverseitige Ergebnisfreigabe. Die Lehransichten sind frei navigierbar. Für einen echten Hörsaaleinsatz wird die getrennte Teilnahme- und Dozentensteuerung nach dem Parteienlabor ergänzt.</p></details>`;
}

function renderInfo() {
  return `<p class="eyebrow">Materialien & Stand</p><h1>Ein Experiment zum Verstehen.</h1><p class="lead">Didaktischer Entwurf vom 27. Oktober 2026 für die Vorlesung „Einführung in das Regierungssystem der Bundesrepublik“.</p>
    <section class="panel"><h2>Grundlage</h2><p>Jankowski, Michael; Eric Linhart; Markus Tepe (2019): Welches Wahlsystem wollen die Wähler? Evidenz von einem Conjoint-Experiment. <em>Politische Vierteljahresschrift 60</em>, 221–243. <a href="https://link.springer.com/article/10.1007/s11615-019-00152-2">DOI: 10.1007/s11615-019-00152-2</a>.</p><p>Design und Merkmale: S. 229–231, besonders Tabelle 1 auf S. 230. Auswertung und Ergebnisse: S. 232–234. Einführung und Erläuterungen dieser App sind eigene Lehrtexte.</p><p>Methodische Grundlage: Hainmueller, Jens; Daniel J. Hopkins; Teppei Yamamoto (2014): Causal Inference in Conjoint Analysis. <em>Political Analysis 22</em>, 1–30. <a href="https://doi.org/10.1093/pan/mpt024">DOI: 10.1093/pan/mpt024</a>.</p></section>
    <section class="section-line"><h2>Was der Entwurf bereits kann</h2><p>Fünf gespeicherte Paarvergleiche mit dem Merkmalsdesign der Studie, Erläuterungen, nachvollziehbare Randomisierung, ein interaktiver Lehrmodus, simulierte Gruppenergebnisse mit clusterrobusten Intervallen, CSV-Export und ein R-Skript zum Nachrechnen.</p><h2>Für die gemeinsame Hörsaalrunde vorgesehen</h2><p>Fester QR-Einstieg, getrennte Runden, serverseitig gespeicherte Profilzuteilungen und Entscheidungen, geschütztes Lehrpult sowie Ergebnisfreigabe nach Abgabeschluss. Dafür dient die vorhandene Architektur des Parteienlabors als Vorbild.</p></section>
    <section class="section-line"><h2>Lokale Testdaten</h2><p>Testentscheidungen werden ausschließlich im lokalen Speicher dieses Browsers abgelegt. Es gibt keine Übertragung an einen Erhebungsserver. Simulationen sind getrennt und deutlich gekennzeichnet. Beim Abruf der Seite können technische Zugriffsdaten beim Hosting anfallen.</p><div class="actions"><button class="secondary" data-action="reset">${resetArmed ? 'Testdaten jetzt löschen und neu beginnen' : 'Lokale Testteilnahme zurücksetzen'}</button><a class="button secondary" href="./auswertung.R" download>R-Skript herunterladen</a></div>${resetArmed ? '<p class="caption">Ein weiterer Klick löscht die hier gespeicherten Testentscheidungen.</p>' : ''}</section>
    <div class="actions"><a class="button" href="#start">Zur Übersicht</a></div>`;
}

function render(focus = false) {
  main.innerHTML = ({ start: renderStart, teilnehmen: renderParticipation, fertig: renderDone, methode: renderMethod, ergebnisse: renderResults, info: renderInfo }[route] ?? renderStart)();
  if (focus) { main.focus({ preventScroll: true }); window.scrollTo(0, 0); }
}

function download(name, content, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

main.addEventListener('click', e => {
  const button = e.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.route) { go(button.dataset.route); return; }
  if (button.dataset.choice !== undefined) { session.tasks[index].choice = Number(button.dataset.choice); save(); render(); main.querySelector('[data-action="next"]').focus(); return; }
  if (button.dataset.review !== undefined) { index = Number(button.dataset.review); go('teilnehmen'); return; }
  switch (button.dataset.action) {
    case 'start':
      if (!session) newSession();
      index = session.tasks.findIndex(t => t.choice === null);
      if (index < 0) { index = 0; go('fertig'); } else go('teilnehmen');
      break;
    case 'previous': index = Math.max(0, index - 1); render(true); break;
    case 'next': if (session.tasks[index].choice === null) return;
      if (index < TASKS - 1) { index++; render(true); } else go('fertig'); break;
    case 'reroll': { const rng = random(4321 + exampleCount++); example = [profile(rng), profile(rng)]; highlighted = null; render(); break; }
    case 'vary': example[0].proportionality = (example[0].proportionality + 1) % 4; highlighted = { id: 'proportionality', side: 0 }; render(); break;
    case 'export-own': download('wahlsystemlabor-eigene-testdaten.csv', toCSV(sessionRows(session))); break;
    case 'export-simulation': download(`wahlsystemlabor-simulation-${demo.scenario}-n${demo.n}-seed${demo.seed}.csv`, toCSV(simulationRows)); break;
    case 'reset': if (!resetArmed) { resetArmed = true; render(); } else { try { localStorage.removeItem(KEY); } catch {} session = null; resetArmed = false; newSession(); go('teilnehmen'); } break;
  }
});

main.addEventListener('submit', e => {
  if (e.target.id !== 'simulation-form') return;
  e.preventDefault();
  const data = new FormData(e.target);
  const n = Number(data.get('persons')), seed = Number(data.get('seed')), scenario = data.get('scenario');
  if (!Number.isInteger(n) || n < 40 || n > 500 || !Number.isInteger(seed) || seed < 0 || seed > 4294967295 || !SCENARIOS[scenario]) return;
  demo = { ...demo, n, seed, scenario }; simulationRows = simulate(n, seed, scenario); render();
});
main.addEventListener('change', e => {
  if (e.target.id === 'confidence') { demo.confidence = Number(e.target.value); render(); }
  if (e.target.id === 'prediction') prediction = e.target.value;
});
window.addEventListener('hashchange', () => {
  const next = location.hash.slice(1) || 'start';
  if (next === 'main') { main.focus(); return; }
  route = next; render(true);
});
route = location.hash.slice(1) || 'start'; render();
