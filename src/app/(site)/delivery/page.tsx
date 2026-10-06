import Link from "next/link";
import { Truck, Sun, Moon, ShieldCheck, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Cold-Chain Delivery Zones & 12 PM Cut-off Rule | Freshy.lk",
  description: "Order before 12 PM for same-day delivery in selected areas, next day or later elsewhere.",
};

const ZONES = [
  {
    name: "Colombo & Suburbs",
    districts: ["Colombo", "Gampaha", "Kalutara"],
    sameDay: true,
    cutoff: "12:00 PM",
    leadDays: "0 Days (Same-Day)",
    baseFee: "Rs. 350",
    storage: "Fresh Chilled & Frozen Delivery",
  },
  {
    name: "Western & Southern Outstation",
    districts: ["Galle", "Matara", "Kurunegala", "Kandy", "Kegalle", "Ratnapura"],
    sameDay: false,
    cutoff: "12:00 PM",
    leadDays: "1 Day (Next-Day)",
    baseFee: "Rs. 500",
    storage: "Chilled & Frozen Cold-Chain",
  },
  {
    name: "Islandwide Express",
    districts: ["Jaffna", "Batticaloa", "Trincomalee", "Anuradhapura", "Polonnaruwa", "Badulla", "Monaragala", "Hambantota", "Matale", "Nuwara Eliya", "Puttalam", "Mannar", "Vavuniya", "Mullaitivu", "Kilinochchi"],
    sameDay: false,
    cutoff: "12:00 PM",
    leadDays: "1 - 2 Days",
    baseFee: "Rs. 650",
    storage: "Cold-Chain Express",
  },
];

export default function DeliveryZonesPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-24 md:pb-12 space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#E8F4FE] via-[#EEF8FF] to-white border border-[#DDE8F0] p-6 sm:p-10 rounded-3xl space-y-3 relative overflow-hidden shadow-xs">
        <div className="inline-flex items-center space-x-1.5 bg-white border border-[#1B9AE4]/20 px-3.5 py-1 rounded-full text-xs font-bold text-[#1B9AE4]">
          <Truck className="h-3.5 w-3.5" />
          <span>COLD-CHAIN COURIER DISPATCH</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0D2137]">
          Delivery Zones &amp; Cut-off Rules
        </h1>
        <p className="text-xs sm:text-sm text-[#0D2137]/70 max-w-2xl leading-relaxed">
          Order before 12 PM for same-day delivery in selected areas. Orders placed after 12 PM are delivered the next available delivery day.
        </p>
      </div>

      {/* 12 PM Cut-off Rule Highlight Card */}
      <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl shadow-xs space-y-4">
        <h2 className="font-heading font-bold text-xl text-[#0D2137] flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5 text-[#1B9AE4]" />
          <span>Daily 12:00 PM Order Cut-off Policy</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#F0FAF2] border border-[#27A04E]/20 p-4 rounded-xl flex items-start space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#27A04E]/10 text-[#27A04E] flex items-center justify-center shrink-0 mt-0.5">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-[#0D2137]">Order Before 12:00 PM</h3>
              <p className="text-xs text-[#0D2137]/70 mt-0.5">
                Eligible for same-day delivery in Colombo &amp; suburbs. Next-day dispatch for outstation zones.
              </p>
            </div>
          </div>

          <div className="bg-[#E8F4FE] border border-[#1B9AE4]/20 p-4 rounded-xl flex items-start space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#1B9AE4]/10 text-[#1B9AE4] flex items-center justify-center shrink-0 mt-0.5">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-[#0D2137]">Order After 12:00 PM</h3>
              <p className="text-xs text-[#0D2137]/70 mt-0.5">
                Processed for next available delivery day dispatch.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Zones Table */}
      <div className="space-y-4">
        <h2 className="font-heading font-bold text-xl text-[#0D2137]">Zone Breakdown</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ZONES.map((zone, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#DDE8F0] p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-lg text-[#0D2137]">{zone.name}</h3>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      zone.sameDay
                        ? "bg-[#27A04E]/10 text-[#27A04E] border border-[#27A04E]/20"
                        : "bg-gray-100 text-[#0D2137]/60"
                    }`}
                  >
                    {zone.sameDay ? "Same-Day Zone" : "Next-Day Zone"}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-[#0D2137]/70">
                  <p className="font-bold text-[#0D2137]">Districts Covered:</p>
                  <p>{zone.districts.join(", ")}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#0D2137]/60">Daily Cut-off:</span>
                    <span className="font-bold text-[#0D2137]">{zone.cutoff}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#0D2137]/60">Lead Time:</span>
                    <span className="font-bold text-[#0D2137]">{zone.leadDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#0D2137]/60">Standard Fee:</span>
                    <span className="font-bold text-[#0D2137]">{zone.baseFee}</span>
                  </div>
                </div>
              </div>

              <Link
                href="/shop"
                className="w-full bg-[#0D2137] hover:bg-[#1B9AE4] text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-colors"
              >
                <span>Shop Today&apos;s Catch</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
