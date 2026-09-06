/**
 * Service Worker caching behaviour.
 *
 * Regression: the SW used cache-first for CSS/JS with no revalidation and the
 * asset filenames are not content-hashed, so a deployed CSS change (the ambient
 * starfield) never reached returning visitors — the cached copy was pinned
 * forever. The fix: stale-while-revalidate + a bumped CACHE_VERSION.
 *
 * Most specs in this repo run with `serviceWorkers: 'block'`; this file opts a
 * fresh context back in.
 */

const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:8000';

test.describe('service worker', () => {
  test('sw.js is a stale-while-revalidate worker with a current cache version', async ({
    request,
  }) => {
    const src = await (await request.get(`${BASE}/sw.js`)).text();

    // version was bumped past the one that shipped before the starfield
    const m = src.match(/CACHE_VERSION\s*=\s*['"]v(\d+)['"]/);
    expect(m, 'CACHE_VERSION declared').not.toBeNull();
    expect(Number(m[1])).toBeGreaterThanOrEqual(4);

    // static assets are refreshed in the background, not pinned
    expect(src).toMatch(/stale-while-revalidate/i);
    expect(src).not.toMatch(/Cache-first for static assets/i);
    // install fetches fresh copies, not whatever the HTTP cache holds
    expect(src).toMatch(/cache:\s*['"]reload['"]/);
    expect(src).toContain('self.skipWaiting()');
    expect(src).toContain('clients.claim()');
  });

  test('a returning visit gets the current CSS (not a pinned stale copy)', async ({
    browser,
  }) => {
    const context = await browser.newContext({ serviceWorkers: 'allow' });
    const page = await context.newPage();

    // 1st visit: registers + activates the SW
    await page.goto(`${BASE}/`);
    await page.waitForFunction(
      () => navigator.serviceWorker && navigator.serviceWorker.controller !== null,
      { timeout: 15000 },
    );

    // 2nd visit: the SW now controls the page and serves its assets
    await page.goto(`${BASE}/`);

    const state = await page.evaluate(async () => {
      const keys = await caches.keys();
      const name = keys.find((k) => /kakarla-static-v[4-9]\d*/.test(k));
      const cache = name && (await caches.open(name));
      const cachedCss = cache && (await cache.match('/assets/css/bundle.css'));
      const cachedText = cachedCss ? await cachedCss.text() : '';
      const liveText = await fetch('/assets/css/bundle.css').then((r) => r.text());
      return {
        currentCacheName: name,
        cachedHasStarfield: cachedText.includes('.starfield'),
        liveHasStarfield: liveText.includes('.starfield'),
        // no pre-v4 caches linger
        legacyCaches: keys.filter((k) => /kakarla-static-v[0-3]$/.test(k)),
      };
    });

    expect(state.currentCacheName).toBeTruthy();
    expect(state.legacyCaches).toEqual([]);
    // the page receives the real, current CSS — this is the bug that was fixed
    expect(state.liveHasStarfield).toBe(true);
    expect(state.cachedHasStarfield).toBe(true);

    await context.close();
  });
});
