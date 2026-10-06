// src/lib/delivery.ts — delivery fee, zone lookup, cold-chain storage validation, and delivery date/cutoff logic

import type { StorageType } from "@prisma/client";

export interface DeliveryZoneLike {
  id: string;
  name: string;
  districts: string[];
  baseFeeCents: number;
  perKgFeeCents: number;
  freeOverCents: number | null;
  minOrderCents: number;
  leadDays: number;
  cutoffTime: string; // "12:00" (Asia/Colombo)
  sameDayAvailable?: boolean;
  maxSameDayOrders?: number | null;
  currentSameDayOrders?: number;
  deliveryWeekdays: number[]; // e.g. [1, 2, 3, 4, 5, 6]
  allowedStorage: StorageType[]; // e.g. ["FRESH", "FROZEN", "AMBIENT"]
  freshnessLabel?: string | null;
  etaMinDays: number;
  etaMaxDays: number;
  isActive: boolean;
}

/**
 * Calculates delivery fee in integer cents.
 * If subtotal exceeds freeOverCents, delivery fee is 0.
 * Otherwise fee = baseFeeCents + perKgFeeCents * ceil(weight in kg).
 */
export function calculateDeliveryFee(
  zone: DeliveryZoneLike,
  totalWeightGrams: number,
  subtotalCents: number
): number {
  if (zone.freeOverCents !== null && zone.freeOverCents !== undefined && subtotalCents >= zone.freeOverCents) {
    return 0;
  }

  const totalKg = Math.ceil(totalWeightGrams / 1000);
  const weightFeeCents = zone.perKgFeeCents * totalKg;
  return zone.baseFeeCents + weightFeeCents;
}

/**
 * Validates whether all cart storage types are supported by the zone cold-chain rules.
 */
export function validateStorageCompatibility(
  zone: DeliveryZoneLike,
  cartStorageTypes: StorageType[]
): { isValid: boolean; invalidStorageTypes: StorageType[] } {
  const allowedSet = new Set(zone.allowedStorage);
  const invalid = Array.from(new Set(cartStorageTypes.filter((st) => !allowedSet.has(st))));
  return {
    isValid: invalid.length === 0,
    invalidStorageTypes: invalid,
  };
}

/**
 * Helper to get current HH:mm in Asia/Colombo timezone.
 */
export function getColomboTimeString(date: Date): { hours: number; minutes: number } {
  const colomboStr = date.toLocaleString("en-US", { timeZone: "Asia/Colombo", hour12: false });
  const timePart = colomboStr.split(", ")[1] || colomboStr.split(" ")[1];
  if (!timePart) {
    // Fallback if locale parsing yields non-standard string
    return { hours: date.getUTCHours() + 5, minutes: date.getUTCMinutes() + 30 };
  }
  const [h, m] = timePart.split(":").map(Number);
  return { hours: h, minutes: m };
}

/**
 * Helper to get YYYY-MM-DD string in Asia/Colombo time for blackout checks.
 */
export function formatDateYYYYMMDD(date: Date): string {
  const colomboStr = date.toLocaleString("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = colomboStr.split(",")[0].split("/");
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return date.toISOString().split("T")[0];
}

/**
 * Calculates the earliest valid delivery date for a zone based on cutoff time, lead days,
 * delivery weekdays, capacity caps, and blackout dates.
 */
export function getEarliestDeliveryDate(
  zone: DeliveryZoneLike,
  now: Date = new Date(),
  blackoutDates: string[] = []
): Date {
  const blackoutSet = new Set(blackoutDates);

  // Parse cutoffTime "HH:mm"
  const [cutoffHours, cutoffMinutes] = (zone.cutoffTime || "12:00").split(":").map(Number);
  const colomboNow = getColomboTimeString(now);

  const pastCutoff =
    colomboNow.hours > cutoffHours ||
    (colomboNow.hours === cutoffHours && colomboNow.minutes >= cutoffMinutes);

  // Check if same-day delivery is currently active for this zone
  const isCapReached =
    zone.maxSameDayOrders !== null &&
    zone.maxSameDayOrders !== undefined &&
    (zone.currentSameDayOrders ?? 0) >= zone.maxSameDayOrders;

  const supportsSameDay =
    zone.sameDayAvailable !== false && zone.leadDays === 0 && !isCapReached;

  const candidate = new Date(now.getTime());

  if (supportsSameDay) {
    // If before cutoff -> base is today. If after cutoff -> base is tomorrow
    if (pastCutoff) {
      candidate.setDate(candidate.getDate() + 1);
    }
  } else {
    // Standard lead days logic: if past cutoff, add 1 extra day to base
    if (pastCutoff) {
      candidate.setDate(candidate.getDate() + 1);
    }
    candidate.setDate(candidate.getDate() + Math.max(1, zone.leadDays));
  }

  // Advance candidate date until it hits an allowed delivery weekday and not a blackout
  let loopGuard = 0;
  while (loopGuard < 60) {
    const weekday = candidate.getDay(); // 0=Sun ... 6=Sat
    const ymd = formatDateYYYYMMDD(candidate);

    const isWeekdayAllowed = zone.deliveryWeekdays.includes(weekday);
    const isBlackout = blackoutSet.has(ymd);

    if (isWeekdayAllowed && !isBlackout) {
      return candidate;
    }

    candidate.setDate(candidate.getDate() + 1);
    loopGuard++;
  }

  return candidate;
}

/**
 * Live Cutoff Countdown helper (returns formatted text when remaining time is < 2 hours).
 */
export function getCutoffCountdown(
  cutoffTime: string = "12:00",
  now: Date = new Date()
): {
  isBeforeCutoff: boolean;
  hours: number;
  minutes: number;
  totalMinutes: number;
  formattedText: string | null;
} {
  const [cutoffH, cutoffM] = cutoffTime.split(":").map(Number);
  const colomboNow = getColomboTimeString(now);

  const nowMinutes = colomboNow.hours * 60 + colomboNow.minutes;
  const cutoffMinutes = cutoffH * 60 + cutoffM;
  const diff = cutoffMinutes - nowMinutes;

  if (diff <= 0) {
    return { isBeforeCutoff: false, hours: 0, minutes: 0, totalMinutes: 0, formattedText: null };
  }

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  const formattedText =
    diff < 120
      ? `Order within ${hours > 0 ? `${hours}h ` : ""}${minutes}m for same-day delivery`
      : null;

  return { isBeforeCutoff: true, hours, minutes, totalMinutes: diff, formattedText };
}

/**
 * Dynamic wording generator for delivery cut-off banners based on zone rules.
 */
export function getDeliveryCutoffMessage(
  zone: DeliveryZoneLike | null,
  earliestDate?: Date
): {
  headline: string;
  subtext: string;
  isSameDayEligible: boolean;
} {
  if (!zone) {
    return {
      headline: "Same-day delivery in selected areas",
      subtext: "Next day or later elsewhere",
      isSameDayEligible: false,
    };
  }

  const isSameDay =
    zone.sameDayAvailable !== false &&
    zone.leadDays === 0 &&
    (!zone.maxSameDayOrders || (zone.currentSameDayOrders ?? 0) < zone.maxSameDayOrders);

  if (isSameDay) {
    return {
      headline: "Order before 12 PM, delivered same day",
      subtext: "Order after 12 PM, delivered next day",
      isSameDayEligible: true,
    };
  }

  const dateStr = earliestDate
    ? earliestDate.toLocaleDateString("en-US", {
        timeZone: "Asia/Colombo",
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "next available delivery day";

  return {
    headline: `Order before 12 PM, delivered by ${dateStr}`,
    subtext: `Express courier delivery to ${zone.name}`,
    isSameDayEligible: false,
  };
}

/**
 * Returns an array of available selectable delivery dates (default 14 days).
 */
export function getAvailableDeliveryDates(
  zone: DeliveryZoneLike,
  count: number = 14,
  now: Date = new Date(),
  blackoutDates: string[] = []
): Date[] {
  const dates: Date[] = [];
  const blackoutSet = new Set(blackoutDates);

  let current = getEarliestDeliveryDate(zone, now, blackoutDates);
  let loopGuard = 0;

  while (dates.length < count && loopGuard < 90) {
    const weekday = current.getDay();
    const ymd = formatDateYYYYMMDD(current);

    if (zone.deliveryWeekdays.includes(weekday) && !blackoutSet.has(ymd)) {
      dates.push(new Date(current.getTime()));
    }

    current = new Date(current.getTime());
    current.setDate(current.getDate() + 1);
    loopGuard++;
  }

  return dates;
}

/**
 * Finds the zone matching a district from an array of zones.
 */
export function findZoneForDistrict(
  zones: DeliveryZoneLike[],
  district: string
): DeliveryZoneLike | null {
  const normDistrict = district.trim().toLowerCase();
  return (
    zones.find(
      (z) => z.isActive && z.districts.some((d) => d.trim().toLowerCase() === normDistrict)
    ) ?? null
  );
}
