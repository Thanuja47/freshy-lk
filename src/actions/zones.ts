// src/actions/zones.ts — Server action for Delivery Zones management
"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const updateZoneSchema = z.object({
  id: z.string().uuid(),
  cutoffTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be in HH:MM format").optional(),
  sameDayAvailable: z.boolean().optional(),
  leadDays: z.number().int().min(0).max(14).optional(),
  maxSameDayOrders: z.number().int().positive().nullable().optional(),
  baseFeeCents: z.number().int().nonnegative().optional(),
});

export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;

export async function getZones() {
  await requireAdmin();
  const zones = await db.deliveryZone.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return zones;
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

    return { success: true, zone: updated };
  } catch (err: unknown) {
    console.error("updateZoneAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update zone",
    };
  }
}
