/*
 * Data access layer - Open-Meteo (geocoding + marine sea level).
 * thought up by human, coded by ai
 *
 * Both endpoints are key free, CORS enabled and licensed CC BY 4.0. They are
 * the only hosts allowed by the Content-Security-Policy in index.html.
 *
 * Time model: the marine endpoint is queried with timezone=auto, so timestamps
 * come back as station local wall clock strings without an offset. They are
 * converted to "local epoch" milliseconds (wall clock interpreted as UTC) so
 * every later calculation and all formatting can use the UTC getters and stays
 * independent of the device time zone. See docs/architecture.md.
 */

const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

const REQUEST_TIMEOUT_MS = 12000;
const FORECAST_DAYS = 7;
const PAST_DAYS = 1;
const MIN_VALID_SAMPLES = 12;

/**
 * Offsets in degrees tried when a coordinate has no data in the marine grid.
 * The model only carries sea cells, so a gauge tucked into a bay can miss.
 */
const SEA_SEARCH_OFFSETS = [
  [0, 0],
  [0, 0.2],
  [0, -0.2],
  [0.2, 0],
  [-0.2, 0],
  [0.2, 0.2],
  [-0.2, -0.2]
];

/** Error carrying a translated, user facing message. */
export class ApiError extends Error {
  /**
   * @param {string} message user facing German message
   * @param {string} kind machine readable cause
   */
  constructor(message, kind = 'unknown') {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
  }
}

/**
 * fetch with a timeout and JSON parsing, mapped onto ApiError.
 * @param {string} url
 * @returns {Promise<object>}
 */
async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new ApiError('Der Datenabruf hat zu lange gedauert.', 'timeout');
    }
    throw new ApiError('Keine Verbindung zum Datendienst.', 'offline');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const status = response.status;
    const message = status === 429
      ? 'Der Datendienst ist gerade überlastet (Limit erreicht). Bitte später erneut versuchen.'
      : `Der Datendienst antwortete mit Fehler ${status}.`;
    throw new ApiError(message, status === 429 ? 'rate-limit' : 'http');
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError('Der Datendienst lieferte eine unlesbare Antwort.', 'parse');
  }
}

/**
 * Convert a local wall clock string "2026-08-18T14:00" into local epoch ms.
 * @param {string} value
 * @returns {number} NaN when unparsable
 */
function toLocalEpoch(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(value));
  if (!match) return NaN;
  const [, y, mo, d, h, mi] = match;
  return Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
}

/**
 * Turn an Open-Meteo marine payload into the app's series shape.
 * @param {object} payload
 * @returns {{samples: Array<{tl: number, v: number}>, timezone: string, utcOffsetSeconds: number, lat: number, lon: number}|null}
 */
function normaliseMarine(payload) {
  const hourly = payload && payload.hourly;
  const times = hourly && hourly.time;
  const values = hourly && hourly.sea_level_height_msl;
  if (!Array.isArray(times) || !Array.isArray(values)) return null;

  const samples = [];
  for (let i = 0; i < times.length; i += 1) {
    const value = values[i];
    const tl = toLocalEpoch(times[i]);
    if (value === null || value === undefined || Number.isNaN(tl) || !Number.isFinite(value)) continue;
    samples.push({ tl, v: value });
  }
  if (samples.length < MIN_VALID_SAMPLES) return null;

  return {
    samples,
    timezone: payload.timezone || 'UTC',
    utcOffsetSeconds: Number(payload.utc_offset_seconds) || 0,
    lat: Number(payload.latitude),
    lon: Number(payload.longitude)
  };
}

/**
 * Load the sea level series for a coordinate.
 * Tries the exact position first, then a small ring of seaward offsets, because
 * the marine model has no data for land cells.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{samples: Array, timezone: string, utcOffsetSeconds: number, lat: number, lon: number, offsetUsed: boolean}>}
 */
export async function fetchSeaLevel(lat, lon) {
  let lastError = null;

  for (const [dLat, dLon] of SEA_SEARCH_OFFSETS) {
    const query = new URLSearchParams({
      latitude: (lat + dLat).toFixed(4),
      longitude: (lon + dLon).toFixed(4),
      hourly: 'sea_level_height_msl',
      timezone: 'auto',
      past_days: String(PAST_DAYS),
      forecast_days: String(FORECAST_DAYS),
      cell_selection: 'sea'
    });

    try {
      const payload = await fetchJson(`${MARINE_URL}?${query}`);
      const series = normaliseMarine(payload);
      if (series) {
        return { ...series, offsetUsed: dLat !== 0 || dLon !== 0 };
      }
    } catch (error) {
      lastError = error;
      // A transport problem will not improve by shifting the coordinate.
      if (error instanceof ApiError && error.kind !== 'http') throw error;
    }
  }

  if (lastError) throw lastError;
  throw new ApiError(
    'Für diese Station liefert das Gezeitenmodell keine Daten. Bitte eine andere Station wählen.',
    'no-data'
  );
}

/**
 * Search places by name (GeoNames based).
 * @param {string} query
 * @param {number} [count]
 * @returns {Promise<Array<{name: string, admin: string, country: string, lat: number, lon: number}>>}
 */
export async function geocode(query, count = 8) {
  const trimmed = String(query).trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    name: trimmed,
    count: String(count),
    language: 'de',
    format: 'json'
  });
  const payload = await fetchJson(`${GEOCODING_URL}?${params}`);
  const results = Array.isArray(payload.results) ? payload.results : [];

  return results
    .filter((entry) => Number.isFinite(entry.latitude) && Number.isFinite(entry.longitude))
    .map((entry) => ({
      name: String(entry.name || ''),
      admin: String(entry.admin1 || ''),
      country: String(entry.country || ''),
      lat: entry.latitude,
      lon: entry.longitude
    }));
}

/**
 * Reverse lookup for the device position: the nearest place name from the
 * geocoder is good enough as a label and needs no extra service.
 * Falls back to formatted coordinates when nothing is found.
 * @param {number} lat
 * @param {number} lon
 * @returns {string}
 */
export function formatCoordinates(lat, lon) {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'O' : 'W';
  return `${Math.abs(lat).toFixed(3)}° ${ns}, ${Math.abs(lon).toFixed(3)}° ${ew}`;
}
