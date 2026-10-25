// src/lib/invoices.ts — Invoice generation with FR-YYYY-NNNNNN numbering and HTML/PDF rendering

import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import type { Prisma } from "@prisma/client";

type PrismaTx = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export interface InvoiceItemSnapshot {
  productName: string;
  packLabel: string;
  quantity: number;
  pricePerKgCents: number;
  prepName?: string | null;
  prepFeeCents: number;
  lineTotalCents: number;
}

export interface InvoiceSnapshot {
  orderNo: string;
  invoiceNo: string;
  issuedAt: string;
  customerName: string;
  phone: string;
  email?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  district: string;
  zoneName: string;
  paymentMethod: string;
  subtotalCents: number;
  prepTotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  items: InvoiceItemSnapshot[];
}

export interface BusinessDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  vatNumber?: string;
  regNumber?: string;
}

export const DEFAULT_BUSINESS_DETAILS: BusinessDetails = {
  name: "Freshy LK (Pvt) Ltd",
  address: "No. 45, Oceanfront Avenue, Colombo 03, Sri Lanka",
  phone: "+94 11 234 5678 / +94 77 123 4567",
  email: "orders@freshy.lk",
  vatNumber: "VAT-100293847-7000",
  regNumber: "PV-0029384",
};

/**
 * Formats integer invoice counter into FR-YYYY-NNNNNN format e.g. FR-2026-000001
 */
export function formatInvoiceNumber(year: number, sequenceNumber: number): string {
  return `FR-${year}-${sequenceNumber.toString().padStart(6, "0")}`;
}

/**
 * Renders HTML string for invoice document
 */
export function renderInvoiceHTML(
  snapshot: InvoiceSnapshot,
  business: BusinessDetails = DEFAULT_BUSINESS_DETAILS
): string {
  const formattedDate = new Date(snapshot.issuedAt).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const itemsRows = snapshot.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">
        <strong>${item.productName}</strong> (${item.packLabel})
        ${item.prepName ? `<br><small style="color: #1B9AE4;">Prep: ${item.prepName}</small>` : ""}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: right;">${formatMoney(item.pricePerKgCents)} / kg</td>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: right;">${formatMoney(item.prepFeeCents)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold;">${formatMoney(item.lineTotalCents + item.prepFeeCents)}</td>
    </tr>
  `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${snapshot.invoiceNo}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #0D2137; background: #fff; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1B9AE4; padding-bottom: 20px; margin-bottom: 30px; }
    .company-title { font-size: 24px; font-weight: bold; color: #0D2137; }
    .invoice-title { font-size: 28px; font-weight: bold; color: #1B9AE4; text-align: right; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 13px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 30px; }
    th { background: #F0F7FF; color: #0D2137; text-align: left; padding: 10px; border-bottom: 2px solid #DDE8F0; }
    .totals-table { width: 300px; margin-left: auto; font-size: 13px; }
    .totals-table td { padding: 6px 10px; }
    .grand-total { font-size: 16px; font-weight: bold; color: #1B9AE4; border-top: 2px solid #1B9AE4; }
    .footer { margin-top: 50px; border-top: 1px solid #E5E7EB; padding-top: 15px; text-align: center; font-size: 11px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-title">${business.name}</div>
      <div style="font-size: 12px; color: #4B5563; margin-top: 4px;">
        ${business.address}<br>
        Phone: ${business.phone} | Email: ${business.email}<br>
        ${business.vatNumber ? `VAT Reg: ${business.vatNumber}` : ""}
      </div>
    </div>
    <div>
      <div class="invoice-title">INVOICE</div>
      <div style="font-size: 14px; font-weight: bold; color: #0D2137; margin-top: 4px;">${snapshot.invoiceNo}</div>
      <div style="font-size: 12px; color: #6B7280;">Date: ${formattedDate}</div>
      <div style="font-size: 12px; color: #6B7280;">Order No: ${snapshot.orderNo}</div>
    </div>
  </div>

  <div class="details-grid">
    <div>
      <strong style="color: #1B9AE4; text-transform: uppercase; font-size: 11px;">Billed To:</strong><br>
      <strong>${snapshot.customerName}</strong><br>
      Phone: ${snapshot.phone}<br>
      ${snapshot.email ? `Email: ${snapshot.email}<br>` : ""}
      ${snapshot.addressLine1}${snapshot.addressLine2 ? `, ${snapshot.addressLine2}` : ""}<br>
      ${snapshot.city}, ${snapshot.district} District
    </div>
    <div style="text-align: right;">
      <strong style="color: #1B9AE4; text-transform: uppercase; font-size: 11px;">Payment Summary:</strong><br>
      Payment Method: <strong>${snapshot.paymentMethod}</strong><br>
      Delivery Zone: <strong>${snapshot.zoneName}</strong>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item & Preparation</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Rate / Kg</th>
        <th style="text-align: right;">Prep Fee</th>
        <th style="text-align: right;">Total (LKR)</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <table class="totals-table">
    <tr>
      <td>Subtotal:</td>
      <td style="text-align: right; font-weight: bold;">${formatMoney(snapshot.subtotalCents)}</td>
    </tr>
    ${
      snapshot.prepTotalCents > 0
        ? `<tr>
      <td>Preparation Fee:</td>
      <td style="text-align: right; font-weight: bold;">${formatMoney(snapshot.prepTotalCents)}</td>
    </tr>`
        : ""
    }
    <tr>
      <td>Delivery Fee (${snapshot.zoneName}):</td>
      <td style="text-align: right; font-weight: bold;">${formatMoney(snapshot.deliveryFeeCents)}</td>
    </tr>
    <tr class="grand-total">
      <td style="padding-top: 10px;">Total Amount:</td>
      <td style="padding-top: 10px; text-align: right;">${formatMoney(snapshot.totalCents)}</td>
    </tr>
  </table>

  <div class="footer">
    Thank you for choosing Freshy.lk — Fresh Seafood Delivered Chilled to Your Doorstep.<br>
    For inquiries, contact us at ${business.phone} or email ${business.email}
  </div>
</body>
</html>`;
}

/**
 * Generates or retrieves an invoice for a given orderId.
 * Invoice number format: FR-YYYY-NNNNNN (e.g. FR-2026-000001) using InvoiceCounter table.
 */
export async function generateInvoice(orderId: string, customTx?: PrismaTx) {
  const execute = async (tx: PrismaTx) => {
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

    const invoiceNo = formatInvoiceNumber(year, counter.lastNumber);

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
