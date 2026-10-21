import { getCachedCatalogue, mapProductToCard } from "@/lib/catalogue";
import { isOfferActive, getOfferPricePerKgCents } from "@/lib/offers";
import HomeClient, { type HomeProductItem, type HomeDealItem } from "./HomeClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Freshy.lk | Fresh Seafood & Fish - Sri Lanka",
  description: "Order fresh fish and seafood online. Direct from Sri Lankan coastal landings, custom prepped and delivered fresh to your door.",
};

export const revalidate = 60;

export default async function HomePage() {
  const catalogue = await getCachedCatalogue();

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
      featuredProducts={featuredProducts}
      dailyDeals={dailyDeals}
    />
  );
}
