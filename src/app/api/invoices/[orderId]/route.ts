// src/app/api/invoices/[orderId]/route.ts — API endpoint to view/generate order invoice

import { NextResponse } from "next/server";
import { generateInvoice } from "@/lib/invoices";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const invoice = await generateInvoice(orderId);
    return NextResponse.json({ success: true, invoice });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch invoice";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
