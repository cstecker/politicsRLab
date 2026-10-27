"""Synchronisiert die gemeinsame CI in eigenständig veröffentlichbare Apps.

Aufruf im Projektstamm: python tools/sync_brand.py [--check]
Nur Standardbibliothek; fehlende lokale App-Checkouts werden übersprungen.
"""
from pathlib import Path
import argparse
import hashlib
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / 'brand'
START = '<!-- politicsRLab:identity:start -->'
END = '<!-- politicsRLab:identity:end -->'

def header_markup(identity, logo_path):
    e = html.escape
    return f'''<header class="prl-institution" aria-label="Hochschule und Arbeitsbereich">
  <div class="prl-institution__inner">
    <a class="prl-institution__logo" href="{e(identity['university_url'], quote=True)}" aria-label="{e(identity['university'], quote=True)}">
      <img src="{logo_path}" width="250" height="157" alt="{e(identity['university'], quote=True)}" />
    </a>
    <div class="prl-institution__text">
      <a class="prl-institution__department" href="{e(identity['department_url'], quote=True)}">{e(identity['department'])}</a>
      <p class="prl-institution__person">{e(identity['person'])}</p>
    </div>
  </div>
</header>'''

def generated_files():
    identity = json.loads((BRAND / 'identity.json').read_text(encoding='utf-8'))
    logo = (BRAND / 'tu-darmstadt.svg').read_bytes()
    if hashlib.sha256(logo).hexdigest() != identity['logo_sha256']:
        raise ValueError('TU-Logo weicht vom dokumentierten Original ab.')
    css = (BRAND / 'brand.css').read_bytes()
    files = {}
    app = ROOT / 'apps/parteienlabor'
    if app.is_dir():
        files[app / 'public/brand/tu-darmstadt.svg'] = logo
        files[app / 'app/brand.css'] = css
        jsx = header_markup(identity, '/brand/tu-darmstadt.svg').replace('class=', 'className=')
        component = '// Generiert durch tools/sync_brand.py im politicsRLab-Projektstamm.\nexport default function InstitutionalHeader() {\n  return (\n' + jsx + '\n  );\n}\n'
        files[app / 'app/institutional-header.tsx'] = component.encode('utf-8')
    for relative in ('spatial-models-demo/site', 'wahlsystemlabor/site', 'hub/site'):
        site = ROOT / relative
        if not site.is_dir():
            continue
        files[site / 'brand/tu-darmstadt.svg'] = logo
        files[site / 'brand/brand.css'] = css
        index = site / 'index.html'
        content = index.read_text(encoding='utf-8')
        block = START + '\n' + header_markup(identity, './brand/tu-darmstadt.svg') + '\n' + END
        if START in content:
            content = re.sub(re.escape(START) + r'.*?' + re.escape(END), lambda _: block, content, flags=re.S)
        else:
            if '<body>' not in content:
                raise ValueError('Statische App hat keinen erwarteten body-Tag.')
            content = content.replace('<body>', '<body>\n' + block, 1)
        link = '  <link rel="stylesheet" href="./brand/brand.css">'
        if './brand/brand.css' not in content:
            expected = '  <link rel="stylesheet" href="./styles.css">'
            if expected not in content:
                raise ValueError('Statische App hat keinen erwarteten Stylesheet-Link.')
            content = content.replace(expected, link + '\n' + expected, 1)
        files[index] = content.encode('utf-8')
    return files

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Nur prüfen; keine Dateien schreiben')
    args = parser.parse_args()
    changed = []
    files = generated_files()
    for path, content in files.items():
        if path.exists() and path.read_bytes() == content:
            continue
        changed.append(str(path.relative_to(ROOT)))
        if not args.check:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
    if args.check and changed:
        raise SystemExit('CI-Dateien weichen ab: ' + ', '.join(changed))
    print(f'{len(files)} CI-Dateien geprüft; {len(changed)} ' + ('Abweichungen.' if args.check else 'aktualisiert.'))

if __name__ == '__main__':
    main()
