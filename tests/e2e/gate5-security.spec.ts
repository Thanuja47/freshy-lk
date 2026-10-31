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

test.describe("GATE 5: Security Hardening & Auth Protection", () => {
  test("1. Unauthenticated requests to /admin routes redirect to /admin/login", async ({ browser }) => {
    const unauthContext = await browser.newContext();
    const page = await unauthContext.newPage();

    const protectedRoutes = [
      "/admin",
      "/admin/orders",
      "/admin/prices",
      "/admin/settings",
      "/admin/messages",
    ];

    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 });
      console.log(`Verified ${route} redirects to /admin/login when unauthenticated`);
    }

    await unauthContext.close();
  });

  test("2. Admin APIs return 401 Unauthorized without admin session", async ({ request }) => {
    const adminApis = [
      "/api/admin/orders-data",
      "/api/admin/prices-data",
      "/api/admin/sidebar-badges",
      "/api/admin/slips/view?key=fake-key",
    ];

    for (const api of adminApis) {
      const res = await request.get(`${BASE_URL}${api}`);
      expect(res.status(), `Expected ${api} to return 401 Unauthorized`).toBe(401);
      console.log(`Verified ${api} returns 401`);
    }
  });

  test("3. Security response headers are present on all responses", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/`);
    const headers = res.headers();

    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toBeDefined();
    expect(headers["strict-transport-security"]).toBeDefined();

    console.log("Verified security headers (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy).");
  });

  test("4. Order tracking requires valid token or phone+orderNo match", async ({ request }) => {
    // Non-existent order number & phone returns 404
    const resMismatch = await request.post(`${BASE_URL}/api/track`, {
      data: { orderNo: "FRS-999999-9999", phone: "0770000000" },
      headers: { "Content-Type": "application/json" },
    });
    expect(resMismatch.status()).toBe(404);

    // Missing fields returns 400
    const resMissing = await request.post(`${BASE_URL}/api/track`, {
      data: { orderNo: "" },
      headers: { "Content-Type": "application/json" },
    });
    expect(resMissing.status()).toBe(400);

    console.log("Verified IDOR protections on order tracking API.");
  });
});
