// tests/unit/settings.test.ts — Unit tests for setting helpers

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSettingNumber, getLowStockThresholdGrams } from "../../src/lib/settings";
import { db } from "../../src/lib/db";

vi.mock("../../src/lib/db", () => ({
  db: {
    setting: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Settings Helper", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns stored numeric setting from DB when found", async () => {
    vi.mocked(db.setting.findUnique).mockResolvedValue({
      key: "LOW_STOCK_THRESHOLD_GRAMS",
      value: 1500,
      updatedAt: new Date(),
    });

    const val = await getLowStockThresholdGrams();
    expect(val).toBe(1500);
  });

  it("returns fallback value when key is missing or DB throws", async () => {
    vi.mocked(db.setting.findUnique).mockRejectedValue(new Error("DB Connection Error"));

    const val = await getLowStockThresholdGrams();
    expect(val).toBe(2000); // Default 2000g = 2 kg
  });

  it("extracts numeric value from Json object setting", async () => {
    vi.mocked(db.setting.findUnique).mockResolvedValue({
      key: "CUSTOM_SETTING",
      value: { value: 3500 },
      updatedAt: new Date(),
    });

    const val = await getSettingNumber("CUSTOM_SETTING", 1000);
    expect(val).toBe(3500);
  });
});
