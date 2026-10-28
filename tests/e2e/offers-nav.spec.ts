// tests/e2e/offers-nav.spec.ts — E2E test for Mobile Apple Glass design and Offers navigation
import { test, expect } from "@playwright/test";
import path from "node:path";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const ARTIFACT_DIR = path.resolve(
  "C:/Users/hp/.gemini/antigravity/brain/9695cad0-55f1-4e7c-8188-fa4cee7c02e9"
);

test.describe("Apple Glass Mobile View & Offers Navigation", () => {
  test("1. Mobile (390px) Apple Glass Hero, Cut-off Banner & Bottom Nav Bar", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Verify Cut-off banner has frosted glass styling
    const cutOffBanner = page.locator("text=12:00 PM Order Cut-off:").locator("xpath=ancestor::div[contains(@class, 'backdrop-blur')]");
    await expect(cutOffBanner).toBeVisible();

    // Verify Hero section with high quality background
    const heroSection = page.locator("section:has-text('Sri Lanka')").filter({ hasText: "Finest Catch" });
    await expect(heroSection).toBeVisible();

    // Verify eyebrow pill
    const eyebrowPill = heroSection.locator("text=Fresh Seafood Delivery");
    await expect(eyebrowPill).toBeVisible();

    // Verify Primary CTA
    const exploreBtn = heroSection.locator("a:has-text('Explore Daily Catch')");
    await expect(exploreBtn).toBeVisible();

    // Verify Secondary CTA (Today's Deals)
    const dealsHeroBtn = heroSection.locator("a:has-text(\"Today's Deals\")");
    await expect(dealsHeroBtn).toBeVisible();

    // Verify Mobile Bottom Nav Bar
    const bottomNav = page.locator("nav.md\\:hidden");
    await expect(bottomNav).toBeVisible();

    // Capture Mobile Screenshot
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "apple_glass_mobile_390px.png"),
      fullPage: false,
    });

    // Desktop screenshot
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "apple_glass_desktop_1440px.png"),
      fullPage: false,
    });
  });

  test("2. Mobile Bottom Nav 'Offers' button navigates to /offers and activates", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Click 'Offers' in bottom nav
    const offersTab = page.locator("nav.md\\:hidden a[href='/offers']");
    await expect(offersTab).toBeVisible();
    await offersTab.click();

    // Verify navigation to /offers
    await expect(page).toHaveURL(`${BASE_URL}/offers`, { timeout: 15000 });
    await expect(page.locator("h1:has-text(\"Today's Special Offers\")")).toBeVisible({ timeout: 15000 });

    // Verify Offers tab has active state
    await expect(offersTab).toHaveClass(/text-\[#FF5722\]/);

    // Capture screenshot of Offers page
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "offers_page_verified_390px.png"),
      fullPage: false,
    });
  });

  test("3. Hero 'Today's Deals' button navigates to /offers", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    const dealsBtn = page.locator("section a:has-text(\"Today's Deals\")").first();
    await expect(dealsBtn).toBeVisible();
    await dealsBtn.click();

    await expect(page).toHaveURL(`${BASE_URL}/offers`);
    await expect(page.locator("h1:has-text(\"Today's Special Offers\")")).toBeVisible();
  });

  test("4. /shop?deals=true filters products", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/shop?deals=true`, { waitUntil: "networkidle" });

    // Verify Deals category filter is active in shop
    const dealsFilter = page.locator("button:has-text('Daily Deals')");
    await expect(dealsFilter).toBeVisible({ timeout: 10000 });
    await expect(dealsFilter).toHaveClass(/bg-\[#FF5722\]/);
  });
});
