import Link from "next/link";
import ProductCard from "@/components/site/ProductCard";
import { Anchor, ShieldCheck, Truck, Clock } from "lucide-react";

const SAMPLE_PRODUCTS = [
  { id: "1", slug: "yellowfin-tuna", name: "Yellowfin Tuna", localName: "Kelawalla", pricePerKgCents: 165000, storageType: "FRESH" as const, isAvailable: true },
  { id: "2", slug: "seer-fish", name: "Seer Fish", localName: "Thora", pricePerKgCents: 280000, storageType: "FRESH" as const, isAvailable: true },
  { id: "3", slug: "tiger-prawns", name: "Tiger Prawns", localName: "Isso", pricePerKgCents: 220000, storageType: "FRESH" as const, isAvailable: true },
  { id: "4", slug: "mud-crab", name: "Mud Crab", localName: "Kakuluwo", pricePerKgCents: 240000, storageType: "FRESH" as const, isAvailable: true },
];

export default function HomePage() {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="bg-[#0B1F2A] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-[#1F6F78]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 bg-[#1F6F78]/40 border border-[#1F6F78] px-3 py-1 rounded-full text-xs text-[#FF6A4D] font-semibold">
              <Anchor className="h-3.5 w-3.5" />
              <span>Direct From Sri Lankan Coastal Landings</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight">
              Wild Caught Fresh Seafood Delivered Chilled Islandwide
            </h1>
            <p className="text-gray-300 text-base leading-relaxed">
              Order fresh fish online across Sri Lanka. Fixed-weight packs, custom prep options (cleaned, curry cut, steaks), and cold-chain guaranteed delivery.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/shop"
                className="bg-[#FF6A4D] text-white px-6 py-3 rounded-md font-semibold text-sm hover:bg-[#E5593F] transition-colors"
              >
                Shop Today&apos;s Catch
              </Link>
              <Link
                href="/wholesale"
                className="bg-transparent border border-white text-white px-6 py-3 rounded-md font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Wholesale / B2B Tiers
              </Link>
            </div>
          </div>

          <div className="relative aspect-video rounded-xl bg-gradient-to-br from-[#1F6F78]/50 to-[#0B1F2A] border border-[#1F6F78] flex items-center justify-center p-8 text-center">
            <div>
              <p className="font-serif text-2xl font-bold text-white mb-2">Today&apos;s Fresh Landings</p>
              <p className="text-xs text-[#FF6A4D] font-semibold uppercase tracking-wider">Prices updated 6:40 AM today</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white p-6 rounded-xl border border-[#DCEBE6] shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-[#DCEBE6] text-[#1F6F78] rounded-full">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#0B1F2A]">Cold-Chain Guaranteed</h4>
              <p className="text-xs text-gray-500">Chilled transport from sea to door</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-[#DCEBE6] text-[#1F6F78] rounded-full">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#0B1F2A]">Islandwide Courier</h4>
              <p className="text-xs text-gray-500">Districts covered with clear lead times</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-[#DCEBE6] text-[#1F6F78] rounded-full">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#0B1F2A]">Daily Updated Prices</h4>
              <p className="text-xs text-gray-500">Fair per-kg prices updated every morning</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Highlight Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1F2A]">Fresh Today</h2>
            <p className="text-xs text-gray-500">Available wild caught fish for immediate delivery</p>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-[#1F6F78] hover:text-[#FF6A4D] transition-colors">
            View All Fish &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SAMPLE_PRODUCTS.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
