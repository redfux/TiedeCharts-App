/*
 * Station catalogue for European tidal locations.
 * thought up by human, coded by ai
 *
 * Why a bundled list instead of a live station registry:
 * the tide data provider (Open-Meteo Marine) is grid based and has no station
 * concept, so the app needs its own anchors. Shipping them keeps the app usable
 * offline and avoids extra hosts in the Content-Security-Policy.
 *
 * Rows are [name, ISO-3166-1-alpha-2 country, latitude, longitude].
 * Coordinates deliberately sit on open water (harbour entrance, roadstead or
 * gauge position) because the marine model only carries data for sea cells.
 * River gauges far upstream (e.g. Hamburg, Bremen, Antwerpen) are intentionally
 * absent - an 8 km grid cannot resolve an estuary that narrow.
 *
 * Regenerate or extend with scripts/update_stations.py.
 */

const ROWS = [
  // --- Germany: North Sea -------------------------------------------------
  ['Borkum', 'DE', 53.556, 6.664],
  ['Juist', 'DE', 53.684, 7.001],
  ['Norderney', 'DE', 53.706, 7.157],
  ['Baltrum', 'DE', 53.729, 7.371],
  ['Langeoog', 'DE', 53.751, 7.482],
  ['Spiekeroog', 'DE', 53.771, 7.697],
  ['Wangerooge', 'DE', 53.792, 7.898],
  ['Bensersiel', 'DE', 53.683, 7.573],
  ['Helgoland', 'DE', 54.179, 7.890],
  ['Wilhelmshaven', 'DE', 53.514, 8.147],
  ['Bremerhaven', 'DE', 53.545, 8.567],
  ['Cuxhaven', 'DE', 53.874, 8.717],
  ['Büsum', 'DE', 54.131, 8.856],
  ['Husum', 'DE', 54.470, 8.860],
  ['Wittdün auf Amrum', 'DE', 54.629, 8.383],
  ['Wyk auf Föhr', 'DE', 54.690, 8.573],
  ['Dagebüll', 'DE', 54.729, 8.687],
  ['List auf Sylt', 'DE', 55.018, 8.440],
  ['Westerland', 'DE', 54.906, 8.284],
  ['Hörnum auf Sylt', 'DE', 54.757, 8.293],
  // --- Germany: Baltic Sea ------------------------------------------------
  ['Flensburg', 'DE', 54.803, 9.432],
  ['Kappeln', 'DE', 54.660, 9.940],
  ['Kiel', 'DE', 54.362, 10.163],
  ['Eckernförde', 'DE', 54.475, 9.845],
  ['Fehmarn / Puttgarden', 'DE', 54.500, 11.220],
  ['Travemünde', 'DE', 53.960, 10.874],
  ['Wismar', 'DE', 53.902, 11.443],
  ['Warnemünde', 'DE', 54.180, 12.084],
  ['Sassnitz', 'DE', 54.513, 13.643],
  ['Greifswald / Wieck', 'DE', 54.100, 13.450],
  // --- Netherlands --------------------------------------------------------
  ['Delfzijl', 'NL', 53.333, 6.930],
  ['Eemshaven', 'NL', 53.455, 6.833],
  ['Lauwersoog', 'NL', 53.409, 6.203],
  ['Nes (Ameland)', 'NL', 53.442, 5.772],
  ['Harlingen', 'NL', 53.176, 5.410],
  ['West-Terschelling', 'NL', 53.362, 5.220],
  ['Oost-Vlieland', 'NL', 53.297, 5.081],
  ['Oudeschild (Texel)', 'NL', 53.037, 4.853],
  ['Den Helder', 'NL', 52.964, 4.745],
  ['IJmuiden', 'NL', 52.462, 4.550],
  ['Scheveningen', 'NL', 52.101, 4.259],
  ['Hoek van Holland', 'NL', 51.978, 4.120],
  ['Europoort', 'NL', 51.948, 4.050],
  ['Stellendam', 'NL', 51.828, 4.007],
  ['Roompot Buiten', 'NL', 51.621, 3.680],
  ['Vlissingen', 'NL', 51.442, 3.596],
  // --- Belgium ------------------------------------------------------------
  ['Zeebrugge', 'BE', 51.344, 3.201],
  ['Oostende', 'BE', 51.235, 2.919],
  ['Nieuwpoort', 'BE', 51.150, 2.720],
  // --- France: Channel & Atlantic ----------------------------------------
  ['Dunkerque', 'FR', 51.048, 2.368],
  ['Calais', 'FR', 50.970, 1.850],
  ['Boulogne-sur-Mer', 'FR', 50.727, 1.578],
  ['Dieppe', 'FR', 49.933, 1.081],
  ['Le Havre', 'FR', 49.482, 0.110],
  ['Ouistreham', 'FR', 49.341, -0.250],
  ['Port-en-Bessin', 'FR', 49.348, -0.756],
  ['Cherbourg', 'FR', 49.653, -1.620],
  ['Granville', 'FR', 48.834, -1.601],
  ['Saint-Malo', 'FR', 48.652, -2.031],
  ['Saint-Brieuc / Le Légué', 'FR', 48.532, -2.723],
  ['Roscoff', 'FR', 48.725, -3.973],
  ['Brest', 'FR', 48.353, -4.500],
  ['Audierne', 'FR', 48.010, -4.545],
  ['Concarneau', 'FR', 47.867, -3.918],
  ['Lorient', 'FR', 47.718, -3.372],
  ['Port-Navalo', 'FR', 47.545, -2.918],
  ['Saint-Nazaire', 'FR', 47.268, -2.203],
  ['Les Sables-d’Olonne', 'FR', 46.494, -1.795],
  ['La Rochelle', 'FR', 46.157, -1.222],
  ['Royan', 'FR', 45.619, -1.031],
  ['Arcachon', 'FR', 44.660, -1.161],
  ['Bayonne', 'FR', 43.527, -1.513],
  ['Saint-Jean-de-Luz', 'FR', 43.392, -1.674],
  // --- France: Mediterranean & Corsica ------------------------------------
  ['Sète', 'FR', 43.392, 3.700],
  ['Marseille', 'FR', 43.291, 5.352],
  ['Toulon', 'FR', 43.106, 5.930],
  ['Nice', 'FR', 43.689, 7.281],
  ['Ajaccio', 'FR', 41.918, 8.738],
  ['Bastia', 'FR', 42.700, 9.455],
  // --- United Kingdom: England & Wales ------------------------------------
  ['Margate', 'GB', 51.389, 1.383],
  ['Dover', 'GB', 51.114, 1.331],
  ['Newhaven', 'GB', 50.779, 0.058],
  ['Portsmouth', 'GB', 50.790, -1.110],
  ['Southampton', 'GB', 50.888, -1.398],
  ['Bournemouth', 'GB', 50.708, -1.874],
  ['Weymouth', 'GB', 50.606, -2.448],
  ['Torquay', 'GB', 50.457, -3.520],
  ['Plymouth (Devonport)', 'GB', 50.368, -4.190],
  ['Falmouth', 'GB', 50.147, -5.060],
  ['Newlyn', 'GB', 50.101, -5.548],
  ['St Mary’s (Scilly)', 'GB', 49.917, -6.317],
  ['St Ives', 'GB', 50.214, -5.481],
  ['Ilfracombe', 'GB', 51.211, -4.113],
  ['Avonmouth', 'GB', 51.508, -2.712],
  ['Cardiff', 'GB', 51.451, -3.170],
  ['Swansea', 'GB', 51.607, -3.930],
  ['Milford Haven', 'GB', 51.708, -5.048],
  ['Fishguard', 'GB', 52.011, -4.984],
  ['Barmouth', 'GB', 52.721, -4.052],
  ['Holyhead', 'GB', 53.313, -4.620],
  ['Llandudno', 'GB', 53.331, -3.826],
  ['Liverpool', 'GB', 53.449, -3.018],
  ['Blackpool', 'GB', 53.821, -3.061],
  ['Heysham', 'GB', 54.032, -2.920],
  ['Barrow-in-Furness', 'GB', 54.098, -3.212],
  ['Workington', 'GB', 54.652, -3.567],
  ['Douglas (Isle of Man)', 'GB', 54.148, -4.470],
  ['Lowestoft', 'GB', 52.473, 1.752],
  ['Great Yarmouth', 'GB', 52.600, 1.732],
  ['Cromer', 'GB', 52.932, 1.302],
  ['Harwich', 'GB', 51.947, 1.290],
  ['Sheerness', 'GB', 51.446, 0.743],
  ['Immingham', 'GB', 53.632, -0.187],
  ['Scarborough', 'GB', 54.283, -0.389],
  ['Whitby', 'GB', 54.492, -0.607],
  ['North Shields', 'GB', 55.010, -1.440],
  // --- United Kingdom: Scotland & Northern Ireland ------------------------
  ['Leith (Edinburgh)', 'GB', 55.989, -3.176],
  ['Dundee', 'GB', 56.455, -2.850],
  ['Aberdeen', 'GB', 57.144, -2.072],
  ['Wick', 'GB', 58.441, -3.086],
  ['Kirkwall', 'GB', 58.988, -2.958],
  ['Lerwick', 'GB', 60.153, -1.141],
  ['Stornoway', 'GB', 58.208, -6.388],
  ['Ullapool', 'GB', 57.896, -5.163],
  ['Oban', 'GB', 56.412, -5.480],
  ['Port Ellen (Islay)', 'GB', 55.628, -6.190],
  ['Greenock', 'GB', 55.949, -4.770],
  ['Portrush', 'GB', 55.204, -6.651],
  ['Bangor (NI)', 'GB', 54.663, -5.669],
  ['Belfast', 'GB', 54.657, -5.855],
  // --- Ireland ------------------------------------------------------------
  ['Dublin', 'IE', 53.347, -6.180],
  ['Dún Laoghaire', 'IE', 53.293, -6.130],
  ['Howth', 'IE', 53.392, -6.065],
  ['Wicklow', 'IE', 52.979, -6.032],
  ['Rosslare', 'IE', 52.251, -6.339],
  ['Dunmore East', 'IE', 52.148, -6.992],
  ['Cobh (Cork)', 'IE', 51.849, -8.297],
  ['Kinsale', 'IE', 51.699, -8.518],
  ['Dingle', 'IE', 52.128, -10.272],
  ['Galway', 'IE', 53.265, -9.052],
  ['Belmullet', 'IE', 54.221, -9.991],
  ['Killybegs', 'IE', 54.632, -8.443],
  ['Sligo', 'IE', 54.303, -8.583],
  // --- Denmark ------------------------------------------------------------
  ['Esbjerg', 'DK', 55.468, 8.441],
  ['Hvide Sande', 'DK', 56.001, 8.122],
  ['Thyborøn', 'DK', 56.700, 8.216],
  ['Hirtshals', 'DK', 57.593, 9.960],
  ['Skagen', 'DK', 57.719, 10.583],
  ['Frederikshavn', 'DK', 57.437, 10.549],
  ['Aarhus', 'DK', 56.152, 10.222],
  ['Fredericia', 'DK', 55.560, 9.760],
  ['Sønderborg', 'DK', 54.910, 9.800],
  ['København', 'DK', 55.700, 12.600],
  ['Helsingør', 'DK', 56.033, 12.620],
  ['Gedser', 'DK', 54.570, 11.930],
  ['Rønne', 'DK', 55.098, 14.690],
  // --- Norway -------------------------------------------------------------
  ['Oslo', 'NO', 59.900, 10.735],
  ['Kristiansand', 'NO', 58.140, 8.000],
  ['Tregde', 'NO', 58.000, 7.560],
  ['Egersund', 'NO', 58.451, 5.993],
  ['Stavanger', 'NO', 58.972, 5.730],
  ['Bergen', 'NO', 60.398, 5.310],
  ['Måløy', 'NO', 61.937, 5.113],
  ['Ålesund', 'NO', 62.470, 6.150],
  ['Kristiansund', 'NO', 63.113, 7.732],
  ['Trondheim', 'NO', 63.440, 10.398],
  ['Rørvik', 'NO', 64.862, 11.240],
  ['Sandnessjøen', 'NO', 66.021, 12.630],
  ['Bodø', 'NO', 67.293, 14.390],
  ['Svolvær', 'NO', 68.233, 14.570],
  ['Andenes', 'NO', 69.323, 16.120],
  ['Harstad', 'NO', 68.800, 16.540],
  ['Narvik', 'NO', 68.432, 17.420],
  ['Tromsø', 'NO', 69.653, 18.960],
  ['Hammerfest', 'NO', 70.660, 23.680],
  ['Honningsvåg', 'NO', 70.980, 25.970],
  ['Vardø', 'NO', 70.372, 31.110],
  // --- Sweden & Finland ---------------------------------------------------
  ['Göteborg', 'SE', 57.680, 11.800],
  ['Varberg', 'SE', 57.106, 12.240],
  ['Helsingborg', 'SE', 56.050, 12.680],
  ['Malmö', 'SE', 55.600, 12.900],
  ['Ystad', 'SE', 55.420, 13.820],
  ['Kalmar', 'SE', 56.660, 16.370],
  ['Visby', 'SE', 57.640, 18.290],
  ['Nynäshamn', 'SE', 58.930, 17.950],
  ['Stockholm', 'SE', 59.320, 18.140],
  ['Gävle', 'SE', 60.680, 17.190],
  ['Sundsvall', 'SE', 62.390, 17.400],
  ['Holmsund (Umeå)', 'SE', 63.680, 20.350],
  ['Luleå', 'SE', 65.580, 22.160],
  ['Mariehamn', 'FI', 60.100, 19.930],
  ['Hanko', 'FI', 59.820, 22.980],
  ['Turku', 'FI', 60.430, 22.100],
  ['Helsinki', 'FI', 60.150, 24.960],
  ['Kotka', 'FI', 60.460, 26.950],
  ['Rauma', 'FI', 61.130, 21.470],
  ['Vaasa', 'FI', 63.080, 21.550],
  ['Oulu', 'FI', 65.040, 25.420],
  ['Kemi', 'FI', 65.730, 24.550],
  // --- Baltic states, Poland, Russia (Baltic coast) -----------------------
  ['Świnoujście', 'PL', 53.920, 14.250],
  ['Kołobrzeg', 'PL', 54.190, 15.550],
  ['Ustka', 'PL', 54.590, 16.850],
  ['Hel', 'PL', 54.610, 18.810],
  ['Gdynia', 'PL', 54.532, 18.550],
  ['Gdańsk', 'PL', 54.400, 18.680],
  ['Klaipėda', 'LT', 55.710, 21.120],
  ['Liepāja', 'LV', 56.520, 21.000],
  ['Ventspils', 'LV', 57.400, 21.550],
  ['Rīga', 'LV', 57.020, 24.020],
  ['Pärnu', 'EE', 58.380, 24.480],
  ['Tallinn', 'EE', 59.450, 24.750],
  // --- Spain --------------------------------------------------------------
  ['A Coruña', 'ES', 43.370, -8.390],
  ['Vigo', 'ES', 42.240, -8.720],
  ['Gijón', 'ES', 43.560, -5.700],
  ['Santander', 'ES', 43.460, -3.790],
  ['Bilbao', 'ES', 43.360, -3.050],
  ['Huelva', 'ES', 37.130, -6.830],
  ['Cádiz', 'ES', 36.530, -6.290],
  ['Tarifa', 'ES', 36.005, -5.600],
  ['Málaga', 'ES', 36.706, -4.420],
  ['Almería', 'ES', 36.828, -2.460],
  ['Alicante', 'ES', 38.335, -0.480],
  ['Valencia', 'ES', 39.440, -0.310],
  ['Barcelona', 'ES', 41.335, 2.165],
  ['Palma de Mallorca', 'ES', 39.550, 2.630],
  ['Ibiza', 'ES', 38.905, 1.440],
  ['Las Palmas de Gran Canaria', 'ES', 28.145, -15.410],
  ['Santa Cruz de Tenerife', 'ES', 28.480, -16.235],
  // --- Portugal -----------------------------------------------------------
  ['Viana do Castelo', 'PT', 41.680, -8.830],
  ['Leixões (Porto)', 'PT', 41.185, -8.700],
  ['Figueira da Foz', 'PT', 40.140, -8.870],
  ['Peniche', 'PT', 39.350, -9.380],
  ['Cascais', 'PT', 38.690, -9.420],
  ['Setúbal', 'PT', 38.480, -8.900],
  ['Sines', 'PT', 37.940, -8.870],
  ['Lagos', 'PT', 37.090, -8.670],
  ['Olhão (Faro)', 'PT', 36.970, -7.870],
  ['Funchal', 'PT', 32.640, -16.910],
  ['Ponta Delgada', 'PT', 37.730, -25.670],
  // --- Italy, Adriatic, Malta ---------------------------------------------
  ['Genova', 'IT', 44.400, 8.920],
  ['Livorno', 'IT', 43.550, 10.300],
  ['Civitavecchia', 'IT', 42.090, 11.780],
  ['Napoli', 'IT', 40.820, 14.260],
  ['Reggio Calabria', 'IT', 38.120, 15.650],
  ['Catania', 'IT', 37.490, 15.100],
  ['Palermo', 'IT', 38.135, 13.370],
  ['Cagliari', 'IT', 39.195, 9.120],
  ['Bari', 'IT', 41.140, 16.880],
  ['Ancona', 'IT', 43.620, 13.515],
  ['Rimini', 'IT', 44.070, 12.590],
  ['Venezia (Lido)', 'IT', 45.415, 12.425],
  ['Trieste', 'IT', 45.645, 13.760],
  ['Valletta', 'MT', 35.900, 14.520],
  // --- Adriatic east coast & Greece ---------------------------------------
  ['Koper', 'SI', 45.550, 13.720],
  ['Pula', 'HR', 44.870, 13.830],
  ['Rijeka', 'HR', 45.320, 14.440],
  ['Zadar', 'HR', 44.115, 15.220],
  ['Split', 'HR', 43.500, 16.430],
  ['Dubrovnik', 'HR', 42.655, 18.080],
  ['Bar', 'ME', 42.090, 19.085],
  ['Durrës', 'AL', 41.310, 19.440],
  ['Korfu', 'GR', 39.620, 19.910],
  ['Patras', 'GR', 38.240, 21.720],
  ['Piräus (Athen)', 'GR', 37.930, 23.620],
  ['Thessaloniki', 'GR', 40.620, 22.930],
  ['Mykonos', 'GR', 37.445, 25.335],
  ['Rhodos', 'GR', 36.445, 28.230],
  ['Heraklion', 'GR', 35.350, 25.145],
  // --- Black Sea, Turkey, Cyprus, Gibraltar, Channel Islands --------------
  ['İstanbul', 'TR', 40.980, 28.850],
  ['İzmir', 'TR', 38.430, 27.100],
  ['Antalya', 'TR', 36.830, 30.630],
  ['Constanța', 'RO', 44.170, 28.660],
  ['Varna', 'BG', 43.190, 27.940],
  ['Burgas', 'BG', 42.480, 27.500],
  ['Odesa', 'UA', 46.500, 30.750],
  ['Limassol', 'CY', 34.640, 33.020],
  ['Larnaka', 'CY', 34.900, 33.640],
  ['Gibraltar', 'GI', 36.140, -5.350],
  ['St Peter Port (Guernsey)', 'GG', 49.455, -2.530],
  ['St Helier (Jersey)', 'JE', 49.178, -2.115],
  // --- Iceland & Faroe Islands --------------------------------------------
  ['Reykjavík', 'IS', 64.152, -21.940],
  ['Grindavík', 'IS', 63.830, -22.430],
  ['Ísafjörður', 'IS', 66.070, -23.130],
  ['Akureyri', 'IS', 65.680, -18.080],
  ['Höfn', 'IS', 64.250, -15.200],
  ['Tórshavn', 'FO', 62.010, -6.770]
];

/** Human readable country names for the station picker. */
const COUNTRY_NAMES = {
  AL: 'Albanien', BE: 'Belgien', BG: 'Bulgarien', CY: 'Zypern', DE: 'Deutschland',
  DK: 'Dänemark', EE: 'Estland', ES: 'Spanien', FI: 'Finnland', FO: 'Färöer',
  FR: 'Frankreich', GB: 'Vereinigtes Königreich', GG: 'Guernsey', GI: 'Gibraltar',
  GR: 'Griechenland', HR: 'Kroatien', IE: 'Irland', IS: 'Island', IT: 'Italien',
  JE: 'Jersey', LT: 'Litauen', LV: 'Lettland', ME: 'Montenegro', MT: 'Malta',
  NL: 'Niederlande', NO: 'Norwegen', PL: 'Polen', PT: 'Portugal', RO: 'Rumänien',
  SE: 'Schweden', SI: 'Slowenien', TR: 'Türkei', UA: 'Ukraine'
};

/**
 * Build a stable, storage friendly id from name and country.
 * @param {string} name
 * @param {string} country
 * @returns {string}
 */
function makeId(name, country) {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${country.toLowerCase()}-${slug}`;
}

/** @type {Array<{id: string, name: string, country: string, countryName: string, lat: number, lon: number}>} */
export const STATIONS = ROWS.map(([name, country, lat, lon]) => ({
  id: makeId(name, country),
  name,
  country,
  countryName: COUNTRY_NAMES[country] || country,
  lat,
  lon
}));

const EARTH_RADIUS_KM = 6371;

/**
 * Great circle distance in kilometres.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number}
 */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Stations ordered by distance to a position, nearest first.
 * @param {number} lat
 * @param {number} lon
 * @param {number} [limit]
 * @returns {Array<object>} stations with an added distanceKm property
 */
export function nearestStations(lat, lon, limit = 8) {
  return STATIONS
    .map((station) => ({ ...station, distanceKm: distanceKm(lat, lon, station.lat, station.lon) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/**
 * Look up a station by its id.
 * @param {string} id
 * @returns {object|undefined}
 */
export function stationById(id) {
  return STATIONS.find((station) => station.id === id);
}

/**
 * Simple substring search over station and country names, diacritics ignored.
 * @param {string} query
 * @param {number} [limit]
 * @returns {Array<object>}
 */
export function searchStations(query, limit = 12) {
  const needle = normalise(query);
  if (needle.length < 2) return [];
  return STATIONS
    .filter((station) =>
      normalise(station.name).includes(needle) || normalise(station.countryName).includes(needle))
    .slice(0, limit);
}

/**
 * Lowercase and strip diacritics so "Malmo" finds "Malmö".
 * @param {string} value
 * @returns {string}
 */
function normalise(value) {
  return String(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
