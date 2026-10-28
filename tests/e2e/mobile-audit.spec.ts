// tests/e2e/mobile-audit.spec.ts — Mobile Responsiveness Audit across Storefront & Admin
import { test, expect, Page } from "@playwright/test";
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
    // Ignore in CI/production
  }
}

loadEnvFile(path.resolve(__dirname, "../../.env.local"));
loadEnvFile(path.resolve(__dirname, "../../.env"));

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

async function loginAsAdmin(page: Page) {
  const passcode = process.env.DEMO_ADMIN_PASSCODE || "demo1234";
  const randomIp = `127.0.0.${Math.floor(Math.random() * 200) + 2}`;
  const loginRes = await page.request.post(`${BASE_URL}/api/admin/demo-login`, {
    data: { passcode },
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": randomIp,
    },
  });
  expect(loginRes.status()).toBe(200);
}

const VIEWPORTS = [
  { name: "mobile_390px", width: 390, height: 844 }, // iPhone 12/13/14/15/16
  { name: "mobile_360px", width: 360, height: 800 }, // Standard Compact Android
];

test.describe("Mobile Responsiveness Comprehensive Audit", () => {
  for (const vp of VIEWPORTS) {
    test(`Storefront pages at ${vp.name} (${vp.width}x${vp.height}): No horizontal overflow`, async ({ page }) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const storefrontUrls = ["/", "/contact", "/fish", "/shop", "/cart"];

      for (const route of storefrontUrls) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(500);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

        expect(
          scrollWidth,
          `Horizontal overflow detected on ${route} at ${vp.width}px: scrollWidth (${scrollWidth}) > clientWidth (${clientWidth})`
        ).toBeLessThanOrEqual(clientWidth + 2);
      }
    });

    test(`Admin pages at ${vp.name} (${vp.width}x${vp.height}): No horizontal overflow`, async ({ page }) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await loginAsAdmin(page);

      const adminUrls = ["/admin", "/admin/messages", "/admin/settings", "/admin/orders"];

      for (const route of adminUrls) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(500);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

        expect(
          scrollWidth,
          `Horizontal overflow detected on ${route} at ${vp.width}px: scrollWidth (${scrollWidth}) > clientWidth (${clientWidth})`
        ).toBeLessThanOrEqual(clientWidth + 2);
      }
    });
  }

  test("Mobile navigation drawer toggle test", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsAdmin(page);

    await page.goto(`${BASE_URL}/admin/messages`, { waitUntil: "networkidle" });

    // Open mobile sidebar drawer button
    const toggleBtn = page.locator("button[aria-label='Toggle Navigation Menu']").first();
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
    await toggleBtn.click();
    await page.waitForTimeout(400);

    // Verify mobile drawer overlay or navigation items are visible
    const messagesLink = page.locator("nav a:has-text('Messages')").last();
    await expect(messagesLink).toBeVisible();

    // Close drawer
    const closeBtn = page.locator("button[aria-label='Close Mobile Navigation']");
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await page.waitForTimeout(400);
  });
});
