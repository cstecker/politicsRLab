"""Baut die transportable Einzeldatei aus den kanonischen statischen Quellen."""
import base64
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
SITE = APP / "site"


def data_uri(filename, mime):
    data = base64.b64encode((SITE / filename).read_bytes()).decode("ascii")
    return f"data:{mime};base64,{data}"


def replace_once(text, before, after):
    if text.count(before) != 1:
        raise ValueError(f"Unerwartete Vorlagenstruktur bei {before}")
    return text.replace(before, after)


def build():
    html = (SITE / "index.html").read_text(encoding="utf-8")
    for name in ["brand/brand.css", "styles.css"]:
        css = (SITE / name).read_text(encoding="utf-8")
        html = replace_once(html, f'<link rel="stylesheet" href="./{name}">', f"<style>\n{css}\n</style>")
    html = replace_once(html, "./brand/tu-darmstadt.svg", data_uri("brand/tu-darmstadt.svg", "image/svg+xml"))
    scripts = []
    for name in ["study-data.js", "app.js"]:
        html = replace_once(html, f'  <script defer src="./{name}"></script>\n', "")
        script = (SITE / name).read_text(encoding="utf-8")
        if name == "app.js":
            for graphic in ["abb4-bildung.png", "abb4-laufbahn.png"]:
                script = replace_once(script, "./" + graphic, data_uri(graphic, "image/png"))
        scripts.append("<script>\n" + script.replace("</script", "<\\/script") + "\n</script>")
    html = replace_once(html, "</body>", "\n".join(scripts) + "\n</body>")
    target = APP / "bundestag-entwurf.html"
    target.write_text(html, encoding="utf-8", newline="\n")
    print(target.name, target.stat().st_size, "Bytes")


if __name__ == "__main__":
    build()
