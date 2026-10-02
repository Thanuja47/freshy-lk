"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        setError(data.message || "No matching order found. Please check your details.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-white border border-sand p-8 rounded-xl shadow-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-sea-glass text-tide rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            🔍
          </div>
          <h1 className="font-serif text-2xl font-bold text-sea-ink">Track Your Order</h1>
          <p className="text-sm text-sea-ink/70 mt-1">
            Enter your Order Number and phone number to check your delivery status.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
              Order Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. FRS-261002-0001"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink focus:outline-none focus:ring-2 focus:ring-tide/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
              Mobile Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 077 123 4567"
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink focus:outline-none focus:ring-2 focus:ring-tide/50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-coral text-white font-bold rounded-lg hover:bg-coral/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? "Searching..." : "Track Order Status"}
          </button>
        </form>
      </div>
    </div>
  );
}
