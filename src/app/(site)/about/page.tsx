import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Anchor, HeartHandshake, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Freshy.lk",
  description: "Learn how Freshy.lk sources premium coastal fish and seafood directly from Sri Lankan fisheries landings.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#1B9AE4]">Our Heritage & Mission</span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0D2137]">
          Connecting Sri Lankan Fisheries Directly to Your Kitchen
        </h1>
        <p className="text-sm sm:text-base text-[#0D2137]/80 leading-relaxed">
          Freshy.lk was built to solve a long-standing challenge in Sri Lanka: providing households, commercial caterers, and food service partners with direct access to genuine day-boat catches, cleaned and prepped to order, without the markup and handling delays of traditional market middlemen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-[#DDE8F0] rounded-2xl shadow-xs space-y-2">
          <Anchor className="w-8 h-8 text-[#1B9AE4]" />
          <h3 className="font-bold text-[#0D2137] text-base">Direct Landings</h3>
          <p className="text-xs text-[#0D2137]/70 leading-relaxed">
            We source daily from certified landing centers along Negombo, Beruwala, Mirissa, and Trincomalee coasts.
          </p>
        </div>
        <div className="p-6 bg-white border border-[#DDE8F0] rounded-2xl shadow-xs space-y-2">
          <ShieldCheck className="w-8 h-8 text-[#1B9AE4]" />
          <h3 className="font-bold text-[#0D2137] text-base">Custom Prep</h3>
          <p className="text-xs text-[#0D2137]/70 leading-relaxed">
            From curry cuts and steaks to whole cleaned fillets, our skilled cutters prepare your order under strict hygiene standards.
          </p>
        </div>
        <div className="p-6 bg-white border border-[#DDE8F0] rounded-2xl shadow-xs space-y-2">
          <HeartHandshake className="w-8 h-8 text-[#1B9AE4]" />
          <h3 className="font-bold text-[#0D2137] text-base">Fair Pricing</h3>
          <p className="text-xs text-[#0D2137]/70 leading-relaxed">
            Transparent harbor rates updated daily, ensuring fair earnings for fishermen and honest prices for customers.
          </p>
        </div>
      </div>

      <div className="bg-[#E8F4FE] p-8 rounded-2xl text-center space-y-4">
        <h2 className="font-heading text-2xl font-bold text-[#0D2137]">Ready to taste the freshness?</h2>
        <p className="text-xs sm:text-sm text-[#0D2137]/70 max-w-md mx-auto">
          Explore our catch of the day, choose your preparation specifications, and enjoy reliable delivery across Sri Lanka.
        </p>
        <div className="pt-2">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B9AE4] text-white font-bold text-sm rounded-xl hover:bg-[#1580be] transition-colors shadow-xs"
          >
            <span>Browse Today&apos;s Catch</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
