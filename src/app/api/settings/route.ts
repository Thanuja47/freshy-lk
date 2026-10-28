// src/app/api/settings/route.ts — Public settings for checkout, contact and order views
import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSiteSettings();

  return NextResponse.json(settings, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
