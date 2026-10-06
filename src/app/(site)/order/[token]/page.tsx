import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { Truck, MessageCircle, Calendar } from "lucide-react";

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
    if (process.env.DEMO_MODE !== "true") {
      throw err;
    }
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

  const formattedDate = new Date(order.deliveryDate).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Colombo",
  });

  const whatsappMessage = encodeURIComponent(
    `Hello Freshy.lk! I have a question regarding my order ${order.orderNo}.`
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-24 md:pb-12 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE8F0] pb-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1B9AE4]">Order Confirmation</span>
            <h1 className="font-heading text-3xl font-extrabold text-[#0D2137] mt-0.5">{order.orderNo}</h1>
            <p className="text-xs text-[#0D2137]/60 mt-1">
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
                  : "bg-[#E8F4FE] text-[#1B9AE4]"
              }`}
            >
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </span>

            <a
              href={`https://wa.me/94771234567?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:bg-[#20bd5a] transition-colors shadow-xs"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp Help</span>
            </a>
          </div>
        </div>

        {/* Delivery Cut-Off Rule Confirmation Badge */}
        <div className="bg-[#E8F4FE]/60 border border-[#1B9AE4]/20 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#0D2137] mb-6">
          <div className="flex items-center space-x-2 font-bold">
            <Truck className="h-4 w-4 text-[#1B9AE4]" />
            <span>Scheduled Delivery: {formattedDate}</span>
          </div>
          <p className="text-[11px] text-[#0D2137]/70">
            Cut-off Rule: Order before 12 PM for same-day delivery in selected areas, after 12 PM for next-day.
          </p>
        </div>

        {/* Status Timeline Progress Bar */}
        {!isCancelled && (
          <div className="py-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0D2137]/60 mb-4">
              Delivery Progress
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
              {statusSteps.map((step, idx) => {
                const isCompleted = currentStatusIndex >= idx;
                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-colors ${
                        isCompleted ? "bg-[#1B9AE4] text-white" : "bg-gray-100 text-[#0D2137]/40"
                      }`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isCompleted ? "text-[#0D2137] font-bold" : "text-[#0D2137]/50"
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Order Items */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl shadow-xs">
            <h2 className="font-heading text-xl font-bold text-[#0D2137] mb-4 border-b border-[#DDE8F0] pb-3">
              Order Items
            </h2>

            <div className="divide-y divide-[#DDE8F0]">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between gap-4 text-xs">
                  <div>
                    <div className="font-bold text-[#0D2137]">
                      {item.productName} ({item.packLabel}) x {item.quantity}
                    </div>
                    {item.prepName && (
                      <div className="text-[11px] text-[#1B9AE4] font-bold mt-0.5">
                        Prep Instruction: {item.prepName}
                      </div>
                    )}
                    <div className="text-[11px] text-[#0D2137]/60 mt-0.5">
                      Rate: {formatMoney(item.pricePerKgCents)} / kg
                    </div>
                  </div>
                  <div className="text-right font-bold text-[#0D2137]">
                    {formatMoney(item.lineTotalCents + item.prepFeeCents)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#DDE8F0] pt-4 mt-2 space-y-2 text-xs text-[#0D2137]">
              <div className="flex justify-between text-[#0D2137]/70">
                <span>Subtotal</span>
                <span className="font-bold text-[#0D2137]">{formatMoney(order.subtotalCents)}</span>
              </div>
              {order.prepTotalCents > 0 && (
                <div className="flex justify-between text-[#0D2137]/70">
                  <span>Preparation Total</span>
                  <span className="font-bold text-[#0D2137]">{formatMoney(order.prepTotalCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#0D2137]/70">
                <span>Delivery Fee ({order.zone.name})</span>
                <span className="font-bold text-[#0D2137]">{formatMoney(order.deliveryFeeCents)}</span>
              </div>
              <div className="border-t border-[#DDE8F0] pt-3 flex justify-between items-baseline font-bold text-base text-[#0D2137]">
                <span>Total</span>
                <span className="text-xl font-extrabold text-[#0D2137]">{formatMoney(order.totalCents)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Delivery Details */}
        <div className="md:col-span-5 space-y-6">
          {/* Bank Transfer Box */}
          {order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus !== "PAID" && (
            <div className="bg-amber-50 border border-amber-300 p-6 rounded-2xl shadow-xs text-amber-950 space-y-3">
              <div className="flex items-center gap-2 font-bold text-base text-amber-900">
                <span>🏦</span> Bank Transfer Details
              </div>
              <p className="text-xs leading-relaxed">
                Please transfer <strong>{formatMoney(order.totalCents)}</strong> using Order Number{" "}
                <strong className="underline">{order.orderNo}</strong> as the payment reference.
              </p>
              <div className="bg-white/90 p-3 rounded-xl text-xs space-y-1 font-mono border border-amber-200">
                <div>Bank: Commercial Bank of Ceylon</div>
                <div>Account: Freshy LK (Pvt) Ltd</div>
                <div>Account No: 1000200300</div>
              </div>
            </div>
          )}

          {/* Delivery Address Details */}
          <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl shadow-xs space-y-3">
            <h3 className="font-heading text-lg font-bold text-[#0D2137] border-b border-[#DDE8F0] pb-2">
              Delivery Details
            </h3>

            <div className="text-xs space-y-1.5 text-[#0D2137]">
              <div className="font-bold text-sm">{order.customerName}</div>
              <div>{order.phone}</div>
              {order.email && <div className="text-[#0D2137]/70">{order.email}</div>}
              <div className="text-[#0D2137]/80 pt-1">
                {order.addressLine1}
                {order.addressLine2 ? `, ${order.addressLine2}` : ""}
              </div>
              <div className="text-[#0D2137]/80">
                {order.city}, {order.district} District
              </div>
              <div className="pt-2 text-xs font-bold text-[#27A04E] flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Delivery: {formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
