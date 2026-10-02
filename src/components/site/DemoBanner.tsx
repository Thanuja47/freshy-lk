"use client";

import { env } from "@/lib/env";

export default function DemoBanner() {
  if (env.DEMO_MODE !== true) return null;

  return (
    <div className="bg-[#FF6A4D] text-white text-xs font-semibold px-4 py-1.5 text-center flex items-center justify-center space-x-2 shadow-inner">
      <span>DEMO MODE ENABLED</span>
      <span className="opacity-80">|</span>
      <span className="font-normal">Simulated payments & safe client preview mode</span>
    </div>
  );
}
