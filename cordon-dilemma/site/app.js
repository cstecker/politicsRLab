/* Buildless, offline-fähiger Lernpfad. Studienaggregate und Tab-Antworten bleiben getrennt. */
(function () {
  'use strict';
  const FEATURES = [
    { key: 'cj_age', label: 'Alter', short: 'Alter', levels: ['28', '34', '47', '54', '67'] },
    { key: 'cj_geschlecht', label: 'Geschlecht', short: 'Geschlecht', levels: ['männlich', 'weiblich'] },
    { key: 'cj_experience', label: 'Bisherige politische Erfahrung', short: 'Erfahrung', levels: ['Erfahrung in Kommunen', 'Erfahrung in Kommunen und Landtag', 'Erfahrung in Kommunen, Landtag und Landesregierung'] },
    { key: 'cj_immi', label: 'Für den Zuzug von Flüchtlingen nach Deutschland sollte …', short: 'Flüchtlingszuzug', levels: ['keine Obergrenze', 'Obergrenze 60 000', 'Obergrenze 200 000', 'vollständiger Stopp'], survey: ['… keine Obergrenze gelten', '… eine Obergrenze von 60 000 pro Jahr gelten', '… eine Obergrenze von 200 000 pro Jahr gelten', '… ein vollständiger Stop verhängt werden'] },
    { key: 'cj_redis', label: 'Einkommens- und Vermögensunterschiede …', short: 'Umverteilung', levels: ['verringert werden', 'nicht verringert werden'], survey: ['… sollten verringert werden', '… sollten nicht verringert werden'] },
    { key: 'cj_ukraine', label: 'Die Ukraine sollte …', short: 'Ukraine-Unterstützung', levels: ['nicht weiter unterstützen', 'wie bisher unterstützen', 'stärker unterstützen'], survey: ['… nicht weiter unterstützt werden', '… weiter wie im bisherigen Umfang unterstützt werden', '… stärker als bisher unterstützt werden'] },
    { key: 'cj_afdtreatment', label: 'Umgang mit der AfD', short: 'Umgang mit der AfD', levels: ['keine Zusammenarbeit', 'gemeinsam bei CDU-Anträgen abstimmen', 'gemeinsam bei AfD-Anträgen abstimmen', 'Koalition mit AfD denkbar'], survey: ['will keinerlei Zusammenarbeit mit der AfD', 'würde bei CDU-Anträgen auch mit der AfD abstimmen', 'würde auch bei AfD-Anträgen mit der AfD abstimmen', 'würde mit der AfD eine Koalition bilden'] }
  ];
  const ITEMS = [
    { key: 'coalpref1_afdnormalparty', text: 'Man sollte die AfD wie eine ganz normale Partei behandeln.' },
    { key: 'coalpref1_content', text: 'Bei einer Abstimmung sind nicht nur die Inhalte wichtig, sondern auch welche Parteien sie eingebracht haben.' },
    { key: 'selfpos_redis', text: 'Umverteilung: Der Staat sollte Einkommens- und Vermögensunterschiede stärker verringern.' },
    { key: 'selfpos_immi', text: 'Flucht-Migration: Der Zuzug von Flüchtlingen und Asylbewerbern sollte einschränkt werden.' },
    { key: 'selfpos_ukraine', text: 'Ukraine: Die Ukraine sollte weiterhin unterstützt werden.' },
    { key: 'selfpos_immi2', text: 'Fachkräftezuwanderung: Der Zuzug von ausländischen Fachkräften sollte eingeschränkt werden.' }
  ];
  const AGREEMENT = ['stimme überhaupt nicht zu', 'stimme eher nicht zu', 'teils/teils', 'stimme eher zu', 'stimme voll zu'];
  const AGREE_COLORS = ['#f2d35d', '#f6e9a9', '#b9c3cb', '#5287b3', '#194d77'];
  const GROUPS = { all: 'Alle Befragten', leftbloc: 'SPD, Grüne und Linke', cdu: 'CDU-Wählerschaft', afd: 'AfD-Wählerschaft' };
  const PARTY_NAMES = { cdu: 'CDU', afd: 'AfD', bsw: 'BSW', pds: 'Die Linke', gru: 'Die Grünen', spd: 'SPD', fdp: 'FDP' };
  const PARTY_COLORS = { cdu: '#242424', afd: '#007db7', bsw: '#83245f', pds: '#c1277d', gru: '#378138', spd: '#c3323a', fdp: '#c3a800' };
  const STORE_KEY = 'methodlab-cordon-v1';
  const number = value => Number(value).toLocaleString('de-DE');
  const percent = value => (value * 100).toLocaleString('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + ' %';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function randomProfile(random = Math.random) {
    return Object.fromEntries(FEATURES.map(f => [f.key, f.levels[Math.floor(random() * f.levels.length)]]));
  }
  function makeState(random = Math.random) {
    return { version: 1, stage: 0, unlocked: false, prediction: '', answers: {},
      rounds: Array.from({ length: 3 }, () => ({ profiles: [randomProfile(random), randomProfile(random)], ratings: [null, null], choice: null })) };
  }
  function validState(s) {
    return s && s.version === 1 && Number.isInteger(s.stage) && s.stage >= 0 && s.stage <= 4 &&
      s.answers && typeof s.answers === 'object' && Array.isArray(s.rounds) && s.rounds.length === 3 &&
      s.rounds.every(r => Array.isArray(r.profiles) && r.profiles.length === 2 && r.profiles.every(p => FEATURES.every(f => f.levels.includes(p[f.key]))) &&
        Array.isArray(r.ratings) && r.ratings.length === 2 && r.ratings.every(v => v === null || (Number.isInteger(v) && v >= -5 && v <= 5)) && [null, 0, 1].includes(r.choice));
  }
  function longRows(s, demo = false) {
    return s.rounds.flatMap((r, i) => r.profiles.map((p, j) => ({
      ResponseId: demo ? 'DEMO' : 'PERSON', cjround: i + 1, cjprofile: j + 1,
      cj_elect: r.choice === null ? null : Number(r.choice === j), cj_skalo: r.ratings[j], ...p
    })));
  }
  function toCSV(rows) {
    if (!rows.length) return '';
    const keys = Object.keys(rows[0]);
    const quote = v => v == null ? '' : '"' + String(v).replace(/"/g, '""') + '"';
    return '\ufeff' + [keys.map(quote).join(','), ...rows.map(r => keys.map(k => quote(r[k])).join(','))].join('\r\n');
  }
  // Die reinen Funktionen dienen auch dem lokalen Design- und Datencheck.
  if (typeof module !== 'undefined' && module.exports) module.exports = { FEATURES, ITEMS, makeState, randomProfile, validState, longRows, toCSV };
  if (typeof document === 'undefined') return;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const STUDY = window.CORDON_STUDY;
  if (!STUDY) { $('#survey-stage').textContent = 'Die Studiendaten konnten nicht geladen werden. Bitte alle Dateien des Entwurfs zusammen öffnen.'; return; }

  let storageAvailable = true;
  let state;
  try { const saved = JSON.parse(sessionStorage.getItem(STORE_KEY)); state = validState(saved) ? saved : makeState(); }
  catch (_) { state = makeState(); storageAvailable = false; }
  function save() { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) { storageAvailable = false; } }
  save();
  function download(name, text, type) {
    const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function featureLabel(profile, feature) {
    const i = feature.levels.indexOf(profile[feature.key]);
    return feature.survey ? feature.survey[i] : profile[feature.key] + (feature.key === 'cj_age' ? ' Jahre' : '');
  }
  function likert(key, title, labels = AGREEMENT) {
    const selected = state.answers[key];
    return `<fieldset><legend>${esc(title)}</legend><div class="likert">${labels.map((label, i) => `<label><input type="radio" name="${key}" value="${i}" ${selected === i ? 'checked' : ''}><span>${esc(label)}</span></label>`).join('')}</div></fieldset>`;
  }
  function ratingGroup(name, title, value) {
    return `<fieldset><legend>${esc(title)}</legend><div class="rating-grid">${Array.from({ length: 11 }, (_, i) => i - 5).map(v => `<label class="rating-option"><input type="radio" name="${name}" value="${v}" ${value === v ? 'checked' : ''}><span>${v > 0 ? '+' : ''}${v}</span></label>`).join('')}</div><div class="rating-anchors"><span>−5: halte überhaupt nichts davon</span><span>+5: halte sehr viel davon</span></div></fieldset>`;
  }
  function options(entries, selected) { return entries.map(([value, label]) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`).join(''); }
  function showStage(scroll = false) {
    const stage = state.stage;
    $$('#survey-steps li').forEach((li, i) => { li.classList.toggle('active', i === stage); li.classList.toggle('done', i < stage); });
    const host = $('#survey-stage');
    const storageWarning = storageAvailable ? '' : '<p class="storage-note" role="status">Der Tab-Speicher ist gesperrt. Sie können teilnehmen; Ihr Zwischenstand geht beim Neuladen verloren.</p>';
    if (stage === 0) {
      const votes = [['', 'Keine Angabe'], ...Object.entries(PARTY_NAMES), ['other', 'Eine andere Partei'], ['non', 'Ich würde nicht wählen']];
      host.innerHTML = storageWarning + `<p class="eyebrow">VOR DEM EXPERIMENT</p><h3>Wie sehen Sie das?</h3><p>Hier stehen Aussagen aus dem Originalfragebogen. Antworten Sie spontan. Alle Fragen auf dieser Seite sind freiwillig. Die damalige politische Situation ist die von 2024.</p><form id="attitude-form">${ITEMS.map(item => likert(item.key, item.text)).join('')}<details class="optional-block"><summary>Zusätzlich: Parteiwahlabsicht, Parteibewertungen und Themenwichtigkeit</summary><p class="small">Diese Angaben wurden vor dem Experiment erfragt. Sie können sie auslassen. Die Bundestagswahlabsicht wurde ergänzend zur Landtagswahlabsicht erhoben; die hier gezeigten Gruppen folgen der Landtagswahlabsicht.</p><div class="controls"><label>Wenn am nächsten Sonntag Landtagswahl wäre, welche Partei würden Sie wählen?<select name="vote_ltw2">${options(votes, state.answers.vote_ltw2 || '')}</select></label><label>Wenn am nächsten Sonntag Bundestagswahl wäre, welche Partei würden Sie wählen?<select name="vote_btw2">${options(votes.map(([key, label]) => [key, key === 'cdu' ? 'CDU/CSU' : label]), state.answers.vote_btw2 || '')}</select></label></div><p class="small">Was halten Sie ganz allgemein von den einzelnen politischen Parteien? −5 heißt: überhaupt nichts; +5 heißt: sehr viel. Die Skala und die Parteien entsprechen dem Fragebogen.</p>${Object.entries(PARTY_NAMES).map(([key, label]) => ratingGroup('party_' + key, label, state.answers['party_' + key])).join('')}${['Umverteilung', 'Klimawandel', 'Migration/Zuwanderung', 'Unterstützung der Ukraine'].map((label, i) => likert('salience_' + i, 'Wie wichtig ist Ihnen: ' + label + '?', ['überhaupt nicht wichtig', 'weniger wichtig', 'mittelmäßig', 'eher wichtig', 'sehr wichtig'])).join('')}</details><div class="survey-actions"><button class="button primary" type="submit">Zu den Kandidierenden →</button></div></form>`;
      $('#attitude-form').addEventListener('change', event => {
        const el = event.target; state.answers[el.name] = el.tagName === 'SELECT' ? el.value : Number(el.value); save();
      });
      $('#attitude-form').addEventListener('submit', event => { event.preventDefault(); state.stage = 1; save(); showStage(true); });
    } else if (stage <= 3) {
      const round = state.rounds[stage - 1];
      host.innerHTML = storageWarning + `<p class="eyebrow">RUNDE ${stage} VON 3</p><h3>Zwei Profile. Ihre Entscheidung.</h3><p>Stellen Sie sich vor, diese beiden hypothetischen Kandidierenden der <strong>CDU</strong> treten bei den Landtagswahlen in Sachsen oder Thüringen an. Vergleichen Sie ihre Eigenschaften, politischen Positionen und Einstellungen zur AfD sorgfältig. Bewerten Sie beide und entscheiden Sie, wen Sie eher wählen würden.</p><table class="candidate-table"><caption class="small">Beide Profile sind zufällig zusammengesetzt; gleiche Ausprägungen sind möglich.</caption><thead><tr><th>Eigenschaft</th><th>Kandidat 1</th><th>Kandidat 2</th></tr></thead><tbody>${FEATURES.map(f => `<tr ${f.key === 'cj_afdtreatment' ? 'class="coop-row"' : ''}><th scope="row">${esc(f.label)}</th>${round.profiles.map(p => `<td>${esc(featureLabel(p, f))}</td>`).join('')}</tr>`).join('')}</tbody></table><form id="conjoint-form"><p class="small" style="margin-top:23px">Was halten Sie ganz allgemein von den Kandidierenden? Mit den Werten zwischen −5 und +5 können Sie Ihre Meinung abstufen.</p>${round.profiles.map((_, i) => ratingGroup('rating_' + i, 'Bewertung Kandidat ' + (i + 1), round.ratings[i])).join('')}<fieldset><legend>Welchen der beiden Kandidierenden würden Sie eher wählen?</legend><div class="choice-options">${round.profiles.map((_, i) => `<label><input type="radio" name="choice" value="${i}" ${round.choice === i ? 'checked' : ''}><span>Ich würde eher Kandidat ${i + 1} wählen.</span></label>`).join('')}</div></fieldset><p id="survey-error" class="survey-error" role="status"></p><div class="survey-actions"><button class="text-button" type="button" id="previous-stage">← Zurück</button><button type="submit" class="button primary">${stage === 3 ? 'Ihre Antworten ansehen' : 'Nächstes Paar'} →</button></div></form>`;
      $('#conjoint-form').addEventListener('change', event => { const el = event.target; if (el.name === 'choice') round.choice = Number(el.value); else round.ratings[Number(el.name.slice(-1))] = Number(el.value); save(); });
      $('#previous-stage').addEventListener('click', () => { state.stage--; save(); showStage(true); });
      $('#conjoint-form').addEventListener('submit', event => {
        event.preventDefault();
        if (round.choice === null || round.ratings.some(v => v === null)) { $('#survey-error').textContent = 'Bitte bewerten Sie beide Profile und wählen Sie eines aus. Sie können alternativ links bzw. oben direkt zur Erklärung gehen.'; return; }
        state.stage++; if (state.stage === 4) state.unlocked = true; save(); showStage(true); if (state.unlocked) unlock(false); renderData();
      });
    } else {
      host.innerHTML = `<p class="eyebrow">IHR DURCHLAUF IST VOLLSTÄNDIG</p><h3>Sechs Profile. Drei Entscheidungen.</h3><p>Sie haben erlebt, wie politische Eigenschaften in einer Entscheidung zusammenkommen. Aus Ihren Antworten allein lässt sich kein belastbarer Effekt einer Eigenschaft schätzen.</p><div class="summary-cards"><div class="summary-card"><strong>3</strong><span>entschiedene Paare</span></div><div class="summary-card"><strong>6</strong><span>Profilbewertungen</span></div><div class="summary-card"><strong>7</strong><span>randomisierte Merkmale</span></div></div><p>Im nächsten Kapitel finden Sie Ihre Antworten als Datentabelle wieder. Danach zerlegen wir die Auswertung der Studie.</p><div class="survey-actions"><button class="text-button" id="review-rounds">← Antworten überprüfen</button><a class="button primary" href="#daten">Aus Antworten werden Daten →</a></div>`;
      $('#review-rounds').addEventListener('click', () => { state.stage = 1; save(); showStage(true); });
    }
    if (scroll) host.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function unlock(scroll = true) {
    state.unlocked = true; save(); $('#analysis-content').hidden = false; $('#analysis-gate').hidden = true;
    renderData(); renderAllCharts(); renderReflection();
    if (scroll) $('#daten').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const demo = makeState(() => .31);
  demo.rounds = Array.from({ length: 3 }, (_, i) => ({
    profiles: [0, 1].map(j => Object.fromEntries(FEATURES.map((f, k) => [f.key, f.levels[(i + j + k) % f.levels.length]]))),
    ratings: [[1, -2], [-1, 2], [3, 0]][i], choice: [0, 1, 0][i]
  }));
  function currentRows() { const own = state.rounds.some(r => r.choice !== null || r.ratings.some(v => v !== null)); return { rows: longRows(own ? state : demo, !own), own }; }
  function renderData() {
    const { rows, own } = currentRows();
    $('#data-heading').textContent = own ? 'Ihr Durchlauf im Long-Format' : 'Ein fiktiver Durchlauf im Long-Format';
    $('#data-explanation').textContent = own ? 'Das sind Ihre aktuell gespeicherten Profile und Antworten. Noch nicht beantwortete Werte stehen als NA. Jede Runde belegt zwei Zeilen.' : 'Sie haben das Experiment übersprungen. Diese sechs Zeilen sind ein ausdrücklich fiktives Lehrbeispiel, keine Originalbeobachtungen.';
    const keys = ['ResponseId', 'cjround', 'cjprofile', 'cj_elect', 'cj_skalo', ...FEATURES.map(f => f.key)];
    $('#long-data').innerHTML = `<caption class="small">${own ? 'Eigene Tab-Antworten' : 'Fiktive Beispieldaten'} · Einheit: Person × Runde × Profil</caption><thead><tr>${keys.map(k => `<th scope="col">${esc(k)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${keys.map(k => `<td ${k === 'cj_elect' && r[k] === 1 ? 'class="chosen-cell"' : ''}>${r[k] === null ? 'NA' : esc(r[k])}</td>`).join('')}</tr>`).join('')}</tbody>`;
    $('#download-own').textContent = own ? 'Eigene Antworten als CSV ↓' : 'Lehrbeispiel als CSV ↓';
    $('#sample-numbers').innerHTML = [[STUDY.meta.attention_pass, 'Personen nach Aufmerksamkeitsprüfung'], [STUDY.meta.conjoint_people, 'Personen in der Conjoint-Auswertung'], [STUDY.meta.profiles, 'vollständige Profilzeilen']].map(([n, label]) => `<div class="sample-stat"><strong>${number(n)}</strong><span>${label}</span></div>`).join('');
  }

  function selectEstimates({ group = 'all', feature = 'cj_afdtreatment', outcome = 'choice', region = 'all', moderator = 'none', category = 'all' } = {}) {
    const rows = STUDY.estimates.filter(d => d.group === group && d.feature === feature && d.outcome === outcome && d.region === region && d.moderator === moderator && d.category === category);
    const f = FEATURES.find(f => f.key === feature);
    return rows.sort((a, b) => f.levels.indexOf(a.level) - f.levels.indexOf(b.level));
  }
  function wrap(text, max) {
    const words = text.split(' '); const lines = [''];
    words.forEach(word => { const last = lines.length - 1; if (lines[last] && lines[last].length + word.length + 1 > max) lines.push(word); else lines[last] += (lines[last] ? ' ' : '') + word; });
    return lines;
  }
  function svgText(text, x, y, max, className = 'row-label', size = 12) {
    const lines = wrap(text, max);
    return `<text class="${className}" x="${x}" y="${y}" font-size="${size}">${lines.map((line, i) => `<tspan x="${x}" dy="${i ? 15 : 0}">${esc(line)}</tspan>`).join('')}</text>`;
  }
  let chartId = 0;
  function drawChart(host, rows, { outcome = 'choice', compare = null, baseline = null } = {}) {
    if (!rows.length) { host.innerHTML = '<p class="plot-empty">Für diese Kombination liegen keine Schätzwerte vor.</p>'; return; }
    const width = Math.max(285, Math.min(850, host.clientWidth || 500));
    const mobile = width < 420;
    const left = mobile ? 12 : Math.min(250, width * .44);
    const right = width - 58;
    const rowHeight = mobile ? (compare ? 91 : 58) : (compare ? 74 : 65);
    const top = 14, bottom = 43, height = top + rows.length * rowHeight + bottom;
    const min = outcome === 'rating' ? -5 : 0, max = outcome === 'rating' ? 5 : 1;
    const x = value => left + (Math.max(min, Math.min(max, value)) - min) / (max - min) * (right - left);
    const ticks = outcome === 'rating' ? [-5, -2.5, 0, 2.5, 5] : [0, .25, .5, .75, 1];
    const plotTop = mobile ? 38 : top;
    const plotBottom = height - bottom;
    const valueLabel = v => outcome === 'rating' ? v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : percent(v);
    const titleId = 'chart-title-' + (++chartId);
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${titleId}"><title id="${titleId}">${outcome === 'rating' ? 'Mittlere Profilbewertungen' : 'Marginal Means der Profilauswahl'} mit 95%-Konfidenzintervallen</title><desc>${esc(rows.map((r, i) => `${r.level}: ${valueLabel(r.estimate)}, 95%-Intervall ${valueLabel(r.lower)} bis ${valueLabel(r.upper)}${compare ? '; Zustimmung: ' + valueLabel(compare[i].estimate) : ''}`).join('. '))}</desc>`;
    ticks.forEach(tick => { svg += `<line x1="${x(tick)}" x2="${x(tick)}" y1="${plotTop}" y2="${plotBottom}" stroke="${tick === (outcome === 'rating' ? 0 : .5) ? '#91a4b3' : '#e8edf1'}" ${tick === (outcome === 'rating' ? 0 : .5) ? 'stroke-dasharray="4 4"' : ''}/><text x="${x(tick)}" y="${height - 20}" font-size="10" text-anchor="middle">${outcome === 'rating' ? String(tick).replace('.', ',') : Math.round(tick * 100) + ' %'}</text>`; });
    if (baseline !== null) svg += `<line x1="${x(baseline)}" x2="${x(baseline)}" y1="${plotTop}" y2="${plotBottom}" stroke="#667e8c" stroke-dasharray="2 3" stroke-width="2"/>`;
    rows.forEach((row, i) => {
      const labelY = top + i * rowHeight + (mobile ? 8 : rowHeight / 2 - (wrap(row.level, 28).length - 1) * 7);
      const y = top + i * rowHeight + (mobile ? rowHeight - 15 : rowHeight / 2);
      svg += svgText(row.level, mobile ? 0 : 0, labelY, mobile ? 42 : Math.max(20, Math.floor(left / 6.5)), 'row-label', mobile ? 11 : 12);
      const marks = compare ? [[row, '#005aa9', y - 8], [compare[i], '#ae6000', y + 8]] : [[row, '#005aa9', y]];
      marks.forEach(([r, color, cy]) => {
        svg += `<line x1="${x(r.lower)}" x2="${x(r.upper)}" y1="${cy}" y2="${cy}" stroke="${color}" stroke-width="2"/><line x1="${x(r.lower)}" x2="${x(r.lower)}" y1="${cy - 4}" y2="${cy + 4}" stroke="${color}"/><line x1="${x(r.upper)}" x2="${x(r.upper)}" y1="${cy - 4}" y2="${cy + 4}" stroke="${color}"/><circle cx="${x(r.estimate)}" cy="${cy}" r="4" fill="${color}"/><text x="${width - 2}" y="${cy + 4}" text-anchor="end" font-size="11" class="estimate-label">${esc(valueLabel(r.estimate))}</text>`;
      });
    });
    svg += `<text x="${(left + right) / 2}" y="${height - 2}" text-anchor="middle" font-size="10">${outcome === 'rating' ? 'Bewertung (−5 bis +5)' : 'Auswahlwahrscheinlichkeit'}</text></svg>`;
    host.innerHTML = svg;
  }
  let resultGroup = 'all';
  function renderResult(group = resultGroup) {
    resultGroup = group;
    const rows = selectEstimates({ group });
    $('#result-title').textContent = GROUPS[group]; drawChart($('#result-chart'), rows);
    $('#result-n').textContent = rows.length ? `${number(rows[0].n_people)} Personen, ${number(rows[0].n_profiles)} Profile.` : '';
  }
  function renderExplorer() {
    const feature = $('#explore-feature').value, group = $('#explore-group').value, outcome = $('#explore-outcome').value;
    const rows = selectEstimates({ feature, group, outcome });
    const party = STUDY.party_ratings.find(d => d.group === group && d.party === 'skalo_parties_cdu');
    const baseline = outcome === 'rating' && party ? party.mean : null;
    drawChart($('#explore-chart'), rows, { outcome, baseline });
    $('#explore-note').textContent = `${outcome === 'rating' ? 'Bewertungsskala −5 bis +5; Punkte sind mittlere Bewertungen.' : 'Punkte sind Auswahlwahrscheinlichkeiten, keine Zustimmungsanteile und keine Prognose von Parteistimmen.'} Linien: 95%-Konfidenzintervalle, nach Person geclustert.${baseline !== null ? ' Zusätzliche gepunktete Linie: mittlere Bewertung der CDU als Partei in dieser Wählerschaft (' + baseline.toLocaleString('de-DE', { maximumFractionDigits: 2 }) + '), aus dem separaten Frageblock vor dem Conjoint; Basis: gültige Parteibewertungen.' : ''}${rows.length ? ' n = ' + number(rows[0].n_people) + ' Personen / ' + number(rows[0].n_profiles) + ' Profile.' : ''}`;
    const fmt = outcome === 'rating' ? v => v.toFixed(3).replace('.', ',') : percent;
    $('#explore-table').innerHTML = '<thead><tr><th>Ausprägung</th><th>MM</th><th>95%-Intervall</th></tr></thead><tbody>' + rows.map(r => `<tr><th scope="row">${esc(r.level)}</th><td>${fmt(r.estimate)}</td><td>${fmt(r.lower)} bis ${fmt(r.upper)}</td></tr>`).join('') + '</tbody>';
  }
  function renderAgreement() {
    const key = $('#agreement-item').value;
    $('#agreement-chart').innerHTML = ['pds', 'gru', 'spd', 'bsw', 'cdu', 'fdp', 'afd'].map(group => {
      const rows = STUDY.agreement.filter(d => d.group === group && d.item === key);
      return `<div class="agreement-row"><span>${PARTY_NAMES[group]}</span><div><div class="agreement-bar" role="img" aria-label="${esc(PARTY_NAMES[group] + ': ' + AGREEMENT.map(label => { const r = rows.find(r => r.response === label); return label + ' ' + (r ? percent(r.share) : '0 %'); }).join('; '))}">${AGREEMENT.map((label, i) => { const row = rows.find(r => r.response === label); const share = row?.share || 0; return `<span class="agreement-segment" style="width:${share * 100}%;background:${AGREE_COLORS[i]}" title="${esc(label)}: ${percent(share)}">${share >= .09 ? Math.round(share * 100) + '%' : ''}</span>`; }).join('')}</div><span class="small">n = ${number(rows[0]?.total || 0)}</span></div></div>`;
    }).join('');
  }
  function renderMotivation() {
    const group = $('#motive-group').value, moderator = $('#motive-kind').value, region = $('#motive-region').value;
    const other = selectEstimates({ group, moderator, region, category: 'other' });
    const agree = selectEstimates({ group, moderator, region, category: 'agree' });
    drawChart($('#motivation-chart'), other, { compare: agree });
    $('#motivation-n').textContent = `95%-Konfidenzintervalle, nach Person geclustert. Keine Zustimmung: ${number(other[0]?.n_people || 0)} Personen. Zustimmung: ${number(agree[0]?.n_people || 0)} Personen. Region bezieht sich auf den Wohnort, nicht auf das Profil. Unterschiede zwischen Punkten sind deskriptiv; hier wird kein Signifikanztest der Gruppendifferenz dargestellt.`;
  }
  function renderAllCharts() { if (!state.unlocked) return; renderResult(); renderExplorer(); renderAgreement(); renderMotivation(); renderMethod(methodStep); }

  let contextStep = 0, methodStep = 0, seatRegion = 'th';
  let selectedParties = ['cdu'];
  const SEATS = { th: { title: 'Thüringen 2024', total: 88, seats: { afd: 32, cdu: 23, bsw: 15, spd: 6, pds: 12 } }, sn: { title: 'Sachsen 2024', total: 120, seats: { afd: 40, cdu: 41, bsw: 15, spd: 10, gru: 7, pds: 6, fw: 1 } } };
  function renderContext(step = contextStep) {
    contextStep = step; $('#context-counter').textContent = '0' + (step + 1) + ' / 04';
    const host = $('#context-visual');
    const captions = [
      'Historische Sitzverteilung nach den Landtagswahlen vom 1. September 2024; zur Einordnung der vor der Wahl erhobenen Daten. Die Blöcke zeigen Sitzanteile, keine gemessenen ideologischen Abstände.',
      'Zwei mögliche Anreize, keine empirisch feststehenden Folgen: Inhalte durchsetzen und Unterstützung bei unterschiedlichen Wählergruppen sichern.',
      'Die vier Ausprägungen des zentralen experimentellen Merkmals. Andere Eigenschaften werden zusätzlich variiert.',
      'Beide Überlegungen sind theoretische Erwartungen. Die Ergebnisse lernen Sie nach Ihren eigenen Entscheidungen kennen.'
    ];
    if (step === 0) {
      const data = SEATS[seatRegion]; const names = { ...PARTY_NAMES, fw: 'Freie Wähler' }; const colors = { ...PARTY_COLORS, fw: '#728c9f' };
      const totalSelected = selectedParties.reduce((sum, key) => sum + (data.seats[key] || 0), 0), threshold = Math.floor(data.total / 2) + 1;
      host.innerHTML = `<div class="seat-choices"><button class="chip" data-region="th" aria-pressed="${seatRegion === 'th'}">Thüringen</button><button class="chip" data-region="sn" aria-pressed="${seatRegion === 'sn'}">Sachsen</button></div><h3 class="visual-title">${data.title}<br>${data.total} Sitze. ${threshold} für eine Mehrheit.</h3><div class="seat-row" role="img" aria-label="${esc(Object.entries(data.seats).map(([k, v]) => names[k] + ': ' + v).join(', '))}">${Object.entries(data.seats).map(([key, n]) => `<span class="seat-block" style="flex:${n};background:${colors[key]}" title="${names[key]}: ${n}">${n >= 6 ? n : ''}</span>`).join('')}</div><div class="seat-key">${Object.keys(data.seats).map(key => `<span><i style="background:${colors[key]}"></i>${names[key]}</span>`).join('')}</div><p class="small" style="margin-top:18px">Wählen Sie Parteien für einen rein rechnerischen Vergleich:</p><div class="seat-choices">${Object.keys(data.seats).map(key => `<button class="chip" data-party="${key}" aria-pressed="${selectedParties.includes(key)}">${names[key]}</button>`).join('')}</div><div class="majority-feedback" role="status"><strong>${totalSelected} von ${data.total} Sitzen</strong><br>${totalSelected >= threshold ? 'Rechnerisch eine absolute Mehrheit.' : 'Für eine absolute Mehrheit fehlen ' + (threshold - totalSelected) + ' Sitze.'} Politische Kooperationsbereitschaft folgt daraus nicht.</div>`;
      $$('[data-region]').forEach(b => b.addEventListener('click', () => { seatRegion = b.dataset.region; selectedParties = selectedParties.filter(k => SEATS[seatRegion].seats[k]); renderContext(0); }));
      $$('[data-party]').forEach(b => b.addEventListener('click', () => { const p = b.dataset.party; selectedParties = selectedParties.includes(p) ? selectedParties.filter(k => k !== p) : [...selectedParties, p]; renderContext(0); }));
    } else if (step === 1) {
      host.innerHTML = '<h3 class="visual-title">Ein strategischer Zielkonflikt.</h3><div class="dilemma-split"><div><span class="dilemma-arrow">↗</span><h4>Zusammenarbeiten</h4><p>Eigene politische Ziele leichter umsetzen?</p><p>Unterstützung in der Mitte verlieren?</p></div><div><span class="dilemma-arrow">↙</span><h4>Abgrenzen</h4><p>Prinzipielle Bindung und Vertrauen sichern?</p><p>Mehr inhaltliche Kompromisse eingehen?</p></div></div>';
    } else if (step === 2) {
      host.innerHTML = '<h3 class="visual-title">Vier Formen der Abgrenzung.</h3><div class="visual-steps">' + ['Keinerlei Zusammenarbeit', 'Gemeinsam bei CDU-Anträgen abstimmen', 'Gemeinsam bei AfD-Anträgen abstimmen', 'Eine Koalition bilden'].map((label, i) => `<div class="visual-step"><span>${i + 1}</span><span>${label}</span></div>`).join('') + '</div>';
    } else {
      host.innerHTML = '<h3 class="visual-title">Zwei mögliche Logiken.</h3><div class="dilemma-split"><div><p class="eyebrow">INSTRUMENTELL</p><h4>Was bringt es?</h4><p>Eine Kooperation als Weg zu erwünschten politischen Ergebnissen.</p></div><div><p class="eyebrow">PRINZIPIELL</p><h4>Mit wem ist es legitim?</h4><p>Eine Grenze unabhängig von möglichen inhaltlichen Gewinnen.</p></div></div>';
    }
    $('#context-caption').textContent = captions[step];
  }
  function renderMethod(step = methodStep) {
    methodStep = step; $('#method-counter').textContent = '0' + (step + 1) + ' / 04';
    const host = $('#method-visual'); const count = STUDY.counts.find(d => d.cj_afdtreatment === 'keine Zusammenarbeit');
    $('#mm-example').innerHTML = `Die Abbildung zeigt dafür <strong>${percent(count.mean)}</strong>: Von ${number(count.profiles)} Profilen, die jede Zusammenarbeit mit der AfD ausschlossen, wurden ${number(count.selected)} gewählt. Diese Profile wurden also im Durchschnitt mit einer Wahrscheinlichkeit von ${percent(count.mean)} gegenüber ihrem jeweiligen CDU-Gegenprofil ausgewählt. Der Nenner sind die gezeigten Profile mit dieser Position; derselbe Mensch kann mehrere davon bewertet haben.`;
    const captions = ['Ein illustratives Profil; alle Ausprägungen stammen aus der Originalprogrammierung. Die Zuweisung der Merkmale ist vollständig randomisiert, die Zeilenreihenfolge bleibt hier lesbar.', 'Echte Studienaggregate für „keine Zusammenarbeit“. Der einfache Anteil entspricht dem Marginal Mean dieses vollständig randomisierten Merkmals.', 'Die gestrichelte Linie ist die mittlere Auswahlrate aller vollständigen Profilpaare. Sie ist keine Zustimmungsgrenze.', 'Echte Studienwerte und 95%-Konfidenzintervalle. Geclustert wird nach ResponseId, nicht nach einzelner Profilzeile.'];
    if (step === 0) {
      host.innerHTML = '<div class="profile-bundle">' + FEATURES.map(f => `<div><span>${esc(f.short)}</span>${esc(demo.rounds[0].profiles[0][f.key])}</div>`).join('') + '</div>';
    } else if (step === 1) {
      host.innerHTML = `<h3 class="visual-title">Keine Zusammenarbeit</h3><div class="method-fraction"><span class="fraction"><span>${number(count.selected)} gewählte Profile</span><span>${number(count.profiles)} Profile mit dieser Position</span></span><span>=</span></div><div class="method-big">${percent(count.mean)}</div><p class="method-visual-label">Marginal Mean der Auswahlwahrscheinlichkeit</p>`;
    } else {
      drawChart(host, selectEstimates());
      if (step === 2) { host.querySelectorAll('circle').forEach(c => c.setAttribute('r', '5')); host.querySelectorAll('line').forEach(line => { if (line.getAttribute('stroke') === '#005aa9') line.setAttribute('opacity', '0'); }); }
    }
    $('#method-caption').textContent = captions[step];
  }
  function renderReflection() {
    $('#personal-reflection').innerHTML = state.prediction ? `<p><strong>Ihre Erwartung zu Beginn:</strong> ${esc(state.prediction)}</p><p>Hat sich Ihre Erklärung verändert? Formulieren Sie einen Befund und eine Grenze dessen, was Sie daraus schließen können.</p>` : '<p><strong>Für die Diskussion:</strong> Formulieren Sie einen Befund und eine Grenze dessen, was Sie daraus schließen können. Welche zusätzliche Untersuchung bräuchte eine Prognose realer Wahlwechsel?</p>';
  }

  function setupObservers() {
    function activate(attr, render) {
      const entries = $$('[' + attr + ']');
      const observer = new IntersectionObserver(changes => {
        const visible = changes.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        const current = visible[0].target;
        entries.forEach(step => step.classList.toggle('active', step === current));
        render(current.getAttribute(attr));
      }, { rootMargin: '-33% 0px -35% 0px', threshold: [0, .15, .5] });
      entries.forEach(step => observer.observe(step));
    }
    activate('data-context', v => renderContext(Number(v)));
    activate('data-method', v => renderMethod(Number(v)));
    activate('data-result', renderResult);
    const chapters = $$('.chapter-links a');
    const observer = new IntersectionObserver(entries => {
      entries.filter(e => e.isIntersecting).forEach(entry => { chapters.forEach(a => a.classList.toggle('active', a.hash === '#' + entry.target.id)); });
    }, { rootMargin: '-10% 0px -65% 0px' });
    chapters.forEach(a => { const section = document.querySelector(a.hash); if (section) observer.observe(section); a.addEventListener('click', e => { if (!state.unlocked && ['#daten', '#methode', '#ergebnisse', '#reflexion'].includes(a.hash)) { e.preventDefault(); $('#analysis-gate').scrollIntoView({ behavior: 'smooth' }); } }); });
    let ticking = false;
    window.addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { const max = document.documentElement.scrollHeight - innerHeight; $('#reading-progress').style.width = (max > 0 ? scrollY / max * 100 : 0) + '%'; ticking = false; }); }, { passive: true });
    $$('.scrolly').forEach(el => el.classList.add('mobile-sticky'));
  }

  const QUIZ = [
    { q: 'Ein Marginal Mean von 60 % bedeutet …', choices: ['60 % der Bevölkerung stimmen der Position zu.', 'Profile mit dieser Ausprägung werden im Paarvergleich im Mittel zu 60 % gewählt.', 'Die CDU erhält mit dieser Position 60 % der Stimmen.'], correct: 1, explanation: 'Der Nenner sind Profile mit dieser Ausprägung, nicht Personen mit einer Ja-Nein-Antwort zur Position. Ausgemittelt wird über andere Merkmale und Gegenprofile.' },
    { q: 'Warum werden die Konfidenzintervalle nach Person geclustert?', choices: ['Weil sechs Profilzeilen derselben Person voneinander abhängig sein können.', 'Weil alle Profile einer Partei angehören.', 'Weil sonst keine Prozentwerte berechnet werden können.'], correct: 0, explanation: 'Die wiederholten Antworten einer Person sind keine unabhängigen Befragungen. Das muss die Unsicherheitsschätzung berücksichtigen.' },
    { q: 'Der Vergleich zwischen Menschen mit und ohne Zustimmung zur Normalbehandlung der AfD zeigt …', choices: ['den kausalen Effekt einer Einstellungsänderung bei derselben Person.', 'wie viele Menschen bei der nächsten Wahl zur CDU wechseln.', 'Unterschiede zwischen gemessenen Einstellungsgruppen; die Einstellung wurde nicht zufällig zugewiesen.'], correct: 2, explanation: 'Die Profilmerkmale werden randomisiert, die Einstellungen der Befragten werden gemessen. Das Experiment identifiziert keine kausale Wirkung einer Einstellungsänderung.' }
  ];
  function renderQuiz() {
    $('#knowledge-check').innerHTML = QUIZ.map((q, i) => `<div class="quiz-item"><fieldset><legend>${i + 1}. ${esc(q.q)}</legend>${q.choices.map((choice, j) => `<label><input type="radio" name="quiz-${i}" value="${j}"><span>${esc(choice)}</span></label>`).join('')}</fieldset><div id="feedback-${i}" class="quiz-feedback" role="status" hidden></div></div>`).join('');
    $('#knowledge-check').addEventListener('change', event => { const i = Number(event.target.name.split('-')[1]); const q = QUIZ[i]; const feedback = $('#feedback-' + i); feedback.hidden = false; feedback.textContent = (Number(event.target.value) === q.correct ? 'Genau. ' : 'Schauen Sie noch einmal auf die Unterscheidung: ') + q.explanation; });
  }
  function resetAnswers() {
    const keepUnlocked = state.unlocked;
    state = makeState(); state.unlocked = keepUnlocked; save(); $('#prediction').value = ''; showStage(); renderData(); renderReflection();
    $('#reset-status').textContent = 'Ihre Antworten und die bisherigen Profile wurden zurückgesetzt. Für einen neuen Durchlauf wurden neue Profile gezogen. Die Erklärung bleibt geöffnet.';
    // Der bereits geöffnete Lesepfad bleibt unabhängig von den Antworten verfügbar.
  }
  $('#skip-survey').addEventListener('click', () => unlock());
  $('#unlock-analysis').addEventListener('click', () => unlock());
  $('#reset-answers').addEventListener('click', resetAnswers);
  $('#prediction').value = state.prediction;
  $('#prediction').addEventListener('change', event => { state.prediction = event.target.value; save(); renderReflection(); });
  $('#download-own').addEventListener('click', () => { const { rows, own } = currentRows(); download(own ? 'meine-conjoint-antworten.csv' : 'fiktives-conjoint-lehrbeispiel.csv', toCSV(rows), 'text/csv;charset=utf-8'); });
  $('#download-aggregates').addEventListener('click', () => download('cordon-dilemma-studienaggregate.json', JSON.stringify(STUDY, null, 2), 'application/json'));
  $('#explore-feature').innerHTML = options(FEATURES.map(f => [f.key, f.short]), 'cj_afdtreatment');
  $('#explore-group').innerHTML = options(Object.entries(GROUPS), 'all');
  $('#motive-group').innerHTML = options(Object.entries(GROUPS).filter(([k]) => k !== 'all'), 'cdu');
  $('#agreement-item').innerHTML = options(ITEMS.map(i => [i.key, i.text]), 'coalpref1_afdnormalparty');
  $('#agreement-legend').innerHTML = AGREEMENT.map((label, i) => `<span><i style="background:${AGREE_COLORS[i]}"></i>${esc(label)}</span>`).join('');
  ['#explore-feature', '#explore-group', '#explore-outcome'].forEach(id => $(id).addEventListener('change', renderExplorer));
  $('#agreement-item').addEventListener('change', renderAgreement);
  ['#motive-group', '#motive-kind', '#motive-region'].forEach(id => $(id).addEventListener('change', renderMotivation));
  $$('.dot-cloud').forEach(cloud => { cloud.innerHTML = '<i></i>'.repeat(30); });
  $('#provenance').textContent = `Aggregate berechnet am ${STUDY.meta.generated}; R ${STUDY.meta.software.R}, cregg ${STUDY.meta.software.cregg}. Datenbereinigung und Prüfsummen sind im JSON dokumentiert. Lokale Quelldaten bleiben außerhalb dieses Projekts.`;
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderAllCharts, 150); });
  showStage(); renderData(); renderContext(); renderMethod(); renderReflection(); renderQuiz(); setupObservers();
  if (state.unlocked) unlock(false);
})();
