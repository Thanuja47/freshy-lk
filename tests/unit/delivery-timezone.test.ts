import { describe, it, expect } from "vitest";
import {
  getEarliestDeliveryDate,
  formatDateYYYYMMDD,
  getColomboTimeString,
} from "../../src/lib/delivery";

describe("Delivery Cut-Off & Timezone (Asia/Colombo)", () => {
  const metroZone = {
    id: "zone-metro",
    name: "Colombo Metro Express",
    districts: ["Colombo"],
    cutoffTime: "12:00",
    sameDayAvailable: true,
    leadDays: 0,
    maxSameDayOrders: null,
    currentSameDayOrders: 0,
    deliveryWeekdays: [1, 2, 3, 4, 5, 6], // Mon-Sat (Sunday closed)
    baseFeeCents: 35000,
    perKgFeeCents: 0,
    freeOverCents: null,
    minOrderCents: 0,
    allowedStorage: ["FRESH" as const],
    etaMinDays: 0,
    etaMaxDays: 1,
    isActive: true,
  };

  const outstationZone = {
    ...metroZone,
    id: "zone-outstation",
    name: "Outstation",
    sameDayAvailable: false,
    leadDays: 1,
    deliveryWeekdays: [1, 2, 3, 4, 5, 6],
  };

  it("11:59 AM Asia/Colombo (before cut-off) on Friday Oct 16 -> yields SAME DAY (Oct 16) for metro", () => {
    // 11:59:00 Asia/Colombo on 2026-10-16 = 06:29:00 UTC
    const beforeCutoff = new Date("2026-10-16T06:29:00.000Z");
    const colomboTime = getColomboTimeString(beforeCutoff);
    expect(colomboTime).toEqual({ hours: 11, minutes: 59 });

    const earliest = getEarliestDeliveryDate(metroZone, beforeCutoff);
    expect(formatDateYYYYMMDD(earliest)).toBe("2026-10-16");
  });

  it("12:01 PM Asia/Colombo (after cut-off) on Friday Oct 16 -> yields NEXT DAY (Oct 17) for metro", () => {
    // 12:01:00 Asia/Colombo on 2026-10-16 = 06:31:00 UTC
    const afterCutoff = new Date("2026-10-16T06:31:00.000Z");
    const colomboTime = getColomboTimeString(afterCutoff);
    expect(colomboTime).toEqual({ hours: 12, minutes: 1 });

    const earliest = getEarliestDeliveryDate(metroZone, afterCutoff);
    expect(formatDateYYYYMMDD(earliest)).toBe("2026-10-17");
  });

  it("14:28 Asia/Colombo (the exact time FRS-261016-0001 was placed) -> yields Oct 17 for metro", () => {
    // 14:28:58 Asia/Colombo on 2026-10-16 = 08:58:58 UTC
    const placedTime = new Date("2026-10-16T08:58:58.344Z");
    const earliest = getEarliestDeliveryDate(metroZone, placedTime);
    expect(formatDateYYYYMMDD(earliest)).toBe("2026-10-17");
  });

  it("handles midnight UTC boundaries properly (23:59 UTC = 05:29 next morning in Colombo)", () => {
    // 2026-10-15T23:59:00Z = 2026-10-16T05:29:00 in Colombo (Friday morning before 12:00 cutoff)
    const midnightUtc = new Date("2026-10-15T23:59:00.000Z");
    const colomboTime = getColomboTimeString(midnightUtc);
    expect(colomboTime.hours).toBe(5);
    expect(colomboTime.minutes).toBe(29);

    const earliest = getEarliestDeliveryDate(metroZone, midnightUtc);
    expect(formatDateYYYYMMDD(earliest)).toBe("2026-10-16");
  });

  it("skips Sunday when deliveryWeekdays does not include 0", () => {
    // Saturday Oct 17 after cut-off (14:00 Colombo) -> Sunday Oct 18 is closed -> next day is Monday Oct 19
    const satAfternoon = new Date("2026-10-17T08:30:00.000Z"); // 14:00 Colombo
    const earliest = getEarliestDeliveryDate(metroZone, satAfternoon);
    expect(formatDateYYYYMMDD(earliest)).toBe("2026-10-19");
  });

  it("for outstation zone with leadDays: 1, after cutoff on Friday Oct 16 -> Sunday closed -> Monday Oct 19", () => {
    const friAfternoon = new Date("2026-10-16T08:58:00.000Z"); // 14:28 Colombo
    const earliest = getEarliestDeliveryDate(outstationZone, friAfternoon);
    // Friday + pastCutoff (1) + leadDays (1) = Sunday -> Sunday is closed -> Monday Oct 19
    expect(formatDateYYYYMMDD(earliest)).toBe("2026-10-19");
  });
});
