import { test, expect } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR = "C:/Users/hp/.gemini/antigravity/brain/9695cad0-55f1-4e7c-8188-fa4cee7c02e9";

test.describe("Outstation UI Order Flow (Bank Transfer)", () => {
  test("place order via real UI outside Colombo, refresh and track", async ({ page }) => {
    test.setTimeout(300000);
    page.on("console", (msg) => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on("pageerror", (err) => console.log(`[BROWSER ERROR] ${err.message}`));

    // 1. Shop Page
    await page.goto("/shop", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_step1_shop.png") });

    // 2. Select Product
    const firstProduct = page.locator('a[href^="/product/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });
    const productHref = (await firstProduct.getAttribute("href")) || "/product/yellowfin-tuna";
    await page.goto(productHref, { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_step2_product.png") });

    const addToCartBtn = page.getByRole("button", { name: /Add to Cart/i }).first();
    await expect(addToCartBtn).toBeVisible({ timeout: 15000 });

    // Add product to cart
    await addToCartBtn.click();
    await expect(page.locator("text=Added to cart successfully!")).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // 3. Cart Page
    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Shopping Cart/i, { timeout: 30000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_step3_cart.png") });

    // 4. Checkout Page
    const checkoutBtn = page.locator('a[href="/checkout"], a:has-text("Proceed to Checkout")').first();
    await expect(checkoutBtn).toBeVisible({ timeout: 15000 });
    await checkoutBtn.click();
    await expect(page.locator("h1")).toContainText(/Checkout/i, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Fill customer contact info
    const nameInput = page.locator('input[placeholder*="Kasun Perera"], input[id$="-customerName"]');
    await nameInput.fill("Nimal Perera");

    const phoneInput = page.locator('input[placeholder*="077"], input[id$="-phone"]');
    await phoneInput.fill("0771234567");

    // Select outstation district (Kandy)
    const districtSelect = page.locator('select[id$="-district"]');
    await districtSelect.selectOption("Kandy");
    await page.waitForTimeout(500);

    // Fill delivery address
    const cityInput = page.locator('input[placeholder*="Nugegoda"], input[id$="-city"]');
    await cityInput.fill("Peradeniya");

    const addressInput = page.locator('input[placeholder*="House No"], input[id$="-addressLine1"]');
    await addressInput.fill("45 Peradeniya Road, Kandy");

    // Select Bank Transfer payment method
    const bankTransferRadio = page.locator('input[type="radio"][value="BANK_TRANSFER"]');
    await bankTransferRadio.check();

    // Ensure delivery date input is set to min allowed date (outstation cutoff)
    const dateInput = page.locator('input[id$="-deliveryDate"]');
    if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const minDate = await dateInput.getAttribute("min");
      if (minDate) {
        await dateInput.fill(minDate);
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_step4_checkout.png") });

    // Place Order
    const placeOrderBtn = page.getByRole("button", { name: /Place Order/i });
    await expect(placeOrderBtn).toBeEnabled();
    await placeOrderBtn.click();

    // The order submission may show cutoff confirmation or navigate directly
    const confirmCutoffBtn = page.getByRole("button", { name: /Confirm New Delivery Date/i });
    const raceResult = await Promise.race([
      confirmCutoffBtn.waitFor({ state: "visible", timeout: 45000 }).then(() => "cutoff"),
      page.waitForURL(/\/order\/[a-zA-Z0-9_-]+$/, { timeout: 45000 }).then(() => "navigated"),
    ]).catch(() => "none");

    if (raceResult === "cutoff") {
      console.log("Past 12 PM cutoff notice triggered - clicking confirm new date...");
      await confirmCutoffBtn.click();
    }

    // 5. Order Confirmation Page
    await page.waitForURL(/\/order\/[a-zA-Z0-9_-]+$/, { timeout: 45000 });
    const orderHeading = page.locator("h1", { hasText: "FRS-" });
    await expect(orderHeading).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_step5_confirmation.png") });

    // Capture order number and token from page
    const currentUrl = page.url();
    const token = currentUrl.split("/order/")[1];
    const h1Text = (await orderHeading.textContent()) || "";
    const cleanOrderNo = h1Text.match(/FRS-\d{6}-\d+/)?.[0] || h1Text.trim();
    console.log(`Placed UI Order: OrderNo=${cleanOrderNo}, Token=${token}`);

    // 6. Refresh page and verify persistence
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("h1", { hasText: "FRS-" })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_step6_refresh.png") });

    // 7. Track Order Page
    await page.goto("/track", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Track Your Order/i, { timeout: 15000 });

    // Enter order number and phone
    const trackOrderInput = page.locator('input[placeholder*="FRS-"]');
    await trackOrderInput.fill(cleanOrderNo);

    const trackPhoneInput = page.locator('input[type="tel"]');
    await trackPhoneInput.fill("0771234567");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_step7_track.png") });

    // Click Track
    const trackBtn = page.getByRole("button", { name: /Track Order/i });
    await trackBtn.click();

    // 8. Track Result
    await page.waitForURL(/\/order\/[a-zA-Z0-9_-]+$/, { timeout: 15000 });
    await expect(page.locator("h1", { hasText: "FRS-" })).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_step8_track_result.png") });
  });
});
