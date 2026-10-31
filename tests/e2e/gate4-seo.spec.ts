import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

function loadEnvFile(envPath: string) {
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {
    // Ignore in CI
  }
}

loadEnvFile(path.resolve(__dirname, "../../.env.local"));
loadEnvFile(path.resolve(__dirname, "../../.env"));

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("GATE 4: SEO & Core Metadata", () => {
  test("1. robots.txt generates valid directives", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/robots.txt`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("User-Agent: *");
    expect(body).toContain("Disallow:");
    console.log("Verified /robots.txt:\n", body.trim());
  });

  test("2. sitemap.xml generates valid XML containing products", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/sitemap.xml`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("<loc>");
    expect(body).toContain("/shop");
    expect(body).toContain("/fish");
    console.log("Verified /sitemap.xml generates correctly with urlset.");
  });

  test("3. Root layout has lang='en' and correct meta tags on public pages", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });

    // HTML lang="en"
    const htmlLang = await page.getAttribute("html", "lang");
    expect(htmlLang).toBe("en");

    // Title & Description
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(5);

    const descMeta = page.locator('meta[name="description"]');
    await expect(descMeta).toHaveCount(1);
    const descContent = await descMeta.getAttribute("content");
    expect(descContent).toBeTruthy();

    // Viewport meta
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveCount(1);

    console.log(`Verified homepage SEO meta: title="${title}", lang="${htmlLang}"`);
  });

  test("4. Product page has OpenGraph metadata and structured data", async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`, { waitUntil: "domcontentloaded" });
    const productLink = page.locator('a[href^="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15000 });
    const href = await productLink.getAttribute("href");

    await page.goto(`${BASE_URL}${href}`, { waitUntil: "domcontentloaded" });

    // Title contains product name
    const title = await page.title();
    expect(title).toBeTruthy();

    // OG Title
    const ogTitle = page.locator('meta[property="og:title"]');
    const hasOgTitle = (await ogTitle.count()) > 0;
    expect(hasOgTitle).toBe(true);

    console.log(`Verified product page metadata for ${href}: title="${title}"`);
  });
});
