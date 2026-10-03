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

    if (products.length > 0) {
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
    }
  } catch (err: unknown) {
    if (process.env.DEMO_MODE !== "true") {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }
    console.error("Prices data endpoint DB error, using fallback demo products:", err);
  }

  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json({ products: [] });
  }

  // Fallback demo products for DEMO_MODE / local dev
  const demoProducts = [
    { id: "demo-p1", name: "Yellowfin Tuna", localName: "Kelawalla", categoryName: "Fresh Fish", pricePerKgCents: 165000, stockGrams: 15000, trackStock: true, isAvailable: true, priceUpdatedAt: new Date().toISOString(), imageUrl: null },
    { id: "demo-p2", name: "Skipjack Tuna", localName: "Balaya", categoryName: "Fresh Fish", pricePerKgCents: 110000, stockGrams: 20000, trackStock: true, isAvailable: true, priceUpdatedAt: new Date().toISOString(), imageUrl: null },
    { id: "demo-p3", name: "Seer Fish", localName: "Thora", categoryName: "Fresh Fish", pricePerKgCents: 280000, stockGrams: 8000, trackStock: true, isAvailable: true, priceUpdatedAt: new Date().toISOString(), imageUrl: null },
    { id: "demo-p4", name: "Trevally", localName: "Paraw", categoryName: "Fresh Fish", pricePerKgCents: 175000, stockGrams: 12000, trackStock: true, isAvailable: true, priceUpdatedAt: new Date().toISOString(), imageUrl: null },
    { id: "demo-p5", name: "Tiger Prawns", localName: "Isso", categoryName: "Fresh Fish", pricePerKgCents: 220000, stockGrams: 10000, trackStock: true, isAvailable: true, priceUpdatedAt: new Date().toISOString(), imageUrl: null },
    { id: "demo-p6", name: "Mud Crab", localName: "Kakuluwo", categoryName: "Fresh Fish", pricePerKgCents: 240000, stockGrams: 5000, trackStock: true, isAvailable: true, priceUpdatedAt: new Date().toISOString(), imageUrl: null },
    { id: "demo-p7", name: "Cuttlefish", localName: "Dallo", categoryName: "Fresh Fish", pricePerKgCents: 190000, stockGrams: 9000, trackStock: true, isAvailable: true, priceUpdatedAt: new Date().toISOString(), imageUrl: null },
    { id: "demo-p8", name: "Sprats", localName: "Hurulla", categoryName: "Fresh Fish", pricePerKgCents: 95000, stockGrams: 25000, trackStock: true, isAvailable: true, priceUpdatedAt: new Date().toISOString(), imageUrl: null },
  ];

  return NextResponse.json({ products: demoProducts });
}
