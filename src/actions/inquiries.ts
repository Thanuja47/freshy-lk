// src/actions/inquiries.ts — Server actions for managing Contact Inquiries in the Admin Panel
"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma, EnquiryStatus } from "@prisma/client";

export interface InquiryFilterOptions {
  status?: EnquiryStatus | "ALL";
  search?: string;
}

export async function getInquiries(filters: InquiryFilterOptions = {}) {
  await requireAdmin();

  const whereClause: Prisma.ContactInquiryWhereInput = {};

  if (filters.status && filters.status !== "ALL") {
    whereClause.status = filters.status;
  }

  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.trim();
    whereClause.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
      { adminNote: { contains: q, mode: "insensitive" } },
    ];
  }

  const [inquiries, counts] = await Promise.all([
    db.contactInquiry.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.contactInquiry.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const stats = {
    total: 0,
    newCount: 0,
    contactedCount: 0,
    quotedCount: 0,
    wonCount: 0,
    lostCount: 0,
  };

  for (const c of counts) {
    stats.total += c._count._all;
    if (c.status === "NEW") stats.newCount = c._count._all;
    else if (c.status === "CONTACTED") stats.contactedCount = c._count._all;
    else if (c.status === "QUOTED") stats.quotedCount = c._count._all;
    else if (c.status === "WON") stats.wonCount = c._count._all;
    else if (c.status === "LOST") stats.lostCount = c._count._all;
  }

  return {
    inquiries,
    stats,
  };
}

const statusUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(EnquiryStatus),
});

export async function updateInquiryStatus(id: string, status: EnquiryStatus) {
  try {
    const admin = await requireAdmin();
    const validated = statusUpdateSchema.parse({ id, status });

    const updated = await db.contactInquiry.update({
      where: { id: validated.id },
      data: { status: validated.status },
    });

    try {
      await db.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "inquiry.status_update",
          entity: "ContactInquiry",
          entityId: updated.id,
          diff: { status: updated.status },
        },
      });
    } catch {
      // Non-fatal audit log
    }

    revalidatePath("/admin/messages");
    return { success: true, inquiry: updated };
  } catch (err: unknown) {
    console.error("updateInquiryStatus error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update inquiry status.",
    };
  }
}

const noteUpdateSchema = z.object({
  id: z.string().uuid(),
  adminNote: z.string(),
});

export async function updateInquiryNote(id: string, adminNote: string) {
  try {
    const admin = await requireAdmin();
    const validated = noteUpdateSchema.parse({ id, adminNote });

    const updated = await db.contactInquiry.update({
      where: { id: validated.id },
      data: { adminNote: validated.adminNote.trim() || null },
    });

    try {
      await db.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "inquiry.note_update",
          entity: "ContactInquiry",
          entityId: updated.id,
          diff: { adminNote: updated.adminNote },
        },
      });
    } catch {
      // Non-fatal
    }

    revalidatePath("/admin/messages");
    return { success: true, inquiry: updated };
  } catch (err: unknown) {
    console.error("updateInquiryNote error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update admin note.",
    };
  }
}

export async function deleteInquiry(id: string) {
  try {
    const admin = await requireAdmin();

    const deleted = await db.contactInquiry.delete({
      where: { id },
    });

    try {
      await db.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "inquiry.delete",
          entity: "ContactInquiry",
          entityId: id,
          diff: { name: deleted.name, phone: deleted.phone },
        },
      });
    } catch {
      // Non-fatal
    }

    revalidatePath("/admin/messages");
    return { success: true };
  } catch (err: unknown) {
    console.error("deleteInquiry error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to delete inquiry.",
    };
  }
}
