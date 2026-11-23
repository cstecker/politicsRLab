'use strict';

const study = window.BUNDESTAG_STUDY;
const integer = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = value => integer.format(value) + ' %';

function drawHistory() {
  const rows = study.history;
  const first = rows[0];
  const last = rows.at(-1);
  const x = year => 40 + (year - first.year) / (last.year - first.year) * 396;
  const y = value => 190 - value * 4.1;
  const points = rows.map(row => [x(row.year), y(row.value)].join(',')).join(' ');
  const grid = [0, 10, 20, 30, 40].map(value =>
    `<line x1="38" x2="438" y1="${y(value)}" y2="${y(value)}" stroke="#486278" stroke-width="1"/>
     <text x="29" y="${y(value) + 5}" text-anchor="end" fill="#c9dce9" font-size="15">${value}</text>`).join('');
  const dots = rows.map(row =>
    `<circle cx="${x(row.year)}" cy="${y(row.value)}" r="3.3" fill="#9cebd9"><title>${row.year}: ${pct(row.value)}</title></circle>`).join('');
  const years = [1969, 1990, 2005, 2021].map(year =>
    `<text x="${x(year)}" y="214" text-anchor="middle" fill="#d5e5ed" font-size="15">${year}</text>`).join('');
  document.getElementById('history-plot').innerHTML =
    `<svg viewBox="0 0 463 225" role="img" aria-labelledby="hist-title hist-desc">
       <title id="hist-title">Bildungsprofil des Bundestags von 1969 bis 2021</title>
       <desc id="hist-desc">${rows.map(row => row.year + ', ' + pct(row.value)).join('. ')}</desc>
       ${grid}<polygon points="40,190 ${points} 436,190" fill="#85dbcb" fill-opacity=".10"/>
       <polyline points="${points}" fill="none" stroke="#94e6d3" stroke-width="3.5" stroke-linejoin="round"/>${dots}${years}
       <text x="47" y="${y(first.value) - 8}" fill="#fff" font-weight="700" font-size="21">${pct(first.value)}</text>
       <text x="435" y="${y(last.value) - 13}" text-anchor="end" fill="#fff" font-weight="700" font-size="21">${pct(last.value)}</text>
     </svg>`;
}

const opportunities = [[true, false], [false, true], [false, true]];
function showRoutes(route) {
  let count = 0;
  const rows = opportunities.map(([district, list], index) => {
    const won = (route !== 'list' && district) || (route !== 'district' && list);
    if (won) count++;
    const cell = (available, success) => available ? `<td>${success ? 'Ja' : 'Nein'}</td>` :
      '<td class="inactive"><span aria-label="Nicht berücksichtigt">–</span></td>';
    return `<tr><th scope="row">${['Erste', 'Zweite', 'Dritte'][index]}</th>${cell(route !== 'list', district)}${cell(route !== 'district', list)}<td>${won ? 'Ja' : 'Nein'}</td></tr>`;
  });
  document.getElementById('route-body').innerHTML = rows.join('');
  const category = count === 3 ? 'sicher' : count === 0 ? 'unsicher' : 'umkämpft';
  document.getElementById('route-result').textContent =
    `In ${count} von 3 Wahlen hätte es gereicht. Die Position gilt als ${category}.`;
}

const captions = {
  elected: {
    type: 'Beobachteter Wahlerfolg', title: 'Wie viele zogen ein?',
    metric: 'Anteil der Gewählten unter den jeweils unsicher, umkämpft und sicher Nominierten.',
    source: 'GLES 2013, 2017, 2021. Ungewichtete, im Aufsatz berichtete Anteile. Elsässer & Wenker, S. 29 und Online-Anhang, Abb. A4.'
  },
  observed: {
    type: 'Beobachtete Zusammensetzung', title: 'Wer bekam welche Plätze?',
    metric: 'Anteil der jeweiligen Gruppe unter den unsicher, umkämpft und sicher Nominierten.',
    source: 'GLES 2013, 2017, 2021, gewichtet. Originalbalken aus Elsässer & Wenker (2026), Abb. 4, S. 34. Ausschnitt und deutsche Achsenbeschriftung. <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>'
  },
  model: {
    type: 'Modell · Rechenbeispiel', title: 'Chance auf eine sichere Nominierung',
    metric: 'Vergleichsprofil mit tertiärer Bildung ohne frühe politiknahe Laufbahn. Seine Ausgangschance ist hier auf 50 % gesetzt.',
    source: 'GLES 2013, 2017, 2021. Geordnetes Logitmodell, 1.403 Fälle. Eigene Umrechnung aus dem Online-Anhang, Tab. A2, Gesamtmodell.'
  }
};

function percentageBars(rows) {
  const bars = rows.map(row =>
    `<div class="bar-row"><div class="bar-label"><span>${row.label} nominiert</span><strong>${pct(row.value)}</strong></div>
       <div class="track" aria-hidden="true"><div class="fill" style="width:${row.value}%"></div></div></div>`).join('');
  return `<div class="bars">${bars}<div class="bar-axis" aria-hidden="true"><span>0 %</span><span>100 %</span></div></div>`;
}

function socialCharts() {
  const groups = [
    ['./abb4-bildung.png', 'Ohne tertiäre Bildung', 'Der Gruppenanteil sinkt von unsicheren über umkämpfte zu sicheren Positionen.'],
    ['./abb4-laufbahn.png', 'Politiknahe Laufbahn', 'Der Gruppenanteil steigt von unsicheren über umkämpfte zu sicheren Positionen.']
  ];
  return '<div class="social-plots">' + groups.map(([file, title, description]) =>
    `<div><h4>${title}</h4><svg viewBox="0 0 316 164" role="img" aria-label="${description}">
       <image href="${file}" x="46" y="9" width="264" height="124" preserveAspectRatio="none"/>
       <path d="M43,9 V133 H310" fill="none" stroke="#778999"/>
       <g font-size="16" fill="#344d61" text-anchor="end">
         <text x="38" y="15">30 %</text><text x="38" y="55">20 %</text><text x="38" y="96">10 %</text><text x="38" y="138">0 %</text>
       </g><g font-size="16" fill="#203d53" text-anchor="middle">
         <text x="89" y="156">unsicher</text><text x="177" y="156">umkämpft</text><text x="265" y="156">sicher</text>
       </g></svg></div>`).join('') + '</div>';
}

// Bei einer fest vorgegebenen Referenzwahrscheinlichkeit von 0,5 sind die Referenzodds 1.
function exampleProbability(oddsRatio) {
  return 100 * oddsRatio / (1 + oddsRatio);
}

function intervalPlot() {
  const rows = study.oddsRatios.map(row => ({
    label: row.label, value: exampleProbability(row.value),
    low: exampleProbability(row.low), high: exampleProbability(row.high)
  }));
  rows.splice(1, 0, { label: 'Vergleichsprofil', value: 50 });
  const marks = rows.map(row => {
    const label = row.low === undefined ? '50 % · gesetzt' :
      pct(row.value) + ' (' + integer.format(row.low) + '–' + pct(row.high) + ')';
    const interval = row.low === undefined ? '' :
      `<i class="interval" style="left:${row.low}%;width:${row.high - row.low}%"></i>`;
    return `<div class="prob-row"><div class="bar-label"><span>${row.label}</span><strong>${label}</strong></div>
      <div class="prob-scale" aria-hidden="true">${interval}<i class="point" style="left:${row.value}%"></i></div></div>`;
  }).join('');
  return `<div class="bars">${marks}<div class="bar-axis" aria-hidden="true"><span>0 %</span><span>50 %</span><span>100 %</span></div></div>
    <p class="interval-note">Punkt und Spanne zeigen Schätzwert und 95%-Konfidenzintervall bei festem Ausgangswert.</p>`;
}

function chartHTML(key) {
  const entry = captions[key];
  const graphic = { elected: () => percentageBars(study.elected), observed: socialCharts, model: intervalPlot }[key]();
  return `<figure class="chart-box"><p class="chart-type">${entry.type}</p><h3>${entry.title}</h3>
          <p class="metric">${entry.metric}</p>${graphic}<figcaption>${entry.source}</figcaption></figure>`;
}

function showMethod() {
  const comparisons = study.oddsRatios.map(row =>
    `<li>${row.label}: Odds Ratio ${decimal.format(row.value)} (95%-KI ${decimal.format(row.low)}–${decimal.format(row.high)}).</li>`).join('');
  const reported = study.model.map(row => pct(row.value)).join(', ');
  document.getElementById('model-method-body').innerHTML =
    `<p>Das geordnete Logitmodell unterscheidet unsichere, umkämpfte und sichere Positionen. Es berücksichtigt Amtsinhaberschaft, Alter, Geschlecht, selbst berichteten Migrationshintergrund, Wohnortgröße, Partei, Land und Wahljahr. Gleiche Merkmale im Modell schließen unbeobachtete Unterschiede zwischen den Gruppen nicht aus.</p>
     <p>Für einen sicheren Platz gegenüber den beiden anderen Kategorien liefert das Modell folgende Chancenverhältnisse gegenüber dem Vergleichsprofil. Eine Odds Ratio von 1 bedeutet gleiche Chancen.</p><ul>${comparisons}</ul>
     <p>Das Rechenbeispiel setzt die Wahrscheinlichkeit des Vergleichsprofils auf 50 Prozent. Dann sind die Chancen für und gegen einen sicheren Platz gleich groß. Bei diesem festen Ausgangswert erhält man die neue Wahrscheinlichkeit als OR / (1 + OR). Dieselbe Umrechnung der beiden Intervallgrenzen ergibt die gezeigten Spannen. Diese enthalten nur die Schätzunsicherheit des jeweiligen Gruppenvergleichs. Die 50 Prozent sind eine didaktische Annahme.</p>
     <p><strong>Warum ein Rechenbeispiel?</strong> Der Fließtext (S. 34–35) nennt ${reported} für einen männlichen SPD-Abgeordneten aus Nordrhein-Westfalen, 51–65 Jahre, nach einer Wahlperiode, ohne Migrationshintergrund, aus einer kleinen oder mittleren Stadt (Profil im Replikationscode für 2021). Die Werte stehen in der Reihenfolge Bildungsproxy, Vergleichsprofil, politiknahe Laufbahn. Die Balken in Abb. 6 weichen davon ab. Ohne die zugangsbeschränkten GLES-Einzeldaten und die Kovarianzmatrix lässt sich das Originalprofil hier nicht verlässlich mit Unsicherheit nachschätzen.</p>`;
}

const stops = [...document.querySelectorAll('[data-stop]')];
const steps = [...document.querySelectorAll('[data-figure]')];
const mainLinks = [...document.querySelectorAll('.links a')];
const chartLinks = [...document.querySelectorAll('.chart-nav a')];
const chapter = { einstieg: null, vermutung: 'vermutung', wege: 'wege', wahlerfolg: 'wahlerfolg',
  gruppen: 'wahlerfolg', modell: 'wahlerfolg', transfer: 'transfer', quellen: null };
let activeChart = '';
let currentStop = 0;
let presenting = false;
function markLinks(links, id) {
  for (const link of links) {
    if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
function updateViewport() {
  const line = Math.min(innerHeight * .35, 230);
  let index = stops.findLastIndex(stop => stop.getBoundingClientRect().top <= line);
  if (index < 0) index = 0;
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) index = stops.length - 1;
  currentStop = index;
  const step = steps.findLast(item => item.getBoundingClientRect().top <= line) || steps[0];
  if (step.dataset.figure !== activeChart) {
    activeChart = step.dataset.figure;
    document.getElementById('current-chart').innerHTML = chartHTML(activeChart);
    markLinks(chartLinks, step.id);
  }
  markLinks(mainLinks, chapter[stops[index].id]);
  document.getElementById('position').textContent = (index + 1) + ' / ' + stops.length;
  document.getElementById('back').disabled = index === 0;
  document.getElementById('forward').disabled = index === stops.length - 1;
}

function togglePresentation(enabled) {
  presenting = enabled;
  document.body.classList.toggle('presenting', enabled);
  document.getElementById('present-bar').hidden = !enabled;
  const toggle = document.getElementById('present');
  toggle.setAttribute('aria-pressed', String(enabled));
  updateViewport();
  const control = currentStop === stops.length - 1 ? 'back' : 'forward';
  (enabled ? document.getElementById(control) : toggle).focus({ preventScroll: true });
}
function goToStop(index) {
  const target = stops[Math.max(0, Math.min(index, stops.length - 1))];
  target.scrollIntoView({ block: 'start', behavior: 'instant' });
  updateViewport();
}

drawHistory();
showMethod();
showRoutes('district');
document.querySelector('.route-options').addEventListener('change', e => showRoutes(e.target.value));
for (const chart of document.querySelectorAll('[data-chart]')) chart.innerHTML = chartHTML(chart.dataset.chart);
const prediction = document.getElementById('prediction');
prediction.addEventListener('submit', event => {
  event.preventDefault();
  const choice = prediction.querySelector('input:checked').parentElement.textContent.trim();
  const reason = document.getElementById('reason').value.trim();
  prediction.querySelector('fieldset').hidden = true;
  const status = document.getElementById('prediction-status');
  status.textContent = 'Ihre Vermutung ist für diesen Durchlauf festgehalten. Am Ende kommen Sie darauf zurück.';
  prediction.querySelector('a').focus({ preventScroll: true });
  const recall = document.getElementById('recall');
  recall.textContent = 'Ihre Vermutung: „' + choice + '.“' + (reason ? ' Ihre Begründung: „' + reason + '“' : '');
  recall.hidden = false;
});
document.getElementById('present').addEventListener('click', () => togglePresentation(!presenting));
document.getElementById('leave').addEventListener('click', () => togglePresentation(false));
document.getElementById('back').addEventListener('click', () => goToStop(currentStop - 1));
document.getElementById('forward').addEventListener('click', () => goToStop(currentStop + 1));
document.addEventListener('keydown', event => {
  if (!presenting || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'Escape') { togglePresentation(false); return; }
  if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (['ArrowRight', 'ArrowLeft'].includes(event.key)) {
    event.preventDefault();
    goToStop(currentStop + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
let frame = 0;
function scheduleUpdate() {
  if (frame) return;
  frame = requestAnimationFrame(() => { frame = 0; updateViewport(); });
}
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
updateViewport();
