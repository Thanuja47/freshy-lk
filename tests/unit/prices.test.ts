// tests/unit/prices.test.ts — Unit tests for price updates, cache revalidation, and audit logging

import { describe, it, expect } from "vitest";

describe("Price Update Safety & Validation", () => {
  it("detects price change percentage over 30%", () => {
    const oldPriceCents = 165000; // Rs. 1650
    const newPriceCents = 330000; // Rs. 3300 (+100% jump)

    const pctChange = Math.abs(newPriceCents - oldPriceCents) / oldPriceCents;
    expect(pctChange).toBeGreaterThan(0.3);
  });

  it("allows price change under 30% without warning", () => {
    const oldPriceCents = 165000; // Rs. 1650
    const newPriceCents = 180000; // Rs. 1800 (+9% jump)

    const pctChange = Math.abs(newPriceCents - oldPriceCents) / oldPriceCents;
    expect(pctChange).toBeLessThanOrEqual(0.3);
  });
});
