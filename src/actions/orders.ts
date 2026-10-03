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
      const smsBody = getDeliveredSmsTemplate({ orderNo: order.orderNo });
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
      courierName,
      trackingNo,
      trackingToken: order.trackingToken,
    });

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
    });

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
