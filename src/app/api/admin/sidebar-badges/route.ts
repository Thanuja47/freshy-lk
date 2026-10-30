import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const [unreadOrdersCount, unreadMessagesCount] = await Promise.all([
      db.order.count({
        where: {
          OR: [
            { status: "PLACED" },
            { status: "PENDING_PAYMENT" },
          ],
        },
      }),
      db.contactInquiry.count({
        where: {
          status: "NEW",
        },
      }),
    ]);

    return NextResponse.json({
      orders: unreadOrdersCount,
      messages: unreadMessagesCount,
    });
  } catch {
    return NextResponse.json({ orders: 0, messages: 0 }, { status: 200 });
  }
}
