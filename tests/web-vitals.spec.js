/**
 * Web Vitals & Best Practices Validation Tests
 *
 * Validates performance, accessibility, SEO, and best practices
 * to ensure 100% web vitals compliance.
 */

const { test, expect } = require('@playwright/test');

test.describe('Performance - Core Web Vitals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('domcontentloaded');
  });

  test('LCP image should be preloaded with fetchpriority="high"', async ({ page }) => {
    const preloadLink = page.locator('link[rel="preload"][as="image"][href*="chandrasekhar.webp"]');
    await expect(preloadLink).toHaveCount(1);
    await expect(preloadLink).toHaveAttribute('fetchpriority', 'high');
  });

  test('LCP image should have explicit width and height attributes', async ({ page }) => {
    const img = page.locator('img.img-circle');
    await expect(img).toHaveAttribute('width');
    await expect(img).toHaveAttribute('height');
    await expect(img).toHaveAttribute('fetchpriority', 'high');
    await expect(img).toHaveAttribute('loading', 'eager');
  });

  test('all images should use WebP format', async ({ page }) => {
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        expect(src).toMatch(/\.webp$/);
      }
    }
  });

  test('JavaScript files should use defer attribute', async ({ page }) => {
    const scripts = await page.locator('script[src]').all();
    for (const script of scripts) {
      const src = await script.getAttribute('src');
      if (src && !src.includes('gtm')) {
        const hasDefer = await script.getAttribute('defer');
        expect(hasDefer).not.toBeNull();
      }
    }
  });

  test('FontAwesome CSS should be non-render-blocking', async ({ page }) => {
    const faLink = page.locator('link[href*="font-awesome"]').first();
    const media = await faLink.getAttribute('media');
    const onload = await faLink.getAttribute('onload');
    // Should be deferred via media="print" onload trick
    expect(media === 'print' || onload !== null).toBeTruthy();
  });

  test('Google Fonts should be non-render-blocking', async ({ page }) => {
    const fontLink = page.locator('link[href*="fonts.googleapis.com"][rel="stylesheet"]').first();
    const media = await fontLink.getAttribute('media');
    // media is 'print' before the stylesheet loads; once onload fires it becomes 'all'
    expect(media === 'print' || media === 'all').toBeTruthy();
    const onload = await fontLink.getAttribute('onload');
    expect(onload).toContain("this.media='all'");
  });

  test('should have preconnect hints for external resources', async ({ page }) => {
    const preconnects = await page.locator('link[rel="preconnect"]').all();
    const hrefs = [];
    for (const link of preconnects) {
      hrefs.push(await link.getAttribute('href'));
    }
    expect(hrefs).toContain('https://cdn.jsdelivr.net');
    expect(hrefs).toContain('https://cdnjs.cloudflare.com');
    expect(hrefs).toContain('https://fonts.googleapis.com');
    expect(hrefs).toContain('https://fonts.gstatic.com');
  });

  test('GTM should not use eager preconnect (uses dns-prefetch instead)', async ({ page }) => {
    // GTM is deferred, so preconnect to GTM is wasteful; dns-prefetch is appropriate
    const gtmPreconnect = await page.locator('link[rel="preconnect"][href*="googletagmanager"]').count();
    expect(gtmPreconnect).toBe(0);
    const gtmDnsPrefetch = page.locator('link[rel="dns-prefetch"][href*="googletagmanager"]');
    await expect(gtmDnsPrefetch).toHaveCount(1);
  });

  test('should use efficient CSS containment', async ({ page }) => {
    const wrapperContain = await page.evaluate(() => {
      return getComputedStyle(document.querySelector('.wrapper')).contain;
    });
    expect(wrapperContain).toContain('layout');
    expect(wrapperContain).toContain('style');
  });

  test('Bootstrap JS should use defer', async ({ page }) => {
    const bootstrapScript = page.locator('script[src*="bootstrap"]');
    await expect(bootstrapScript).toHaveAttribute('defer');
  });

  test('should have noscript fallbacks for deferred CSS', async ({ page }) => {
    const noscriptElements = await page.locator('noscript').all();
    expect(noscriptElements.length).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Accessibility - WCAG Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('domcontentloaded');
  });

  test('page should have lang attribute on html element', async ({ page }) => {
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('en');
  });

  test('should have exactly one h1 element', async ({ page }) => {
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('all images should have meaningful alt text', async ({ page }) => {
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt.length).toBeGreaterThan(3);
    }
  });

  test('should have skip navigation link', async ({ page }) => {
    const skipLink = page.locator('a.skip-link');
    await expect(skipLink).toHaveCount(1);
    const href = await skipLink.getAttribute('href');
    expect(href).toBe('#main-content');

    const mainContent = page.locator('#main-content');
    await expect(mainContent).toHaveCount(1);
  });

  test('all links should have discernible text', async ({ page }) => {
    const links = await page.locator('a:not(.skip-link)').all();
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');
      const hasText = text.trim().length > 0 || ariaLabel || title;
      expect(hasText).toBeTruthy();
    }
  });

  test('interactive elements should have minimum touch target size', async ({ page }) => {
    const themeToggle = page.locator('#theme-toggle');
    const box = await themeToggle.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(40);
    expect(box.height).toBeGreaterThanOrEqual(40);
  });

  test('page should have proper landmark roles', async ({ page }) => {
    const main = page.locator('main, [role="main"]');
    await expect(main).toHaveCount(1);

    const aside = page.locator('aside, [role="complementary"]');
    await expect(aside).toHaveCount(1);

    const footer = page.locator('footer, [role="contentinfo"]');
    await expect(footer).toHaveCount(1);
  });

  test('all buttons should have accessible labels', async ({ page }) => {
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      const title = await button.getAttribute('title');
      expect(ariaLabel || text.trim() || title).toBeTruthy();
    }
  });

  test('icons should have aria-hidden="true"', async ({ page }) => {
    const icons = await page.locator('i[class*="fa-"]').all();
    for (const icon of icons) {
      const ariaHidden = await icon.getAttribute('aria-hidden');
      expect(ariaHidden).toBe('true');
    }
  });

  test('contact list should have role="list"', async ({ page }) => {
    const contactList = page.locator('.contact-list');
    await expect(contactList).toHaveAttribute('role', 'list');
  });

  test('interests and language lists should have role="list"', async ({ page }) => {
    const interestLists = await page.locator('.interests-list').all();
    expect(interestLists.length).toBeGreaterThanOrEqual(1);
    for (const list of interestLists) {
      const role = await list.getAttribute('role');
      expect(role).toBe('list');
    }
  });

  test('external links should use noopener noreferrer', async ({ page }) => {
    const externalLinks = await page.locator('a[target="_blank"]').all();
    for (const link of externalLinks) {
      const rel = await link.getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });
});

test.describe('SEO - Search Engine Optimization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should have proper meta description', async ({ page }) => {
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(50);
    expect(content.length).toBeLessThan(160);
  });

  test('should have canonical URL', async ({ page }) => {
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    const href = await canonical.getAttribute('href');
    expect(href).toMatch(/^https:\/\//);
  });

  test('should have Open Graph meta tags', async ({ page }) => {
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:type"]')).toHaveCount(1);
  });

  test('should have Twitter Card meta tags', async ({ page }) => {
    await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:title"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:description"]')).toHaveCount(1);
  });

  test('should have structured data (JSON-LD Person schema)', async ({ page }) => {
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();
    expect(jsonLdScripts.length).toBeGreaterThanOrEqual(1);

    let personSchema = null;
    for (const script of jsonLdScripts) {
      const text = await script.textContent();
      try {
        const data = JSON.parse(text);
        if (data['@type'] === 'Person') {
          personSchema = data;
          break;
        }
      } catch (e) { /* skip invalid JSON */ }
    }

    expect(personSchema).not.toBeNull();
    expect(personSchema['@context']).toBe('https://schema.org');
    expect(personSchema.name).toBeTruthy();
    expect(personSchema.url).toBeTruthy();
    expect(personSchema.jobTitle).toBeTruthy();
  });

  test('should have robots meta tag with index/follow', async ({ page }) => {
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveCount(1);
    const content = await robots.getAttribute('content');
    expect(content).toContain('index');
    expect(content).toContain('follow');
  });

  test('should have viewport meta tag', async ({ page }) => {
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
    const content = await viewport.getAttribute('content');
    expect(content).toContain('width=device-width');
    expect(content).toContain('initial-scale=1');
  });

  test('should have valid robots.txt', async ({ page }) => {
    const response = await page.goto('http://localhost:8000/robots.txt');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('User-agent');
    expect(text).toContain('Sitemap');
  });

  test('should have valid sitemap.xml', async ({ page }) => {
    const response = await page.goto('http://localhost:8000/sitemap.xml');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('urlset');
    expect(text).toContain('<loc>');
  });
});

test.describe('Best Practices', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should have valid DOCTYPE', async ({ page }) => {
    const doctype = await page.evaluate(() => {
      const dt = document.doctype;
      return dt ? dt.name : null;
    });
    expect(doctype).toBe('html');
  });

  test('should have charset meta tag', async ({ page }) => {
    const charset = page.locator('meta[charset]');
    await expect(charset).toHaveCount(1);
    const charsetValue = await charset.getAttribute('charset');
    expect(charsetValue.toLowerCase()).toBe('utf-8');
  });

  test('should use HTTPS for all external resources', async ({ page }) => {
    const links = await page.locator('link[href^="http"]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^https:\/\//);
    }

    const scripts = await page.locator('script[src^="http"]').all();
    for (const script of scripts) {
      const src = await script.getAttribute('src');
      expect(src).toMatch(/^https:\/\//);
    }
  });

  test('should have no unexpected console errors on page load', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Filter out expected network errors (CDN resources unavailable in local test)
    const unexpectedErrors = consoleErrors.filter(error =>
      !error.includes('net::ERR_') &&
      !error.includes('Failed to load resource')
    );
    expect(unexpectedErrors).toHaveLength(0);
  });

  test('should have valid web app manifest', async ({ page }) => {
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);

    const response = await page.goto('http://localhost:8000/manifest.webmanifest');
    expect(response.status()).toBe(200);
    const manifest = await response.json();

    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBeTruthy();
    expect(manifest.background_color).toBeTruthy();
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.icons).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test('should have theme-color meta tag(s)', async ({ page }) => {
    await page.goto('http://localhost:8000');
    const themeColors = await page.locator('meta[name="theme-color"]').all();
    // Accept either a single theme-color or dual (light/dark) theme-color meta tags
    expect(themeColors.length).toBeGreaterThanOrEqual(1);
    for (const tc of themeColors) {
      const content = await tc.getAttribute('content');
      expect(content).toBeTruthy();
    }
  });

  test('should have apple-touch-icons', async ({ page }) => {
    await page.goto('http://localhost:8000');
    const appleIcons = await page.locator('link[rel="apple-touch-icon"]').all();
    expect(appleIcons.length).toBeGreaterThanOrEqual(1);
  });

  test('should have proper image aspect ratios (no CLS)', async ({ page }) => {
    await page.goto('http://localhost:8000');
    const profileImg = page.locator('img.img-circle');
    const width = await profileImg.getAttribute('width');
    const height = await profileImg.getAttribute('height');
    expect(parseInt(width)).toBeGreaterThan(0);
    expect(parseInt(height)).toBeGreaterThan(0);
  });

  test('browserconfig.xml should reference webp icons', async ({ page }) => {
    const response = await page.goto('http://localhost:8000/browserconfig.xml');
    expect(response.status()).toBe(200);
    const text = await response.text();
    // Should NOT reference .png files (those don't exist — only .webp icons)
    expect(text).not.toContain('.png');
    expect(text).toContain('.webp');
  });
});

test.describe('PWA - Progressive Web App', () => {
  test('should have valid installable web app manifest', async ({ page }) => {
    const response = await page.goto('http://localhost:8000/manifest.webmanifest');
    expect(response.status()).toBe(200);
    const manifest = await response.json();

    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.background_color).toBeTruthy();
    expect(manifest.theme_color).toBeTruthy();

    // Must have 192x192 and 512x512 icons for installability
    const has192 = manifest.icons.some(i => i.sizes === '192x192');
    const has512 = manifest.icons.some(i => i.sizes === '512x512');
    expect(has192).toBe(true);
    expect(has512).toBe(true);
  });

  test('manifest should have scope', async ({ page }) => {
    const response = await page.goto('http://localhost:8000/manifest.webmanifest');
    const manifest = await response.json();
    expect(manifest.scope).toBeTruthy();
  });
});
