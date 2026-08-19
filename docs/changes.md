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
