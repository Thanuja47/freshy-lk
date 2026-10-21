// src/actions/zones.ts — Server action for Delivery Zones management
"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const updateZoneSchema = z.object({
  id: z.string().uuid(),
  cutoffTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be in HH:MM format").optional(),
  sameDayAvailable: z.boolean().optional(),
  leadDays: z.number().int().min(0).max(14).optional(),
  maxSameDayOrders: z.number().int().positive().nullable().optional(),
  baseFeeCents: z.number().int().nonnegative().optional(),
});

const createZoneSchema = z.object({
  name: z.string().min(2, "Zone name must be at least 2 characters"),
  districts: z.array(z.string()).min(1, "At least one district is required"),
  cutoffTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be in HH:MM format").default("12:00"),
  sameDayAvailable: z.boolean().default(true),
  leadDays: z.number().int().min(0).max(14).default(1),
  maxSameDayOrders: z.number().int().positive().nullable().optional(),
  baseFeeCents: z.number().int().nonnegative().default(45000),
});

export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
export type CreateZoneInput = z.infer<typeof createZoneSchema>;

export async function getZones() {
  await requireAdmin();
  const zones = await db.deliveryZone.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return zones;
}

export async function createZoneAction(input: CreateZoneInput) {
  try {
    const admin = await requireAdmin();
    const parsed = createZoneSchema.parse(input);

    const totalZones = await db.deliveryZone.count();

    const created = await db.$transaction(async (tx) => {
      const zone = await tx.deliveryZone.create({
        data: {
          name: parsed.name,
          districts: parsed.districts,
          cutoffTime: parsed.cutoffTime,
          sameDayAvailable: parsed.sameDayAvailable,
          leadDays: parsed.leadDays,
          maxSameDayOrders: parsed.maxSameDayOrders ?? null,
          baseFeeCents: parsed.baseFeeCents,
          sortOrder: totalZones + 1,
          isActive: true,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "zone.create",
          entity: "DeliveryZone",
          entityId: zone.id,
          diff: {
            name: zone.name,
            districts: zone.districts,
            baseFeeCents: zone.baseFeeCents,
          },
        },
      });

      return zone;
    });

    revalidatePath("/admin/zones");
    revalidatePath("/api/delivery-zones");
    revalidatePath("/checkout");

    return { success: true, zone: created };
  } catch (err: unknown) {
    console.error("createZoneAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to create delivery zone",
    };
  }
}

export async function deleteZoneAction(zoneId: string) {
  try {
    const admin = await requireAdmin();

    const zone = await db.deliveryZone.findUnique({
      where: { id: zoneId },
      include: { _count: { select: { orders: true } } },
    });

    if (!zone) {
      return { success: false, message: "Zone not found" };
    }

    if (zone._count.orders > 0) {
      // Soft-delete if orders are associated
      await db.deliveryZone.update({
        where: { id: zoneId },
        data: { isActive: false },
      });
    } else {
      await db.deliveryZone.delete({
        where: { id: zoneId },
      });
    }

    await db.auditLog.create({
      data: {
        adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
        action: "zone.delete",
        entity: "DeliveryZone",
        entityId: zoneId,
        diff: { name: zone.name, ordersCount: zone._count.orders },
      },
    });

    revalidatePath("/admin/zones");
    revalidatePath("/api/delivery-zones");
    revalidatePath("/checkout");

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteZoneAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to delete delivery zone",
    };
  }
}

export async function updateZoneAction(input: UpdateZoneInput) {
  try {
    const admin = await requireAdmin();
    const parsed = updateZoneSchema.parse(input);

    const existing = await db.deliveryZone.findUnique({
      where: { id: parsed.id },
    });

    if (!existing) {
      return { success: false, message: "Delivery zone not found" };
    }

    const updated = await db.$transaction(async (tx) => {
      const zone = await tx.deliveryZone.update({
        where: { id: parsed.id },
        data: {
          cutoffTime: parsed.cutoffTime ?? existing.cutoffTime,
          sameDayAvailable: parsed.sameDayAvailable ?? existing.sameDayAvailable,
          leadDays: parsed.leadDays ?? existing.leadDays,
          maxSameDayOrders: parsed.maxSameDayOrders !== undefined ? parsed.maxSameDayOrders : existing.maxSameDayOrders,
          baseFeeCents: parsed.baseFeeCents ?? existing.baseFeeCents,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "zone.update",
          entity: "DeliveryZone",
          entityId: zone.id,
          diff: {
            before: {
              cutoffTime: existing.cutoffTime,
              sameDayAvailable: existing.sameDayAvailable,
              leadDays: existing.leadDays,
              maxSameDayOrders: existing.maxSameDayOrders,
              baseFeeCents: existing.baseFeeCents,
            },
            after: {
              cutoffTime: zone.cutoffTime,
              sameDayAvailable: zone.sameDayAvailable,
              leadDays: zone.leadDays,
              maxSameDayOrders: zone.maxSameDayOrders,
              baseFeeCents: zone.baseFeeCents,
            },
          },
        },
      });

      return zone;
    });

    revalidatePath("/admin/zones");
    revalidatePath("/api/delivery-zones");
    revalidatePath("/checkout");

    return { success: true, zone: updated };
  } catch (err: unknown) {
    console.error("updateZoneAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update zone",
    };
  }
}
