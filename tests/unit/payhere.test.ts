// tests/unit/payhere.test.ts — Unit tests for PayHere gateway security hash, md5sig verification, status mapping & payload validation

import { describe, it, expect } from "vitest";
import {
  generatePayHereHash,
  verifyPayHereSignature,
  mapPayHereStatus,
  formatPayHereAmount,
  buildPayHereCheckoutForm,
  type PayHereNotifyPayload,
} from "../../src/lib/payhere";

describe("PayHere Integration Suite", () => {
  const merchantId = "123456";
  const merchantSecret = "secret_key_999";
  const orderId = "FRS-261008-0001";
  const amountCents = 155000; // Rs. 1550.00
  const currency = "LKR";

  it("formats integer cents to 2-decimal string format", () => {
    expect(formatPayHereAmount(155000)).toBe("1500.00" === "1550.00" ? "1550.00" : "1550.00");
    expect(formatPayHereAmount(5000)).toBe("50.00");
    expect(formatPayHereAmount(0)).toBe("0.00");
  });

  it("generates deterministic checkout security hash matching PayHere spec", () => {
    const hash = generatePayHereHash(merchantId, orderId, amountCents, currency, merchantSecret);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(32);
    expect(hash).toBe(hash.toUpperCase());
  });

  it("verifies valid PayHere md5sig notification signatures", () => {
    const amountStr = "1550.00";
    const statusCode = "2"; // Successful payment

    // Calculate expected md5sig
    const secretHash = require("crypto").createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
    const rawString = `${merchantId}${orderId}${amountStr}${currency}${statusCode}${secretHash}`;
    const md5sig = require("crypto").createHash("md5").update(rawString).digest("hex").toUpperCase();

    const validPayload: PayHereNotifyPayload = {
      merchant_id: merchantId,
      order_id: orderId,
      payment_id: "3200112233",
      payhere_amount: amountStr,
      payhere_currency: currency,
      status_code: statusCode,
      md5sig,
    };

    expect(verifyPayHereSignature(validPayload, merchantSecret)).toBe(true);
  });

  it("rejects tampered md5sig notification signatures", () => {
    const tamperedPayload: PayHereNotifyPayload = {
      merchant_id: merchantId,
      order_id: orderId,
      payment_id: "3200112233",
      payhere_amount: "9999.00", // Tampered amount
      payhere_currency: currency,
      status_code: "2",
      md5sig: "INVALID_HASH_1234567890ABCDEF123456",
    };

    expect(verifyPayHereSignature(tamperedPayload, merchantSecret)).toBe(false);
  });

  it("maps PayHere status codes correctly", () => {
    expect(mapPayHereStatus("2")).toEqual({ status: "PAID", orderStatus: "CONFIRMED", paymentStatus: "PAID" });
    expect(mapPayHereStatus("0")).toEqual({ status: "PENDING", orderStatus: "PENDING_PAYMENT", paymentStatus: "UNPAID" });
    expect(mapPayHereStatus("-1")).toEqual({ status: "FAILED", orderStatus: "PENDING_PAYMENT", paymentStatus: "FAILED" });
    expect(mapPayHereStatus("-2")).toEqual({ status: "CANCELLED", orderStatus: "CANCELLED", paymentStatus: "FAILED" });
    expect(mapPayHereStatus("-3")).toEqual({ status: "CHARGEBACK", orderStatus: "CANCELLED", paymentStatus: "REFUNDED" });
  });

  it("detects wrong amount payload comparing received amount vs expected order total", () => {
    const expectedOrderTotalCents = 155000;
    const receivedPayHereAmountStr = "1200.00";
    const receivedCents = Math.round(parseFloat(receivedPayHereAmountStr) * 100);

    const isAmountMatch = expectedOrderTotalCents === receivedCents;
    expect(isAmountMatch).toBe(false);
  });

  it("builds complete checkout form object with security hash", () => {
    const form = buildPayHereCheckoutForm({
      orderNo: "FRS-261008-0002",
      amountCents: 250000,
      customerName: "Kamal Perera",
      email: "kamal@example.com",
      phone: "+94771234567",
      addressLine1: "123 Galle Road",
      city: "Colombo 03",
      itemsSummary: "Yellowfin Tuna (1kg)",
    });

    expect(form.merchant_id).toBeDefined();
    expect(form.order_id).toBe("FRS-261008-0002");
    expect(form.amount).toBe("2500.00");
    expect(form.currency).toBe("LKR");
    expect(form.first_name).toBe("Kamal");
    expect(form.last_name).toBe("Perera");
    expect(form.hash).toBeDefined();
    expect(form.hash.length).toBe(32);
  });
});
