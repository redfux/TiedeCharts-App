/*
 * TiedeCharts - application entry point and state handling.
 * thought up by human, coded by ai
 *
 * Flow: position (device or chosen place) -> nearest station from the bundled
 * catalogue -> sea level series for that station -> derived high and low water.
 * Everything the view needs is recomputed from the cached series, so the "now"
 * marker and the relative times stay correct without further requests.
 */

import { APP_VERSION } from './version.js';
import { ApiError, fetchSeaLevel, formatCoordinates, geocode } from './api.js';
import { nearestStations, searchStations, stationById } from './stations.js';
import { buildCurve, findExtremes, groupByDay, nextExtreme, trendAt, valueAt, WEAK_TIDE_RANGE_M } from './tides.js';
import { startOfDay } from './format.js';
import { sunTimes } from './sun.js';
import { renderChart } from './chart.js';
import {
  clearBanner, el, fill, icon, injectSprite, renderForecast, renderFreshness, renderHero,
  renderLocation, renderPickerResults, renderSkeleton, renderToday, showBanner
} from './ui.js';

const PREFS_KEY = 'tiedecharts.prefs';
const CACHE_PREFIX = 'tiedecharts.cache.';
const CACHE_FRESH_MS = 3 * 3600000;
const DAY_MS = 86400000;
const FORECAST_DAYS_SHOWN = 6;
const GEO_TIMEOUT_MS = 10000;
/**
 * The timeout option of the Geolocation API only starts once permission has been
 * granted, so an unanswered permission dialog would leave the app waiting
 * forever. This watchdog offers the manual search instead; a position arriving
 * later is still used.
 */
const GEO_WATCHDOG_MS = 15000;
const SEARCH_DEBOUNCE_MS = 350;
const TICK_MS = 60000;

const dom = {};
const state = {
  station: null,
  placeLabel: '',
  placeMeta: '',
  distanceKm: null,
  series: null,
  fetchedAt: null,
  stale: false,
  offsetUsed: false,
  chart: null,
  pickerPlace: null,
  openDays: new Set()
};

document.addEventListener('DOMContentLoaded', () => {
  cacheDom();
  dom.version.textContent = `v${APP_VERSION}`;
  injectSprite(dom.spriteHost).then(() => applyThemeIcon(readPrefs().theme || 'auto'));
  applyTheme(readPrefs().theme || 'auto');
  wireEvents();
  registerServiceWorker();
  renderSkeleton(dom.today, 4);
  boot();
  setInterval(() => { if (state.series) renderLive(); }, TICK_MS);
});

/** Collect the static elements of the shell once. */
function cacheDom() {
  const ids = ['spriteHost', 'location', 'banner', 'hero', 'today', 'chart', 'chartNote', 'freshness',
    'forecast', 'version', 'btnTheme', 'btnRefresh', 'btnLocate', 'btnStation', 'sheet', 'sheetClose',
    'search', 'pickerResults'];
  for (const id of ids) {
    dom[id] = document.getElementById(id.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));
  }
}

/** Attach the interaction handlers of the shell. */
function wireEvents() {
  dom.btnTheme.addEventListener('click', cycleTheme);
  dom.btnRefresh.addEventListener('click', () => {
    if (state.station) loadStation(state.station, { force: true });
  });
  dom.btnLocate.addEventListener('click', () => useDeviceLocation({ interactive: true }));
  dom.btnStation.addEventListener('click', openPicker);
  dom.sheetClose.addEventListener('click', () => dom.sheet.close());
  dom.search.addEventListener('input', debounce(handleSearchInput, SEARCH_DEBOUNCE_MS));

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !state.station) return;
    if (!state.fetchedAt || Date.now() - state.fetchedAt > CACHE_FRESH_MS) {
      loadStation(state.station, { silent: true });
    } else {
      renderLive();
    }
  });

  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(debounce(() => { if (state.series) drawChart(computeView()); }, 150));
    observer.observe(dom.chart);
  }
}

/** Decide where to start: saved station, or the device position. */
function boot() {
  const prefs = readPrefs();
  if (prefs.stationId) {
    const station = stationById(prefs.stationId);
    if (station) {
      state.placeLabel = prefs.placeLabel || station.name;
      state.placeMeta = prefs.placeMeta || '';
      state.distanceKm = Number.isFinite(prefs.distanceKm) ? prefs.distanceKm : null;
      loadStation(station, {});
      if (prefs.follow) useDeviceLocation({ interactive: false, quiet: true });
      return;
    }
  }
  useDeviceLocation({ interactive: false });
}

/* ------------------------------------------------------------- positioning */

/**
 * Ask the device for its position and switch to the nearest station.
 * @param {{interactive: boolean, quiet?: boolean}} options
 */
function useDeviceLocation({ interactive, quiet = false }) {
  if (!('geolocation' in navigator)) {
    if (!quiet) locationFallback('Dieses Gerät stellt keine Standortbestimmung bereit.');
    return;
  }

  // Also on first start, not only on an explicit tap: positioning can take
  // several seconds and an empty screen looks broken.
  if (interactive || !state.station) {
    showBanner(dom.banner, { kind: 'info', message: 'Standort wird bestimmt …', iconName: 'my-location' });
    renderLocation(dom.location, {
      placeLabel: 'Standort wird ermittelt …',
      placeMeta: '',
      station: null,
      distanceKm: null,
      sourceNote: ''
    });
    renderSkeleton(dom.hero, 2);
  }

  let answered = false;
  const watchdog = setTimeout(() => {
    if (answered || quiet) return;
    locationFallback('Der Standort ließ sich nicht ermitteln. Du kannst den Ort auch selbst suchen.');
  }, GEO_WATCHDOG_MS);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      answered = true;
      clearTimeout(watchdog);
      const { latitude, longitude } = position.coords;
      const nearest = nearestStations(latitude, longitude, 1)[0];
      if (!nearest) {
        locationFallback('In der Nähe deiner Position ist keine Gezeitenstation hinterlegt.');
        return;
      }
      clearBanner(dom.banner);
      state.placeLabel = 'Aktueller Standort';
      state.placeMeta = formatCoordinates(latitude, longitude);
      state.distanceKm = nearest.distanceKm;
      writePrefs({
        stationId: nearest.id,
        placeLabel: state.placeLabel,
        placeMeta: state.placeMeta,
        distanceKm: nearest.distanceKm,
        follow: true
      });
      loadStation(nearest, {});
    },
    (error) => {
      answered = true;
      clearTimeout(watchdog);
      if (quiet) return;
      const messages = {
        1: 'Ohne Standortfreigabe kann die nächste Station nicht bestimmt werden. Du kannst den Ort auch selbst suchen.',
        2: 'Der Standort ist gerade nicht ermittelbar. Bitte den Ort selbst suchen.',
        3: 'Die Standortbestimmung hat zu lange gedauert. Bitte erneut versuchen oder den Ort selbst suchen.'
      };
      locationFallback(messages[error.code] || 'Der Standort konnte nicht ermittelt werden.');
    },
    { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: 5 * 60000 }
  );
}

/**
 * Offer the manual search when positioning is unavailable.
 * @param {string} message
 */
function locationFallback(message) {
  showBanner(dom.banner, {
    kind: 'warning',
    message,
    actionLabel: 'Ort suchen',
    onAction: openPicker
  });
  if (!state.station) {
    fill(dom.hero, el('p', 'meta', 'Bitte einen Ort wählen, um die Gezeiten anzuzeigen.'));
    fill(dom.today, el('p', 'meta', 'Noch keine Station ausgewählt.'));
    renderLocation(dom.location, {
      placeLabel: 'Kein Ort gewählt',
      placeMeta: '',
      station: null,
      distanceKm: null,
      sourceNote: ''
    });
  }
}

/* -------------------------------------------------------------- data loading */

/**
 * Load the series for a station, preferring a fresh cache entry.
 * @param {object} station
 * @param {{force?: boolean, silent?: boolean}} options
 */
async function loadStation(station, { force = false, silent = false }) {
  state.station = station;
  const cached = readCache(station.id);

  if (cached && !force && isUsable(cached) && Date.now() - cached.fetchedAt < CACHE_FRESH_MS) {
    applySeries(cached.series, cached.fetchedAt, { stale: false, offsetUsed: cached.offsetUsed });
    return;
  }

  if (cached && isUsable(cached)) {
    applySeries(cached.series, cached.fetchedAt, { stale: true, offsetUsed: cached.offsetUsed });
  } else if (!silent) {
    renderSkeleton(dom.today, 4);
    renderSkeleton(dom.hero, 2);
  }

  dom.btnRefresh.disabled = true;
  try {
    const series = await fetchSeaLevel(station.lat, station.lon);
    const fetchedAt = Date.now();
    writeCache(station.id, { fetchedAt, series, offsetUsed: series.offsetUsed });
    clearBanner(dom.banner);
    applySeries(series, fetchedAt, { stale: false, offsetUsed: series.offsetUsed });
  } catch (error) {
    const message = error instanceof ApiError
      ? error.message
      : 'Beim Laden der Gezeitendaten ist ein unerwarteter Fehler aufgetreten.';
    if (state.series) {
      showBanner(dom.banner, {
        kind: 'warning',
        message: `${message} Angezeigt werden die zuletzt gespeicherten Daten.`,
        actionLabel: 'Erneut versuchen',
        onAction: () => loadStation(station, { force: true }),
        iconName: 'history'
      });
    } else {
      showBanner(dom.banner, {
        kind: 'error',
        message,
        actionLabel: 'Erneut versuchen',
        onAction: () => loadStation(station, { force: true })
      });
      fill(dom.today, el('p', 'meta', 'Keine Daten verfügbar.'));
      fill(dom.hero, el('p', 'meta', 'Keine Daten verfügbar.'));
    }
  } finally {
    dom.btnRefresh.disabled = false;
  }
}

/**
 * @param {object} series
 * @param {number} fetchedAt
 * @param {{stale: boolean, offsetUsed?: boolean}} flags
 */
function applySeries(series, fetchedAt, { stale, offsetUsed = false }) {
  state.series = series;
  state.fetchedAt = fetchedAt;
  state.stale = stale;
  state.offsetUsed = Boolean(offsetUsed);
  render();
}

/**
 * A cache entry is only usable while it still covers the current time.
 * @param {object} entry
 * @returns {boolean}
 */
function isUsable(entry) {
  const samples = entry && entry.series && entry.series.samples;
  if (!Array.isArray(samples) || samples.length < 12) return false;
  const nowTl = Date.now() + (entry.series.utcOffsetSeconds || 0) * 1000;
  return samples[samples.length - 1].tl > nowTl;
}

/* ------------------------------------------------------------------ render */

/**
 * Derive everything the view needs from the cached series.
 * @returns {object|null}
 */
function computeView() {
  const { series, station } = state;
  if (!series || !station) return null;

  const nowTl = Date.now() + series.utcOffsetSeconds * 1000;
  const dayStart = startOfDay(nowTl);
  const dayEnd = dayStart + DAY_MS;
  const extremes = findExtremes(series.samples);
  const todaysEvents = extremes.filter((event) => event.tl >= dayStart && event.tl < dayEnd);
  const curve = buildCurve(series.samples, dayStart, dayEnd, 5);

  return {
    series,
    station,
    nowTl,
    dayStart,
    dayEnd,
    extremes,
    todaysEvents,
    todayRange: rangeOf(todaysEvents),
    curve,
    curveRange: curve.length ? Math.max(...curve.map((p) => p.v)) - Math.min(...curve.map((p) => p.v)) : null,
    sun: sunTimes(dayStart, station.lat, station.lon, series.utcOffsetSeconds),
    laterDays: groupByDay(extremes.filter((event) => event.tl >= dayEnd))
      .filter((day) => day.dayStart < dayEnd + FORECAST_DAYS_SHOWN * DAY_MS)
  };
}

/** Full rebuild: after a station change or a fresh series. */
function render() {
  const view = computeView();
  if (!view) return;
  renderHeader(view);
  renderLivePart(view);
  renderForecastPart(view);
}

/**
 * Rebuild only the time dependent parts. Called every minute, so it must not
 * touch the forecast section: that would collapse an expanded day and drop the
 * keyboard focus.
 */
function renderLive() {
  const view = computeView();
  if (view) renderLivePart(view);
}

/**
 * @param {object} view
 */
function renderHeader(view) {
  renderLocation(dom.location, {
    placeLabel: state.placeLabel || view.station.name,
    placeMeta: state.placeMeta,
    station: view.station,
    distanceKm: state.distanceKm,
    sourceNote: view.series.timezone ? `Zeitzone ${view.series.timezone}` : ''
  });
  document.title = `TiedeCharts – ${view.station.name}`;
}

/**
 * @param {object} view
 */
function renderLivePart(view) {
  renderHero(dom.hero, {
    next: nextExtreme(view.extremes, view.nowTl),
    currentLevel: valueAt(view.series.samples, view.nowTl),
    trend: trendAt(view.series.samples, view.nowTl),
    dayRange: view.todayRange,
    nowTl: view.nowTl,
    weakTide: (view.todayRange ?? view.curveRange ?? Infinity) < WEAK_TIDE_RANGE_M,
    curveRange: view.curveRange
  });
  renderToday(dom.today, {
    events: view.todaysEvents,
    curveRange: view.curveRange,
    nowTl: view.nowTl
  });
  drawChart(view);
  renderFreshness(dom.freshness, state.fetchedAt);
}

/**
 * @param {object} view
 */
function renderForecastPart(view) {
  renderForecast(dom.forecast, {
    days: view.laterDays,
    nowTl: view.nowTl,
    openKeys: state.openDays,
    onToggle: (key, open) => {
      if (open) state.openDays.add(key);
      else state.openDays.delete(key);
    }
  });
}

/**
 * @param {object} view
 */
function drawChart(view) {
  if (!view) return;
  if (state.chart) state.chart.destroy();
  state.chart = renderChart(dom.chart, {
    curve: view.curve,
    extremes: view.extremes,
    dayStart: view.dayStart,
    dayEnd: view.dayEnd,
    nowTl: view.nowTl,
    sun: view.sun
  });
  dom.chartNote.textContent = view.curve.length
    ? 'Wasserstand in Meter über mittlerem Meeresspiegel (MSL), nicht über Seekartennull.'
    : 'Für heute liegen keine Kurvenwerte vor.';
}

/**
 * Tidal range of a set of events.
 * @param {Array<{v: number, type: string}>} events
 * @returns {number|null}
 */
function rangeOf(events) {
  const highs = events.filter((event) => event.type === 'high').map((event) => event.v);
  const lows = events.filter((event) => event.type === 'low').map((event) => event.v);
  if (!highs.length || !lows.length) return null;
  return Math.max(...highs) - Math.min(...lows);
}

/* ------------------------------------------------------------------ picker */

/** Open the station sheet showing the stations nearest to the current anchor. */
function openPicker() {
  state.pickerPlace = null;
  dom.search.value = '';
  showNearbyStations();
  if (typeof dom.sheet.showModal === 'function') dom.sheet.showModal();
  else dom.sheet.setAttribute('open', '');
  dom.search.focus({ preventScroll: true });
}

/** Default picker content: stations near the current station or place. */
function showNearbyStations() {
  const anchor = state.station;
  if (!anchor) {
    renderPickerResults(dom.pickerResults, {
      title: 'Ort suchen',
      note: 'Ortsnamen oder Stationsnamen eingeben, zum Beispiel „Cuxhaven" oder „Sylt".',
      stations: [],
      places: [],
      onStation: chooseStation,
      onPlace: choosePlace
    });
    return;
  }
  renderPickerResults(dom.pickerResults, {
    title: 'Stationen in der Nähe',
    stations: nearestStations(anchor.lat, anchor.lon, 8),
    places: [],
    onStation: chooseStation,
    onPlace: choosePlace
  });
}

/** Search stations locally and places via the geocoder. */
async function handleSearchInput() {
  const query = dom.search.value.trim();
  if (query.length < 2) {
    showNearbyStations();
    return;
  }

  const stations = searchStations(query);
  renderPickerResults(dom.pickerResults, {
    title: 'Messstationen',
    stations,
    places: [],
    note: 'Orte werden gesucht …',
    onStation: chooseStation,
    onPlace: choosePlace
  });

  try {
    const places = await geocode(query);
    if (dom.search.value.trim() !== query) return;
    renderPickerResults(dom.pickerResults, {
      title: 'Messstationen',
      stations,
      places,
      onStation: chooseStation,
      onPlace: choosePlace
    });
  } catch (error) {
    if (dom.search.value.trim() !== query) return;
    renderPickerResults(dom.pickerResults, {
      title: 'Messstationen',
      stations,
      places: [],
      note: error instanceof ApiError
        ? `Ortssuche nicht möglich: ${error.message}`
        : 'Ortssuche nicht möglich.',
      onStation: chooseStation,
      onPlace: choosePlace
    });
  }
}

/**
 * A place was picked: offer the stations around it.
 * @param {{name: string, admin: string, country: string, lat: number, lon: number}} place
 */
function choosePlace(place) {
  state.pickerPlace = place;
  renderPickerResults(dom.pickerResults, {
    title: `Stationen in der Nähe von ${place.name}`,
    stations: nearestStations(place.lat, place.lon, 8),
    places: [],
    onStation: chooseStation,
    onPlace: choosePlace
  });
}

/**
 * A station was picked: remember it and load its data.
 * @param {object} station
 */
function chooseStation(station) {
  const place = state.pickerPlace;
  state.placeLabel = place ? place.name : station.name;
  state.placeMeta = place
    ? [place.admin, place.country].filter(Boolean).join(', ')
    : station.countryName;
  state.distanceKm = Number.isFinite(station.distanceKm) ? station.distanceKm : null;

  writePrefs({
    stationId: station.id,
    placeLabel: state.placeLabel,
    placeMeta: state.placeMeta,
    distanceKm: state.distanceKm,
    follow: false
  });

  dom.sheet.close();
  clearBanner(dom.banner);
  loadStation(station, {});
}

/* ------------------------------------------------------------------- theme */

/** Cycle auto -> light -> dark -> auto. */
function cycleTheme() {
  const order = ['auto', 'light', 'dark'];
  const current = readPrefs().theme || 'auto';
  const next = order[(order.indexOf(current) + 1) % order.length];
  writePrefs({ theme: next });
  applyTheme(next);
  applyThemeIcon(next);
}

/**
 * @param {string} theme auto, light or dark
 */
function applyTheme(theme) {
  if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
}

/**
 * @param {string} theme
 */
function applyThemeIcon(theme) {
  const labels = { auto: 'Farbschema: automatisch', light: 'Farbschema: hell', dark: 'Farbschema: dunkel' };
  const icons = { auto: 'auto-mode', light: 'light-mode', dark: 'dark-mode' };
  dom.btnTheme.setAttribute('aria-label', labels[theme]);
  dom.btnTheme.setAttribute('title', labels[theme]);
  fill(dom.btnTheme, icon(icons[theme]));
}

/* ----------------------------------------------------------------- storage */

/**
 * @returns {object} stored preferences, empty object when unavailable
 */
function readPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
  } catch {
    return {};
  }
}

/**
 * Merge and persist preferences. Storage may be unavailable (private mode),
 * in that case the app simply forgets the choice.
 * @param {object} patch
 */
function writePrefs(patch) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...readPrefs(), ...patch }));
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} stationId
 * @returns {object|null}
 */
function readCache(stationId) {
  try {
    return JSON.parse(localStorage.getItem(CACHE_PREFIX + stationId));
  } catch {
    return null;
  }
}

/**
 * @param {string} stationId
 * @param {object} entry
 */
function writeCache(stationId, entry) {
  try {
    localStorage.setItem(CACHE_PREFIX + stationId, JSON.stringify(entry));
  } catch {
    // Quota exceeded: drop other stations' caches and retry once.
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(CACHE_PREFIX) && key !== CACHE_PREFIX + stationId) localStorage.removeItem(key);
      }
      localStorage.setItem(CACHE_PREFIX + stationId, JSON.stringify(entry));
    } catch {
      /* ignore */
    }
  }
}

/* ------------------------------------------------------------------ helpers */

/**
 * @param {Function} fn
 * @param {number} wait
 * @returns {Function}
 */
function debounce(fn, wait) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/** Register the offline cache; failures are not user relevant. */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register(`sw.js?v=${APP_VERSION}`).catch(() => {});
}
