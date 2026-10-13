import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { signDemoSession } from "@/lib/demo-session";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

// Mock next/headers
const mockGetCookie = vi.fn();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: mockGetCookie,
  }),
}));

// Mock db
const mockDbAdminUserFindUnique = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    adminUser: {
      findUnique: (...args: unknown[]) => mockDbAdminUserFindUnique(...args),
    },
  },
}));

// Mock supabase server client
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

describe("Security & Authentication - requireAdmin", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("(a) DB error in production must not grant admin access and rethrow DB error", async () => {
    vi.stubEnv("DEMO_MODE", "false");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
    mockGetUser.mockResolvedValueOnce({ data: { user: { email: "admin@freshy.lk" } } });
    mockDbAdminUserFindUnique.mockRejectedValueOnce(new Error("Database connection error"));

    const { requireAdmin } = await import("@/lib/auth");

    await expect(requireAdmin()).rejects.toThrow("Database connection error");
  });

  it("(b) DEMO_MODE=true without correct passcode cookie must deny access and redirect to login", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("DEMO_ADMIN_PASSCODE", "secret-passcode-123");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development");
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    mockGetCookie.mockReturnValue(undefined); // No passcode cookie

    const { requireAdmin } = await import("@/lib/auth");

    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
  });

  it("(c) DEMO_MODE=true with correct passcode cookie must return demo admin user", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("DEMO_ADMIN_PASSCODE", "secret-passcode-123");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development");
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const validToken = signDemoSession("secret-passcode-123");
    mockGetCookie.mockReturnValue({ value: validToken });

    const { requireAdmin } = await import("@/lib/auth");

    const admin = await requireAdmin();
    expect(admin).toBeDefined();
    expect(admin.id).toBe("demo-owner-id");
    expect(admin.role).toBe("OWNER");
  });

  it("(d) DEMO_MODE=true + NEXT_PUBLIC_APP_ENV=production must throw error when env is accessed", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");

    const { env, _resetEnvCacheForTests } = await import("@/lib/env");
    _resetEnvCacheForTests();

    expect(() => {
      void env.DEMO_MODE;
    }).toThrow(/DEMO_MODE cannot be enabled in production environment/);
  });
});
