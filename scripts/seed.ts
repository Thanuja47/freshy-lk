// scripts/seed.ts — Seed database script for Freshy.lk Supabase Instance

import "dotenv/config";
import { db } from "../src/lib/db";
import { SRI_LANKA_DISTRICTS } from "../src/lib/constants";

async function main() {
  console.log("🌱 Starting Freshy.lk database seed on Supabase...");

  // 1. Categories
  const fishCat = await db.category.upsert({
    where: { slug: "fresh-fish" },
    update: {},
    create: {
      slug: "fresh-fish",
      name: "Fresh Fish",
      description: "Wild caught ocean fish landed daily along Sri Lanka coastal harbors.",
      sortOrder: 1,
      isActive: true,
    },
  });

  const seafoodCat = await db.category.upsert({
    where: { slug: "shellfish-seafood" },
    update: {},
    create: {
      slug: "shellfish-seafood",
      name: "Shellfish & Seafood",
      description: "Premium tiger prawns, lagoon crabs, cuttlefish, and squid.",
      sortOrder: 2,
      isActive: true,
    },
  });

  // 2. Prep Options
  const preps = [
    { name: "Whole (Uncleaned)", description: "Delivered whole as caught", feeType: "FLAT" as const, feeCents: 0, isDefault: true },
    { name: "Cleaned & Gutted", description: "Scaled, gutted, and washed", feeType: "FLAT" as const, feeCents: 15000, isDefault: false },
    { name: "Steaks / Slices", description: "Cut into thick steaks", feeType: "PER_KG" as const, feeCents: 20000, isDefault: false },
    { name: "Boneless Fillet", description: "Skinless boneless fillets", feeType: "PER_KG" as const, feeCents: 35000, isDefault: false },
  ];

  for (const prep of preps) {
    const existing = await db.prepOption.findFirst({ where: { name: prep.name } });
    if (!existing) {
      await db.prepOption.create({
        data: {
          categoryId: fishCat.id,
          name: prep.name,
          description: prep.description,
          feeType: prep.feeType,
          feeCents: prep.feeCents,
          isDefault: prep.isDefault,
          isActive: true,
        },
      });
    }
  }

  // 3. Products (~12 products)
  const productList = [
    {
      slug: "yellowfin-tuna",
      categoryId: fishCat.id,
      name: "Yellowfin Tuna",
      localName: "Kelawalla (කෙලවල්ලා)",
      pricePerKgCents: 180000,
      stockGrams: 25000,
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
      pricePerKgCents: 240000,
      stockGrams: 15000,
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
      pricePerKgCents: 120000,
      stockGrams: 30000,
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
      pricePerKgCents: 175000,
      stockGrams: 20000,
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
      pricePerKgCents: 210000,
      stockGrams: 12000,
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
      pricePerKgCents: 195000,
      stockGrams: 18000,
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
      pricePerKgCents: 185000,
      stockGrams: 22000,
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
      pricePerKgCents: 160000,
      stockGrams: 15000,
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
      pricePerKgCents: 320000,
      stockGrams: 10000,
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
      pricePerKgCents: 260000,
      stockGrams: 8000,
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
      pricePerKgCents: 210000,
      stockGrams: 14000,
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
      pricePerKgCents: 98000,
      stockGrams: 20000,
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
        stockGrams: p.stockGrams,
        isAvailable: true,
        isActive: true,
      },
      create: {
        categoryId: p.categoryId,
        slug: p.slug,
        name: p.name,
        localName: p.localName,
        pricePerKgCents: p.pricePerKgCents,
        stockGrams: p.stockGrams,
        trackStock: p.trackStock,
        storageType: p.storageType,
        isAvailable: true,
        isActive: true,
        isFeatured: p.isFeatured,
      },
    });

    for (const w of p.packs) {
      await db.productPack.upsert({
        where: {
          productId_weightGrams: {
            productId: product.id,
            weightGrams: w,
          },
        },
        update: {},
        create: {
          productId: product.id,
          weightGrams: w,
          label: w >= 1000 ? `${w / 1000} kg` : `${w} g`,
        },
      });
    }
  }

  // 4. Delivery Zones covering all 25 Sri Lanka Districts
  const zones = [
    {
      name: "Colombo Metro Express",
      districts: ["Colombo"],
      baseFeeCents: 35000,
      cutoffTime: "12:00",
      leadDays: 0,
      sameDayAvailable: true,
      freshnessLabel: "Same-Day Evening Delivery (Order before 12 PM)",
    },
    {
      name: "Western Province Region",
      districts: ["Gampaha", "Kalutara"],
      baseFeeCents: 45000,
      cutoffTime: "12:00",
      leadDays: 0,
      sameDayAvailable: true,
      freshnessLabel: "Same-Day Evening Delivery (Order before 12 PM)",
    },
    {
      name: "Central & Southern Region",
      districts: ["Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Hambantota"],
      baseFeeCents: 55000,
      cutoffTime: "10:00",
      leadDays: 1,
      sameDayAvailable: false,
      freshnessLabel: "Next-Day Cold-Chain Delivery",
    },
    {
      name: "North Western & North Central Region",
      districts: ["Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa"],
      baseFeeCents: 60000,
      cutoffTime: "10:00",
      leadDays: 1,
      sameDayAvailable: false,
      freshnessLabel: "Next-Day Cold-Chain Delivery",
    },
    {
      name: "Northern & Eastern Region",
      districts: ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee"],
      baseFeeCents: 75000,
      cutoffTime: "09:00",
      leadDays: 2,
      sameDayAvailable: false,
      freshnessLabel: "Chilled Express Delivery (48h)",
    },
    {
      name: "Uva & Sabaragamuwa Region",
      districts: ["Badulla", "Moneragala", "Ratnapura", "Kegalle"],
      baseFeeCents: 65000,
      cutoffTime: "10:00",
      leadDays: 1,
      sameDayAvailable: false,
      freshnessLabel: "Next-Day Cold-Chain Delivery",
    },
  ];

  for (const z of zones) {
    const existing = await db.deliveryZone.findFirst({ where: { name: z.name } });
    if (!existing) {
      await db.deliveryZone.create({
        data: {
          name: z.name,
          districts: z.districts,
          baseFeeCents: z.baseFeeCents,
          cutoffTime: z.cutoffTime,
          leadDays: z.leadDays,
          sameDayAvailable: z.sameDayAvailable,
          freshnessLabel: z.freshnessLabel,
          isActive: true,
        },
      });
    }
  }

  // Verify all 25 districts are covered
  const seededDistricts = zones.flatMap((z) => z.districts);
  const missing = SRI_LANKA_DISTRICTS.filter((d) => !seededDistricts.includes(d));
  if (missing.length === 0) {
    console.log("✅ All 25 Sri Lanka districts successfully mapped to Delivery Zones.");
  } else {
    console.warn("⚠️ Unmapped districts:", missing);
  }

  // 5. System Settings
  await db.setting.upsert({
    where: { key: "LOW_STOCK_THRESHOLD_GRAMS" },
    update: { value: 2000 },
    create: { key: "LOW_STOCK_THRESHOLD_GRAMS", value: 2000 },
  });

  console.log("🎉 Supabase database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
