/**
 * Money utilities for Freshy.lk
 * All internal money values are stored as integer cents (LKR x 100).
 */

/**
 * Format integer LKR cents as display string (e.g. 165000 -> "Rs. 1,650.00")
 */
export function formatMoney(cents: number): string {
  const rupees = cents / 100;
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
  return Math.round(rupees * 100);
}

/**
 * Convert cents back to floating rupees number
 */
export function centsToRupees(cents: number): number {
  return cents / 100;
}

/**
 * Standard rounding rule: Round cents to nearest 100 cents (whole rupee)
 */
export function roundToNearestRupee(cents: number): number {
  return Math.round(cents / 100) * 100;
}
