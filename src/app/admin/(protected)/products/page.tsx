// src/app/admin/(protected)/products/page.tsx
import { db } from "@/lib/db";
import ProductsClient from "./ProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { id: true, name: true } },
        packs: { where: { isActive: true }, select: { id: true, label: true, weightGrams: true } },
      },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    db.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return <ProductsClient initialProducts={products} categories={categories} />;
}
