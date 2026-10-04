// src/lib/settings.ts — helpers to read application Settings from the database

import { db } from "@/lib/db";

/**
 * Reads a numeric setting from the Setting table.
 * Returns the fallback value if the key is not found or the value is not a valid number.
 */
export async function getSettingNumber(key: string, fallback: number): Promise<number> {
  try {
    const setting = await db.setting.findUnique({ where: { key } });
    if (setting && typeof setting.value === "number") {
      return setting.value;
    }
    // Prisma stores Json — value could be a JSON number literal
    if (setting && typeof setting.value === "object" && setting.value !== null) {
      const raw = (setting.value as { value?: number }).value;
      if (typeof raw === "number") return raw;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Low-stock alert threshold in grams.
 * Setting key: LOW_STOCK_THRESHOLD_GRAMS
 * Default: 2000 (2 kg)
 */
export async function getLowStockThresholdGrams(): Promise<number> {
  return getSettingNumber("LOW_STOCK_THRESHOLD_GRAMS", 2000);
}
