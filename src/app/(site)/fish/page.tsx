import { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/site/ProductCard";
import { ArrowLeft } from "lucide-react";
import { getProductsByCategory, mapProductToCard } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Fresh Sea Fish | Freshy.lk",
  description: "Browse premium Sri Lankan sea fish landed daily. Yellowfin Tuna, Seer Fish, Trevally, Sailfish, Mahi Mahi, Barramundi and more.",
};

export const revalidate = 60;

export default async function FishCategoryPage() {
  const products = await getProductsByCategory("fish");
  const cardProducts = products.map(mapProductToCard);

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
        {cardProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
