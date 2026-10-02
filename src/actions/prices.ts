// src/actions/prices.ts — Server action for Today's Prices & Stock management

"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidateCatalogueCache } from "@/lib/cache";

const updatePriceInputSchema = z.object({
  productId: z.string().uuid(),
  pricePerKgCents: z.number().int().nonnegative(),
  stockGrams: z.number().int().nonnegative().optional(),
  isAvailable: z.boolean(),
  confirmBigChange: z.boolean().optional(),
});

export type UpdatePriceInput = z.infer<typeof updatePriceInputSchema>;

export type UpdatePriceResult =
  | {
      status: "SUCCESS";
      productId: string;
      oldPricePerKgCents: number;
      newPricePerKgCents: number;
      updatedAt: string;
    }
  | {
      status: "CONFIRM_REQUIRED";
      productId: string;
      oldPricePerKgCents: number;
      newPricePerKgCents: number;
      message: string;
    }
  | {
      status: "ERROR";
      message: string;
    };

export async function updateProductPriceAndStock(
  input: UpdatePriceInput
): Promise<UpdatePriceResult> {
  try {
    const admin = await requireAdmin();
    const parsed = updatePriceInputSchema.parse(input);

    const product = await db.product.findUnique({
      where: { id: parsed.productId },
      select: { id: true, name: true, pricePerKgCents: true, stockGrams: true, isAvailable: true },
    });

    if (!product) {
      return { status: "ERROR", message: "Product not found." };
    }

    const oldPrice = product.pricePerKgCents;
    const newPrice = parsed.pricePerKgCents;

    // Safety check: > 30% price change warning confirmation
    if (oldPrice > 0 && !parsed.confirmBigChange) {
      const pctChange = Math.abs(newPrice - oldPrice) / oldPrice;
      if (pctChange > 0.3) {
        const oldRupees = (oldPrice / 100).toLocaleString("en-LK");
        const newRupees = (newPrice / 100).toLocaleString("en-LK");
        return {
          status: "CONFIRM_REQUIRED",
          productId: product.id,
          oldPricePerKgCents: oldPrice,
          newPricePerKgCents: newPrice,
          message: `Price change for ${product.name} is over 30% (Rs. ${oldRupees} → Rs. ${newRupees}). Are you sure?`,
        };
      }
    }

    // Execute update in single transaction
    const updatedProduct = await db.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: product.id },
        data: {
          pricePerKgCents: newPrice,
          stockGrams: parsed.stockGrams !== undefined ? parsed.stockGrams : product.stockGrams,
          isAvailable: parsed.isAvailable,
          priceUpdatedAt: new Date(),
          priceVersion: { increment: 1 },
        },
      });

      // Write PriceHistory if price changed
      if (oldPrice !== newPrice) {
        await tx.priceHistory.create({
          data: {
            productId: product.id,
            oldPricePerKgCents: oldPrice,
            newPricePerKgCents: newPrice,
            changedById: admin.id !== "demo-owner-id" ? admin.id : undefined,
          },
        });
      }

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "price.update",
          entity: "Product",
          entityId: product.id,
          diff: {
            oldPricePerKgCents: oldPrice,
            newPricePerKgCents: newPrice,
            isAvailable: parsed.isAvailable,
            stockGrams: parsed.stockGrams,
          },
        },
      });

      return updated;
    });

    // Instant storefront cache revalidation
    revalidateCatalogueCache();

    return {
      status: "SUCCESS",
      productId: updatedProduct.id,
      oldPricePerKgCents: oldPrice,
      newPricePerKgCents: updatedProduct.pricePerKgCents,
      updatedAt: updatedProduct.priceUpdatedAt.toISOString(),
    };
  } catch (err: unknown) {
    console.error("updateProductPriceAndStock error:", err);
    return {
      status: "ERROR",
      message: err instanceof Error ? err.message : "Failed to update price.",
    };
  }
}

export async function bulkUpdateAvailability(
  action: "MARK_ALL_SOLD_OUT" | "OPEN_ALL_AVAILABLE"
): Promise<{ success: boolean; message: string }> {
  try {
    const admin = await requireAdmin();
    const isAvailable = action === "OPEN_ALL_AVAILABLE";

    await db.$transaction(async (tx) => {
      await tx.product.updateMany({
        data: {
          isAvailable,
          priceUpdatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "price.bulk_availability",
          entity: "Product",
          diff: { action, isAvailable },
        },
      });
    });

    revalidateCatalogueCache();
    return { success: true, message: `All products marked ${isAvailable ? "available" : "sold out"}.` };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Bulk action failed.",
    };
  }
}
