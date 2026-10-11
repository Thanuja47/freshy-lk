// scripts/seed-demo.ts — Demo data seed for Freshy.lk
// Populates: demo fish products, pack sizes, price entries, and promotional offers.
//
// ⚠️  REFUSES to run when NEXT_PUBLIC_APP_ENV=production.
//     Safe for: development, preview, staging.

import "dotenv/config";
import { db } from "../src/lib/db";

// ─── Production guard ─────────────────────────────────────────────────────────
const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? "development";
if (APP_ENV === "production") {
  console.error(
    "❌  seed-demo: Refused to run in production (NEXT_PUBLIC_APP_ENV=production). " +
      "Demo data must not be inserted into the live database. " +
      "Run scripts/seed.ts instead for reference data only."
  );
  process.exit(1);
}

async function main() {
  console.log(`🎭 Seeding demo data (env: ${APP_ENV})…`);

  // ── Resolve category IDs ───────────────────────────────────────────────────
  // Reference categories must already exist (run seed.ts first).
  const fishCat = await db.category.findUniqueOrThrow({ where: { slug: "fresh-fish" } });
  const seafoodCat = await db.category.findUniqueOrThrow({ where: { slug: "shellfish-seafood" } });

  // ── Demo Products ─────────────────────────────────────────────────────────
  // PLACEHOLDER: all product names, local names, prices, and stock quantities
  // are placeholder values — see docs/PLACEHOLDERS.md → "Demo products".
  const productList = [
    {
      slug: "yellowfin-tuna",
      categoryId: fishCat.id,
      name: "Yellowfin Tuna",
      localName: "Kelawalla (කෙලවල්ලා)",
      pricePerKgCents: 180000,   // PLACEHOLDER — client to confirm
      stockGrams: 25000,         // PLACEHOLDER — client to confirm
      trackStock: true,
      storageType: "FRESH" as const,
      isFeatured: true,
      packs: [500, 1000, 2000],
    },
    {
      slug: "seer-fish",
      categoryId: fishCat.id,
      name: "Seer Fish",
      localName: "Thora (තෝරා)",
      pricePerKgCents: 240000,   // PLACEHOLDER
      stockGrams: 15000,         // PLACEHOLDER
      trackStock: true,
      storageType: "FRESH" as const,
      isFeatured: true,
      packs: [500, 1000, 2000],
    },
    {
      slug: "skipjack-tuna",
      categoryId: fishCat.id,
      name: "Skipjack Tuna",
      localName: "Balaya (බලයා)",
      pricePerKgCents: 120000,   // PLACEHOLDER
      stockGrams: 30000,         // PLACEHOLDER
      trackStock: true,
      storageType: "FRESH" as const,
      isFeatured: false,
      packs: [500, 1000],
    },
    {
      slug: "trevally-paraw",
      categoryId: fishCat.id,
      name: "Trevally / Jack",
      localName: "Paraw (පරව්)",
      pricePerKgCents: 175000,   // PLACEHOLDER
      stockGrams: 20000,         // PLACEHOLDER
      trackStock: true,
      storageType: "FRESH" as const,
      isFeatured: true,
      packs: [500, 1000],
    },
    {
      slug: "barramundi-modha",
      categoryId: fishCat.id,
      name: "Barramundi",
      localName: "Modha (මෝදා)",
      pricePerKgCents: 210000,   // PLACEHOLDER
      stockGrams: 12000,         // PLACEHOLDER
      trackStock: true,
      storageType: "FRESH" as const,
      isFeatured: false,
      packs: [500, 1000, 2000],
    },
    {
      slug: "red-snapper",
      categoryId: fishCat.id,
      name: "Red Snapper",
      localName: "Ranna (රන්නා)",
      pricePerKgCents: 195000,   // PLACEHOLDER
      stockGrams: 18000,         // PLACEHOLDER
      trackStock: true,
      storageType: "FRESH" as const,
      isFeatured: false,
      packs: [500, 1000],
    },
    {
      slug: "sailfish-thalapath",
      categoryId: fishCat.id,
      name: "Sailfish",
      localName: "Thalapath (තලපත)",
      pricePerKgCents: 185000,   // PLACEHOLDER
      stockGrams: 22000,         // PLACEHOLDER
      trackStock: true,
      storageType: "FRESH" as const,
      isFeatured: true,
      packs: [500, 1000, 2000],
    },
    {
      slug: "mahi-mahi",
      categoryId: fishCat.id,
      name: "Mahi Mahi / Dolphin Fish",
      localName: "Gal Malu (ගල් මාළු)",
      pricePerKgCents: 160000,   // PLACEHOLDER
      stockGrams: 15000,         // PLACEHOLDER
      trackStock: true,
      storageType: "FRESH" as const,
      isFeatured: false,
      packs: [500, 1000],
    },
    {
      slug: "jumbo-tiger-prawns",
      categoryId: seafoodCat.id,
      name: "Jumbo Tiger Prawns",
      localName: "Isso (ඉස්සෝ)",
      pricePerKgCents: 320000,   // PLACEHOLDER
      stockGrams: 10000,         // PLACEHOLDER
      trackStock: true,
      storageType: "FRESH" as const,
      isFeatured: true,
      packs: [250, 500, 1000],
    },
    {
      slug: "lagoon-mud-crab",
      categoryId: seafoodCat.id,
      name: "Lagoon Mud Crab",
      localName: "Kakuluwo (කකූළුවෝ)",
      pricePerKgCents: 260000,   // PLACEHOLDER
      stockGrams: 8000,          // PLACEHOLDER
      trackStock: true,
      storageType: "FRESH" as const,
      isFeatured: true,
      packs: [500, 1000],
    },
    {
      slug: "cuttlefish-dallo",
      categoryId: seafoodCat.id,
      name: "Cuttlefish / Squid",
      localName: "Dallo (දැල්ලෝ)",
      pricePerKgCents: 210000,   // PLACEHOLDER
      stockGrams: 14000,         // PLACEHOLDER
      trackStock: true,
      storageType: "FRESH" as const,
      isFeatured: false,
      packs: [500, 1000],
    },
    {
      slug: "sprats-hurulla",
      categoryId: fishCat.id,
      name: "Fresh Sprats",
      localName: "Hurulla (හුරුල්ලා)",
      pricePerKgCents: 98000,    // PLACEHOLDER
      stockGrams: 20000,         // PLACEHOLDER
      trackStock: true,
      storageType: "FRESH" as const,
      isFeatured: false,
      packs: [500, 1000],
    },
  ];

  for (const p of productList) {
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {
        pricePerKgCents: p.pricePerKgCents,
        stockGrams:      p.stockGrams,
        isAvailable:     true,
        isActive:        true,
      },
      create: {
        categoryId:      p.categoryId,
        slug:            p.slug,
        name:            p.name,
        localName:       p.localName,
        pricePerKgCents: p.pricePerKgCents,
        stockGrams:      p.stockGrams,
        trackStock:      p.trackStock,
        storageType:     p.storageType,
        isAvailable:     true,
        isActive:        true,
        isFeatured:      p.isFeatured,
      },
    });

    for (const w of p.packs) {
      await db.productPack.upsert({
        where: {
          productId_weightGrams: {
            productId:   product.id,
            weightGrams: w,
          },
        },
        update: {},
        create: {
          productId:   product.id,
          weightGrams: w,
          label:       w >= 1000 ? `${w / 1000} kg` : `${w} g`,
        },
      });
    }
  }

  console.log(`✅ Inserted / updated ${productList.length} demo products with pack sizes.`);
  console.log("🎉 Demo data seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Demo seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
