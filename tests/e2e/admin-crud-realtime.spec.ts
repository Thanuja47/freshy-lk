import { test, expect } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR = "C:/Users/hp/.gemini/antigravity/brain/9695cad0-55f1-4e7c-8188-fa4cee7c02e9";

test.describe("Admin Dashboard Live Sync & CRUD Features", () => {
  test("full admin real-time sync, category creation, product creation, and storefront verification", async ({ page, context }) => {
    test.setTimeout(120000);

    const passcode = process.env.DEMO_ADMIN_PASSCODE || "demo1234";

    page.on("console", (msg) => console.log(`[BROWSER ${msg.type()}]:`, msg.text()));
    page.on("pageerror", (err) => console.log("[BROWSER PAGE ERROR]:", err));
    page.on("response", (res) => {
      if (res.status() >= 400) console.log("[HTTP ERROR]", res.status(), res.url());
    });

    // 1. Log in via API to obtain session cookie
    const loginRes = await page.request.post("/api/admin/demo-login", {
      data: { passcode },
      headers: { "Content-Type": "application/json" },
    });
    expect(loginRes.status()).toBe(200);
    const cookies = loginRes.headers()["set-cookie"] || "";
    const sessionMatch = cookies.match(/demo_admin_session=([^;]+)/);
    expect(sessionMatch, "demo_admin_session cookie must be set").toBeTruthy();
    const sessionCookieValue = decodeURIComponent(sessionMatch![1]);

    await context.addCookies([
      {
        name: "demo_admin_session",
        value: sessionCookieValue,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    // 2. Go to /admin dashboard
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Admin/i, { timeout: 15000 });
    
    // Check live header and refresh indicator
    const liveBadge = page.locator("text=Live").first();
    await expect(liveBadge).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "admin_dashboard_live.png"), fullPage: true });

    // 3. Go to /admin/categories
    await page.goto("/admin/categories", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Categories/i, { timeout: 15000 });
    
    // Click "Add Category" button to open modal
    const addCatBtn = page.getByRole("button", { name: /Add Category/i });
    await expect(addCatBtn).toBeVisible();
    await addCatBtn.click();

    // Fill modal form
    await expect(page.locator('input[placeholder="e.g. Fresh Fish"]')).toBeVisible({ timeout: 5000 });
    
    const uniqueCatName = `Exotic Shellfish ${Date.now()}`;
    const uniqueCatSlug = `exotic-shellfish-${Date.now()}`;
    await page.locator('input[placeholder="e.g. Fresh Fish"]').fill(uniqueCatName);
    await page.locator('input[placeholder="e.g. fresh-fish"]').fill(uniqueCatSlug);
    await page.locator('textarea').fill("Premium lagoon shellfish and crabs");
    
    // Save category
    await page.getByRole("button", { name: /Create Category/i }).click();
    await page.waitForTimeout(2000);

    // Verify newly created category card appears
    await expect(page.locator(`text=${uniqueCatSlug}`)).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "admin_category_created.png") });

    // 4. Go to /admin/products
    await page.goto("/admin/products", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Products/i, { timeout: 15000 });

    // Click "Add Product" button to open modal
    const addProdBtn = page.getByRole("button", { name: /Add Product/i });
    await expect(addProdBtn).toBeVisible();
    await addProdBtn.click();

    // Fill modal form
    await expect(page.locator('input[placeholder="e.g. Barramundi / Modha"]')).toBeVisible({ timeout: 5000 });
    const uniqueProdName = `Jumbo Wild Prawns ${Date.now()}`;
    await page.locator('input[placeholder="e.g. Barramundi / Modha"]').fill(uniqueProdName);
    await page.locator('input[placeholder="e.g. මෝදා"]').fill("විශාල ඉස්සන්");
    
    // Select category
    const catSelect = page.locator("select").first();
    await catSelect.selectOption({ label: uniqueCatName });

    // Price
    await page.locator('input[placeholder="1850"]').fill("3200");
    // Stock
    await page.locator('input[placeholder="10"]').fill("20");
    // Short desc
    await page.locator('textarea').fill("Fresh lagoon wild catch, cleaned and deveined");

    // Click "Create Product"
    await page.getByRole("button", { name: /Create Product/i }).click();
    await expect(page.locator("text=Add New Product")).toBeHidden({ timeout: 10000 });

    // Verify newly created product appears in the table
    await expect(page.getByText(uniqueProdName).first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "admin_product_created.png") });

    // 5. Verify customer storefront at /shop shows new product in real time
    await page.goto("/shop", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(uniqueProdName).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Rs. 3,200").first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "shop_realtime_created_product.png") });

    // 6. Test Orders interactive filters & real-time polling
    await page.goto("/admin/orders", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Orders Management/i, { timeout: 15000 });
    
    // Check Live Sync badge
    await expect(page.locator("text=Live Sync")).toBeVisible();
    
    // Test clickable status filter pill
    const deliveredFilter = page.locator('button:has-text("Delivered")').first();
    await deliveredFilter.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "admin_orders_filter.png") });
  });
});
