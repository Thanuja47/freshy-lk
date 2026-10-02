// src/lib/constants.ts — Sri Lanka districts and domain constants for Freshy.lk

export const SRI_LANKA_DISTRICTS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Moneragala",
  "Ratnapura",
  "Kegalle",
] as const;

export type SriLankaDistrict = (typeof SRI_LANKA_DISTRICTS)[number];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PLACED: "Order Placed",
  CONFIRMED: "Confirmed",
  PACKED: "Packed & Ready",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid",
  PENDING_REVIEW: "Pending Review",
  PAID: "Paid",
  FAILED: "Payment Failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially Refunded",
};

// Normalize Sri Lankan phone number to +94XXXXXXXXX format
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+94")) {
    return cleaned;
  }
  if (cleaned.startsWith("94")) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith("0")) {
    return `+94${cleaned.slice(1)}`;
  }
  return `+94${cleaned}`;
}
