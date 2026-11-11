# MethodLab – gemeinsame Startseite

**[MethodLab öffnen](https://cstecker.github.io/politicsRLab/)**

Gemeinsamer Einstieg für Apps und R-/Colab-Übungen. Quellen: `catalog.json` (Angebote) und `site/` (Gestaltung, Suche und Filter). Gemeinsame Kopfzeile über `../tools/sync_brand.py`. Keine weiteren Pakete nötig.

```powershell
python tools/sync_brand.py
python tools/build_teaching_hub.py
```

Aus dem Projektstamm ausführen. Danach `outputs/teaching-hub/methodlab-entwurf.html` im Browser öffnen. Diese Dateifassung verlinkt das portable Wahlsystemlabor sowie die lokalen Quellen der räumlichen Modelle und des Umfragelabors sowie das portable Cordon-Scrollytelling. Mit Webserver stattdessen `outputs/teaching-hub/index.html` verwenden.

Öffentliches Paket für GitHub Pages:

```powershell
python tools/build_teaching_hub.py --public
```

Ausgabe: `outputs/teaching-hub-public/`. Enthalten sind die Startseite mit neun Angeboten, der statische Wahlsystemlabor-Entwurf, die räumlichen Modelle, das Umfragelabor und das Cordon-Scrollytelling. Das separat betriebene Parteienlabor und die Colab-Notebooks sind verlinkt. Private Dozentenfunktionen und Antwortdaten werden nicht kopiert. Die Notebook-Inhalte sind verlinkter Bestand und wurden für diese Veröffentlichung nicht erneut inhaltlich geprüft.

Die Veröffentlichung läuft über den bestehenden Workflow `.github/workflows/deploy-spatial-models-demo.yml`, jetzt mit dem Namen „Deploy MethodLab“. Es gibt ein gemeinsames Pages-Artefakt statt konkurrierender App-Deployments. Änderungen an Katalog, Gestaltung, statischen Apps oder Build-Hilfen auf `main` lösen den Workflow aus; manuelles Auslösen ist ebenfalls möglich.

Pfade: `/politicsRLab/` (Startseite), `/politicsRLab/wahlsystemlabor/`, `/politicsRLab/spatial-models/`, `/politicsRLab/umfragelabor/` und `/politicsRLab/cordon-dilemma/`. Das Wahlsystemlabor bleibt ausdrücklich als Entwurf ohne gemeinsame Erhebung gekennzeichnet.

Am 11.11.2026 wurde das Scrollytelling „Was denken die Wähler über die Brandmauer und Alternativen?“ als neuntes Angebot in den Katalog und den bestehenden Pages-Workflow aufgenommen. Quelle: `../cordon-dilemma/site/`. Der Build übernimmt ausschließlich die statischen App-Dateien und den R-Export als Download; die Anwendung liefert Studienaggregate aus und hält Teilnahmeantworten browserlokal. Suche und App-Filter erfassen das Scrollytelling.
