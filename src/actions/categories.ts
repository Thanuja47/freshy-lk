// src/actions/categories.ts — Server actions for Category management

"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidateCatalogueCache } from "@/lib/cache";
import { revalidatePath } from "next/cache";

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export async function saveCategory(input: CategoryInput) {
  try {
    const admin = await requireAdmin();
    const parsed = categorySchema.parse(input);

    let saved;
    if (parsed.id) {
      saved = await db.category.update({
        where: { id: parsed.id },
        data: {
          name: parsed.name,
          slug: parsed.slug,
          description: parsed.description || null,
          sortOrder: parsed.sortOrder,
          isActive: parsed.isActive,
        },
      });

      await db.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "category.update",
          entity: "Category",
          entityId: saved.id,
          diff: { name: saved.name, slug: saved.slug },
        },
      });
    } else {
      saved = await db.category.create({
        data: {
          name: parsed.name,
          slug: parsed.slug,
          description: parsed.description || null,
          sortOrder: parsed.sortOrder,
          isActive: parsed.isActive,
        },
      });

      await db.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "category.create",
          entity: "Category",
          entityId: saved.id,
          diff: { name: saved.name, slug: saved.slug },
        },
      });
    }

    revalidateCatalogueCache();
    revalidatePath("/admin/categories");
    revalidatePath("/shop");
    revalidatePath("/");

    return { success: true, category: saved };
  } catch (err: unknown) {
    console.error("saveCategory error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to save category.",
    };
  }
}

export async function deleteCategory(id: string) {
  try {
    const admin = await requireAdmin();

    const productCount = await db.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return {
        success: false,
        message: `Cannot delete category: ${productCount} product(s) are still assigned to it.`,
      };
    }

    await db.category.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
        action: "category.delete",
        entity: "Category",
        entityId: id,
      },
    });

    revalidateCatalogueCache();
    revalidatePath("/admin/categories");
    revalidatePath("/shop");
    revalidatePath("/");

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteCategory error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to delete category.",
    };
  }
}
