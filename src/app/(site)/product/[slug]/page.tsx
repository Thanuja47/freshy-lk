import { notFound } from "next/navigation";
import { getCachedProductBySlug } from "@/lib/catalogue";
import ProductDetailClient from "./ProductDetailClient";
import type { Metadata } from "next";

export const revalidate = 60;

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

  return {
    title: `${product.name} | Freshy.lk`,
    description: product.shortDesc || `Fresh ${product.name} prepped to order and delivered across Sri Lanka.`,
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
