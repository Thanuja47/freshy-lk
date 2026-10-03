import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import OrderDetailActions from "./OrderDetailActions";

export interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  let order = null;

  try {
    order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        zone: true,
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (err) {
    if (process.env.DEMO_MODE !== "true") {
      throw err;
    }
    console.warn("DB offline in AdminOrderDetailPage fallback:", err);
  }

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="text-xs text-tide hover:underline flex items-center gap-1 mb-1 font-semibold"
          >
            ← Back to Orders List
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold text-sea-ink">{order.orderNo}</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
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
          </div>
        </div>

        {/* Action Controls Client Component */}
        <OrderDetailActions orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Order Items */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-sand p-6 rounded-xl shadow-sm">
            <h2 className="font-serif text-xl font-bold text-sea-ink border-b border-sand pb-3 mb-4">
              Itemized Order Summary
            </h2>

            <div className="divide-y divide-sand/50">
              {order.items.map((item) => (
                <div key={item.id} className="py-3.5 flex justify-between items-start gap-4">
                  <div>
                    <div className="font-bold text-sea-ink text-base">
                      {item.productName} ({item.packLabel}) x {item.quantity}
                    </div>
                    {item.prepName && (
                      <div className="text-xs bg-tide/10 text-tide font-bold inline-block px-2 py-0.5 rounded mt-1">
                        Prep Instruction: {item.prepName}
                      </div>
                    )}
                    <div className="text-xs text-sea-ink/60 mt-1">
                      Rate: {formatMoney(item.pricePerKgCents)} / kg
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold tabular-nums text-sea-ink">
                    {formatMoney(item.lineTotalCents + item.prepFeeCents)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-sand pt-4 mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-sea-ink/70">
                <span>Fish Goods Subtotal</span>
                <span className="tabular-nums font-mono text-sea-ink">{formatMoney(order.subtotalCents)}</span>
              </div>
              {order.prepTotalCents > 0 && (
                <div className="flex justify-between text-sea-ink/70">
                  <span>Prep Fees Total</span>
                  <span className="tabular-nums font-mono text-sea-ink">{formatMoney(order.prepTotalCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-sea-ink/70">
                <span>Delivery Fee ({order.zone.name})</span>
                <span className="tabular-nums font-mono text-sea-ink">{formatMoney(order.deliveryFeeCents)}</span>
              </div>
              <div className="border-t border-sand pt-3 flex justify-between items-baseline font-bold text-base text-sea-ink">
                <span>Total Order Amount</span>
                <span className="tabular-nums text-xl font-mono text-coral">{formatMoney(order.totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Status Events History */}
          <div className="bg-white border border-sand p-6 rounded-xl shadow-sm space-y-3">
            <h3 className="font-serif text-lg font-bold text-sea-ink border-b border-sand pb-2">
              Status Event History
            </h3>
            <div className="space-y-2 text-xs">
              {order.events.map((evt) => (
                <div key={evt.id} className="p-2.5 bg-ice border border-sand/50 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-bold text-tide">{ORDER_STATUS_LABELS[evt.toStatus] || evt.toStatus}</span>
                    {evt.note && <span className="text-sea-ink/70 ml-2">— {evt.note}</span>}
                  </div>
                  <span className="font-mono text-sea-ink/50">
                    {new Date(evt.createdAt).toLocaleString("en-LK")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Delivery Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-sand p-6 rounded-xl shadow-sm space-y-3">
            <h3 className="font-serif text-lg font-bold text-sea-ink border-b border-sand pb-2">
              Customer Information
            </h3>
            <div className="text-sm space-y-1.5 text-sea-ink">
              <div className="font-semibold">{order.customerName}</div>
              <div className="font-mono text-xs">{order.phone}</div>
              {order.email && <div className="text-sea-ink/70 text-xs">{order.email}</div>}
              {order.companyName && (
                <div className="pt-2 text-xs font-medium text-sea-ink/80 border-t border-sand/50 mt-2">
                  Company: {order.companyName}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-sand p-6 rounded-xl shadow-sm space-y-3">
            <h3 className="font-serif text-lg font-bold text-sea-ink border-b border-sand pb-2">
              Delivery Destination
            </h3>
            <div className="text-sm space-y-1 text-sea-ink">
              <div>{order.addressLine1}</div>
              {order.addressLine2 && <div>{order.addressLine2}</div>}
              <div className="font-semibold">{order.city}, {order.district} District</div>
              <div className="text-xs text-sea-ink/60 pt-1">Zone: {order.zone.name}</div>
              <div className="pt-2 text-xs font-bold text-tide">
                Requested Delivery Date: {new Date(order.deliveryDate).toLocaleDateString("en-LK", { dateStyle: "full" })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
