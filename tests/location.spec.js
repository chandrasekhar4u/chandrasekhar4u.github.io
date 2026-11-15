const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const read = (file) =>
  fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test.describe("Location and profile links", () => {
  test("location is the United States everywhere it is stated", async ({
    page,
  }) => {
    await page.goto("/");
    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const person = blocks
      .map((text) => JSON.parse(text))
      .flatMap((doc) => doc["@graph"] || [doc])
      .find((node) => node["@type"] === "Person");
    expect(person.address.addressCountry).toBe("US");

    // The current role states the location visibly, so the markup matches the page.
    await expect(
      page.locator(".experiences-section .item").first().locator(".company"),
    ).toHaveText("Wells Fargo, USA");

    expect(read("humans.txt")).toMatch(/Location: USA/);
    expect(read("llms.txt")).toMatch(/Based in the United States\./);
    expect(read("llms.txt")).not.toMatch(/Based in India/);
  });

  test('profile links use canonical hosts and rel="me"', async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    expect(html).not.toContain("in.linkedin.com");
    expect(html).not.toContain("twitter.com/");

    const profiles = page.locator(
      'a[href^="https://www.linkedin.com/in/"], a[href^="https://github.com/chandrasekhar4u"], a[href^="https://stackoverflow.com/users/"], a[href^="https://x.com/"]',
    );
    const rels = await profiles.evaluateAll((links) =>
      links.map((a) => a.rel.split(/\s+/)),
    );
    expect(rels.length).toBeGreaterThanOrEqual(8);
    for (const rel of rels) {
      expect(rel).toContain("me");
      expect(rel).toContain("noopener");
    }
  });
});
