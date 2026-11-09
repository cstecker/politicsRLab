# Umfragelabor – Have confidence(intervals) in polls.

**[Umfragelabor öffnen](https://cstecker.github.io/politicsRLab/umfragelabor/)** · [MethodLab](https://cstecker.github.io/politicsRLab/)

Interaktive Übertragung von „Have confidence(intervals) in Wahlumfragen.ipynb“, erstellt am 03.11.2026.

## Öffnen

[umfragelabor.html](umfragelabor.html) per Doppelklick im Browser öffnen. Die Einzeldatei enthält Logo, CSS und JavaScript und funktioniert ohne Internetzugang. Nur die externen Quellenlinks benötigen Internet. Alternativ: `site/index.html` öffnen oder `site/` statisch ausliefern.

Kanonische Quellen: `site/`. Kein Framework und keine neuen Abhängigkeiten. Seit der Freigabe vom 09.11.2026 Teil der gemeinsamen GitHub-Pages-Veröffentlichung und des MethodLab-Katalogs. Veröffentlichung über den bestehenden Workflow `.github/workflows/deploy-spatial-models-demo.yml`; `python tools/build_teaching_hub.py --public` kopiert `site/` nach `umfragelabor/` im Pages-Artefakt.

## Lernweg und Spielraum

1. Grundgesamtheit: sieben fiktive Parteianteile, zusammen 100 %, anhand von genau 10.000 Personen veranschaulicht.
2. Eine Stichprobe: neue Ziehungen, alle sieben Kategorien einschließlich null Nennungen.
3. Viele Stichproben: Streudiagramm, Histogramm, empirischer/theoretischer Standardfehler und Übersicht aller Parteien. Feste Skala oder ausdrücklich gekennzeichnete vergrößerte Ansicht.
4. Konfidenzintervalle: Wilson-Intervalle jeder Stichprobe, Abdeckung über alle Wiederholungen; die ersten 50 Intervalle werden gezeichnet.
5. Wer liegt vorn: einzelne Parteiintervalle und direktes Intervall für den Abstand zweier Anteile derselben Umfrage. Kleine Zellen werden gekennzeichnet.

Einstellbar: 50–5.000 Befragte in Schritten von 50, 50/100/500/1.000 Umfragen, alle sieben Fokusparteien, 90/95/99 % Konfidenzniveau, Seed und wahrer CDU-SPD-Abstand von −10 bis +20 Prozentpunkten. Szenarien: Colab-Beispiel (31/21 %), knappes Rennen (27/25 %) und Gleichstand (26/26 %). CDU und SPD summieren sich immer zu 52 %; die übrigen Anteile bleiben konstant.

Jede Lektion enthält eine Aufgabe und eine Verständnisfrage mit Feedback. Tabellen und CSV ermöglichen die Weiterarbeit. Die CSV enthält Einzelstichprobe und alle simulierten Umfragen im langen Format; sieben Zeilen pro Umfrage, einschließlich Zählwerten und Wilson-Grenzen. UTF-8 mit BOM, Semikolon und Dezimalkomma; in R mit `readr::read_csv2()` einlesen.

## Präzisierungen gegenüber dem Notebook

- Die Beispielanteile sind fiktiv und aus dem Colab übernommen; keine aktuellen Umfragedaten.
- Die Grundgesamtheit bildet diese Anteile exakt ab. Im Notebook wurde sie zufällig aus den vorgegebenen Wahrscheinlichkeiten generiert, aber teilweise mit den Vorgabewerten verglichen.
- Alle Stichproben verwenden konsistent unabhängige Ziehungen **mit Zurücklegen**. Das Notebook wechselte zwischen ohne und mit Zurücklegen. Die 10.000 Personen dienen der Anschauung; es wird keine Endlichkeitskorrektur verwendet.
- Die 2,5%- und 97,5%-Quantile der Umfragewerte beschreiben deren mittleren 95%-Bereich. Sie werden von einem aus einer einzelnen Stichprobe berechneten Konfidenzintervall getrennt.
- Konfidenzintervalle werden über ihre langfristige Abdeckung erklärt. Für ein bereits berechnetes Intervall wird keine 95%-Wahrscheinlichkeit für den festen Parameter behauptet.
- Für Parteiabstände gilt die Multinomialvarianz `(p_A + p_B - (p_A - p_B)^2) / n`, einschließlich negativer Kovarianz. Überlappung zweier Einzelintervalle wird nicht als Test verwendet. Der direkte Abstand verwendet eine Normalapproximation; Zellen mit weniger als zehn Beobachtungen lösen einen Hinweis aus.
- Größere Stichproben reduzieren Zufallsfehler, keine Auswahlverzerrung. Gewichtung, Ausfälle und zeitliche Veränderungen werden nicht modelliert. Die Intervalle gelten nicht simultan für alle Parteien oder Vergleiche.

Referenzen auch in der App: [NIST zu Wilson-Intervallen](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm), [NIST zur Interpretation](https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm).

## Reproduzieren

Vor lokalen Befehlen unter Windows den gemeinsamen Werkzeugstart aus AGENTS.md verwenden. Aufrufe aus dem Projektstamm:

```powershell
python tools/sync_brand.py
python tools/sync_brand.py --check
node --check umfragelabor/site/stats.js
node --check umfragelabor/site/app.js
node umfragelabor/tools/check.mjs
python umfragelabor/tools/build_standalone.py
```

Der Seed steuert Mulberry32. Einzelstichprobenstrom: `(seed + imul(ziehungsnummer, 2654435761)) >>> 0`; Serienstrom: `(seed + imul(seriennummer, 2246822519)) >>> 0`; Nummern beginnen bei 1. Änderungen von n, Abstand oder Seed setzen die Nummern zurück. Fokus und Konfidenzniveau erhalten die Daten. Mehr Wiederholungen verlängern dieselbe Serie. Die App reproduziert nicht die Zufallsfolge von R.

Alle Berechnungen und Downloads sind browserlokal. Es werden keine Antworten, persönlichen Daten oder Analyseereignisse gespeichert oder versendet. Reload startet mit den Ausgangswerten.

## Prüfung am 03.11.2026

Statistik: Wilson-Referenzwerte (17/20), Randfälle 0/n, Summen, Nullkategorien, reproduzierbare Streams, multinomialer Abstand und Intervallbreite geprüft. Je 12.000 Wiederholungen bei n = 100 und 400 für p = 31 % und 4,5 %: empirische Standardfehler stimmen mit der Theorie überein; 95%-Wilson-Abdeckung zwischen 95,6 % und 96,3 %.

Browser: alle fünf Lektionen, neue Einzelziehungen/Serien, 1.000 Umfragen mit je 5.000 Befragten, Fokuswechsel, 99%-Niveau, knappes Rennen und Verständnisfeedback geprüft. CSV-Download mit 708 Zeilen bei 100 Wiederholungen (Kopfzeile + 7 Einzelwerte + 700 Serienwerte), BOM und Dezimalkomma geprüft. Desktop und 390-Pixel-Mobilformat sichtbar kontrolliert; keine horizontalen Seitenüberläufe oder JavaScript-Fehler. Gemeinsame CI geprüft. Prüfbelege bleiben lokal unter `outputs/umfragelabor/`.

## Veröffentlichung am 09.11.2026

Studierende werden durchgehend gesiezt. Haupttitel: „Have confidence(intervals) in polls.“; die fünf Lektionsüberschriften erscheinen ohne Nummerierung. Der MethodLab-Katalog enthält acht Angebote; die App ergänzt den weiterhin verlinkten Colab-Bestand. Der bestehende Pages-Workflow prüft den Statistikkern vor dem gemeinsamen Build.
