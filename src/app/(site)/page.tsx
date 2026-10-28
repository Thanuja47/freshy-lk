import { getCachedCatalogue, getCachedCategories, mapProductToCard } from "@/lib/catalogue";
import { isOfferActive, getOfferPricePerKgCents } from "@/lib/offers";
import HomeClient, { type HomeProductItem, type HomeDealItem, type HomeCategoryItem } from "./HomeClient";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://freshy.lk";

export const metadata: Metadata = {
  title: "Freshy.lk | Fresh Seafood & Fish Delivery — Sri Lanka",
  description:
    "Sri Lanka's freshest seafood delivered to your door. Order fish, prawns, crab, and seafood online. Direct from coastal landings, same-day delivery in Colombo.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Freshy.lk | Fresh Seafood & Fish Delivery — Sri Lanka",
    description:
      "Sri Lanka's freshest seafood delivered to your door. Order fish, prawns, crab, and seafood online.",
    url: SITE_URL,
    images: [{ url: "/brand/og-image.png", width: 1200, height: 630 }],
  },
};

export const revalidate = 60;

export default async function HomePage() {
  const [catalogue, dbCategories] = await Promise.all([
    getCachedCatalogue(),
    getCachedCategories(),
  ]);

  const categories: HomeCategoryItem[] = dbCategories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    imageUrl: c.imageUrl,
    sortOrder: c.sortOrder,
  }));

  const featuredProducts: HomeProductItem[] = catalogue.map((p) => {
    const card = mapProductToCard(p);
    return {
      id: card.id,
      slug: card.slug,
      name: card.name,
      localName: card.localName,
      pricePerKgCents: card.pricePerKgCents,
      offerPercent: card.offerPercent,
      storageType: card.storageType,
      imageUrl: card.imageUrl || `/products/${card.slug}.jpg`,
    };
  });

  const offerProducts = catalogue.filter((p) => isOfferActive(p));
  const dailyDeals: HomeDealItem[] = (
    offerProducts.length > 0 ? offerProducts : catalogue.slice(0, 3)
  ).map((p) => {
    const hasOffer = isOfferActive(p);
    const offerPrice = hasOffer ? getOfferPricePerKgCents(p) : p.pricePerKgCents;
    const offerPct = hasOffer ? (p.offerPercent ?? 0) : 0;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      localName: p.localName || undefined,
      originalPriceCents: p.pricePerKgCents,
      discountPriceCents: offerPrice,
      offerPercent: offerPct,
      imageUrl: p.images?.[0]?.url || `/products/${p.slug}.jpg`,
    };
  });

  return (
    <HomeClient
      categories={categories}
      featuredProducts={featuredProducts}
      dailyDeals={dailyDeals}
    />
  );
}
