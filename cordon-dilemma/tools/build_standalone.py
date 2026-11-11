"""Erzeugt eine einzelne offline nutzbare HTML-Datei aus der kanonischen Site."""
from pathlib import Path
import base64
import re

APP = Path(__file__).resolve().parents[1]
SITE = APP / "site"


def build():
    html = (SITE / "index.html").read_text(encoding="utf-8")
    for relative in ("./brand/brand.css", "./styles.css"):
        css = (SITE / relative).read_text(encoding="utf-8")
        html = html.replace(f'<link rel="stylesheet" href="{relative}">', f"<style>\n{css}\n</style>")
    scripts = []
    for name in ("study-data.js", "app.js"):
        html = html.replace(f'<script src="./{name}" defer></script>', "")
        scripts.append((SITE / name).read_text(encoding="utf-8").replace("</script", "<\\/script"))
    logo = base64.b64encode((SITE / "brand/tu-darmstadt.svg").read_bytes()).decode("ascii")
    html = html.replace('src="./brand/tu-darmstadt.svg"', f'src="data:image/svg+xml;base64,{logo}"')
    r_script = base64.b64encode((APP / "tools/export_study.R").read_bytes()).decode("ascii")
    html = html.replace('href="../tools/export_study.R" download', f'href="data:text/plain;base64,{r_script}" download="export_study.R"')
    html = html.replace("</body>", "\n" + "\n".join(f"<script>\n{script}\n</script>" for script in scripts) + "\n</body>")
    if re.search(r'(?:src|href)="\.{1,2}/', html):
        raise ValueError("Nicht eingebettete lokale Ressource in der Einzeldatei.")
    dest = APP / "brandmauer-entwurf.html"
    dest.write_text(html, encoding="utf-8", newline="\n")
    print(f"Erstellt: {dest} ({dest.stat().st_size:,} Bytes)")


if __name__ == "__main__":
    build()
