// src/actions/orders.ts — Server actions for admin order management & status transitions

"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { isValidStatusTransition } from "@/lib/orders";
import { releaseStock, reserveStock } from "@/lib/stock";
import { sendNotification } from "@/lib/notify";
import {
  getDispatchedSmsTemplate,
  getDeliveredSmsTemplate,
  getOrderPlacedSmsTemplate,
} from "@/lib/notify/templates";
import { normalizePhone } from "@/lib/constants";
import { calculatePackPriceCents, getEffectivePricePerKgCents, calculatePrepFeeCents } from "@/lib/pricing";
import { findZoneForDistrict, calculateDeliveryFee } from "@/lib/delivery";
import { generateInvoice, type InvoiceSnapshot } from "@/lib/invoices";
import { generateInvoicePdfBuffer } from "@/lib/pdf";
import {
  uploadBankSlipToStorage,
  getSlipSignedUrl,
  uploadInvoicePdfToStorage,
} from "@/lib/storage";
import { revalidatePath } from "next/cache";
import type { OrderStatus, PaymentMethod, CustomerType } from "@prisma/client";

export async function updateOrderStatus(

  orderId: string,
  nextStatus: OrderStatus,
  note?: string
) {
  try {
    const admin = await requireAdmin();

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return { success: false, message: "Order not found." };
    }

    const isOwner = admin.role === "OWNER";
    if (!isValidStatusTransition(order.status, nextStatus, isOwner)) {
      return {
        success: false,
        message: `Transition from ${order.status} to ${nextStatus} is not allowed.`,
      };
    }

    const updatedOrder = await db.$transaction(async (tx) => {
      // Release stock if cancelling prior to DISPATCHED
      if (nextStatus === "CANCELLED" && order.status !== "DISPATCHED" && order.status !== "DELIVERED") {
        const stockItems = order.items.map((item) => ({
          productId: item.productId || "",
          grams: item.packWeightGrams * item.quantity,
        }));
        await releaseStock(stockItems, tx);
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: nextStatus,
          placedAt: nextStatus === "PLACED" && !order.placedAt ? new Date() : order.placedAt,
        },
      });

      await tx.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: nextStatus,
          note: note || null,
          byAdminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "order.status_update",
          entity: "Order",
          entityId: order.id,
          diff: { fromStatus: order.status, toStatus: nextStatus, note },
        },
      });

      return updated;
    });

    // Non-blocking notification dispatch
    if (nextStatus === "DELIVERED") {
      const smsBody = getDeliveredSmsTemplate({
        orderNo: order.orderNo,
        customerName: order.customerName,
        totalCents: order.totalCents,
        trackingToken: order.trackingToken,
      }).smsBody;
      sendNotification({
        orderId: order.id,
        channel: "SMS",
        toAddress: order.phone,
        template: "DELIVERED",
        body: smsBody,
      });
    }

    return { success: true, status: updatedOrder.status };
  } catch (err: unknown) {
    console.error("updateOrderStatus error:", err);
    return { success: false, message: err instanceof Error ? err.message : "Failed to update order status." };
  }
}

export async function dispatchOrder(
  orderId: string,
  courierName: string,
  trackingNo: string,
  trackingUrl?: string
) {
  try {
    const admin = await requireAdmin();

    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, message: "Order not found." };
    }

    const updated = await db.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "DISPATCHED",
          courierName,
          courierTrackingNo: trackingNo,
          courierTrackingUrl: trackingUrl || null,
        },
      });

      await tx.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: "DISPATCHED",
          note: `Dispatched via ${courierName} (${trackingNo})`,
          byAdminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "order.dispatch",
          entity: "Order",
          entityId: order.id,
          diff: { courierName, trackingNo },
        },
      });

      return o;
    });

    // Send dispatch SMS
    const smsBody = getDispatchedSmsTemplate({
      orderNo: order.orderNo,
      customerName: order.customerName,
      totalCents: order.totalCents,
      trackingToken: order.trackingToken,
      courierName,
      trackingNo,
    }).smsBody;

    sendNotification({
      orderId: order.id,
      channel: "SMS",
      toAddress: order.phone,
      template: "DISPATCHED",
      body: smsBody,
    });

    return { success: true, status: updated.status };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : "Dispatch action failed." };
  }
}

const manualOrderSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(9),
  email: z.string().optional(),
  customerType: z.enum(["INDIVIDUAL", "BUSINESS"]).default("INDIVIDUAL"),
  addressLine1: z.string().min(3),
  city: z.string().min(2),
  district: z.string().min(2),
  deliveryDate: z.string(),
  paymentMethod: z.enum(["BANK_TRANSFER", "CARD_ONLINE", "COD"]).default("BANK_TRANSFER"),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      packWeightGrams: z.number().int().positive(),
      prepOptionId: z.string().optional(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
});

export type ManualOrderInput = z.infer<typeof manualOrderSchema>;

export async function createManualOrder(input: ManualOrderInput) {
  try {
    const admin = await requireAdmin();
    const parsed = manualOrderSchema.parse(input);
    const normalizedPhone = normalizePhone(parsed.phone);

    const allZones = await db.deliveryZone.findMany({ where: { isActive: true } });
    const zone = findZoneForDistrict(allZones, parsed.district);
    if (!zone) {
      return { success: false, message: `No active delivery zone for ${parsed.district}.` };
    }

    const productIds = Array.from(new Set(parsed.items.map((i) => i.productId)));
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      include: { packs: true, tiers: true, preps: { include: { prepOption: true } } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotalCents = 0;
    let prepTotalCents = 0;
    let totalWeightGrams = 0;

    const validatedItems: Array<{
      productId: string;
      productName: string;
      localName: string | null;
      packLabel: string;
      packWeightGrams: number;
      quantity: number;
      pricePerKgCents: number;
      tierLabel: string | null;
      prepName: string | null;
      prepFeeCents: number;
      lineTotalCents: number;
    }> = [];

    for (const item of parsed.items) {
      const product = productMap.get(item.productId)!;
      const pack = product.packs.find((p) => p.weightGrams === item.packWeightGrams);
      if (!pack) throw new Error(`Pack not found for ${product.name}`);

      const { pricePerKgCents, tierLabel } = getEffectivePricePerKgCents(
        product.pricePerKgCents,
        product.tiers,
        item.packWeightGrams * item.quantity
      );

      const packPriceCents = calculatePackPriceCents(pricePerKgCents, item.packWeightGrams);
      const lineTotalCents = packPriceCents * item.quantity;

      let prepName: string | undefined;
      let prepFeeCents = 0;
      if (item.prepOptionId) {
        const pr = product.preps.find((p) => p.prepOptionId === item.prepOptionId);
        if (pr) {
          prepName = pr.prepOption.name;
          const fee = pr.feeOverrideCents ?? pr.prepOption.feeCents;
          prepFeeCents = calculatePrepFeeCents(fee, pr.prepOption.feeType, item.packWeightGrams, item.quantity);
        }
      }

      subtotalCents += lineTotalCents;
      prepTotalCents += prepFeeCents;
      totalWeightGrams += item.packWeightGrams * item.quantity;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        localName: product.localName,
        packLabel: pack.label,
        packWeightGrams: item.packWeightGrams,
        quantity: item.quantity,
        pricePerKgCents,
        tierLabel,
        prepName: prepName || null,
        prepFeeCents,
        lineTotalCents,
      });
    }

    const deliveryFeeCents = calculateDeliveryFee(zone, totalWeightGrams, subtotalCents);
    const totalCents = subtotalCents + prepTotalCents + deliveryFeeCents;

    const created = await db.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { phone: normalizedPhone },
        update: { name: parsed.customerName, email: parsed.email || undefined },
        create: { phone: normalizedPhone, name: parsed.customerName, email: parsed.email || undefined },
      });

      const now = new Date();
      const colomboStr = now.toLocaleDateString("en-US", { timeZone: "Asia/Colombo", year: "2-digit", month: "2-digit", day: "2-digit" });
      const [m, d, y] = colomboStr.split("/");
      const dayKey = `${y}${m}${d}`;

      const counter = await tx.orderCounter.upsert({
        where: { day: dayKey },
        update: { lastNumber: { increment: 1 } },
        create: { day: dayKey, lastNumber: 1 },
      });

      const orderNo = `FRS-${dayKey}-${counter.lastNumber.toString().padStart(4, "0")}`;
      const trackingToken = Array.from({ length: 24 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");

      await reserveStock(
        validatedItems.map((i) => ({ productId: i.productId, grams: i.packWeightGrams * i.quantity })),
        tx
      );

      const order = await tx.order.create({
        data: {
          orderNo,
          trackingToken,
          idempotencyKey: `manual-${Date.now()}-${Math.random()}`,
          status: "PLACED",
          paymentStatus: "UNPAID",
          customerId: customer.id,
          customerType: parsed.customerType as CustomerType,
          customerName: parsed.customerName,
          phone: normalizedPhone,
          email: parsed.email || null,
          addressLine1: parsed.addressLine1,
          city: parsed.city,
          district: parsed.district,
          zoneId: zone.id,
          deliveryDate: new Date(parsed.deliveryDate),
          paymentMethod: parsed.paymentMethod as PaymentMethod,
          subtotalCents,
          prepTotalCents,
          deliveryFeeCents,
          totalCents,
          source: "whatsapp",
          placedAt: new Date(),
          items: { create: validatedItems },
          events: { create: { toStatus: "PLACED", note: `Manual order created by ${admin.name}` } },
        },
      });

      return order;
    });

    const smsBody = getOrderPlacedSmsTemplate({
      customerName: created.customerName,
      orderNo: created.orderNo,
      totalCents: created.totalCents,
      trackingToken: created.trackingToken,
    }).smsBody;

    sendNotification({
      orderId: created.id,
      channel: "SMS",
      toAddress: created.phone,
      template: "ORDER_PLACED",
      body: smsBody,
    });

    return { success: true, orderNo: created.orderNo, trackingToken: created.trackingToken };
  } catch (err: unknown) {
    console.error("createManualOrder error:", err);
    return { success: false, message: err instanceof Error ? err.message : "Failed to create manual order." };
  }
}

/**
 * Admin action: Marks order as paid, approves pending bank slips,
 * generates gapless invoice number (FR-YYYY-NNNNNN), renders and stores real PDF.
 */
export async function markOrderAsPaid(orderId: string, note?: string) {
  try {
    const admin = await requireAdmin();

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { slips: true },
    });

    if (!order) {
      return { success: false, message: "Order not found." };
    }

    const { invoiceNo, nextStatus } = await db.$transaction(async (tx) => {
      // 1. Determine next status (if PENDING_PAYMENT or PLACED, advance to CONFIRMED)
      const nextStatus =
        order.status === "PENDING_PAYMENT" || order.status === "PLACED"
          ? ("CONFIRMED" as const)
          : order.status;

      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: nextStatus,
          placedAt: !order.placedAt ? new Date() : order.placedAt,
        },
      });

      // 2. Mark any pending BankSlip rows as APPROVED
      await tx.bankSlip.updateMany({
        where: { orderId, status: "PENDING" },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedById: admin.id !== "demo-owner-id" ? admin.id : undefined,
          reviewNote: note || "Bank transfer slip verified and approved",
        },
      });

      // 3. Generate gapless invoice (FR-YYYY-NNNNNN)
      const inv = await generateInvoice(orderId, tx);

      // 4. Record status event
      await tx.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: nextStatus,
          note: note || `Payment verified as PAID. Invoice ${inv.invoiceNo} issued.`,
          byAdminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          adminId: admin.id !== "demo-owner-id" ? admin.id : undefined,
          action: "order.mark_as_paid",
          entity: "Order",
          entityId: order.id,
          diff: {
            previousPaymentStatus: order.paymentStatus,
            newPaymentStatus: "PAID",
            invoiceNo: inv.invoiceNo,
            nextStatus,
            note,
          },
        },
      });

      return { invoiceNo: inv.invoiceNo, invoiceSnapshot: inv.snapshot as unknown as InvoiceSnapshot, nextStatus };
    }, { timeout: 30000, maxWait: 10000 });

    // 6. Generate real PDF binary and save to private storage
    try {
      const invRecord = await db.invoice.findUnique({ where: { orderId } });
      if (invRecord && invRecord.snapshot) {
        const pdfBuf = generateInvoicePdfBuffer(invRecord.snapshot as unknown as InvoiceSnapshot);
        const { storagePath } = await uploadInvoicePdfToStorage(invoiceNo, pdfBuf);
        await db.invoice.update({
          where: { orderId },
          data: { pdfPath: storagePath },
        });
      }
    } catch (pdfErr) {
      console.warn("Failed to generate or store invoice PDF in background:", pdfErr);
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    if (order.trackingToken) {
      revalidatePath(`/order/${order.trackingToken}`);
    }

    return { success: true, invoiceNo, status: nextStatus };
  } catch (err: unknown) {
    console.error("markOrderAsPaid error:", err);
    return { success: false, message: err instanceof Error ? err.message : "Failed to mark order as paid." };
  }
}

/**
 * Customer / Admin action: Uploads a bank transfer slip to private bucket.
 */
export async function uploadPaymentSlipAction(formData: FormData) {
  try {
    const token = formData.get("token") as string | null;
    const orderId = formData.get("orderId") as string | null;
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return { success: false, message: "Please select a valid payment slip file to upload." };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { success: false, message: "File size exceeds 10 MB limit." };
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedMimeTypes.includes(file.type)) {
      return { success: false, message: "Only JPG, PNG, WebP, or PDF files are accepted." };
    }

    let targetOrder = null;
    if (token) {
      targetOrder = await db.order.findUnique({ where: { trackingToken: token } });
    } else if (orderId) {
      targetOrder = await db.order.findUnique({ where: { id: orderId } });
    }

    if (!targetOrder) {
      return { success: false, message: "Order not found." };
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to private storage
    const { storagePath, sizeBytes } = await uploadBankSlipToStorage(
      targetOrder.id,
      file.name,
      buffer,
      file.type
    );

    // Create BankSlip record in DB
    const slip = await db.bankSlip.create({
      data: {
        orderId: targetOrder.id,
        storagePath,
        mimeType: file.type,
        sizeBytes,
        status: "PENDING",
      },
    });

    // Record timeline event
    await db.orderStatusEvent.create({
      data: {
        orderId: targetOrder.id,
        fromStatus: targetOrder.status,
        toStatus: targetOrder.status,
        note: `Bank transfer slip uploaded (${file.name})`,
      },
    });

    if (targetOrder.trackingToken) {
      revalidatePath(`/order/${targetOrder.trackingToken}`);
    }
    revalidatePath(`/admin/orders/${targetOrder.id}`);

    return { success: true, slipId: slip.id, message: "Payment slip uploaded successfully." };
  } catch (err: unknown) {
    console.error("uploadPaymentSlipAction error:", err);
    return { success: false, message: err instanceof Error ? err.message : "Failed to upload slip." };
  }
}

/**
 * Admin action: Generates signed URL to view a private bank slip.
 */
export async function getSlipSignedUrlAction(slipId: string) {
  try {
    await requireAdmin();
    const slip = await db.bankSlip.findUnique({ where: { id: slipId } });
    if (!slip) {
      return { success: false, message: "Slip not found." };
    }

    const url = await getSlipSignedUrl(slip.storagePath);
    return { success: true, url };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : "Failed to generate slip view URL." };
  }
}

