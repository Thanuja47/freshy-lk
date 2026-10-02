// src/lib/stock.ts — race-safe transactional stock reservation and release helpers

import type { PrismaClient } from "@prisma/client";

export interface StockReservationItem {
  productId: string;
  grams: number;
}

export interface StockReservationResult {
  success: boolean;
  failedProductId?: string;
  failedProductName?: string;
  availableGrams?: number;
}

type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Atomically reserves stock for a list of items within a Prisma transaction.
 * Uses atomic SQL `stockGrams = stockGrams - requestedGrams WHERE stockGrams >= requestedGrams`.
 * If any product fails stock check, rolls back transaction by throwing an error or returning failure.
 */
export async function reserveStock(
  items: StockReservationItem[],
  tx: PrismaTransaction
): Promise<StockReservationResult> {
  for (const item of items) {
    if (item.grams <= 0) continue;

    // Check if product tracks stock and is available
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      select: { id: true, name: true, trackStock: true, stockGrams: true, isAvailable: true },
    });

    if (!product) {
      return {
        success: false,
        failedProductId: item.productId,
        failedProductName: "Unknown product",
        availableGrams: 0,
      };
    }

    if (!product.isAvailable) {
      return {
        success: false,
        failedProductId: product.id,
        failedProductName: product.name,
        availableGrams: 0,
      };
    }

    if (!product.trackStock) {
      // Stock tracking disabled for this item, no reservation needed
      continue;
    }

    // Atomic update
    const result = await tx.product.updateMany({
      where: {
        id: item.productId,
        trackStock: true,
        isAvailable: true,
        stockGrams: { gte: item.grams },
      },
      data: {
        stockGrams: { decrement: item.grams },
      },
    });

    if (result.count === 0) {
      return {
        success: false,
        failedProductId: product.id,
        failedProductName: product.name,
        availableGrams: product.stockGrams,
      };
    }
  }

  return { success: true };
}

/**
 * Releases stock back to products on order cancellation or expiration.
 */
export async function releaseStock(
  items: StockReservationItem[],
  tx: PrismaTransaction
): Promise<void> {
  for (const item of items) {
    if (item.grams <= 0) continue;

    await tx.product.updateMany({
      where: {
        id: item.productId,
        trackStock: true,
      },
      data: {
        stockGrams: { increment: item.grams },
      },
    });
  }
}
