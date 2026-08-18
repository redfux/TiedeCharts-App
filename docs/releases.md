# Änderungshistorie

Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionierung nach
[SemVer](https://semver.org/lang/de/). Die Versionsnummer wird ausschließlich in
`js/version.js` gepflegt.

## [0.1.0] – 2026-08-18

### Added

- Erste Fassung der PWA: Ebbe- und Flutzeiten, Tidenverlauf und Folgetage für europäische
  Küstenstandorte.
- Standortbestimmung per Geolocation mit automatischer Wahl der nächstgelegenen Station.
- Ortssuche über die Open-Meteo-Geocoding-API und Auswahl aus den umliegenden Stationen;
  zusätzlich direkte Suche nach Stationsnamen.
- Stationskatalog mit 286 europäischen Küstenstandorten (`js/stations.js`) samt
  Wartungsskript `scripts/update_stations.py`.
- Gezeitenberechnung aus stündlichen Wasserstandswerten: Catmull-Rom-Interpolation,
  Extremwertsuche mit parabolischer Verfeinerung, Alternierungs- und Rauschfilter.
- Kopfbereich mit Ort, Koordinaten, Station, Entfernung und Zeitzone.
- Karte „Nächster Gezeitenwechsel" mit Restzeit, Höhe, aktuellem Wasserstand und Tendenz.
- Tagesliste der Hoch- und Niedrigwasser mit Tidenhub.
- Diagramm des Tidenverlaufs als handgeschriebenes Inline-SVG mit Jetzt-Marker,
  HW/NW-Markierungen, Nachtschattierung und Werteanzeige bei Berührung.
- Ausklappbare Gezeitenzeiten für sechs Folgetage.
- Offline-Fähigkeit: App-Shell im Service Worker, Gezeitendaten je Station im
  `localStorage`, Altersangabe und Warnbanner bei veralteten Werten.
- Eigenständiges Marine-Design als Token- und Komponenten-CSS, Light/Dark/Auto mit
  Umschalter und Speicherung der Wahl.
- Selbst gezeichnetes Icon-Sprite sowie generierte App-Icons (`scripts/make_icons.py`).
- Content-Security-Policy, die außer den beiden Open-Meteo-Endpunkten alle externen
  Verbindungen unterbindet.
- Projektdokumentation: `readme.md`, `docs/features.md`, `docs/architecture.md`,
  `docs/bugs.md`, `docs/changes.md`, `THIRD_PARTY_LICENSES.md`.
