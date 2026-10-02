import { db } from "./db";


export const dynamic = "force-dynamic";

export async function seedInitialDatabase() {
  console.log("Seeding initial database...");

  // Category
  const fishCategory = await db.category.upsert({
    where: { slug: "fish" },
    update: {},
    create: {
      slug: "fish",
      name: "Fresh Fish",
      description: "Wild caught ocean fish landed daily along Sri Lanka coastal harbors.",
      sortOrder: 1,
    },
  });

  // Sample Products
  const products = [
    { slug: "yellowfin-tuna", name: "Yellowfin Tuna", localName: "Kelawalla", pricePerKgCents: 165000, storageType: "FRESH" as const },
    { slug: "skipjack-tuna", name: "Skipjack Tuna", localName: "Balaya", pricePerKgCents: 110000, storageType: "FRESH" as const },
    { slug: "seer-fish", name: "Seer Fish", localName: "Thora", pricePerKgCents: 280000, storageType: "FRESH" as const },
    { slug: "trevally", name: "Trevally", localName: "Paraw", pricePerKgCents: 175000, storageType: "FRESH" as const },
    { slug: "tiger-prawns", name: "Tiger Prawns", localName: "Isso", pricePerKgCents: 220000, storageType: "FRESH" as const },
    { slug: "mud-crab", name: "Mud Crab", localName: "Kakuluwo", pricePerKgCents: 240000, storageType: "FRESH" as const },
    { slug: "cuttlefish", name: "Cuttlefish", localName: "Dallo", pricePerKgCents: 190000, storageType: "FRESH" as const },
    { slug: "sprats", name: "Sprats", localName: "Hurulla", pricePerKgCents: 95000, storageType: "FRESH" as const },
  ];

  for (const p of products) {
    await db.product.upsert({
      where: { slug: p.slug },
      update: { pricePerKgCents: p.pricePerKgCents },
      create: {
        categoryId: fishCategory.id,
        slug: p.slug,
        name: p.name,
        localName: p.localName,
        pricePerKgCents: p.pricePerKgCents,
        storageType: p.storageType,
        isAvailable: true,
        isActive: true,
      },
    });
  }

  console.log("Database seeded successfully.");
}
