// src/lib/auth.ts — Role-based access control helpers for admin layouts and server actions

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { verifyDemoSession } from "@/lib/demo-session";
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
 * Strictly verifies identity via Supabase Auth or passcode-gated DEMO_MODE.
 * Never grants access on database failure.
 */
export async function requireAdmin(): Promise<CurrentAdminUser> {
  // 1. Try standard Supabase Auth
  try {
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
  } catch (err) {
    // If process.env.DEMO_MODE is true and Supabase keys are missing, continue to DEMO_MODE check.
    // Otherwise, if DB fails or error occurs in production, rethrow so it goes to Sentry/error page.
    if (process.env.DEMO_MODE !== "true") {
      throw err;
    }
    console.warn("Supabase/DB auth check failed in DEMO_MODE:", err);
  }

  // 2. Passcode-gated DEMO_MODE session check (ONLY when DEMO_MODE=true)
  if (process.env.DEMO_MODE === "true") {
    const cookieStore = await cookies();
    const demoCookie = cookieStore.get("demo_admin_session")?.value;
    const passcode = process.env.DEMO_ADMIN_PASSCODE;

    if (verifyDemoSession(demoCookie, passcode)) {
      return {
        id: "demo-owner-id",
        email: process.env.SEED_ADMIN_EMAIL || "admin@freshy.lk",
        name: "Freshy Owner (Demo)",
        role: "OWNER",
        isActive: true,
      };
    }
  }

  // Unauthenticated -> redirect to admin login
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
