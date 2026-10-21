import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyPayHereSignature, mapPayHereStatus, type PayHereNotifyPayload } from "@/lib/payhere";
import { db } from "@/lib/db";
import { generateInvoice, type InvoiceSnapshot } from "@/lib/invoices";
import { generateInvoicePdfBuffer } from "@/lib/pdf";
import { uploadInvoicePdfToStorage } from "@/lib/storage";
import { sendNotification } from "@/lib/notify";
import { getOrderPlacedSmsTemplate } from "@/lib/notify/templates";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payload: Record<string, string> = {};

    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });

    const notifyPayload = payload as unknown as PayHereNotifyPayload;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || env.PAYHERE_MERCHANT_SECRET || "sandbox_secret";

    // 1. Verify Signature
    const isValidSignature = verifyPayHereSignature(notifyPayload, merchantSecret);
    if (!isValidSignature) {
      console.warn("PayHere Webhook: Invalid md5sig signature", notifyPayload.order_id);
      return new NextResponse("Invalid Signature", { status: 400 });
    }

    // Verify Merchant ID
    const configuredMerchantId = process.env.PAYHERE_MERCHANT_ID || env.PAYHERE_MERCHANT_ID;
    if (configuredMerchantId && notifyPayload.merchant_id !== configuredMerchantId) {
      console.warn("PayHere Webhook: Merchant ID mismatch", notifyPayload.merchant_id);
      return new NextResponse("Merchant Mismatch", { status: 400 });
    }

    // Verify Currency
    if (notifyPayload.payhere_currency !== "LKR") {
      console.warn("PayHere Webhook: Currency mismatch", notifyPayload.payhere_currency);
      return new NextResponse("Currency Mismatch", { status: 400 });
    }

    const { order_id, payment_id, payhere_amount, status_code } = notifyPayload;
    const receivedAmountCents = Math.round(parseFloat(payhere_amount) * 100);

    // 2. Fetch Order from DB
    const order = await db.order.findUnique({
      where: { orderNo: order_id },
      include: { payments: true, items: true, invoice: true },
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

    let generatedInvoiceNo: string | null = null;

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
          placedAt: mappedStatus.paymentStatus === "PAID" ? (!order.placedAt ? new Date() : order.placedAt) : order.placedAt,
          events: {
            create: {
              toStatus: mappedStatus.orderStatus,
              note: `PayHere notification: ${mappedStatus.paymentStatus} (Payment ID: ${payment_id})`,
            },
          },
        },
      });

      // Issue invoice if order is verified PAID and doesn't already have one
      if (mappedStatus.paymentStatus === "PAID" && !order.invoice) {
        const inv = await generateInvoice(order.id, tx);
        generatedInvoiceNo = inv.invoiceNo;
      }
    });

    // 6. Background tasks after successful payment: PDF generation & dry-run notification
    if (mappedStatus.paymentStatus === "PAID") {
      try {
        const invRecord = await db.invoice.findUnique({ where: { orderId: order.id } });
        if (invRecord && invRecord.snapshot && generatedInvoiceNo) {
          const pdfBuf = generateInvoicePdfBuffer(invRecord.snapshot as unknown as InvoiceSnapshot);
          const { storagePath } = await uploadInvoicePdfToStorage(generatedInvoiceNo, pdfBuf);
          await db.invoice.update({
            where: { orderId: order.id },
            data: { pdfPath: storagePath },
          });
        }
      } catch (pdfErr) {
        console.warn("PayHere Webhook: Failed to generate/store invoice PDF:", pdfErr);
      }

      try {
        const smsBody = getOrderPlacedSmsTemplate({
          customerName: order.customerName,
          orderNo: order.orderNo,
          totalCents: order.totalCents,
          trackingToken: order.trackingToken,
        }).smsBody;

        sendNotification({
          orderId: order.id,
          channel: "SMS",
          toAddress: order.phone,
          template: "ORDER_PLACED",
          body: smsBody,
        });
      } catch (notifErr) {
        console.warn("PayHere Webhook: Notification dispatch failed:", notifErr);
      }
    }

    // Revalidate order page
    revalidatePath(`/order/${order.trackingToken}`);
    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath("/admin/orders");

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("PayHere Webhook Handler error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
