# Anforderungen

Ausgangspunkt ist der Auftrag: eine kleine, PWA-fähige Web-App, die Tidenhub bzw. Ebbe und
Flut mit Uhrzeiten und Grafik anzeigt.

## Umgesetzt (v0.1.0)

| # | Anforderung | Umsetzung |
| --- | --- | --- |
| A1 | PWA-fähig, primär Handy | Manifest, Service Worker, Installations-fähig; Layout auf Hochformat ausgelegt, Tablet unterstützt |
| A2 | Aktuelle Position nutzen, nächstgelegene Messstation | Geolocation → nächste Station aus `js/stations.js` (Luftlinie, Haversine) |
| A3 | Beliebigen Ort angeben, aus nahegelegenen Stationen wählen | Ortssuche (Open-Meteo Geocoding) → Liste der 8 nächsten Stationen zum Treffer; zusätzlich direkte Stationssuche |
| A4 | Nur öffentlich verfügbare Daten, möglichst eine zentrale Quelle mit freiem API-Zugriff | Ausschließlich Open-Meteo (Marine + Geocoding), kein API-Key, CC BY 4.0 |
| A5 | Fokus Europa | Stationskatalog mit 286 Standorten von Island bis Schwarzes Meer |
| A6 | Oben aktueller Ort und genutzte Messstation | Kopfkarte mit Ort, Koordinaten/Region, Station, Entfernung, Zeitzone |
| A7 | Darunter tagesaktuelle Ebbe-/Flutzeiten | Karte „Heute" mit allen Hoch-/Niedrigwassern, Höhe, Restzeit, Tidenhub |
| A8 | Darunter Diagramm mit dem Tidenverlauf über den aktuellen Tag | Eigenes Inline-SVG, 24 h, Jetzt-Marker, HW/NW-Marker, Nachtschattierung, Werteanzeige bei Berührung |
| A9 | Darunter Tidenzeiten der nächsten Tage, ausklappbar | Sechs Folgetage als `<details>`-Akkordeon mit Vorschau der Hochwasserzeiten |
| A10 | Masterprompt beachten | Flache Struktur, keine externen Nachladungen zur Laufzeit, CSP, Tokens/Komponenten getrennt, Light/Dark, deutsche Doku, englische Code-Kommentare, Footer mit Hinweis und Version |

## Bewusst nicht enthalten

- **Amtliche Gezeitenvorausberechnung** (z. B. BSH für die deutsche Küste). Wäre genauer,
  bedeutet aber einen zweiten Datenpfad und einen weiteren Host; als Option in
  `docs/changes.md` vermerkt.
- **Flussgezeiten weit im Binnenland** (Hamburg, Bremen, Antwerpen). Das 8-km-Gitter des
  Modells löst solche Ästuare nicht auf; entsprechende Pegel fehlen daher im Katalog.
- **Karte zur Stationsauswahl.** Kartenmaterial ließe sich nicht ohne externe Tiles laden.
- **Wetter, Wellen, Wind.** Bewusst außerhalb des Funktionsumfangs.

## Nicht-funktionale Anforderungen

- Kein Build, keine Laufzeit-Abhängigkeiten, keine Fremd-Libraries im Browser.
- Content-Security-Policy erlaubt genau zwei externe Hosts (die beiden Open-Meteo-APIs).
- Kein Tracking, keine Analytics, keine Cookies. Gespeichert werden nur die eigene
  Ortswahl und die letzten Gezeitendaten im `localStorage` des Geräts.
- Bedienbar mit Tastatur, sinnvolle Beschriftungen für Screenreader, Kontraste in beiden
  Farbschemata.
