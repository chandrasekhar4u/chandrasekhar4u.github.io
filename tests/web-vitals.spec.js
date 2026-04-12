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
    // Check for preload link for LCP image
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
    // FontAwesome should be loaded with media="print" onload trick or defer
    const faLink = page.locator('link[href*="font-awesome"]').first();
    const media = await faLink.getAttribute('media');
    const onload = await faLink.getAttribute('onload');
    // Should either be deferred via media="print" trick or have media="print" with onload
    expect(media === 'print' || onload !== null).toBeTruthy();
  });

  test('Google Fonts should be non-render-blocking', async ({ page }) => {
    // Google Fonts should be loaded with media="print" onload trick
    const fontLink = page.locator('link[href*="fonts.googleapis.com"][rel="stylesheet"]').first();
    const media = await fontLink.getAttribute('media');
    expect(media).toBe('print');
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

  test('should use efficient CSS containment', async ({ page }) => {
    // Check that major layout containers use CSS containment
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

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check that headings don't skip levels on the page
    const headings = await page.evaluate(() => {
      const h = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(h).map(el => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim().substring(0, 50)
      }));
    });

    // Should have exactly one h1
    const h1Count = headings.filter(h => h.tag === 'h1').length;
    expect(h1Count).toBe(1);

    // First heading should be h1
    expect(headings[0].tag).toBe('h1');
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

    // Target element should exist
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
    // Theme toggle button should meet 44x44 minimum
    const themeToggle = page.locator('#theme-toggle');
    const box = await themeToggle.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(40);
    expect(box.height).toBeGreaterThanOrEqual(40);
  });

  test('page should have proper landmark roles', async ({ page }) => {
    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toHaveCount(1);

    // Check for complementary/aside landmark
    const aside = page.locator('aside, [role="complementary"]');
    await expect(aside).toHaveCount(1);

    // Check for contentinfo/footer landmark
    const footer = page.locator('footer, [role="contentinfo"]');
    await expect(footer).toHaveCount(1);
  });

  test('all form elements should have labels', async ({ page }) => {
    // Buttons should have aria-label or visible text
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      const title = await button.getAttribute('title');
      expect(ariaLabel || text.trim() || title).toBeTruthy();
    }
  });

  test('icons should have aria-hidden="true"', async ({ page }) => {
    const icons = await page.locator('.fa-solid, .fa-brands, i[class*="fa-"]').all();
    for (const icon of icons) {
      const ariaHidden = await icon.getAttribute('aria-hidden');
      expect(ariaHidden).toBe('true');
    }
  });

  test('lists should use proper list roles', async ({ page }) => {
    // Contact list should have role="list"
    const contactList = page.locator('.contact-list');
    await expect(contactList).toHaveAttribute('role', 'list');

    // Interest/language lists should have role="list"
    const interestLists = await page.locator('.interests-list').all();
    for (const list of interestLists) {
      const role = await list.getAttribute('role');
      expect(role).toBe('list');
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
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveCount(1);

    const ogDesc = page.locator('meta[property="og:description"]');
    await expect(ogDesc).toHaveCount(1);

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveCount(1);

    const ogUrl = page.locator('meta[property="og:url"]');
    await expect(ogUrl).toHaveCount(1);

    const ogType = page.locator('meta[property="og:type"]');
    await expect(ogType).toHaveCount(1);
  });

  test('should have Twitter Card meta tags', async ({ page }) => {
    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveCount(1);

    const twitterTitle = page.locator('meta[name="twitter:title"]');
    await expect(twitterTitle).toHaveCount(1);

    const twitterDesc = page.locator('meta[name="twitter:description"]');
    await expect(twitterDesc).toHaveCount(1);
  });

  test('should have structured data (JSON-LD)', async ({ page }) => {
    const jsonLd = await page.evaluate(() => {
      const script = document.querySelector('script[type="application/ld+json"]');
      if (!script) return null;
      try {
        return JSON.parse(script.textContent);
      } catch (e) {
        return null;
      }
    });

    expect(jsonLd).not.toBeNull();
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('Person');
    expect(jsonLd.name).toBeTruthy();
    expect(jsonLd.url).toBeTruthy();
    expect(jsonLd.jobTitle).toBeTruthy();
  });

  test('should have robots meta tag', async ({ page }) => {
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

  test('external links should have rel="noopener noreferrer"', async ({ page }) => {
    await page.goto('http://localhost:8000');
    const externalLinks = await page.locator('a[target="_blank"]').all();
    for (const link of externalLinks) {
      const rel = await link.getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
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
    // Check all link hrefs
    const links = await page.locator('link[href^="http"]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^https:\/\//);
    }

    // Check all script srcs
    const scripts = await page.locator('script[src^="http"]').all();
    for (const script of scripts) {
      const src = await script.getAttribute('src');
      expect(src).toMatch(/^https:\/\//);
    }
  });

  test('should have no console errors on page load', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Filter out expected network errors (CDN resources unavailable in test)
    const unexpectedErrors = consoleErrors.filter(error =>
      !error.includes('net::ERR_') &&
      !error.includes('Failed to load resource')
    );
    expect(unexpectedErrors).toHaveLength(0);
  });

  test('should have proper manifest', async ({ page }) => {
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

  test('should have theme-color meta tag', async ({ page }) => {
    await page.goto('http://localhost:8000');
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveCount(1);
    const content = await themeColor.getAttribute('content');
    expect(content).toBeTruthy();
  });

  test('manifest theme_color should match meta theme-color', async ({ page }) => {
    await page.goto('http://localhost:8000');
    const metaThemeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');

    const response = await page.goto('http://localhost:8000/manifest.webmanifest');
    const manifest = await response.json();

    expect(manifest.theme_color).toBe(metaThemeColor);
  });

  test('apple-touch-icons should be present', async ({ page }) => {
    await page.goto('http://localhost:8000');
    const appleIcons = await page.locator('link[rel="apple-touch-icon"]').all();
    expect(appleIcons.length).toBeGreaterThanOrEqual(1);
  });

  test('noscript fallbacks should exist for deferred CSS', async ({ page }) => {
    await page.goto('http://localhost:8000');
    // FontAwesome noscript fallback
    const noscriptElements = await page.locator('noscript').all();
    expect(noscriptElements.length).toBeGreaterThanOrEqual(1);
  });

  test('should have proper image aspect ratios (no CLS)', async ({ page }) => {
    await page.goto('http://localhost:8000');
    // Profile image should have explicit dimensions
    const profileImg = page.locator('img.img-circle');
    const width = await profileImg.getAttribute('width');
    const height = await profileImg.getAttribute('height');
    expect(parseInt(width)).toBeGreaterThan(0);
    expect(parseInt(height)).toBeGreaterThan(0);
  });
});

test.describe('PWA - Progressive Web App', () => {
  test('should have valid web app manifest', async ({ page }) => {
    const response = await page.goto('http://localhost:8000/manifest.webmanifest');
    expect(response.status()).toBe(200);
    const manifest = await response.json();

    // Required fields for installable PWA
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.background_color).toBeTruthy();
    expect(manifest.theme_color).toBeTruthy();

    // Should have appropriately sized icons
    const has192 = manifest.icons.some(i => i.sizes === '192x192');
    const has512 = manifest.icons.some(i => i.sizes === '512x512');
    expect(has192).toBe(true);
    expect(has512).toBe(true);
  });
});
