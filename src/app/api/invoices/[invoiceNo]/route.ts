// src/app/api/invoices/[invoiceNo]/route.ts — Secured API endpoint to view/generate invoice
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { generateInvoice } from "@/lib/invoices";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNo: string }> }
) {
  try {
    const { invoiceNo } = await params;
    const token = request.nextUrl.searchParams.get("token");

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
      // Check if it's an order needing an invoice generated
      const order = await db.order.findUnique({
        where: { id: invoiceNo },
        select: { id: true, trackingToken: true },
      });

      if (!order) {
        return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
      }

      if (token) {
        if (order.trackingToken !== token) {
          return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        }
      } else {
        try {
          await requireAdmin();
        } catch {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
      }

      const generated = await generateInvoice(order.id);
      return NextResponse.json({ success: true, invoice: generated });
    }

    if (token) {
      if (invoice.order.trackingToken !== token) {
        return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
      }
    } else {
      try {
        await requireAdmin();
      } catch {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.json({ success: true, invoice });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch invoice";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
