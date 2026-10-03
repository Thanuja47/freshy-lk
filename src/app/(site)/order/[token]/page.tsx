import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export interface OrderPageProps {
  params: Promise<{ token: string }>;
}

export const dynamic = "force-dynamic";

export default async function OrderTokenPage({ params }: OrderPageProps) {
  const { token } = await params;

  let order = null;

  try {
    order = await db.order.findUnique({
      where: { trackingToken: token },
      include: {
        items: true,
        zone: true,
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (err) {
    console.warn("DB offline in OrderTokenPage fallback:", err);
  }

  if (!order) {
    notFound();
  }

  const statusSteps = [
    { key: "PENDING_PAYMENT", label: "Order Received" },
    { key: "PLACED", label: "Order Placed" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "PACKED", label: "Packed Chilled" },
    { key: "DISPATCHED", label: "Dispatched" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  const currentStatusIndex = statusSteps.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "CANCELLED";

  const whatsappMessage = encodeURIComponent(
    `Hello Freshy.lk! I have a question regarding my order ${order.orderNo}.`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="bg-white border border-sand p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand pb-4 mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-tide">Order Confirmation</span>
            <h1 className="font-serif text-3xl font-bold text-sea-ink mt-0.5">{order.orderNo}</h1>
            <p className="text-xs text-sea-ink/60 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-LK", { dateStyle: "medium" })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isCancelled
                  ? "bg-red-100 text-red-800"
                  : order.status === "DELIVERED"
                  ? "bg-green-100 text-green-800"
                  : "bg-sea-glass text-tide"
              }`}
            >
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </span>

            <a
              href={`https://wa.me/94771234567?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
            >
              <span>💬</span> Need Help?
            </a>
          </div>
        </div>

        {/* Status Timeline Progress Bar */}
        {!isCancelled && (
          <div className="py-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-4">
              Delivery Progress
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
              {statusSteps.map((step, idx) => {
                const isCompleted = currentStatusIndex >= idx;
                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-colors ${
                        isCompleted ? "bg-tide text-white" : "bg-sand/60 text-sea-ink/40"
                      }`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isCompleted ? "text-sea-ink font-semibold" : "text-sea-ink/50"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Order Items */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white border border-sand p-6 rounded-xl shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-sea-ink mb-4 border-b border-sand pb-3">
              Order Items
            </h2>

            <div className="divide-y divide-sand/50">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between gap-4">
                  <div>
                    <div className="font-semibold text-sea-ink">
                      {item.productName} ({item.packLabel}) x {item.quantity}
                    </div>
                    {item.prepName && (
                      <div className="text-xs text-tide font-bold mt-0.5">
                        Prep Instruction: {item.prepName}
                      </div>
                    )}
                    <div className="text-xs text-sea-ink/60 mt-0.5">
                      Rate: {formatMoney(item.pricePerKgCents)} / kg
                    </div>
                  </div>
                  <div className="text-right font-medium tabular-nums text-sea-ink">
                    {formatMoney(item.lineTotalCents + item.prepFeeCents)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-sand pt-4 mt-2 space-y-2 text-sm">
              <div className="flex justify-between text-sea-ink/70">
                <span>Subtotal</span>
                <span className="tabular-nums text-sea-ink">{formatMoney(order.subtotalCents)}</span>
              </div>
              {order.prepTotalCents > 0 && (
                <div className="flex justify-between text-sea-ink/70">
                  <span>Preparation Total</span>
                  <span className="tabular-nums text-sea-ink">{formatMoney(order.prepTotalCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-sea-ink/70">
                <span>Delivery Fee ({order.zone.name})</span>
                <span className="tabular-nums text-sea-ink">{formatMoney(order.deliveryFeeCents)}</span>
              </div>
              <div className="border-t border-sand pt-3 flex justify-between items-baseline font-bold text-base text-sea-ink">
                <span>Total Paid / Due</span>
                <span className="tabular-nums text-xl text-coral">{formatMoney(order.totalCents)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bank Info / Delivery Address */}
        <div className="md:col-span-5 space-y-6">
          {/* Bank Transfer Information Box */}
          {order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus !== "PAID" && (
            <div className="bg-amber-50 border border-amber-300 p-6 rounded-xl shadow-sm text-amber-950 space-y-3">
              <div className="flex items-center gap-2 font-bold text-base text-amber-900">
                <span>🏦</span> Bank Transfer Instructions
              </div>
              <p className="text-xs leading-relaxed">
                Please transfer <strong>{formatMoney(order.totalCents)}</strong> using your Order Number{" "}
                <strong className="underline">{order.orderNo}</strong> as the payment reference.
              </p>
              <div className="bg-white/80 p-3 rounded-md text-xs space-y-1 font-mono border border-amber-200">
                <div>Bank: Commercial Bank of Ceylon</div>
                <div>Account Name: Freshy Seafood Pvt Ltd</div>
                <div>Account No: 8001234567</div>
                <div>Branch: Colombo Fort</div>
              </div>
              <p className="text-xs text-amber-900/80">
                Once paid, your order will be confirmed upon verification of deposit.
              </p>
            </div>
          )}

          {/* Delivery Address Details */}
          <div className="bg-white border border-sand p-6 rounded-xl shadow-sm space-y-3">
            <h3 className="font-serif text-lg font-semibold text-sea-ink border-b border-sand pb-2">
              Delivery Details
            </h3>

            <div className="text-sm space-y-1 text-sea-ink">
              <div className="font-semibold">{order.customerName}</div>
              <div>{order.phone}</div>
              {order.email && <div className="text-sea-ink/70">{order.email}</div>}
              <div className="text-sea-ink/80 pt-2">
                {order.addressLine1}
                {order.addressLine2 ? `, ${order.addressLine2}` : ""}
              </div>
              <div className="text-sea-ink/80">
                {order.city}, {order.district} District
              </div>
              <div className="pt-2 text-xs font-semibold text-tide">
                Delivery Date: {new Date(order.deliveryDate).toLocaleDateString("en-LK", { dateStyle: "full" })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
