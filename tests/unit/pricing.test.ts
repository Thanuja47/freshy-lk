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

    it("computes exact price across multi-pack weights and offer combinations", () => {
      // Scenario A: 1,650.00 base with 15% offer = 1,402.50/kg
      const tunaBaseCents = 165000;
      const tunaOfferCents = getOfferPricePerKgCents({ pricePerKgCents: tunaBaseCents, offerPercent: 15 });
      expect(tunaOfferCents).toBe(140250);

      // 500g pack -> exactly 70,125 cents (Rs. 701.25)
      const tuna500gPack = calculatePackPriceCents(tunaOfferCents, 500);
      expect(tuna500gPack).toBe(70125);
      expect(formatMoney(tuna500gPack)).toBe("Rs. 701.25");

      // 1000g pack -> exactly 140,250 cents (Rs. 1,402.50)
      const tuna1kgPack = calculatePackPriceCents(tunaOfferCents, 1000);
      expect(tuna1kgPack).toBe(140250);
      expect(formatMoney(tuna1kgPack)).toBe("Rs. 1,402.50");

      // 2000g pack -> exactly 280,500 cents (Rs. 2,805.00)
      const tuna2kgPack = calculatePackPriceCents(tunaOfferCents, 2000);
      expect(tuna2kgPack).toBe(280500);
      expect(formatMoney(tuna2kgPack)).toBe("Rs. 2,805.00");

      // Scenario B: Order total with prep fee and delivery fee
      // 2 packs of 500g tuna (140,250 cents goods) + Cleaned prep (Rs. 100/kg = Rs. 100) + Rs. 350 delivery
      const prepFee = calculatePrepFeeCents(10000, "PER_KG", 500, 2);
      expect(prepFee).toBe(10000); // 1kg total weight = 10,000 cents

      const orderTotals = calculateOrderTotals(
        [{ lineTotalCents: tuna500gPack * 2, prepFeeCents: prepFee }],
        35000 // Rs. 350.00 delivery
      );

      expect(orderTotals.subtotalCents).toBe(140250);
      expect(orderTotals.prepTotalCents).toBe(10000);
      expect(orderTotals.deliveryFeeCents).toBe(35000);
      expect(orderTotals.totalCents).toBe(185250);
      expect(formatMoney(orderTotals.totalCents)).toBe("Rs. 1,852.50");
    });
  });
});
