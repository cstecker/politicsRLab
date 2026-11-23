# Wer bekommt überhaupt die Chance, in den Bundestag einzuziehen?

[**Scrollytelling im Browser öffnen**](https://cstecker.github.io/politicsRLab/bundestag-scrollytelling/). Für den Einsatz ohne Internet lässt sich die [HTML-Einzeldatei](bundestag-entwurf.html) herunterladen und per Doppelklick öffnen. Der bearbeitbare Einstieg liegt unter [site/index.html](site/index.html).

Study of the Day für die BRD-Vorlesung, etwa zehn Minuten einschließlich kurzer Denk- und Gesprächspausen. Grundlage ist die Studie von Lea Elsässer und Jonas Wenker (2026) über die Nominierung von Bundestagskandidierenden. [Originalaufsatz](https://doi.org/10.1017/S1475676525100017)

## Einsatz in der Vorlesung

| Zeit | Aufgabe |
| --- | --- |
| 0–2 Min. | Am Bildungsprofil der Abgeordneten von 1969 bis 2021 den Wandel beschreiben. Einmal vermuten und begründen, an welcher Station auf dem Weg ins Parlament die größte Hürde liegt. |
| 2–4 Min. | Am selben Rechenbeispiel Wahlkreis, Landesliste und Doppelkandidatur vergleichen. Entdecken, warum zwei einzeln umkämpfte Positionen zusammen eine sichere Nominierung ergeben können. |
| 4–6 Min. | Die Sicherheitskategorien mit den späteren Wahlergebnissen vergleichen. Die 93 % und 6 % jeweils mit ihrem Nenner aussprechen. |
| 6–8 Min. | Die soziale Zusammensetzung der drei Kategorien in den Originalbalken vergleichen. Danach im Modell Alter, Amtsinhaberschaft und andere Merkmale gleichhalten und die Intervalle lesen. |
| 8–10 Min. | Auf die eigene Vermutung zurückkommen. Am Beispiel Ausbildungsförderung benennen, mit welchen Daten sich neben deskriptiver auch substanzielle Repräsentation untersuchen ließe. |

Die Vorhersage kann mündlich begründet oder als Stichwort eingegeben werden. Sie bleibt bis zum Neuladen im aktuellen Dokument und erscheint beim Transfer wieder. Der Lernpfad funktioniert auch ohne Eingabe. Die App verwendet weder Antwortspeicher noch externe Dienste, Fonts oder Analysewerkzeuge. Die Quellenlinks öffnen externe Seiten erst bei Auswahl.

**Bedienung.** Scrollen oder die Abschnittslinks verwenden. Die drei Befundgrafiken wechseln auf großen Bildschirmen im stehenden rechten Feld. Auf kleineren oder flachen Bildschirmen steht jede Grafik direkt unter dem zugehörigen Text. „Beamer“ blendet Zurück/Weiter und die Position im Lernpfad ein. Links-/Rechtspfeil wechseln den Abschnitt, Escape beendet die Präsentationssteuerung. Formulare behalten ihre native Tastaturbedienung.

## Wissenschaftliche Grundlage

Die Bildungsreihe ist aus den GerCaMP-Biografiedaten neu berechnet. Alle 15 gerundeten Werte stimmen mit Anhangtabelle A1 überein. Für die Nominierung verwendet die Studie eine andere Grundlage, die GLES-Befragungen zu den Wahlen 2013, 2017 und 2021. Im Hauptmodell nähert eigene Bildung die soziale Klasse an. Die frühe politiknahe Laufbahn und ein bereits bestehendes Mandat sind eigene Merkmale. Die App erklärt die Zugangswege nach den Regeln der untersuchten Wahlen.

Für die Zusammensetzung nach Bildungs- und Berufsprofil zeigt der Entwurf Ausschnitte von Abbildung 4 mit deutschen Achsenbeschriftungen. Die Wahlerfolgsquoten sowie die Amtsinhaberanteile stammen aus dem Text. Die geschätzten Modellvergleiche verwenden Koeffizienten und Standardfehler aus Anhangtabelle A2. Für die Lehre wird eine Ausgangswahrscheinlichkeit von 50 % gesetzt. So lassen sich die berichteten Gruppenunterschiede und ihre Unsicherheit auf einer Wahrscheinlichkeitsskala darstellen. Das vorgeschaltete Beispiel zu drei Vorwahlen ist ebenfalls eigens für die Lehre konstruiert.

Bei Abbildung 6 widersprechen die Balkenhöhen den Wahrscheinlichkeiten im Fließtext. Die Vertiefung dokumentiert die Abweichung. Der freie OSF-Download enthält die Biografiedaten und den Auswertungscode. Die GLES-Kandidierendendaten unterliegen einer Vertragslösung. Der Modellvergleich beruht daher auf den publizierten Schätzungen. Der Seminartext von Elsässer, Hense und Schäfer (2017) schließt mit der Untersuchung ungleicher Responsivität an. [Quellen, Lizenz, Prüfsummen und Modellrechnung](tools/QUELLEN.md) · [Seminartext](https://doi.org/10.1007/s41358-017-0097-9)

## Bearbeiten und prüfen

Alle Befehle im Projektstamm. Der R-Export benötigt das Paket `jsonlite`. Ohne Argument lädt er die geprüfte Abgeordnetendatei temporär, alternativ akzeptiert er deren lokalen Pfad.

```powershell
Rscript bundestag-scrollytelling/tools/export_study.R
python bundestag-scrollytelling/tools/extract_figure4.py '<Pfad zum Original-PDF>'
python tools/sync_brand.py
python tools/sync_brand.py --check
node --check bundestag-scrollytelling/site/app.js
node --check bundestag-scrollytelling/site/study-data.js
python bundestag-scrollytelling/tools/build_standalone.py
node bundestag-scrollytelling/tools/check_browser.cjs
```

Der reproduzierbare Bildausschnitt nutzt PyMuPDF und Pillow. Die Browsertests verwenden das vorhandene Playwright mit Chromium oder Chrome. Ein abweichender Browserpfad kann über `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` gesetzt werden. Optional nimmt das Testskript eine lokale HTTP-Adresse als Argument. Prüfbilder liegen im ignorierten Projektordner `outputs/bundestag-qa/`. Für die Nutzung der fertigen App genügt der Browser.

Der gemeinsame MethodLab-Workflow veröffentlicht die kanonische Quelle `bundestag-scrollytelling/site/` über GitHub Pages. [Prüfbericht](QA.md)
