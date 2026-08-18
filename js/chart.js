/*
 * Tide curve chart - hand written inline SVG, no charting library.
 * thought up by human, coded by ai
 *
 * Deliberate design choices:
 * - one data series, so no legend; the card title names it
 * - 2px line, recessive 1px grid, text labels in text tokens rather than the
 *   series colour, direct labels only on the high and low water points
 * - crosshair with a value bubble on pointer and touch input
 * - night hours shaded, so a low water at 03:00 is recognisable as such
 * The high and low water list next to the chart is its table view.
 */

import { fmtHeight, fmtTime } from './format.js';

const PAD = { top: 28, right: 14, bottom: 20, left: 38 };
const MIN_Y_SPAN_M = 0.3;
const Y_TICK_STEPS = [0.1, 0.2, 0.25, 0.5, 1, 2, 5];
const HOUR_MS = 3600000;

let gradientCounter = 0;

/**
 * Render the chart into a container element.
 * @param {HTMLElement} container
 * @param {object} options
 * @param {Array<{tl: number, v: number}>} options.curve dense series for the day
 * @param {Array<{tl: number, v: number, type: string}>} options.extremes
 * @param {number} options.dayStart local epoch ms
 * @param {number} options.dayEnd local epoch ms
 * @param {number|null} options.nowTl local epoch ms, null when not today
 * @param {{sunrise: number|null, sunset: number|null, polar: string|null}} options.sun
 * @returns {{destroy: function}} handle that detaches the pointer listeners
 */
export function renderChart(container, { curve, extremes, dayStart, dayEnd, nowTl, sun }) {
  container.textContent = '';
  if (!curve.length) return { destroy() {} };

  const width = Math.max(260, container.clientWidth || 320);
  const height = width < 380 ? 208 : 236;
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  const values = curve.map((point) => point.v);
  let min = Math.min(...values);
  let max = Math.max(...values);
  const span = Math.max(max - min, MIN_Y_SPAN_M);
  const centre = (min + max) / 2;
  min = centre - span / 2 - span * 0.12;
  max = centre + span / 2 + span * 0.12;

  const x = (tl) => PAD.left + ((tl - dayStart) / (dayEnd - dayStart)) * plotW;
  const y = (v) => PAD.top + (1 - (v - min) / (max - min)) * plotH;

  const gradientId = `tc-grad-${gradientCounter += 1}`;
  const parts = [];

  parts.push(`<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">`,
    '<stop class="chart__grad-from" offset="0"/>',
    '<stop class="chart__grad-to" offset="1"/>',
    '</linearGradient></defs>');

  // Night shading first, so grid and curve stay on top.
  for (const [from, to] of nightSpans(sun, dayStart, dayEnd)) {
    const left = x(from);
    parts.push(`<rect x="${round(left)}" y="${PAD.top}" width="${round(x(to) - left)}" ` +
      `height="${plotH}" class="chart__night"/>`);
  }

  // Horizontal grid with height labels.
  for (const tick of yTicks(min, max)) {
    const ty = y(tick);
    parts.push(`<line x1="${PAD.left}" y1="${round(ty)}" x2="${PAD.left + plotW}" y2="${round(ty)}" ` +
      'class="chart__grid"/>');
    parts.push(`<text x="${PAD.left - 6}" y="${round(ty + 3.5)}" text-anchor="end" ` +
      `class="chart__axis">${decimal(tick)}</text>`);
  }

  // Hour ticks.
  const tickStepH = plotW < 300 ? 6 : 3;
  for (let hour = 0; hour <= 24; hour += tickStepH) {
    const tx = x(dayStart + hour * HOUR_MS);
    parts.push(`<line x1="${round(tx)}" y1="${PAD.top}" x2="${round(tx)}" y2="${PAD.top + plotH}" ` +
      'class="chart__grid chart__grid--v"/>');
    if (hour < 24) {
      parts.push(`<text x="${round(tx)}" y="${height - 6}" text-anchor="${hour === 0 ? 'start' : 'middle'}" ` +
        `class="chart__axis">${String(hour).padStart(2, '0')}</text>`);
    }
  }

  // Area and line.
  const line = curve.map((point, index) =>
    `${index === 0 ? 'M' : 'L'}${round(x(point.tl))} ${round(y(point.v))}`).join(' ');
  const base = PAD.top + plotH;
  parts.push(`<path d="${line} L${round(x(curve[curve.length - 1].tl))} ${base} ` +
    `L${round(x(curve[0].tl))} ${base} Z" class="chart__area" fill="url(#${gradientId})"/>`);
  parts.push(`<path d="${line}" class="chart__line"/>`);

  // High and low water markers with direct labels.
  for (const event of extremes) {
    if (event.tl < dayStart || event.tl > dayEnd) continue;
    const ex = x(event.tl);
    const ey = y(event.v);
    parts.push(`<circle cx="${round(ex)}" cy="${round(ey)}" r="4.5" class="chart__marker"/>`);
    const labelY = event.type === 'high' ? ey - 12 : ey + 19;
    const clampedY = Math.min(Math.max(labelY, 12), height - 4);
    const clampedX = Math.min(Math.max(ex, PAD.left + 18), PAD.left + plotW - 18);
    parts.push(`<text x="${round(clampedX)}" y="${round(clampedY)}" text-anchor="middle" ` +
      'class="chart__marker-label">' +
      `${event.type === 'high' ? 'HW' : 'NW'} ${fmtTime(event.tl)}</text>`);
  }

  // Current time marker.
  if (nowTl !== null && nowTl >= dayStart && nowTl <= dayEnd) {
    const nx = x(nowTl);
    const nowPoint = nearestPoint(curve, nowTl);
    parts.push(`<line x1="${round(nx)}" y1="${PAD.top - 6}" x2="${round(nx)}" y2="${base}" ` +
      'class="chart__now-line"/>');
    if (nowPoint) {
      parts.push(`<circle cx="${round(nx)}" cy="${round(y(nowPoint.v))}" r="5" class="chart__now-dot"/>`);
    }
  }

  // Hover layer, hidden until the pointer enters the plot.
  parts.push('<g class="chart__hover">',
    `<line class="chart__hover-line" y1="${PAD.top}" y2="${base}"/>`,
    '<circle class="chart__hover-dot" r="4"/>',
    '<rect class="chart__hover-box" rx="6" width="88" height="34"/>',
    '<text class="chart__hover-time"></text>',
    '<text class="chart__hover-value"></text>',
    '</g>');

  parts.push(`<rect class="chart__surface" x="${PAD.left}" y="${PAD.top}" width="${plotW}" ` +
    `height="${plotH}"/>`);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('class', 'chart');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', chartSummary(extremes, dayStart));
  // Only numbers and fixed labels are interpolated above; no user input reaches
  // this markup.
  svg.innerHTML = parts.join('');
  container.appendChild(svg);

  return attachHover(svg, { curve, x, y, width, plotW, plotH });
}

/**
 * Wire pointer and touch interaction for the crosshair.
 * @param {SVGElement} svg
 * @param {object} context
 * @returns {{destroy: function}}
 */
function attachHover(svg, { curve, x, y, width, plotW, plotH }) {
  const group = svg.querySelector('.chart__hover');
  const line = svg.querySelector('.chart__hover-line');
  const dot = svg.querySelector('.chart__hover-dot');
  const box = svg.querySelector('.chart__hover-box');
  const timeText = svg.querySelector('.chart__hover-time');
  const valueText = svg.querySelector('.chart__hover-value');

  const move = (event) => {
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    const localX = (event.clientX - rect.left) * (width / rect.width);
    const ratio = (localX - PAD.left) / plotW;
    if (ratio < -0.02 || ratio > 1.02) {
      group.classList.remove('chart__hover--on');
      return;
    }
    const tl = curve[0].tl + ratio * (curve[curve.length - 1].tl - curve[0].tl);
    const point = nearestPoint(curve, tl);
    if (!point) return;

    const px = x(point.tl);
    const py = y(point.v);
    group.classList.add('chart__hover--on');
    line.setAttribute('x1', String(px));
    line.setAttribute('x2', String(px));
    dot.setAttribute('cx', String(px));
    dot.setAttribute('cy', String(py));

    const boxW = 88;
    const boxX = Math.min(Math.max(px - boxW / 2, PAD.left), PAD.left + plotW - boxW);
    const boxY = Math.max(PAD.top + 2, Math.min(py - 44, PAD.top + plotH - 40));
    box.setAttribute('x', String(boxX));
    box.setAttribute('y', String(boxY));
    timeText.setAttribute('x', String(boxX + 8));
    timeText.setAttribute('y', String(boxY + 15));
    timeText.textContent = `${fmtTime(point.tl)} Uhr`;
    valueText.setAttribute('x', String(boxX + 8));
    valueText.setAttribute('y', String(boxY + 28));
    valueText.textContent = fmtHeight(point.v);
  };

  const hide = () => { group.classList.remove('chart__hover--on'); };

  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerdown', move);
  svg.addEventListener('pointerleave', hide);
  svg.addEventListener('pointercancel', hide);

  return {
    destroy() {
      svg.removeEventListener('pointermove', move);
      svg.removeEventListener('pointerdown', move);
      svg.removeEventListener('pointerleave', hide);
      svg.removeEventListener('pointercancel', hide);
    }
  };
}

/**
 * Night intervals of the day, clipped to the chart window.
 * @param {{sunrise: number|null, sunset: number|null, polar: string|null}} sun
 * @param {number} dayStart
 * @param {number} dayEnd
 * @returns {Array<[number, number]>}
 */
function nightSpans(sun, dayStart, dayEnd) {
  if (!sun) return [];
  if (sun.polar === 'night') return [[dayStart, dayEnd]];
  if (sun.polar === 'day') return [];
  const spans = [];
  if (sun.sunrise !== null && sun.sunrise > dayStart) spans.push([dayStart, Math.min(sun.sunrise, dayEnd)]);
  if (sun.sunset !== null && sun.sunset < dayEnd) spans.push([Math.max(sun.sunset, dayStart), dayEnd]);
  return spans.filter(([from, to]) => to > from);
}

/**
 * Nice round grid values inside the value range.
 * @param {number} min
 * @param {number} max
 * @returns {Array<number>}
 */
function yTicks(min, max) {
  const span = max - min;
  const step = Y_TICK_STEPS.find((candidate) => span / candidate <= 5) ||
    Y_TICK_STEPS[Y_TICK_STEPS.length - 1];
  const ticks = [];
  const first = Math.ceil(min / step) * step;
  for (let value = first; value <= max + 1e-9; value += step) {
    ticks.push(Number(value.toFixed(3)));
  }
  return ticks;
}

/**
 * @param {Array<{tl: number, v: number}>} curve
 * @param {number} tl
 * @returns {{tl: number, v: number}|null}
 */
function nearestPoint(curve, tl) {
  if (!curve.length) return null;
  let best = curve[0];
  let bestDistance = Math.abs(curve[0].tl - tl);
  for (const point of curve) {
    const distance = Math.abs(point.tl - tl);
    if (distance < bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Screen reader summary of the plotted day.
 * @param {Array<{tl: number, type: string}>} extremes
 * @param {number} dayStart
 * @returns {string}
 */
function chartSummary(extremes, dayStart) {
  const sameDay = extremes.filter((event) =>
    event.tl >= dayStart && event.tl < dayStart + 24 * HOUR_MS);
  if (!sameDay.length) return 'Tidenkurve des Tages';
  const listed = sameDay
    .map((event) => `${event.type === 'high' ? 'Hochwasser' : 'Niedrigwasser'} ${fmtTime(event.tl)}`)
    .join(', ');
  return `Tidenkurve des Tages: ${listed}. Die Werte stehen zusätzlich als Liste unter dem Diagramm.`;
}

/**
 * @param {number} value
 * @returns {number} rounded to 0.1 px, keeps the markup small
 */
function round(value) {
  return Math.round(value * 10) / 10;
}

/**
 * German decimal notation for axis labels.
 * @param {number} value
 * @returns {string}
 */
function decimal(value) {
  return value.toFixed(1).replace('.', ',');
}
