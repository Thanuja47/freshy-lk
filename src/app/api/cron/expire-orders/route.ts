import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { releaseStock } from "@/lib/stock";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();

    // Perform order cancellation and stock release inside a transaction
    const cancelledCount = await db.$transaction(async (tx) => {
      // Find orders to cancel
      const expiredOrders = await tx.order.findMany({
        where: {
          status: "PENDING_PAYMENT",
          expiresAt: {
            lt: now,
          },
        },
        include: {
          items: true,
        },
      });

      if (expiredOrders.length === 0) {
        return 0;
      }

      // Collect all stock reservation items to release
      const stockToRelease = expiredOrders.flatMap((order) =>
        order.items
          .filter((item) => item.productId !== null)
          .map((item) => ({
            productId: item.productId!,
            grams: item.packWeightGrams * item.quantity,
          }))
      );

      // Release stock back to products
      if (stockToRelease.length > 0) {
        await releaseStock(stockToRelease, tx);
      }

      // Update status of all expired orders to CANCELLED
      const orderIds = expiredOrders.map((o) => o.id);
      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: "CANCELLED" },
      });

      return expiredOrders.length;
    });

    return NextResponse.json({
      success: true,
      cancelledCount,
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
