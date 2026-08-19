# Architektur und technische Entscheidungen

## Überblick

TiedeCharts ist eine statische, buildfreie Web-App aus ES-Modulen. Es gibt kein Backend:
der Browser fragt die Gezeitendaten direkt bei Open-Meteo ab und rechnet alles Weitere
selbst.

```
Geolocation ─┐
             ├─→ Position ─→ nächste Station (js/stations.js, lokal)
Ortssuche ───┘                    │
                                  ▼
                    Open-Meteo Marine API (stündlicher Wasserstand)
                                  │
                                  ▼
              js/tides.js  Spline-Interpolation + Extremwertsuche
                                  │
        ┌─────────────────┬───────┴────────┬────────────────────┐
        ▼                 ▼                ▼                    ▼
   Kopfbereich       Heute-Liste     SVG-Diagramm        Folgetage
```

| Datei | Aufgabe |
| --- | --- |
| `js/app.js` | Zustand, Ablaufsteuerung, Speicher, Ereignisbehandlung |
| `js/api.js` | Zugriff auf die beiden Open-Meteo-Endpunkte, Fehlerübersetzung |
| `js/stations.js` | Stationskatalog + Nächste-Nachbarn-Suche + Namenssuche |
| `js/tides.js` | Interpolation, Hoch-/Niedrigwassererkennung, Tagesgruppierung |
| `js/chart.js` | SVG-Diagramm inklusive Berührungs-/Zeigerinteraktion |
| `js/sun.js` | Sonnenauf-/-untergang für die Nachtschattierung |
| `js/format.js` | Zeit-, Höhen- und Entfernungsformatierung (deutsch) |
| `js/ui.js` | DOM-Aufbau der Ansichten |
| `js/version.js` | liest die Versionsnummer aus dem Meta-Tag `app-version` |
| `sw.js` | Offline-Cache der App-Shell |

## Datenquelle: warum Open-Meteo

Verglichen wurden:

| Quelle | Abdeckung | API-Key | Bewertung |
| --- | --- | --- | --- |
| **Open-Meteo Marine** (`sea_level_height_msl`) | global, Modell ~8 km | nein | **gewählt**: keine Registrierung, CORS offen, CC BY 4.0, ganz Europa mit einem Codepfad |
| Open-Meteo Geocoding | global | nein | **gewählt** für die Ortssuche, gleicher Anbieter |
| BSH (`gdi.bsh.de/ldproxy/.../WaterLevelForecast`) | nur Deutschland | nein | amtliche HW/NW-Zeiten, aber nur DE → zweiter Codepfad; als späteres Extra vorgemerkt |
| PEGELONLINE (WSV) | nur Deutschland | nein | Messwerte und Pegel-Metadaten, keine Vorhersage; dient als Quelle für den Stationskatalog |
| WorldTides, TideCheck, TidesAtlas, UKHO Admiralty, SHOM, DMI | Europa bzw. national | **ja** | ausgeschlossen: ein Key in einer statischen Client-App ist ein offengelegtes Secret |
| NOAA CO-OPS | nur USA | nein | außerhalb des Fokus |

Konsequenz aus der Modellquelle: Höhen beziehen sich auf MSL statt Seekartennull, und die
Werte sind eine Modellrechnung, keine amtliche Vorausberechnung. Beides ist in der
Oberfläche benannt (Fußnote unter dem Diagramm, Footer-Hinweis).

## Stationsbegriff

Die Marine-API kennt keine Messstationen, sondern nur Gitterzellen. Damit die geforderte
Auswahl „nächstgelegene Messstation" funktioniert, bringt die App ihren eigenen Katalog mit
(`js/stations.js`, 286 Standorte). Vorteile: offline verfügbar, keine weiteren Hosts in der
CSP, stabile Namen. Nachteil: der Katalog muss gepflegt werden – dafür gibt es
`scripts/update_stations.py`.

Die Koordinaten liegen bewusst auf offenem Wasser (Hafeneinfahrt, Reede). Zusätzlich wird
`cell_selection=sea` gesetzt, und `js/api.js` probiert bei einer Antwort ohne Werte einen
kleinen Ring von Ersatzkoordinaten (±0,2°). Ohne diese Absicherung liefert das Modell für
küstennahe Punkte gelegentlich nur `null`.

## Zeitmodell: „local epoch"

Die Marine-API wird mit `timezone=auto` abgefragt und liefert Zeitstempel als lokale
Wanduhrzeit ohne Offset (`2026-08-18T14:00`). Würde man diese Strings mit `new Date()`
parsen, interpretiert der Browser sie in **seiner** Zeitzone – die Gezeiten von Brest wären
auf einem Handy mit deutscher Zeitzone um eine Stunde verschoben.

Deshalb wird jede Zeitangabe über `Date.UTC(...)` in eine Zahl umgerechnet, die die
Stations-Wanduhrzeit als UTC darstellt („local epoch"). Alle Berechnungen und alle
Formatierungen verwenden konsequent die `getUTC*`-Getter. Die aktuelle Zeit an der Station
ist `Date.now() + utc_offset_seconds * 1000`. So bleibt die Anzeige unabhängig von der
Gerätezeitzone korrekt.

## Hoch- und Niedrigwasser aus Stundenwerten

Stundenwerte würden jedes Hochwasser auf eine volle Stunde legen. Ablauf stattdessen:

1. Catmull-Rom-Spline durch die Stundenwerte (`valueAt`).
2. Abtastung des Splines im 2-Minuten-Raster, Suche der Vorzeichenwechsel der Steigung.
3. Verfeinerung durch eine Parabel durch die drei Punkte um den Kandidaten.
4. Bereinigung (`consolidate`): Hoch und Niedrig müssen alternieren, Amplituden unter 4 cm
   gelten als Rauschen. Beide Schritte laufen abwechselnd, bis sich die Liste nicht mehr
   ändert – nötig, weil die Quelle auf ganze Zentimeter rundet und bei sehr kleinem Tidenhub
   Plateaus entstehen.

Gegen eine analytisch bekannte Testkurve (M2 + S2 + M4, stündlich abgetastet) wurden alle
31 Extrema über acht Tage gefunden, mittlere Zeitabweichung 1,5 min, maximal 3,5 min,
Höhenabweichung maximal 0,8 cm. Der verbleibende Fehler stammt aus der stündlichen
Auflösung der Quelle, nicht aus dem Verfahren.

Bei Ostsee- und Mittelmeerstationen ist der Tidenhub sehr klein; unter 12 cm Tagesumfang
weist die App darauf hin, dass Wind und Luftdruck dort stärker wirken als die Gezeiten.

## Ausgabe in drei Stufen

`computeView()` leitet alle Ansichtsdaten aus der gespeicherten Serie ab; darauf setzen drei
Pfade auf:

- `render()` – vollständiger Aufbau bei Stationswechsel oder neuen Daten,
- `renderLive()` – im Minutentakt, nur die zeitabhängigen Teile (Hero, Tagesliste, Diagramm,
  Altersangabe),
- `drawChart()` – bei Größenänderung des Fensters.

Diese Trennung ist kein Selbstzweck: ein vollständiger Aufbau im Minutentakt würde
aufgeklappte Folgetage zuklappen und den Tastaturfokus verwerfen (siehe `docs/bugs.md`).
Aufgeklappte Tage werden zusätzlich in `state.openDays` gemerkt.

## Kein Framework, keine Chart-Bibliothek

Der Funktionsumfang ist klein und der Zustand überschaubar (Station, Serie, Abrufzeit), ein
Framework würde nur Gewicht und Build-Bedarf hinzufügen. Für das Diagramm reicht
handgeschriebenes SVG (~230 Zeilen): eine einzige Kurve, dafür sehr spezielle Anforderungen
(Jetzt-Marker, HW/NW-Beschriftung, Nachtschattierung, Themenfarben über CSS-Variablen). Eine
vendorierte Chart-Bibliothek wäre ein Vielfaches an Bytes für weniger Kontrolle. `/vendor`
bleibt deshalb leer.

Zwei daraus gelernte Details (siehe `docs/bugs.md`): SVG-Elemente werden ausschließlich über
CSS-Klassen eingefärbt, weil `var()` in Präsentationsattributen nicht verlässlich ist, und
Sichtbarkeit wird per Klasse geschaltet, weil `SVGElement` keine `hidden`-Eigenschaft hat.

## Content-Security-Policy

```
default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'none';
img-src 'self' data:; style-src 'self'; script-src 'self'; manifest-src 'self';
connect-src 'self' https://marine-api.open-meteo.com https://geocoding-api.open-meteo.com
```

Die App lädt zur Laufzeit keine Schriften, Skripte oder Bilder aus dem Netz – nur die beiden
Datenendpunkte sind erlaubt, und zwar namentlich. Ohne diese Ausnahme wäre eine
Gezeiten-App nicht möglich; sie ist die einzige Abweichung vom Grundsatz „lädt nichts nach".
Weil `style-src` keine Inline-Styles zulässt, enthält das Projekt keine `style`-Attribute;
das Icon-Sprite wird über eine CSS-Klasse verborgen.

Als Schriftart dient die System-Schrift des Geräts (`-apple-system`, `Roboto`, …). Damit
entfällt jede Font-Datei, `/fonts` bleibt leer.

## Caching und Offline

Zwei getrennte Ebenen:

- **App-Shell** im Service Worker (`sw.js`). Navigationsanfragen: Netz zuerst, Cache als
  Rückfall. Statische Dateien: stale-while-revalidate – der Cache antwortet sofort, im
  Hintergrund wird erneuert. Der Cache-Name enthält die Version, die bei der Registrierung als
  `?v=`-Parameter übergeben wird; ein Versionssprung verwirft die alten Caches beim Aktivieren.
  Damit das trägt, muss die Versionsnummer aus einer Quelle kommen, die selbst nicht im Cache
  liegt – siehe unten. Ist ein neuer Service Worker aktiv, bietet die App einen Neustart an,
  weil der laufende Code noch aus dem alten Cache stammt.
- **Gezeitendaten** pro Station im `localStorage` (`tiedecharts.cache.<id>`). Bewusst nicht
  im Service Worker: nur die App weiß, wie alt eine Serie sein darf, und kann veraltete
  Werte in der Oberfläche als solche kennzeichnen. Frische Daten (< 3 h) werden ohne
  Netzanfrage verwendet; scheitert ein Abruf, werden die gespeicherten Werte mit Altersangabe
  und Warnbanner gezeigt. Bei Speicherüberlauf werden die Caches anderer Stationen verworfen.

Gespeichert werden außerdem die Einstellungen (`tiedecharts.prefs`): gewählte Station,
Ortsbezeichnung, Farbschema und ob dem Gerätestandort gefolgt wird.

## Wo die Versionsnummer steht

Im Meta-Tag `app-version` in `index.html` – und nur dort. Das ist keine Stilfrage, sondern
Voraussetzung für die Cache-Invalidierung: `index.html` wird immer zuerst aus dem Netz geholt,
jede JavaScript-Datei kann dagegen aus dem Cache stammen. Läge die Nummer in einem Modul,
würde sie nach einer Aktualisierung aus dem alten Cache gelesen, der daraus gebildete
Cache-Name bliebe gleich und der Cache würde nie erneuert (siehe `docs/bugs.md`).

## Fehlerbehandlung

`js/api.js` übersetzt alle Fehlerfälle (Zeitüberschreitung, Netzfehler, HTTP-Status,
Ratenbegrenzung, unlesbare Antwort, keine Modelldaten) in `ApiError` mit deutschem
Klartext. Die Oberfläche zeigt entweder ein Fehlerbanner mit „Erneut versuchen" oder – wenn
gespeicherte Daten vorliegen – ein Warnbanner über den weiterhin angezeigten Altdaten.
Abgelehnte Standortfreigabe führt nicht in eine Sackgasse, sondern zur Ortssuche.

## Sicherheit

Dynamische Texte (Ortsnamen aus dem Geocoder) werden ausschließlich über `textContent`
gesetzt, nie über `innerHTML`. Das Diagramm-Markup wird als Zeichenkette erzeugt, enthält
aber ausschließlich selbst berechnete Zahlen und feste Beschriftungen. Es gibt keine
Secrets: beide Endpunkte sind ohne Schlüssel nutzbar, entsprechend existiert keine `.env`.

## Bekannte Grenzen

- Modellauflösung 8 km: in Wattströmen und engen Ästuaren Zeitabweichungen bis rund 30 min.
- Höhenbezug MSL statt Seekartennull: Absolutwerte nicht mit Gezeitentafeln vergleichbar.
- Vorhersagezeitraum: heute plus sechs Folgetage (API-Grenze acht Tage).
- Der Stationskatalog ist kuratiert, nicht vollständig; Flusspegel fehlen bewusst.
- Für Standortbestimmung und Installation ist HTTPS (oder `localhost`) erforderlich.
