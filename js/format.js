/*
 * Formatting helpers for station local times, heights and distances.
 * thought up by human, coded by ai
 *
 * All timestamps are "local epoch" values (station wall clock interpreted as
 * UTC), so every function reads them with the UTC getters. Using the regular
 * getters here would silently shift times to the device time zone.
 */

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const MINUTE_MS = 60000;
const DAY_MS = 86400000;

/**
 * @param {number} tl local epoch ms
 * @returns {string} "14:32"
 */
export function fmtTime(tl) {
  const date = new Date(tl);
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

/**
 * @param {number} tl local epoch ms
 * @returns {string} "Mo., 18.08."
 */
export function fmtDateShort(tl) {
  const date = new Date(tl);
  return `${WEEKDAYS_SHORT[date.getUTCDay()]}., ${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.`;
}

/**
 * Day heading relative to the station's today.
 * @param {number} tl local epoch ms
 * @param {number} nowTl local epoch ms
 * @returns {string}
 */
export function fmtDayLabel(tl, nowTl) {
  const diffDays = Math.round((startOfDay(tl) - startOfDay(nowTl)) / DAY_MS);
  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Morgen';
  if (diffDays === -1) return 'Gestern';
  const date = new Date(tl);
  return `${WEEKDAYS[date.getUTCDay()]}, ${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.`;
}

/**
 * Midnight of the day a timestamp belongs to.
 * @param {number} tl local epoch ms
 * @returns {number}
 */
export function startOfDay(tl) {
  const date = new Date(tl);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Sortable day key, e.g. "2026-08-18".
 * @param {number} tl local epoch ms
 * @returns {string}
 */
export function dayKey(tl) {
  const date = new Date(tl);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * Signed height with a German decimal comma, e.g. "+1,23 m".
 * @param {number} metres
 * @returns {string}
 */
export function fmtHeight(metres) {
  const sign = metres > 0 ? '+' : metres < 0 ? '−' : '';
  return `${sign}${Math.abs(metres).toFixed(2).replace('.', ',')} m`;
}

/**
 * Unsigned height difference, e.g. "2,45 m".
 * @param {number} metres
 * @returns {string}
 */
export function fmtRange(metres) {
  return `${Math.abs(metres).toFixed(2).replace('.', ',')} m`;
}

/**
 * Relative wording for an upcoming or past event.
 * @param {number} targetTl local epoch ms
 * @param {number} nowTl local epoch ms
 * @returns {string}
 */
export function fmtRelative(targetTl, nowTl) {
  const minutes = Math.round((targetTl - nowTl) / MINUTE_MS);
  const absMinutes = Math.abs(minutes);
  if (absMinutes < 1) return 'jetzt';
  const text = absMinutes < 60
    ? `${absMinutes} min`
    : `${Math.floor(absMinutes / 60)} h ${pad(absMinutes % 60)} min`;
  return minutes > 0 ? `in ${text}` : `vor ${text}`;
}

/**
 * Distance wording, metres below 1 km.
 * @param {number} km
 * @returns {string}
 */
export function fmtDistance(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m entfernt`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km entfernt`;
  return `${Math.round(km)} km entfernt`;
}

/**
 * Age of cached data in words.
 * @param {number} fetchedAt epoch ms (real UTC)
 * @returns {string}
 */
export function fmtAge(fetchedAt) {
  const minutes = Math.max(0, Math.round((Date.now() - fetchedAt) / MINUTE_MS));
  if (minutes < 1) return 'gerade aktualisiert';
  if (minutes < 60) return `Stand vor ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Stand vor ${hours} h`;
  return `Stand vor ${Math.floor(hours / 24)} Tagen`;
}

/**
 * @param {number} value
 * @returns {string}
 */
function pad(value) {
  return String(value).padStart(2, '0');
}
