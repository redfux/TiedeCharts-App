/*
 * Single source of truth for the app version.
 * thought up by human, coded by ai
 *
 * The footer reads it, the service worker gets it as a registration query
 * parameter and derives its cache name from it. Bumping the version here is
 * therefore enough to invalidate the offline cache. Keep in sync with
 * docs/releases.md.
 */
export const APP_VERSION = '0.1.0';
