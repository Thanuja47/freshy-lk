import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        images: { take: 1, select: { url: true } },
      },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    });

    const items = products.map((p) => ({
      id: p.id,
      name: p.name,
      localName: p.localName,
      categoryName: p.category.name,
      pricePerKgCents: p.pricePerKgCents,
      stockGrams: p.stockGrams,
      trackStock: p.trackStock,
      isAvailable: p.isAvailable,
      priceUpdatedAt: p.priceUpdatedAt.toISOString(),
      imageUrl: p.images[0]?.url || null,
    }));

    return NextResponse.json({ products: items });
  } catch (err: unknown) {
    console.error("Prices data endpoint error:", err);
    return NextResponse.json({ message: "Failed to load catalogue prices." }, { status: 500 });
  }
}
