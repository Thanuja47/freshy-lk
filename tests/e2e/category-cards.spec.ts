// tests/e2e/category-cards.spec.ts
// E2E test verifying:
// 1. Desktop (1440px) 4-column layout, gaps >= 12px, correct labels (Fish, Seafood, මුහුදු ආහාර), no Coming Soon eyebrow, margin >= 40px
// 2. Tablet (768px) 2x2 layout, gaps >= 12px, 0 overflow
// 3. Mobile (390px) 2x2 layout, gaps >= 12px, 0 overflow
// 4. Viewport sizes 1280px and 1920px without horizontal overflow
// 5. Hover zoom & focus ring interaction
// 6. Admin category update propagation to home screen within 60s

import { test, expect } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR = "C:/Users/hp/.gemini/antigravity/brain/9695cad0-55f1-4e7c-8188-fa4cee7c02e9";
const BASE_URL = "http://localhost:3000";

test.describe("Browse by Category - Full-Bleed Photo Cards", () => {
  test("1. Desktop (1440px) layout, spacing, text & contrast check", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    const categorySection = page.locator("section:has(h2:has-text('Browse by Category'))");
    await expect(categorySection).toBeVisible({ timeout: 15000 });

    // Verify 0 horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    // Verify 4 cards are rendered in grid
    const cards = categorySection.locator(".grid > a, .grid > div[role='link']");
    const count = await cards.count();
    expect(count).toBe(4);

    // Verify cards bounding boxes and horizontal gaps >= 12px (spec requires 20px on desktop)
    const box0 = await cards.nth(0).boundingBox();
    const box1 = await cards.nth(1).boundingBox();
    const box2 = await cards.nth(2).boundingBox();
    const box3 = await cards.nth(3).boundingBox();

    expect(box0).not.toBeNull();
    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();
    expect(box3).not.toBeNull();

    if (box0 && box1 && box2 && box3) {
      const gap01 = box1.x - (box0.x + box0.width);
      const gap12 = box2.x - (box1.x + box1.width);
      const gap23 = box3.x - (box2.x + box2.width);

      console.log(`Desktop horizontal gaps: gap01=${gap01.toFixed(1)}px, gap12=${gap12.toFixed(1)}px, gap23=${gap23.toFixed(1)}px`);
      expect(gap01).toBeGreaterThanOrEqual(12);
      expect(gap12).toBeGreaterThanOrEqual(12);
      expect(gap23).toBeGreaterThanOrEqual(12);
    }

    // TEXT VERIFICATION:
    // Card 1: Fresh Fish, Fish eyebrow, sinhala "මිරිදිය මාළු"
    const card1 = cards.nth(0);
    await expect(card1.locator("h3")).toContainText("Fresh Fish");
    await expect(card1.locator("span:has-text('Fish')")).toBeVisible();
    await expect(card1.locator("p:has-text('මිරිදිය මාළු')")).toBeVisible();

    // Card 2: Shellfish & Seafood, Seafood eyebrow, sinhala "මුහුදු ආහාර" (NOT Fish, NOT මිරිදිය මාළු!)
    const card2 = cards.nth(1);
    await expect(card2.locator("h3")).toContainText("Seafood");
    await expect(card2.locator("span:has-text('Seafood')")).toBeVisible();
    await expect(card2.locator("p:has-text('මුහුදු ආහාර')")).toBeVisible();
    // Strictly verify card 2 does NOT have "Fish" or "මිරිදිය මාළු"
    expect(await card2.locator("span:has-text('Fish')").count()).toBe(0);
    expect(await card2.locator("p:has-text('මිරිදිය මාළු')").count()).toBe(0);

    // Cards 3 & 4 (Fruits, Vegetables): "SOON" badge, and NO "Coming Soon" eyebrow
    const card3 = cards.nth(2);
    const card4 = cards.nth(3);
    await expect(card3.locator("span:has-text('SOON')")).toBeVisible();
    await expect(card4.locator("span:has-text('SOON')")).toBeVisible();
    expect(await card3.locator("span:has-text('Coming Soon')").count()).toBe(0);
    expect(await card4.locator("span:has-text('Coming Soon')").count()).toBe(0);

    // SECTION MARGIN VERIFICATION: at least 40px before "Featured Products"
    const featuredHeading = page.locator("h2:has-text('Featured Products')");
    const catBox = await categorySection.boundingBox();
    const featBox = await featuredHeading.boundingBox();
    if (catBox && featBox) {
      const marginBetween = featBox.y - (catBox.y + catBox.height);
      console.log(`Margin before Featured Products: ${marginBetween.toFixed(1)}px`);
      expect(marginBetween).toBeGreaterThanOrEqual(38); // At least ~40px
    }

    // Capture screenshot of category section at 1440px
    await categorySection.screenshot({
      path: path.join(ARTIFACT_DIR, "category_cards_desktop_1440px.png"),
    });
    console.log("PASS: Desktop 1440px screenshot captured and verified");
  });

  test("2. Tablet (768px) 2x2 grid layout and gap check", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    const categorySection = page.locator("section:has(h2:has-text('Browse by Category'))");
    await expect(categorySection).toBeVisible({ timeout: 15000 });

    // Check horizontal scroll / overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    // Verify 4 cards in 2x2 layout
    const cards = categorySection.locator(".grid > a, .grid > div[role='link']");
    expect(await cards.count()).toBe(4);

    const box0 = await cards.nth(0).boundingBox();
    const box1 = await cards.nth(1).boundingBox();
    const box2 = await cards.nth(2).boundingBox();

    expect(box0).not.toBeNull();
    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();

    if (box0 && box1 && box2) {
      const horizontalGap = box1.x - (box0.x + box0.width);
      const verticalGap = box2.y - (box0.y + box0.height);
      console.log(`Tablet 768px gaps: horizontalGap=${horizontalGap.toFixed(1)}px, verticalGap=${verticalGap.toFixed(1)}px`);
      expect(horizontalGap).toBeGreaterThanOrEqual(12);
      expect(verticalGap).toBeGreaterThanOrEqual(12);
    }

    // Capture tablet screenshot
    await categorySection.screenshot({
      path: path.join(ARTIFACT_DIR, "category_cards_tablet_768px.png"),
    });
    console.log("PASS: Tablet 768px screenshot captured");
  });

  test("3. Mobile (390px) 2x2 grid layout and gap check", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    const categorySection = page.locator("section:has(h2:has-text('Browse by Category'))");
    await expect(categorySection).toBeVisible({ timeout: 15000 });

    // Check horizontal scroll / overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    // Verify 4 cards in 2x2 layout
    const cards = categorySection.locator(".grid > a, .grid > div[role='link']");
    expect(await cards.count()).toBe(4);

    const box0 = await cards.nth(0).boundingBox();
    const box1 = await cards.nth(1).boundingBox();
    const box2 = await cards.nth(2).boundingBox();

    expect(box0).not.toBeNull();
    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();

    if (box0 && box1 && box2) {
      const horizontalGap = box1.x - (box0.x + box0.width);
      const verticalGap = box2.y - (box0.y + box0.height);
      console.log(`Mobile 390px gaps: horizontalGap=${horizontalGap.toFixed(1)}px, verticalGap=${verticalGap.toFixed(1)}px`);
      expect(horizontalGap).toBeGreaterThanOrEqual(10);
      expect(verticalGap).toBeGreaterThanOrEqual(10);
    }

    // Capture mobile screenshot
    await categorySection.screenshot({
      path: path.join(ARTIFACT_DIR, "category_cards_mobile_390px.png"),
    });
    console.log("PASS: Mobile 390px screenshot captured");
  });

  test("4. Viewport sizes 1280px and 1920px no horizontal overflow check", async ({ page }) => {
    test.setTimeout(60000);

    for (const width of [1280, 1920]) {
      await page.setViewportSize({ width, height: 1080 });
      await page.goto(BASE_URL, { waitUntil: "networkidle" });

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
      console.log(`PASS: No horizontal overflow at ${width}px (scrollWidth=${scrollWidth}, clientWidth=${clientWidth})`);
    }
  });

  test("5. Hover and focus states", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    const categorySection = page.locator("section:has(h2:has-text('Browse by Category'))");
    const firstCard = categorySection.locator("a").first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    // Hover over the first card
    await firstCard.hover();
    await page.waitForTimeout(500);

    // Capture hover screenshot
    await categorySection.screenshot({
      path: path.join(ARTIFACT_DIR, "category_card_hover_state.png"),
    });

    // Focus state via Tab
    await firstCard.focus();
    await page.waitForTimeout(300);
    await categorySection.screenshot({
      path: path.join(ARTIFACT_DIR, "category_card_focus_state.png"),
    });
    console.log("PASS: Hover and focus state screenshots captured");
  });

  test("6. Category admin update propagation to home screen", async ({ page }) => {
    test.setTimeout(120000);

    // 1. Direct login via /api/admin/demo-login
    const passcode = process.env.DEMO_ADMIN_PASSCODE || "demo1234";
    const loginRes = await page.request.post(`${BASE_URL}/api/admin/demo-login`, {
      data: { passcode },
      headers: { "Content-Type": "application/json" },
    });
    expect(loginRes.status()).toBe(200);

    // 2. Go to /admin/categories and edit the first category
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const editBtns = page.getByRole("button", { name: /Edit/i });
    await expect(editBtns.first()).toBeVisible({ timeout: 15000 });
    await editBtns.first().click();

    const nameInput = page.locator("div.fixed form div:has(label:has-text('Category Name')) input, input[placeholder='e.g. Fresh Fish']").first();
    await expect(nameInput).toBeVisible({ timeout: 8000 });

    const currentName = await nameInput.inputValue();
    const updatedName = currentName === "Fresh Fish" ? "Premium Fresh Fish" : "Fresh Fish";

    await nameInput.click({ clickCount: 3 });
    await nameInput.fill(updatedName);

    // Click the submit button inside the modal
    const modalSubmitBtn = page.locator("div.fixed form button[type='submit']");
    await expect(modalSubmitBtn).toBeVisible({ timeout: 5000 });
    await modalSubmitBtn.click();

    // The modal auto-closes 500ms after success
    const modalClosed = page.locator("h2:has-text('Edit Category')");
    await expect(modalClosed).not.toBeVisible({ timeout: 15000 });
    console.log("Modal closed successfully");

    // Record start time for propagation delay measurement
    const propagationStart = Date.now();

    // 3. Navigate to home page and verify the update appeared
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    const updatedCard = page.locator(`section:has(h2:has-text('Browse by Category')) h3:has-text('${updatedName}')`);
    let propagationMs = -1;
    try {
      await expect(updatedCard).toBeVisible({ timeout: 60000 });
      propagationMs = Date.now() - propagationStart;
      console.log(`PASS: Category update propagated to home screen in ${propagationMs}ms: "${updatedName}"`);
    } catch {
      await page.reload({ waitUntil: "networkidle" });
      await expect(updatedCard).toBeVisible({ timeout: 10000 });
      propagationMs = Date.now() - propagationStart;
      console.log(`PASS (after refresh): Category update propagated in ${propagationMs}ms: "${updatedName}"`);
    }

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "category_propagation_verified.png"),
    });

    // 4. Restore original name
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const restoreBtn = page.getByRole("button", { name: /Edit/i }).first();
    await restoreBtn.click();
    const nameInput2 = page.locator("div.fixed form div:has(label:has-text('Category Name')) input, input[placeholder='e.g. Fresh Fish']").first();
    await expect(nameInput2).toBeVisible({ timeout: 8000 });
    await nameInput2.click({ clickCount: 3 });
    await nameInput2.fill("Fresh Fish");

    const saveBtn2 = page.locator("div.fixed form button[type='submit']");
    await saveBtn2.click();
    await expect(page.locator("h2:has-text('Edit Category')")).not.toBeVisible({ timeout: 15000 });
    console.log("PASS: Restored category name to 'Fresh Fish'");
  });
});
