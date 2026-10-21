import { Suspense } from "react";
import { getCachedCatalogue, mapProductToCard } from "@/lib/catalogue";
import ShopClient from "./ShopClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Catch of the Day | Freshy.lk",
  description: "Browse fresh fish and seafood landed daily. Order online for delivery across Sri Lanka.",
};

export const revalidate = 60;

export default async function ShopPage() {
  const dbProducts = await getCachedCatalogue();
  const initialProducts = dbProducts.map((p) => {
    const card = mapProductToCard(p);
    return {
      ...card,
      category: p.category?.slug === "fresh-fish" ? "fish" : "seafood",
    };
  });

  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto p-8 text-center text-gray-500">Loading catalog...</div>}>
      <ShopClient initialProducts={initialProducts} />
    </Suspense>
  );
}
