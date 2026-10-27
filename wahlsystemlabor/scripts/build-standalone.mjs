// Portabler Entwurf: ohne Webserver per Doppelklick im Browser öffnen.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const read = path => readFileSync(path, 'utf8');
let html = read('site/index.html');
const css = read('site/brand/brand.css') + '\n' + read('site/styles.css');
const r = Buffer.from(read('site/auswertung.R')).toString('base64');
const script = ['design', 'stats', 'app'].map(name => read(`site/${name}.mjs`)
  .replace(/^import .*;\r?\n/gm, '')
  .replace(/^export /gm, '')).join('\n')
  .replaceAll('href="./auswertung.R"', `href="data:text/plain;charset=utf-8;base64,${r}"`)
  .replace(/<\/script/gi, '<\\/script');
html = html.replace(/  <link rel="stylesheet" href="\.\/(?:brand\/brand\.css|styles\.css)">\r?\n/g, '')
  .replace('  <script type="module" src="./app.mjs"></script>', `<style>${css}</style>`)
  .replace('src="./brand/tu-darmstadt.svg"', `src="data:image/svg+xml;base64,${readFileSync('site/brand/tu-darmstadt.svg').toString('base64')}"`)
  .replace('</body>', `<script type="module">\n${script}\n</script>\n</body>`);
mkdirSync('outputs', { recursive: true });
writeFileSync('outputs/wahlsystemlabor-entwurf.html', html);
console.log('outputs/wahlsystemlabor-entwurf.html');
