// src/actions/settings.ts — Server actions for Admin Settings persistence
"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { revalidateSettingsCache } from "@/lib/cache";

export async function saveSettingsAction(settings: Record<string, string>) {
  try {
    const admin = await requireAdmin();

    const entries = Object.entries(settings);
    if (entries.length === 0) {
      return { success: true };
    }

    await Promise.all(
      entries.map(([key, val]) =>
        db.setting.upsert({
          where: { key },
          update: { value: val },
          create: { key, value: val },
        })
      )
    );

    try {
      await db.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "settings.update",
          entity: "Setting",
          diff: settings,
        },
      });
    } catch (auditErr) {
      console.warn("Audit log for settings skipped:", auditErr);
    }

    try {
      await revalidateSettingsCache();
    } catch {
      // non-fatal
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    revalidatePath("/checkout");
    revalidatePath("/contact");
    revalidatePath("/");
    revalidatePath("/api/settings");

    return { success: true };
  } catch (err: unknown) {
    console.error("saveSettingsAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to save settings.",
    };
  }
}
