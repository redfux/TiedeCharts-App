# TiedeCharts

Kleine, installierbare Web-App (PWA), die Ebbe und Flut für europäische Küstenstandorte
anzeigt: Hoch- und Niedrigwasserzeiten des aktuellen Tages, den Tidenverlauf als Diagramm
und die Gezeiten der folgenden Tage zum Ausklappen.

Die App ist für das Handy gebaut (Hochformat, Touch-Bedienung); Tablets funktionieren
ebenfalls, der Desktop ist kein Zielszenario.

## Funktionen

- **Automatische Ortsbestimmung**: ermittelt per Geolocation die Position und wählt die
  nächstgelegene Station aus dem mitgelieferten Katalog (286 europäische Küstenstandorte).
- **Freie Ortswahl**: Ortssuche über den Namen; danach Auswahl aus den umliegenden
  Stationen. Alternativ direkt nach einem Stationsnamen suchen.
- **Heute**: Liste der Hoch- und Niedrigwasser mit Uhrzeit, Höhe, Abstand zu jetzt und
  Tidenhub des Tages.
- **Tidenverlauf**: Diagramm über 24 Stunden mit Jetzt-Marker, markierten Hoch-/Niedrig­wassern,
  schattierten Nachtstunden und Wert-Anzeige beim Antippen der Kurve.
- **Nächste Tage**: sechs Folgetage, je Tag ausklappbar.
- **Offline**: App-Shell im Service Worker, letzte Gezeitendaten pro Station im
  `localStorage`. Ohne Netz werden die gespeicherten Werte mit Altersangabe gezeigt.
- **Aktualisieren**: geschieht von selbst – beim Start und beim Zurückholen in den Vordergrund,
  sobald der gespeicherte Stand älter als drei Stunden ist. Ein Neuladen der Seite
  (auf dem Handy die Zieh-Geste nach unten) erzwingt einen frischen Abruf. Rechts über dem
  Diagramm steht, wie alt die angezeigten Daten sind.
- **Light/Dark/Auto** mit Umschalter in der Appbar.

## Datenquelle

Alle Daten kommen von **Open-Meteo** – ohne API-Key, ohne Registrierung, CC BY 4.0:

| Zweck | Endpunkt |
| --- | --- |
| Wasserstand inkl. Tide (`sea_level_height_msl`, stündlich) | `marine-api.open-meteo.com/v1/marine` |
| Ortssuche | `geocoding-api.open-meteo.com/v1/search` |

Sonnenauf- und -untergang werden lokal berechnet, es wird kein weiterer Dienst angefragt.

### Grenzen der Daten – bitte beachten

- Die Höhen beziehen sich auf den **mittleren Meeresspiegel (MSL)**, nicht auf
  Seekartennull (LAT). Absolutwerte weichen deshalb von amtlichen Gezeitentafeln ab.
- Das Modell rechnet auf einem **Gitter von etwa 8 km**. In engen Ästuaren und Wattströmen
  können die Zeiten um einige Minuten bis rund eine halbe Stunde abweichen.
- Hoch- und Niedrigwasser werden aus den Stundenwerten interpoliert (siehe
  `docs/architecture.md`), nicht aus einer amtlichen Gezeitenvorausberechnung.
- **Nicht für die Navigation verwenden.** Für Seefahrt und Wattwanderungen gelten die
  amtlichen Gezeitentafeln (in Deutschland BSH).

## Lokal starten

Die App braucht keinen Build, aber einen HTTP-Server – ES-Module und Service Worker
funktionieren nicht über `file://`:

```bash
python3 -m http.server 8000
# oder
npx http-server -p 8000 -c-1
```

Dann `http://localhost:8000/` öffnen. Für Geolocation und die Installation als PWA ist
`localhost` oder HTTPS nötig.

## Veröffentlichen (GitHub Pages)

Repository-Einstellungen → Pages → Branch wählen, Ordner `/` (root). Die Struktur ist flach
und alle Pfade sind relativ, weitere Konfiguration ist nicht erforderlich.

## Auf dem Handy installieren

- **Android/Chrome**: Menü → „App installieren"
- **iOS/Safari**: Teilen → „Zum Home-Bildschirm"

## Ordnerstruktur

```
index.html, style.css, sw.js, manifest.webmanifest
assets/    Icons (PNG/SVG)
css/       design-tokens.css, design-components.css
icons/     icon-sprite.svg
js/        Anwendungscode (ES-Module)
scripts/   Wartungsskripte (Python, nicht Teil der App)
docs/      weitere Dokumentation
```

## Weitere Dokumentation

- `docs/features.md` – Anforderungen und Umsetzungsstand
- `docs/architecture.md` – technische Entscheidungen
- `docs/releases.md` – Änderungshistorie
- `docs/bugs.md` – Fehler und Lösungen
- `docs/changes.md` – Eingangskorb für Änderungswünsche
- `THIRD_PARTY_LICENSES.md` – Lizenzen und Attributionen

## Lizenz

MIT, siehe `LICENSE`. Gezeitendaten: © Open-Meteo, CC BY 4.0.
