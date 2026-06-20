/**
 * sw.js — Service Worker for kakarla.in
 *
 * Implements a caching strategy that:
 *  - Pre-caches critical static assets on install (equivalent to long Expires headers).
 *  - Uses cache-first for static assets (CSS, JS, images) to avoid repeat network requests.
 *  - Uses network-first for HTML so content stays fresh.
 *  - Cleans up outdated cache versions on activate.
 *
 * Bump CACHE_VERSION whenever a new deployment changes static asset content.
 */

'use strict';

const CACHE_VERSION = 'v1';
const CACHE_NAME = `kakarla-static-${CACHE_VERSION}`;

/** Assets to pre-cache during the install phase. */
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/bundle.css',
  '/assets/css/print.css',
  '/assets/js/main.js',
  '/assets/images/chandrasekhar.webp',
  '/favicon.ico',
  '/manifest.webmanifest',
];

// ---------------------------------------------------------------------------
// Install — pre-cache static assets
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// ---------------------------------------------------------------------------
// Activate — purge caches from previous versions
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ---------------------------------------------------------------------------
// Fetch — serve from cache or network
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests from the same origin.
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
    // Network-first for HTML: serve the latest version; fall back to cache if offline.
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, clone));
          return networkResponse;
        })
        .catch(() => caches.match(request)),
    );
  } else {
    // Cache-first for static assets: serve cached copy; update cache in background.
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((networkResponse) => {
          const clone = networkResponse.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, clone));
          return networkResponse;
        });
      }),
    );
  }
});
