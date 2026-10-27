# Gemeinsame Gestaltung für politicsRLab

Kopfzeile aller Lehr-Apps: vollständige TU-Wort-Bildmarke links; daneben **[Politisches System Deutschlands und Vergleich politischer Systeme](https://www.politikwissenschaft.tu-darmstadt.de/institut/arbeitsbereiche_und_nachwuchsgruppen/de_vergleich/index.de.jsp)**; darunter **Prof. Dr. Christian Stecker**. Der Titel der jeweiligen App folgt als eigenes Element darunter. Die Identität wird in [identity.json](identity.json) gepflegt.

## Gestaltung

| Element | Festlegung |
| --- | --- |
| Hauptfarbe | TU-Blau #005AA9 |
| Interaktion dunkel / helle Fläche | #004680 / #E7F1FB |
| Text / Nebentext | #1F2933 / #596773 |
| Hintergrund / Inhaltsfläche | #F5F7F9 / Weiß |
| Schrift | Arial, Helvetica, sans-serif; keine externen Schriftabrufe |
| Diagramme | Parteifarben und funktionale Akteursfarben beibehalten; Farben durch Beschriftungen ergänzen |

Das originale SVG wird vollständig und proportional auf weißem Grund gezeigt. Schutzraum ist Bestandteil der Originaldatei; nicht beschneiden, umfärben oder mit dem Arbeitsbereich zu einem neuen Logo verschmelzen. Die Kopfzeile darf auf kleinen Bildschirmen umbrechen. Der Arbeitsbereich ist anklickbar; das Logo führt zur TU. Die Beameransicht verwendet dieselbe Kopfzeile kompakter.

## In Apps übernehmen

    python tools/sync_brand.py
    python tools/sync_brand.py --check

Das Skript verwendet nur die Python-Standardbibliothek. Es erzeugt für React eine Komponente und kopiert CSS und SVG; bei der statischen Anwendung aktualisiert es einen markierten Headerblock. Jede App erhält eigene, identische Asset-Kopien und bleibt ohne übergeordnete Laufzeitabhängigkeit veröffentlichbar. Fehlende App-Checkouts werden übersprungen. Die Logik der Apps wird durch den Synchronisationsschritt nicht verändert. Neue Apps in [tools/sync_brand.py](../tools/sync_brand.py) ergänzen, die institutionelle Kopfzeile übernehmen und danach auf Desktop und Mobilgerät prüfen.

## Herkunft und Grenzen

Original-Logo: [öffentlich verwendetes TU-Web-SVG](https://www.tu-darmstadt.de/media/resources/images_1/tu_logo_web.svg), heruntergeladen am 26.10.2026; SHA-256 in identity.json. Die Datei wurde unverändert übernommen. Grundlage der Gestaltung: [Corporate Design der TU Darmstadt](https://www.intern.tu-darmstadt.de/arbeitsmittel/corporate_design_vorlagen/), [Shortmanual, Stand November 2025](https://www.intern.tu-darmstadt.de/media/medien_stabsstelle_km/services/medien_cd/TUDa_Shortmanual.pdf) und [Hinweise zur Web-Farbgestaltung](https://www.webteam.tu-darmstadt.de/hilfe/details_23808.de.jsp). Arial ist für Webanwendungen vorgesehen; TU-Blau stammt aus der offiziellen Palette. Diese Umsetzung ist eine gemeinsame Gestaltung der Lehr-Apps, keine durch die TU gesondert freigegebene neue Wort-Bildmarke.
