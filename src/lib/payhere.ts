// src/lib/payhere.ts — PayHere Sri Lanka payment gateway integration & hash validation

import crypto from "crypto";
import { env } from "@/lib/env";

export interface PayHereCheckoutParams {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string; // Formatted to 2 decimal places, e.g. "1500.00"
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
}

export interface PayHereNotifyPayload {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  custom_1?: string;
  custom_2?: string;
  method?: string;
  status_message?: string;
}

export type PayHereStatusResult =
  | { status: "PAID"; orderStatus: "CONFIRMED"; paymentStatus: "PAID" }
  | { status: "PENDING"; orderStatus: "PENDING_PAYMENT"; paymentStatus: "UNPAID" }
  | { status: "FAILED"; orderStatus: "PENDING_PAYMENT"; paymentStatus: "FAILED" }
  | { status: "CANCELLED"; orderStatus: "CANCELLED"; paymentStatus: "FAILED" }
  | { status: "CHARGEBACK"; orderStatus: "CANCELLED"; paymentStatus: "REFUNDED" };

/**
 * Calculates MD5 hash string in uppercase
 */
export function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex").toUpperCase();
}

/**
 * Formats integer cents to PayHere 2-decimal string format e.g. 150000 -> "1500.00"
 */
export function formatPayHereAmount(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

/**
 * Generates PayHere checkout security hash
 * Hash = UPPERCASE(MD5(merchant_id + order_id + amount + currency + UPPERCASE(MD5(merchant_secret))))
 */
export function generatePayHereHash(
  merchantId: string,
  orderId: string,
  amountCents: number,
  currency: string,
  merchantSecret: string
): string {
  const formattedAmount = formatPayHereAmount(amountCents);
  const secretHash = md5(merchantSecret);
  const rawString = `${merchantId}${orderId}${formattedAmount}${currency}${secretHash}`;
  return md5(rawString);
}

/**
 * Verifies the md5sig from PayHere notification payload
 * Sig = UPPERCASE(MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + UPPERCASE(MD5(merchant_secret))))
 */
export function verifyPayHereSignature(
  payload: PayHereNotifyPayload,
  merchantSecret: string
): boolean {
  if (!payload.merchant_id || !payload.order_id || !payload.payhere_amount || !payload.payhere_currency || !payload.status_code || !payload.md5sig) {
    return false;
  }

  const secretHash = md5(merchantSecret);
  const rawString = `${payload.merchant_id}${payload.order_id}${payload.payhere_amount}${payload.payhere_currency}${payload.status_code}${secretHash}`;
  const expectedHash = md5(rawString);

  return expectedHash.toUpperCase() === payload.md5sig.toUpperCase();
}

/**
 * Maps PayHere status_code to application status
 */
export function mapPayHereStatus(statusCode: string | number): PayHereStatusResult {
  const code = String(statusCode);

  switch (code) {
    case "2":
      return { status: "PAID", orderStatus: "CONFIRMED", paymentStatus: "PAID" };
    case "0":
      return { status: "PENDING", orderStatus: "PENDING_PAYMENT", paymentStatus: "UNPAID" };
    case "-1":
      return { status: "FAILED", orderStatus: "PENDING_PAYMENT", paymentStatus: "FAILED" };
    case "-2":
      return { status: "CANCELLED", orderStatus: "CANCELLED", paymentStatus: "FAILED" };
    case "-3":
      return { status: "CHARGEBACK", orderStatus: "CANCELLED", paymentStatus: "REFUNDED" };
    default:
      return { status: "FAILED", orderStatus: "PENDING_PAYMENT", paymentStatus: "FAILED" };
  }
}

/**
 * Prepares complete checkout form fields with hash for client-side submit
 */
export function buildPayHereCheckoutForm(input: {
  orderNo: string;
  amountCents: number;
  customerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  itemsSummary: string;
}): PayHereCheckoutParams {
  const merchantId = env.PAYHERE_MERCHANT_ID || "123456";
  const merchantSecret = env.PAYHERE_MERCHANT_SECRET || "sandbox_secret";
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const [firstName, ...lastNameParts] = input.customerName.trim().split(" ");
  const lastName = lastNameParts.join(" ") || "Customer";

  const currency = "LKR";
  const amountStr = formatPayHereAmount(input.amountCents);
  const hash = generatePayHereHash(merchantId, input.orderNo, input.amountCents, currency, merchantSecret);

  return {
    merchant_id: merchantId,
    return_url: `${siteUrl}/order/${input.orderNo}?payment=success`,
    cancel_url: `${siteUrl}/order/${input.orderNo}?payment=cancel`,
    notify_url: `${siteUrl}/api/webhooks/payhere`,
    order_id: input.orderNo,
    items: input.itemsSummary,
    currency,
    amount: amountStr,
    first_name: firstName || "Valued",
    last_name: lastName,
    email: input.email || "customer@freshy.lk",
    phone: input.phone,
    address: input.addressLine1,
    city: input.city,
    country: "Sri Lanka",
    hash,
  };
}
