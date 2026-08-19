/*
 * Single source of truth for the app version.
 * thought up by human, coded by ai
 *
 * The literal itself sits in the <meta name="app-version"> tag of index.html and
 * is read from there. Reason: this module is a cached asset, while index.html is
 * always fetched network first. A version kept in here would be served from the
 * old cache after a deployment - and since it also names the service worker
 * cache, the cache would then never be invalidated. Keep in sync with
 * docs/releases.md by editing the meta tag.
 */
const META_VERSION = document.querySelector('meta[name="app-version"]');

export const APP_VERSION = (META_VERSION && META_VERSION.content) || 'dev';
