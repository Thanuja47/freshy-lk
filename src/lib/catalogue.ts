// src/lib/catalogue.ts — Server-side cached catalogue queries for storefront
// Uses Next.js unstable_cache with tag-based invalidation + 60s max revalidate fallback.

import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache";
import { isOfferActive } from "@/lib/offers";
import type { MockProduct } from "@/components/site/ProductCard";

export interface DbProductWithRelations {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  localName: string | null;
  shortDesc: string | null;
  description: string | null;
  tips: string | null;
  catchType: string | null;
  origin: string | null;
  storageType: "FRESH" | "FROZEN" | "AMBIENT";
  pricePerKgCents: number;
  priceUpdatedAt: Date;
  priceVersion: number;
  offerPercent: number | null;
  offerEndsAt: Date | null;
  trackStock: boolean;
  stockGrams: number;
  isAvailable: boolean;
  isActive: boolean;
  isFeatured: boolean;
  category: {
    id: string;
    slug: string;
    name: string;
  };
  images: Array<{
    id: string;
    url: string;
    alt: string;
    sortOrder: number;
  }>;
  packs: Array<{
    id: string;
    weightGrams: number;
    label: string;
    isActive: boolean;
    sortOrder: number;
  }>;
  tiers: Array<{
    id: string;
    minWeightGrams: number;
    pricePerKgCents: number;
    label: string | null;
  }>;
  preps: Array<{
    productId: string;
    prepOptionId: string;
    feeOverrideCents: number | null;
    prepOption: {
      id: string;
      name: string;
      description: string | null;
      feeType: "FLAT" | "PER_KG";
      feeCents: number;
      isDefault: boolean;
      isActive: boolean;
    };
  }>;
}

export function mapProductToCard(p: DbProductWithRelations): MockProduct {
  const imageUrl = p.images?.[0]?.url || `/products/${p.slug}.jpg`;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    localName: p.localName || undefined,
    pricePerKgCents: p.pricePerKgCents,
    storageType: p.storageType,
    isAvailable: p.isAvailable,
    imageUrl,
    lowStock: Boolean(p.trackStock && p.stockGrams <= 2000),
    offerPercent: p.offerPercent,
    offerEndsAt: p.offerEndsAt,
  };
}

export interface DbCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export const getCachedCategories = unstable_cache(
  async (): Promise<DbCategory[]> => {
    try {
      const categories = await db.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
      return categories;
    } catch (err) {
      console.error("Failed to fetch categories from DB:", err);
      return [];
    }
  },
  ["catalogue-all-categories"],
  {
    revalidate: 60,
    tags: [CACHE_TAGS.CATALOGUE, CACHE_TAGS.CATEGORIES],
  }
);

/**
 * Fetches all active products from DB with 60s cache revalidate & CACHE_TAGS.CATALOGUE.
 */
export const getCachedCatalogue = unstable_cache(
  async (): Promise<DbProductWithRelations[]> => {
    try {
      const products = await db.product.findMany({
        where: { isActive: true },
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
          packs: { where: { isActive: true }, orderBy: { weightGrams: "asc" } },
          tiers: { orderBy: { minWeightGrams: "asc" } },
          preps: { include: { prepOption: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      });
      return products as unknown as DbProductWithRelations[];
    } catch (err) {
      console.error("Failed to fetch catalogue from DB:", err);
      return [];
    }
  },
  ["catalogue-all-products"],
  {
    revalidate: 60,
    tags: [CACHE_TAGS.CATALOGUE, CACHE_TAGS.PRODUCTS],
  }
);

/**
 * Fetches single product by slug or prefix alias (e.g. "trevally" -> "trevally-paraw")
 */
export async function getCachedProductBySlug(slug: string): Promise<DbProductWithRelations | null> {
  const fetcher = unstable_cache(
    async (): Promise<DbProductWithRelations | null> => {
      try {
        const product = await db.product.findFirst({
          where: {
            isActive: true,
            OR: [
              { slug },
              { slug: { startsWith: `${slug}-` } },
            ],
          },
          include: {
            category: true,
            images: { orderBy: { sortOrder: "asc" } },
            packs: { where: { isActive: true }, orderBy: { weightGrams: "asc" } },
            tiers: { orderBy: { minWeightGrams: "asc" } },
            preps: { include: { prepOption: true } },
          },
        });
        return (product as unknown as DbProductWithRelations) ?? null;
      } catch (err) {
        console.error(`Failed to fetch product [${slug}] from DB:`, err);
        return null;
      }
    },
    [`catalogue-product-${slug}`],
    {
      revalidate: 60,
      tags: [CACHE_TAGS.CATALOGUE, CACHE_TAGS.PRODUCTS, `product-${slug}`],
    }
  );

  return fetcher();
}

/**
 * Fetches products filtered by category slug (e.g. "fresh-fish" or "shellfish-seafood")
 */
export async function getProductsByCategory(categorySlug: string): Promise<DbProductWithRelations[]> {
  const catalogue = await getCachedCatalogue();
  return catalogue.filter((p) => {
    const slugMatch = p.category?.slug === categorySlug;
    if (categorySlug === "fish") {
      return slugMatch || p.category?.slug === "fresh-fish";
    }
    if (categorySlug === "seafood") {
      return slugMatch || p.category?.slug === "shellfish-seafood";
    }
    return slugMatch;
  });
}

/**
 * Fetches products that currently have an active offer
 */
export async function getActiveOfferProducts(): Promise<DbProductWithRelations[]> {
  const catalogue = await getCachedCatalogue();
  return catalogue.filter((p) => isOfferActive(p));
}
