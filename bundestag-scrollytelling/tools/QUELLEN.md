# Datengrundlage des Bundestag-Scrollytellings

Stand der Prüfung: 22. November 2026.

Lea Elsässer und Jonas Wenker (2026). *Chosen (not) to win? Party nomination strategies and the unequal class representation in parliament.* European Journal of Political Research 65, 22–42. Online erschienen am 30. September 2025. Der Aufsatz und die Projektmaterialien auf OSF nennen CC BY 4.0. Die App verwendet eigene Grafiken und Berechnungen auf Grundlage der Studie. Für die drei zugrunde liegenden GLES-Erhebungen gilt ein gesonderter Datenzugang. [Aufsatz](https://doi.org/10.1017/S1475676525100017) · [Online-Anhang](https://static.cambridge.org/content/id/urn%3Acambridge.org%3Aid%3Aarticle%3AS1475676525100017/resource/name/S1475676525100017sup001.pdf) · [OSF-Projekt](https://doi.org/10.17605/OSF.IO/C6KWV) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Welche Zahlen stammen woher?

| Inhalt in der App | Einheit und Auswertung | Nachweis |
| --- | --- | --- |
| Bildungsprofil 1969–2021 | Anteil der erfassten Abgeordneten einer Wahlperiode ohne tertiäre Bildung vor dem Ersteinzug, unter denen mit bekannter Bildung. Jede Person kann in mehreren Wahlperioden vorkommen. | Eigene Berechnung mit `mpdata.rds` nach dem Code für Abb. 1. Alle 15 gerundeten Werte stimmen mit Anhang Tab. A1, S. 5 überein. |
| Wer wurde gewählt? | Historischer Mandatsgewinn innerhalb jeder Nominierungskategorie. Das Auswertungsskript bildet den ungewichteten Mittelwert von `elected` mit gültigen Angaben. | S. 29 berichtet 6 % für unsichere, 53 % für umkämpfte, 93 % für sichere Nominierungen. Vgl. Anhang Abb. A4. |
| Wer hat schon ein Mandat? | Anteil der Amtsinhaberinnen und Amtsinhaber innerhalb der Nominierungskategorie. Abb. 4 gewichtet mit dem GLES-Kandidierendengewicht `weight_c`. | S. 33 berichtet 3 % unter den unsicher und 70 % unter den sicher Nominierten. Für das Bildungs- und Berufsprofil ist die Richtung der Unterschiede im Text belegt. |
| Profilvergleich | Modellwahrscheinlichkeit einer sicheren Nominierung für drei Varianten desselben Profils. Im Export stehen die gerundeten Prozentwerte des Fließtexts. | S. 34 berichtet 67 %, 76 % und 84 %. Das OSF-Analyseskript dokumentiert die Profilwerte und rundet die vorhergesagten Wahrscheinlichkeiten auf zwei Dezimalstellen. |
| Unsicherheit der Gruppenunterschiede | Zwei adjustierte Odds Ratios mit 95%-Wald-Intervallen aus dem gemeinsamen ordinalen Logitmodell. | Eigene Transformation der Koeffizienten und Standardfehler in Anhang Tab. A2, S. 6, Spalte *Full Model*. |

### Historische Reihe

Das OSF-Analysefile bildet je Wahljahr den ungewichteten Mittelwert von `educ_low` und überspringt fehlende Angaben. Von 9.569 Personen-Wahlperioden haben 9.406 eine gültige Angabe. Die Endpunkte sind 191 von 552 (1969) und 63 von 725 (2021). Die Jahre bezeichnen Wahlperioden. Diese Nenner entsprechen den erfassten Biografien der jeweiligen Periode und können von der Sitzzahl bei der konstituierenden Sitzung abweichen. Die Aufbereitung berücksichtigt Wahlperioden 6 bis 20 und schließt die im Datensatz als Volkskammerabgeordnete gekennzeichneten Fälle aus. Die App zeigt für diese historische Bestandsbeschreibung keine Stichprobenintervalle. [GerCaMP-Auswertungsdaten](https://osf.io/zyhvw/)

### Fallauswahl und Messung bei den Kandidierenden

Die drei GLES-Befragungen zu den Bundestagswahlen 2013, 2017 und 2021 haben einen Rücklauf zwischen 29 und 41 %. In der deskriptiven Gruppenanalyse und im Hauptmodell sind CDU, CSU, FDP, SPD, Grüne und Linke vertreten. Der Rückblick auf drei zurückliegende Bundestagswahlen ist für die AfD im Untersuchungszeitraum ungeeignet. Die Autor:innen entfernen Kandidaturen ohne Wahlkreis, deren Listenrang den höchsten erfolgreichen Rang der Partei im Land während der letzten drei Wahlen um mehr als 50 % übersteigt. Abbildung A4 berechnet den beobachteten Wahlerfolg direkt im aufbereiteten Datenobjekt; Abbildung 4 setzt im Skript eigens den Filter für die sechs genannten Parteien.

Für jede der drei Vorwahlen prüft der Aufbereitungscode, ob ein Wahlkreis- **oder** ein Listenerfolg möglich gewesen wäre. Ein Erfolg über beide Wege zählt einmal. Die Summe ergibt 0 (unsicher), 1 bis 2 (umkämpft) oder 3 (sicher). Der erfolgreiche Weg kann je Vorwahl wechseln. Bei reiner Listen- oder Wahlkreiskandidatur zählt der verfügbare Weg. Für neu zugeschnittene Wahlkreise rekonstruiert die Studie Vorgänger oder mittelt Ergebnisse aus überlappenden Gebieten. [Aufsatz, S. 29–30](https://doi.org/10.1017/S1475676525100017)

Die Autor:innen nähern die soziale Klasse durch die eigene Bildung an. Im GLES-Code ist `wc2 = 1` bei ISCED bis 4 und ohne laufendes Studium. Studierende und Personen mit kurzen tertiären Abschlüssen, etwa einer Meisterqualifikation, gehören nicht zu dieser Gruppe. In der Abgeordnetenreihe zählt auch ein vor dem Ersteinzug begonnenes, unvollendetes Studium als Hochschulbildung.

Der Berufsindikator hat eine eigene Definition. In der Abgeordnetenreihe sind höchstens fünf Jahre Berufserfahrung außerhalb politiknaher Tätigkeiten vor dem ersten Mandat maßgeblich. In der GLES-Analyse setzt der Indikator `careerist_both` einen Hochschulabschluss ab ISCED 6 voraus. Hinzu kommt ein Abstand von höchstens fünf Jahren seit dem geschätzten Abschlussalter, oder höchstens zehn Jahren mit früherer politiknaher Tätigkeit. Der Bezugspunkt ist bei bereits Gewählten der Ersteinzug, sonst das Alter im Wahljahr. Der Referenzgruppe gehören Personen an, auf die keiner der beiden Indikatoren zutrifft. [Aufbereitungscode](https://osf.io/9rm6h/)

### Modell und widersprüchliche Abbildung

Das vollständige ordinale Logitmodell nutzt 1.403 Beobachtungen mit vollständigen Modellangaben. Es berücksichtigt Amtsinhaberschaft, Altersgruppe, Bildung, politiknahe Berufsbiografie, Geschlecht, Urbanität und Migrationshintergrund sowie Indikatoren für Partei, Land und Wahljahr. Das OSF-Skript ruft `MASS::polr` ohne Gewichtungsargument auf. Das Vergleichsprofil ist ein Mann der SPD aus Nordrhein-Westfalen, seit einer Wahlperiode im Amt, 2021 zwischen 51 und 65 Jahre alt, wohnhaft in einer kleinen oder mittleren Stadt, ohne Migrationshintergrund. Der Code setzt `age_group = "3"`, was einem Alter über 50 bis einschließlich 65 entspricht. Die drei Zeilen unterscheiden sich ausschließlich in `wc2` und `careerist_both`. [Analysecode](https://osf.io/729pb/)

Die im Original-PDF sichtbaren Balkenhöhen in Abb. 6 (S. 35) widersprechen den im Fließtext (S. 34) berichteten Werten. Beide beziehen sich dem Wortlaut nach auf dasselbe Profil. Der Code erzeugt Text und Grafik aus demselben Objekt. Die Ursache der Abweichung in der Druckfassung bleibt offen. Der Export verwendet ausschließlich die drei im Fließtext bezifferten Profilwahrscheinlichkeiten. Eine Konsistenzprüfung im Exportskript bestätigt, dass sich alle drei gerundeten Zahlen mit einer gemeinsamen Referenzwahrscheinlichkeit und den beiden publizierten Logitkoeffizienten vereinbaren lassen. Eine unabhängige Neuschätzung der absoluten Wahrscheinlichkeiten aus Einzelfällen war nicht möglich.

Für die Unsicherheit berechnet das Skript aus β und seinem Standardfehler die übliche Normalapproximation `exp(β ± qnorm(0.975) × SE)`. Für den Bildungsindikator beträgt β −0,413 (SE 0,187), für die politiknahe Berufsbiografie 0,491 (SE 0,203). Daraus ergeben sich Odds Ratios von 0,662 [0,459; 0,955] und 1,634 [1,098; 2,432] gegenüber der Referenz. Im proportionalen Odds-Modell misst das Verhältnis die relativen Chancen, oberhalb einer Kategorienschwelle zu liegen. Der Zusammenhang gilt bei ansonsten gleichen Merkmalen für beide Schwellen. Eine OR von 1 bedeutet gleiche Odds. Die Intervalle der Odds Ratios beschreiben die Unsicherheit dieser Gruppenvergleiche. Um Intervalle für die absoluten Profilwahrscheinlichkeiten zu berechnen, wären auch die Kovarianzen des Modellfits einschließlich der Schwellen nötig. Die publizierte Tabelle liefert dafür keine Grundlage. [Online-Anhang, Tab. A2](https://static.cambridge.org/content/id/urn%3Acambridge.org%3Aid%3Aarticle%3AS1475676525100017/resource/name/S1475676525100017sup001.pdf)

### Darstellung im Lernpfad

Der Platztausch auf der Landesliste hält die Stimmenverteilung im Gedankenbeispiel fest. Die Beispiele zu Parteikontakten und zur Einschätzung durch Delegierte erläutern mögliche Gründe für die Platzvergabe aus dem Theorieteil (S. 25–27). Die ergänzende Auswertung berücksichtigt die selbst berichteten Wochenstunden für Parteiarbeit. Beide Gruppenunterschiede bleiben statistisch erkennbar (S. 37–38, Abb. 9 links). Weder Kontakte zu einzelnen Delegierten noch deren konkrete Auswahlentscheidungen werden damit gemessen. [Originalstudie](https://doi.org/10.1017/S1475676525100017)

Der Kernpfad setzt für das Vergleichsprofil eine Wahrscheinlichkeit von 50 % an. Die zugehörigen Odds betragen 1. Bei diesem festen Ausgangswert sind die Wahrscheinlichkeiten der beiden anderen Gruppen `OR / (1 + OR)`. Die monotone Transformation beider Grenzen des Wald-Intervalls ergibt bedingte 95%-Intervalle von rund 31–49 % und 52–71 % bei Punktschätzern von 40 % und 62 %. Die Annahme über die Ausgangschance hat keine geschätzte Unsicherheit. Die drei Prozentwerte für das konkrete NRW-Profil stehen ausschließlich in der Erläuterung der Quellenabweichung.

Für den beobachteten Bildungs- und Berufsvergleich übernimmt `extract_figure4.py` die sechs Balken pixelgetreu aus den beiden unteren Feldern der Originalabbildung 4. Geprüft sind die PDF-Prüfsumme, die Abbildung auf Druckseite 34, die identische vertikale Kalibrierung und die Reihenfolge der Kategorien. Die Lehrgrafik beschneidet den leeren oberen Bereich auf 30 %, beschriftet Achsen und Gruppen auf Deutsch und behält die Balken der Vorlage bei. Die Auswertung erzeugt keine geschätzten Zahlen aus Bildkoordinaten. Der Text berichtet die im Aufsatz beschriebenen Richtungen und die dort bezifferten Amtsinhaberanteile. [Abb. 4 im Aufsatz](https://doi.org/10.1017/S1475676525100017)

## Zugriff und erneute Berechnung

Das OSF-Projekt stellt vier Dateien bereit. Alle vier wurden am Prüftag heruntergeladen und mit dem öffentlichen Dateikatalog abgeglichen. Die Kandidierenden-Einzelfälle und das im Analysecode eingelesene Objekt `arb_cand_study.rds` gehören nicht dazu. GESIS führt ZA5716 (2013), ZA6814 (2017) und ZA7704 (2021) in Zugangsklasse C mit Datenantrag und Vertragslösung. In den lokalen Datenprojekten wurde kein passendes Analyseobjekt gefunden. Die Quellprüfung beruht bei diesen Ergebnissen auf Aufsatz, Anhang und Replikationscode. [OSF-Dateikatalog](https://api.osf.io/v2/nodes/c6kwv/files/osfstorage/) · [GESIS-Datenzugang](https://www.gesis.org/fileadmin/admin/neu_Dateiablage_allgemein/Datenzugang_GLES-Kandidierendenstudie.pdf)

| Datei | SHA-256 des geprüften Originals |
| --- | --- |
| [mpdata.rds](https://osf.io/zyhvw/) | `eebd15d74dd93dc3c6875bc6fffb586ad9d3fec22c96032b5854e4887b84711e` |
| [listdata.rds](https://osf.io/wb6pd/) | `b52717a72217cf93834b5463e7160e356324e6abf87fce8f7703f2a2b6ceeffe` |
| [Analyse-QMD](https://osf.io/729pb/) | `90ed5f9ca126380f972df48078a790600a36be33eb10dcd95870560c8a46355a` |
| [Aufbereitungs-QMD](https://osf.io/9rm6h/) | `d871755000ecfa86233d13ef25169c2db4e6fb33814d47288fd52e1d7947f6d7` |
| Lokales Verlags-PDF | `823dedd812805ca6b56ddd722bd3dbccc6710ca05be1f14befc6e7b7af00aa50` |
| Verlagsanhang | `fa4f7095c4713083e8287bf34a264a8877479974486ccc067a4aa38aecc904d2` |

Im Projektstamm lässt sich der Export mit R und dem vorhandenen Paket `jsonlite` wiederholen. Ohne Dateiangabe lädt das Skript ausschließlich die geprüfte Abgeordnetendatei in ein temporäres Verzeichnis. Für die Offline-Reproduktion kann ihr lokaler Pfad als einziges Argument übergeben werden.

```powershell
Rscript bundestag-scrollytelling/tools/export_study.R
```

Das Skript prüft die Eingabedatei, alle gerundeten Jahreswerte und die Fallzahlen. Es erzeugt ausschließlich `site/study-data.js`. Darin enthält `history` pro Wahlperiode Prozentwert, gültigen Nenner und gesamten Bestand; `elected`, `observed` und `model` enthalten berichtete Prozentwerte. Nur `oddsRatios` enthält berechnete Intervallgrenzen auf der Verhältnisskala. Die App lädt alle diese Aggregate lokal.
