import { describe, it, expect, vi, afterEach } from "vitest";

describe("admin-repository: production guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("assertFixtureNotInProduction: does NOT throw in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development");
    vi.resetModules();

    const { assertFixtureNotInProduction } = await import("@/lib/admin-repository");
    expect(() => assertFixtureNotInProduction()).not.toThrow();
  });

  it("assertFixtureNotInProduction: throws error if fixture requested in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
    vi.stubEnv("ENABLE_DEV_FIXTURE", "true");
    vi.resetModules();

    const { assertFixtureNotInProduction } = await import("@/lib/admin-repository");
    expect(() => assertFixtureNotInProduction()).toThrow("SECURITY: Dev fixture repository cannot be active in production");
  });

  it("getAdminRepository: returns DevFixtureAdminRepository in dev", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development");
    vi.resetModules();

    const { getAdminRepository, DevFixtureAdminRepository } = await import("@/lib/admin-repository");
    const repo = getAdminRepository();
    expect(repo).toBeInstanceOf(DevFixtureAdminRepository);

    const products = await repo.getProducts();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
    for (const p of products) {
      expect(typeof p.id).toBe("string");
      expect(typeof p.name).toBe("string");
      expect(typeof p.pricePerKgCents).toBe("number");
      expect(typeof p.stockGrams).toBe("number");
      expect(typeof p.isAvailable).toBe("boolean");
    }
  });

  it("DevFixture.getOrderSummaries: returns fixture orders in dev", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development");
    vi.resetModules();

    const { getAdminRepository } = await import("@/lib/admin-repository");
    const repo = getAdminRepository();
    const orders = await repo.getOrderSummaries(5);

    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
    for (const o of orders) {
      expect(typeof o.orderNo).toBe("string");
      expect(typeof o.totalCents).toBe("number");
      expect(typeof o.status).toBe("string");
    }
  });

  it("DevFixture.getZones: returns fixture zones in dev", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development");
    vi.resetModules();

    const { getAdminRepository } = await import("@/lib/admin-repository");
    const repo = getAdminRepository();
    const zones = await repo.getZones();

    expect(Array.isArray(zones)).toBe(true);
    expect(zones.length).toBeGreaterThan(0);
    for (const z of zones) {
      expect(typeof z.name).toBe("string");
      expect(Array.isArray(z.districts)).toBe(true);
      expect(typeof z.baseFeeCents).toBe("number");
      expect(typeof z.isActive).toBe("boolean");
    }
  });
});
