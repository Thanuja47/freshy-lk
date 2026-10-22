// src/app/api/invoices/[invoiceNo]/route.ts — Secured endpoint to view invoice as HTML or JSON
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { generateInvoice, type InvoiceSnapshot } from "@/lib/invoices";

export const dynamic = "force-dynamic";

function renderInvoiceHtml(snapshot: InvoiceSnapshot): string {
  const fmt = (cents: number) => `Rs. ${(cents / 100).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;
  
  const itemRows = (snapshot.items || [])
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 10px;border-bottom:1px solid #eef2f6;">
        <strong style="color:#0d2137;display:block;">${item.productName} (${item.packLabel})</strong>
        ${item.prepName ? `<span style="display:inline-block;margin-top:2px;font-size:11px;color:#1B9AE4;font-weight:600;">Prep: ${item.prepName}</span>` : ""}
      </td>
      <td style="padding:12px 10px;border-bottom:1px solid #eef2f6;text-align:center;color:#475569;">${item.quantity}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #eef2f6;text-align:right;font-family:monospace;color:#475569;">${fmt(item.pricePerKgCents)}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #eef2f6;text-align:right;font-family:monospace;color:#475569;">${item.prepFeeCents > 0 ? fmt(item.prepFeeCents) : "—"}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #eef2f6;text-align:right;font-family:monospace;font-weight:700;color:#0d2137;">${fmt(item.lineTotalCents + item.prepFeeCents)}</td>
    </tr>`
    )
    .join("");

  const isPaid = snapshot.paymentMethod === "PAID" || snapshot.paymentMethod === "CARD_ONLINE";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${snapshot.invoiceNo} — Freshy.lk</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif; background: #F5F7FA; color: #0D2137; padding: 32px 16px; }
    .invoice-card { max-width: 820px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 4px 20px rgba(13,33,55,0.08); overflow: hidden; border: 1px solid #E2E8F0; }
    .header { background: #0D2137; color: white; padding: 32px 36px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .brand p { font-size: 13px; color: #94A3B8; margin-top: 4px; }
    .inv-meta { text-align: right; }
    .inv-meta .number { font-size: 18px; font-weight: 800; color: #38BDF8; font-family: monospace; }
    .inv-meta .detail { font-size: 12px; color: #CBD5E1; margin-top: 4px; }
    .badge { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-paid { background: #10B981; color: white; }
    .badge-pending { background: #F59E0B; color: white; }
    .content { padding: 36px; }
    .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding-bottom: 24px; margin-bottom: 28px; border-bottom: 1px solid #E2E8F0; }
    .addr-box h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px; margin-bottom: 8px; }
    .addr-box p { font-size: 13px; line-height: 1.6; color: #334155; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    thead tr { background: #F8FAFC; border-bottom: 2px solid #E2E8F0; }
    thead th { padding: 12px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B; text-align: left; }
    thead th:nth-child(2) { text-align: center; }
    thead th:nth-child(3), thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
    .summary-wrap { display: flex; justify-content: flex-end; }
    .summary-table { width: 320px; font-size: 13px; }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 0; color: #475569; }
    .summary-row.total { border-top: 2px solid #0D2137; margin-top: 10px; padding: 14px 12px; background: #F0F9FF; border-radius: 10px; font-size: 16px; font-weight: 800; color: #0D2137; }
    .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 36px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748B; }
    .actions { display: flex; gap: 10px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; font-size: 12px; font-weight: 600; text-decoration: none; cursor: pointer; transition: all 0.15s; }
    .btn-pdf { background: #1B9AE4; color: white; border: none; }
    .btn-pdf:hover { background: #1580C2; }
    .btn-print { background: #E2E8F0; color: #0D2137; border: none; }
    .btn-print:hover { background: #CBD5E1; }
    @media print {
      body { background: white; padding: 0; }
      .invoice-card { box-shadow: none; border: none; max-width: 100%; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="brand">
        <h1>FRESHY.LK</h1>
        <p>Premium Coastal Seafood & Fresh Catch</p>
        <p style="font-size:11px;color:#64748B;margin-top:6px;">Freshy LK (Pvt) Ltd &bull; Negombo Coastal Hub</p>
      </div>
      <div class="inv-meta">
        <div class="number">${snapshot.invoiceNo}</div>
        <div class="detail">Issued: ${new Date(snapshot.issuedAt).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" })}</div>
        <div class="detail">Order Ref: <strong>${snapshot.orderNo}</strong></div>
        <span class="badge ${isPaid ? "badge-paid" : "badge-pending"}">${snapshot.paymentMethod}</span>
      </div>
    </div>

    <div class="content">
      <div class="addresses">
        <div class="addr-box">
          <h3>Billed & Delivered To</h3>
          <p><strong>${snapshot.customerName}</strong></p>
          <p>Phone: ${snapshot.phone}</p>
          ${snapshot.email ? `<p>Email: ${snapshot.email}</p>` : ""}
          <p>${snapshot.addressLine1}${snapshot.addressLine2 ? ", " + snapshot.addressLine2 : ""}</p>
          <p>${snapshot.city}, ${snapshot.district} District</p>
        </div>
        <div class="addr-box">
          <h3>Dispatched By</h3>
          <p><strong>Freshy LK (Pvt) Ltd</strong></p>
          <p>Harbor Coastal Depot, Negombo</p>
          <p>Hotline: +94 77 123 4567</p>
          <p>Email: orders@freshy.lk</p>
          <p>Zone: ${snapshot.zoneName}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:44%">Item & Description</th>
            <th style="width:8%;text-align:center;">Qty</th>
            <th style="width:16%;text-align:right;">Rate / kg</th>
            <th style="width:16%;text-align:right;">Prep Fee</th>
            <th style="width:16%;text-align:right;">Amount (LKR)</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div class="summary-wrap">
        <div class="summary-table">
          <div class="summary-row">
            <span>Subtotal</span>
            <span style="font-family:monospace;font-weight:600;">${fmt(snapshot.subtotalCents)}</span>
          </div>
          ${snapshot.prepTotalCents > 0 ? `
          <div class="summary-row">
            <span>Preparation Fees</span>
            <span style="font-family:monospace;font-weight:600;">${fmt(snapshot.prepTotalCents)}</span>
          </div>` : ""}
          <div class="summary-row">
            <span>Delivery Fee (${snapshot.district})</span>
            <span style="font-family:monospace;font-weight:600;">${fmt(snapshot.deliveryFeeCents)}</span>
          </div>
          <div class="summary-row total">
            <span>TOTAL AMOUNT</span>
            <span style="font-family:monospace;">${fmt(snapshot.totalCents)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>Thank you for choosing Freshy.lk! Direct from Sri Lankan coastal landings.</span>
      <div class="actions">
        <button onclick="window.print()" class="btn btn-print">🖨 Print</button>
        <a href="/api/invoices/${encodeURIComponent(snapshot.invoiceNo)}/pdf" target="_blank" class="btn btn-pdf">⬇ Download PDF</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNo: string }> }
) {
  try {
    const { invoiceNo } = await params;
    const token = request.nextUrl.searchParams.get("token");
    const format = request.nextUrl.searchParams.get("format");

    // Look up by invoice number, order id, or invoice id
    const invoice = await db.invoice.findFirst({
      where: {
        OR: [
          { invoiceNo: invoiceNo },
          { orderId: invoiceNo },
          { id: invoiceNo },
        ],
      },
      include: {
        order: { select: { id: true, trackingToken: true } },
      },
    });

    if (!invoice) {
      const order = await db.order.findUnique({
        where: { id: invoiceNo },
        select: { id: true, trackingToken: true },
      });

      if (!order) {
        if (format === "json") {
          return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        }
        return new NextResponse("Invoice not found", { status: 404 });
      }

      if (token) {
        if (order.trackingToken !== token) {
          if (format === "json") return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
          return new NextResponse("Invoice not found", { status: 404 });
        }
      } else {
        try {
          await requireAdmin();
        } catch {
          if (format === "json") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
          return new NextResponse("Unauthorized", { status: 401 });
        }
      }

      const generated = await generateInvoice(order.id);
      if (format === "json") {
        return NextResponse.json({ success: true, invoice: generated });
      }
      return new NextResponse(renderInvoiceHtml(generated.snapshot as unknown as InvoiceSnapshot), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (token) {
      if (invoice.order.trackingToken !== token) {
        if (format === "json") return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        return new NextResponse("Invoice not found", { status: 404 });
      }
    } else {
      try {
        await requireAdmin();
      } catch {
        if (format === "json") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    if (format === "json") {
      return NextResponse.json({ success: true, invoice });
    }

    const html = renderInvoiceHtml(invoice.snapshot as unknown as InvoiceSnapshot);
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch invoice";
    return new NextResponse(`Error: ${message}`, { status: 500 });
  }
}
