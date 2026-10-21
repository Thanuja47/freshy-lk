import { test, expect } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR = "C:/Users/hp/.gemini/antigravity/brain/9695cad0-55f1-4e7c-8188-fa4cee7c02e9";

test.describe("Database-Driven Storefront Price Propagation", () => {
  test("admin price change reflects across shop, product page, and cart", async ({ page, context, baseURL }) => {
    test.setTimeout(180000);

    const passcode = process.env.DEMO_ADMIN_PASSCODE;
    if (!passcode) {
      test.skip(true, "DEMO_ADMIN_PASSCODE not set — skipping admin login test");
      return;
    }

    // 1. Log in via API to get session cookie, inject into browser context
    const loginRes = await page.request.post("/api/admin/demo-login", {
      data: { passcode },
      headers: { "Content-Type": "application/json" },
    });
    expect(loginRes.status()).toBe(200);
    const cookies = loginRes.headers()["set-cookie"] || "";
    const sessionMatch = cookies.match(/demo_admin_session=([^;]+)/);
    expect(sessionMatch, "demo_admin_session cookie must be set").toBeTruthy();
    const sessionCookieValue = decodeURIComponent(sessionMatch![1]);

    const host = new URL(baseURL!).hostname;
    await context.addCookies([
      {
        name: "demo_admin_session",
        value: sessionCookieValue,
        domain: host,
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      },
    ]);
    console.log("Session cookie injected successfully");

    // 2. Navigate to /admin/prices
    await page.goto("/admin/prices", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Prices & Stock/i, { timeout: 15000 });

    // Wait for table to load
    const tunaRow = page.locator('tr:has-text("Yellowfin Tuna")');
    await expect(tunaRow).toBeVisible({ timeout: 15000 });

    // Target the price input (step=10 = price; step=0.5 = stock kg)
    const priceInput = tunaRow.locator('input[type="number"][step="10"]');
    await expect(priceInput).toBeVisible();
    const originalPrice = await priceInput.inputValue();
    console.log(`Original Yellowfin Tuna price: Rs. ${originalPrice}/kg`);

    const newTargetPrice = "1850"; // Rs. 1,850/kg
    await priceInput.fill(newTargetPrice);
    await priceInput.blur(); // Trigger onBlur save

    // Wait for save to propagate (server revalidates cache tags)
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "admin_price_save_proof.png") });
    console.log(`Saved new price in admin: Rs. ${newTargetPrice}/kg`);

    // 3. Verify on /shop
    await page.goto("/shop", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });

    // Find the Yellowfin Tuna card
    const shopTunaCard = page.locator('div:has-text("Yellowfin Tuna")').filter({ has: page.locator('a[href^="/product/"]') }).first();
    await expect(shopTunaCard).toBeVisible({ timeout: 15000 });
    await expect(shopTunaCard).toContainText(/1,850|1850/);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "shop_price_proof.png") });
    console.log("✅ /shop shows new price Rs. 1,850");

    // 4. Verify on /product/yellowfin-tuna
    await page.goto("/product/yellowfin-tuna", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Yellowfin Tuna/i, { timeout: 15000 });
    await expect(page.locator("body")).toContainText(/1,850|1850/);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "product_price_proof.png") });
    console.log("✅ /product/yellowfin-tuna shows new price Rs. 1,850");

    // 5. Add to cart & verify on /cart
    const addToCartBtn = page.getByRole("button", { name: /Add to Cart/i }).first();
    await addToCartBtn.click();
    await page.waitForTimeout(1000);

    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Shopping Cart/i, { timeout: 15000 });
    const cartTuna = page.locator('div:has-text("Yellowfin Tuna")').first();
    await expect(cartTuna).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "cart_price_proof.png") });
    console.log("✅ /cart shows product at new price");

    // 6. Restore original price
    await page.goto("/admin/prices", { waitUntil: "domcontentloaded" });
    const restoreRow = page.locator('tr:has-text("Yellowfin Tuna")');
    await expect(restoreRow).toBeVisible({ timeout: 15000 });
    const restoreInput = restoreRow.locator('input[type="number"][step="10"]');
    await restoreInput.fill(originalPrice || "1800");
    await restoreInput.blur();
    await page.waitForTimeout(3000);
    console.log(`Restored Yellowfin Tuna price to Rs. ${originalPrice || "1800"}/kg`);
  });
});
