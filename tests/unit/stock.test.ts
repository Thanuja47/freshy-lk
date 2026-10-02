// tests/unit/stock.test.ts — Unit tests for race-safe stock reservation and release logic

import { describe, it, expect, vi } from "vitest";
import { reserveStock, releaseStock } from "../../src/lib/stock";

describe("Stock Reservation Logic", () => {
  it("reserves stock successfully when stock is available", async () => {
    const mockTx = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: "p1",
          name: "Yellowfin Tuna",
          trackStock: true,
          stockGrams: 5000,
          isAvailable: true,
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const result = await reserveStock([{ productId: "p1", grams: 2000 }], mockTx as unknown as Parameters<typeof reserveStock>[1]);
    expect(result.success).toBe(true);
    expect(mockTx.product.updateMany).toHaveBeenCalledWith({
      where: {
        id: "p1",
        trackStock: true,
        isAvailable: true,
        stockGrams: { gte: 2000 },
      },
      data: {
        stockGrams: { decrement: 2000 },
      },
    });
  });

  it("fails stock reservation when stock is insufficient or race condition occurs", async () => {
    const mockTx = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: "p1",
          name: "Yellowfin Tuna",
          trackStock: true,
          stockGrams: 1000,
          isAvailable: true,
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }), // 0 updated = insufficient stock
      },
    };

    const result = await reserveStock([{ productId: "p1", grams: 2000 }], mockTx as unknown as Parameters<typeof reserveStock>[1]);
    expect(result.success).toBe(false);
    expect(result.failedProductId).toBe("p1");
    expect(result.failedProductName).toBe("Yellowfin Tuna");
    expect(result.availableGrams).toBe(1000);
  });

  it("skips reservation when trackStock is false", async () => {
    const mockTx = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: "p2",
          name: "Seer Fish",
          trackStock: false,
          stockGrams: 0,
          isAvailable: true,
        }),
        updateMany: vi.fn(),
      },
    };

    const result = await reserveStock([{ productId: "p2", grams: 3000 }], mockTx as unknown as Parameters<typeof reserveStock>[1]);
    expect(result.success).toBe(true);
    expect(mockTx.product.updateMany).not.toHaveBeenCalled();
  });

  it("releases stock back on order cancellation", async () => {
    const mockTx = {
      product: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    await releaseStock([{ productId: "p1", grams: 2000 }], mockTx as unknown as Parameters<typeof reserveStock>[1]);
    expect(mockTx.product.updateMany).toHaveBeenCalledWith({
      where: {
        id: "p1",
        trackStock: true,
      },
      data: {
        stockGrams: { increment: 2000 },
      },
    });
  });
});
