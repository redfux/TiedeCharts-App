/*
 * DOM rendering for the tide view.
 * thought up by human, coded by ai
 *
 * All dynamic text is written with textContent, never innerHTML, so place names
 * coming from the geocoder can never be interpreted as markup.
 */

import { fmtAge, fmtDayLabel, fmtDistance, fmtHeight, fmtRange, fmtRelative, fmtTime } from './format.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Load the icon sprite once and inline it, so <use href="#ic-..."> stays a
 * same-document reference.
 * @param {HTMLElement} host
 * @returns {Promise<void>}
 */
export async function injectSprite(host) {
  try {
    const response = await fetch('icons/icon-sprite.svg', { cache: 'force-cache' });
    if (!response.ok) return;
    const markup = await response.text();
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const root = parsed.documentElement;
    if (root && root.localName === 'svg') host.appendChild(document.importNode(root, true));
  } catch {
    // Icons are decorative; a missing sprite must not break the app.
  }
}

/**
 * @param {string} name sprite symbol name without the ic- prefix
 * @param {string} [extraClass]
 * @returns {SVGElement}
 */
export function icon(name, extraClass = '') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', `i ${extraClass}`.trim());
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#ic-${name}`);
  svg.appendChild(use);
  return svg;
}

/**
 * Small element factory.
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
export function el(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/**
 * Replace the children of a node.
 * @param {HTMLElement} node
 * @param {...(Node|null)} children
 */
export function fill(node, ...children) {
  node.textContent = '';
  for (const child of children) {
    if (child) node.appendChild(child);
  }
}

/* ------------------------------------------------------------------ header */

/**
 * Location and station header.
 * @param {HTMLElement} root
 * @param {object} view
 */
export function renderLocation(root, view) {
  const { placeLabel, placeMeta, station, distanceKm, sourceNote } = view;

  const place = el('div', 'loc__place');
  place.appendChild(icon('place'));
  const placeText = el('div', 'loc__text');
  placeText.appendChild(el('div', 'loc__name', placeLabel));
  if (placeMeta) placeText.appendChild(el('div', 'meta', placeMeta));
  place.appendChild(placeText);

  const stationRow = el('div', 'loc__station');
  stationRow.appendChild(icon('waves', 'i--sm'));
  const stationText = el('div', 'loc__text');
  stationText.appendChild(el('div', 'loc__station-name',
    station ? `${station.name} (${station.country})` : 'Keine Station gewählt'));
  const metaParts = [];
  if (Number.isFinite(distanceKm)) metaParts.push(fmtDistance(distanceKm));
  if (sourceNote) metaParts.push(sourceNote);
  if (metaParts.length) stationText.appendChild(el('div', 'meta', metaParts.join(' · ')));
  stationRow.appendChild(stationText);

  fill(root, place, stationRow);
}

/* -------------------------------------------------------------------- hero */

/**
 * Next event plus current water level.
 * @param {HTMLElement} root
 * @param {object} view
 */
export function renderHero(root, view) {
  const { next, currentLevel, trend, dayRange, nowTl, weakTide, curveRange } = view;

  if (!next) {
    fill(root, el('p', 'meta', noTideExplanation(curveRange)));
    return;
  }

  const isHigh = next.type === 'high';
  const head = el('div', 'hero__head');
  head.appendChild(icon(isHigh ? 'arrow-up' : 'arrow-down', 'hero__icon'));
  head.appendChild(el('span', 'hero__kind', isHigh ? 'Nächstes Hochwasser' : 'Nächstes Niedrigwasser'));

  const time = el('div', 'hero__time');
  time.appendChild(el('strong', '', fmtTime(next.tl)));
  time.appendChild(el('span', 'hero__unit', 'Uhr'));

  const relative = el('div', 'hero__relative', fmtRelative(next.tl, nowTl));
  const dayHint = fmtDayLabel(next.tl, nowTl);
  if (dayHint !== 'Heute') relative.textContent += ` (${dayHint})`;

  const facts = el('div', 'hero__facts');
  facts.appendChild(fact('Höhe dann', fmtHeight(next.v)));
  if (currentLevel !== null) {
    facts.appendChild(fact('Aktuell', fmtHeight(currentLevel)));
  }
  if (trend !== 'unknown') {
    facts.appendChild(fact('Tendenz', trend === 'rising' ? 'auflaufend' : 'ablaufend'));
  }
  if (dayRange !== null && dayRange !== undefined) {
    facts.appendChild(fact('Tidenhub', fmtRange(dayRange)));
  }

  const children = [head, time, relative, facts];
  if (weakTide) {
    children.push(el('p', 'meta hero__note',
      'An dieser Station ist der Tidenhub sehr gering – Wind und Luftdruck wirken hier stärker als die Gezeiten.'));
  }
  fill(root, ...children);
}

/**
 * Why no high or low water can be named: either the location has practically no
 * tide, or the forecast window is exhausted.
 * @param {number|null} curveRange metres between the day's lowest and highest value
 * @returns {string}
 */
function noTideExplanation(curveRange) {
  if (curveRange !== null && curveRange < 0.06) {
    return `An dieser Station ist der Wasserstandsunterschied über den Tag mit ${Math.round(curveRange * 100)} cm ` +
      'so gering, dass sich kein eindeutiges Hoch- und Niedrigwasser bestimmen lässt. ' +
      'Der Wasserstand folgt hier vor allem Wind und Luftdruck.';
  }
  return 'Für den angezeigten Zeitraum liegt kein Hoch- oder Niedrigwasser vor.';
}

/**
 * @param {string} label
 * @param {string} value
 * @returns {HTMLElement}
 */
function fact(label, value) {
  const wrap = el('div', 'fact');
  wrap.appendChild(el('div', 'fact__label', label));
  wrap.appendChild(el('div', 'fact__value', value));
  return wrap;
}

/* ------------------------------------------------------------------- lists */

/**
 * Today's high and low water list.
 * @param {HTMLElement} root
 * @param {object} view
 */
export function renderToday(root, view) {
  const { events, curveRange, nowTl } = view;
  if (!events.length) {
    fill(root, el('p', 'meta', noTideExplanation(curveRange)));
    return;
  }
  // The tidal range is shown in the overview card above; repeating it here would
  // be the same number twice on one screen.
  fill(root, eventList(events, nowTl));
}

/**
 * @param {Array<object>} events
 * @param {number} nowTl
 * @returns {HTMLElement}
 */
function eventList(events, nowTl) {
  const list = el('ul', 'list');
  for (const event of events) {
    const isHigh = event.type === 'high';
    const item = el('li', 'list__item event');
    if (event.tl < nowTl) item.classList.add('event--past');

    item.appendChild(icon(isHigh ? 'arrow-up' : 'arrow-down', 'event__icon'));
    const main = el('div', 'list__main');
    main.appendChild(el('div', 'list__label', isHigh ? 'Hochwasser' : 'Niedrigwasser'));
    main.appendChild(el('div', 'list__meta', fmtHeight(event.v)));
    item.appendChild(main);

    const right = el('div', 'event__right');
    right.appendChild(el('div', 'event__time', `${fmtTime(event.tl)} Uhr`));
    right.appendChild(el('div', 'list__meta', fmtRelative(event.tl, nowTl)));
    item.appendChild(right);

    list.appendChild(item);
  }
  return list;
}

/**
 * Collapsible list of the following days.
 * @param {HTMLElement} root
 * @param {object} view
 */
export function renderForecast(root, view) {
  const { days, nowTl, openKeys, onToggle } = view;
  if (!days.length) {
    fill(root, el('p', 'meta', 'Keine weiteren Tage im Vorhersagezeitraum.'));
    return;
  }

  const wrap = el('div');
  for (const day of days) {
    const details = el('details', 'acc');
    // Restore what the user had expanded before the last rebuild.
    if (openKeys && openKeys.has(day.key)) details.open = true;
    if (onToggle) {
      details.addEventListener('toggle', () => onToggle(day.key, details.open));
    }
    const summary = el('summary', 'acc__summary');
    summary.appendChild(el('span', 'acc__day', fmtDayLabel(day.dayStart, nowTl)));

    const preview = el('span', 'acc__preview');
    const highs = day.events.filter((event) => event.type === 'high');
    preview.textContent = highs.length
      ? `HW ${highs.map((event) => fmtTime(event.tl)).join(' / ')}`
      : '—';
    summary.appendChild(preview);
    summary.appendChild(icon('chevron-down', 'acc__chevron i--sm'));

    details.appendChild(summary);
    const body = el('div', 'acc__body');
    body.appendChild(eventList(day.events, nowTl));
    if (day.range !== null) {
      body.appendChild(el('p', 'meta', `Tidenhub: ${fmtRange(day.range)}`));
    }
    details.appendChild(body);
    wrap.appendChild(details);
  }
  fill(root, wrap);
}

/* ----------------------------------------------------------------- banners */

/**
 * Show a status banner. Replaces any previous banner.
 * @param {HTMLElement} slot
 * @param {object} options
 */
export function showBanner(slot, { kind = 'info', message, actionLabel, onAction, iconName }) {
  const banner = el('div', `banner banner--${kind}`);
  banner.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  banner.appendChild(icon(iconName || (kind === 'error' ? 'warning' : 'info'), 'i--sm'));

  const body = el('div', 'banner__body');
  body.appendChild(el('div', '', message));
  if (actionLabel && onAction) {
    const actions = el('div', 'banner__actions');
    const button = el('button', 'btn btn--text', actionLabel);
    button.type = 'button';
    button.addEventListener('click', onAction);
    actions.appendChild(button);
    body.appendChild(actions);
  }
  banner.appendChild(body);
  fill(slot, banner);
}

/**
 * @param {HTMLElement} slot
 */
export function clearBanner(slot) {
  slot.textContent = '';
}

/**
 * Cache age note under the chart.
 * @param {HTMLElement} node
 * @param {number|null} fetchedAt
 */
export function renderFreshness(node, fetchedAt) {
  node.textContent = fetchedAt ? fmtAge(fetchedAt) : '';
}

/* ------------------------------------------------------- station selection */

/**
 * Render the result list inside the station sheet.
 * @param {HTMLElement} root
 * @param {object} options
 */
export function renderPickerResults(root, { title, stations = [], places = [], onStation, onPlace, note }) {
  const children = [];
  if (title) children.push(el('h3', 'picker__title', title));
  if (note) children.push(el('p', 'meta', note));

  if (stations.length) {
    const list = el('ul', 'list');
    for (const station of stations) {
      const item = el('li');
      const button = el('button', 'list__item');
      button.type = 'button';
      button.appendChild(icon('waves', 'i--sm'));
      const main = el('div', 'list__main');
      main.appendChild(el('div', 'list__label', station.name));
      const meta = [station.countryName];
      if (Number.isFinite(station.distanceKm)) meta.push(fmtDistance(station.distanceKm));
      main.appendChild(el('div', 'list__meta', meta.join(' · ')));
      button.appendChild(main);
      button.addEventListener('click', () => onStation(station));
      item.appendChild(button);
      list.appendChild(item);
    }
    children.push(list);
  }

  if (places.length) {
    children.push(el('h3', 'picker__title', 'Orte'));
    const list = el('ul', 'list');
    for (const place of places) {
      const item = el('li');
      const button = el('button', 'list__item');
      button.type = 'button';
      button.appendChild(icon('place', 'i--sm'));
      const main = el('div', 'list__main');
      main.appendChild(el('div', 'list__label', place.name));
      main.appendChild(el('div', 'list__meta', [place.admin, place.country].filter(Boolean).join(', ')));
      button.appendChild(main);
      button.addEventListener('click', () => onPlace(place));
      item.appendChild(button);
      list.appendChild(item);
    }
    children.push(list);
  }

  if (!stations.length && !places.length) {
    children.push(el('p', 'meta', 'Keine Treffer. Bitte anderen Suchbegriff versuchen.'));
  }

  fill(root, ...children);
}

/**
 * Skeleton placeholders while the first request is in flight.
 * @param {HTMLElement} root
 * @param {number} rows
 */
export function renderSkeleton(root, rows = 3) {
  const wrap = el('div', 'skeleton-stack');
  for (let i = 0; i < rows; i += 1) {
    wrap.appendChild(el('div', 'skeleton skeleton__row'));
  }
  fill(root, wrap);
}
