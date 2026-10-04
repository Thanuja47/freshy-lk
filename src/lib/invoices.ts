// src/lib/invoices.ts — Invoice generation with sequential FR-YYYY-NNNNNN numbering

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type PrismaTx = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Generates or retrieves an invoice for a given orderId.
 * Invoice number format: FR-YYYY-NNNNNN (e.g. FR-2026-000001) using InvoiceCounter table.
 */
export async function generateInvoice(orderId: string, customTx?: PrismaTx) {
  const execute = async (tx: PrismaTx) => {
    // Return existing invoice if already generated
    const existing = await tx.invoice.findUnique({ where: { orderId } });
    if (existing) {
      return existing;
    }

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        zone: true,
        customer: true,
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found for invoice generation.`);
    }

    const year = new Date().getFullYear();

    const counter = await tx.invoiceCounter.upsert({
      where: { year },
      update: { lastNumber: { increment: 1 } },
      create: { year, lastNumber: 1 },
    });

    const invoiceNo = `FR-${year}-${counter.lastNumber.toString().padStart(6, "0")}`;

    const snapshot: Prisma.JsonObject = {
      orderNo: order.orderNo,
      invoiceNo,
      issuedAt: new Date().toISOString(),
      customerName: order.customerName,
      phone: order.phone,
      email: order.email,
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      city: order.city,
      district: order.district,
      zoneName: order.zone?.name ?? "",
      paymentMethod: order.paymentMethod,
      subtotalCents: order.subtotalCents,
      prepTotalCents: order.prepTotalCents,
      deliveryFeeCents: order.deliveryFeeCents,
      totalCents: order.totalCents,
      items: order.items.map((i) => ({
        productName: i.productName,
        packLabel: i.packLabel,
        quantity: i.quantity,
        pricePerKgCents: i.pricePerKgCents,
        prepName: i.prepName,
        prepFeeCents: i.prepFeeCents,
        lineTotalCents: i.lineTotalCents,
      })),
    };

    const invoice = await tx.invoice.create({
      data: {
        orderId: order.id,
        invoiceNo,
        snapshot,
      },
    });

    return invoice;
  };

  if (customTx) {
    return execute(customTx);
  }

  return db.$transaction((tx) => execute(tx));
}
