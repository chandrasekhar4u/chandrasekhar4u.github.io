const { test, expect } = require("@playwright/test");

test.describe("Skills section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator(".skills-section").scrollIntoViewIfNeeded();
  });

  test("lists React and Python, and no longer lists JavaScript & jQuery", async ({
    page,
  }) => {
    const titles = await page
      .locator(".skillset .level-title")
      .allTextContents();
    expect(titles).toContain("React");
    expect(titles).toContain("Python");
    expect(titles.join(" ")).not.toMatch(/jQuery|JavaScript/i);

    const backend = page
      .locator(".skill-category", { hasText: "Backend" })
      .first();
    await expect(backend.locator(".level-title")).toContainText(["Python"]);
  });

  test("every bar is labelled by an existing heading", async ({ page }) => {
    const bars = page.locator('.skillset [role="progressbar"]');
    const count = await bars.count();
    expect(count).toBe(9);
    for (let i = 0; i < count; i++) {
      const id = await bars.nth(i).getAttribute("aria-labelledby");
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });

  test("skill names stay on one line and tier labels fit inside the section", async ({
    page,
  }) => {
    const layout = await page.evaluate(() => {
      const section = document
        .querySelector(".skills-section")
        .getBoundingClientRect();
      return [...document.querySelectorAll(".skillset .item")].map((item) => {
        const title = item.querySelector(".level-title");
        const bar = item.querySelector(".progress-bar");
        const lineHeight = parseFloat(getComputedStyle(title).lineHeight);
        const label = getComputedStyle(bar, "::after");
        const labelRight =
          bar.getBoundingClientRect().left +
          parseFloat(label.left) +
          parseFloat(label.width);
        return {
          name: title.textContent,
          lines: Math.round(title.getBoundingClientRect().height / lineHeight),
          overflow: labelRight - section.right,
        };
      });
    });
    for (const row of layout) {
      expect(row.lines, `${row.name} wraps`).toBe(1);
      expect(row.overflow, `${row.name} label overflows`).toBeLessThanOrEqual(
        0,
      );
    }
  });
});
