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

test.describe("GATE 2: Invoice & PDF Generation Flow", () => {
  test("Complete invoice flow: place order -> admin mark as paid -> sequential invoice -> PDF download & IDOR check", async ({
    page,
    browser,
  }) => {
    test.setTimeout(120000);

    // 1. Customer places order
    await page.goto(`${BASE_URL}/shop`, { waitUntil: "domcontentloaded" });
    const productLink = page.locator('a[href^="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15000 });
    const href = await productLink.getAttribute("href");
    await page.goto(`${BASE_URL}${href}`, { waitUntil: "domcontentloaded" });

    const addToCart = page.getByRole("button", { name: /Add to Cart/i }).first();
    await addToCart.click();
    await page.waitForTimeout(500);

    await page.goto(`${BASE_URL}/checkout`, { waitUntil: "domcontentloaded" });

    // Step 1: Customer Info
    await page.locator('input[placeholder*="Kasun Perera"]').fill("Invoice QA Test");
    await page.locator('input[placeholder*="077"]').fill("0771239999");
    await page.locator('button:has-text("Continue to Delivery Address")').first().click();

    // Step 2: Address
    await page.locator("select").first().selectOption("Colombo");
    await page.locator('input[placeholder*="Nugegoda"]').fill("Colombo 03");
    await page.locator('input[placeholder*="House No"]').fill("12 Kollupitiya Rd");
    await page.locator('button:has-text("Continue to Payment")').first().click();

    // Step 3: Place Order
    const placeOrderBtn = page.getByRole("button", { name: /Place Order/i }).first();
    await expect(placeOrderBtn).toBeEnabled({ timeout: 15000 });
    await placeOrderBtn.click();

    // If delivery cutoff prompt appears, wait and click confirm button
    const confirmCutoffBtn = page.locator('button:has-text("Confirm New Delivery Date")');
    try {
      await confirmCutoffBtn.waitFor({ state: "visible", timeout: 4000 });
      await confirmCutoffBtn.click();
    } catch {
      // not prompted
    }

    await page.waitForURL(/\/order\/[a-zA-Z0-9_-]+$/, { timeout: 45000 });
    const currentUrl = page.url();
    const token = currentUrl.split("/order/")[1];
    expect(token).toBeTruthy();

    const orderNo = (await page.locator("h1").innerText()).trim();
    expect(orderNo).toMatch(/^FRS-\d{6}-\d{4}$/);
    console.log(`Order placed: ${orderNo}, token: ${token}`);

    // 2. Admin logs in and marks order as paid
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
    const orderRowLink = adminPage.locator(`a:has-text("${orderNo}")`).first();
    await expect(orderRowLink).toBeVisible({ timeout: 15000 });

    const orderDetailUrl = await orderRowLink.getAttribute("href");
    expect(orderDetailUrl).toBeTruthy();
    await adminPage.goto(`${BASE_URL}${orderDetailUrl}`, { waitUntil: "domcontentloaded" });

    // Mark as paid
    const markPaidBtn = adminPage.getByRole("button", { name: /Mark as Paid/i });
    await expect(markPaidBtn).toBeVisible({ timeout: 15000 });
    await markPaidBtn.click();

    // Verify invoice section in admin order detail
    const invoiceBadge = adminPage.locator("text=/FR-\\d{4}-\\d{6}/").first();
    await expect(invoiceBadge).toBeVisible({ timeout: 25000 });
    const invoiceNoText = (await invoiceBadge.innerText()).trim();
    const invoiceMatch = invoiceNoText.match(/FR-\d{4}-\d{6}/);
    expect(invoiceMatch).toBeTruthy();
    const invoiceNo = invoiceMatch![0];
    console.log(`Generated Invoice Number: ${invoiceNo}`);

    // 3. Verify Customer Order Page reflects Payment Verified & Invoice
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("text=/Payment Received & Verified|Payment Verified|PAID/i").first()).toBeVisible({ timeout: 15000 });

    // Customer can access invoice
    const customerPdfRes = await page.request.get(`${BASE_URL}/api/invoices/${invoiceNo}/pdf?token=${token}`);
    expect(customerPdfRes.status()).toBe(200);
    expect(customerPdfRes.headers()["content-type"]).toContain("application/pdf");
    const customerPdfBody = await customerPdfRes.body();
    // Validate PDF magic bytes: %PDF
    expect(customerPdfBody.subarray(0, 4).toString("utf8")).toBe("%PDF");
    console.log(`Verified customer PDF download (${customerPdfBody.length} bytes, %PDF valid)`);

    // 4. Security & IDOR Verification:
    // Unauthorized request without token and without admin auth
    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();
    const unauthRes = await anonPage.request.get(`${BASE_URL}/api/invoices/${invoiceNo}/pdf`);
    expect(unauthRes.status()).toBe(401);

    // Request with wrong token returns 404
    const wrongTokenRes = await anonPage.request.get(`${BASE_URL}/api/invoices/${invoiceNo}/pdf?token=invalid-fake-token-12345`);
    expect(wrongTokenRes.status()).toBe(404);

    console.log("Verified IDOR protections: unauth returns 401, wrong token returns 404.");

    await anonContext.close();
    await adminContext.close();
  });
});
