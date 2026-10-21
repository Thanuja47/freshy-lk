// src/app/api/admin/orders-data/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const orders = await db.order.findMany({
      take: 60,
      orderBy: { createdAt: "desc" },
      include: {
        zone: { select: { name: true } },
        items: { select: { id: true, productName: true, quantity: true, packLabel: true, prepName: true } },
      },
    });

    return NextResponse.json({ orders });
  } catch (err: unknown) {
    console.error("Orders data endpoint error:", err);
    return NextResponse.json(
      { error: "Unauthorized or failed to load orders", orders: [] },
      { status: 401 }
    );
  }
}
