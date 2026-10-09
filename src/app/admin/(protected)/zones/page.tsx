"use client";

import { useState } from "react";
import { Clock, Save, Check, Truck, AlertCircle } from "lucide-react";
import { getDeliveryCutoffMessage } from "@/lib/delivery";

interface AdminZone {
  id: string;
  name: string;
  districts: string[];
  cutoffTime: string;
  sameDayAvailable: boolean;
  leadDays: number;
  maxSameDayOrders: number | null;
  currentSameDayOrders: number;
}

const SAMPLE_ZONES: AdminZone[] = [
  {
    id: "zone-colombo",
    name: "Colombo & Suburbs",
    districts: ["Colombo", "Gampaha", "Kalutara"],
    cutoffTime: "12:00",
    sameDayAvailable: true,
    leadDays: 0,
    maxSameDayOrders: 50,
    currentSameDayOrders: 12,
  },
  {
    name: "Western & Southern Outstation",
    id: "zone-outstation",
    districts: ["Galle", "Matara", "Kurunegala", "Kandy"],
    cutoffTime: "12:00",
    sameDayAvailable: false,
    leadDays: 1,
    maxSameDayOrders: null,
    currentSameDayOrders: 0,
  },
];

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#1D1D1F",
  marginBottom: "6px",
  fontFamily: "-apple-system, 'SF Pro Text', Inter, system-ui, sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "40px",
  padding: "0 12px",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: 600,
  color: "#1D1D1F",
  background: "#F5F5F7",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "-apple-system, 'SF Pro Text', Inter, system-ui, sans-serif",
};

export default function AdminZonesPage() {
  const [zones, setZones] = useState<AdminZone[]>(SAMPLE_ZONES);
  const [savedZoneId, setSavedZoneId] = useState<string | null>(null);

  const updateZone = (id: string, updates: Partial<AdminZone>) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, ...updates } : z))
    );
  };

  const handleSave = (zoneId: string, zoneName: string) => {
    setSavedZoneId(zoneId);
    setTimeout(() => setSavedZoneId(null), 3000);
    console.log(`Saving zone: ${zoneName}`);
  };

  return (
    <div style={{ maxWidth: "900px" }} className="space-y-6">
      {/* Page Header */}
      <div>
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
          Delivery Zones
        </h1>
        <p style={{ fontSize: "14px", color: "#6E6E73", marginTop: "4px" }}>
          Configure cut-off times, same-day availability, lead days, and daily order caps.
        </p>
      </div>

      <div className="space-y-5">
        {zones.map((zone) => {
          const previewMessage = getDeliveryCutoffMessage({
            id: zone.id,
            name: zone.name,
            districts: zone.districts,
            baseFeeCents: 35000,
            perKgFeeCents: 5000,
            freeOverCents: null,
            minOrderCents: 0,
            leadDays: zone.leadDays,
            cutoffTime: zone.cutoffTime,
            sameDayAvailable: zone.sameDayAvailable,
            maxSameDayOrders: zone.maxSameDayOrders,
            currentSameDayOrders: zone.currentSameDayOrders,
            deliveryWeekdays: [1, 2, 3, 4, 5, 6],
            allowedStorage: ["FRESH"],
            etaMinDays: 1,
            etaMaxDays: 2,
            isActive: true,
          });

          const isSaved = savedZoneId === zone.id;
          const capUsedPct =
            zone.maxSameDayOrders && zone.sameDayAvailable
              ? Math.round((zone.currentSameDayOrders / zone.maxSameDayOrders) * 100)
              : null;

          return (
            <div
              key={zone.id}
              style={{
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              {/* Zone header */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "20px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "12px",
                      background: "#E3F2FD",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Truck style={{ width: 20, height: 20, color: "#1E88E5", strokeWidth: 1.75 }} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#1D1D1F",
                        margin: "0 0 3px",
                        fontFamily: "-apple-system, 'SF Pro Text', Inter, system-ui, sans-serif",
                      }}
                    >
                      {zone.name}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#6E6E73", margin: 0 }}>
                      {zone.districts.join(" · ")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSave(zone.id, zone.name)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: isSaved ? "#2E7D32" : "#1E88E5",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "13px",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  {isSaved ? (
                    <>
                      <Check style={{ width: 14, height: 14 }} />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save style={{ width: 14, height: 14 }} />
                      Save Zone
                    </>
                  )}
                </button>
              </div>

              {/* Fields grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                {/* Cut-off Time */}
                <div>
                  <label style={fieldLabelStyle}>Cut-off Time (Asia/Colombo)</label>
                  <input
                    id={`cutoff-${zone.id}`}
                    type="time"
                    value={zone.cutoffTime}
                    onChange={(e) => updateZone(zone.id, { cutoffTime: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                {/* Same-Day */}
                <div>
                  <label style={fieldLabelStyle}>Same-Day Delivery</label>
                  <select
                    id={`sameday-${zone.id}`}
                    value={zone.sameDayAvailable ? "true" : "false"}
                    onChange={(e) =>
                      updateZone(zone.id, {
                        sameDayAvailable: e.target.value === "true",
                        leadDays: e.target.value === "true" ? 0 : Math.max(1, zone.leadDays),
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled (Next-Day)</option>
                  </select>
                </div>

                {/* Lead Days */}
                <div>
                  <label style={fieldLabelStyle}>Lead Days</label>
                  <input
                    id={`lead-${zone.id}`}
                    type="number"
                    min={0}
                    max={7}
                    value={zone.leadDays}
                    onChange={(e) => updateZone(zone.id, { leadDays: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>

                {/* Daily Cap */}
                <div>
                  <label style={fieldLabelStyle}>Daily Order Cap</label>
                  <input
                    id={`cap-${zone.id}`}
                    type="number"
                    placeholder="Unlimited"
                    value={zone.maxSameDayOrders ?? ""}
                    onChange={(e) =>
                      updateZone(zone.id, {
                        maxSameDayOrders: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Cap usage bar */}
              {capUsedPct !== null && (
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#6E6E73",
                      marginBottom: "6px",
                    }}
                  >
                    <span>Today&apos;s orders</span>
                    <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: capUsedPct > 80 ? "#C62828" : "#1D1D1F" }}>
                      {zone.currentSameDayOrders} / {zone.maxSameDayOrders}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "rgba(0,0,0,0.06)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${capUsedPct}%`,
                        background: capUsedPct > 80 ? "#C62828" : capUsedPct > 60 ? "#B26A00" : "#2E7D32",
                        borderRadius: "4px",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Live Preview */}
              <div
                style={{
                  background: "#F0F7FF",
                  border: "1px solid rgba(30,136,229,0.15)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#1E88E5",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "8px",
                  }}
                >
                  <Clock style={{ width: 13, height: 13 }} />
                  Customer Message Preview
                </div>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "#1D1D1F" }}>
                    {previewMessage.headline}
                  </p>
                  <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#6E6E73" }}>
                    {previewMessage.subtext}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          background: "#FFF8E1",
          border: "1px solid rgba(178,106,0,0.2)",
          borderRadius: "12px",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px",
          color: "#B26A00",
        }}
      >
        <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
        Zone data shown here is sample UI. Connect DB to persist changes.{" "}
        <span style={{ fontWeight: 600 }}>UNVERIFIED-WITHOUT-DB</span>
      </div>
    </div>
  );
}
