/**
 * Offer pricing helpers.
 *
 * Rules (from spec):
 *  - An offer is active when offerPercent is set (1–50) AND
 *    offerEndsAt is either null (no expiry) or is in the future.
 *  - The offer price = pricePerKgCents * (1 - offerPercent / 100), rounded to nearest cent.
 *  - Wholesale tier price and offer price do NOT stack.
 *    The single lower price wins. If equal, the tier price is preferred.
 *  - The server MUST recalculate at checkout and snapshot offerPricePerKgCents on OrderItem.
 */

export interface ProductOfferFields {
  pricePerKgCents: number;
  offerPercent?: number | null;
  offerEndsAt?: Date | string | null;
  tiers?: Array<{ minWeightGrams: number; pricePerKgCents: number; label?: string | null }>;
}

/** Returns true if the product currently has an active offer. */
export function isOfferActive(product: ProductOfferFields): boolean {
  if (!product.offerPercent || product.offerPercent < 1 || product.offerPercent > 50) {
    return false;
  }
  if (product.offerEndsAt) {
    const endsAt =
      product.offerEndsAt instanceof Date
        ? product.offerEndsAt
        : new Date(product.offerEndsAt);
    if (endsAt <= new Date()) return false;
  }
  return true;
}

/** Returns the offer-reduced price per kg in cents. Asserts offer is active before calling. */
export function getOfferPricePerKgCents(product: ProductOfferFields): number {
  const pct = product.offerPercent ?? 0;
  return Math.round(product.pricePerKgCents * (1 - pct / 100));
}

export interface EffectivePrice {
  pricePerKgCents: number;
  isOffer: boolean;
  isTier: boolean;
  label: string | null;
}

/**
 * Returns the single effective price per kg for a given total weight,
 * choosing the lowest of: base price, applicable tier price, or offer price.
 * Tier and offer do NOT stack.
 */
export function getEffectivePrice(
  product: ProductOfferFields,
  totalGrams: number
): EffectivePrice {
  let best = product.pricePerKgCents;
  let isTier = false;
  let isOffer = false;
  let label: string | null = null;

  // Check wholesale tiers
  const tiers = product.tiers ?? [];
  const eligibleTiers = tiers
    .filter((t) => totalGrams >= t.minWeightGrams)
    .sort((a, b) => b.minWeightGrams - a.minWeightGrams);

  if (eligibleTiers.length > 0) {
    const tierPrice = eligibleTiers[0].pricePerKgCents;
    if (tierPrice < best) {
      best = tierPrice;
      isTier = true;
      label = eligibleTiers[0].label ?? null;
    }
  }

  // Check offer
  if (isOfferActive(product)) {
    const offerPrice = getOfferPricePerKgCents(product);
    if (offerPrice < best) {
      best = offerPrice;
      isOffer = true;
      isTier = false;
      label = `${product.offerPercent}% off`;
    }
  }

  return { pricePerKgCents: best, isOffer, isTier, label };
}
