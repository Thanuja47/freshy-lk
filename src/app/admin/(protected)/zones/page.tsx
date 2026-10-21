"use client";

import { useState, useEffect } from "react";
import { Clock, Save, Check, Truck, Loader2, Plus, X, Trash2 } from "lucide-react";
import { getDeliveryCutoffMessage } from "@/lib/delivery";
import { getZones, updateZoneAction, createZoneAction, deleteZoneAction } from "@/actions/zones";

interface AdminZone {
  id: string;
  name: string;
  districts: string[];
  cutoffTime: string;
  sameDayAvailable: boolean;
  leadDays: number;
  maxSameDayOrders: number | null;
  currentSameDayOrders: number;
  baseFeeCents: number;
}

const SRI_LANKA_DISTRICTS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle",
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
  const [zones, setZones] = useState<AdminZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingZoneId, setSavingZoneId] = useState<string | null>(null);
  const [savedZoneId, setSavedZoneId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add Zone Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [newCutoffTime, setNewCutoffTime] = useState("12:00");
  const [newSameDay, setNewSameDay] = useState(true);
  const [newLeadDays, setNewLeadDays] = useState(1);
  const [newMaxOrders, setNewMaxOrders] = useState<string>("");
  const [newBaseFeeLkr, setNewBaseFeeLkr] = useState("450");

  useEffect(() => {
    async function fetchZones() {
      try {
        const data = await getZones();
        setZones(
          data.map((z) => ({
            id: z.id,
            name: z.name,
            districts: z.districts,
            cutoffTime: z.cutoffTime,
            sameDayAvailable: z.sameDayAvailable,
            leadDays: z.leadDays,
            maxSameDayOrders: z.maxSameDayOrders,
            currentSameDayOrders: z.currentSameDayOrders,
            baseFeeCents: z.baseFeeCents,
          }))
        );
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load delivery zones");
      } finally {
        setIsLoading(false);
      }
    }
    fetchZones();
  }, []);

  const updateZone = (id: string, updates: Partial<AdminZone>) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, ...updates } : z))
    );
  };

  const handleSave = async (zone: AdminZone) => {
    setSavingZoneId(zone.id);
    setErrorMessage(null);
    try {
      const res = await updateZoneAction({
        id: zone.id,
        cutoffTime: zone.cutoffTime,
        sameDayAvailable: zone.sameDayAvailable,
        leadDays: zone.leadDays,
        maxSameDayOrders: zone.maxSameDayOrders,
        baseFeeCents: zone.baseFeeCents,
      });

      if (res.success) {
        setSavedZoneId(zone.id);
        setTimeout(() => setSavedZoneId(null), 3000);
      } else {
        setErrorMessage(res.message || "Failed to update zone.");
      }
    } catch {
      setErrorMessage("Network error saving zone.");
    } finally {
      setSavingZoneId(null);
    }
  };

  const handleDelete = async (zoneId: string, zoneName: string) => {
    if (!confirm(`Are you sure you want to remove delivery zone "${zoneName}"?`)) return;

    try {
      const res = await deleteZoneAction(zoneId);
      if (res.success) {
        setZones((prev) => prev.filter((z) => z.id !== zoneId));
      } else {
        alert(res.message || "Failed to delete zone");
      }
    } catch (err) {
      alert("Error deleting zone: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleToggleDistrict = (district: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(district) ? prev.filter((d) => d !== district) : [...prev, district]
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) {
      alert("Please enter a zone name.");
      return;
    }
    if (selectedDistricts.length === 0) {
      alert("Please select at least one district for this delivery zone.");
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    const baseFeeCents = Math.round(parseFloat(newBaseFeeLkr || "0") * 100);
    const maxSameDayOrders = newMaxOrders ? parseInt(newMaxOrders, 10) : null;

    try {
      const res = await createZoneAction({
        name: newZoneName.trim(),
        districts: selectedDistricts,
        cutoffTime: newCutoffTime,
        sameDayAvailable: newSameDay,
        leadDays: newLeadDays,
        maxSameDayOrders,
        baseFeeCents,
      });

      if (res.success && res.zone) {
        const createdZone: AdminZone = {
          id: res.zone.id,
          name: res.zone.name,
          districts: res.zone.districts,
          cutoffTime: res.zone.cutoffTime,
          sameDayAvailable: res.zone.sameDayAvailable,
          leadDays: res.zone.leadDays,
          maxSameDayOrders: res.zone.maxSameDayOrders,
          currentSameDayOrders: res.zone.currentSameDayOrders,
          baseFeeCents: res.zone.baseFeeCents,
        };
        setZones((prev) => [...prev, createdZone]);
        setIsAddModalOpen(false);
        // Reset form
        setNewZoneName("");
        setSelectedDistricts([]);
        setNewCutoffTime("12:00");
        setNewSameDay(true);
        setNewLeadDays(1);
        setNewMaxOrders("");
        setNewBaseFeeLkr("450");
      } else {
        alert(res.message || "Failed to create delivery zone.");
      }
    } catch (err) {
      alert("Error creating delivery zone: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-[#6E6E73] text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-[#1E88E5]" />
          Loading delivery zones...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            Configure cut-off times, same-day availability, lead days, and daily order caps. All changes persist directly to Supabase with full audit history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#1E88E5] text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-[#1565C0] transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Delivery Zone</span>
        </button>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {errorMessage}
        </div>
      )}

      {/* Add Zone Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-black/[0.08] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h2 className="text-lg font-semibold text-[#1D1D1F]">Add Delivery Zone</h2>
                <p className="text-xs text-[#6E6E73]">Define a delivery coverage area, cutoff rules, and base fees</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/[0.06] text-[#6E6E73] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-medium text-[#1D1D1F]">
              <div>
                <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                  Zone Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Northern Province Express"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                />
              </div>

              <div>
                <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1.5">
                  Coverage Districts * (Select at least 1)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#F5F5F7] rounded-xl border border-black/[0.08]">
                  {SRI_LANKA_DISTRICTS.map((d) => {
                    const isSelected = selectedDistricts.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleToggleDistrict(d)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#1E88E5] text-white shadow-xs"
                            : "bg-white text-[#1D1D1F] border border-black/[0.06] hover:bg-black/[0.04]"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {d}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#6E6E73] mt-1">
                  Selected: {selectedDistricts.length > 0 ? selectedDistricts.join(", ") : "None"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                    Cut-off Time (24h)
                  </label>
                  <input
                    type="time"
                    required
                    value={newCutoffTime}
                    onChange={(e) => setNewCutoffTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                    Same-Day Delivery
                  </label>
                  <select
                    value={newSameDay ? "true" : "false"}
                    onChange={(e) => setNewSameDay(e.target.value === "true")}
                    className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                  >
                    <option value="true">Enabled (Same-Day)</option>
                    <option value="false">Disabled (Next-Day)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                    Lead Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="14"
                    value={newLeadDays}
                    onChange={(e) => setNewLeadDays(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                    Base Fee (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={newBaseFeeLkr}
                    onChange={(e) => setNewBaseFeeLkr(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                    Daily Cap
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={newMaxOrders}
                    onChange={(e) => setNewMaxOrders(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E6E73] hover:bg-black/[0.06] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-[#1E88E5] text-white rounded-xl text-xs font-semibold hover:bg-[#1565C0] transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Zone</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zone Cards */}
      <div className="space-y-5">
        {zones.map((zone) => {
          const previewMessage = getDeliveryCutoffMessage({
            id: zone.id,
            name: zone.name,
            districts: zone.districts,
            baseFeeCents: zone.baseFeeCents,
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
          const isSaving = savingZoneId === zone.id;
          const capUsedPct =
            zone.maxSameDayOrders && zone.sameDayAvailable
              ? Math.min(100, Math.round((zone.currentSameDayOrders / zone.maxSameDayOrders) * 100))
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
              {/* Card Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "20px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      background: "#E3F2FD",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Truck style={{ width: 18, height: 18, color: "#1E88E5", strokeWidth: 1.75 }} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontFamily: "-apple-system, 'SF Pro Text', Inter, system-ui, sans-serif",
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#1D1D1F",
                        margin: 0,
                      }}
                    >
                      {zone.name}
                    </h2>
                    <p style={{ fontSize: "12px", color: "#6E6E73", margin: "2px 0 0" }}>
                      {zone.districts.join(" · ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave(zone)}
                    disabled={isSaving}
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
                      cursor: isSaving ? "not-allowed" : "pointer",
                      opacity: isSaving ? 0.7 : 1,
                      flexShrink: 0,
                      transition: "background 0.2s",
                    }}
                  >
                    {isSaved ? (
                      <>
                        <Check style={{ width: 14, height: 14 }} />
                        Saved
                      </>
                    ) : isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save style={{ width: 14, height: 14 }} />
                        Save Zone
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(zone.id, zone.name)}
                    className="p-2 text-[#C62828] hover:bg-[#C62828]/10 rounded-xl transition-colors cursor-pointer"
                    title="Delete or deactivate zone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form Controls Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                {/* Cut-off Time */}
                <div>
                  <label style={fieldLabelStyle}>Cut-off Time (Asia/Colombo)</label>
                  <input
                    type="time"
                    value={zone.cutoffTime}
                    onChange={(e) => updateZone(zone.id, { cutoffTime: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                {/* Same-Day Toggle */}
                <div>
                  <label style={fieldLabelStyle}>Same-Day Delivery</label>
                  <select
                    value={zone.sameDayAvailable ? "true" : "false"}
                    onChange={(e) =>
                      updateZone(zone.id, { sameDayAvailable: e.target.value === "true" })
                    }
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled (Next-Day)</option>
                  </select>
                </div>

                {/* Lead Days */}
                <div>
                  <label style={fieldLabelStyle}>Lead Days</label>
                  <input
                    type="number"
                    min="0"
                    max="14"
                    value={zone.leadDays}
                    onChange={(e) =>
                      updateZone(zone.id, { leadDays: parseInt(e.target.value, 10) || 0 })
                    }
                    style={inputStyle}
                  />
                </div>

                {/* Daily Order Cap */}
                <div>
                  <label style={fieldLabelStyle}>Daily Order Cap</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={zone.maxSameDayOrders ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : null;
                      updateZone(zone.id, { maxSameDayOrders: val });
                    }}
                    style={inputStyle}
                  />
                </div>

                {/* Base Fee */}
                <div>
                  <label style={fieldLabelStyle}>Base Fee (LKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={Math.round(zone.baseFeeCents / 100)}
                    onChange={(e) => {
                      const lkr = parseInt(e.target.value, 10) || 0;
                      updateZone(zone.id, { baseFeeCents: lkr * 100 });
                    }}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Progress Bar if Daily Cap is Set */}
              {capUsedPct !== null && (
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#6E6E73",
                      marginBottom: "4px",
                    }}
                  >
                    <span>Same-day capacity used</span>
                    <span>
                      {zone.currentSameDayOrders} / {zone.maxSameDayOrders} orders ({capUsedPct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "#E5E5EA",
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
    </div>
  );
}
