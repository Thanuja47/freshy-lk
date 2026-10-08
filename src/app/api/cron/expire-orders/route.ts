import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    const expiredOrders = await db.order.updateMany({
      where: {
        status: "PENDING_PAYMENT",
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({
      success: true,
      cancelledCount: expiredOrders.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron expire-orders error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
