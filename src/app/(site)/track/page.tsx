"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Search, AlertCircle, Loader2 } from "lucide-react";

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderQuery, setOrderQuery] = useState("");
  const [phoneQuery, setPhoneQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNo: orderQuery.trim(),
          phone: phoneQuery.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.trackingToken) {
        router.push(`/order/${data.trackingToken}`);
      } else {
        setError(data.message || "No matching order found. Please check your order number and phone.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-16 pb-28">
      <div className="bg-white/85 backdrop-blur-xl border border-white/60 p-6 sm:p-10 rounded-3xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#EAF5FE] text-[#1B9AE4] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#0D2137] tracking-tight">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-[#0D2137]/65 max-w-sm mx-auto">
            Enter your Order Number and mobile phone number to view live prep & delivery status.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]/75 mb-1.5">
              Order Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. FRS-261002-0001"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              className="w-full px-4 py-3 bg-[#F0F7FF] border border-[#DDE8F0] rounded-xl text-[#0D2137] text-base sm:text-sm placeholder:text-[#0D2137]/35 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]/75 mb-1.5">
              Mobile Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 077 123 4567"
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              className="w-full px-4 py-3 bg-[#F0F7FF] border border-[#DDE8F0] rounded-xl text-[#0D2137] text-base sm:text-sm placeholder:text-[#0D2137]/35 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#1B9AE4] hover:bg-[#1565C0] text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching Order...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Track Order Status</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
