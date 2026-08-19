# Fehler und Lösungen

## Behoben

### Alte Version blieb nach einer Aktualisierung aktiv (v0.1.2)

**Symptom:** Nach dem Ausrollen von 0.1.1 stand im Footer weiter `v0.1.0`, und geänderter
Programmcode wirkte nicht.

**Ursache:** Ein Kreisschluss in der Cache-Invalidierung. Der Service Worker bildete seinen
Cache-Namen aus der Version, die ihm `js/app.js` bei der Registrierung übergab. Diese Version
stammte aus `js/version.js` – einer Datei, die der Service Worker selbst nach dem Muster
cache-first auslieferte. Nach einem Versionssprung wurde also weiterhin die alte
`js/version.js` geladen, der Cache-Name blieb identisch, der Cache wurde nie verworfen: der
Mechanismus konnte sich nur selbst bestätigen. Die Behauptung in `docs/architecture.md`, eine
Versionserhöhung invalidiere den Cache automatisch, war damit falsch.

**Lösung:** Dreifach abgesichert.

1. Die Versionsnummer steht im Meta-Tag `app-version` in `index.html`. Dieses Dokument wird
   immer zuerst aus dem Netz geholt (network-first), kann also nie veraltet sein.
   `js/version.js` liest den Wert nur noch aus dem Dokument – es bleibt eine einzige Stelle.
2. Statische Dateien werden stale-while-revalidate ausgeliefert: der Cache antwortet sofort,
   im Hintergrund wird erneuert. Ein neuer Stand kommt damit auch ohne Versionssprung an.
3. Sobald ein neuer Service Worker aktiv ist, bietet die App „Jetzt neu starten" an, weil der
   laufende Code weiterhin aus dem alten Cache stammt.

**Nachweis:** Ein automatisierter Test rollt bei laufender Installation eine geänderte Version
aus und lädt neu. Ergebnis: Footer sofort auf dem neuen Wert, Cache-Name gewechselt, alter
Cache verworfen, Hinweis erscheint, geänderter Code nach dem Neustart aktiv, Offline-Betrieb
weiter funktionsfähig.

### `hidden` wirkt nicht auf SVG-Elementen (v0.1.0, während der Entwicklung)

**Symptom:** Die Werteanzeige (Fadenkreuz mit Tooltip) im Diagramm erschien nie, obwohl der
Ereignis-Handler korrekt rechnete.

**Ursache:** Die Gruppe wurde per `group.hidden = false` eingeblendet. `hidden` ist eine
Eigenschaft von `HTMLElement`, nicht von `SVGElement`. Die Zuweisung legte also nur eine
belanglose JavaScript-Eigenschaft an, während das HTML-Attribut `hidden` im Markup und damit
die CSS-Regel `[hidden] { display: none }` bestehen blieb.

**Lösung:** Sichtbarkeit über eine CSS-Klasse (`.chart__hover--on`, `visibility`) schalten.

### `var()` in SVG-Präsentationsattributen (v0.1.0, während der Entwicklung)

**Symptom/Risiko:** Kurve, Gitter und Marker wurden zunächst über Attribute wie
`stroke="var(--chart-line)"` eingefärbt. CSS-Variablen sind in Präsentationsattributen nicht
über alle Engines hinweg verlässlich; auf iOS wäre das Diagramm möglicherweise ohne Farben
gerendert worden.

**Lösung:** Alle Diagrammelemente tragen CSS-Klassen, die Farben stehen in `style.css`. Das
passt zusätzlich zur Regel, keine rohen Farbwerte im Markup zu führen.

### Inline-Style im Icon-Sprite gegen die CSP (v0.1.0, während der Entwicklung)

**Symptom/Risiko:** Das Sprite begann mit `<svg style="display:none">`. Die strikte CSP
(`style-src 'self'`) verbietet Style-Attribute, das Sprite wäre sichtbar geworden.

**Lösung:** Attribut entfernt; der Host-Container wird über die Klasse `.sprite-host`
verborgen.

### Standortabfrage ohne Antwort blockierte die App (v0.1.0, während der Entwicklung)

**Symptom:** Wurde der Standort-Dialog des Browsers nicht beantwortet (oder wie im
automatisierten Test stillschweigend verworfen), blieb die App dauerhaft bei „Standort wird
bestimmt …" stehen – auch weit über die gesetzten 10 Sekunden `timeout` hinaus.

**Ursache:** Laut Spezifikation der Geolocation-API beginnt die Frist des Parameters
`timeout` erst **nach** erteilter Freigabe. Ein unbeantworteter Berechtigungsdialog löst
deshalb niemals den Fehler-Rückruf aus.

**Lösung:** Eigener Wachhund (`GEO_WATCHDOG_MS`, 15 s) in `js/app.js`. Läuft er ab, wird die
Ortssuche angeboten; eine später doch eintreffende Position wird weiterhin verwendet.
Zusätzlich zeigt die App den Zustand „Standort wird ermittelt" ab der ersten Sekunde an,
statt eine leere Seite.

### Minütliche Neuberechnung verwarf Bedienzustand (v0.1.0, während der Entwicklung)

**Symptom:** Ein aufgeklappter Folgetag klappte nach spätestens einer Minute von selbst zu,
und die Tastaturbedienung des Akkordeons funktionierte nicht: der Fokus verschwand.

**Ursache:** Der Minutentakt (und der `ResizeObserver`) rief die vollständige Ausgabe auf und
ersetzte damit auch die Folgetage samt fokussiertem Element.

**Lösung:** Getrennte Ausgabepfade in `js/app.js` – `renderLive()` erneuert nur die
zeitabhängigen Teile (Hero, Tagesliste, Diagramm, Altersangabe), der `ResizeObserver` zeichnet
nur das Diagramm neu, und die Folgetage werden ausschließlich bei neuen Daten aufgebaut. Die
aufgeklappten Tage werden in `state.openDays` gemerkt und nach einem vollständigen Aufbau
wiederhergestellt.

### Zwei gleichartige Gezeiten hintereinander bei sehr kleinem Tidenhub (v0.1.0, während der Entwicklung)

**Symptom:** An einer Ostsee-Station mit rund 8 cm Tidenhub listete die App sieben Ereignisse
für einen Tag, darunter „Niedrigwasser" direkt nach „Niedrigwasser".

**Ursache:** Die API rundet Wasserstände auf ganze Zentimeter. Bei so kleinen Amplituden
entstehen dadurch Plateaus mit Mini-Wellen. Die Bereinigung lief nur einmal: das Entfernen
einer flachen Delle konnte zwei gleichartige Extrema unmittelbar nebeneinander
zurücklassen, weil die Alternierungsprüfung davor stattgefunden hatte.

**Lösung:** `consolidate()` in `js/tides.js` wiederholt Alternierungsprüfung und
Rauschfilter, bis sich die Liste nicht mehr ändert. Zusätzlich erklärt die Oberfläche bei
weniger als 6 cm Tagesumfang, warum sich kein Hoch- und Niedrigwasser bestimmen lässt.

## Beobachtet, keine Fehler

- **Keine Werte für küstennahe Koordinaten:** Das Gezeitenmodell führt nur Seezellen. Die
  App setzt `cell_selection=sea` und probiert notfalls einen Ring von Ersatzkoordinaten
  (`SEA_SEARCH_OFFSETS` in `js/api.js`).
- **Sehr kleiner Tidenhub an Ostsee und Mittelmeer:** korrekt, dort dominieren Wind und
  Luftdruck. Die App weist unterhalb von 12 cm Tagesumfang darauf hin.
