"use client";

import { useState } from "react";
import { Clock, Save, Check } from "lucide-react";
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

export default function AdminZonesPage() {
  const [zones, setZones] = useState<AdminZone[]>(SAMPLE_ZONES);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const updateZone = (id: string, updates: Partial<AdminZone>) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, ...updates } : z))
    );
  };

  const handleSave = (zoneName: string) => {
    setSavedNotice(`Delivery settings for ${zoneName} saved successfully!`);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#0D2137]">
          Delivery Zones &amp; Cut-off Rules Manager
        </h1>
        <p className="text-xs text-[#0D2137]/70 mt-1">
          Configure daily cutoff times, same-day delivery toggles, lead days, and maximum order capacity caps.
        </p>
      </div>

      {savedNotice && (
        <div className="bg-[#27A04E]/10 text-[#27A04E] border border-[#27A04E]/20 text-xs font-bold p-3.5 rounded-xl flex items-center space-x-2 animate-fade-up">
          <Check className="h-4 w-4" />
          <span>{savedNotice}</span>
        </div>
      )}

      <div className="space-y-6">
        {zones.map((zone) => {
          const previewMessage = getDeliveryCutoffMessage(
            {
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
            }
          );

          return (
            <div
              key={zone.id}
              className="bg-white border border-[#DDE8F0] p-6 rounded-2xl shadow-xs space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE8F0] pb-4">
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#0D2137]">{zone.name}</h3>
                  <p className="text-xs text-[#0D2137]/60">Districts: {zone.districts.join(", ")}</p>
                </div>

                <button
                  onClick={() => handleSave(zone.name)}
                  className="inline-flex items-center space-x-1.5 bg-[#0D2137] hover:bg-[#1B9AE4] text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors self-start sm:self-auto shadow-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Zone Settings</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Cutoff Time */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0D2137]">
                    Cut-off Time (Asia/Colombo)
                  </label>
                  <input
                    type="time"
                    value={zone.cutoffTime}
                    onChange={(e) => updateZone(zone.id, { cutoffTime: e.target.value })}
                    className="w-full h-10 px-3 border border-[#DDE8F0] rounded-xl text-xs font-bold text-[#0D2137] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4]"
                  />
                </div>

                {/* 2. Same-Day Toggle */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0D2137]">Same-Day Delivery</label>
                  <select
                    value={zone.sameDayAvailable ? "true" : "false"}
                    onChange={(e) =>
                      updateZone(zone.id, {
                        sameDayAvailable: e.target.value === "true",
                        leadDays: e.target.value === "true" ? 0 : Math.max(1, zone.leadDays),
                      })
                    }
                    className="w-full h-10 px-3 border border-[#DDE8F0] rounded-xl text-xs font-bold text-[#0D2137] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4]"
                  >
                    <option value="true">Enabled (Same-Day Eligible)</option>
                    <option value="false">Disabled (Next-Day Only)</option>
                  </select>
                </div>

                {/* 3. Lead Days */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0D2137]">Lead Days</label>
                  <input
                    type="number"
                    min={0}
                    max={7}
                    value={zone.leadDays}
                    onChange={(e) => updateZone(zone.id, { leadDays: Number(e.target.value) })}
                    className="w-full h-10 px-3 border border-[#DDE8F0] rounded-xl text-xs font-bold text-[#0D2137] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4]"
                  />
                </div>

                {/* 4. Max Same-Day Orders Cap */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0D2137]">
                    Daily Order Cap (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={zone.maxSameDayOrders ?? ""}
                    onChange={(e) =>
                      updateZone(zone.id, {
                        maxSameDayOrders: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full h-10 px-3 border border-[#DDE8F0] rounded-xl text-xs font-bold text-[#0D2137] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4]"
                  />
                </div>
              </div>

              {/* LIVE PREVIEW BOX (Requirement 8.f) */}
              <div className="bg-[#E8F4FE] border border-[#1B9AE4]/20 p-4 rounded-xl space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#1B9AE4]">
                  <Clock className="h-4 w-4" />
                  <span>LIVE CUSTOMER MESSAGE PREVIEW</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-[#DDE8F0] text-xs text-[#0D2137]">
                  <p className="font-bold">{previewMessage.headline}</p>
                  <p className="text-[11px] text-[#0D2137]/70 mt-0.5">{previewMessage.subtext}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
