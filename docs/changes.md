# Änderungswünsche

Eingangskorb für Stichpunkte. Nichts wird hier gelöscht; umgesetzte Punkte wandern in den
Abschnitt „Erledigt" und werden zusätzlich in `docs/releases.md` dokumentiert.

## Offen

_Noch keine Wünsche eingetragen._

## Vorgemerkte Ideen (aus der Planung, nicht beauftragt)

- Amtliche Gezeitenzeiten des BSH für die deutsche Nord- und Ostseeküste als genauere
  Quelle ergänzen (`gdi.bsh.de/ldproxy/rest/services/WaterLevelForecast`, ohne API-Key,
  sieben Tage Vorhersage). Open-Meteo bliebe für das übrige Europa zuständig.
- Gemessene Ist-Wasserstände deutscher Pegel aus PEGELONLINE neben der Vorhersage anzeigen.
- Stationskatalog aus PEGELONLINE/IOC erweitern (Skript liegt bereits bereit:
  `scripts/update_stations.py`).
- Anzeige des Tidenverlaufs für einen ausgewählten Folgetag, nicht nur für heute.

## Erledigt

- „verteile die vier anzeigen gleichmäßiger über die Breite, Tiedenhub kann noch weiter nach
  rechts"
  ✅ 19.08.2026 – Einzeilige Kennzahlen werden mit `space-between` über die volle Breite
  verteilt, der Tidenhub sitzt rechtsbündig am Rand. Siehe v0.1.5 in `releases.md`.

- „setzt den Tiedenhub wieder runter, aber mache ein 1*4 Raster und nur bei zu kleinen
  Bildschirm ein 2*2 Raster. auf meinem Pixel 9a ist definitiv genug Platz für 1*4"
  ✅ 19.08.2026 – Tidenhub wieder in der Kennzahlenreihe; 1×4 ab 400 px Viewport-Breite
  (Grenze aus der gemessenen Mindestbreite von 392 px abgeleitet), darunter 2×2. Siehe v0.1.4
  in `releases.md`.

- „das mit dem 2*2 Raster was wir vorhin designt haben sieht nicht so cool aus. baue das
  wieder auf die 1*3 varient von vorher zurück und setzt den Tiedenhub ganz rechts neben die
  große Anzeige mit der Uhrzeit, aber genauso kleine von der Schriftart wie Jetzt"
  ✅ 19.08.2026 – Kennzahlen wieder einzeilig zu drei; Tidenhub rechts neben der Uhrzeit in
  der kleinen Kennzahlen-Schrift. Siehe v0.1.3 in `releases.md`.

- „kannst du in der Übersicht vom aktuellen Standort rechts neben der Tendenz noch den Wert
  für den Max. Tiedenhub an dem Tag in m angeben"
  ✅ 19.08.2026 – Kennzahl „Tidenhub" in der Übersichtskarte ergänzt (maximaler Tidenhub des
  Tages in Metern, 2×2-Raster auf dem Telefon); die dadurch doppelte Zeile in der Karte
  „Heute" entfernt. Siehe v0.1.1 in `releases.md`.
- „zwischen dem Ortsauswahl Kasten und dem darunter liegenden Übersichtsfeld ist keine
  Abstand. mache es so, das der Abstand hier des selbe ist, wie zwischen den restlichen
  Kästen."
  ✅ 19.08.2026 – Abstand über einen Grid-Abstand der Seite gelöst, überall 12 px; der leere
  Meldungsplatzhalter zwischen den Karten wird ausgeblendet. Siehe v0.1.1 in `releases.md`.
