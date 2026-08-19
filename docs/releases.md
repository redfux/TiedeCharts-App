# Änderungshistorie

Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionierung nach
[SemVer](https://semver.org/lang/de/). Die Versionsnummer wird ausschließlich im Meta-Tag
`app-version` in `index.html` gepflegt; `js/version.js` liest sie von dort.

## [0.1.6] – 2026-08-19

### Fixed

- Firefox für Android markierte beim Tippen auf die Aufklapp-Zeile eines Folgetages Text und
  zeigte die Kopieren-Leiste. Bedienelemente (Aufklapp-Zeilen, Schaltflächen, Listenzeilen der
  Stationsauswahl) und das Diagramm sind jetzt von der Textauswahl ausgenommen; Datenzeilen
  bleiben markierbar. Details in `docs/bugs.md`.

## [0.1.5] – 2026-08-19

### Changed

- Die vier Kennzahlen der Übersichtskarte verteilen sich in der einzeiligen Darstellung
  gleichmäßig über die volle Breite (`space-between`) statt in gleich breiten Spalten zu
  stehen. Die erste steht am linken, der Tidenhub am rechten Rand und ist rechtsbündig
  gesetzt; die Zwischenräume sind gleich groß.

## [0.1.4] – 2026-08-19

### Changed

- Der Tidenhub steht wieder als vierte Kennzahl in der Reihe unter der Uhrzeit, nicht mehr
  neben ihr.
- Die Kennzahlen stehen als einzeilige Reihe zu vier, sobald der Bildschirm dafür breit genug
  ist, und nur darunter als 2×2-Raster. Die Grenze liegt bei 400 px Viewport-Breite: gemessen
  an den längstmöglichen Inhalten („auflaufend", „−99,99 m") braucht die Reihe 392 px, ein
  Pixel 9a (412 px) liegt also darüber, ein iPhone 13 (390 px) darunter.

## [0.1.3] – 2026-08-19

### Changed

- Der Tidenhub steht jetzt rechts neben der großen Uhrzeit in der Übersichtskarte, in der
  kleinen Schriftgröße der Kennzahlen und an der Unterkante der Uhrzeit ausgerichtet.
- Die Kennzahlen darunter stehen wieder als einzeilige Reihe zu drei (Höhe dann, Aktuell,
  Tendenz); das 2×2-Raster aus 0.1.1 ist entfallen.

## [0.1.2] – 2026-08-19

### Fixed

- Der Footer zeigte nach einer Aktualisierung weiter die alte Version, und neue Programmstände
  kamen nicht auf dem Gerät an. Ursache war ein Kreisschluss: die Versionsnummer stand in
  `js/version.js`, wurde aber selbst aus dem Cache des Service Workers geliefert – damit blieb
  der daraus gebildete Cache-Name unverändert und der Cache wurde nie erneuert.

### Changed

- Die Versionsnummer steht jetzt im Meta-Tag `app-version` in `index.html` (weiterhin genau
  eine Stelle). `index.html` wird immer zuerst aus dem Netz geholt, die Nummer ist also nie
  veraltet; `js/version.js` liest sie aus dem Dokument.
- Statische Dateien liefert der Service Worker nach dem Muster stale-while-revalidate statt
  cache-first: der Cache antwortet weiterhin sofort, wird aber im Hintergrund erneuert. Ein
  neuer Stand kommt damit beim nächsten Start an, auch ohne Versionssprung.

### Added

- Hinweis mit Schaltfläche „Jetzt neu starten", sobald eine neuere Version installiert wurde.
  Der laufende Code stammt aus dem Cache; ohne diesen Hinweis bliebe eine stille Altversion
  aktiv, bis der Nutzer zufällig neu lädt.

## [0.1.1] – 2026-08-19

### Added

- Kennzahl „Tidenhub" in der Übersichtskarte, rechts neben der Tendenz: der maximale
  Tidenhub des laufenden Tages in Metern.

### Changed

- Kennzahlen der Übersichtskarte als 2×2-Raster auf Telefonen und als einzeilige Reihe ab
  480 px Breite, damit kein Wert umbricht und keine einzelne Kennzahl in einer eigenen Reihe
  hängt.
- Die Zeile „Tidenhub heute" in der Karte „Heute" entfällt, weil der Wert nun direkt darüber
  in der Übersicht steht.

### Fixed

- Fehlender Abstand zwischen der Ortsauswahl-Karte und der Übersichtskarte. Ursache war der
  leere Platzhalter für Statusmeldungen zwischen beiden Karten: er unterbrach den
  Nachbar-Selektor `.card + .card`. Der Seitenabstand kommt jetzt aus einem Grid-Abstand und
  ist zwischen allen Kästen gleich (12 px), auch wenn eine Statusmeldung sichtbar ist.

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
