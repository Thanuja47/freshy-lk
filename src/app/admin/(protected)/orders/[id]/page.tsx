import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import OrderDetailActions from "./OrderDetailActions";
import { ArrowLeft, User, MapPin, ClipboardList, Clock } from "lucide-react";

export interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

const STATUS_CHIP: Record<string, { bg: string; text: string }> = {
  DELIVERED:  { bg: "#E8F5E9", text: "#2E7D32" },
  DISPATCHED: { bg: "#E8EAF6", text: "#283593" },
  PACKED:     { bg: "#EDE7F6", text: "#4527A0" },
  CONFIRMED:  { bg: "#E3F2FD", text: "#1565C0" },
  PLACED:     { bg: "#FFF3E0", text: "#B26A00" },
  CANCELLED:  { bg: "rgba(0,0,0,0.06)", text: "#6E6E73" },
};

function statusChipStyle(status: string) {
  return STATUS_CHIP[status] ?? { bg: "rgba(0,0,0,0.06)", text: "#6E6E73" };
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "-apple-system, 'SF Pro Text', Inter, system-ui, sans-serif",
  fontSize: "15px",
  fontWeight: 600,
  color: "#1D1D1F",
  margin: "0 0 16px",
  paddingBottom: "12px",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

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

  const chip = statusChipStyle(order.status);

  return (
    <div style={{ maxWidth: "1000px" }} className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1E88E5",
              textDecoration: "none",
              marginBottom: "6px",
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Back to Orders
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1
              style={{
                fontFamily: "-apple-system, 'SF Pro Text', Inter, system-ui, sans-serif",
                fontSize: "28px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#1D1D1F",
                margin: 0,
              }}
            >
              {order.orderNo}
            </h1>
            <span
              style={{
                padding: "5px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                background: chip.bg,
                color: chip.text,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
        </div>

        {/* Action Controls Client Component */}
        <OrderDetailActions orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Order Items + Events */}
        <div className="lg:col-span-7 space-y-5">
          {/* Items */}
          <div style={cardStyle}>
            <h2 style={sectionHeadingStyle}>
              <ClipboardList style={{ width: 16, height: 16, color: "#1E88E5", strokeWidth: 1.75 }} />
              Order Items
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {order.items.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    padding: "14px 0",
                    borderBottom: idx < order.items.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "#1D1D1F", fontSize: "14px" }}>
                      {item.productName}{" "}
                      <span style={{ fontWeight: 400, color: "#6E6E73" }}>
                        ({item.packLabel}) &times; {item.quantity}
                      </span>
                    </div>
                    {item.prepName && (
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "4px",
                          background: "#E3F2FD",
                          color: "#1565C0",
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        Prep: {item.prepName}
                      </span>
                    )}
                    <div style={{ fontSize: "12px", color: "#6E6E73", marginTop: "4px" }}>
                      {formatMoney(item.pricePerKgCents)} / kg
                    </div>
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                      fontFamily: "monospace",
                      fontSize: "14px",
                      color: "#1D1D1F",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatMoney(item.lineTotalCents + item.prepFeeCents)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div
              style={{
                paddingTop: "16px",
                marginTop: "4px",
                borderTop: "1px solid rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6E6E73" }}>
                <span>Items Subtotal</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontFamily: "monospace", color: "#1D1D1F" }}>
                  {formatMoney(order.subtotalCents)}
                </span>
              </div>
              {order.prepTotalCents > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#6E6E73" }}>
                  <span>Prep Fees</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", fontFamily: "monospace", color: "#1D1D1F" }}>
                    {formatMoney(order.prepTotalCents)}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6E6E73" }}>
                <span>Delivery ({order.zone.name})</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontFamily: "monospace", color: "#1D1D1F" }}>
                  {formatMoney(order.deliveryFeeCents)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  paddingTop: "12px",
                  borderTop: "1px solid rgba(0,0,0,0.06)",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "#1D1D1F",
                }}
              >
                <span>Total</span>
                <span
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    fontFamily: "monospace",
                    fontSize: "20px",
                    color: "#C62828",
                  }}
                >
                  {formatMoney(order.totalCents)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Events */}
          <div style={cardStyle}>
            <h3 style={sectionHeadingStyle}>
              <Clock style={{ width: 16, height: 16, color: "#1E88E5", strokeWidth: 1.75 }} />
              Status History
            </h3>
            {order.events.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#6E6E73" }}>No events recorded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {order.events.map((evt) => {
                  const evtChip = statusChipStyle(evt.toStatus);
                  return (
                    <div
                      key={evt.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        background: "#F5F5F7",
                        borderRadius: "10px",
                        fontSize: "13px",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            background: evtChip.bg,
                            color: evtChip.text,
                            fontWeight: 700,
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ORDER_STATUS_LABELS[evt.toStatus] || evt.toStatus}
                        </span>
                        {evt.note && <span style={{ color: "#6E6E73" }}>{evt.note}</span>}
                      </div>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "11px",
                          color: "#6E6E73",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {new Date(evt.createdAt).toLocaleString("en-LK")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer & Delivery */}
        <div className="lg:col-span-5 space-y-5">
          {/* Customer */}
          <div style={cardStyle}>
            <h3 style={sectionHeadingStyle}>
              <User style={{ width: 16, height: 16, color: "#1E88E5", strokeWidth: 1.75 }} />
              Customer
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
              <div style={{ fontWeight: 600, color: "#1D1D1F" }}>{order.customerName}</div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  color: "#6E6E73",
                }}
              >
                {order.phone}
              </div>
              {order.email && (
                <div style={{ fontSize: "13px", color: "#6E6E73" }}>{order.email}</div>
              )}
              {order.companyName && (
                <div
                  style={{
                    paddingTop: "8px",
                    borderTop: "1px solid rgba(0,0,0,0.06)",
                    fontSize: "13px",
                    color: "#1D1D1F",
                    fontWeight: 500,
                  }}
                >
                  {order.companyName}
                </div>
              )}
            </div>
          </div>

          {/* Delivery */}
          <div style={cardStyle}>
            <h3 style={sectionHeadingStyle}>
              <MapPin style={{ width: 16, height: 16, color: "#1E88E5", strokeWidth: 1.75 }} />
              Delivery
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: "#1D1D1F" }}>
              <div>{order.addressLine1}</div>
              {order.addressLine2 && <div>{order.addressLine2}</div>}
              <div style={{ fontWeight: 600 }}>
                {order.city}, {order.district} District
              </div>
              <div style={{ fontSize: "12px", color: "#6E6E73", marginTop: "2px" }}>
                Zone: {order.zone.name}
              </div>
              <div
                style={{
                  marginTop: "10px",
                  paddingTop: "10px",
                  borderTop: "1px solid rgba(0,0,0,0.06)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1E88E5",
                }}
              >
                Delivery Date:{" "}
                {new Date(order.deliveryDate).toLocaleDateString("en-LK", {
                  dateStyle: "full",
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
