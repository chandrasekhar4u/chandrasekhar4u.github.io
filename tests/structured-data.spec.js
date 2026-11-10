const { test, expect } = require("@playwright/test");

// Google's ProfilePage guidance: mainEntity is required; dateCreated,
// dateModified, and Person description / alternateName / image / sameAs are recommended.
// https://developers.google.com/search/docs/appearance/structured-data/profile-page
test.describe("ProfilePage structured data", () => {
  let graph;

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    graph = blocks
      .map((text) => JSON.parse(text))
      .flatMap((doc) => doc["@graph"] || [doc]);
  });

  test("ProfilePage has created/modified dates and points at the Person", () => {
    const profile = graph.find((node) => node["@type"] === "ProfilePage");
    expect(profile).toBeTruthy();
    expect(profile.dateCreated).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(profile.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(new Date(profile.dateModified).getTime()).toBeGreaterThanOrEqual(
      new Date(profile.dateCreated).getTime(),
    );
    const person = graph.find(
      (node) => node["@id"] === profile.mainEntity["@id"],
    );
    expect(person["@type"]).toBe("Person");
  });

  test("Person carries the recommended properties and matches the page", async ({
    page,
  }) => {
    const person = graph.find((node) => node["@type"] === "Person");
    for (const key of [
      "name",
      "alternateName",
      "description",
      "image",
      "sameAs",
    ]) {
      expect(person[key], key).toBeTruthy();
    }
    for (const url of person.sameAs) expect(url).toMatch(/^https:\/\//);
    // Markup must describe what is visible on the page.
    await expect(page.locator(".availability-badge")).toContainText(
      person.worksFor.name,
    );
    await expect(page.locator("h1").first()).toContainText(person.name);
    // Employer and client sites are not works about this person.
    expect(person.subjectOf).toBeUndefined();
  });
});
