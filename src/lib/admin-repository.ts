// src/lib/admin-repository.ts — Repository interface for Admin UI data reads
// Switches between the real DB adapter and the read-only dev fixture
// based on NODE_ENV and NEXT_PUBLIC_APP_ENV.
//
// SECURITY GUARD: The dev fixture must NEVER be used in production.
// If enabled/requested in production, the app refuses to start.

import { env } from "@/lib/env";

// ─── Guard: refuse to start if fixture enabled in production ─────────────────
export function assertFixtureNotInProduction(): void {
  const isProduction =
    env.NEXT_PUBLIC_APP_ENV === "production" || process.env.NODE_ENV === "production";
  const fixtureRequestedInProd =
    process.env.ENABLE_DEV_FIXTURE === "true" || process.env.FORCE_DEV_FIXTURE === "true";

  if (isProduction && fixtureRequestedInProd) {
    throw new Error(
      "SECURITY: Dev fixture repository cannot be active in production. " +
        "Set NEXT_PUBLIC_APP_ENV=production and NODE_ENV=production."
    );
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AdminProductRow {
  id: string;
  name: string;
  localName: string | null;
  categoryName: string;
  pricePerKgCents: number;
  stockGrams: number;
  trackStock: boolean;
  isAvailable: boolean;
  priceUpdatedAt: string;
  imageUrl: string | null;
}

export interface AdminOrderSummaryRow {
  id: string;
  orderNo: string;
  customerName: string;
  phone: string;
  city: string;
  district: string;
  totalCents: number;
  status: string;
  zoneName: string;
  createdAt: string;
  deliveryDate: string;
}

export interface AdminZoneRow {
  id: string;
  name: string;
  districts: string[];
  baseFeeCents: number;
  cutoffTime: string;
  leadDays: number;
  sameDayAvailable: boolean;
  isActive: boolean;
}

export interface IAdminRepository {
  getProducts(): Promise<AdminProductRow[]>;
  getOrderSummaries(limit?: number): Promise<AdminOrderSummaryRow[]>;
  getZones(): Promise<AdminZoneRow[]>;
}

// ─── Dev Fixture (read-only, enabled only outside production) ─────────────────
export class DevFixtureAdminRepository implements IAdminRepository {
  async getProducts(): Promise<AdminProductRow[]> {
    return [
      {
        id: "fixture-product-1",
        name: "Yellowfin Tuna",
        localName: "Kelawalla",
        categoryName: "Fish",
        pricePerKgCents: 180000,
        stockGrams: 10000,
        trackStock: true,
        isAvailable: true,
        priceUpdatedAt: new Date().toISOString(),
        imageUrl: "/placeholders/yellowfin-tuna.jpg",
      },
      {
        id: "fixture-product-2",
        name: "Seer Fish",
        localName: "Thora",
        categoryName: "Fish",
        pricePerKgCents: 220000,
        stockGrams: 5000,
        trackStock: true,
        isAvailable: true,
        priceUpdatedAt: new Date().toISOString(),
        imageUrl: "/placeholders/seer-fish.jpg",
      },
      {
        id: "fixture-product-3",
        name: "Tiger Prawns",
        localName: null,
        categoryName: "Seafood",
        pricePerKgCents: 320000,
        stockGrams: 3000,
        trackStock: true,
        isAvailable: true,
        priceUpdatedAt: new Date().toISOString(),
        imageUrl: "/placeholders/tiger-prawns.jpg",
      },
    ];
  }

  async getOrderSummaries(limit = 20): Promise<AdminOrderSummaryRow[]> {
    return [
      {
        id: "fixture-order-1",
        orderNo: "FRS-261008-0001",
        customerName: "Nimal Jayasinghe",
        phone: "+94771234567",
        city: "Colombo 03",
        district: "Colombo",
        totalCents: 510000,
        status: "PLACED",
        zoneName: "Colombo Greater Zone",
        createdAt: new Date().toISOString(),
        deliveryDate: new Date().toISOString(),
      },
      {
        id: "fixture-order-2",
        orderNo: "FRS-261008-0002",
        customerName: "Sunil Perera",
        phone: "+94771112233",
        city: "Kandy",
        district: "Kandy",
        totalCents: 375000,
        status: "CONFIRMED",
        zoneName: "Outstation Zone",
        createdAt: new Date().toISOString(),
        deliveryDate: new Date().toISOString(),
      },
    ].slice(0, limit);
  }

  async getZones(): Promise<AdminZoneRow[]> {
    return [
      {
        id: "fixture-zone-1",
        name: "Colombo Greater Zone",
        districts: ["Colombo", "Gampaha", "Kalutara"],
        baseFeeCents: 35000,
        cutoffTime: "12:00",
        leadDays: 0,
        sameDayAvailable: true,
        isActive: true,
      },
      {
        id: "fixture-zone-2",
        name: "Outstation Zone",
        districts: ["Kandy", "Galle", "Matara", "Kurunegala", "Kegalle"],
        baseFeeCents: 50000,
        cutoffTime: "12:00",
        leadDays: 1,
        sameDayAvailable: false,
        isActive: true,
      },
    ];
  }
}

// ─── DB Repository (real Prisma, used in production and staging) ──────────────
export class DbAdminRepository implements IAdminRepository {
  async getProducts(): Promise<AdminProductRow[]> {
    const { db } = await import("@/lib/db");
    const products = await db.product.findMany({
      where: { isActive: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: {
        category: { select: { name: true } },
        images: { select: { url: true }, take: 1 },
      },
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      localName: p.localName,
      categoryName: p.category.name,
      pricePerKgCents: p.pricePerKgCents,
      stockGrams: p.stockGrams,
      trackStock: p.trackStock,
      isAvailable: p.isAvailable,
      priceUpdatedAt: p.priceUpdatedAt.toISOString(),
      imageUrl: p.images[0]?.url ?? null,
    }));
  }

  async getOrderSummaries(limit = 50): Promise<AdminOrderSummaryRow[]> {
    const { db } = await import("@/lib/db");
    const orders = await db.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { zone: { select: { name: true } } },
    });
    return orders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      customerName: o.customerName,
      phone: o.phone,
      city: o.city,
      district: o.district,
      totalCents: o.totalCents,
      status: o.status,
      zoneName: o.zone.name,
      createdAt: o.createdAt.toISOString(),
      deliveryDate: o.deliveryDate.toISOString(),
    }));
  }

  async getZones(): Promise<AdminZoneRow[]> {
    const { db } = await import("@/lib/db");
    const zones = await db.deliveryZone.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return zones.map((z) => ({
      id: z.id,
      name: z.name,
      districts: z.districts,
      baseFeeCents: z.baseFeeCents,
      cutoffTime: z.cutoffTime,
      leadDays: z.leadDays,
      sameDayAvailable: z.sameDayAvailable,
      isActive: z.isActive,
    }));
  }
}

// ─── Factory: auto-selects fixture in non-production, DB in production ─────────
export function getAdminRepository(): IAdminRepository {
  assertFixtureNotInProduction();

  const useFixture =
    process.env.NODE_ENV !== "production" &&
    env.NEXT_PUBLIC_APP_ENV !== "production";

  if (useFixture) {
    console.log("[AdminRepository] Using dev fixture (non-production). NEVER use in production.");
    return new DevFixtureAdminRepository();
  }

  return new DbAdminRepository();
}
