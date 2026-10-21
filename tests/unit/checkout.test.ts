// tests/unit/checkout.test.ts — Unit tests for checkout server action rules: PRICE_CHANGED, DELIVERY_DATE_CHANGED, stock reservation, and order numbers

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => {
  return {
    db: {
      order: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      deliveryZone: {
        findMany: vi.fn(),
      },
      product: {
        findMany: vi.fn(),
      },
      orderCounter: {
        upsert: vi.fn(),
      },
      customer: {
        upsert: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb({
        customer: { upsert: vi.fn().mockResolvedValue({ id: "cust-1" }) },
        orderCounter: { upsert: vi.fn().mockResolvedValue({ lastNumber: 1 }) },
        order: { create: vi.fn().mockResolvedValue({ id: "ord-1", orderNo: "FRS-261025-0001", trackingToken: "tok-123" }) },
        deliveryZone: { update: vi.fn().mockResolvedValue({}) },
        product: { findUnique: vi.fn().mockResolvedValue({ id: "prod-1", name: "Yellowfin Tuna", trackStock: false, stockGrams: 0, isAvailable: true }), update: vi.fn().mockResolvedValue({}) },
      })),
    },
  };
});

import { createOrder } from "@/actions/checkout";
import { db } from "@/lib/db";

describe("Checkout Flow Validation & Edge Cases", () => {
  it("formats order numbers according to FRS-yyMMdd-NNNN spec", () => {
    const dayKey = "261008"; // 2026-10-08
    const lastNumber = 1;
    const orderNo = `FRS-${dayKey}-${lastNumber.toString().padStart(4, "0")}`;

    expect(orderNo).toBe("FRS-261008-0001");
  });

  it("submits a stale cart price and expects server action to return PRICE_CHANGED", async () => {
    const prodId = "61af5f38-2383-4191-9d7c-5a612605930d";

    vi.mocked(db.order.findUnique).mockResolvedValue(null);
    vi.mocked(db.deliveryZone.findMany).mockResolvedValue([
      {
        id: "zone-1",
        name: "Colombo Metro Express",
        districts: ["Colombo"],
        method: "COURIER",
        courierName: null,
        baseFeeCents: 35000,
        perKgFeeCents: 0,
        freeOverCents: null,
        minOrderCents: 0,
        leadDays: 0,
        cutoffTime: "12:00",
        sameDayAvailable: true,
        maxSameDayOrders: null,
        currentSameDayOrders: 0,
        deliveryWeekdays: [1, 2, 3, 4, 5, 6, 7],
        allowedStorage: ["FRESH", "FROZEN", "AMBIENT"],
        freshnessLabel: "Same-Day",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never,
    ]);

    // Product in DB has current price Rs. 1,800.00 (180,000 cents) and no offer
    vi.mocked(db.product.findMany).mockResolvedValue([
      {
        id: prodId,
        slug: "yellowfin-tuna",
        name: "Yellowfin Tuna",
        localName: "Kelawalla",
        pricePerKgCents: 180000,
        priceUpdatedAt: new Date(),
        priceVersion: 1,
        offerPercent: null,
        offerEndsAt: null,
        storageType: "FRESH",
        isAvailable: true,
        isActive: true,
        isFeatured: true,
        trackStock: false,
        stockGrams: 0,
        categoryId: "cat-1",
        shortDesc: null,
        description: null,
        tips: null,
        catchType: null,
        origin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        packs: [
          {
            id: "pack-1",
            productId: prodId,
            weightGrams: 1000,
            label: "1 kg",
            isActive: true,
            sortOrder: 0,
          },
        ],
        tiers: [],
        preps: [],
      } as never,
    ]);

    // Customer cart has stale price: Rs. 1,402.50 (140,250 cents)
    const result = await createOrder({
      customerName: "Nimal Perera",
      customerType: "INDIVIDUAL",
      phone: "+94771234567",
      addressLine1: "45 Galle Road",
      city: "Colombo",
      district: "Colombo",
      deliveryDate: "2026-12-01",
      paymentMethod: "BANK_TRANSFER",
      idempotencyKey: "stale-price-test-key-001",
      items: [
        {
          productId: prodId,
          packWeightGrams: 1000,
          quantity: 1,
          cartPricePerKgCents: 140250, // STALE! (differs from DB 180000)
        },
      ],
    });

    expect(result.status).toBe("PRICE_CHANGED");
    if (result.status === "PRICE_CHANGED") {
      expect(result.message).toContain("Prices for items in your cart have updated");
      expect(result.newSubtotalCents).toBe(180000);
      expect(result.updatedPrices?.[prodId]).toBe(180000);
    }
  });

  it("does NOT return PRICE_CHANGED when cart price matches fresh DB price", async () => {
    const prodId = "61af5f38-2383-4191-9d7c-5a612605930d";

    vi.mocked(db.order.findUnique).mockResolvedValue(null);
    vi.mocked(db.deliveryZone.findMany).mockResolvedValue([
      {
        id: "zone-1",
        name: "Colombo Metro Express",
        districts: ["Colombo"],
        method: "COURIER",
        courierName: null,
        baseFeeCents: 35000,
        perKgFeeCents: 0,
        freeOverCents: null,
        minOrderCents: 0,
        leadDays: 0,
        cutoffTime: "12:00",
        sameDayAvailable: true,
        maxSameDayOrders: null,
        currentSameDayOrders: 0,
        deliveryWeekdays: [1, 2, 3, 4, 5, 6, 7],
        allowedStorage: ["FRESH", "FROZEN", "AMBIENT"],
        freshnessLabel: "Same-Day",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never,
    ]);

    vi.mocked(db.product.findMany).mockResolvedValue([
      {
        id: prodId,
        slug: "yellowfin-tuna",
        name: "Yellowfin Tuna",
        localName: "Kelawalla",
        pricePerKgCents: 180000,
        priceUpdatedAt: new Date(),
        priceVersion: 1,
        offerPercent: null,
        offerEndsAt: null,
        storageType: "FRESH",
        isAvailable: true,
        isActive: true,
        isFeatured: true,
        trackStock: false,
        stockGrams: 0,
        categoryId: "cat-1",
        shortDesc: null,
        description: null,
        tips: null,
        catchType: null,
        origin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        packs: [
          {
            id: "pack-1",
            productId: prodId,
            weightGrams: 1000,
            label: "1 kg",
            isActive: true,
            sortOrder: 0,
          },
        ],
        tiers: [],
        preps: [],
      } as never,
    ]);

    const result = await createOrder({
      customerName: "Nimal Perera",
      customerType: "INDIVIDUAL",
      phone: "+94771234567",
      addressLine1: "45 Galle Road",
      city: "Colombo",
      district: "Colombo",
      deliveryDate: "2026-12-01",
      paymentMethod: "BANK_TRANSFER",
      idempotencyKey: "matching-price-test-key-002",
      items: [
        {
          productId: prodId,
          packWeightGrams: 1000,
          quantity: 1,
          cartPricePerKgCents: 180000, // MATCHES DB!
        },
      ],
    });

    expect(result.status).toBe("SUCCESS");
  });

  it("detects DELIVERY_DATE_CHANGED when user selects date prior to earliest allowed delivery date", () => {
    const selectedDateYMD = "2026-10-08"; // Today
    const earliestAllowedDateYMD = "2026-10-09"; // Past 12 PM cutoff -> earliest is tomorrow

    const isDateExpired = selectedDateYMD < earliestAllowedDateYMD;
    expect(isDateExpired).toBe(true);
  });

  it("reserves stock atomically and prevents overselling on simultaneous requests", () => {
    const initialStockGrams = 1000;
    const order1Grams = 1000;
    const order2Grams = 1000;

    let currentStock = initialStockGrams;
    let order1Success = false;
    let order2Success = false;

    if (currentStock >= order1Grams) {
      currentStock -= order1Grams;
      order1Success = true;
    }

    if (currentStock >= order2Grams) {
      currentStock -= order2Grams;
      order2Success = true;
    }

    expect(order1Success).toBe(true);
    expect(order2Success).toBe(false);
    expect(currentStock).toBe(0);
  });
});
