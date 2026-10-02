// cache.ts — tag-based revalidation helpers for Freshy.lk storefront

export const CACHE_TAGS = {
  CATALOGUE: "catalogue",
  PRODUCTS: "products",
  CATEGORIES: "categories",
  PREP_OPTIONS: "prep_options",
  ZONES: "zones",
  SETTINGS: "settings",
} as const;

/**
 * Revalidates the public catalogue cache so the storefront reflects
 * price & stock updates within ~1 second after the admin saves.
 * Must be called from a Server Action or Route Handler.
 */
export async function revalidateCatalogueCache() {
  // Dynamic import keeps next/cache out of the client bundle
  const { revalidateTag } = await import("next/cache");
  revalidateTag(CACHE_TAGS.CATALOGUE, "max");
  revalidateTag(CACHE_TAGS.PRODUCTS, "max");
}
