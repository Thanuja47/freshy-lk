import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedNotifications = await db.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
        status: {
          in: ["SENT", "FAILED"],
        },
      },
    });

    return NextResponse.json({
      success: true,
      deletedNotificationsCount: deletedNotifications.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron cleanup error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
