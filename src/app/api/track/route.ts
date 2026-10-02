import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderNo, phone } = body;

    if (!orderNo || !phone) {
      return NextResponse.json({ message: "Order number and phone number are required." }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    const cleanOrderNo = String(orderNo).trim().toUpperCase();

    const order = await db.order.findFirst({
      where: {
        orderNo: { equals: cleanOrderNo, mode: "insensitive" },
        phone: normalizedPhone,
      },
      select: { trackingToken: true },
    });

    if (!order) {
      return NextResponse.json(
        { message: "No order found matching that Order Number and Phone." },
        { status: 404 }
      );
    }

    return NextResponse.json({ trackingToken: order.trackingToken });
  } catch (err: unknown) {
    console.error("Track order error:", err);
    return NextResponse.json({ message: "Server error tracking order." }, { status: 500 });
  }
}
