export default function DemoBanner() {
  // Only show if DEMO_MODE is explicitly set to "true"
  if (process.env.DEMO_MODE !== "true") return null;
  // Never show in production
  if (process.env.NEXT_PUBLIC_APP_ENV === "production") return null;

  return (
    <div className="bg-[#FF6A4D] text-white text-xs font-semibold px-4 py-1.5 text-center flex items-center justify-center space-x-2 shadow-inner">
      <span>DEMO MODE ENABLED</span>
      <span className="opacity-80">|</span>
      <span className="font-normal">Simulated payments &amp; safe client preview mode</span>
    </div>
  );
}
