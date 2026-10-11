import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { ShoppingBag, ChevronRight } from "lucide-react";

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
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Orders Management
          </h1>
          <p className="text-[13px] text-[#6E6E73] mt-1">
            Track customer orders, manage status transitions, and dispatch deliveries.
          </p>
        </div>
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { label: "Total", count: counts.all, color: "text-[#1D1D1F]" },
          { label: "Placed", count: counts.placed, color: "text-[#B26A00]" },
          { label: "Confirmed", count: counts.confirmed, color: "text-[#1E88E5]" },
          { label: "Packed", count: counts.packed, color: "text-purple-700" },
          { label: "Dispatched", count: counts.dispatched, color: "text-indigo-700" },
          { label: "Delivered", count: counts.delivered, color: "text-[#2E7D32]" },
          { label: "Pending", count: counts.pending, color: "text-[#6E6E73]" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white border border-black/[0.06] p-3 rounded-2xl text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
          >
            <div className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider">
              {item.label}
            </div>
            <div className={`text-xl font-semibold mt-0.5 tabular-nums ${item.color}`}>
              {item.count}
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table List */}
      <div className="bg-white border border-black/[0.06] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        {orders.length === 0 ? (
          /* Designed Empty State */
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-black/[0.04] text-[#6E6E73] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-semibold text-[#1D1D1F]">No Orders Found</div>
              <p className="text-xs text-[#6E6E73] mt-1 max-w-sm mx-auto">
                No orders have been submitted yet. New customer orders will appear here automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-[#F5F5F7] border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] z-10">
                  <th className="py-3 px-4">Order No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items & Prep</th>
                  <th className="py-3 px-4">Delivery Zone</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] text-sm">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#1E88E5]">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                        {order.orderNo}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1D1D1F]">{order.customerName}</div>
                      <div className="text-xs font-mono text-[#6E6E73]">{order.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs space-y-1">
                        {order.items.map((it) => (
                          <div key={it.id} className="text-[#1D1D1F]">
                            {it.productName} ({it.packLabel}) × {it.quantity}
                            {it.prepName && (
                              <span className="ml-1.5 text-[10px] font-semibold text-[#1E88E5] bg-[#1E88E5]/10 px-1.5 py-0.5 rounded">
                                {it.prepName}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[#1D1D1F]">
                      <div>{order.city}</div>
                      <div className="text-[#6E6E73]">{order.zone.name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold tabular-nums text-[#1D1D1F]">
                      {formatMoney(order.totalCents)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === "DELIVERED"
                            ? "bg-[#2E7D32]/10 text-[#2E7D32]"
                            : order.status === "DISPATCHED"
                            ? "bg-indigo-100 text-indigo-800"
                            : order.status === "PACKED"
                            ? "bg-purple-100 text-purple-800"
                            : order.status === "CONFIRMED"
                            ? "bg-[#1E88E5]/10 text-[#1E88E5]"
                            : order.status === "PLACED"
                            ? "bg-[#B26A00]/10 text-[#B26A00]"
                            : "bg-black/[0.05] text-[#6E6E73]"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-black/[0.06] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#6E6E73]" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
