"""Baut das statische MethodLab-Paket für Vorschau oder GitHub Pages.

Aufruf: python tools/build_teaching_hub.py
Ausgabe: outputs/teaching-hub/ (ignoriert).
--public erzeugt outputs/teaching-hub-public/ für den Pages-Workflow.
Dieser Build führt selbst keine Veröffentlichung aus.
"""
from pathlib import Path
from html import escape
from urllib.parse import urlparse
import json
import re
import shutil
import argparse
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def validate_link(href):
    if not (href.startswith('./') or urlparse(href).scheme == 'https'):
        raise ValueError(f'Unerwartetes Linkziel: {href}')
    return escape(href, quote=True)


def card(item):
    e = escape
    secondary = ''
    if item.get('secondary_href'):
        secondary = f'<a href="{validate_link(item["secondary_href"])}">{e(item["secondary_action"])}</a>'
    draft = ' draft' if item['status'] == 'Entwurf' else ''
    return f'''<article class="card" data-kind="{e(item['kind'])}" id="app-{e(item['id'])}">
  <div class="card-top"><span>{e(item['format'])}</span><span class="status{draft}">{e(item['status'])}</span></div>
  <p class="topic">{e(item['topic'])}</p><h3>{e(item['title'])}</h3>
  <p>{e(item['description'])}</p><p class="use">{e(item['use'])}</p>
  <div class="card-actions"><a href="{validate_link(item['href'])}">{e(item['action'])} →</a>{secondary}</div>
</article>'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--public', action='store_true', help='Das öffentliche GitHub-Pages-Paket erzeugen.')
    args = parser.parse_args()
    output = ROOT / ('outputs/teaching-hub-public' if args.public else 'outputs/teaching-hub')
    catalog = json.loads((ROOT / 'hub/catalog.json').read_text(encoding='utf-8'))
    ids = [item['id'] for item in catalog]
    if len(ids) != len(set(ids)):
        raise ValueError('Doppelte Katalog-ID.')
    required_apps = {'spatial-models': ROOT / 'spatial-models-demo/site',
                     'wahlsystemlabor': ROOT / 'wahlsystemlabor/site',
                     'cordon-dilemma': ROOT / 'cordon-dilemma/site',
                     'umfragelabor': ROOT / 'umfragelabor/site'}
    for name, source in required_apps.items():
        if not (source / 'index.html').is_file():
            raise FileNotFoundError(f'App-Quelle fehlt: {source}. Siehe hub/README.md.')
    output.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ROOT / 'hub/site', output, dirs_exist_ok=True)
    source = (ROOT / 'hub/site/index.html').read_text(encoding='utf-8')
    content = '<!-- catalog:start -->\n' + '\n'.join(card(item) for item in catalog) + '\n<!-- catalog:end -->'
    source, count = re.subn(r'<!-- catalog:start -->.*?<!-- catalog:end -->', lambda _: content, source, flags=re.S)
    if count != 1:
        raise ValueError('Katalog-Markierung fehlt oder ist mehrfach vorhanden.')
    (output / 'index.html').write_text(source, encoding='utf-8')
    for name, app in required_apps.items():
        shutil.copytree(app, output / name, dirs_exist_ok=True)
    # Die gepackte App liegt eine Ebene höher als die lokale site/-Quelle.
    cordon = output / 'cordon-dilemma'
    cordon_index = cordon / 'index.html'
    cordon_html = cordon_index.read_text(encoding='utf-8')
    download_link = 'href="../tools/export_study.R"'
    if download_link not in cordon_html:
        raise ValueError('Erwarteter R-Download im Cordon-Scrollytelling fehlt.')
    cordon_html = cordon_html.replace(download_link, 'href="./export_study.R"')
    cordon_html = cordon_html.replace('class="wordmark" href="#main"', 'class="wordmark" href="../"')
    cordon_index.write_text(cordon_html, encoding='utf-8')
    shutil.copyfile(ROOT / 'cordon-dilemma/tools/export_study.R', cordon / 'export_study.R')
    (output / '.nojekyll').write_text('', encoding='utf-8')
    if not args.public:
        lab = ROOT / 'wahlsystemlabor'
        subprocess.run(['node', 'scripts/build-standalone.mjs'], cwd=lab, check=True)
        shutil.copyfile(lab / 'outputs/wahlsystemlabor-entwurf.html', output / 'wahlsystemlabor/entwurf.html')
        offline = source.replace('href="./wahlsystemlabor/"', 'href="./wahlsystemlabor/entwurf.html"')
        offline = offline.replace('href="./umfragelabor/"', 'href="./umfragelabor/index.html"')
        offline = offline.replace('href="./spatial-models/"', 'href="./spatial-models/index.html"')
        subprocess.run([sys.executable, 'tools/build_standalone.py'], cwd=ROOT / 'cordon-dilemma', check=True)
        shutil.copyfile(ROOT / 'cordon-dilemma/brandmauer-entwurf.html', cordon / 'entwurf.html')
        offline = offline.replace('href="./cordon-dilemma/"', 'href="./cordon-dilemma/entwurf.html"')
        offline = offline.replace('class="wordmark" href="./"', 'class="wordmark" href="./methodlab-entwurf.html"')
        (output / 'methodlab-entwurf.html').write_text(offline, encoding='utf-8')
    print(f'{len(catalog)} Angebote: {output}')


if __name__ == '__main__':
    main()
