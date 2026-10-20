import { describe, it, expect } from "vitest";
import { formatMoney, roundPriceCents } from "../../src/lib/money";
import { getOfferPricePerKgCents } from "../../src/lib/offers";
import {
  calculatePackPriceCents,
  getEffectivePricePerKgCents,
  calculatePrepFeeCents,
  calculateOrderTotals,
} from "../../src/lib/pricing";

describe("Money & Pricing Engine (Section 7.1)", () => {
  it("formats integer cents to Sri Lankan Rupee standard format", () => {
    expect(formatMoney(165000)).toBe("Rs. 1,650.00");
    expect(formatMoney(330000)).toBe("Rs. 3,300.00");
    expect(formatMoney(0)).toBe("Rs. 0.00");
  });

  it("calculates pack price and rounds to nearest whole rupee", () => {
    // Rs 1,650.00/kg (165000 cents) for 500g -> 82500 cents (Rs 825.00)
    expect(calculatePackPriceCents(165000, 500)).toBe(82500);
    // 1 kg pack -> 165000 cents
    expect(calculatePackPriceCents(165000, 1000)).toBe(165000);
    // 2 kg pack -> 330000 cents
    expect(calculatePackPriceCents(165000, 2000)).toBe(330000);
  });

  it("applies automatic wholesale quantity price tiers", () => {
    const basePrice = 165000; // Rs 1650/kg
    const tiers = [
      { minWeightGrams: 10000, pricePerKgCents: 155000, label: "10kg+ Tier" }, // Rs 1550/kg at 10kg
      { minWeightGrams: 25000, pricePerKgCents: 145000, label: "25kg+ Tier" }, // Rs 1450/kg at 25kg
    ];

    // Under 10kg gets base price
    expect(getEffectivePricePerKgCents(basePrice, tiers, 5000).pricePerKgCents).toBe(165000);

    // 12kg gets 10kg tier (155000 cents)
    const tierResult = getEffectivePricePerKgCents(basePrice, tiers, 12000);
    expect(tierResult.pricePerKgCents).toBe(155000);
    expect(tierResult.tierLabel).toBe("10kg+ Tier");

    // 30kg gets 25kg tier (145000 cents)
    expect(getEffectivePricePerKgCents(basePrice, tiers, 30000).pricePerKgCents).toBe(145000);
  });

  it("calculates prep fees correctly (FLAT vs PER_KG)", () => {
    // FLAT Rs 100 per item for qty 2 -> 20000 cents
    expect(calculatePrepFeeCents(10000, "FLAT", 1000, 2)).toBe(20000);

    // PER_KG Rs 100 per kg for 2 x 1kg packs -> 20000 cents
    expect(calculatePrepFeeCents(10000, "PER_KG", 1000, 2)).toBe(20000);

    // PER_KG Rs 100 per kg for 2 x 500g packs -> 10000 cents
    expect(calculatePrepFeeCents(10000, "PER_KG", 500, 2)).toBe(10000);
  });

  it("recreates the specification test case accurately", () => {
    // Yellowfin Tuna sample price Rs. 1,650.00/kg.
    // 2 x 1 kg, prep "Cleaned" (Rs. 100 per kg): goods 3,300.00 (330000 cents), prep 200.00 (20000 cents).
    const packPrice = calculatePackPriceCents(165000, 1000); // 165000
    const lineGoodsTotal = packPrice * 2; // 330000 cents (3,300.00)
    const prepFee = calculatePrepFeeCents(10000, "PER_KG", 1000, 2); // 20000 cents (200.00)

    const totals = calculateOrderTotals(
      [{ lineTotalCents: lineGoodsTotal, prepFeeCents: prepFee }],
      35000 // Rs 350 delivery fee
    );

    expect(totals.subtotalCents).toBe(330000);
    expect(totals.prepTotalCents).toBe(20000);
    expect(totals.totalCents).toBe(385000); // 3300 + 200 + 350 = Rs 3,850.00
  });

  describe("Unified Rounding Rule (Cents Precision)", () => {
    it("calculates offer price for Rs. 1,650 less 15% to exact cents", () => {
      // 1,650.00 LKR = 165000 cents. 15% discount -> 165000 * 0.85 = 140250 cents (Rs. 1,402.50)
      const basePriceCents = 165000;
      const offerPercent = 15;
      const offerPrice = getOfferPricePerKgCents({ pricePerKgCents: basePriceCents, offerPercent });
      expect(roundPriceCents(offerPrice)).toBe(140250);
      expect(offerPrice).toBe(140250);
      expect(formatMoney(offerPrice)).toBe("Rs. 1,402.50");
    });

    it("renders identical price across shop, product page, cart, checkout, order, invoice and admin", () => {
      const basePriceCents = 165000;
      const offerPercent = 15;
      const offerPricePerKgCents = getOfferPricePerKgCents({ pricePerKgCents: basePriceCents, offerPercent });

      // 1. Shop card price
      const shopDisplay = formatMoney(offerPricePerKgCents);
      expect(shopDisplay).toBe("Rs. 1,402.50");

      // 2. Product detail page (1 kg pack)
      const packWeightGrams = 1000;
      const productPagePackPrice = calculatePackPriceCents(offerPricePerKgCents, packWeightGrams);
      const productPageDisplay = formatMoney(productPagePackPrice);
      expect(productPageDisplay).toBe("Rs. 1,402.50");

      // 3. Cart subtotal (1 item x 1 kg)
      const cartLineTotal = productPagePackPrice * 1;
      const cartDisplay = formatMoney(cartLineTotal);
      expect(cartDisplay).toBe("Rs. 1,402.50");

      // 4. Checkout summary line total
      const checkoutTotals = calculateOrderTotals(
        [{ lineTotalCents: cartLineTotal, prepFeeCents: 0 }],
        0 // zero delivery for pure goods comparison
      );
      const checkoutDisplay = formatMoney(checkoutTotals.subtotalCents);
      expect(checkoutDisplay).toBe("Rs. 1,402.50");

      // 5. Order confirmation line total
      const orderLineTotal = cartLineTotal;
      const orderDisplay = formatMoney(orderLineTotal);
      expect(orderDisplay).toBe("Rs. 1,402.50");

      // 6. Invoice goods total
      const invoiceDisplay = formatMoney(orderLineTotal);
      expect(invoiceDisplay).toBe("Rs. 1,402.50");

      // 7. Admin order view
      const adminDisplay = formatMoney(orderLineTotal);
      expect(adminDisplay).toBe("Rs. 1,402.50");

      // All 7 touchpoints render identical price string
      expect(shopDisplay)
        .toBe(productPageDisplay);
      expect(productPageDisplay)
        .toBe(cartDisplay);
      expect(cartDisplay)
        .toBe(checkoutDisplay);
      expect(checkoutDisplay)
        .toBe(orderDisplay);
      expect(orderDisplay)
        .toBe(invoiceDisplay);
      expect(invoiceDisplay)
        .toBe(adminDisplay);
    });
  });
});
