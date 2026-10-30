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
    // Ignore in CI/production
  }
}

loadEnvFile(path.resolve(__dirname, "../../.env.local"));
loadEnvFile(path.resolve(__dirname, "../../.env"));

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("GATE 0: Launch Scope — Bank Transfer Only & Card Payment Off", () => {
  test("1. Checkout displays only Bank Transfer and hides all Card options/notices", async ({ page }) => {
    test.setTimeout(60000);

    // Add product to cart
    await page.goto(`${BASE_URL}/shop`, { waitUntil: "domcontentloaded" });
    const firstProduct = page.locator('a[href^="/product/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });
    const productHref = await firstProduct.getAttribute("href");
    await page.goto(`${BASE_URL}${productHref}`, { waitUntil: "domcontentloaded" });

    const addToCartBtn = page.getByRole("button", { name: /Add to Cart/i }).first();
    await expect(addToCartBtn).toBeVisible({ timeout: 15000 });
    await addToCartBtn.click();
    await page.waitForTimeout(500);

    // Navigate to checkout
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Checkout/i, { timeout: 15000 });

    // Step 1: Customer details
    const nameInput = page.locator('input[placeholder*="Kasun Perera"]');
    await nameInput.fill("Saman Kumara");

    const phoneInput = page.locator('input[placeholder*="077"]');
    await phoneInput.fill("0771234567");

    const toStep2 = page.locator('button:has-text("Continue to Delivery Address")').first();
    await expect(toStep2).toBeVisible({ timeout: 10000 });
    await toStep2.click();

    // Step 2: Address
    const districtSelect = page.locator('select').first();
    await expect(districtSelect).toBeVisible({ timeout: 10000 });
    await districtSelect.selectOption("Colombo");

    const cityInput = page.locator('input[placeholder*="Nugegoda"]');
    await cityInput.fill("Colombo 03");

    const addressInput = page.locator('input[placeholder*="House No"]');
    await addressInput.fill("12 Kollupitiya Road");

    const toStep3 = page.locator('button:has-text("Continue to Payment")').first();
    await expect(toStep3).toBeVisible({ timeout: 10000 });
    await toStep3.click();

    // Step 3: Payment Method
    // Verify Bank Transfer radio is present and checked
    const bankTransferRadio = page.locator('input[type="radio"][value="BANK_TRANSFER"]');
    await expect(bankTransferRadio).toBeVisible({ timeout: 10000 });
    await expect(bankTransferRadio).toBeChecked();

    // Verify Card option is completely hidden (0 matching elements)
    const cardRadio = page.locator('input[type="radio"][value="CARD_ONLINE"]');
    await expect(cardRadio).toHaveCount(0);

    // Verify no card maintenance or card logo texts appear anywhere on page
    const pageText = await page.innerText("body");
    expect(pageText).not.toContain("Visa / MasterCard / PayHere");
    expect(pageText).not.toContain("scheduled gateway maintenance");
  });

  test("2. Public storefront pages have zero claims implying active card payments", async ({ page }) => {
    test.setTimeout(60000);

    // FAQ page check
    await page.goto(`${BASE_URL}/faq`, { waitUntil: "domcontentloaded" });
    const faqText = await page.innerText("body");
    expect(faqText).not.toContain("online card payments via PayHere");
    expect(faqText).toContain("Direct Bank Transfer");

    // Home page check
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    const homeText = await page.innerText("body");
    expect(homeText).not.toContain("Visa");
    expect(homeText).not.toContain("Mastercard");
  });

  test("3. Complete Bank Transfer flow: place order, bank details, slip upload, admin verify & mark as paid", async ({ page, browser }) => {
    test.setTimeout(180000);

    // --- Customer Context: Place Order ---
    await page.goto(`${BASE_URL}/shop`, { waitUntil: "domcontentloaded" });
    const firstProduct = page.locator('a[href^="/product/"]').first();
    const productHref = await firstProduct.getAttribute("href");
    await page.goto(`${BASE_URL}${productHref}`, { waitUntil: "domcontentloaded" });

    const addToCartBtn = page.getByRole("button", { name: /Add to Cart/i }).first();
    await addToCartBtn.click();
    await page.waitForTimeout(500);

    await page.goto(`${BASE_URL}/checkout`, { waitUntil: "domcontentloaded" });

    // Step 1: Customer info
    await page.locator('input[placeholder*="Kasun Perera"]').fill("Kamal Gunaratne");
    await page.locator('input[placeholder*="077"]').fill("0719876543");
    await page.locator('button:has-text("Continue to Delivery Address")').first().click();

    // Step 2: Delivery address
    await page.locator('select').first().selectOption("Colombo");
    await page.locator('input[placeholder*="Nugegoda"]').fill("Colombo 05");
    await page.locator('input[placeholder*="House No"]').fill("88 Havelock Road");
    await page.locator('button:has-text("Continue to Payment")').first().click();

    // Step 3: Place Order
    const placeOrderBtn = page.getByRole("button", { name: /Place Order/i });
    await expect(placeOrderBtn).toBeEnabled({ timeout: 15000 });
    await placeOrderBtn.click();

    // Confirm cutoff if prompted, or wait for order redirect
    const confirmCutoffBtn = page.getByRole("button", { name: /Confirm New Delivery Date/i });
    try {
      if (await confirmCutoffBtn.isVisible({ timeout: 5000 })) {
        await confirmCutoffBtn.click();
      }
    } catch {
      // not prompted
    }

    await page.waitForURL(/\/order\/[a-zA-Z0-9_-]+$/, { timeout: 45000 });
    const orderUrl = page.url();
    expect(orderUrl).toMatch(/\/order\/[a-zA-Z0-9_-]+$/);

    // Verify Order Tracking page has Bank Transfer details and NO card form
    await expect(page.locator("text=Bank Transfer Payment")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Card Payment (PayHere)")).toHaveCount(0);
    await expect(page.locator("text=Upload Bank Transfer Slip")).toBeVisible();

    // Extract Order Number from page
    const orderNo = (await page.locator("h1").innerText()).trim();
    expect(orderNo).toMatch(/^FRS-\d{6}-\d{4}$/);
    console.log("Successfully created test Bank Transfer order:", orderNo);

    // Upload mock payment slip (valid 1x1 PNG with proper magic bytes)
    const mockSlipBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "bank-slip-test.png",
      mimeType: "image/png",
      buffer: mockSlipBuffer,
    });

    const uploadBtn = page.locator('button:has-text("Submit Payment Slip")');
    await expect(uploadBtn).toBeEnabled({ timeout: 10000 });
    await uploadBtn.click();

    // Verify slip upload success message
    await expect(page.locator("text=Payment slip uploaded successfully")).toBeVisible({ timeout: 20000 });

    // --- Admin Context: Verify slip and Mark as Paid ---
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    adminPage.on("dialog", (dialog) => dialog.accept());

    // Login as admin
    const passcode = process.env.DEMO_ADMIN_PASSCODE || "demo1234";
    const loginRes = await adminPage.request.post(`${BASE_URL}/api/admin/demo-login`, {
      data: { passcode },
      headers: { "Content-Type": "application/json" },
    });
    expect(loginRes.status()).toBe(200);

    // Navigate to admin orders list
    await adminPage.goto(`${BASE_URL}/admin/orders`, { waitUntil: "domcontentloaded" });
    await expect(adminPage.locator("h1")).toContainText(/Orders/i);

    // Find and open the order
    const orderRowLink = adminPage.locator(`a:has-text("${orderNo}")`).first();
    await expect(orderRowLink).toBeVisible({ timeout: 30000 });
    const orderHref = await orderRowLink.getAttribute("href");
    if (orderHref) {
      await adminPage.goto(`${BASE_URL}${orderHref}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    } else {
      await orderRowLink.click();
      await adminPage.waitForURL(/\/admin\/orders\/[a-zA-Z0-9_-]+$/, { timeout: 45000 });
    }
    await expect(adminPage.locator("h1")).toContainText(orderNo, { timeout: 20000 });

    // Verify uploaded bank slip is visible in Admin order details
    await expect(adminPage.locator("text=Customer Uploaded Slips")).toBeVisible({ timeout: 15000 });
    await expect(adminPage.locator("text=PENDING").first()).toBeVisible();

    // Click "Mark as Paid"
    const markPaidBtn = adminPage.locator('button:has-text("Mark as Paid")').first();
    await expect(markPaidBtn).toBeVisible({ timeout: 10000 });
    await markPaidBtn.click();

    // Verify payment status changed to PAID and invoice generated
    await expect(adminPage.locator("text=PAID").first()).toBeVisible({ timeout: 20000 });
    await expect(adminPage.locator("text=/FR-\\d{4}-\\d{6}/").first()).toBeVisible({ timeout: 20000 });

    // Check customer page update
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("text=Payment Received & Verified")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("a:has-text('Invoice PDF')")).toBeVisible({ timeout: 15000 });

    await adminContext.close();
  });
});
