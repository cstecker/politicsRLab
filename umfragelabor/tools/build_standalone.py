"""Erzeugt die offline nutzbare Einzeldatei aus den kanonischen Webquellen."""
from pathlib import Path
import base64
import re

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
page = (SITE / 'index.html').read_text(encoding='utf-8')
for name in ('brand/brand.css', 'styles.css'):
    page = page.replace(f'<link rel="stylesheet" href="./{name}">', '<style>\n' + (SITE / name).read_text(encoding='utf-8') + '\n</style>')
# Inline-Skripte stehen am body-Ende, damit ihre DOM-Ziele bereits existieren.
scripts = []
for name in ('stats.js', 'app.js'):
    page = page.replace(f'<script defer src="./{name}"></script>', '')
    scripts.append('<script>\n' + (SITE / name).read_text(encoding='utf-8') + '\n</script>')
page = page.replace('</body>', '\n'.join(scripts) + '\n</body>')
logo = base64.b64encode((SITE / 'brand/tu-darmstadt.svg').read_bytes()).decode('ascii')
page = page.replace('./brand/tu-darmstadt.svg', 'data:image/svg+xml;base64,' + logo)
if re.search(r'(?:src|href)="\./', page):
    raise SystemExit('Noch lokale Dateiabhängigkeiten vorhanden.')
page = re.sub(r'^[ \t]+$', '', page, flags=re.M)
output = ROOT / 'umfragelabor.html'
output.write_text(page, encoding='utf-8', newline='\n')
print(f'Einzeldatei erzeugt: {output.name} ({output.stat().st_size} Bytes).')
