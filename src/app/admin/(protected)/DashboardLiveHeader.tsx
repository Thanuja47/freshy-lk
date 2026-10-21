// src/app/admin/(protected)/DashboardLiveHeader.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Clock } from "lucide-react";

export default function DashboardLiveHeader({
  greeting,
  formattedDate,
  cutoffTimeStr,
}: {
  greeting: string;
  formattedDate: string;
  cutoffTimeStr: string;
}) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("just now");

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setLastRefreshedAt("just now");
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // Background auto-revalidation every 12 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
      setLastRefreshedAt("just now");
    }, 12000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
          {greeting}, Admin
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-[#6E6E73]">{formattedDate}</p>
          <span className="text-xs text-black/20">•</span>
          <span className="text-[11px] text-[#6E6E73]">Updated {lastRefreshedAt}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Live Indicator */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200/60 rounded-xl text-xs font-semibold text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-Time Sync</span>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs font-semibold text-[#1D1D1F] hover:bg-[#F5F5F7] transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#1E88E5]" : ""}`} />
          <span>Refresh</span>
        </button>

        {/* Cutoff Pill */}
        <div className="inline-flex items-center gap-2 bg-white border border-black/[0.06] px-3.5 py-1.5 rounded-xl shadow-xs">
          <Clock className="w-3.5 h-3.5 text-[#1E88E5]" />
          <span className="text-xs font-medium text-[#1D1D1F]">
            Next Cut-off: <strong className="font-semibold text-[#1E88E5]">{cutoffTimeStr}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
