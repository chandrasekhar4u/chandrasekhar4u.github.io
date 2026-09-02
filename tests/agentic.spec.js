/**
 * Agentic / machine-readable surface
 *
 * Checks the files and markup that let AI agents and LLM crawlers read the
 * profile: llms.txt, humans.txt, robots.txt pointers, and the CSS that keeps
 * the page stable (scroll-driven animation instead of a scroll handler).
 */

const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:8000';

test.describe('Machine-readable discovery files', () => {
  test('llms.txt exists, is small, and follows the llmstxt.org shape', async ({ request }) => {
    const res = await request.get(`${BASE}/llms.txt`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    // under 5 KB per 2026 best practice
    expect(Buffer.byteLength(body, 'utf8')).toBeLessThan(5120);
    // exactly one H1, followed by a blockquote summary
    const h1 = body.match(/^# .+$/m);
    expect(h1).not.toBeNull();
    expect(body).toMatch(/^# [^\n]+\n\n> .+/m);
    // has the key sections
    for (const s of ['## Contact', '## Experience', '## Projects', '## Skills']) {
      expect(body).toContain(s);
    }
  });

  test('humans.txt exists', async ({ request }) => {
    const res = await request.get(`${BASE}/humans.txt`);
    expect(res.status()).toBe(200);
    expect(await res.text()).toMatch(/Chandra Sekhar Kakarla/);
  });

  test('robots.txt allows everyone and points at llms.txt + sitemap', async ({ request }) => {
    const res = await request.get(`${BASE}/robots.txt`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/User-agent:\s*\*/);
    expect(body).toMatch(/Allow:\s*\//);
    expect(body).toContain('llms.txt');
    expect(body).toContain('Sitemap:');
  });

  test('the page links to the machine-readable summary', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('link[rel="alternate"][href="/llms.txt"]')).toHaveCount(1);
    await expect(page.locator('link[rel="author"][href="/humans.txt"]')).toHaveCount(1);
  });
});

test.describe('Layout stability for agents', () => {
  test('skill bars reveal via CSS scroll-driven animation, with a no-JS fallback width', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const css = await (await page.request.get(`${BASE}/assets/css/bundle.css`)).text();
    expect(css).toContain('animation-timeline: view()');
    expect(css).toMatch(/progress-bar\[aria-valuenow="90"\]\s*{\s*width:\s*90%/);
  });

  test('no scroll event listeners are attached to window', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');
    const jsSource = await (await page.request.get(`${BASE}/assets/js/main.js`)).text();
    // scroll-spy and back-to-top both moved to IntersectionObserver
    expect(jsSource).not.toMatch(/addEventListener\(\s*['"]scroll['"]/);
    expect(jsSource).toContain('IntersectionObserver');
  });
});
