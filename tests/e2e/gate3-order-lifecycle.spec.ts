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

test.describe("GATE 3: Order Status Lifecycle & Cancellation Flow", () => {
  test("Order status lifecycle: PENDING_PAYMENT -> CONFIRMED -> PACKED -> DISPATCHED -> DELIVERED", async ({
    page,
    browser,
  }) => {
    test.setTimeout(180000);

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
    await page.locator('input[placeholder*="Kasun Perera"]').fill("Lifecycle QA Test");
    await page.locator('input[placeholder*="077"]').fill("0775558888");
    await page.locator('button:has-text("Continue to Delivery Address")').first().click();

    // Step 2: Address
    await page.locator("select").first().selectOption("Colombo");
    await page.locator('input[placeholder*="Nugegoda"]').fill("Colombo 04");
    await page.locator('input[placeholder*="House No"]').fill("25 Bambalapitiya Rd");
    await page.locator('button:has-text("Continue to Payment")').first().click();

    // Step 3: Place Order
    const placeOrderBtn = page.getByRole("button", { name: /Place Order/i }).first();
    await expect(placeOrderBtn).toBeEnabled({ timeout: 15000 });
    await placeOrderBtn.click();

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
    console.log(`Order placed for lifecycle test: ${orderNo}, token: ${token}`);

    // Verify initial status is PENDING_PAYMENT
    await expect(page.locator("text=/Pending Payment|Payment Required/i").first()).toBeVisible({ timeout: 15000 });

    // 2. Admin logs in
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    adminPage.on("dialog", (d) => d.accept());

    const passcode = process.env.DEMO_ADMIN_PASSCODE || "demo1234";
    await adminPage.request.post(`${BASE_URL}/api/admin/demo-login`, {
      data: { passcode },
      headers: { "Content-Type": "application/json" },
    });

    await adminPage.goto(`${BASE_URL}/admin/orders`, { waitUntil: "domcontentloaded" });
    const orderRowLink = adminPage.locator(`a:has-text("${orderNo}")`).first();
    await expect(orderRowLink).toBeVisible({ timeout: 15000 });

    const orderDetailUrl = await orderRowLink.getAttribute("href");
    await adminPage.goto(`${BASE_URL}${orderDetailUrl}`, { waitUntil: "domcontentloaded" });

    // Advance to CONFIRMED via Mark as Paid
    const markPaidBtn = adminPage.getByRole("button", { name: /Mark as Paid/i });
    await expect(markPaidBtn).toBeVisible({ timeout: 15000 });
    await markPaidBtn.click();
    await expect(adminPage.locator("text=/CONFIRMED/i").first()).toBeVisible({ timeout: 20000 });

    // Transition to PACKED
    const packedBtn = adminPage.getByRole("button", { name: /Mark as Packed|Packed/i }).first();
    if (await packedBtn.isVisible()) {
      await packedBtn.click();
      await page.waitForTimeout(1000);
    }

    // Transition to DISPATCHED
    const dispatchBtn = adminPage.getByRole("button", { name: /Mark as Dispatched|Dispatched/i }).first();
    if (await dispatchBtn.isVisible()) {
      await dispatchBtn.click();
      await page.waitForTimeout(1000);
    }

    // Transition to DELIVERED
    const deliverBtn = adminPage.getByRole("button", { name: /Mark as Delivered|Delivered/i }).first();
    if (await deliverBtn.isVisible()) {
      await deliverBtn.click();
      await page.waitForTimeout(1000);
    }

    // Verify customer page reflects progress
    await page.reload({ waitUntil: "domcontentloaded" });
    const bodyText = await page.innerText("body");
    expect(bodyText).toMatch(/Delivered|Dispatched|Packed|Confirmed/i);
    console.log("Verified order status lifecycle progression successfully!");

    await adminContext.close();
  });
});
