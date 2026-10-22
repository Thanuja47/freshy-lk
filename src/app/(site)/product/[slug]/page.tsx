import { notFound } from "next/navigation";
import { getCachedProductBySlug } from "@/lib/catalogue";
import ProductDetailClient from "./ProductDetailClient";
import type { Metadata } from "next";

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://freshy.lk";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);
  if (!product) {
    return {
      title: "Product Not Found | Freshy.lk",
    };
  }

  const imageUrl = product.images?.[0]?.url || `/products/${product.slug}.jpg`;
  const productUrl = `${SITE_URL}/product/${product.slug}`;

  return {
    title: `${product.name} — Fresh ${product.storageType === "FROZEN" ? "Frozen" : "Chilled"} | Freshy.lk`,
    description:
      product.shortDesc ||
      `Fresh ${product.name} (${product.localName || ""}) prepped to order and delivered fresh across Sri Lanka. Direct from coastal landings.`,
    alternates: { canonical: productUrl },
    openGraph: {
      title: `${product.name} | Freshy.lk`,
      description:
        product.shortDesc ||
        `Fresh ${product.name} prepped to order and delivered across Sri Lanka.`,
      url: productUrl,
      images: [{ url: imageUrl, width: 800, height: 600, alt: product.name }],
      type: "article",
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
