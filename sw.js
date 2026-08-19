/*
 * Service worker: offline shell for TiedeCharts.
 * thought up by human, coded by ai
 *
 * The cache name is derived from the ?v= query parameter that js/app.js appends
 * when registering, so the single version constant in js/version.js also
 * controls cache invalidation.
 *
 * Tide data is not cached here. It is stored per station in localStorage by the
 * app, which knows how old a series may get and can label stale values in the
 * interface - a cache entry could not.
 *
 * Static files use stale-while-revalidate rather than cache-first: the cached
 * copy answers immediately (so offline works and the app starts instantly), and
 * the background refresh means a deployment is picked up on the next load even
 * if the cache name did not change.
 */

const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE_NAME = `tiedecharts-${VERSION}`;

const SHELL = [
  './',
  'index.html',
  'style.css',
  'manifest.webmanifest',
  'css/design-tokens.css',
  'css/design-components.css',
  'icons/icon-sprite.svg',
  'assets/favicon.svg',
  'assets/icon-180.png',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/icon-maskable-512.png',
  'js/api.js',
  'js/app.js',
  'js/chart.js',
  'js/format.js',
  'js/stations.js',
  'js/sun.js',
  'js/tides.js',
  'js/ui.js',
  'js/version.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // addAll fails as a unit; add individually so one missing file cannot break
    // the whole installation.
    await Promise.all(SHELL.map((path) => cache.add(new Request(path, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith('tiedecharts-') && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Leave the tide and geocoding APIs to the app: it has its own cache and
  // needs to know whether a response came from the network.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request, event));
});

/**
 * Fresh document when online, cached shell when offline.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) ||
      (await cache.match('index.html')) ||
      (await cache.match('./')) ||
      Response.error();
  }
}

/**
 * Static assets: answer from the cache at once, refresh it in the background.
 * @param {Request} request
 * @param {FetchEvent} event keeps the worker alive for the background refresh
 * @returns {Promise<Response>}
 */
async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const refresh = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === 'basic') cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    if (event) event.waitUntil(refresh);
    return cached;
  }
  return (await refresh) || Response.error();
}
