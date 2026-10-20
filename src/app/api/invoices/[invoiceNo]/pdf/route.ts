import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { generateInvoicePdfBuffer } from "@/lib/pdf";
import type { InvoiceSnapshot } from "@/lib/invoices";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNo: string }> }
) {
  try {
    const { invoiceNo } = await params;
    const token = request.nextUrl.searchParams.get("token");

    const invoice = await db.invoice.findUnique({
      where: { invoiceNo },
      include: {
        order: { select: { trackingToken: true } },
      },
    });

    if (!invoice || !invoice.snapshot) {
      return new NextResponse(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Authorization check:
    // 1. If customer provides token, verify it matches the order's trackingToken
    if (token) {
      if (invoice.order?.trackingToken !== token) {
        return new NextResponse(JSON.stringify({ error: "Invoice not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // 2. If no token provided, require valid admin session
      try {
        await requireAdmin();
      } catch {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const pdfBuffer = generateInvoicePdfBuffer(invoice.snapshot as unknown as InvoiceSnapshot);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNo}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    console.error("Invoice PDF download error:", err);
    return new NextResponse(JSON.stringify({ error: "Failed to generate invoice PDF" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
