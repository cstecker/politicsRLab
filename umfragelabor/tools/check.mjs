import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const S=require('../site/stats.js');
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol, a+' != '+b);
for(const gap of [-10,0,2,9,20]) {
  const p=S.population(gap);
  close(p.reduce((a,b)=>a+b,0),1);
  close((p[0]-p[1])*100,gap);
  assert.deepEqual(p.map(x=>Math.round(x*10000)).reduce((a,b)=>a+b,0),10000);
}
assert.deepEqual(S.sample([0,1,0],50,S.random(12)),[0,50,0]);
const p=S.population();
assert.deepEqual(p,[.23,.14,.13,.03,.11,.26,.10]);
assert.equal(S.PARTIES[0].name,'CDU/CSU');
assert.equal(S.POLL.id,'fgw-2026-10-23');
assert.equal(S.POLL.sampleSize,1225);
const sample=S.sample(p,200,S.random(123));
assert.equal(sample.reduce((a,b)=>a+b,0),200);
assert.equal(sample.length,7);
assert.deepEqual(S.simulate(p,200,100,123),S.simulate(p,200,100,123));
assert.notDeepEqual(S.simulate(p,200,100,123),S.simulate(p,200,100,124));
// Published Wilson example: NIST TN 2119, 17 successes out of 20, 95% ~[.64,.95].
const interval=S.wilson(17,20);
close(interval[0],.639581135259243,1e-12);
close(interval[1],.947631254103783,1e-12);
for(const n of [50,200,1000,5000])for(const count of [0,1,Math.floor(n/2),n-1,n]){
  const [lo,hi]=S.wilson(count,n);
  assert.ok(lo>=0 && hi<=1 && lo<=hi);
  assert.ok(lo<=count/n+1e-12 && hi>=count/n-1e-12);
  assert.ok(S.wilson(count,n,99)[1]-S.wilson(count,n,99)[0]>S.wilson(count,n,90)[1]-S.wilson(count,n,90)[0]);
}
const d=S.difference(62,42,200);
close(d.estimate,.1);
close(d.se,Math.sqrt(.51/200));
close(S.difference(42,62,200).lower,-d.upper);
assert.equal(S.difference(1,2,50).reliable,false);
for(const n of [100,400]){
  const rows=S.simulate(p,n,12000,321);
  assert.ok(rows.every(c=>c.reduce((a,b)=>a+b,0)===n));
  for(const party of [0,4]){
    const values=rows.map(c=>c[party]/n),summary=S.summary(values),theory=Math.sqrt(p[party]*(1-p[party])/n);
    assert.ok(Math.abs(summary.mean-p[party])<theory*.04,'Monte-Carlo mean');
    assert.ok(Math.abs(summary.sd/theory-1)<.04,'Monte-Carlo SD');
    const coverage=rows.filter(c=>{const [lo,hi]=S.wilson(c[party],n);return lo<=p[party]&&hi>=p[party];}).length/rows.length;
    assert.ok(coverage>.92 && coverage<.98,'Wilson coverage '+coverage);
    console.log('n='+n+', p='+p[party]+': SD='+summary.sd.toFixed(4)+', theory='+theory.toFixed(4)+', coverage='+coverage.toFixed(4));
  }
}
assert.throws(()=>S.sample([.5,.6],100,S.random(1)));
assert.throws(()=>S.wilson(-1,100));
console.log('Statistikprüfung erfolgreich.');
