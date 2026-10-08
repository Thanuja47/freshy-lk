import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const staleProducts = await db.product.findMany({
      where: {
        isActive: true,
        priceUpdatedAt: {
          lt: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        name: true,
        priceUpdatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      staleProductCount: staleProducts.length,
      staleProducts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron price-reminder error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
