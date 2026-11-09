/* Simulationskern: keine DOM-Abhängigkeit, im Browser und in Node verwendbar. */
(function (scope) {
  'use strict';
  const PARTIES = [
    { name: 'CDU/CSU', color: '#222222' }, { name: 'SPD', color: '#c5313b' },
    { name: 'Grüne', color: '#398345' }, { name: 'FDP', color: '#b18b00' },
    { name: 'LINKE', color: '#a52e83' }, { name: 'AfD', color: '#2687bb' },
    { name: 'Sonstige', color: '#7a858e' }
  ];
  const POLL = {
    id: 'fgw-2026-10-23', date: '23.10.2026', sampleSize: 1225, defaultGap: 9,
    percentages: [23, 14, 13, 3, 11, 26, 10],
    url: 'https://www.forschungsgruppe.de/Umfragen/Politbarometer/Archiv/Politbarometer_2026/Oktober_II_2026/'
  };
  const Z = { 90: 1.6448536269514722, 95: 1.959963984540054, 99: 2.5758293035489004 };
  function random(seed) {
    let state = seed >>> 0;
    return function () {
      state += 0x6D2B79F5;
      let t = state;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function population(gap = POLL.defaultGap) {
    if (!Number.isFinite(gap) || gap < -10 || gap > 20) throw new RangeError('Abstand außerhalb des Lehrbereichs.');
    const pairTotal = POLL.percentages[0] + POLL.percentages[1];
    return [(pairTotal + gap) / 200, (pairTotal - gap) / 200, ...POLL.percentages.slice(2).map(p => p / 100)];
  }
  function sample(probs, n, rng) {
    if (!Number.isInteger(n) || n < 1) throw new RangeError('n muss eine positive ganze Zahl sein.');
    if (probs.some(p => !Number.isFinite(p) || p < 0) || Math.abs(probs.reduce((a,b) => a+b,0)-1) > 1e-10) throw new RangeError('Ungültige Wahrscheinlichkeiten.');
    const cumulative = probs.map((_,i) => probs.slice(0,i+1).reduce((a,b)=>a+b,0));
    const counts = probs.map(() => 0);
    for (let i=0; i<n; i++) {
      const u = rng();
      let k = 0;
      while (k < cumulative.length-1 && u >= cumulative[k]) k++;
      counts[k]++;
    }
    return counts;
  }
  function simulate(probs, n, repetitions, seed) {
    const rng = random(seed);
    return Array.from({length:repetitions}, () => sample(probs,n,rng));
  }
  function wilson(count, n, confidence = 95) {
    if (!Number.isInteger(count) || count < 0 || count > n || !Number.isInteger(n) || n<1 || !Z[confidence]) throw new RangeError('Ungültige Intervallparameter.');
    const p=count/n, z=Z[confidence], denominator=1+z*z/n;
    const center=(p+z*z/(2*n))/denominator;
    const half=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/denominator;
    return [Math.max(0,center-half),Math.min(1,center+half)];
  }
  function difference(a,b,n,confidence=95) {
    const d=(a-b)/n;
    // Multinomial: Cov(p_A,p_B)=-p_A*p_B/n. Beide Anteile stammen aus derselben Umfrage.
    const se=Math.sqrt(Math.max(0,(a/n+b/n-d*d)/n));
    return { estimate:d, se, lower:Math.max(-1,d-Z[confidence]*se), upper:Math.min(1,d+Z[confidence]*se), reliable:Math.min(a,b,n-a,n-b)>=10 };
  }
  function quantile(values,p) {
    const sorted=[...values].sort((a,b)=>a-b), index=(sorted.length-1)*p;
    const lo=Math.floor(index), weight=index-lo;
    return sorted[lo]+(sorted[Math.ceil(index)]-sorted[lo])*weight;
  }
  function summary(values) {
    const mean=values.reduce((a,b)=>a+b,0)/values.length;
    const sd=values.length>1?Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/(values.length-1)):0;
    return {mean,sd,lower:quantile(values,.025),upper:quantile(values,.975)};
  }
  const api={PARTIES,POLL,Z,random,population,sample,simulate,wilson,difference,quantile,summary};
  if (typeof module !== 'undefined' && module.exports) module.exports=api;
  else scope.PollStats=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
