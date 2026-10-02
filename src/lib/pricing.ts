import { roundToNearestRupee } from "./money";

export interface PackInput {
  weightGrams: number;
}

export interface TierInput {
  minWeightGrams: number;
  pricePerKgCents: number;
  label?: string | null;
}

export interface CartLineInput {
  productId: string;
  weightGrams: number;
  quantity: number;
  prepFeeCents?: number;
  prepFeeType?: "FLAT" | "PER_KG";
}

/**
 * Calculate Pack Price: (pricePerKgCents * weightGrams / 1000) rounded to nearest 100 cents (whole rupee)
 */
export function calculatePackPriceCents(pricePerKgCents: number, weightGrams: number): number {
  const rawCents = (pricePerKgCents * weightGrams) / 1000;
  return roundToNearestRupee(rawCents);
}

/**
 * Determine effective price per kg for a product based on total grams of that product across cart lines
 */
export function getEffectivePricePerKgCents(
  basePricePerKgCents: number,
  tiers: TierInput[],
  totalProductGrams: number
): { pricePerKgCents: number; tierLabel: string | null } {
  if (!tiers || tiers.length === 0) {
    return { pricePerKgCents: basePricePerKgCents, tierLabel: null };
  }

  // Sort tiers descending by minWeightGrams
  const sortedTiers = [...tiers].sort((a, b) => b.minWeightGrams - a.minWeightGrams);

  const matchedTier = sortedTiers.find((t) => totalProductGrams >= t.minWeightGrams);

  if (matchedTier) {
    return {
      pricePerKgCents: matchedTier.pricePerKgCents,
      tierLabel: matchedTier.label || `${matchedTier.minWeightGrams / 1000} kg+ Tier`,
    };
  }

  return { pricePerKgCents: basePricePerKgCents, tierLabel: null };
}

/**
 * Calculate total prep fee for an item line
 */
export function calculatePrepFeeCents(
  feeCents: number,
  feeType: "FLAT" | "PER_KG",
  weightGrams: number,
  quantity: number
): number {
  if (!feeCents || feeCents <= 0) return 0;

  if (feeType === "FLAT") {
    return feeCents * quantity;
  }

  // PER_KG: fee * (pack weight in kg) * quantity
  const rawFee = feeCents * (weightGrams / 1000) * quantity;
  return roundToNearestRupee(rawFee);
}

/**
 * Calculate order subtotal and prep totals from item list
 */
export function calculateOrderTotals(
  items: Array<{
    lineTotalCents: number;
    prepFeeCents: number;
  }>,
  deliveryFeeCents: number,
  discountCents: number = 0,
  vatMode: "NONE" | "INCLUSIVE" | "EXCLUSIVE" = "NONE",
  vatRateBp: number = 0
) {
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const prepTotalCents = items.reduce((sum, item) => sum + item.prepFeeCents, 0);

  let taxCents = 0;
  let totalCents = subtotalCents + prepTotalCents - discountCents + deliveryFeeCents;

  if (vatMode === "EXCLUSIVE" && vatRateBp > 0) {
    const taxableSubtotal = subtotalCents + prepTotalCents - discountCents;
    taxCents = Math.round((taxableSubtotal * vatRateBp) / 10000);
    totalCents += taxCents;
  } else if (vatMode === "INCLUSIVE" && vatRateBp > 0) {
    const taxableSubtotal = subtotalCents + prepTotalCents - discountCents;
    taxCents = Math.round(taxableSubtotal - taxableSubtotal / (1 + vatRateBp / 10000));
  }

  return {
    subtotalCents,
    prepTotalCents,
    discountCents,
    deliveryFeeCents,
    taxCents,
    totalCents,
  };
}
