const { test, expect } = require("@playwright/test");
const { createHash } = require("crypto");

const sha256 = (text) =>
  `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;

function parsePolicy(policy) {
  return Object.fromEntries(
    policy
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...values] = part.split(/\s+/);
        return [name.toLowerCase(), values];
      }),
  );
}

// Record every CSP violation from the first byte of the document.
async function collectViolations(page) {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      window.__cspViolations.push({
        directive: e.effectiveDirective,
        blocked: e.blockedURI,
        sample: e.sample,
      });
    });
  });
}

test.describe("Content Security Policy — home page", () => {
  test("policy is a strict, hash-based CSP delivered before any script", async ({
    request,
  }) => {
    const html = await (await request.get("/")).text();
    const meta = html.match(
      /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/,
    );
    expect(meta, "CSP meta tag").not.toBeNull();
    // A <meta> CSP only governs content after it, so it must precede the first <script>.
    expect(html.indexOf(meta[0])).toBeLessThan(html.indexOf("<script"));

    const csp = parsePolicy(meta[1]);
    expect(csp["script-src"]).toContain("'strict-dynamic'");
    expect(csp["script-src"]).not.toContain("'unsafe-eval'");
    expect(
      csp["script-src"].filter((v) => v.startsWith("'sha256-")).length,
    ).toBeGreaterThan(0);
    // No host allowlist for scripts: with 'strict-dynamic' it is ignored anyway, and allowlisting
    // googletagmanager.com would let an injected tag load any GTM container.
    expect(csp["script-src"].some((v) => v.includes("googletagmanager"))).toBe(
      false,
    );
    expect(csp["object-src"]).toEqual(["'none'"]);
    expect(csp["base-uri"]).toEqual(["'none'"]);
    expect(csp["default-src"]).toEqual(["'self'"]);
    expect(csp["style-src"]).toEqual(["'self'"]);
    // Directives a <meta> CSP ignores must not be relied on here (they belong in the header).
    for (const ignored of ["frame-ancestors", "report-uri", "sandbox"])
      expect(csp[ignored]).toBeUndefined();
  });

  test("every executable inline script is allowed by its hash", async ({
    page,
  }) => {
    await page.goto("/");
    const policy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute("content");
    const allowed = parsePolicy(policy)["script-src"];
    const inline = await page.evaluate(() =>
      [...document.querySelectorAll("script:not([src])")]
        .filter(
          (s) => !s.type || s.type === "text/javascript" || s.type === "module",
        )
        .map((s) => s.textContent),
    );
    expect(inline.length).toBeGreaterThan(0);
    for (const text of inline) {
      const hash = sha256(text);
      expect(
        allowed,
        `add ${hash} to script-src for: ${text.trim().slice(0, 60)}…`,
      ).toContain(hash);
    }
    // No stale hashes either.
    const used = new Set(inline.map(sha256));
    for (const value of allowed.filter((v) => v.startsWith("'sha256-")))
      expect(used.has(value)).toBe(true);
  });

  test("page loads with no CSP violations and main.js runs", async ({
    page,
  }) => {
    await collectViolations(page);
    await page.goto("/", { waitUntil: "load" });
    // GTM is injected on window load; give it and its tags time to run where the network allows.
    await page.waitForTimeout(2500);
    // main.js ran (it wires up the theme toggle), and toggling + print prep stay within policy.
    const before = await page.evaluate(
      () => document.documentElement.getAttribute("data-theme") || "light",
    );
    await page.locator("#theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      before === "dark" ? "light" : "dark",
    );
    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
  });

  test("no inline style attributes or event-handler attributes in the markup", async ({
    request,
  }) => {
    const html = await (await request.get("/")).text();
    expect(html).not.toMatch(/<[^>]+\sstyle="/i);
    expect(html).not.toMatch(/<[^>]+\son[a-z]+="/i);
  });
});

test.describe("Content Security Policy — 404 page", () => {
  test("locks everything down except its own inline <style>", async ({
    page,
  }) => {
    await collectViolations(page);
    await page.goto("/404.html");
    const policy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute("content");
    const csp = parsePolicy(policy);
    expect(csp["default-src"]).toEqual(["'none'"]);
    const style = await page.locator("style").textContent();
    expect(csp["style-src"]).toEqual([sha256(style)]);
    // The style actually applied (body is a grid), and nothing was blocked.
    expect(
      await page.evaluate(() => getComputedStyle(document.body).display),
    ).toBe("grid");
    expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
  });
});
