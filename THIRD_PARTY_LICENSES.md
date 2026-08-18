# Fremdinhalte und Lizenzen

Die App enthält bewusst **keine** JavaScript-Bibliotheken, keine Web-Fonts und keine
fremden Icon-Dateien. `/vendor` und `/fonts` sind deshalb leer.

## Daten

| Inhalt | Herkunft | Lizenz | Attribution |
| --- | --- | --- | --- |
| Wasserstand inkl. Tide (`sea_level_height_msl`) | [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api) | CC BY 4.0 | im Footer der App genannt |
| Ortssuche (Geokodierung) | [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api), Basis GeoNames | CC BY 4.0 | im Footer der App genannt |

Nutzung der freien Open-Meteo-Endpunkte ohne API-Key ist auf nicht-kommerzielle Verwendung
und weniger als 10.000 Abrufe pro Tag ausgelegt. Die App ruft pro Stationswechsel bzw. pro
Aktualisierung genau eine Serie ab und speichert sie drei Stunden lokal.

## Schriften

Es wird ausschließlich die System-Schriftart des jeweiligen Geräts verwendet
(`-apple-system`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`). Keine Font-Datei ist Teil
des Projekts, es wird keine geladen.

## Icons und Grafiken

Das Icon-Sprite (`icons/icon-sprite.svg`), das Favicon (`assets/favicon.svg`) und die
App-Icons (`assets/icon-*.png`, erzeugt von `scripts/make_icons.py`) sind für dieses Projekt
selbst gezeichnet bzw. berechnet. Sie orientieren sich stilistisch an der Formensprache von
Material Symbols, enthalten aber keine Original-Dateien und keinen Code Dritter.

## Stationskatalog

Die Standorte in `js/stations.js` sind Häfen, Reeden und Pegelorte; Namen und Koordinaten
sind Sachinformationen ohne eigene Schutzfähigkeit. Beim Erweitern über
`scripts/update_stations.py` sind die Nutzungsbedingungen der jeweiligen Quelle zu beachten:

- PEGELONLINE (Wasserstraßen- und Schifffahrtsverwaltung des Bundes): Datenlizenz
  Deutschland – Namensnennung – Version 2.0, Namensnennung „Wasserstraßen- und
  Schifffahrtsverwaltung des Bundes, PEGELONLINE".
- IOC Sea Level Station Monitoring Facility (UNESCO/IOC, betrieben von VLIZ): Attribution
  nach der Datenpolitik der IOC.
