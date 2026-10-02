// src/lib/delivery.ts — delivery fee, zone lookup, cold-chain storage validation, and delivery date logic

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
  cutoffTime: string; // "15:00" (Asia/Colombo)
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
function getColomboTimeString(date: Date): { hours: number; minutes: number } {
  // Format to Asia/Colombo time string
  const colomboStr = date.toLocaleString("en-US", { timeZone: "Asia/Colombo", hour12: false });
  const timePart = colomboStr.split(", ")[1] || colomboStr.split(" ")[1];
  if (!timePart) {
    return { hours: date.getUTCHours() + 5, minutes: date.getUTCMinutes() + 30 }; // Fallback approx
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
  // format MM/DD/YYYY to YYYY-MM-DD
  const parts = colomboStr.split(",")[0].split("/");
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return date.toISOString().split("T")[0];
}

/**
 * Calculates the earliest valid delivery date for a zone based on cutoff time, lead days,
 * delivery weekdays, and blackout dates.
 */
export function getEarliestDeliveryDate(
  zone: DeliveryZoneLike,
  now: Date = new Date(),
  blackoutDates: string[] = []
): Date {
  const blackoutSet = new Set(blackoutDates);

  // Parse cutoffTime "HH:mm"
  const [cutoffHours, cutoffMinutes] = zone.cutoffTime.split(":").map(Number);
  const colomboNow = getColomboTimeString(now);

  const pastCutoff =
    colomboNow.hours > cutoffHours ||
    (colomboNow.hours === cutoffHours && colomboNow.minutes >= cutoffMinutes);

  // Start checking from today (or tomorrow if past cutoff)
  const candidate = new Date(now.getTime());
  if (pastCutoff) {
    candidate.setDate(candidate.getDate() + 1);
  }

  // Add lead days
  candidate.setDate(candidate.getDate() + zone.leadDays);

  // Advance until date matches allowed delivery weekdays and is not a blackout date
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
