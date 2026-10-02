// src/lib/auth.ts — Role-based access control helpers for admin layouts and server actions

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@prisma/client";

export interface CurrentAdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
}

/**
 * Ensures the request is from an authenticated, active AdminUser.
 * Redirects to /admin/login if unauthenticated.
 */
export async function requireAdmin(): Promise<CurrentAdminUser> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.email) {
    const admin = await db.adminUser.findUnique({
      where: { email: user.email },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (admin && admin.isActive) {
      return admin;
    }
  }

  // Fallback for DEV / DEMO mode when Supabase Auth keys are not yet configured
  if (process.env.DEMO_MODE === "true" || process.env.NODE_ENV === "development") {
    const firstAdmin = await db.adminUser.findFirst({
      where: { isActive: true },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (firstAdmin) {
      return firstAdmin;
    }

    // Default Owner Admin fallback
    return {
      id: "demo-owner-id",
      email: process.env.SEED_ADMIN_EMAIL || "admin@freshy.lk",
      name: "Freshy Owner",
      role: "OWNER",
      isActive: true,
    };
  }

  redirect("/admin/login");
}

/**
 * Ensures the request is from an active AdminUser with the OWNER role.
 * Throws a permission error if the user is STAFF.
 */
export async function requireOwner(): Promise<CurrentAdminUser> {
  const admin = await requireAdmin();

  if (admin.role !== "OWNER") {
    throw new Error("Permission denied: This action requires OWNER role permissions.");
  }

  return admin;
}
