# Prüfung des lokalen Lehrprototyps

Stand 22.11.2026. Geprüft wurden die kanonische statische App und die daraus erzeugte [Offline-Einzeldatei](bundestag-entwurf.html).

## Wissenschaftliche Prüfung

| Gegenstand | Ergebnis |
| --- | --- |
| Abgeordnete | Das R-Skript reproduziert alle 15 gerundeten Anhangswerte aus der OSF-Datei. Nenner sind 9.406 Personen-Wahlperioden mit bekannter Bildung. 1969 gehören 191 von 552 zur betrachteten Gruppe, 2021 sind es 63 von 725. |
| Nominierung | Original und Aufbereitungscode prüfen den Erfolg über mindestens einen der verfügbaren Wege je Vorwahl. Der Weg kann zwischen den Wahlen wechseln. Das Lehrbeispiel ergibt über den Wahlkreis einen Treffer, über die Liste zwei und zusammen drei. |
| Beobachtete Befunde | Wahlerfolge 6/53/93 % innerhalb der drei Kategorien, ungewichtet. Für den Vergleich nach Bildung und Laufbahn wurden ausschließlich die sechs Originalbalken aus Abb. 4 übernommen. Beide Felder zeigen 0–30 % und haben dieselbe Kategorienreihenfolge. Die 3/70 % bezeichnen gewichtete Amtsinhaberanteile unter den unsicher bzw. sicher Nominierten. |
| Modellrechnung | Geordnetes Logitmodell mit 1.403 Fällen aus Anhang Tab. A2. Gegenprüfung der beiden Odds Ratios und ihrer 95%-Wald-Intervalle. Bei einer **gesetzten** Ausgangschance von 50 % ergibt die Transformation 40 % (31–49 %) und 62 % (52–71 %). Das sind bedingte Beispielwerte. |
| Grenzen | Im Original unterscheiden sich Abbildung 6 und Text. Die Vertiefung weist darauf hin. Eine Neuschätzung des GLES-Modells erfordert Vertragsdaten. Die Studie erlaubt weder eine kausale Aussage über Diskriminierung noch die Rangordnung der drei möglichen Auswahlhürden. |

Der [Quellennachweis](tools/QUELLEN.md) enthält Dateiversionen, Prüfsummen, Selektionsregeln, Gewichtung und Rechenweg. Der Online-Export und die Verarbeitung der geprüften lokalen OSF-Datei erzeugten dieselben Aggregate.

## Technischer und visueller Durchlauf

- Gemeinsame TU-Gestaltung synchronisiert und alle 27 CI-Dateien geprüft. JavaScript-Syntax und Generierung der Einzeldatei geprüft. Der exportierte Stand besteht aus statischem HTML, CSS, JavaScript, Logo, zwei Grafikausschnitten und Studienaggregaten.
- Chromium/Chrome unter Windows, Ansichtsgrößen 1440 × 900, 1280 × 720, 1024 × 768, 390 × 844 und 320 × 700 Pixel. Lokale HTTP-Auslieferung, lokaler Dateieinstieg und die eingebetteten Ressourcen der Einzeldatei geprüft. In den Durchläufen mit reduzierter Bewegung traten weder horizontale Seitenüberläufe noch JavaScript-Fehler auf.
- Pflichtauswahl beim Absenden, freiwilliger Durchlauf ohne Eingabe, Stichwort mit Umlauten, Rückmeldung und Wiedervorlage, Neuladen, alle drei Kandidaturvarianten und die Transferauflösung geprüft. Die Bedienelemente funktionieren per Tastatur. Der Beamermodus erreicht über die Pfeiltasten alle acht Stationen. Escape führt zur Navigation zurück.
- Auf Desktop wechseln die drei Befundgrafiken beim Erreichen ihrer Texte. Auf Tablet und Smartphone stehen sie im Lesefluss. Bildungsreihe, beide Originalfelder, Erfolgsdiagramm, Konfidenzintervalle, Beschriftungen und Rechentabelle wurden als gerenderte Ansichten kontrolliert. Die Beamersteuerung hat eine eigene Zeile im Navigationsbereich. Die historische Grafik verwendet auf schmalen Geräten größere Achsenbeschriftungen.
- Die Offline-Datei benötigt beim Lesen und Bedienen keine Netzverbindung. Antworten verlassen das Dokument nicht. Die rund zehn Minuten sind eine Unterrichtsplanung. Ein zeitlich gemessener Einsatz mit Studierenden und ein Test an einem physischen Hörsaalbeamer stehen aus.

Wiederholung mit [check_browser.cjs](tools/check_browser.cjs). Die erzeugten Screenshots liegen lokal unter `outputs/bundestag-qa/` im Projektstamm.

## Veröffentlichungsprüfung am 23.11.2026

Der Platztausch im Listenbeispiel hält die Stimmenverteilung konstant. Die Erläuterung zu Kontakten und Delegierten wurde mit dem Theorieteil (S. 25–27) und der Zusatzanalyse zur wöchentlichen Parteiarbeit (S. 37–38, Abb. 9) abgeglichen. Das gebaute MethodLab-Paket hat den Browserdurchlauf in den fünf genannten Fenstergrößen bestanden, einschließlich der per Tastatur aufklappbaren Vertiefung. Desktop- und Mobilansicht der neuen Erklärung sowie die Beameransicht wurden sichtbar geprüft.
