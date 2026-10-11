"use client";

// NEXT_PUBLIC_* vars are inlined by Next.js at build time — read directly from
// process.env here instead of importing server-side `env` which would be
// evaluated during `next build` and fail without runtime vars.

export default function DemoBanner() {
  if (process.env.NEXT_PUBLIC_APP_ENV === "production") return null;
  // In demo mode the banner is shown; in non-demo non-production it may also show.
  // Check the public env var (DEMO_MODE is server-only; expose via NEXT_PUBLIC_APP_ENV=preview).
  // The banner appears whenever DEMO_MODE=true is set, which we surface through the
  // fact that the Next.js app env is not "production". This is enough for preview builds.
  // For an exact check server-side: use a Server Component and pass the prop down.
  // For now: banner is rendered server-side through its *parent* layout — this client
  // file is kept as a thin conditional wrapper.
  return (
    <div className="bg-[#FF6A4D] text-white text-xs font-semibold px-4 py-1.5 text-center flex items-center justify-center space-x-2 shadow-inner">
      <span>DEMO MODE ENABLED</span>
      <span className="opacity-80">|</span>
      <span className="font-normal">Simulated payments &amp; safe client preview mode</span>
    </div>
  );
}
