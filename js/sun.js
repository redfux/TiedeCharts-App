/*
 * Sunrise and sunset, computed locally.
 * thought up by human, coded by ai
 *
 * Standard low precision solar algorithm (NOAA), accurate to about a minute -
 * plenty for shading night hours in the tide chart. Computing it here avoids a
 * third API host in the Content-Security-Policy.
 */

const DAY_MS = 86400000;
const RAD = Math.PI / 180;
/** Sun centre 0.833 deg below the horizon: refraction plus solar radius. */
const ZENITH = 90.833;

/**
 * Sunrise and sunset for a day, as local epoch ms (same convention as the
 * tide series: station wall clock interpreted as UTC).
 * @param {number} dayStartTl local epoch ms of midnight
 * @param {number} lat
 * @param {number} lon
 * @param {number} utcOffsetSeconds station offset from UTC
 * @returns {{sunrise: number|null, sunset: number|null, polar: 'day'|'night'|null}}
 */
export function sunTimes(dayStartTl, lat, lon, utcOffsetSeconds) {
  const date = new Date(dayStartTl);
  const dayOfYear = Math.floor((dayStartTl - Date.UTC(date.getUTCFullYear(), 0, 1)) / DAY_MS) + 1;

  const rise = solarEvent(dayOfYear, lat, lon, true);
  const set = solarEvent(dayOfYear, lat, lon, false);

  if (rise === null || set === null) {
    // Polar day or night: decide by the sun's noon elevation.
    return { sunrise: null, sunset: null, polar: noonElevation(dayOfYear, lat) > 0 ? 'day' : 'night' };
  }

  const offsetHours = utcOffsetSeconds / 3600;
  return {
    sunrise: dayStartTl + wrapHours(rise + offsetHours) * 3600000,
    sunset: dayStartTl + wrapHours(set + offsetHours) * 3600000,
    polar: null
  };
}

/**
 * UTC hour of sunrise or sunset.
 * @param {number} dayOfYear
 * @param {number} lat
 * @param {number} lon
 * @param {boolean} rising
 * @returns {number|null} null when the sun does not cross the horizon
 */
function solarEvent(dayOfYear, lat, lon, rising) {
  const lngHour = lon / 15;
  const t = dayOfYear + ((rising ? 6 : 18) - lngHour) / 24;

  const meanAnomaly = 0.9856 * t - 3.289;
  let trueLong = meanAnomaly + 1.916 * Math.sin(meanAnomaly * RAD) +
    0.020 * Math.sin(2 * meanAnomaly * RAD) + 282.634;
  trueLong = wrapDegrees(trueLong);

  let rightAsc = Math.atan(0.91764 * Math.tan(trueLong * RAD)) / RAD;
  rightAsc = wrapDegrees(rightAsc);
  // Keep right ascension in the same quadrant as the true longitude.
  rightAsc += Math.floor(trueLong / 90) * 90 - Math.floor(rightAsc / 90) * 90;
  rightAsc /= 15;

  const sinDec = 0.39782 * Math.sin(trueLong * RAD);
  const cosDec = Math.cos(Math.asin(sinDec));

  const cosHour = (Math.cos(ZENITH * RAD) - sinDec * Math.sin(lat * RAD)) /
    (cosDec * Math.cos(lat * RAD));
  if (cosHour > 1 || cosHour < -1) return null;

  const hourAngle = rising
    ? (360 - Math.acos(cosHour) / RAD) / 15
    : (Math.acos(cosHour) / RAD) / 15;

  return wrapHours(hourAngle + rightAsc - 0.06571 * t - 6.622 - lngHour);
}

/**
 * Solar elevation at local noon, used to tell polar day from polar night.
 * @param {number} dayOfYear
 * @param {number} lat
 * @returns {number} degrees
 */
function noonElevation(dayOfYear, lat) {
  const declination = 23.44 * Math.sin(((360 / 365.24) * (dayOfYear - 80.5)) * RAD);
  return 90 - Math.abs(lat - declination);
}

/**
 * @param {number} value
 * @returns {number} value wrapped into [0, 360)
 */
function wrapDegrees(value) {
  return ((value % 360) + 360) % 360;
}

/**
 * @param {number} value
 * @returns {number} value wrapped into [0, 24)
 */
function wrapHours(value) {
  return ((value % 24) + 24) % 24;
}
