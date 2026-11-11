# Was denken die Wähler über die Brandmauer und Alternativen?

Scrollytelling-Entwurf vom 02.11.2026 zu Gross, Martin, Christina-Marie Juen und Christian Stecker (2026), *The Cordon Dilemma: How Voters Evaluate Cooperation with the Far-Right in Parliament*, Comparative Political Studies. DOI: [10.1177/00104140261448429](https://doi.org/10.1177/00104140261448429).

## Öffnen

`brandmauer-entwurf.html` per Doppelklick im Browser öffnen. Die Einzeldatei enthält CSS, JavaScript, Logo und ausschließlich aggregierte Studiendaten; keine Internetverbindung erforderlich. Externe Quellenlinks erfordern Internet. Einige Browser sperren sessionStorage für lokale Dateien: Der Durchlauf funktioniert dann im Arbeitsspeicher, und die Seite zeigt den fehlenden Reload-Erhalt an.

Kanonische, getrennt bearbeitbare Webquellen: `site/`. Kein Framework, keine neuen Paketabhängigkeiten, kein Build für die Site notwendig. Seit der ausdrücklichen Freigabe vom 11.11.2026 im MethodLab-Katalog und für die Veröffentlichung über den bestehenden GitHub-Pages-Workflow vorgesehen. Öffentliche Adresse: https://cstecker.github.io/politicsRLab/cordon-dilemma/. Keine zusätzliche Sites-Registrierung und kein zweiter Pages-Workflow.

## Lernpfad (ca. 25–35 Minuten)

1. Historischer Hintergrund 2024, Mehrheitsrechner für Sachsen/Thüringen, theoretisches Dilemma und vier Kooperationsformen.
2. Sechs zentrale Original-Einstellungsfragen; optional Wahlabsichten, sieben Parteibewertungen und vier Themenwichtigkeiten; drei randomisierte CDU-Paarvergleiche mit Bewertungen −5 bis +5 und erzwungener relativer Auswahl. Teilnahme kann vollständig übersprungen werden.
3. Eigene Antworten im Long-Format, alternativ ein ausdrücklich fiktiver Durchlauf; CSV-Export.
4. Randomisierung, Profilaggregation, Marginal Means, 50%-Referenz, Clusterung nach Person und Abgrenzung zum AMCE.
5. Geführte Ergebnisgrafiken und Explorer zu allen sieben Profilmerkmalen; Auswahl und Bewertungen, Wählergruppen, sechs Zustimmungsverteilungen, instrumentelle/prinzipielle Gruppenvergleiche, getrennte Regionen.
6. Interpretation, Grenzen, drei Wissensfragen mit Feedback, Quellen und Abdeckungsmatrix.

## Quellen und Abdeckung

Lokal gelesen: finales Manuskript vom 17.04.2026, Survey_full_final (DOCX/PDF), afdfirewall.js, Replikations-Rmd und zugehörige RDS-Daten unter dem vom Nutzer angegebenen Forschungsordner. Originaldateien bleiben unverändert außerhalb dieses Projekts. Im Browser werden keine Forschungs-Einzelfälle angezeigt. Die Wahl der sachlichen Erläuterungen orientiert sich an diesen bereitgestellten Primärquellen.

Der Entwurf deckt Theorie, Forschungsdesign und Argumentation der sieben Hauptabbildungen ab. Abbildung 1 wird für die Landtage didaktisch adaptiert, ohne die Bundestagsdarstellung. Abbildung 5 zeigt die CDU-Parteireferenz, nicht alle Referenzlinien der bevorzugten Parteien. Die Abbildungen 6–7 werden durch direkt beschriftete Gruppenmittel mit Konfidenzintervallen statt Signifikanzpfeilen erschlossen. Detailanalysen aller Einzelparteien und zusätzliche Appendix-Grafiken bleiben im Original/Replikationsbericht. Kein Anspruch auf eine vollständige digitale Ausgabe des Artikels.

Die sechs Kernitems sind wortgetreu (einschließlich „einschränkt“). Die Anrede und die optionale Darbietung wurden für den Lernpfad angepasst. Profiltexte und gleichverteilte unabhängige Randomisierung folgen der Originalprogrammierung, drei Runden mit zwei Profilen, keine Ausschlusskombinationen. Die Lehrdemo ist keine Neuerhebung und keine exakte historische Rekonstruktion jedes Qualtrics-Details.

## Datenschutz und Antwortzustand

Keine Analytics, externen Fonts, Netzwerkanfragen für Antworten oder Datenbank. Antworten und einmal gezogene Profile werden nur in sessionStorage dieses Tabs gehalten; sie beeinflussen niemals die Studienaggregate. Zurücksetzen entfernt Antworten und zieht neue Profile. CSV-Download erfolgt nur auf Klick. Im Forschungsdatenexport stehen keine Original-IDs, Zeitstempel, Demografien oder Individualantworten; nur Gruppenstatistiken, Schätzwerte und Quellprüfsummen.

## Reproduzieren

Vor lokalen Befehlen unter Windows den gemeinsamen Werkzeugstart aus AGENTS.md verwenden. Aufrufe aus dem Projektstamm:

```powershell
Rscript cordon-dilemma/tools/export_study.R '<lokaler Replikationsordner>'
python tools/sync_brand.py
python tools/sync_brand.py --check
node --check cordon-dilemma/site/app.js
node cordon-dilemma/tools/check.mjs
python cordon-dilemma/tools/build_standalone.py
```

Vorhandene R-Pakete: dplyr, tidyr, jsonlite, cregg (mit dessen vorhandenen Abhängigkeiten). Export über `cregg::cj(estimate = "mm", id = ~ ResponseId)`, 95%-Konfidenzintervalle nach Person geclustert; dieselben sieben Profilmerkmale wie im Replikationsmodell. Die von cregg erzeugte Meldung `svyglm not fitted by maximum likelihood` stammt aus der Aufbereitung der Survey-Modelle und trat auch im erfolgreichen Export auf; es werden keine Likelihood-Kriterien verwendet.

Nach Aufmerksamkeitsprüfung verbleiben 2.849 Personen. Die vollständige Fallauswahl auf den 17 Variablen von `cj_df` ergibt 16.548 Profilzeilen von 2.773 Personen, also 8.274 vollständige Paare. Diese Fallauswahl betrifft auch die binäre Zielgröße, wenn Profilbewertungen fehlen. Nicht unbegründet auf die 16.638 zuvor vorhandenen Wahlwerte wechseln. Die geplanten Fallzahlen im Methodenteil und die tatsächlich ausgeführte Replikation werden im Lernpfad getrennt erläutert.

Die Zweiteilung der Moderatoren folgt dem Rmd: Zustimmung = eher/voll; alle übrigen gültigen Antworten einschließlich teils/teils = andere Gruppe. Diese Gruppenunterschiede sind nicht die kausale Wirkung einer Einstellungsänderung. Es werden keine Signifikanztests von Gruppendifferenzen aus einer Überlappungsheuristik abgeleitet.

Die CI stammt aus `brand/`, wird von `tools/sync_brand.py` übernommen und nicht separat weitergepflegt. Die Einzeldatei muss nach Änderungen neu erzeugt werden.

## Prüfung des Entwurfs

Am 02.11.2026 geprüft: R-Export erfolgreich; 1.012 Schätzwerte und 54 Zustimmungsverteilungen mit Struktur-/Summenchecks; Übereinstimmung der vier gepoolten Kooperations-MM mit den direkten Auswahlanteilen; vollständiger Browserdurchlauf über drei Runden; Prüfung unbeantworteter Felder; unveränderte Profile und Antworten nach Reload; Datenansicht, Explorer, scrollgesteuerte Gruppenwechsel und Zurücksetzen; sichtbare Desktop- und Mobilprüfung bei 390 × 844 Pixeln. Lange Profilbegriffe umbrechen, die mobile Bewertungsskala hat größere Schaltflächen, kein horizontaler Seitenüberlauf. Die portable Einzeldatei wurde separat geladen; keine JavaScript-Fehler im Browserprotokoll. Keine Veröffentlichung erfolgt.

## Überarbeitung vom 09.11.2026

Durchgehende Sie-Ansprache; Kapitel 01 als Ausgangsposition und überarbeitete Formulierung des Cordon-Dilemmas. Die Teilnahme wird durch eine Erklärung von Attributen, Ausprägungen und Randomisierung eingeführt. Die Datenansicht erklärt alle zwölf Spalten. Das MM-Beispiel wird direkt aus den bestehenden Aggregaten befüllt: 2.192 von 4.070 Profilen ohne Kooperationsbereitschaft wurden gewählt (53,9 %). Redaktionelle Metahinweise wurden aus dem Lernpfad entfernt; methodische Angaben und Quellen bleiben zugänglich. Die Ansprache ist als allgemeine Vorgabe in AGENTS.md festgehalten. Studiendaten, Modelle und Skalen wurden nicht verändert.

Prüfung dieser Überarbeitung: Syntax- und vorhandene Datenchecks erfolgreich; die zwölf Spaltendefinitionen, der Zahlenwert und die entfernten Metatexte geprüft. Sichtbare Kontrolle auf Desktop und bei 390 × 844 Pixeln; keine horizontale Überbreite. Der bestehende Durchlauf bleibt nach Reload erhalten.

## Veröffentlichung über MethodLab

Der gemeinsame Build `python tools/build_teaching_hub.py --public` liefert die Webquellen unter `/politicsRLab/cordon-dilemma/` aus und ergänzt den R-Download im App-Verzeichnis. Die portable Einzeldatei bleibt eine lokal erzeugte Ausgabe. Der MethodLab-Katalog enthält den Entwurf als interaktives Scrollytelling. Der bestehende Workflow prüft Branding, JavaScript und die Aggregate vor dem gemeinsamen Deployment. Die Freigabe umfasst keine Forschungs-Einzelantworten oder gemeinsame Kurserhebung.
