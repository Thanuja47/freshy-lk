import { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/site/ProductCard";
import { ArrowLeft, Tag } from "lucide-react";
import { getActiveOfferProducts, mapProductToCard } from "@/lib/catalogue";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://freshy.lk";

export const metadata: Metadata = {
  title: "Fish & Seafood Deals & Discounts | Freshy.lk",
  description: "Special seasonal discounts on fresh fish and seafood. Limited quantities daily from harbor landings. Don't miss today's deals!",
  alternates: { canonical: `${SITE_URL}/offers` },
  openGraph: {
    title: "Fish & Seafood Deals | Freshy.lk",
    description: "Special seasonal discounts on fresh fish and seafood. Limited quantities daily.",
    url: `${SITE_URL}/offers`,
  },
};

export const revalidate = 60;

export default async function OffersPage() {
  const products = await getActiveOfferProducts();
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

      {cardProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {cardProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-dashed border-[#DDE8F0] p-12 rounded-2xl text-center space-y-3">
          <Tag className="w-8 h-8 text-[#0D2137]/40 mx-auto" />
          <h2 className="text-base font-bold text-[#0D2137]">No Active Offers Today</h2>
          <p className="text-xs text-[#0D2137]/60 max-w-sm mx-auto">
            Check back during harbor morning landing times for daily limited discounts!
          </p>
          <Link
            href="/shop"
            className="inline-block bg-[#1B9AE4] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#1580C2] transition"
          >
            Browse All Fish &amp; Seafood
          </Link>
        </div>
      )}
    </div>
  );
}
