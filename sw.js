/**
 * sw.js — Service Worker for kakarla.in
 *
 * Caching strategy:
 *  - HTML  → network-first (always try the latest markup; fall back to cache offline).
 *  - Static assets (CSS / JS / fonts / images) → stale-while-revalidate: serve the
 *    cached copy instantly, then refresh it from the network in the background so a
 *    new deployment propagates on the *next* load. The site's asset filenames are
 *    not content-hashed, so a plain cache-first strategy would pin every returning
 *    visitor to the version cached at install time — forever. That is the bug this
 *    revision fixes (a deployed CSS change never reached returning visitors).
 *  - Outdated cache versions are purged on activate.
 *
 * Bump CACHE_VERSION on every deploy that changes any precached asset.
 */

'use strict';

const CACHE_VERSION = 'v4';
const CACHE_PREFIX = 'kakarla-static-';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

/** Assets to pre-cache during the install phase. */
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/bundle.css',
  '/assets/css/print.css',
  '/assets/js/main.js',
  '/assets/fonts/inter-latin.woff2',
  '/assets/images/chandrasekhar-240.avif',
  '/assets/images/chandrasekhar-240.webp',
  '/assets/images/chandrasekhar.webp',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/llms.txt',
];

// ---------------------------------------------------------------------------
// Install — pre-cache static assets (bypassing the HTTP cache so a bumped
// version always fetches the freshly deployed files)
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(
          PRECACHE_ASSETS.map((url) => new Request(url, { cache: 'reload' })),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

// ---------------------------------------------------------------------------
// Activate — purge caches from previous versions, take control immediately
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle same-origin GET requests.
  if (request.method !== 'GET') return;
  let requestUrl;
  try {
    requestUrl = new URL(request.url);
  } catch (_) {
    return;
  }
  if (requestUrl.origin !== self.location.origin) return;

  const isHtmlRequest = request.headers.get('Accept')
    ? request.headers.get('Accept').includes('text/html')
    : request.destination === 'document';

  if (isHtmlRequest) {
    // Network-first for HTML.
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)),
            );
          }
          return networkResponse;
        })
        .catch(() => caches.match(request, { ignoreSearch: true })),
    );
    return;
  }

  // Stale-while-revalidate for static assets: serve cache now, refresh in the
  // background, so the next load always has the latest deployed file.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cached);

        // If we have a cached copy, return it immediately but let the refresh
        // run to completion; otherwise wait for the network.
        if (cached) {
          event.waitUntil(networkFetch);
          return cached;
        }
        return networkFetch;
      }),
    ),
  );
});
