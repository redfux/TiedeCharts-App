/*
 * Tide mathematics: interpolation, high and low water detection.
 * thought up by human, coded by ai
 *
 * The provider delivers hourly sea level samples. Hourly resolution would put
 * high water on a full hour, so the series is interpolated with a Catmull-Rom
 * spline and the extremes are refined on the spline. For a semidiurnal tide the
 * residual error is in the low single digit minutes - accurate enough for
 * planning, explicitly not for navigation (see readme.md).
 */

import { dayKey, startOfDay } from './format.js';

const MINUTE_MS = 60000;
const SCAN_STEP_MIN = 2;
/** Below this height difference a peak is noise rather than a tide. */
const MIN_PROMINENCE_M = 0.04;
/** Below this daily range the location has no usable tidal signal. */
export const WEAK_TIDE_RANGE_M = 0.12;

/**
 * Interpolate the series at an arbitrary time using a Catmull-Rom spline.
 * @param {Array<{tl: number, v: number}>} samples ascending by tl
 * @param {number} tl local epoch ms
 * @returns {number|null} null outside the covered range
 */
export function valueAt(samples, tl) {
  if (!samples.length) return null;
  if (tl < samples[0].tl || tl > samples[samples.length - 1].tl) return null;

  let hi = lowerBound(samples, tl);
  if (hi <= 0) return samples[0].v;
  const i1 = hi - 1;
  const i2 = hi;
  const p1 = samples[i1];
  const p2 = samples[i2];
  const span = p2.tl - p1.tl;
  if (span <= 0) return p1.v;

  const p0 = samples[i1 - 1] || p1;
  const p3 = samples[i2 + 1] || p2;
  const u = (tl - p1.tl) / span;

  // Uniform Catmull-Rom; gaps in the series are rare and only slightly bias the
  // tangents, while a non-uniform variant would add noticeable complexity.
  const m1 = (p2.v - p0.v) / 2;
  const m2 = (p3.v - p1.v) / 2;
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1.v +
    (u3 - 2 * u2 + u) * m1 +
    (-2 * u3 + 3 * u2) * p2.v +
    (u3 - u2) * m2;
}

/**
 * Dense curve for the chart.
 * @param {Array<{tl: number, v: number}>} samples
 * @param {number} fromTl
 * @param {number} toTl
 * @param {number} [stepMin]
 * @returns {Array<{tl: number, v: number}>}
 */
export function buildCurve(samples, fromTl, toTl, stepMin = 5) {
  const step = stepMin * MINUTE_MS;
  const curve = [];
  for (let tl = fromTl; tl <= toTl; tl += step) {
    const v = valueAt(samples, tl);
    if (v !== null) curve.push({ tl, v });
  }
  return curve;
}

/**
 * Detect high and low water within a time window.
 * @param {Array<{tl: number, v: number}>} samples
 * @param {number} [fromTl]
 * @param {number} [toTl]
 * @returns {Array<{tl: number, v: number, type: 'high'|'low'}>}
 */
export function findExtremes(samples, fromTl, toTl) {
  if (samples.length < 3) return [];
  const start = Math.max(fromTl ?? samples[0].tl, samples[0].tl);
  const end = Math.min(toTl ?? samples[samples.length - 1].tl, samples[samples.length - 1].tl);
  if (end <= start) return [];

  const step = SCAN_STEP_MIN * MINUTE_MS;
  const scan = [];
  for (let tl = start; tl <= end; tl += step) {
    const v = valueAt(samples, tl);
    if (v !== null) scan.push({ tl, v });
  }
  if (scan.length < 3) return [];

  const found = [];
  for (let i = 1; i < scan.length - 1; i += 1) {
    const prev = scan[i - 1].v;
    const curr = scan[i].v;
    const next = scan[i + 1].v;
    const isHigh = curr > prev && curr >= next;
    const isLow = curr < prev && curr <= next;
    if (!isHigh && !isLow) continue;
    const refined = refine(scan[i - 1], scan[i], scan[i + 1]);
    found.push({ tl: refined.tl, v: refined.v, type: isHigh ? 'high' : 'low' });
  }

  return consolidate(found);
}

/**
 * Clean up the raw candidate list.
 *
 * Alternation and noise removal depend on each other: dropping a shallow dip can
 * leave two crests next to each other, and merging those can turn a neighbouring
 * peak into noise. With coarsely quantised input - the provider rounds to whole
 * centimetres, which matters where the range is only a few of them - one pass is
 * not enough, so both steps run until the list stops changing.
 * @param {Array<{tl: number, v: number, type: string}>} list
 * @returns {Array<{tl: number, v: number, type: string}>}
 */
function consolidate(list) {
  let current = enforceAlternation(list);
  for (let pass = 0; pass < 5; pass += 1) {
    const reduced = enforceAlternation(dropNoise(current));
    if (reduced.length === current.length) return reduced;
    current = reduced;
  }
  return current;
}

/**
 * Parabola through three scan points; its vertex is the refined extreme.
 * @param {{tl: number, v: number}} a
 * @param {{tl: number, v: number}} b
 * @param {{tl: number, v: number}} c
 * @returns {{tl: number, v: number}}
 */
function refine(a, b, c) {
  const denominator = a.v - 2 * b.v + c.v;
  if (denominator === 0) return { tl: b.tl, v: b.v };
  const shift = 0.5 * (a.v - c.v) / denominator; // in scan steps, within [-1, 1]
  const step = b.tl - a.tl;
  const tl = b.tl + shift * step;
  const v = b.v - 0.25 * (a.v - c.v) * shift;
  return { tl: Math.round(tl), v };
}

/**
 * A tide alternates high, low, high. Consecutive peaks of the same kind come
 * from a flat crest, so only the most extreme one survives.
 * @param {Array<{tl: number, v: number, type: string}>} list
 * @returns {Array<{tl: number, v: number, type: string}>}
 */
function enforceAlternation(list) {
  const out = [];
  for (const item of list) {
    const last = out[out.length - 1];
    if (!last || last.type !== item.type) {
      out.push(item);
      continue;
    }
    const keepNew = item.type === 'high' ? item.v > last.v : item.v < last.v;
    if (keepNew) out[out.length - 1] = item;
  }
  return out;
}

/**
 * Remove peak pairs whose amplitude is below the noise floor.
 * @param {Array<{tl: number, v: number, type: string}>} list
 * @returns {Array<{tl: number, v: number, type: string}>}
 */
function dropNoise(list) {
  if (list.length < 2) return list;
  return list.filter((item, index) => {
    const prev = list[index - 1];
    const next = list[index + 1];
    const dPrev = prev ? Math.abs(item.v - prev.v) : Infinity;
    const dNext = next ? Math.abs(item.v - next.v) : Infinity;
    return Math.max(dPrev, dNext) >= MIN_PROMINENCE_M;
  });
}

/**
 * Binary search for the first index with tl >= target.
 * @param {Array<{tl: number}>} samples
 * @param {number} target
 * @returns {number}
 */
function lowerBound(samples, target) {
  let low = 0;
  let high = samples.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (samples[mid].tl < target) low = mid + 1;
    else high = mid;
  }
  return low;
}

/**
 * Group extremes into days, each with its tidal range.
 * @param {Array<{tl: number, v: number, type: string}>} extremes
 * @returns {Array<{key: string, dayStart: number, events: Array, range: number|null}>}
 */
export function groupByDay(extremes) {
  const byDay = new Map();
  for (const event of extremes) {
    const key = dayKey(event.tl);
    if (!byDay.has(key)) {
      byDay.set(key, { key, dayStart: startOfDay(event.tl), events: [], range: null });
    }
    byDay.get(key).events.push(event);
  }
  for (const day of byDay.values()) {
    const highs = day.events.filter((event) => event.type === 'high').map((event) => event.v);
    const lows = day.events.filter((event) => event.type === 'low').map((event) => event.v);
    day.range = highs.length && lows.length ? Math.max(...highs) - Math.min(...lows) : null;
  }
  return [...byDay.values()].sort((a, b) => a.dayStart - b.dayStart);
}

/**
 * The next high or low water after a point in time.
 * @param {Array<{tl: number}>} extremes
 * @param {number} nowTl
 * @returns {object|null}
 */
export function nextExtreme(extremes, nowTl) {
  return extremes.find((event) => event.tl > nowTl) || null;
}

/**
 * Rising or falling water at a point in time.
 * @param {Array<{tl: number, v: number}>} samples
 * @param {number} nowTl
 * @returns {'rising'|'falling'|'unknown'}
 */
export function trendAt(samples, nowTl) {
  const before = valueAt(samples, nowTl - 20 * MINUTE_MS);
  const after = valueAt(samples, nowTl + 20 * MINUTE_MS);
  if (before === null || after === null) return 'unknown';
  if (Math.abs(after - before) < 0.005) return 'unknown';
  return after > before ? 'rising' : 'falling';
}
