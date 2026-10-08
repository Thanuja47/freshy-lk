import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyPayHereSignature, mapPayHereStatus, type PayHereNotifyPayload } from "@/lib/payhere";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payload: Record<string, string> = {};

    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });

    const notifyPayload = payload as unknown as PayHereNotifyPayload;
    const merchantSecret = env.PAYHERE_MERCHANT_SECRET || "sandbox_secret";

    // 1. Verify Signature
    const isValidSignature = verifyPayHereSignature(notifyPayload, merchantSecret);
    if (!isValidSignature) {
      console.warn("PayHere Webhook: Invalid md5sig signature", notifyPayload.order_id);
      return new NextResponse("Invalid Signature", { status: 400 });
    }

    const { order_id, payment_id, payhere_amount, status_code } = notifyPayload;
    const receivedAmountCents = Math.round(parseFloat(payhere_amount) * 100);

    // 2. Fetch Order from DB
    const order = await db.order.findUnique({
      where: { orderNo: order_id },
      include: { payments: true },
    });

    if (!order) {
      console.warn("PayHere Webhook: Order not found", order_id);
      return new NextResponse("Order Not Found", { status: 404 });
    }

    // 3. Amount Matching Check
    if (order.totalCents !== receivedAmountCents) {
      console.warn(
        `PayHere Webhook: Amount mismatch for ${order_id}. Expected ${order.totalCents}, got ${receivedAmountCents}`
      );
      return new NextResponse("Amount Mismatch", { status: 400 });
    }

    // 4. Idempotency Check (unique provider + payment_id)
    const existingPayment = await db.payment.findFirst({
      where: {
        provider: "payhere",
        providerPaymentId: payment_id,
      },
    });

    if (existingPayment) {
      console.log(`PayHere Webhook: Duplicate notification for payment_id ${payment_id}`);
      return new NextResponse("OK Duplicate", { status: 200 });
    }

    // 5. Map Status and Update Order / Create Payment Record
    const mappedStatus = mapPayHereStatus(status_code);

    await db.$transaction(async (tx) => {
      // Record payment audit entry
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: "payhere",
          providerPaymentId: payment_id,
          amountCents: receivedAmountCents,
          currency: notifyPayload.payhere_currency || "LKR",
          status: mappedStatus.paymentStatus,
          statusCode: parseInt(status_code, 10),
          method: notifyPayload.method || "CARD",
          rawPayload: payload,
          note: notifyPayload.status_message || null,
        },
      });

      // Update Order Status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: mappedStatus.orderStatus,
          paymentStatus: mappedStatus.paymentStatus,
          placedAt: mappedStatus.paymentStatus === "PAID" ? new Date() : order.placedAt,
          events: {
            create: {
              toStatus: mappedStatus.orderStatus,
              note: `PayHere notification: ${mappedStatus.paymentStatus} (Payment ID: ${payment_id})`,
            },
          },
        },
      });
    });

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("PayHere Webhook Handler error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
