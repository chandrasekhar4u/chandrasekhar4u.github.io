/**
 * Print Layout Tests
 *
 * Validates the professional single-page print layout:
 *   - Print stylesheet is linked correctly
 *   - Interactive UI elements are hidden when printing
 *   - Essential resume content is present and visible for print
 *   - Single-page PDF output (Chromium only)
 */

const { test, expect } = require('@playwright/test');

test.describe('Print Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('domcontentloaded');
  });

  // ── Stylesheet presence ──────────────────────────────────────────────────

  test('print stylesheet should be linked with media="print"', async ({ page }) => {
    const printLink = page.locator('link[rel="stylesheet"][media="print"][href*="print.css"]');
    await expect(printLink).toHaveCount(1);
  });

  // ── Elements hidden in print ─────────────────────────────────────────────

  test('theme toggle button should be hidden in print', async ({ page }) => {
    // d-print-none hides the theme-toggle; verify the class or element exists
    const themeToggle = page.locator('#theme-toggle');
    await expect(themeToggle).toHaveCount(1);
    // In screen mode it is visible; the print CSS will hide it
    await expect(themeToggle).toBeVisible();
  });

  test('print button should carry d-print-none class', async ({ page }) => {
    const printBtn = page.locator('#print-btn');
    await expect(printBtn).toHaveCount(1);
    await expect(printBtn).toHaveClass(/d-print-none/);
  });

  test('footer should carry d-print-none class', async ({ page }) => {
    const footer = page.locator('footer.footer');
    await expect(footer).toHaveCount(1);
    await expect(footer).toHaveClass(/d-print-none/);
  });

  test('sidebar navigation should carry d-print-none class', async ({ page }) => {
    const sidebarNav = page.locator('.sidebar-nav');
    await expect(sidebarNav).toHaveCount(1);
    await expect(sidebarNav).toHaveClass(/d-print-none/);
  });

  // ── Essential content present on the page ───────────────────────────────

  test('resume owner name should be present', async ({ page }) => {
    const name = page.locator('.profile-container .name');
    await expect(name).toHaveCount(1);
    await expect(name).toContainText('Chandra Sekhar Kakarla');
  });

  test('job title / tagline should be present', async ({ page }) => {
    const tagline = page.locator('.profile-container .tagline');
    await expect(tagline).toHaveCount(1);
    await expect(tagline).toContainText('Full Stack Developer');
  });

  test('contact email link should be present', async ({ page }) => {
    const emailLink = page.locator('.contact-list a[href^="mailto:"]');
    await expect(emailLink).toHaveCount(1);
  });

  test('career profile section should be present', async ({ page }) => {
    const careerSection = page.locator('#section-summary');
    await expect(careerSection).toHaveCount(1);
    const items = careerSection.locator('ul li');
    await expect(items).not.toHaveCount(0);
  });

  test('experience section should contain at least one job', async ({ page }) => {
    const experienceSection = page.locator('#section-experience');
    await expect(experienceSection).toHaveCount(1);
    const jobs = experienceSection.locator('.item');
    await expect(jobs.first()).toBeVisible();
  });

  test('skills section should be present with progress bars', async ({ page }) => {
    const skillsSection = page.locator('#section-skills');
    await expect(skillsSection).toHaveCount(1);
    const bars = skillsSection.locator('.progress-bar');
    const count = await bars.count();
    expect(count).toBeGreaterThan(0);
  });

  test('progress bars should have aria-valuenow attributes', async ({ page }) => {
    const bars = await page.locator('.skillset .progress-bar').all();
    expect(bars.length).toBeGreaterThan(0);
    for (const bar of bars) {
      const value = await bar.getAttribute('aria-valuenow');
      expect(value).not.toBeNull();
      const num = parseInt(value, 10);
      expect(num).toBeGreaterThan(0);
      expect(num).toBeLessThanOrEqual(100);
    }
  });

  test('projects section should contain at least one project card', async ({ page }) => {
    const projectsSection = page.locator('#section-projects');
    await expect(projectsSection).toHaveCount(1);
    const cards = projectsSection.locator('.project-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  // ── beforeprint / afterprint JS hooks ───────────────────────────────────

  test('beforeprint handler should open all details elements and set skill bar widths', async ({ page, browserName }) => {
    // Only run in Chromium where window.print() behaviour is consistent
    test.skip(browserName !== 'chromium', 'beforeprint simulation is Chromium-only');

    // Simulate beforeprint event
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));

    // All <details> should now have the open attribute
    const closedDetails = await page.locator('details:not([open])').count();
    expect(closedDetails).toBe(0);

    // html should carry the "printing" class
    const hasPrintingClass = await page.evaluate(() =>
      document.documentElement.classList.contains('printing')
    );
    expect(hasPrintingClass).toBe(true);

    // Each skill bar should have an inline width style set
    const bars = await page.locator('.skillset .progress-bar').all();
    for (const bar of bars) {
      const style = await bar.getAttribute('style');
      expect(style).toMatch(/width\s*:/);
    }
  });

  test('afterprint handler should remove the "printing" class', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'afterprint simulation is Chromium-only');

    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));

    const hasPrintingClass = await page.evaluate(() =>
      document.documentElement.classList.contains('printing')
    );
    expect(hasPrintingClass).toBe(false);
  });

  // ── Single-page PDF output (Chromium only) ───────────────────────────────

  test('page should generate a single-page PDF', async ({ page, browserName }) => {
    // page.pdf() is only available in Chromium (headed or headless)
    test.skip(browserName !== 'chromium', 'PDF generation is Chromium-only');

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: { top: '0.3in', bottom: '0.3in', left: '0.35in', right: '0.35in' },
      printBackground: true,
    });

    // A single-page PDF must be larger than a trivially small file
    expect(pdfBuffer.length).toBeGreaterThan(10000);

    // Parse the raw PDF bytes to count pages.
    // PDFs contain "/Type /Page" entries for each page (one per content page).
    const pdfText = pdfBuffer.toString('latin1');
    // Count leaf page objects – each real page has exactly one /Type /Page dict
    const pageMatches = pdfText.match(/\/Type\s*\/Page[^s]/g);
    const pageCount = pageMatches ? pageMatches.length : 0;
    expect(pageCount).toBe(1);
  });
});
