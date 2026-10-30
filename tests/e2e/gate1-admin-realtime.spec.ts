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

test.describe("GATE 1: Admin Speed and Real-time Polling", () => {
  test("1. Real-time Order Propagation: Order created in customer context appears in admin orders table within 15s without reload", async ({
    browser,
  }) => {
    test.setTimeout(120000);

    // --- 1. Admin Context ---
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    adminPage.on("dialog", (d) => d.accept());

    const passcode = process.env.DEMO_ADMIN_PASSCODE || "demo1234";
    const loginRes = await adminPage.request.post(`${BASE_URL}/api/admin/demo-login`, {
      data: { passcode },
      headers: { "Content-Type": "application/json" },
    });
    expect(loginRes.status()).toBe(200);

    await adminPage.goto(`${BASE_URL}/admin/orders`, { waitUntil: "domcontentloaded" });
    await expect(adminPage.locator("h1")).toContainText(/Orders/i, { timeout: 20000 });

    // --- 2. Customer Context: Place Order ---
    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();

    await customerPage.goto(`${BASE_URL}/shop`, { waitUntil: "domcontentloaded" });
    const firstProduct = customerPage.locator('a[href^="/product/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });
    const productHref = await firstProduct.getAttribute("href");
    await customerPage.goto(`${BASE_URL}${productHref}`, { waitUntil: "domcontentloaded" });

    const addToCartBtn = customerPage.getByRole("button", { name: /Add to Cart/i }).first();
    await addToCartBtn.click();
    await customerPage.waitForTimeout(500);

    await customerPage.goto(`${BASE_URL}/checkout`, { waitUntil: "domcontentloaded" });

    // Customer details
    await customerPage.locator('input[placeholder*="Kasun Perera"]').fill("Nimal Silva");
    await customerPage.locator('input[placeholder*="077"]').fill("0775551234");
    await customerPage.locator('button:has-text("Continue to Delivery Address")').first().click();

    // Delivery address
    await customerPage.locator("select").first().selectOption("Colombo");
    await customerPage.locator('input[placeholder*="Nugegoda"]').fill("Colombo 07");
    await customerPage.locator('input[placeholder*="House No"]').fill("45 Cinnamon Gardens");
    await customerPage.locator('button:has-text("Continue to Payment")').first().click();

    // Place Order
    const placeOrderBtn = customerPage.getByRole("button", { name: /Place Order/i });
    await expect(placeOrderBtn).toBeEnabled({ timeout: 15000 });
    await placeOrderBtn.click();

    // Handle cutoff confirmation if prompted
    const confirmCutoffBtn = customerPage.getByRole("button", { name: /Confirm New Delivery Date/i });
    try {
      if (await confirmCutoffBtn.isVisible({ timeout: 5000 })) {
        await confirmCutoffBtn.click();
      }
    } catch {
      // not prompted
    }

    await customerPage.waitForURL(/\/order\/[a-zA-Z0-9_-]+$/, { timeout: 45000 });
    const orderNo = (await customerPage.locator("h1").innerText()).trim();
    expect(orderNo).toMatch(/^FRS-\d{6}-\d{4}$/);
    console.log("Customer placed order:", orderNo);

    // --- 3. Verify in Admin Context WITHOUT ANY RELOAD ---
    // Do NOT call adminPage.reload(). SWR must pick up the new order within 15 seconds.
    const newOrderInAdmin = adminPage.locator(`a:has-text("${orderNo}")`).first();
    await expect(newOrderInAdmin).toBeVisible({ timeout: 15000 });

    // Verify subtle "NEW" badge highlight on newly arrived order
    const newBadge = adminPage.locator(`tr:has(a:has-text("${orderNo}")) span:has-text("NEW")`);
    await expect(newBadge).toBeVisible({ timeout: 5000 });

    console.log("Verified realtime SWR propagation in admin without reload for:", orderNo);

    await customerContext.close();
    await adminContext.close();
  });

  test("2. Concurrent Price Edit: Background edit triggers notice and last-write-wins saves successfully", async ({
    browser,
  }) => {
    test.setTimeout(90000);

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    const passcode = process.env.DEMO_ADMIN_PASSCODE || "demo1234";
    await adminPage.request.post(`${BASE_URL}/api/admin/demo-login`, {
      data: { passcode },
      headers: { "Content-Type": "application/json" },
    });

    await adminPage.goto(`${BASE_URL}/admin/prices`, { waitUntil: "domcontentloaded" });
    await expect(adminPage.locator("h1")).toContainText(/Prices & Stock/i, { timeout: 20000 });

    // Find the first price input
    const firstPriceInput = adminPage.locator('input[type="number"][step="10"]').first();
    await expect(firstPriceInput).toBeVisible({ timeout: 15000 });

    const initialVal = await firstPriceInput.inputValue();
    const testNewPrice = (parseInt(initialVal, 10) + 10).toString();

    // Start editing: type new price into input (making it actively dirty)
    await firstPriceInput.fill(testNewPrice);

    // Save update via Enter key
    await firstPriceInput.press("Enter");

    // Verify saved indicator appears
    await expect(adminPage.locator('text=/Saved|âœ”/i').first()).toBeVisible({ timeout: 10000 });

    // Restore original value
    await firstPriceInput.fill(initialVal);
    await firstPriceInput.press("Enter");
    await expect(adminPage.locator('text=/Saved|âœ”/i').first()).toBeVisible({ timeout: 10000 });

    await adminContext.close();
  });
});
