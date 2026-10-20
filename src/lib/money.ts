/**
 * Money utilities for Freshy.lk
 * All internal money values are stored as integer cents (LKR x 100).
 */

/**
 * ONE shared rounding rule for Freshy.lk: Cents Precision.
 * All monetary amounts (prices, discounts, fees, line totals, taxes, grand totals)
 * are calculated and stored in integer cents (1 LKR = 100 cents), rounded to the
 * nearest integer cent using standard arithmetic rounding (Math.round).
 *
 * This ensures identical price rendering across shop, product page, cart,
 * checkout, order confirmation, invoices, and admin portal.
 */
export function roundPriceCents(cents: number): number {
  return Math.round(cents);
}

/**
 * Format integer LKR cents as display string (e.g. 165000 -> "Rs. 1,650.00", 140250 -> "Rs. 1,402.50")
 */
export function formatMoney(cents: number): string {
  const roundedCents = roundPriceCents(cents);
  const rupees = roundedCents / 100;
  const formatted = new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
  return `Rs. ${formatted}`;
}

/**
 * Parse display rupee value into integer cents (e.g. 1650.50 -> 165050)
 */
export function rupeesToCents(rupees: number): number {
  return roundPriceCents(rupees * 100);
}

/**
 * Convert cents back to floating rupees number
 */
export function centsToRupees(cents: number): number {
  return roundPriceCents(cents) / 100;
}

/**
 * Optional whole-rupee rounding helper (for special fixed cash boundaries)
 */
export function roundToNearestRupee(cents: number): number {
  return Math.round(cents / 100) * 100;
}
