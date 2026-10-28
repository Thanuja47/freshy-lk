// tests/e2e/contact-page.spec.ts — End-to-end tests for /contact page
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
    // Ignore in build/CI environments where env vars are already in process.env
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

test.describe("/contact — Visuals, Decor, Form & Settings Single Source of Truth", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Admin saves contact settings and verifies on /contact across 1440px, 768px, 390px", async ({ page }) => {
    test.setTimeout(120000);

    // 1. Login and navigate to /admin/settings
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: "networkidle" });

    // 2. Fill Store & Contact details
    const testPhone = "+94 11 765 4321";
    const testWa = "+94 77 765 4321";
    const testEmail = "contact@freshy.lk";
    const testAddress = "No. 12, Fisheries Harbor Road, Negombo";
    const testHours = "Monday – Saturday: 6:00 AM – 7:00 PM (Asia/Colombo)";

    await page.locator("#field-operatingAddress").fill(testAddress);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/admin/settings") && r.status() === 200),
      page.locator("#section-general button").click(),
    ]);

    await page.locator("#field-supportPhone").fill(testPhone);
    await page.locator("#field-supportWhatsapp").fill(testWa);
    await page.locator("#field-supportEmail").fill(testEmail);
    await page.locator("#field-supportHours").fill(testHours);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/admin/settings") && r.status() === 200),
      page.locator("#section-contact button").click(),
    ]);

    // ── Desktop (1440px) ──
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });

    // Assert Title and decor
    await expect(page.locator("h1:has-text('Contact Freshy.lk')")).toBeVisible();
    await expect(page.locator("img[src*='decor-salmon.webp']")).toBeVisible();
    await expect(page.locator("img[src*='decor-citrus-fish.webp']")).toBeVisible();

    // Assert cards with saved data in main and footer (single source of truth)
    const main = page.locator("main");
    const footer = page.locator("footer");
    await expect(main.locator(`text=${testPhone}`)).toBeVisible({ timeout: 15000 });
    await expect(main.locator(`text=${testWa}`)).toBeVisible();
    await expect(main.locator(`text=${testEmail}`)).toBeVisible();
    await expect(main.locator(`text=${testAddress}`)).toBeVisible();

    // Verify footer reflects settings as well
    await expect(footer.locator(`text=${testPhone}`)).toBeVisible();
    await expect(footer.locator(`text=${testEmail}`)).toBeVisible();

    // Assert hours bar and cutoff rule
    await expect(page.locator("text=Customer Support Hours")).toBeVisible();
    await expect(page.locator(`text=${testHours}`)).toBeVisible();
    await expect(page.locator("text=/.*Daily Cut-Off Rule.*/")).toBeVisible();

    // Check no horizontal overflow
    let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    let clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "contact_desktop_1440px.png"),
      fullPage: true,
    });
    console.log("PASS: Desktop 1440px screenshot captured");

    // ── Tablet (768px) ──
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });
    scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "contact_tablet_768px.png"),
      fullPage: true,
    });
    console.log("PASS: Tablet 768px screenshot captured");

    // ── Mobile (390px) ──
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });
    scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "contact_mobile_390px.png"),
      fullPage: true,
    });
    console.log("PASS: Mobile 390px screenshot captured");
  });

  test("2. Contact form validation and submission saves to DB", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });

    const nameInput = page.locator("input[placeholder*='Kasun']");
    const phoneInput = page.locator("input[placeholder*='077']");
    const emailInput = page.locator("input[placeholder*='kasun@']");
    const messageInput = page.locator("textarea");
    const submitBtn = page.locator("button:has-text('Submit Message')");

    await nameInput.fill("Saman Kumara");
    await phoneInput.fill("0712345678");
    await emailInput.fill("saman@example.com");
    await messageInput.fill("Inquiring about bulk yellowfin tuna availability for a restaurant order.");

    await submitBtn.click();

    // Assert success alert is displayed
    const successAlert = page.locator("text=Thank you! Your message has been received");
    await expect(successAlert).toBeVisible({ timeout: 15000 });

    // Assert DB record created
    const inquiry = await db.contactInquiry.findFirst({
      where: { phone: "0712345678" },
      orderBy: { createdAt: "desc" },
    });
    expect(inquiry).not.toBeNull();
    expect(inquiry?.name).toBe("Saman Kumara");
    expect(inquiry?.message).toContain("yellowfin tuna");
    console.log("PASS: Contact form successfully saved inquiry to DB (id:", inquiry?.id, ")");
  });

  test("3. No Invented Data: with settings empty, page hides phone/email/hub cards", async ({ page }) => {
    test.setTimeout(60000);

    // 1. Clear contact fields via admin settings
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: "networkidle" });

    await page.locator("#field-operatingAddress").fill("");
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/admin/settings") && r.status() === 200),
      page.locator("#section-general button").click(),
    ]);

    await page.locator("#field-supportPhone").fill("");
    await page.locator("#field-supportWhatsapp").fill("");
    await page.locator("#field-supportEmail").fill("");
    await page.locator("#field-supportHours").fill("");
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/admin/settings") && r.status() === 200),
      page.locator("#section-contact button").click(),
    ]);

    // 2. Navigate to /contact and verify all fake claims are gone
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });

    // Assert NO invented claims or fake phones
    await expect(page.locator("text=+94 11 234 5678")).not.toBeVisible();
    await expect(page.locator("text=+94 77 123 4567")).not.toBeVisible();
    await expect(page.locator("text=Oceanfront Avenue")).not.toBeVisible();
    await expect(page.locator("text=Harbor Operations")).not.toBeVisible();
    await expect(page.locator("text=Packing and dispatch hub in Colombo 03")).not.toBeVisible();
    await expect(page.locator("text=Response within 2 hours")).not.toBeVisible();

    // Cards should not render phone or address
    await expect(page.locator("main").locator("text=Phone & WhatsApp")).not.toBeVisible();
    await expect(page.locator("main").locator("text=Operating Hub")).not.toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "contact_settings_empty.png"),
      fullPage: true,
    });
    console.log("PASS: Empty settings screenshot captured (0 invented claims verified)");
  });

  test("4. Admin settings propagation: saving settings reflects on /contact within 60s", async ({ page }) => {
    test.setTimeout(120000);

    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: "networkidle" });

    const newPhone = "+94 11 999 0001";
    const newWa = "+94 77 999 0001";
    const newEmail = "helpline@freshy-direct.lk";
    const newAddress = "No. 99, Marine Drive Coastal Depot, Negombo";
    const newHours = "Mon–Sun: 6:00 AM – 8:00 PM (Asia/Colombo)";

    await page.locator("#field-operatingAddress").fill(newAddress);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/admin/settings") && r.status() === 200),
      page.locator("#section-general button").click(),
    ]);

    await page.locator("#field-supportPhone").fill(newPhone);
    await page.locator("#field-supportWhatsapp").fill(newWa);
    await page.locator("#field-supportEmail").fill(newEmail);
    await page.locator("#field-supportHours").fill(newHours);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/admin/settings") && r.status() === 200),
      page.locator("#section-contact button").click(),
    ]);

    const propagationStart = Date.now();

    // Navigate to /contact and verify live storefront reflects changes
    await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });

    const main = page.locator("main");
    await expect(main.locator(`text=${newPhone}`)).toBeVisible({ timeout: 60000 });
    await expect(main.locator(`text=${newWa}`)).toBeVisible();
    await expect(main.locator(`text=${newEmail}`)).toBeVisible();
    await expect(main.locator(`text=${newAddress}`)).toBeVisible();
    await expect(main.locator(`text=${newHours}`)).toBeVisible();

    const propagationMs = Date.now() - propagationStart;
    console.log(`PASS: Settings update propagated to /contact in ${propagationMs}ms`);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "contact_admin_settings_propagated.png"),
      fullPage: true,
    });
  });
});
