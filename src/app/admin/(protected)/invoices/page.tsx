// src/app/admin/(protected)/invoices/page.tsx
import { db } from "@/lib/db";
import InvoicesClient, { type InvoiceRow } from "./InvoicesClient";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  let invoices: InvoiceRow[] = [];

  try {
    const rows = await db.invoice.findMany({
      take: 100,
      orderBy: { issuedAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            orderNo: true,
            customerName: true,
            phone: true,
            city: true,
            totalCents: true,
            paymentMethod: true,
            paymentStatus: true,
            status: true,
          },
        },
      },
    });

    invoices = rows.map((r) => ({
      id: r.id,
      invoiceNo: r.invoiceNo,
      orderId: r.orderId,
      issuedAt: r.issuedAt,
      order: {
        id: r.order.id,
        orderNo: r.order.orderNo,
        customerName: r.order.customerName,
        phone: r.order.phone,
        city: r.order.city,
        totalCents: r.order.totalCents,
        paymentMethod: r.order.paymentMethod,
        paymentStatus: r.order.paymentStatus,
        status: r.order.status,
      },
    }));
  } catch (err) {
    if (process.env.DEMO_MODE !== "true") {
      throw err;
    }
    console.warn("DB offline in AdminInvoicesPage fallback:", err);
  }

  return <InvoicesClient initialInvoices={invoices} />;
}
