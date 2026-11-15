const { test, expect } = require("@playwright/test");

test.describe("404 page", () => {
  test("is not indexable and links back to the résumé", async ({ page }) => {
    await page.goto("/404.html");
    await expect(page).toHaveTitle(/Page not found/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(page.locator("h1")).toHaveCount(1);
    // Root-relative links only: the page is served at arbitrary path depths.
    const hrefs = await page
      .locator("a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toMatch(/^\//);
    const assets = await page
      .locator("link[href], script[src], img[src]")
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute("href") || el.getAttribute("src")),
      );
    for (const url of assets) expect(url).toMatch(/^\//);
  });

  test("is not listed in the sitemap", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("404");
  });
});

test.describe("Last-updated date", () => {
  test("footer, structured data and sitemap agree, and the footer is not derived from today", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const time = page.locator("#last-updated");
    const iso = await time.getAttribute("datetime");
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const expected = new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    await expect(time).toHaveText(expected);

    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const profile = blocks
      .map((text) => JSON.parse(text))
      .flatMap((doc) => doc["@graph"] || [doc])
      .find((node) => node["@type"] === "ProfilePage");
    expect(profile.dateModified).toBe(iso);

    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`<lastmod>${iso}</lastmod>`);
  });
});
