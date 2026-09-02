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

  test('LCP image is preloaded (AVIF) with fetchpriority="high"', async ({ page }) => {
    const preloadLink = page.locator('link[rel="preload"][as="image"]');
    await expect(preloadLink).toHaveCount(1);
    await expect(preloadLink).toHaveAttribute('href', /chandrasekhar-240\.avif$/);
    await expect(preloadLink).toHaveAttribute('type', 'image/avif');
    await expect(preloadLink).toHaveAttribute('fetchpriority', 'high');
  });

  test('LCP image is a <picture> with AVIF + WebP sources and a sized fallback <img>', async ({ page }) => {
    const picture = page.locator('picture:has(img.img-circle)');
    await expect(picture).toHaveCount(1);
    await expect(picture.locator('source[type="image/avif"]')).toHaveCount(1);
    await expect(picture.locator('source[type="image/webp"]')).toHaveCount(1);
    const img = page.locator('img.img-circle');
    await expect(img).toHaveAttribute('width');
    await expect(img).toHaveAttribute('height');
    await expect(img).toHaveAttribute('fetchpriority', 'high');
    await expect(img).toHaveAttribute('loading', 'eager');
  });

  test('all raster images use a modern format (WebP or AVIF)', async ({ page }) => {
    const srcs = [];
    for (const img of await page.locator('img').all()) {
      const s = await img.getAttribute('src');
      if (s && !s.startsWith('data:')) srcs.push(s);
    }
    for (const source of await page.locator('picture source').all()) {
      const s = await source.getAttribute('srcset');
      if (s) srcs.push(s);
    }
    expect(srcs.length).toBeGreaterThan(0);
    for (const s of srcs) {
      expect(s).toMatch(/\.(webp|avif)(\s|$)/);
    }
  });

  test('the theme is set before first paint by an inline head script (no FOUC)', async ({ page }) => {
    const html = await (await page.goto('http://localhost:8000/')).text();
    const head = html.slice(0, html.indexOf('</head>'));
    // an inline <script> in <head> that sets data-theme...
    expect(head).toMatch(/<script>[\s\S]*?data-theme[\s\S]*?<\/script>/);
    // ...and it runs before the stylesheet so there's no flash
    expect(head.indexOf('data-theme')).toBeGreaterThan(-1);
    expect(head.indexOf('data-theme')).toBeLessThan(head.indexOf('assets/css/bundle.css'));
  });

  test('has a color-scheme meta', async ({ page }) => {
    await expect(page.locator('meta[name="color-scheme"]')).toHaveCount(1);
  });

  test('the HTML ships no render-blocking or third-party <script src> (GTM is injected on load)', async ({ page }) => {
    const html = await (await page.goto('http://localhost:8000/')).text();
    const scriptTags = html.match(/<script\b[^>]*\bsrc=[^>]*>/gi) || [];
    expect(scriptTags.length).toBeGreaterThan(0);
    for (const tag of scriptTags) {
      const src = (tag.match(/\bsrc=["']([^"']+)["']/i) || [])[1] || '';
      expect(src).not.toMatch(/^https?:\/\//); // no third-party script in the document
      expect(/\bdefer\b/.test(tag) || /\basync\b/.test(tag)).toBeTruthy();
    }
  });

  test('no render-blocking third-party CSS (icons are an inline SVG sprite)', async ({ page }) => {
    // No icon-font stylesheet at all
    await expect(page.locator('link[href*="font-awesome"], link[href*="fontawesome"]')).toHaveCount(0);
    // Every stylesheet <link> is same-origin (bundle.css + print.css)
    const styleLinks = await page.locator('link[rel="stylesheet"]').all();
    for (const link of styleLinks) {
      const href = await link.getAttribute('href');
      expect(href).not.toMatch(/^https?:\/\//);
    }
    // The icon sprite is inline in the document
    await expect(page.locator('svg.icon-sprite symbol')).not.toHaveCount(0);
  });

  test('font is self-hosted and preloaded (no Google Fonts, no CLS)', async ({ page }) => {
    // No Google Fonts requests
    await expect(page.locator('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]')).toHaveCount(0);
    // The variable woff2 is preloaded with crossorigin
    const fontPreload = page.locator('link[rel="preload"][as="font"]');
    await expect(fontPreload).toHaveCount(1);
    await expect(fontPreload).toHaveAttribute('href', /\.woff2$/);
    await expect(fontPreload).toHaveAttribute('crossorigin', '');
  });

  test('should not preconnect to removed CDNs', async ({ page }) => {
    // Bootstrap / FontAwesome / Google Fonts are gone — their preconnects should be too
    for (const host of ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com']) {
      await expect(page.locator(`link[rel="preconnect"][href*="${host}"]`)).toHaveCount(0);
    }
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

  test('Bootstrap is no longer loaded', async ({ page }) => {
    await expect(page.locator('script[src*="bootstrap"]')).toHaveCount(0);
    await expect(page.locator('link[href*="bootstrap"]')).toHaveCount(0);
    const hasBootstrapGlobal = await page.evaluate(() => typeof window.bootstrap !== 'undefined');
    expect(hasBootstrapGlobal).toBe(false);
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

  test('decorative icons should have aria-hidden="true"', async ({ page }) => {
    // Every rendered icon instance (excludes the <symbol> defs in the sprite)
    const icons = await page.locator('svg.icon').all();
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      const ariaHidden = await icon.getAttribute('aria-hidden');
      expect(ariaHidden).toBe('true');
    }
  });

  test('contact list should have role="list"', async ({ page }) => {
    const contactList = page.locator('.contact-list');
    await expect(contactList).toHaveAttribute('role', 'list');
  });

  test('social contact links name their network (unambiguous for SRs and agents)', async ({ page }) => {
    const expected = {
      linkedin: /LinkedIn/i,
      github: /GitHub/i,
      stackoverflow: /Stack Overflow/i,
      twitter: /Twitter|^X\b/i,
    };
    for (const [cls, re] of Object.entries(expected)) {
      const link = page.locator(`.contact-list li.${cls} a`);
      const label = (await link.getAttribute('aria-label')) || (await link.textContent());
      expect(label, cls).toMatch(re);
    }
  });

  test('every section landmark has an accessible name', async ({ page }) => {
    const sections = await page.locator('main section').all();
    expect(sections.length).toBeGreaterThan(0);
    for (const s of sections) {
      const labelledby = await s.getAttribute('aria-labelledby');
      expect(labelledby, 'section aria-labelledby').toBeTruthy();
      await expect(page.locator(`#${labelledby}`)).toHaveCount(1);
    }
  });

  test('badges expose their value, not a label that hides it', async ({ page }) => {
    await expect(page.locator('.availability-badge')).toContainText('NTT DATA');
    await expect(page.locator('.availability-badge')).not.toHaveAttribute('aria-label');
    await expect(page.locator('.ai-practitioner-badge')).toContainText('AI Practitioner');
  });

  test('sidebar navigation should expose current section with aria-current', async ({ page }) => {
    const navLinks = page.locator('.sidebar-nav-link');
    await expect(navLinks).toHaveCount(4);

    const activeLinks = page.locator('.sidebar-nav-link[aria-current="true"]');
    await expect(activeLinks).toHaveCount(1);

    const experienceLink = page.locator('.sidebar-nav-link[href="#section-experience"]');
    await experienceLink.click();
    await expect(experienceLink).toHaveAttribute('aria-current', 'true');
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

  test('should have valid structured data (ProfilePage + Person, in @graph)', async ({ page }) => {
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();
    expect(jsonLdScripts.length).toBeGreaterThanOrEqual(1);

    // Flatten every JSON-LD block, following @graph.
    const nodes = [];
    for (const script of jsonLdScripts) {
      const text = await script.textContent();
      let data;
      try { data = JSON.parse(text); } catch (e) { continue; }
      const items = Array.isArray(data['@graph']) ? data['@graph'] : [data];
      for (const item of items) nodes.push(item);
    }

    const person = nodes.find((n) => n['@type'] === 'Person');
    const profilePage = nodes.find((n) => n['@type'] === 'ProfilePage');

    expect(person, 'a Person node').toBeTruthy();
    expect(person.name).toBeTruthy();
    expect(person.url).toBeTruthy();
    expect(person.jobTitle).toBeTruthy();
    expect(Array.isArray(person.knowsAbout)).toBe(true);
    expect(person.sameAs.length).toBeGreaterThan(2);

    expect(profilePage, 'a ProfilePage node').toBeTruthy();
    expect(profilePage.dateModified).toBeTruthy();
    expect(profilePage.mainEntity['@id']).toBe(person['@id']);
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
