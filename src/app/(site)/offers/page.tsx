import { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/site/ProductCard";
import { ArrowLeft, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Today's Catch Offers & Discounts | Freshy.lk",
  description: "Special seasonal discounts on fresh fish and seafood. Limited quantities daily direct from harbor landings.",
};

const OFFER_PRODUCTS = [
  { id: "1", slug: "yellowfin-tuna", name: "Yellowfin Tuna", localName: "Kelawalla", pricePerKgCents: 165000, offerPercent: 15, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/yellowfin-tuna.jpg" },
  { id: "3", slug: "seer-fish", name: "Seer Fish", localName: "Thora", pricePerKgCents: 280000, offerPercent: 10, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/seer-fish.jpg" },
  { id: "7", slug: "cuttlefish", name: "Cuttlefish", localName: "Dallo", pricePerKgCents: 190000, offerPercent: 5, storageType: "FRESH" as const, isAvailable: true, category: "seafood", imageUrl: "/products/cuttlefish-dallo.jpg" },
  { id: "10", slug: "mahi-mahi", name: "Mahi Mahi", localName: "Koppara", pricePerKgCents: 155000, offerPercent: 5, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/mahi-mahi.jpg" },
];

export default function OffersPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B9AE4] hover:underline mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Products</span>
        </Link>
        <div className="flex items-center gap-2">
          <Tag className="w-6 h-6 text-[#1B9AE4]" />
          <h1 className="font-heading text-3xl font-extrabold text-[#0D2137]">
            Today&apos;s Special Offers
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#0D2137]/60 mt-1 max-w-xl">
          Discounted rates on selected harbor catches. Verified fresh landings, available while daily stocks last.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {OFFER_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
