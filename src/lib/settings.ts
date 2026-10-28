// src/lib/settings.ts — helpers to read application Settings from the database

import { db } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache";
import { unstable_cache } from "next/cache";

export interface SiteSettings {
  companyName?: string;
  supportPhone?: string;
  supportWhatsapp?: string;
  supportEmail?: string;
  operatingAddress?: string;
  hubDescription?: string;
  supportHours?: string;
  responseTimeText?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  invoicePrefix?: string;
  vatNumber?: string;
  invoiceFooter?: string;
  [key: string]: string | undefined;
}

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

async function fetchSiteSettingsFromDb(): Promise<SiteSettings> {
  try {
    const rows = await db.setting.findMany();
    const settings: SiteSettings = {};
    for (const r of rows) {
      if (r.value != null && r.value !== "") {
        const val = typeof r.value === "string" ? r.value.trim() : String(r.value).trim();
        if (val) {
          settings[r.key] = val;
        }
      }
    }
    return settings;
  } catch (err) {
    console.warn("Could not read DB settings:", err);
    return {};
  }
}

/**
 * Returns all configured site settings from DB.
 * Uses tag-based revalidation (tag: 'settings') with a 60-second fallback.
 * Strictly returns NO invented data — values not in DB are undefined.
 */
export const getSiteSettings = unstable_cache(
  fetchSiteSettingsFromDb,
  ["site-settings"],
  { tags: [CACHE_TAGS.SETTINGS], revalidate: 60 }
);
