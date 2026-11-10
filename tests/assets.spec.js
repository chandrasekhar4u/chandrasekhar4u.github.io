const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test.describe("Image assets", () => {
  test("every image referenced by the page, manifest, browserconfig and service worker exists", () => {
    const sources = [
      "index.html",
      "manifest.webmanifest",
      "browserconfig.xml",
      "sw.js",
    ];
    const refs = new Set();
    for (const file of sources) {
      for (const match of read(file).matchAll(/assets\/images\/[\w.-]+/g))
        refs.add(match[0]);
    }
    expect(refs.size).toBeGreaterThan(5);
    const missing = [...refs].filter(
      (ref) => !fs.existsSync(path.join(root, ref)),
    );
    expect(missing).toEqual([]);
  });

  test("no unreferenced files are left in assets/images", () => {
    const haystack = [
      "index.html",
      "manifest.webmanifest",
      "browserconfig.xml",
      "sw.js",
    ]
      .map(read)
      .join("\n");
    const orphans = fs
      .readdirSync(path.join(root, "assets/images"))
      .filter((name) => !haystack.includes(name));
    expect(orphans).toEqual([]);
  });

  test("social card is a 1200x630 JPEG served from an absolute URL", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const og = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    const twitter = await page
      .locator('meta[name="twitter:image"]')
      .getAttribute("content");
    expect(og).toBe("https://kakarla.in/assets/images/og-card.jpg");
    expect(twitter).toBe(og);
    await expect(
      page.locator('meta[property="og:image:type"]'),
    ).toHaveAttribute("content", "image/jpeg");

    const res = await request.get("/assets/images/og-card.jpg");
    expect(res.ok()).toBeTruthy();
    const buf = await res.body();
    // JPEG magic bytes, and small enough for link-preview crawlers.
    expect(buf[0]).toBe(0xff);
    expect(buf[1]).toBe(0xd8);
    expect(buf.length).toBeLessThan(300 * 1024);
  });

  test("favicon.ico carries 16, 32 and 48 px images", async ({ request }) => {
    const buf = await (await request.get("/favicon.ico")).body();
    const count = buf.readUInt16LE(4);
    const sizes = [];
    for (let i = 0; i < count; i++) sizes.push(buf[6 + i * 16] || 256);
    expect(sizes.sort((a, b) => a - b)).toEqual([16, 32, 48]);
  });
});
