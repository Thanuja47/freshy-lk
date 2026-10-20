import { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/site/ProductCard";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Fresh Sea Fish | Freshy.lk",
  description: "Browse premium Sri Lankan sea fish landed daily. Yellowfin Tuna, Seer Fish, Trevally, Sailfish, Mahi Mahi, Barramundi and more.",
};

const FISH_PRODUCTS = [
  { id: "61af5f38-2383-4191-9d7c-5a612605930d", slug: "yellowfin-tuna", name: "Yellowfin Tuna", localName: "Kelawalla", pricePerKgCents: 165000, offerPercent: 15, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/yellowfin-tuna.jpg" },
  { id: "95780d5f-3bb2-4d35-abd6-ab90f728243d", slug: "skipjack-tuna", name: "Skipjack Tuna", localName: "Balaya", pricePerKgCents: 110000, offerPercent: null, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/skipjack-tuna.jpg" },
  { id: "ac49d9d9-376b-4af5-95dc-0f3b52651b0a", slug: "seer-fish", name: "Seer Fish", localName: "Thora", pricePerKgCents: 280000, offerPercent: 10, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/seer-fish.jpg" },
  { id: "1cf72daa-aa72-4b73-9350-37969180272e", slug: "trevally", name: "Trevally", localName: "Paraw", pricePerKgCents: 175000, offerPercent: null, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/trevally-paraw.jpg" },
  { id: "09f8235d-fb4b-4930-9075-79818d473be2", slug: "sprats", name: "Sprats", localName: "Hurulla", pricePerKgCents: 95000, offerPercent: null, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/sprats-hurulla.jpg" },
  { id: "4e164a8c-982b-4890-8f85-5f7f18ab89a5", slug: "sailfish", name: "Sailfish", localName: "Thalapath", pricePerKgCents: 195000, offerPercent: null, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/sailfish-thalapath.jpg" },
  { id: "1038d16a-ffa3-4c69-a8b3-b065a90a089b", slug: "mahi-mahi", name: "Mahi Mahi", localName: "Koppara", pricePerKgCents: 155000, offerPercent: 5, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/mahi-mahi.jpg" },
  { id: "d3e894fa-42bd-4a39-b2dd-9f0ae3cad274", slug: "red-snapper", name: "Red Snapper", localName: "Ranna", pricePerKgCents: 210000, offerPercent: null, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/red-snapper.jpg" },
  { id: "2394fd25-b734-4bbe-9fc2-ea2772750390", slug: "barramundi", name: "Barramundi", localName: "Modha", pricePerKgCents: 230000, offerPercent: null, storageType: "FRESH" as const, isAvailable: true, category: "fish", imageUrl: "/products/barramundi-modha.jpg" },
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
