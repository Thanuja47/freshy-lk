import { describe, it, expect } from "vitest";
import {
  isOfferActive,
  getOfferPricePerKgCents,
  getEffectivePrice,
} from "../../src/lib/offers";

describe("Daily Deals & Offer Engine", () => {
  it("validates whether an offer is active", () => {
    const activeProduct = {
      pricePerKgCents: 165000,
      offerPercent: 15,
      offerEndsAt: null,
    };
    expect(isOfferActive(activeProduct)).toBe(true);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    expect(isOfferActive({ ...activeProduct, offerEndsAt: futureDate })).toBe(true);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    expect(isOfferActive({ ...activeProduct, offerEndsAt: pastDate })).toBe(false);

    expect(isOfferActive({ pricePerKgCents: 165000, offerPercent: 0 })).toBe(false);
    expect(isOfferActive({ pricePerKgCents: 165000, offerPercent: 60 })).toBe(false);
  });

  it("calculates offer price per kg in cents correctly", () => {
    // Rs 1,650/kg (165000 cents) at 15% off -> 140250 cents (Rs 1,402.50)
    const product = { pricePerKgCents: 165000, offerPercent: 15 };
    expect(getOfferPricePerKgCents(product)).toBe(140250);

    // Rs 2,800/kg (280000 cents) at 10% off -> 252000 cents (Rs 2,520)
    expect(getOfferPricePerKgCents({ pricePerKgCents: 280000, offerPercent: 10 })).toBe(252000);
  });

  it("enforces lowest-price-wins between offer and wholesale tier (no stacking)", () => {
    const product = {
      pricePerKgCents: 165000, // Rs 1,650/kg base
      offerPercent: 15, // Rs 1,402.50/kg offer (140250 cents)
      tiers: [
        { minWeightGrams: 10000, pricePerKgCents: 155000, label: "10kg+ Tier" }, // Rs 1,550/kg (offer wins)
        { minWeightGrams: 25000, pricePerKgCents: 135000, label: "25kg+ Tier" }, // Rs 1,350/kg (tier wins)
      ],
    };

    // Low weight (1kg): base vs offer -> offer wins (140250)
    const lowWeightRes = getEffectivePrice(product, 1000);
    expect(lowWeightRes.pricePerKgCents).toBe(140250);
    expect(lowWeightRes.isOffer).toBe(true);
    expect(lowWeightRes.isTier).toBe(false);

    // 10kg weight: offer (140250) vs 10kg tier (155000) -> offer wins
    const tier10Res = getEffectivePrice(product, 10000);
    expect(tier10Res.pricePerKgCents).toBe(140250);
    expect(tier10Res.isOffer).toBe(true);

    // 25kg weight: offer (140250) vs 25kg tier (135000) -> 25kg tier wins
    const tier25Res = getEffectivePrice(product, 25000);
    expect(tier25Res.pricePerKgCents).toBe(135000);
    expect(tier25Res.isTier).toBe(true);
    expect(tier25Res.isOffer).toBe(false);
  });
});
