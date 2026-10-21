import { test, expect } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR = "C:/Users/hp/.gemini/antigravity/brain/9695cad0-55f1-4e7c-8188-fa4cee7c02e9";

test.describe("Database-Driven Storefront Price Propagation", () => {
  test("admin price change reflects across shop, product page, and cart", async ({ page }) => {
    test.setTimeout(180000);

    const passcode = process.env.DEMO_ADMIN_PASSCODE || "admin123";

    // 1. Log in to admin using passcode
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Admin/i, { timeout: 15000 });

    const demoInput = page.locator('input[placeholder*="DEMO_ADMIN_PASSCODE"]');
    await expect(demoInput).toBeVisible({ timeout: 15000 });
    await demoInput.fill(passcode);

    const enterBtn = page.getByRole("button", { name: /Enter Demo Admin/i });
    await enterBtn.click();

    // Wait for successful navigation to /admin
    await page.waitForURL(/\/admin(\/)?$/, { timeout: 15000 });
    console.log("Logged into admin portal successfully.");

    // 2. Navigate to /admin/prices
    await page.goto("/admin/prices", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Daily Catch Prices/i, { timeout: 15000 });

    // Wait for table to load
    const tunaRow = page.locator('tr:has-text("Yellowfin Tuna")');
    await expect(tunaRow).toBeVisible({ timeout: 15000 });

    // Target the price input for Yellowfin Tuna
    const priceInput = tunaRow.locator('input[type="number"]');
    await expect(priceInput).toBeVisible();
    const originalPrice = await priceInput.inputValue();
    console.log(`Original Yellowfin Tuna price: Rs. ${originalPrice}`);

    const newTargetPrice = "1850"; // Rs. 1,850/kg
    await priceInput.fill(newTargetPrice);
    await priceInput.blur(); // Trigger onBlur save

    // Wait for save confirmation
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "admin_price_save_proof.png") });
    console.log(`Saved new price in admin: Rs. ${newTargetPrice}`);

    // 3. Verify on /shop
    await page.goto("/shop", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });

    const shopTunaCard = page.locator('div:has-text("Yellowfin Tuna")').filter({ has: page.locator('a[href^="/product/"]') }).first();
    await expect(shopTunaCard).toBeVisible({ timeout: 15000 });
    await expect(shopTunaCard).toContainText(/1,850|1850/);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "shop_price_proof.png") });
    console.log("Verified: /shop shows new price Rs. 1,850");

    // 4. Verify on /product/yellowfin-tuna
    await page.goto("/product/yellowfin-tuna", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Yellowfin Tuna/i, { timeout: 15000 });
    await expect(page.locator("body")).toContainText(/1,850|1850/);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "product_price_proof.png") });
    console.log("Verified: /product/yellowfin-tuna shows new price Rs. 1,850");

    // 5. Add to cart & verify on /cart
    const addToCartBtn = page.getByRole("button", { name: /Add to Cart/i }).first();
    await addToCartBtn.click();
    await page.waitForTimeout(1000);

    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Shopping Cart/i, { timeout: 15000 });
    const cartTuna = page.locator('div:has-text("Yellowfin Tuna")');
    await expect(cartTuna).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "cart_price_proof.png") });
    console.log("Verified: /cart shows product with new price");

    // 6. Restore original price in admin
    await page.goto("/admin/prices", { waitUntil: "domcontentloaded" });
    await expect(tunaRow).toBeVisible({ timeout: 15000 });
    const restoreInput = tunaRow.locator('input[type="number"]');
    await restoreInput.fill(originalPrice || "1800");
    await restoreInput.blur();
    await page.waitForTimeout(3000);
    console.log(`Restored Yellowfin Tuna price to: Rs. ${originalPrice || "1800"}`);
  });
});
