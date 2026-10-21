// src/app/admin/(protected)/orders/page.tsx
import { db } from "@/lib/db";
import OrdersClient, { type OrderItemRow } from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  let orders: OrderItemRow[] = [];

  try {
    orders = await db.order.findMany({
      take: 60,
      orderBy: { createdAt: "desc" },
      include: {
        zone: { select: { name: true } },
        items: { select: { id: true, productName: true, quantity: true, packLabel: true, prepName: true } },
      },
    });
  } catch (err) {
    if (process.env.DEMO_MODE !== "true") {
      throw err;
    }
    console.warn("DB offline in AdminOrdersPage fallback:", err);
  }

  return <OrdersClient initialOrders={orders} />;
}
