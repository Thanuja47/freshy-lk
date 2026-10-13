// scripts/seed.ts — Reference data seed for Freshy.lk
// Populates: categories, prep options, delivery zones, system settings, admin user.
// Safe to run in ALL environments including production.
// Does NOT insert demo products or demo prices (see scripts/seed-demo.ts).
//
// Admin bootstrap env vars (required in production):
//   ADMIN_BOOTSTRAP_EMAIL  — email address of the initial owner account
//   ADMIN_BOOTSTRAP_NAME   — display name (optional, defaults to "Freshy Owner")
//   ADMIN_BOOTSTRAP_AUTH_ID — Supabase Auth UID of the pre-created user (required in production)
//
// NOTE: No password is ever accepted or stored by this script.
//       The admin password is set exclusively through Supabase Auth
//       (Supabase dashboard / invite email / password-reset flow).

import "dotenv/config";
import { db } from "../src/lib/db";
import { SRI_LANKA_DISTRICTS } from "../src/lib/constants";

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? "development";
const ADMIN_EMAIL   = process.env.ADMIN_BOOTSTRAP_EMAIL;
const ADMIN_NAME    = process.env.ADMIN_BOOTSTRAP_NAME ?? "Freshy Owner";
const ADMIN_AUTH_ID = process.env.ADMIN_BOOTSTRAP_AUTH_ID;

// In production the caller must supply real credentials; fail fast.
if (APP_ENV === "production") {
  if (!ADMIN_EMAIL) {
    console.error("❌  seed: ADMIN_BOOTSTRAP_EMAIL is required when NEXT_PUBLIC_APP_ENV=production.");
    process.exit(1);
  }
  if (!ADMIN_AUTH_ID) {
    console.error("❌  seed: ADMIN_BOOTSTRAP_AUTH_ID is required when NEXT_PUBLIC_APP_ENV=production.");
    process.exit(1);
  }
}

async function main() {
  console.log("🌱 Seeding reference data (categories, prep options, zones, settings)…");

  // ── 1. Categories ────────────────────────────────────────────────────────────
  // NOTE: category names/slugs are client-confirmed; see docs/PLACEHOLDERS.md
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

  await db.category.upsert({
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

  // ── 2. Prep Options ──────────────────────────────────────────────────────────
  // PLACEHOLDER fees: see docs/PLACEHOLDERS.md → "Preparation fees"
  const preps = [
    { name: "Whole (Uncleaned)",  description: "Delivered whole as caught",      feeType: "FLAT"   as const, feeCents: 0,     isDefault: true  },
    { name: "Cleaned & Gutted",   description: "Scaled, gutted, and washed",     feeType: "FLAT"   as const, feeCents: 15000, isDefault: false },
    { name: "Steaks / Slices",    description: "Cut into thick steaks",          feeType: "PER_KG" as const, feeCents: 20000, isDefault: false },
    { name: "Boneless Fillet",    description: "Skinless boneless fillets",      feeType: "PER_KG" as const, feeCents: 35000, isDefault: false },
  ];

  for (const prep of preps) {
    const existing = await db.prepOption.findFirst({ where: { name: prep.name } });
    if (!existing) {
      await db.prepOption.create({
        data: {
          categoryId: fishCat.id,
          name:        prep.name,
          description: prep.description,
          feeType:     prep.feeType,
          feeCents:    prep.feeCents,
          isDefault:   prep.isDefault,
          isActive:    true,
        },
      });
    }
  }

  // ── 3. Delivery Zones (all 25 Sri Lanka districts) ───────────────────────────
  // PLACEHOLDER fees / cut-offs / lead days: see docs/PLACEHOLDERS.md → "Delivery zones"
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
          name:             z.name,
          districts:        z.districts,
          baseFeeCents:     z.baseFeeCents,
          cutoffTime:       z.cutoffTime,
          leadDays:         z.leadDays,
          sameDayAvailable: z.sameDayAvailable,
          freshnessLabel:   z.freshnessLabel,
          isActive:         true,
        },
      });
    }
  }

  // Verify all 25 districts covered
  const seededDistricts = zones.flatMap((z) => z.districts);
  const missing = SRI_LANKA_DISTRICTS.filter((d) => !seededDistricts.includes(d));
  if (missing.length === 0) {
    console.log("✅ All 25 Sri Lanka districts mapped to Delivery Zones.");
  } else {
    console.warn("⚠️  Unmapped districts:", missing);
  }

  // ── 4. System Settings ───────────────────────────────────────────────────────
  // PLACEHOLDER threshold: see docs/PLACEHOLDERS.md → "System settings"
  await db.setting.upsert({
    where:  { key: "LOW_STOCK_THRESHOLD_GRAMS" },
    update: { value: 2000 },
    create: { key: "LOW_STOCK_THRESHOLD_GRAMS", value: 2000 },
  });

  // ── 5. Admin User (bootstrap) ─────────────────────────────────────────────────
  // Email and Supabase Auth UID come from env vars (never hard-coded).
  // In development, sensible placeholder values are used so the script can
  // run without env vars for quick local setup.
  const adminEmail  = ADMIN_EMAIL   ?? "admin@freshy.lk";   // dev placeholder only
  const adminAuthId = ADMIN_AUTH_ID ?? "dev-owner-placeholder-id"; // dev placeholder only

  // Never log the password — there is no password in this record.
  // The admin password is managed entirely by Supabase Auth.
  console.log(`  → Upserting admin user: ${adminEmail} (name: "${ADMIN_NAME}")`);

  await db.adminUser.upsert({
    where:  { email: adminEmail },
    update: { role: "OWNER", isActive: true, name: ADMIN_NAME },
    create: {
      authUserId: adminAuthId,
      email:      adminEmail,
      name:       ADMIN_NAME,
      role:       "OWNER",
      isActive:   true,
    },
  });

  console.log("🎉 Reference data seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
