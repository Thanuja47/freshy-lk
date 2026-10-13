/**
 * tests/unit/env.test.ts
 *
 * Verifies that:
 *  1. env validation is LAZY — importing the module does NOT throw even with
 *     no env vars (build-time safety).
 *  2. The Proxy returns correct defaults when accessed.
 *  3. validateEnv() succeeds when env vars are valid.
 *  4. validateEnv() throws a descriptive error for invalid vars.
 *  5. DEMO_MODE + production env throws the security error.
 *  6. The Proxy blocks writes.
 *  7. _resetEnvCacheForTests() clears the cache between scenarios.
 *
 * NOTE: We NEVER directly assign process.env.NODE_ENV because it is a
 * read-only property. We use vi.stubEnv() for all env mutations so that
 * vi.unstubAllEnvs() in afterEach restores them cleanly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  envSchema,
  validateEnv,
  _resetEnvCacheForTests,
  env,
} from "@/lib/env";

describe("env.ts — lazy runtime validation", () => {
  beforeEach(() => {
    _resetEnvCacheForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    _resetEnvCacheForTests();
  });

  // -------------------------------------------------------------------------
  // 1. Build-time safety: the import itself never throws.
  // -------------------------------------------------------------------------
  it("the env module can be imported without throwing (build-time safety)", () => {
    // If we reached this line, the top-level import above did NOT throw.
    expect(env).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // 2. Lazy proxy returns defaults.
  // -------------------------------------------------------------------------
  it("env Proxy returns schema defaults when vars are absent", () => {
    // Delete keys that have schema defaults so we can exercise the defaults.
    // vi.stubEnv with undefined removes the key; empty string is still a value
    // and would fail enum validation. Use delete on process.env directly for
    // keys that must be absent (not merely empty).
    // vi.unstubAllEnvs() in afterEach restores them.
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", undefined as unknown as string);
    vi.stubEnv("PAYHERE_MODE", undefined as unknown as string);
    vi.stubEnv("CRON_SECRET", undefined as unknown as string);
    vi.stubEnv("DEMO_MODE", undefined as unknown as string);
    _resetEnvCacheForTests();

    expect(env.NEXT_PUBLIC_APP_ENV).toBe("development");
    expect(env.PAYHERE_MODE).toBe("sandbox");
    expect(env.CRON_SECRET).toBe("dev_cron_secret_123456");
    expect(env.DEMO_MODE).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 3. validateEnv() succeeds with valid env.
  // -------------------------------------------------------------------------
  it("validateEnv() does not throw with valid env vars", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://freshy.lk");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
    vi.stubEnv("DEMO_MODE", "false");
    // Production mode requires these vars to be present:
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@host/db");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-value");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-value");
    _resetEnvCacheForTests();

    expect(() => validateEnv()).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // 4. validateEnv() throws for invalid values.
  // -------------------------------------------------------------------------
  it("validateEnv() throws 'Environment validation failed' for invalid SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not-a-valid-url");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development");
    _resetEnvCacheForTests();

    expect(() => validateEnv()).toThrow("Environment validation failed");
  });

  it("validateEnv() throws for unknown NEXT_PUBLIC_APP_ENV value", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "staging"); // not in enum
    _resetEnvCacheForTests();

    expect(() => validateEnv()).toThrow("Environment validation failed");
  });

  // -------------------------------------------------------------------------
  // 5. DEMO_MODE + production is a security error;
  //    preview is allowed even with NODE_ENV=production (Vercel preview).
  // -------------------------------------------------------------------------
  it("validateEnv() throws security error when DEMO_MODE=true in production", () => {
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
    _resetEnvCacheForTests();

    expect(() => validateEnv()).toThrow(
      "DEMO_MODE cannot be enabled in production"
    );
  });

  it("DEMO_MODE=true is allowed in preview even when NODE_ENV=production", () => {
    // Vercel previews run with NODE_ENV=production but NEXT_PUBLIC_APP_ENV=preview.
    // vi.stubEnv handles NODE_ENV safely (no TS2540).
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "preview");
    vi.stubEnv("DEMO_MODE", "true");
    _resetEnvCacheForTests();

    expect(() => validateEnv()).not.toThrow();
    expect(env.DEMO_MODE).toBe(true);
  });

  it("DEMO_MODE=true is strictly refused when NEXT_PUBLIC_APP_ENV=production", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
    vi.stubEnv("DEMO_MODE", "true");
    _resetEnvCacheForTests();

    expect(() => validateEnv()).toThrow(
      "DEMO_MODE cannot be enabled in production"
    );
  });

  // -------------------------------------------------------------------------
  // 6. Proxy blocks writes.
  // -------------------------------------------------------------------------
  it("writing to env Proxy throws 'read-only'", () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (env as any).CRON_SECRET = "tampered";
    }).toThrow("read-only");
  });

  // -------------------------------------------------------------------------
  // 7. envSchema can be tested in isolation (pure Zod validation).
  // -------------------------------------------------------------------------
  it("envSchema.safeParse returns success with defaults-only input", () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.DEMO_MODE).toBe(false);
      expect(result.data.PAYHERE_MODE).toBe("sandbox");
    }
  });

  it("envSchema.safeParse returns error for invalid URL", () => {
    const result = envSchema.safeParse({ NEXT_PUBLIC_SITE_URL: "bad-url" });
    expect(result.success).toBe(false);
  });
});
