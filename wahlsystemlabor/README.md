# Wahlsystemlabor

Interaktiver Lehrentwurf zum Conjoint-Experiment von Jankowski, Linhart und Tepe (2019).

**[Wahlsystemlabor öffnen](https://cstecker.github.io/politicsRLab/wahlsystemlabor/)** · **[MethodLab-Startseite](https://cstecker.github.io/politicsRLab/)**

## Was die App bietet

- Fünf Paarvergleiche mit den sechs Merkmalen und Ausprägungen aus Tabelle 1 der Originalstudie.
- Zufällige, je Testperson konstante Merkmalsreihenfolge; unabhängig kombinierte Ausprägungen. Beim Neuladen bleiben die Profile erhalten.
- Lehrmodus: neue Profile auslosen oder eine Eigenschaft gezielt verändern.
- Ergebnisdemo mit ausdrücklich simulierten Daten, drei Präferenzszenarien, AMCE und nach Personen geclusterten 90-/95%-Konfidenzintervallen.
- CSV-Export beider Profile jeder Entscheidung und ein [R-Skript](site/auswertung.R) zum Nachrechnen.

**Dies ist eine Testfassung ohne gemeinsame Hörsaalerhebung.** Eigene Entscheidungen werden ausschließlich im lokalen Speicher des jeweiligen Browsers abgelegt. Lehransichten sind frei zugänglich; sie besitzen noch keine Dozentensteuerung oder serverseitige Ergebnisfreigabe. Lokale Testdaten und simulierte Daten werden getrennt gehalten.

Grundlage: Jankowski/Linhart/Tepe (2019), *Politische Vierteljahresschrift* 60: 221–243, [DOI](https://link.springer.com/article/10.1007/s11615-019-00152-2). Merkmale: Tabelle 1, **S. 230**; Beispielsituation: **S. 231**; Ergebnisse: **S. 233–234**. Einführung und Erläuterungen sind eigene Lehrtexte, keine wortgetreue Replikation des Fragebogens. Es werden keine Originalantworten oder Originalschätzwerte als Simulationsdaten ausgegeben.

## Lokal starten

Aus diesem Ordner einen statischen Server starten, beispielsweise:

```text
python -m http.server 4187 --bind 127.0.0.1 --directory site
```

Alternativ `node scripts/build-standalone.mjs` ausführen und `outputs/wahlsystemlabor-entwurf.html` im Browser öffnen. Die portable Fassung enthält JavaScript, CSS, das unveränderte TU-Logo und das R-Skript. Es werden keine zusätzlichen Pakete benötigt.

Die gemeinsame institutionelle Gestaltung wird aus dem Projektstamm synchronisiert: `python tools/sync_brand.py`, Kontrolle mit `--check`.

## Statistik und Prüfung

Lineares Wahrscheinlichkeitsmodell mit Konstante und Behandlungskodierung aller sechs Merkmale. Referenz bei Parteienvielfalt: „nur größere“; bei den übrigen Merkmalen die jeweils erste Ausprägung. Clusterrobuste CR1-Varianz auf Personenebene, Korrektur `G/(G−1) × (N−1)/(N−K)` und Student-t-Intervalle mit `G−1` Freiheitsgraden. Die Simulation ist ungewichtet. Personen, Paarentscheidungen und Profilzeilen werden getrennt ausgewiesen.

```text
node --test tests/design.test.mjs
node scripts/check-r.mjs
```

Die Tests prüfen das Design, Wiederherstellung, vollständigen Export, Ausprägungshäufigkeiten, t-Quantile und Schätzbarkeit. Der zweite Befehl benötigt R und vergleicht drei Datensätze mit einer unabhängigen `lm`- und Cluster-Sandwich-Berechnung. `RSCRIPT` kann bei Bedarf den Pfad zur R-Laufzeit setzen. Prüfdateien unter `outputs/` werden nicht veröffentlicht.

Der Quellstand unter `wahlsystemlabor/` ist die kanonische Fassung für GitHub Pages. Spätere gemeinsame Kursrunden benötigen zusätzlich einen Server für Runden, Profilzuteilung, Abgaben, Dozentenrechte und Ergebnisfreigabe.
