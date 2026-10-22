// src/app/api/settings/route.ts — Public settings for checkout and order views
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const defaults: Record<string, string> = {
    companyName: "Freshy LK (Pvt) Ltd",
    supportPhone: "+94 77 123 4567",
    supportEmail: "support@freshy.lk",
    bankName: "Commercial Bank of Ceylon",
    bankAccountName: "Freshy LK (Pvt) Ltd",
    bankAccountNumber: "1000200300",
    bankBranch: "Colombo Main Branch",
  };

  try {
    const rows = await db.setting.findMany();
    for (const r of rows) {
      if (r.value != null) {
        defaults[r.key] = typeof r.value === "string" ? r.value : String(r.value);
      }
    }
  } catch (err) {
    console.warn("Could not read DB settings, using defaults:", err);
  }

  return NextResponse.json(defaults, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
