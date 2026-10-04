import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const zones = await db.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ zones });
  } catch (err: unknown) {
    if (process.env.DEMO_MODE !== "true") {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
    // Fallback demo zones when DEMO_MODE=true
    return NextResponse.json({
      zones: [
        {
          id: "zone-1",
          name: "Colombo 1-15 Express",
          districts: ["Colombo"],
          baseFeeCents: 35000,
          perKgFeeCents: 0,
          freeOverCents: 1500000,
          minOrderCents: 200000,
          leadDays: 1,
          cutoffTime: "15:00",
          deliveryWeekdays: [1, 2, 3, 4, 5, 6],
          allowedStorage: ["FRESH", "FROZEN", "AMBIENT"],
          etaMinDays: 1,
          etaMaxDays: 1,
          isActive: true,
        },
        {
          id: "zone-2",
          name: "Greater Colombo & Suburbs",
          districts: ["Gampaha", "Kalutara"],
          baseFeeCents: 50000,
          perKgFeeCents: 5000,
          freeOverCents: 2500000,
          minOrderCents: 300000,
          leadDays: 1,
          cutoffTime: "12:00",
          deliveryWeekdays: [1, 2, 3, 4, 5, 6],
          allowedStorage: ["FRESH", "FROZEN", "AMBIENT"],
          etaMinDays: 1,
          etaMaxDays: 2,
          isActive: true,
        },
      ],
    });
  }
}
