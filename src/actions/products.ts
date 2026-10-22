// src/actions/products.ts — Server actions for Product and Category CRUD

"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidateCatalogueCache } from "@/lib/cache";
import { revalidatePath } from "next/cache";
import type { StorageType } from "@prisma/client";

const productSchema = z.object({
  name: z.string().min(2, "Name required"),
  localName: z.string().optional(),
  categoryId: z.string().uuid("Category required"),
  storageType: z.enum(["FRESH", "FROZEN", "AMBIENT"]).default("FRESH"),
  pricePerKgCents: z.number().int().nonnegative(),
  trackStock: z.boolean().default(false),
  stockGrams: z.number().int().nonnegative().default(0),
  isAvailable: z.boolean().default(true),
  isActive: z.boolean().default(true),
  shortDesc: z.string().optional(),
  description: z.string().optional(),
  tips: z.string().optional(),
  catchType: z.string().optional(),
  origin: z.string().optional(),
  offerPercent: z.number().int().min(1).max(50).nullable().optional(),
  packs: z.array(
    z.object({
      weightGrams: z.number().int().positive(),
      label: z.string().min(1),
    })
  ).default([]),
});

export type ProductFormInput = z.infer<typeof productSchema>;

export const updateProductSchema = productSchema.extend({
  id: z.string().uuid("Product ID required"),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export async function createProduct(input: ProductFormInput) {
  try {
    const admin = await requireAdmin();
    const parsed = productSchema.parse(input);

    const slug = parsed.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const newProduct = await db.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name: parsed.name,
          localName: parsed.localName || null,
          slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
          categoryId: parsed.categoryId,
          storageType: parsed.storageType as StorageType,
          pricePerKgCents: parsed.pricePerKgCents,
          offerPercent: parsed.offerPercent ?? null,
          trackStock: parsed.trackStock,
          stockGrams: parsed.stockGrams,
          isAvailable: parsed.isAvailable,
          isActive: parsed.isActive,
          shortDesc: parsed.shortDesc || null,
          description: parsed.description || null,
          tips: parsed.tips || null,
          catchType: parsed.catchType || null,
          origin: parsed.origin || null,
          packs: {
            create: parsed.packs.length > 0 ? parsed.packs : [
              { weightGrams: 500, label: "500 g" },
              { weightGrams: 1000, label: "1 kg" },
              { weightGrams: 2000, label: "2 kg" },
            ],
          },
        },
      });

      try {
        await tx.auditLog.create({
          data: {
            adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
            action: "product.create",
            entity: "Product",
            entityId: p.id,
            diff: { name: p.name, categoryId: p.categoryId },
          },
        });
      } catch (logErr) {
        console.warn("Audit log creation warning:", logErr);
      }

      return p;
    });

    try {
      await revalidateCatalogueCache();
    } catch {
      // non-fatal
    }
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/fish");
    revalidatePath("/seafood");
    revalidatePath("/offers");
    revalidatePath("/");
    return { success: true, productId: newProduct.id };
  } catch (err: unknown) {
    console.error("createProduct error:", err);
    return { success: false, message: err instanceof Error ? err.message : "Failed to create product." };
  }
}

export async function updateProduct(input: UpdateProductInput) {
  try {
    const admin = await requireAdmin();
    const parsed = updateProductSchema.parse(input);

    const updated = await db.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: parsed.id },
        data: {
          name: parsed.name,
          localName: parsed.localName || null,
          categoryId: parsed.categoryId,
          storageType: parsed.storageType as StorageType,
          pricePerKgCents: parsed.pricePerKgCents,
          offerPercent: parsed.offerPercent !== undefined ? parsed.offerPercent : null,
          trackStock: parsed.trackStock,
          stockGrams: parsed.stockGrams,
          isAvailable: parsed.isAvailable,
          isActive: parsed.isActive,
          shortDesc: parsed.shortDesc || null,
          description: parsed.description || null,
          tips: parsed.tips || null,
          catchType: parsed.catchType || null,
          origin: parsed.origin || null,
        },
      });

      if (parsed.packs && parsed.packs.length > 0) {
        await tx.productPack.deleteMany({
          where: { productId: parsed.id },
        });
        await tx.productPack.createMany({
          data: parsed.packs.map((pack, idx) => ({
            productId: parsed.id,
            weightGrams: pack.weightGrams,
            label: pack.label,
            sortOrder: idx,
            isActive: true,
          })),
        });
      }

      try {
        await tx.auditLog.create({
          data: {
            adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
            action: "product.update",
            entity: "Product",
            entityId: p.id,
            diff: { name: p.name, pricePerKgCents: p.pricePerKgCents, stockGrams: p.stockGrams },
          },
        });
      } catch (logErr) {
        console.warn("Audit log update warning:", logErr);
      }

      return p;
    });

    try {
      await revalidateCatalogueCache();
    } catch {
      // non-fatal
    }
    revalidatePath("/admin/products");
    revalidatePath("/admin/prices");
    revalidatePath("/shop");
    revalidatePath("/fish");
    revalidatePath("/seafood");
    revalidatePath("/offers");
    revalidatePath("/");

    return { success: true, productId: updated.id };
  } catch (err: unknown) {
    console.error("updateProduct error:", err);
    return { success: false, message: err instanceof Error ? err.message : "Failed to update product." };
  }
}

export async function duplicateProduct(productId: string) {
  try {
    const admin = await requireAdmin();
    const original = await db.product.findUnique({
      where: { id: productId },
      include: { packs: true, tiers: true, preps: true },
    });

    if (!original) {
      return { success: false, message: "Original product not found." };
    }

    const newName = `${original.name} (Copy)`;
    const slug = `${original.slug}-copy-${Math.random().toString(36).slice(2, 6)}`;

    const duplicated = await db.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name: newName,
          localName: original.localName,
          slug,
          categoryId: original.categoryId,
          storageType: original.storageType,
          pricePerKgCents: original.pricePerKgCents,
          trackStock: original.trackStock,
          stockGrams: original.stockGrams,
          isAvailable: original.isAvailable,
          isActive: original.isActive,
          shortDesc: original.shortDesc,
          description: original.description,
          tips: original.tips,
          catchType: original.catchType,
          origin: original.origin,
          packs: {
            create: original.packs.map((pack) => ({
              weightGrams: pack.weightGrams,
              label: pack.label,
            })),
          },
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "product.duplicate",
          entity: "Product",
          entityId: p.id,
          diff: { originalId: productId, newId: p.id },
        },
      });

      return p;
    });

    try {
      await revalidateCatalogueCache();
    } catch {
      // non-fatal
    }
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/fish");
    revalidatePath("/seafood");
    revalidatePath("/offers");
    revalidatePath("/");
    return { success: true, productId: duplicated.id };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : "Failed to duplicate product." };
  }
}

export async function deleteProduct(productId: string) {
  try {
    const admin = await requireAdmin();

    await db.$transaction(async (tx) => {
      // Soft-delete by setting isActive to false
      await tx.product.update({
        where: { id: productId },
        data: { isActive: false, isAvailable: false },
      });

      await tx.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "product.delete",
          entity: "Product",
          entityId: productId,
        },
      });
    });

    try {
      await revalidateCatalogueCache();
    } catch {
      // non-fatal
    }
    revalidatePath("/admin/products");
    revalidatePath("/admin/prices");
    revalidatePath("/shop");
    revalidatePath("/fish");
    revalidatePath("/seafood");
    revalidatePath("/offers");
    revalidatePath("/");

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteProduct error:", err);
    return { success: false, message: err instanceof Error ? err.message : "Failed to delete product." };
  }
}
