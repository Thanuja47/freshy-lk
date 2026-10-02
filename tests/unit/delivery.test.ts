// tests/unit/delivery.test.ts — Unit tests for delivery fee, cold-chain storage validation, and cutoff date calculations

import { describe, it, expect } from "vitest";
import {
  calculateDeliveryFee,
  validateStorageCompatibility,
  getEarliestDeliveryDate,
  findZoneForDistrict,
  type DeliveryZoneLike,
} from "../../src/lib/delivery";

const mockZone: DeliveryZoneLike = {
  id: "zone-1",
  name: "Colombo & Suburbs",
  districts: ["Colombo", "Gampaha"],
  baseFeeCents: 35000, // Rs. 350
  perKgFeeCents: 5000, // Rs. 50 per kg
  freeOverCents: 1000000, // Free over Rs. 10,000
  minOrderCents: 150000, // Min order Rs. 1,500
  leadDays: 1,
  cutoffTime: "15:00",
  deliveryWeekdays: [1, 2, 3, 4, 5, 6], // Mon-Sat
  allowedStorage: ["FRESH", "FROZEN", "AMBIENT"],
  freshnessLabel: "Fresh, chilled delivery",
  etaMinDays: 1,
  etaMaxDays: 1,
  isActive: true,
};

const mockFrozenOnlyZone: DeliveryZoneLike = {
  ...mockZone,
  id: "zone-far",
  name: "Far Zones",
  districts: ["Jaffna", "Batticaloa"],
  allowedStorage: ["FROZEN"],
};

describe("Delivery Fee Calculation", () => {
  it("calculates base fee plus per kg fee", () => {
    // 2500g = 3 kg rounded up -> 350 + 3*50 = Rs. 500 = 50,000 cents
    const fee = calculateDeliveryFee(mockZone, 2500, 500000);
    expect(fee).toBe(35000 + 3 * 5000); // 50000 cents
  });

  it("returns 0 fee when subtotal exceeds freeOverCents", () => {
    const fee = calculateDeliveryFee(mockZone, 5000, 1200000); // Rs. 12,000 subtotal
    expect(fee).toBe(0);
  });
});

describe("Storage Compatibility Validation", () => {
  it("passes when all cart item storage types match allowed zone storage", () => {
    const result = validateStorageCompatibility(mockZone, ["FRESH", "FROZEN"]);
    expect(result.isValid).toBe(true);
    expect(result.invalidStorageTypes).toEqual([]);
  });

  it("fails when cart contains FRESH items for a FROZEN-only zone", () => {
    const result = validateStorageCompatibility(mockFrozenOnlyZone, ["FRESH", "FROZEN"]);
    expect(result.isValid).toBe(false);
    expect(result.invalidStorageTypes).toEqual(["FRESH"]);
  });
});

describe("Earliest Delivery Date Calculation", () => {
  it("respects cutoff time and lead days", () => {
    // Mock morning time 10:00 AM UTC (15:30 Colombo, so let's pass explicit Date)
    // 2026-10-05 is a Monday
    const morning = new Date("2026-10-05T04:00:00Z"); // 09:30 AM Colombo time
    const earliest = getEarliestDeliveryDate(mockZone, morning, []);

    // Cutoff not passed -> base is today 2026-10-05 + leadDays(1) = 2026-10-06 (Tuesday)
    expect(earliest.getDate()).toBe(6);
  });

  it("skips blackout dates", () => {
    const morning = new Date("2026-10-05T04:00:00Z"); // Mon 2026-10-05 -> lead 1 = Tue 2026-10-06
    const blackoutDates = ["2026-10-06"]; // Blackout Tuesday

    const earliest = getEarliestDeliveryDate(mockZone, morning, blackoutDates);
    // Should skip 2026-10-06 and pick 2026-10-07 (Wednesday)
    expect(earliest.getDate()).toBe(7);
  });
});

describe("District Zone Resolution", () => {
  it("finds matching zone for district case-insensitively", () => {
    const zone = findZoneForDistrict([mockZone, mockFrozenOnlyZone], "colombo ");
    expect(zone?.id).toBe("zone-1");
  });

  it("returns null for unassigned district", () => {
    const zone = findZoneForDistrict([mockZone, mockFrozenOnlyZone], "Badulla");
    expect(zone).toBeNull();
  });
});
