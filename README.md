# politicsRLab
This repository contains google Colabs for German &amp; Comparative Politics. Material has been created by Christian Stecker and Leon Siefken.

## Kursumfrage BRD 2026/27

[In welcher Blase bin ich denn hier gelandet? – Colab](https://colab.research.google.com/github/cstecker/politicsRLab/blob/main/In%20welcher%20Blase%20bin%20ich%20denn%20hier%20gelandet%20-%202026-10.ipynb)

R-Einstieg mit der Kursumfrage: kommentierte Codezellen, Häufigkeiten, Mittelwert, Modalwert(e), beschriftetes Balkendiagramm mit Quiz und zwei einfache gerichtete Hypothesentests nach Geschlecht. Übungsdaten: [RDS](data/survey2026-10_colab.rds), [Codebuch](data/survey2026-10_codebook.csv), [Datenstand](data/survey2026-10_metadata.json). Persönliche Codes, IDs, Zeitstempel, Geburtsorte und Freitexte sind entfernt; seltene Kategorien geschützt. Das Notebook berechnet alle Ergebnisse aus dem jeweils geladenen Datenstand.

Die Aufbereitung und die kanonische Notebook-Quelle werden im Lehrprojekt unter `_kursumfragen/2026-10_brd/` gepflegt. Frühere Colabs bleiben erhalten. Für ein späteres Update werden Daten und Notebook erneut exportiert; die Dateinamen bleiben gleich.

Aktueller Übungsdatenstand: **13.10.2026**, 150 abgeschlossene Interviews mit Einwilligung, davon 149 gültige Links-Rechts-Antworten. Die Anonymisierungsregeln bleiben erhalten; Kategorien der Wahlabsicht werden ab fünf Fällen separat ausgewiesen. Für den vereinfachten Hypothesentest bleibt die Auswahl CDU/FDP gegenüber SPD/Grünen/Linken bestehen.

## Interaktive Lehr-Apps und gemeinsame Gestaltung

**[MethodLab – gemeinsame Startseite](https://cstecker.github.io/politicsRLab/)** bündelt die interaktiven Apps und Colab-Übungen. Die Startseite bietet eine Themen-Suche, Formatfilter und direkte Einstiege.

- [Parteienlabor](https://parteienlabor-brd.plugchris.chatgpt.site/): Parteipositionen schätzen, gemeinsame Mittelwerte und Konfidenzintervalle, Verteilungen und OES-Vergleich. [Demo](https://parteienlabor-brd.plugchris.chatgpt.site/demo). Die App mit gemeinsamer Datenerhebung wird separat betrieben.
- [Räumliche Modelle](spatial-models-demo/README.md): vorhandene statische Anwendung zu Idealpunkten, Präferenzmengen, Gewinnmenge und Median.
- [Wahlsystemlabor](wahlsystemlabor/README.md): [öffentlicher Entwurf](https://cstecker.github.io/politicsRLab/wahlsystemlabor/) zum Conjoint von Jankowski/Linhart/Tepe (2019), mit fünf Paarentscheidungen, Lehrmodus und simulierter AMCE-Auswertung. Testentscheidungen bleiben im jeweiligen Browser; noch keine gemeinsame Hörsaalerhebung.
- [MethodLab-Startseite und Build](hub/README.md): Katalog und Veröffentlichung über GitHub Pages.

Alle Lehr-Apps verwenden die vollständige TU-Wort-Bildmarke, den verlinkten Arbeitsbereich „Politisches System Deutschlands und Vergleich politischer Systeme“ und darunter „Prof. Dr. Christian Stecker“. Gemeinsame Quellen unter brand/; Übernahme mit python tools/sync_brand.py, Kontrolle mit python tools/sync_brand.py --check. Die bestehenden Notebooks und Colab-Links bleiben erhalten.
