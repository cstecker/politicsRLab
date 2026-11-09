/* Darstellung und Bedienung; Statistik getrennt in stats.js. */
(() => {
  'use strict';
  const S=PollStats, $=id=>document.getElementById(id);
  const fmt=(x,d=1)=>x.toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d});
  const pct=x=>fmt(x*100)+' %', pp=x=>fmt(x*100)+' PP';
  const LESSONS=['Grundgesamtheit','Eine Stichprobe','Viele Stichproben','Konfidenzintervalle','Wer liegt vorn'];
  const state={step:0,n:200,reps:100,focus:0,confidence:95,gap:10,seed:123,singleRun:0,batchRun:0,compare:1,all:false,zoom:false,answers:{}};
  let probs, single, batches;
  function calculate() {
    probs=S.population(state.gap);
    single=S.sample(probs,state.n,S.random((state.seed+Math.imul(state.singleRun+1,2654435761))>>>0));
    batches=S.simulate(probs,state.n,state.reps,(state.seed+Math.imul(state.batchRun+1,2246822519))>>>0);
  }
  function size(){return Math.max(240,Math.min(850,$('lesson').clientWidth-(window.innerWidth<=720?32:56)));}
  function svg(content,w,h,label){return '<svg class="chart" role="img" aria-label="'+label+'" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'">'+content+'</svg>';}
  function text(x,y,value,cls='',anchor='start'){return '<text x="'+x+'" y="'+y+'" class="'+cls+'" text-anchor="'+anchor+'">'+value+'</text>';}
  function line(x1,y1,x2,y2,cls){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="'+cls+'"/>';}
  function axesX(w,h,left,right,top,bottom,domain=[0,1],ticks=[0,.25,.5,.75,1],unit='%') {
    const x=v=>left+(v-domain[0])/(domain[1]-domain[0])*(w-left-right);
    let out='';
    ticks.forEach(v=>{out+=line(x(v),top,x(v),h-bottom,'grid')+text(x(v),h-bottom+22,fmt(v*100,domain[1]-domain[0]<.2?1:0)+(unit==='%'?' %':''),'','middle');});
    return {x,out};
  }
  function barChart(withSample=false) {
    const w=size(), h=330, left=68,right=48,top=12,bottom=36;
    const a=axesX(w,h,left,right,top,bottom);
    let out=a.out;
    probs.forEach((p,i)=>{
      const y=top+17+i*39, color=S.PARTIES[i].color;
      out+=text(left-10,y+4,S.PARTIES[i].name,'strong','end');
      if(withSample){
        out+='<rect x="'+left+'" y="'+(y-11)+'" width="'+(a.x(p)-left)+'" height="9" fill="#c5ced6"/>';
        const v=single[i]/state.n;
        out+='<rect x="'+left+'" y="'+(y+1)+'" width="'+(a.x(v)-left)+'" height="9" fill="'+color+'"/>';
        out+=text(Math.max(a.x(p),a.x(v))+7,y+7,fmt(v*100),'strong');
      }else{
        out+='<rect x="'+left+'" y="'+(y-9)+'" width="'+(a.x(p)-left)+'" height="18" rx="2" fill="'+color+'"/>';
        out+=text(a.x(p)+7,y+4,fmt(p*100),'strong');
      }
    });
    return svg(out,w,h,withSample?'Parteianteile der aktuellen Stichprobe im Vergleich mit der Grundgesamtheit; Werte in der Datentabelle.':'Fiktive Parteianteile in der Grundgesamtheit; Werte in der Datentabelle.');
  }
  function focusDomain(focus,withIntervals=false) {
    if(!state.zoom)return [0,1];
    const values=batches.flatMap(c=>withIntervals?S.wilson(c[focus],state.n,state.confidence):[c[focus]/state.n]);
    const low=Math.min(probs[focus],...values),high=Math.max(probs[focus],...values);
    const margin=Math.max(.015,(high-low)*.08);
    return [Math.max(0,Math.floor((low-margin)*100)/100),Math.min(1,Math.ceil((high+margin)*100)/100)];
  }
  function ticks(domain){return Array.from({length:5},(_,i)=>domain[0]+i*(domain[1]-domain[0])/4);}
  function zoomControl(){return '<div class="actions"><button data-action="zoom" aria-pressed="'+state.zoom+'">'+(state.zoom?'Feste Skala 0–100 % zeigen':'Schwankungen vergrößern')+'</button><small>'+(state.zoom?'Vergrößerte Ansicht: Achsengrenzen passen sich an die Daten an.':'Feste Achsen: Größenordnungen bleiben vergleichbar.')+'</small></div>';}
  function scatter(focus,width=size(),height=240,forceFull=false) {
    const w=width,h=height,left=64,right=22,top=16,bottom=35;
    const domain=forceFull?[0,1]:focusDomain(focus), x=i=>left+i/Math.max(1,state.reps-1)*(w-left-right), y=v=>top+(domain[1]-v)/(domain[1]-domain[0])*(h-top-bottom);
    let out='';
    ticks(domain).forEach(v=>out+=line(left,y(v),w-right,y(v),'grid')+text(left-8,y(v)+4,fmt(v*100,domain[1]-domain[0]<.2?1:0)+' %','','end'));
    [0,Math.floor((state.reps-1)/2),state.reps-1].forEach(i=>out+=text(x(i),h-12,String(i+1),'','middle'));
    out+=line(left,y(probs[focus]),w-right,y(probs[focus]),'truth');
    batches.forEach((counts,i)=>out+='<circle cx="'+x(i)+'" cy="'+y(counts[focus]/state.n)+'" r="'+(state.reps>500?1.6:2.3)+'" fill="'+S.PARTIES[focus].color+'" opacity=".6"/>');
    return svg(out,w,h,'Stichprobenanteile für '+S.PARTIES[focus].name+' über '+state.reps+' Umfragen. Waagerechte gestrichelte Linie: wahrer Anteil '+pct(probs[focus])+'. X-Achse: Nummer der Umfrage; Y-Achse: Stimmenanteil.');
  }
  function histogram(focus) {
    const w=size(),h=205,left=44,right=32,top=15,bottom=39;
    const domain=focusDomain(focus), bins=Array(50).fill(0),span=domain[1]-domain[0];
    batches.forEach(c=>bins[Math.min(49,Math.max(0,Math.floor((c[focus]/state.n-domain[0])/span*50)))]++);
    const a=axesX(w,h,left,right,top,bottom,domain,ticks(domain)), max=Math.max(...bins,1), plotH=h-top-bottom;
    let out=a.out;
    bins.forEach((v,i)=>{if(v)out+='<rect x="'+(a.x(domain[0]+i/50*span)+.5)+'" y="'+(h-bottom-v/max*plotH)+'" width="'+Math.max(.5,(w-left-right)/50-1)+'" height="'+(v/max*plotH)+'" fill="'+S.PARTIES[focus].color+'" opacity=".65"><title>'+fmt((domain[0]+i/50*span)*100,1)+' bis '+fmt((domain[0]+(i+1)/50*span)*100,1)+' %: '+v+' Umfragen</title></rect>';});
    out+=line(a.x(probs[focus]),top,a.x(probs[focus]),h-bottom,'truth');

    return svg(out,w,h,'Häufigkeit der simulierten '+S.PARTIES[focus].name+'-Anteile in Klassen von '+fmt(span*2,2)+' Prozentpunkten.');
  }
  function intervalPlot() {
    const w=size(), shown=batches.slice(0,50),h=shown.length*7+58,left=36,right=22,top=14,bottom=36;
    const domain=focusDomain(state.focus,true), a=axesX(w,h,left,right,top,bottom,domain,ticks(domain));
    let out=a.out+line(a.x(probs[state.focus]),top,a.x(probs[state.focus]),h-bottom,'truth');
    shown.forEach((counts,i)=>{
      const [lo,hi]=S.wilson(counts[state.focus],state.n,state.confidence), cover=lo<=probs[state.focus]&&hi>=probs[state.focus], y=top+5+i*7;
      const color=cover?'#687f92':'#c14d20';
      out+='<line x1="'+a.x(lo)+'" x2="'+a.x(hi)+'" y1="'+y+'" y2="'+y+'" stroke="'+color+'" stroke-width="'+(cover?1.4:2.5)+'" '+(cover?'':'stroke-dasharray="3 2"')+'/>';
      out+='<circle cx="'+a.x(counts[state.focus]/state.n)+'" cy="'+y+'" r="1.7" fill="'+color+'"/>';
    });
    return svg(out,w,h,'Die ersten '+shown.length+' Konfidenzintervalle für '+S.PARTIES[state.focus].name+'. Gestrichelte orange Intervalle verfehlen den wahren Anteil. Jede Zeile ist eine andere Umfrage.');
  }
  function partyIntervalsChart() {
    const w=size(),h=155,left=68,right=23,top=10,bottom=38;
    const axes=axesX(w,h,left,right,top,bottom);
    let out=axes.out;
    [state.focus,state.compare].forEach((party,i)=>{
      const y=top+26+i*54,interval=S.wilson(single[party],state.n,state.confidence),color=S.PARTIES[party].color;
      out+=text(left-10,y+4,S.PARTIES[party].name,'strong','end');
      out+='<line x1="'+axes.x(interval[0])+'" x2="'+axes.x(interval[1])+'" y1="'+y+'" y2="'+y+'" stroke="'+color+'" stroke-width="4"/><circle cx="'+axes.x(single[party]/state.n)+'" cy="'+y+'" r="5" fill="'+color+'"/>';
    });
    return svg(out,w,h,'Einzelne Wilson-Konfidenzintervalle der beiden Parteien auf einer gemeinsamen Skala von 0 bis 100 Prozent.');
  }
  function comparisonChart(result) {
    const w=size(),h=170,left=40,right=30,top=30,bottom=45;
    // Symmetrische, feste Skala: Vergleiche über Stichprobengrößen bleiben lesbar.
    const a=axesX(w,h,left,right,top,bottom,[-1,1],[-1,-.5,0,.5,1],'PP');
    let out=a.out+line(a.x(0),top,a.x(0),h-bottom,'axis');
    out+=line(a.x(probs[state.focus]-probs[state.compare]),top,a.x(probs[state.focus]-probs[state.compare]),h-bottom,'truth');
    out+='<line x1="'+a.x(result.lower)+'" x2="'+a.x(result.upper)+'" y1="76" y2="76" stroke="#005aa9" stroke-width="5" stroke-linecap="round"/><circle cx="'+a.x(result.estimate)+'" cy="76" r="6" fill="#005aa9"/>';
    out+=text(w/2,h-5,'Abstand in Prozentpunkten','','middle');
    return svg(out,w,h,'Geschätzter Abstand '+pp(result.estimate)+', '+state.confidence+'%-Intervall von '+pp(result.lower)+' bis '+pp(result.upper)+'. Null bedeutet Gleichstand.');
  }
  function metrics(items){return '<div class="metrics">'+items.map(([value,label])=>'<div class="metric"><strong>'+value+'</strong><span>'+label+'</span></div>').join('')+'</div>';}
  function insight(copy){return '<div class="insight"><p>'+copy+'</p></div>';}
  function task(copy){return '<p class="task"><strong>Probieren Sie es aus:</strong> '+copy+'</p>';}
  function singleAction(){return '<div class="actions"><button class="primary" data-action="single">Neue Stichprobe ziehen ↻</button><small>Ziehung '+(state.singleRun+1)+' · n = '+fmt(state.n,0)+'</small></div>';}
  function batchAction(){return '<div class="actions"><button class="primary" data-action="batch">Alle Umfragen neu simulieren ↻</button><small>Serie '+(state.batchRun+1)+' · '+fmt(state.reps,0)+' × '+fmt(state.n,0)+' Befragte</small></div>';}
  function dataTable(many=false) {
    let headers,rows;
    if(many){headers=['Umfrage',...S.PARTIES.map(p=>p.name+' (%)')]; rows=batches.map((c,i)=>[i+1,...c.map(v=>fmt(v/state.n*100))]);}
    else{headers=['Partei','Wahrer Anteil','Personen von 10.000',...(state.step===0?[]:['Befragte','Umfrage','Abweichung (PP)'])]; rows=probs.map((p,i)=>[S.PARTIES[i].name,pct(p),fmt(Math.round(p*10000),0),...(state.step===0?[]:[single[i],pct(single[i]/state.n),fmt((single[i]/state.n-p)*100)])]);}
    return '<details class="data"><summary>Werte als Tabelle &amp; CSV</summary><div class="data-actions"><button data-action="csv">Simulationsdaten herunterladen ↓</button><span>Alle sieben Parteien, auch bei null Nennungen</span></div><div class="table-wrap"><table><thead><tr>'+headers.map(x=>'<th scope="col">'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map((x,i)=>(i===0?'<th scope="row">':'<td>')+x+(i===0?'</th>':'</td>')).join('')+'</tr>').join('')+'</tbody></table></div></details>';
  }
  const quizzes=[
    {q:'Warum kennen wir hier den wahren Anteil?',options:['Weil eine große Umfrage immer recht hat.','Weil wir die Wählerschaft selbst festgelegt haben.'],correct:1,feedback:'Im Experiment kennen wir die Grundgesamtheit. Bei einer echten Umfrage bleibt der gesuchte Anteil unbekannt.'},
    {q:'Zwei Zufallsstichproben liefern verschiedene Werte. Ist das schon ein Fehler der Durchführung?',options:['Ja, eine Umfrage muss falsch durchgeführt sein.','Nein, das kann allein durch Zufall entstehen.'],correct:1,feedback:'Auch korrekt gezogene Zufallsstichproben schwanken. Die Grundgesamtheit muss sich dafür nicht ändern.'},
    {q:'Was halbiert den Standardfehler ungefähr?',options:['Doppelt so viele Befragte je Umfrage.','Viermal so viele Befragte je Umfrage.','Viermal so viele simulierte Umfragen.'],correct:1,feedback:'Der Standardfehler sinkt mit 1/√n. Viermal so viele Befragte halbieren ihn; mehr Wiederholungen zeigen das Muster nur genauer.'},
    {q:'Wofür stehen 95 % beim Konfidenzintervall?',options:['Für den langfristigen Anteil der Intervalle, die den wahren Wert abdecken.','Für die Wahrscheinlichkeit, dass der feste wahre Wert in genau diesem fertigen Intervall liegt.'],correct:0,feedback:'Bei wiederholten Zufallsstichproben deckt dieses Verfahren den festen Populationswert ungefähr in 95 % der Fälle ab. Das einzelne Intervall trifft ihn oder verfehlt ihn.'},
    {q:'Zwei Parteiintervalle überlappen. Reicht das als Test auf einen Unterschied?',options:['Ja, Überlappung bedeutet automatisch keinen Unterschied.','Nein, wir brauchen das Intervall des direkten Abstands.'],correct:1,feedback:'Der direkte Vergleich muss die gemeinsame Stichprobe berücksichtigen. Die beiden Anteile sind voneinander abhängig.'}
  ];
  function quiz(){const q=quizzes[state.step],answer=state.answers[state.step]; return '<div class="quiz"><p>Gedankencheck: '+q.q+'</p><div class="quiz-options">'+q.options.map((o,i)=>'<button data-answer="'+i+'" aria-pressed="'+(answer===i)+'">'+o+'</button>').join('')+'</div>'+(answer===undefined?'':'<p class="feedback" role="status">'+(answer===q.correct?'Richtig. ':'Noch einmal nachdenken. ')+q.feedback+'</p>')+'</div>';}
  function render(focusHeading=false) {
    $('n-out').value=fmt(state.n,0); $('gap-out').value=fmt(state.gap,0)+' Prozentpunkte';
    document.querySelectorAll('[data-step]').forEach(b=>{if(+b.dataset.step===state.step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    document.querySelectorAll('[data-n]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.n===state.n));
    const party=S.PARTIES[state.focus],values=batches.map(c=>c[state.focus]/state.n),sum=S.summary(values);
    let body='',title=LESSONS[state.step],intro='';
    if(state.step===0){
      intro='Um eine Suppe zu beurteilen, genügt eine gut durchmischte Kostprobe. Für Wahlumfragen ist die Wählerschaft der Topf und die Stichprobe der Löffel. Hier kennen wir ausnahmsweise den ganzen Topf.';
      body='<div class="chart-title"><h3>So wählt unsere fiktive Wählerschaft</h3><span>Stimmenanteil in Prozent</span></div>'+barChart()+metrics([['10.000','Personen zur Veranschaulichung'],['7','Parteien / Kategorien'],['100 %','aller Wahlabsichten']])+insight('Die Balken zeigen die <strong>Grundgesamtheit</strong>. Diese Anteile bleiben bei neuen Ziehungen fest. Nur unter „Wählerschaft & Zufall verändern“ legen Sie eine andere Wählerschaft fest.')+task('Öffnen Sie die Szenario-Einstellungen und wählen Sie „Knappes Rennen“. Wie unterscheiden sich die wahren Anteile von CDU und SPD?')+dataTable();
    }else if(state.step===1){
      intro='Wir ziehen '+fmt(state.n,0)+' Mal zufällig eine Person. Alle haben dieselbe Auswahlchance. Die farbigen Balken zeigen, welche Wahlabsichten in dieser Stichprobe landen.';
      const maxError=Math.max(...single.map((v,i)=>Math.abs(v/state.n-probs[i]))),p=single[state.focus]/state.n;
      body=singleAction()+'<div class="legend"><span><i style="--swatch:#c5ced6"></i>Grundgesamtheit</span><span><i style="--swatch:#005aa9"></i>Stichprobe in Parteifarben</span></div>'+barChart(true)+metrics([[pct(p),party.name+' in der Stichprobe'],[pct(probs[state.focus]),party.name+' in der Grundgesamtheit'],[pp(maxError),'größte absolute Abweichung']])+insight('<strong>Neue Umfrage, neue Werte.</strong> Zufällige Abweichungen entstehen auch bei einer korrekt gezogenen Stichprobe. Größere Stichproben liegen im Durchschnitt näher am wahren Anteil – eine einzelne große Stichprobe kann trotzdem einmal weiter danebenliegen.')+task('Ziehen Sie mehrmals neu. Vergleichen Sie anschließend n = 100 mit n = 5.000. Werden die Abweichungen tendenziell kleiner?')+dataTable();
    }else if(state.step===2){
      intro='Eine einzige Umfrage zeigt nur einen möglichen Ausgang. Wir wiederholen dieselbe Befragung '+fmt(state.reps,0)+' Mal. Die Wählerschaft bleibt dabei unverändert.';
      body=batchAction()+zoomControl()+'<div class="chart-title"><h3>'+party.name+': '+fmt(state.reps,0)+' Umfragen</h3><span>Ein Punkt = eine Umfrage · x = Umfragenummer</span></div>'+scatter(state.focus)+'<div class="legend"><span><i class="line"></i>Wahrer Anteil: '+pct(probs[state.focus])+'</span></div><div class="chart-title"><h3>Dieselben Umfragewerte, auf einen Haufen gelegt</h3></div>'+histogram(state.focus)+'<p class="chart-note">Geschätzter Stimmenanteil · Balkenhöhe = Zahl der Umfragen · 50 gleich breite Klassen.</p>'+metrics([[pp(sum.sd),'beobachteter Standardfehler'],[pp(Math.sqrt(probs[state.focus]*(1-probs[state.focus])/state.n)),'theoretischer Standardfehler'],[pct(sum.lower)+'–'+pct(sum.upper),'mittlere 95 % der Simulationen']])+insight('<strong>Viermal so viele Befragte, ungefähr halb so viel Streuung.</strong> Der Standardfehler ist die Streuung der Umfrageanteile. Mehr simulierte Umfragen machen diese Streuung genauer sichtbar; mehr Befragte je Umfrage verringern sie. Der mittlere 95%-Bereich oben beschreibt die simulierten Werte, kein Konfidenzintervall aus einer einzelnen Umfrage.')+task('Wechseln Sie von 200 zu 1.000 Befragten. Vergleichen Sie auch große und kleine Parteien über „Partei im Fokus“.')+'<div class="actions"><button data-action="all">'+(state.all?'Parteienübersicht schließen':'Alle sieben Parteien vergleichen')+'</button></div>'+(state.all?'<div class="mini-charts">'+S.PARTIES.map((p,i)=>'<div><h3>'+p.name+' · wahr '+pct(probs[i])+'</h3>'+scatter(i,window.innerWidth>1000?(size()-18)/2:size(),190,true)+'</div>').join('')+'</div>':'')+dataTable(true);
    }else if(state.step===3){
      intro='Für jede simulierte Umfrage berechnen wir ein '+state.confidence+'%-Konfidenzintervall. Jetzt fragen wir: Wie oft deckt dieses Verfahren den wahren '+party.name+'-Anteil ab?';
      const intervals=batches.map(c=>S.wilson(c[state.focus],state.n,state.confidence));
      const covered=intervals.filter(([lo,hi])=>lo<=probs[state.focus]&&hi>=probs[state.focus]).length;
      const current=S.wilson(single[state.focus],state.n,state.confidence);
      body=batchAction()+zoomControl()+'<div class="chart-title"><h3>'+party.name+': Jedes Intervall gehört zu einer Umfrage</h3><span>Gezeigt: erste '+Math.min(50,state.reps)+' · Auswertung: alle '+state.reps+'</span></div>'+intervalPlot()+'<div class="legend"><span><i class="line"></i>Wahrer Anteil: '+pct(probs[state.focus])+'</span><span><i style="--swatch:#687f92"></i>deckt ihn ab</span><span><i style="--swatch:#c14d20"></i>gestrichelt: verfehlt ihn</span></div>'+metrics([[covered+' / '+state.reps,'Intervalle decken den wahren Anteil ab'],[pct(covered/state.reps),'beobachtete Abdeckung'],[state.confidence+' %','angestrebte langfristige Abdeckung']])+insight('<strong>Das Verfahren trifft langfristig ungefähr '+state.confidence+' % der Zeit.</strong> Der wahre Anteil ist fest; die zufälligen Intervalle wandern. Das ist keine '+state.confidence+'%-Wahrscheinlichkeit für den festen Wert in einem bereits berechneten Intervall. Auch der beobachtete Abdeckungsanteil schwankt von Serie zu Serie.')+'<p class="chart-note">Zur einzelnen Stichprobe aus „Eine Stichprobe“: '+party.name+' = '+pct(single[state.focus]/state.n)+', '+state.confidence+'%-Wilson-Intervall '+pct(current[0])+' bis '+pct(current[1])+'.</p>'+task('Wechseln Sie von 90 % zu 99 %. Was passiert mit der Breite und der Zahl der verfehlten Werte? Erhöhen Sie dann die Zahl simulierter Umfragen.')+dataTable(true);
    }else{
      intro='Zwei Umfragewerte unterscheiden sich fast immer. Ob der Vorsprung über den Zufall hinaus belastbar ist, prüfen wir direkt am Abstand der beiden Parteien aus derselben Umfrage.';
      if(state.compare===state.focus)state.compare=(state.focus+1)%7;
      const other=S.PARTIES[state.compare],d=S.difference(single[state.focus],single[state.compare],state.n,state.confidence), excludes=d.lower>0||d.upper<0;
      const intervalA=S.wilson(single[state.focus],state.n,state.confidence),intervalB=S.wilson(single[state.compare],state.n,state.confidence),overlap=Math.max(intervalA[0],intervalB[0])<=Math.min(intervalA[1],intervalB[1]);
      body='<div class="comparison-controls"><label for="compare">'+party.name+' vergleichen mit</label><select id="compare">'+S.PARTIES.map((p,i)=>i===state.focus?'':'<option value="'+i+'" '+(i===state.compare?'selected':'')+'>'+p.name+'</option>').join('')+'</select><button data-action="close">Knappes Rennen: CDU / SPD</button></div>'+singleAction()+'<div class="chart-title"><h3>Die beiden Parteianteile</h3><span>Stimmenanteil in Prozent · einzelne Wilson-Intervalle</span></div>'+partyIntervalsChart()+'<div class="chart-title"><h3>'+party.name+' minus '+other.name+'</h3><span>Punkt = Schätzung · Balken = '+state.confidence+'%-Intervall</span></div>'+comparisonChart(d)+metrics([[pp(d.estimate),'geschätzter Abstand'],[pp(probs[state.focus]-probs[state.compare]),'wahrer Abstand'],[pp(d.lower)+' bis '+pp(d.upper),state.confidence+'%-Intervall des Abstands']])+(d.reliable?insight(excludes?'<strong>Null liegt außerhalb des Intervalls.</strong> Unter unserem Modell spricht diese Umfrage auf dem gewählten Niveau für einen Unterschied zugunsten von '+(d.estimate>0?party.name:other.name)+'. Auch dieses Verfahren kann sich irren.':'<strong>Null liegt im Intervall.</strong> Die Umfrage erlaubt unter unserem Modell keine klare Aussage darüber, welche der beiden Parteien tatsächlich vorne liegt. Das beweist keinen Gleichstand.'):'<p class="warning">Mindestens eine Zelle hat weniger als zehn Beobachtungen. Die Normalapproximation des Abstands ist hier unzuverlässig; daraus bitte keine belastbare Rangfolge ableiten.</p>')+'<p class="chart-note">Die einzelnen Wilson-Intervalle '+(overlap?'überlappen':'überlappen nicht')+': '+party.name+' '+pct(intervalA[0])+'–'+pct(intervalA[1])+', '+other.name+' '+pct(intervalB[0])+'–'+pct(intervalB[1])+'. Die Überlappung allein ersetzt keinen Test des Abstands.</p>'+task('Wählen Sie „Knappes Rennen“ und ziehen Sie mehrmals neu. Bei welchem n wechseln Rangfolge und Urteil besonders häufig?')+dataTable();
    }
    $('lesson').innerHTML='<h2 id="lesson-title">'+title+'</h2><p class="lede">'+intro+'</p>'+body+quiz()+'<div class="lesson-nav">'+(state.step>0?'<button data-go="'+(state.step-1)+'">← Zurück</button>':'<span></span>')+(state.step<4?'<button class="primary" data-go="'+(state.step+1)+'">Weiter: '+LESSONS[state.step+1]+' →</button>':'<button data-go="0">Zur Grundgesamtheit ↻</button>')+'</div>';
    if(focusHeading)$('lesson').focus({preventScroll:true});
  }
  function updateControls(){['n','reps','focus','confidence','gap','seed'].forEach(id=>$(id).value=state[id]);}
  function settingsChanged(key,value){state[key]=value;if(['n','gap','seed'].includes(key)){state.singleRun=0;state.batchRun=0;}calculate();render();$('status').textContent='Simulation aktualisiert: '+state.n+' Befragte, '+state.reps+' Umfragen.';}
  function download(){
    const rows=[['typ','serie','umfrage','n','seed','abstand_cdu_spd_pp','partei','anzahl','anteil','wahrer_anteil','konfidenzniveau','wilson_unten','wilson_oben']];
    const add=(counts,type,run,number)=>counts.forEach((count,i)=>{const interval=S.wilson(count,state.n,state.confidence);rows.push([type,run+1,number,state.n,state.seed,state.gap,S.PARTIES[i].name,count,count/state.n,probs[i],state.confidence,...interval]);});
    add(single,'einzelstichprobe',state.singleRun,1);
    batches.forEach((c,i)=>add(c,'serie',state.batchRun,i+1));
    const content='\uFEFF'+rows.map(row=>row.map(value=>typeof value==='number'?String(value).replace('.',','):value).join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8;'}));
    const a=document.createElement('a');a.href=url;a.download='umfragelabor-n'+state.n+'-seed'+state.seed+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    $('status').textContent='CSV mit Einzelstichprobe und allen simulierten Umfragen heruntergeladen.';
  }
  $('focus').innerHTML=S.PARTIES.map((p,i)=>'<option value="'+i+'">'+p.name+'</option>').join('');
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.step!==undefined||b.dataset.go!==undefined){state.step=+(b.dataset.step??b.dataset.go);render(true);if(b.dataset.go!==undefined||window.innerWidth<=720)$('lesson').scrollIntoView({block:'start'});return;}
    if(b.dataset.n){updateControls();$('n').value=b.dataset.n;settingsChanged('n',+b.dataset.n);return;}
    if(b.dataset.gap!==undefined){$('gap').value=b.dataset.gap;settingsChanged('gap',+b.dataset.gap);return;}
    if(b.dataset.answer!==undefined){state.answers[state.step]=+b.dataset.answer;render();return;}
    if(b.id==='reset'){Object.assign(state,{step:0,n:200,reps:100,focus:0,confidence:95,gap:10,seed:123,singleRun:0,batchRun:0,compare:1,all:false,answers:{}});updateControls();calculate();render();$('status').textContent='Simulation auf die Ausgangswerte zurückgesetzt.';return;}
    const action=b.dataset.action;
    if(action==='csv'){download();return;}
    if(action==='single'){state.singleRun++;calculate();}
    if(action==='batch'){state.batchRun++;calculate();}
    if(action==='all')state.all=!state.all;
    if(action==='zoom')state.zoom=!state.zoom;
    if(action==='close'){state.gap=2;state.focus=0;state.compare=1;state.singleRun=0;state.batchRun=0;updateControls();calculate();}
    if(action){render();$('status').textContent=action==='single'?'Neue Stichprobe gezogen. Ziehung '+(state.singleRun+1):action==='batch'?'Neue Serie simuliert. Serie '+(state.batchRun+1):'Ansicht aktualisiert.';}
  });
  ['n','reps','focus','confidence','gap','seed'].forEach(id=>$(id).addEventListener('change',()=>{
    const el=$(id);if(!el.checkValidity()){el.reportValidity();el.value=state[id];return;}settingsChanged(id,+el.value);
  }));
  $('n').addEventListener('input',()=>{$('n-out').value=fmt(+$('n').value,0);});
  $('gap').addEventListener('input',()=>{$('gap-out').value=$('gap').value+' Prozentpunkte';});
  $('lesson').addEventListener('change',e=>{if(e.target.id==='compare'){state.compare=+e.target.value;render();}});
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>render(),150);});
  calculate();render();
})();
