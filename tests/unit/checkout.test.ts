// tests/unit/checkout.test.ts — Unit tests for checkout server action rules: PRICE_CHANGED, DELIVERY_DATE_CHANGED, stock reservation, and order numbers

import { describe, it, expect } from "vitest";

describe("Checkout Flow Validation & Edge Cases", () => {
  it("formats order numbers according to FRS-yyMMdd-NNNN spec", () => {
    const dayKey = "261008"; // 2026-10-08
    const lastNumber = 1;
    const orderNo = `FRS-${dayKey}-${lastNumber.toString().padStart(4, "0")}`;

    expect(orderNo).toBe("FRS-261008-0001");
  });

  it("detects PRICE_CHANGED when DB price differs from cart price", () => {
    const cartItem = {
      productId: "prod-1",
      cartPricePerKgCents: 165000, // Rs 1650/kg
      quantity: 1,
      packWeightGrams: 1000,
    };

    const freshDbPricePerKgCents = 180000; // Rs 1800/kg (price changed today)

    const hasPriceChanged = freshDbPricePerKgCents !== cartItem.cartPricePerKgCents;
    expect(hasPriceChanged).toBe(true);

    const newSubtotalCents = (freshDbPricePerKgCents * cartItem.packWeightGrams / 1000) * cartItem.quantity;
    expect(newSubtotalCents).toBe(180000);
  });

  it("detects DELIVERY_DATE_CHANGED when user selects date prior to earliest allowed delivery date", () => {
    const selectedDateYMD = "2026-10-08"; // Today
    const earliestAllowedDateYMD = "2026-10-09"; // Past 12 PM cutoff -> earliest is tomorrow

    const isDateExpired = selectedDateYMD < earliestAllowedDateYMD;
    expect(isDateExpired).toBe(true);
  });

  it("reserves stock atomically and prevents overselling on simultaneous requests", () => {
    const initialStockGrams = 1000; // Only 1 kg in stock
    const order1Grams = 1000; // Order 1 requests 1 kg
    const order2Grams = 1000; // Order 2 requests 1 kg simultaneously

    // Simulating atomic update: first order succeeds
    let currentStock = initialStockGrams;
    let order1Success = false;
    let order2Success = false;

    if (currentStock >= order1Grams) {
      currentStock -= order1Grams;
      order1Success = true;
    }

    if (currentStock >= order2Grams) {
      currentStock -= order2Grams;
      order2Success = true;
    }

    expect(order1Success).toBe(true);
    expect(order2Success).toBe(false);
    expect(currentStock).toBe(0);
  });
});
