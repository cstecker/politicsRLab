# spatial-models-demo

Statisches HTML-Dashboard für die Vorlesung zu eindimensionalen räumlichen Modellen des Entscheidens.

Die veröffentlichte Variante liegt unter `site/` und läuft ohne Shiny-Server direkt im Browser. Für die Hauptgrafik wird bewusst **vanilla JavaScript + SVG** verwendet, weil sich die drag-and-drop-Logik damit sauberer umsetzen lässt als mit einem reinen Charting-Framework. Der untere Balkenplot wird mit **Chart.js** gerendert.

## Enthaltene Funktionen

- direkt verschiebbare Idealpunkte und ein verschiebbarer Status quo
- Präferenzmengen `P_i(y)` für alle fünf Akteure
- Gewinnmenge `W(y)` unter variierbarer Entscheidungsregel
- Wahl zwischen absoluter Mehrheit, Supermajorität und Einstimmigkeit
- fester Balkenplot zur Summe absoluter Abweichungen aller Idealpunkte vom aktuellen Status quo
- Erklärungstext zum aktuellen Fall

## Lokaler Start

Da die Seite statisch ist, reicht jeder einfache Webserver. Zum Beispiel mit Node:

```powershell
Set-Location "D:\PolScience\Lehre\politicsRLab\spatial-models-demo\site"
node -e "require('http').createServer((req,res)=>require('fs').readFile('.'+(req.url==='/'?'/index.html':req.url),(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;} const ext=req.url.endsWith('.css')?'text/css':req.url.endsWith('.js')?'application/javascript':'text/html'; res.writeHead(200,{'Content-Type':ext+'; charset=utf-8'}); res.end(data);}).listen(4173,'127.0.0.1'); console.log('http://127.0.0.1:4173'); setInterval(()=>{},1<<30)"
```

Dann im Browser öffnen:

`http://127.0.0.1:4173`

## GitHub Pages

**[Räumliche Modelle öffnen](https://cstecker.github.io/politicsRLab/spatial-models/)** · **[MethodLab-Startseite](https://cstecker.github.io/politicsRLab/)**

Der gemeinsame Workflow `.github/workflows/deploy-spatial-models-demo.yml` heißt jetzt „Deploy MethodLab“. Er baut die Startseite und beide statischen Anwendungen mit:

`python tools/build_teaching_hub.py --public`

Das Pages-Artefakt liegt unter `outputs/teaching-hub-public/`. Die räumlichen Modelle erhalten darin den Unterpfad `spatial-models/`. Änderungen der statischen Quellen auf `main` lösen das gemeinsame Deployment aus.

Falls GitHub Pages im Repository noch nicht aktiviert ist:

1. Repository auf GitHub öffnen
2. `Settings` -> `Pages`
3. als Source `GitHub Actions` auswählen

Danach reicht ein Push auf `main`, damit die statische Seite veröffentlicht wird.

## Gemeinsame Gestaltung

Die statische Anwendung übernimmt die institutionelle Kopfzeile, TU-Blau und Arial aus ../brand/. Nach Änderungen an der gemeinsamen Gestaltung im Projektstamm python tools/sync_brand.py und --check ausführen. Die kopierten Assets unter site/brand/ gehören zum statischen Paket. Akteursfarben, Skalen und Berechnungen bleiben eigenständig.
