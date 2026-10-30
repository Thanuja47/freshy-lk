import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Freshy.lk",
  description: "Terms and conditions for purchasing fresh seafood online at Freshy.lk.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-2 border-b border-[#DDE8F0] pb-6">
        <h1 className="font-heading text-3xl font-extrabold text-[#0D2137]">Terms of Service</h1>
        <p className="text-xs text-[#0D2137]/60">Last updated: October 2026</p>
      </div>

      {/* [CLIENT/LEGAL REVIEW REQUIRED — DRAFT TERMS] */}
      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium">
        Note: This terms document is currently in draft format and undergoing client legal review prior to final commercial ratification.
      </div>

      <div className="prose prose-sm text-[#0D2137]/80 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0D2137]">1. General</h2>
          <p>
            By accessing and placing orders with Freshy.lk (operated by Freshy LK Pvt Ltd), you agree to be bound by these terms and conditions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0D2137]">2. Catch Availability & Market Pricing</h2>
          <p>
            As seafood is landed fresh daily, availability is subject to weather conditions and seasonal harbor catch. Prices are published daily based on current harbor auction landings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0D2137]">3. Cut-off Rule & Delivery Times</h2>
          <p>
            Delivery dates are determined by the 12:00 PM cut-off rule and selected district zone lead times. While we make every effort to deliver within your selected timeframe, external road or weather conditions may occasionally cause delays.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0D2137]">4. Bank Transfer Orders & Expiry</h2>
          <p>
            Orders placed via Bank Transfer must submit payment verification within the specified reservation window. Unpaid reservations are subject to automatic cancellation to release limited fresh stock.
          </p>
        </section>
      </div>
    </div>
  );
}
