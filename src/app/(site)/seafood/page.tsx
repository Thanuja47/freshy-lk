import { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/site/ProductCard";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Crab, Prawns & Calamari Seafood | Freshy.lk",
  description: "Fresh Jumbo Tiger Prawns, Lagoon Mud Crab, and Cuttlefish prepped fresh daily across Sri Lanka.",
};

const SEAFOOD_PRODUCTS = [
  { id: "5", slug: "tiger-prawns", name: "Tiger Prawns", localName: "Isso", pricePerKgCents: 220000, offerPercent: null, storageType: "FRESH" as const, isAvailable: true, category: "seafood", imageUrl: "/products/jumbo-tiger-prawns.jpg" },
  { id: "6", slug: "mud-crab", name: "Mud Crab", localName: "Kakuluwo", pricePerKgCents: 240000, offerPercent: null, storageType: "FRESH" as const, isAvailable: true, category: "seafood", imageUrl: "/products/lagoon-mud-crab.jpg" },
  { id: "7", slug: "cuttlefish", name: "Cuttlefish", localName: "Dallo", pricePerKgCents: 190000, offerPercent: 5, storageType: "FRESH" as const, isAvailable: true, category: "seafood", imageUrl: "/products/cuttlefish-dallo.jpg" },
];

export default function SeafoodCategoryPage() {
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
          Fresh Shellfish & Seafood
        </h1>
        <p className="text-xs sm:text-sm text-[#0D2137]/60 mt-1 max-w-xl">
          Lagoon Mud Crab, Wild Tiger Prawns, and Cuttlefish. Cleaned, deveined, or whole prepped.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {SEAFOOD_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
