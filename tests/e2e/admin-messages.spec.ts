// tests/e2e/admin-messages.spec.ts — E2E test for 2-Way Reception: Customer Inquiry -> Admin Messages Dashboard
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

import { db } from "../../src/lib/db";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const ARTIFACT_DIR = path.resolve(
  "C:/Users/hp/.gemini/antigravity/brain/9695cad0-55f1-4e7c-8188-fa4cee7c02e9"
);

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

test.describe("Customer Inquiry to Admin 2-Way Reception", () => {
  test.describe.configure({ mode: "serial" });

  const testCustomerName = `E2E Customer ${Date.now()}`;
  const testCustomerPhone = "0778901234";
  const testCustomerEmail = "e2e.customer@freshy.test";
  const testCustomerMessage = "Hello Freshy team! Need 5kg of fresh Seer Fish steaks for Sunday lunch.";

  test("1. Customer submits contact form on /contact", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });

    // Locate form fields
    const nameInput = page.locator("input[placeholder*='Kasun']");
    const phoneInput = page.locator("input[placeholder*='077']");
    const emailInput = page.locator("input[placeholder*='kasun@']");
    const messageInput = page.locator("textarea");
    const submitBtn = page.locator("button:has-text('Submit Message')");

    await expect(nameInput).toBeVisible({ timeout: 15000 });

    // Fill form
    await nameInput.fill(testCustomerName);
    await phoneInput.fill(testCustomerPhone);
    await emailInput.fill(testCustomerEmail);
    await messageInput.fill(testCustomerMessage);

    // Submit
    await submitBtn.click();

    // Verify confirmation message
    const alertSuccess = page.locator("text=Thank you! Your message has been received");
    await expect(alertSuccess).toBeVisible({ timeout: 15000 });

    // Verify DB record exists
    const dbRecord = await db.contactInquiry.findFirst({
      where: { name: testCustomerName },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.status).toBe("NEW");
    expect(dbRecord?.phone).toBe(testCustomerPhone);
  });

  test("2. Admin views inquiry on /admin/messages, uses quick WhatsApp link, updates status & note", async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Login as admin
    await loginAsAdmin(page);

    // Navigate to /admin/messages
    await page.goto(`${BASE_URL}/admin/messages`, { waitUntil: "networkidle" });
    await expect(page.locator("h1:has-text('Inquiries & Messages')")).toBeVisible({ timeout: 15000 });

    // Verify the inquiry card for our test customer is visible
    const inquiryCard = page.locator("[data-testid='inquiry-card']").filter({ hasText: testCustomerName }).first();
    await expect(inquiryCard).toBeVisible({ timeout: 10000 });

    // Verify customer contact details rendered
    await expect(inquiryCard.locator(`text=${testCustomerPhone}`)).toBeVisible();
    await expect(inquiryCard.locator(`text=${testCustomerEmail}`)).toBeVisible();
    await expect(inquiryCard.locator(`text=${testCustomerMessage}`)).toBeVisible();

    // Verify WhatsApp button link is properly formed
    const waButton = inquiryCard.locator("a:has-text('Chat on WhatsApp')");
    await expect(waButton).toBeVisible();
    const waHref = await waButton.getAttribute("href");
    expect(waHref).toContain("wa.me/0778901234");
    expect(waHref).toContain(encodeURIComponent(testCustomerName));

    // Verify Phone call button link
    const telButton = inquiryCard.locator(`a[href='tel:${testCustomerPhone}']`);
    await expect(telButton).toBeVisible();

    // Take Desktop screenshot
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "admin_messages_desktop_1440px.png"),
      fullPage: true,
    });

    // Take Mobile screenshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "admin_messages_mobile_390px.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 900 });

    // Change status from NEW to CONTACTED
    const statusSelect = inquiryCard.locator("select[aria-label='Change status']");
    await statusSelect.selectOption("CONTACTED");

    // Verify toast or updated status badge
    await expect(page.locator("text=Status updated to Contacted")).toBeVisible({ timeout: 10000 });

    // Add internal admin note
    const addNoteBtn = inquiryCard.locator("button:has-text('Add Note')");
    await addNoteBtn.click();

    const noteTextarea = inquiryCard.locator("textarea");
    await noteTextarea.fill("Customer phoned back, order confirmed for Sunday delivery.");

    const saveNoteBtn = inquiryCard.locator("button:has-text('Save Note')");
    await saveNoteBtn.click();

    await expect(page.locator("text=Admin note saved")).toBeVisible({ timeout: 10000 });
    await expect(inquiryCard.locator("text=Customer phoned back, order confirmed for Sunday delivery.")).toBeVisible();

    // Verify in PostgreSQL database
    const updatedInquiry = await db.contactInquiry.findFirst({
      where: { name: testCustomerName },
    });
    expect(updatedInquiry?.status).toBe("CONTACTED");
    expect(updatedInquiry?.adminNote).toBe("Customer phoned back, order confirmed for Sunday delivery.");

    // Cleanup test record
    await db.contactInquiry.deleteMany({
      where: { name: testCustomerName },
    });
  });
});
