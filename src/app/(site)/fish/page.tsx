import { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/site/ProductCard";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Fresh Sea Fish | Freshy.lk",
  description: "Browse premium Sri Lankan sea fish landed daily. Yellowfin Tuna, Seer Fish, Trevally, Sailfish, Mahi Mahi, Barramundi and more.",
};

const FISH_PRODUCTS = [
  { id: "1", slug: "yellowfin-tuna", name: "Yellowfin Tuna", localName: "Kelawalla", pricePerKgCents: 165000, offerPercent: 15, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/yellowfin-tuna.jpg" },
  { id: "2", slug: "skipjack-tuna", name: "Skipjack Tuna", localName: "Balaya", pricePerKgCents: 110000, offerPercent: null, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/skipjack-tuna.jpg" },
  { id: "3", slug: "seer-fish", name: "Seer Fish", localName: "Thora", pricePerKgCents: 280000, offerPercent: 10, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/seer-fish.jpg" },
  { id: "4", slug: "trevally", name: "Trevally", localName: "Paraw", pricePerKgCents: 175000, offerPercent: null, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/trevally-paraw.jpg" },
  { id: "8", slug: "sprats", name: "Sprats", localName: "Hurulla", pricePerKgCents: 95000, offerPercent: null, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/sprats-hurulla.jpg" },
  { id: "9", slug: "sailfish", name: "Sailfish", localName: "Thalapath", pricePerKgCents: 195000, offerPercent: null, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/sailfish-thalapath.jpg" },
  { id: "10", slug: "mahi-mahi", name: "Mahi Mahi", localName: "Koppara", pricePerKgCents: 155000, offerPercent: 5, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/mahi-mahi.jpg" },
  { id: "11", slug: "red-snapper", name: "Red Snapper", localName: "Ranna", pricePerKgCents: 210000, offerPercent: null, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/red-snapper.jpg" },
  { id: "12", slug: "barramundi", name: "Barramundi", localName: "Modha", pricePerKgCents: 230000, offerPercent: null, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/barramundi-modha.jpg" },
];

export default function FishCategoryPage() {
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
        <h1 className="font-heading text-3xl font-extrabold text-[#0D2137]">
          Fresh Sea Fish
        </h1>
        <p className="text-xs sm:text-sm text-[#0D2137]/60 mt-1 max-w-xl">
          Daily coastal landings cleaned, sliced, cubed, or filleted to your exact kitchen specifications.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {FISH_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
