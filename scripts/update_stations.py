#!/usr/bin/env python3
"""Vorschläge für neue Einträge im Stationskatalog erzeugen.

thought up by human, coded by ai

Das Skript ist ein Wartungswerkzeug und nicht Teil der App. Es lädt öffentliche
Pegellisten, vergleicht sie mit js/stations.js und gibt fertige Zeilen für die
fehlenden Standorte aus. Der kuratierte Katalog wird bewusst NICHT automatisch
überschrieben: die Koordinaten dort liegen absichtlich auf offenem Wasser, was
eine automatische Übernahme wieder zerstören würde.

Quellen:
  PEGELONLINE (WSV), Datenlizenz Deutschland - Namensnennung 2.0
  IOC Sea Level Station Monitoring Facility (UNESCO/IOC, VLIZ)

Aufruf:
  python3 scripts/update_stations.py                 # alle Quellen, Vorschläge auf stdout
  python3 scripts/update_stations.py --source pegel  # nur PEGELONLINE
  python3 scripts/update_stations.py --min-distance 15
"""

import argparse
import json
import math
import os
import re
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOGUE = os.path.join(ROOT, "js", "stations.js")

PEGELONLINE_URL = "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json"
IOC_URL = "https://www.ioc-sealevelmonitoring.org/service.php?query=stationlist&format=json"

# Nur Küstengewässer: Binnenpegel sind für ein 8-km-Seegitter unbrauchbar.
PEGELONLINE_WATERS = {"NORDSEE", "OSTSEE"}
TIMEOUT = 30


def load_json(url):
    """JSON von einer URL holen; gibt None zurück und meldet den Grund bei Fehlern."""
    request = urllib.request.Request(url, headers={"User-Agent": "TiedeCharts-Wartungsskript"})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError, OSError) as error:
        print(f"  Abruf fehlgeschlagen: {url}\n  Grund: {error}", file=sys.stderr)
        return None


def existing_stations():
    """Namen und Koordinaten aus js/stations.js lesen."""
    with open(CATALOGUE, encoding="utf-8") as handle:
        source = handle.read()
    rows = re.findall(r"\['([^']+)',\s*'([A-Z]{2})',\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\]", source)
    return [(name, country, float(lat), float(lon)) for name, country, lat, lon in rows]


def distance_km(lat1, lon1, lat2, lon2):
    """Großkreisentfernung in Kilometern."""
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return 2 * 6371 * math.asin(min(1.0, math.sqrt(a)))


def from_pegelonline():
    """Küstenpegel der WSV als (name, country, lat, lon)."""
    payload = load_json(PEGELONLINE_URL)
    if not payload:
        return []
    out = []
    for entry in payload:
        water = (entry.get("water") or {}).get("longname", "").upper()
        lat, lon = entry.get("latitude"), entry.get("longitude")
        if water not in PEGELONLINE_WATERS or lat is None or lon is None:
            continue
        name = (entry.get("longname") or entry.get("shortname") or "").title().strip()
        if name:
            out.append((name, "DE", round(float(lat), 3), round(float(lon), 3)))
    return out


def from_ioc():
    """Europäische Pegel der IOC-Liste als (name, country, lat, lon)."""
    payload = load_json(IOC_URL)
    if not payload:
        return []
    out = []
    for entry in payload:
        try:
            lat = float(entry.get("Lat"))
            lon = float(entry.get("Lon"))
        except (TypeError, ValueError):
            continue
        # grobes Europa-Fenster inklusive Island, Kanaren und Schwarzes Meer
        if not (27 <= lat <= 72 and -26 <= lon <= 42):
            continue
        name = str(entry.get("Location") or entry.get("location") or "").strip()
        country = str(entry.get("Country") or "").strip().upper()[:2] or "??"
        if name:
            out.append((name, country, round(lat, 3), round(lon, 3)))
    return out


def main():
    parser = argparse.ArgumentParser(description="Neue Stationen für js/stations.js vorschlagen")
    parser.add_argument("--source", choices=["pegel", "ioc", "alle"], default="alle")
    parser.add_argument("--min-distance", type=float, default=12.0,
                        help="Vorschlag nur, wenn kein Katalogeintrag näher liegt (km)")
    args = parser.parse_args()

    catalogue = existing_stations()
    print(f"Katalog: {len(catalogue)} Stationen aus {os.path.relpath(CATALOGUE, ROOT)}")

    candidates = []
    if args.source in ("pegel", "alle"):
        found = from_pegelonline()
        print(f"PEGELONLINE: {len(found)} Küstenpegel")
        candidates += found
    if args.source in ("ioc", "alle"):
        found = from_ioc()
        print(f"IOC: {len(found)} europäische Pegel")
        candidates += found

    if not candidates:
        print("Keine Kandidaten abrufbar - Netzzugang oder Endpunkte prüfen.", file=sys.stderr)
        return 1

    suggestions = []
    for name, country, lat, lon in candidates:
        nearest = min((distance_km(lat, lon, c_lat, c_lon) for _, _, c_lat, c_lon in catalogue), default=1e9)
        if nearest >= args.min_distance:
            suggestions.append((nearest, name, country, lat, lon))

    suggestions.sort(reverse=True)
    print(f"\n{len(suggestions)} Vorschläge (nächster Katalogeintrag mindestens "
          f"{args.min_distance:g} km entfernt).")
    print("Vor dem Einfügen prüfen, ob die Koordinate auf offenem Wasser liegt:\n")
    for nearest, name, country, lat, lon in suggestions:
        print(f"  ['{name}', '{country}', {lat}, {lon}],  // {nearest:.0f} km zum nächsten Eintrag")
    return 0


if __name__ == "__main__":
    sys.exit(main())
