// tests/unit/delivery.test.ts — Unit tests for delivery fee, cold-chain storage validation, and 12 PM cutoff date calculations

import { describe, it, expect } from "vitest";
import {
  calculateDeliveryFee,
  validateStorageCompatibility,
  getEarliestDeliveryDate,
  findZoneForDistrict,
  getCutoffCountdown,
  getDeliveryCutoffMessage,
  type DeliveryZoneLike,
} from "../../src/lib/delivery";

const sameDayZone: DeliveryZoneLike = {
  id: "zone-colombo",
  name: "Colombo & Suburbs",
  districts: ["Colombo", "Gampaha"],
  baseFeeCents: 35000,
  perKgFeeCents: 5000,
  freeOverCents: 1000000,
  minOrderCents: 150000,
  leadDays: 0,
  cutoffTime: "12:00",
  sameDayAvailable: true,
  maxSameDayOrders: 100,
  currentSameDayOrders: 10,
  deliveryWeekdays: [1, 2, 3, 4, 5, 6], // Mon-Sat (Sunday 0 excluded)
  allowedStorage: ["FRESH", "FROZEN", "AMBIENT"],
  freshnessLabel: "Chilled delivery",
  etaMinDays: 0,
  etaMaxDays: 1,
  isActive: true,
};

const nextDayZone: DeliveryZoneLike = {
  ...sameDayZone,
  id: "zone-[#outstation]",
  name: "Kandy & Outstation",
  districts: ["Kandy"],
  leadDays: 1,
  sameDayAvailable: false,
};

describe("Delivery Fee Calculation", () => {
  it("calculates base fee plus per kg fee", () => {
    const fee = calculateDeliveryFee(sameDayZone, 2500, 500000);
    expect(fee).toBe(35000 + 3 * 5000); // 50000 cents (Rs 500)
  });

  it("returns 0 fee when subtotal exceeds freeOverCents", () => {
    const fee = calculateDeliveryFee(sameDayZone, 5000, 1200000);
    expect(fee).toBe(0);
  });
});

describe("Storage Compatibility Validation", () => {
  it("passes when all cart item storage types match allowed zone storage", () => {
    const result = validateStorageCompatibility(sameDayZone, ["FRESH", "FROZEN"]);
    expect(result.isValid).toBe(true);
  });
});

describe("Delivery Cut-Off Rule Calculations (Point 8.e)", () => {
  it("returns same-day delivery when order is placed at 11:59 AM (before 12:00 PM cutoff)", () => {
    // 2026-10-05 is a Monday. 11:59 AM Asia/Colombo = 06:29 AM UTC
    const beforeCutoff = new Date("2026-10-05T06:29:00Z");
    const earliest = getEarliestDeliveryDate(sameDayZone, beforeCutoff, []);
    expect(earliest.getDate()).toBe(5); // Monday Oct 5 (same-day)
  });

  it("returns next-day delivery when order is placed at exactly 12:00 PM (at cutoff)", () => {
    // 12:00 PM Asia/Colombo = 06:30 AM UTC
    const atCutoff = new Date("2026-10-05T06:30:00Z");
    const earliest = getEarliestDeliveryDate(sameDayZone, atCutoff, []);
    expect(earliest.getDate()).toBe(6); // Tuesday Oct 6 (next-day)
  });

  it("returns next-day delivery when order is placed at 12:01 PM (after 12:00 PM cutoff)", () => {
    // 12:01 PM Asia/Colombo = 06:31 AM UTC
    const afterCutoff = new Date("2026-10-05T06:31:00Z");
    const earliest = getEarliestDeliveryDate(sameDayZone, afterCutoff, []);
    expect(earliest.getDate()).toBe(6); // Tuesday Oct 6 (next-day)
  });

  it("handles same-day zone vs next-day zone correctly", () => {
    const morning = new Date("2026-10-05T06:00:00Z"); // 11:30 AM Colombo (before cutoff)

    const sameDayResult = getEarliestDeliveryDate(sameDayZone, morning);
    expect(sameDayResult.getDate()).toBe(5); // Same-day zone -> Oct 5

    const nextDayResult = getEarliestDeliveryDate(nextDayZone, morning);
    expect(nextDayResult.getDate()).toBe(6); // Next-day zone -> Oct 6
  });

  it("skips non-delivery weekdays (Sunday)", () => {
    // Saturday Oct 10 2026 after 12 PM cutoff -> candidate becomes Sunday Oct 11. Sunday is not in deliveryWeekdays [1..6].
    const satAfternoon = new Date("2026-10-10T08:00:00Z"); // 1:30 PM Sat
    const earliest = getEarliestDeliveryDate(sameDayZone, satAfternoon, []);
    expect(earliest.getDate()).toBe(12); // Skips Sunday, picks Monday Oct 12
  });

  it("skips blackout dates", () => {
    const morning = new Date("2026-10-05T06:00:00Z"); // Mon Oct 5 (same-day)
    const blackoutDates = ["2026-10-05"];

    const earliest = getEarliestDeliveryDate(sameDayZone, morning, blackoutDates);
    expect(earliest.getDate()).toBe(6); // Skips blackout Oct 5 -> picks Oct 6
  });

  it("generates correct customer message wording per zone", () => {
    const sameDayMsg = getDeliveryCutoffMessage(sameDayZone);
    expect(sameDayMsg.headline).toBe("Order before 12 PM, delivered same day");
    expect(sameDayMsg.subtext).toBe("Order after 12 PM, delivered next day");

    const nextDayMsg = getDeliveryCutoffMessage(nextDayZone, new Date("2026-10-06"));
    expect(nextDayMsg.headline).toContain("Order before 12 PM, delivered by");
    expect(nextDayMsg.isSameDayEligible).toBe(false);
  });

  it("formats countdown text when cutoff is less than 2 hours away", () => {
    // 10:30 AM Colombo time -> 1h 30m remaining until 12:00 PM cutoff
    const morning = new Date("2026-10-05T05:00:00Z");
    const countdown = getCutoffCountdown("12:00", morning);
    expect(countdown.isBeforeCutoff).toBe(true);
    expect(countdown.formattedText).toBe("Order within 1h 30m for same-day delivery");
  });
});

describe("District Zone Resolution", () => {
  it("finds matching zone for district case-insensitively", () => {
    const zone = findZoneForDistrict([sameDayZone, nextDayZone], "colombo ");
    expect(zone?.id).toBe("zone-colombo");
  });
});
