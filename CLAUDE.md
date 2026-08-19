# CLAUDE.md – TiedeCharts

Statische PWA (ES-Module, kein Build), die Ebbe/Flut, Tidenverlauf und Folgetage für
europäische Küstenstandorte anzeigt. Datenquelle ausschließlich Open-Meteo (Marine +
Geocoding, ohne API-Key).

Es gelten die Regeln des Web-App-Masterprompts; sie werden hier nicht wiederholt.

## Aktueller Stand

v0.1.5 umgesetzt und im Browser getestet (Chromium, iPhone- und iPad-Viewport, hell und
dunkel, inklusive Offline- und Fehlerpfad). Offene Ideen stehen in `docs/changes.md`.

## Arbeitsweise

- Entwicklung und Pushes gehen **direkt auf `main`** (so vom Projektinhaber festgelegt), auch
  wenn eine Session mit einem anderen Arbeitsbranch startet.

## Projektspezifische Hinweise

- Version nur im Meta-Tag `app-version` in `index.html` ändern (nicht in `js/version.js` –
  das liest sie von dort). Footer und Service-Worker-Cache leiten sich daraus ab; der Grund für
  diesen Umweg steht in `docs/bugs.md`.
- Zeitstempel sind „local epoch" (Stations-Wanduhrzeit als UTC). Immer `getUTC*` verwenden,
  Begründung in `docs/architecture.md`.
- SVG im Diagramm ausschließlich über CSS-Klassen einfärben und ein-/ausblenden, nicht über
  Präsentationsattribute mit `var()` und nicht über `hidden` (siehe `docs/bugs.md`).
- Keine Inline-Styles und keine neuen externen Hosts – die CSP in `index.html` erlaubt nur
  die beiden Open-Meteo-Endpunkte.
- Details zur Umsetzung: `docs/architecture.md`, Anforderungen: `docs/features.md`.
