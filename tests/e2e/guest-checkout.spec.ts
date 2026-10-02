import { test, expect } from "@playwright/test";

test.describe("Phase 2: Guest Checkout & Order Flow", () => {
  test("guest can browse product, select pack, add to cart and view cart", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.locator("h1")).toContainText(/Fish/i);

    // Click on the first product card
    const firstProduct = page.locator('a[href^="/product/"]').first();
    await firstProduct.click();

    // Verify product detail page
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("button", { name: /Add to Cart/i })).toBeVisible();

    // Add to cart
    await page.getByRole("button", { name: /Add to Cart/i }).click();

    // Navigate to cart
    await page.goto("/cart");
    await expect(page.locator("h1")).toContainText(/Shopping Cart/i);
    await expect(page.getByRole("link", { name: /Proceed to Checkout/i })).toBeVisible();
  });

  test("guest can navigate to checkout and view order summary", async ({ page }) => {
    await page.goto("/shop");
    await page.locator('a[href^="/product/"]').first().click();
    await page.getByRole("button", { name: /Add to Cart/i }).click();

    await page.goto("/checkout");
    await expect(page.locator("h1")).toContainText(/Guest Checkout/i);
    await expect(page.getByRole("button", { name: /Place Order/i })).toBeVisible();
  });

  test("track order page displays search form", async ({ page }) => {
    await page.goto("/track");
    await expect(page.locator("h1")).toContainText(/Track Your Order/i);
    await expect(page.getByPlaceholder(/FRS-/i)).toBeVisible();
  });
});
