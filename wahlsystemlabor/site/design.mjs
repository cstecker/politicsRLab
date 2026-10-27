// Design nach Jankowski/Linhart/Tepe 2019, Tabelle 1, S. 230.
// Erläuterungen sind eigene, vereinfachte Lehrtexte; kein identischer Fragebogen.
export const VERSION = 'jlt2019-teaching-v1';
export const TASKS = 5;
export const ATTRIBUTES = [
  { id: 'parties', label: 'Chancenreiche Parteien', short: 'Parteienvielfalt', baseline: 2,
    levels: ['kleinste, kleine und größere', 'kleine und größere', 'nur größere'],
    help: 'Welche Parteien haben realistische Chancen, ins Parlament einzuziehen? Die Kategorien bezeichnen relative Parteigrößen; sie sind keine konkrete Sperrklausel.' },
  { id: 'majorities', label: 'Klare Mehrheitsverhältnisse', short: 'Klare Mehrheiten', baseline: 0,
    levels: ['sehr unwahrscheinlich', 'eher unwahrscheinlich', 'eher wahrscheinlich', 'sehr wahrscheinlich'],
    help: 'Wie wahrscheinlich entsteht im Parlament eine klare Mehrheit, die eine Regierungsbildung erleichtert?' },
  { id: 'acceptance', label: 'Gesellschaftliche Akzeptanz', short: 'Akzeptanz', baseline: 0,
    levels: ['geteilt', 'hoch', 'sehr hoch'],
    help: 'Wie breit wird das Wahlsystem in der Gesellschaft akzeptiert?' },
  { id: 'proportionality', label: 'Gleichheit von Stimmen- und Sitzanteil', short: 'Stimmen und Sitze', baseline: 0,
    levels: ['nicht garantiert', 'nur bedingt garantiert', 'weitgehend garantiert', 'immer garantiert'],
    help: 'Entsprechen die Sitzanteile der Parteien ihren Stimmenanteilen? Bei 30 % der Stimmen wären ungefähr 30 % der Sitze proportional.' },
  { id: 'candidates', label: 'Einfluss auf Kandidaten', short: 'Kandidatenauswahl', baseline: 0,
    levels: ['nur auf Parteien', 'auf Parteien und Kandidaten'],
    help: 'Können Wählerinnen und Wähler neben einer Partei auch beeinflussen, welche Personen ins Parlament gelangen?' },
  { id: 'simplicity', label: 'Verständlichkeit', short: 'Verständlichkeit', baseline: 0,
    levels: ['sehr komplex', 'in Teilen komplex', 'weitgehend einfach', 'einfach'],
    help: 'Wie leicht lässt sich nachvollziehen, wie Stimmen abgegeben und in Parlamentssitze übersetzt werden?' },
];

export function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function profile(rng) {
  return Object.fromEntries(ATTRIBUTES.map(a => [a.id, Math.floor(rng() * a.levels.length)]));
}

export function createSession(seed, id) {
  const rng = random(seed);
  const order = ATTRIBUTES.map(a => a.id);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { version: VERSION, seed: seed >>> 0, id, order,
    tasks: Array.from({ length: TASKS }, () => ({ profiles: [profile(rng), profile(rng)], choice: null })) };
}

export function validSession(session) {
  return session?.version === VERSION && Number.isInteger(session.seed) &&
    typeof session.id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(session.id) &&
    Array.isArray(session.order) && session.order.length === ATTRIBUTES.length &&
    new Set(session.order).size === ATTRIBUTES.length && session.order.every(id => ATTRIBUTES.some(a => a.id === id)) &&
    Array.isArray(session.tasks) && session.tasks.length === TASKS && session.tasks.every(t =>
      [null, 0, 1].includes(t.choice) && t.profiles?.length === 2 && t.profiles.every(p =>
        ATTRIBUTES.every(a => Number.isInteger(p[a.id]) && p[a.id] >= 0 && p[a.id] < a.levels.length)));
}

export function sessionRows(session, source = 'local_test') {
  if (!validSession(session)) throw new Error('Ungültige Experimentdaten.');
  return session.tasks.flatMap((t, i) => t.choice === null ? [] : t.profiles.map((p, side) => ({
    source, design_version: VERSION, respondent: session.id, seed: session.seed,
    task: i + 1, profile: side === 0 ? 'A' : 'B', chosen: Number(side === t.choice),
    attribute_order: session.order.join('|'), ...p,
  })));
}

// Bewusst illustrative Nutzenfunktionen; keine geschätzten Originalparameter.
export const SCENARIOS = {
  proportionality: { label: 'Stimmen-Sitz-Gleichheit zählt besonders', weights: [0.18, 0.18, 0.25, 1.35, 0.25, 0.22] },
  majorities: { label: 'Klare Mehrheiten zählen besonders', weights: [0.18, 1.35, 0.25, 0.18, 0.25, 0.22] },
  null: { label: 'Alle Entscheidungen sind zufällig', weights: [0, 0, 0, 0, 0, 0] },
};

export function simulate(n = 150, seed = 2026, scenario = 'proportionality') {
  if (!Number.isInteger(n) || n < 1 || n > 1000 || !SCENARIOS[scenario]) throw new Error('Ungültige Simulation.');
  const rng = random(seed);
  const weights = SCENARIOS[scenario].weights;
  const utility = p => ATTRIBUTES.reduce((s, a, i) => {
    const value = a.id === 'parties' ? [0.65, 1, 0][p[a.id]] : p[a.id] / (a.levels.length - 1);
    return s + value * weights[i];
  }, 0);
  return Array.from({ length: n }, (_, i) => {
    const session = createSession(Math.floor(rng() * 4294967296), `sim_${i + 1}`);
    for (const t of session.tasks) {
      const probability = 1 / (1 + Math.exp(-(utility(t.profiles[0]) - utility(t.profiles[1]))));
      t.choice = rng() < probability ? 0 : 1;
    }
    return sessionRows(session, `simulation_${scenario}`);
  }).flat();
}

export function toCSV(rows) {
  const columns = ['source', 'design_version', 'respondent', 'seed', 'task', 'profile', 'chosen', 'attribute_order', ...ATTRIBUTES.map(a => a.id)];
  const quote = v => `"${String(v).replaceAll('"', '""')}"`;
  return '\uFEFF' + [columns.join(','), ...rows.map(row => columns.map(c => quote(row[c])).join(','))].join('\r\n') + '\r\n';
}
