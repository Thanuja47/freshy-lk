import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  let orders: Array<{
    id: string;
    orderNo: string;
    customerName: string;
    phone: string;
    city: string;
    totalCents: number;
    status: import("@prisma/client").OrderStatus;
    zone: { name: string };
    items: Array<{ id: string; productName: string; quantity: number; packLabel: string; prepName: string | null }>;
  }> = [];

  try {
    orders = await db.order.findMany({
      take: 50,
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

  const counts = {
    all: orders.length,
    placed: orders.filter((o) => o.status === "PLACED").length,
    confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
    packed: orders.filter((o) => o.status === "PACKED").length,
    dispatched: orders.filter((o) => o.status === "DISPATCHED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    pending: orders.filter((o) => o.status === "PENDING_PAYMENT").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-sea-ink">Orders Management</h1>
          <p className="text-xs text-sea-ink/70 mt-1">
            Track customer orders, manage status transitions, and dispatch deliveries.
          </p>
        </div>
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-sand p-3 rounded-lg text-center shadow-sm">
          <div className="text-xs font-semibold text-sea-ink/60 uppercase">Total</div>
          <div className="text-xl font-bold text-sea-ink mt-0.5">{counts.all}</div>
        </div>
        <div className="bg-white border border-amber-200 p-3 rounded-lg text-center shadow-sm bg-amber-50/50">
          <div className="text-xs font-semibold text-amber-900 uppercase">Placed</div>
          <div className="text-xl font-bold text-amber-900 mt-0.5">{counts.placed}</div>
        </div>
        <div className="bg-white border border-blue-200 p-3 rounded-lg text-center shadow-sm bg-blue-50/50">
          <div className="text-xs font-semibold text-blue-900 uppercase">Confirmed</div>
          <div className="text-xl font-bold text-blue-900 mt-0.5">{counts.confirmed}</div>
        </div>
        <div className="bg-white border border-purple-200 p-3 rounded-lg text-center shadow-sm bg-purple-50/50">
          <div className="text-xs font-semibold text-purple-900 uppercase">Packed</div>
          <div className="text-xl font-bold text-purple-900 mt-0.5">{counts.packed}</div>
        </div>
        <div className="bg-white border border-indigo-200 p-3 rounded-lg text-center shadow-sm bg-indigo-50/50">
          <div className="text-xs font-semibold text-indigo-900 uppercase">Dispatched</div>
          <div className="text-xl font-bold text-indigo-900 mt-0.5">{counts.dispatched}</div>
        </div>
        <div className="bg-white border border-green-200 p-3 rounded-lg text-center shadow-sm bg-green-50/50">
          <div className="text-xs font-semibold text-green-900 uppercase">Delivered</div>
          <div className="text-xl font-bold text-green-900 mt-0.5">{counts.delivered}</div>
        </div>
        <div className="bg-white border border-sand p-3 rounded-lg text-center shadow-sm">
          <div className="text-xs font-semibold text-sea-ink/60 uppercase">Pending</div>
          <div className="text-xl font-bold text-sea-ink mt-0.5">{counts.pending}</div>
        </div>
      </div>

      {/* Orders Table List */}
      <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ice border-b border-sand text-[11px] font-bold uppercase tracking-wider text-sea-ink/70">
                <th className="py-3 px-4">Order No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items & Prep</th>
                <th className="py-3 px-4">Delivery Zone</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/50 text-sm">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-ice/50">
                  <td className="py-3 px-4 font-mono font-bold text-tide">
                    <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                      {order.orderNo}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-sea-ink">{order.customerName}</div>
                    <div className="text-xs text-sea-ink/60">{order.phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs space-y-1">
                      {order.items.map((it) => (
                        <div key={it.id} className="text-sea-ink/90">
                          {it.productName} ({it.packLabel}) x {it.quantity}
                          {it.prepName && (
                            <span className="ml-1 text-tide font-bold">[{it.prepName}]</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-sea-ink/80">
                    <div>{order.city}</div>
                    <div className="text-sea-ink/60">{order.zone.name}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-coral">
                    {formatMoney(order.totalCents)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        order.status === "DELIVERED"
                          ? "bg-green-100 text-green-800"
                          : order.status === "DISPATCHED"
                          ? "bg-indigo-100 text-indigo-800"
                          : order.status === "PACKED"
                          ? "bg-purple-100 text-purple-800"
                          : order.status === "CONFIRMED"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "PLACED"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="px-3 py-1.5 bg-sea-glass text-tide text-xs font-bold rounded-lg hover:bg-tide hover:text-white transition-colors"
                    >
                      View & Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
