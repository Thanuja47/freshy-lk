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
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  envSchema,
  validateEnv,
  _resetEnvCacheForTests,
  env,
} from "@/lib/env";

describe("env.ts — lazy runtime validation", () => {
  // Save the real env and restore after each test.
  let savedEnv: Record<string, string | undefined>;

  beforeEach(() => {
    savedEnv = { ...process.env };
    _resetEnvCacheForTests();
  });

  afterEach(() => {
    // Restore every key we might have mutated.
    for (const key of Object.keys(process.env)) {
      if (!(key in savedEnv)) delete process.env[key];
    }
    Object.assign(process.env, savedEnv);
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
    // Remove vars that have defaults so we exercise them.
    delete process.env.NEXT_PUBLIC_APP_ENV;
    delete process.env.PAYHERE_MODE;
    delete process.env.CRON_SECRET;
    delete process.env.DEMO_MODE;
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
    process.env.NEXT_PUBLIC_SITE_URL = "https://freshy.lk";
    process.env.NEXT_PUBLIC_APP_ENV = "production";
    process.env.DEMO_MODE = "false";
    _resetEnvCacheForTests();

    expect(() => validateEnv()).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // 4. validateEnv() throws for invalid values.
  // -------------------------------------------------------------------------
  it("validateEnv() throws 'Environment validation failed' for invalid SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "not-a-valid-url";
    process.env.NEXT_PUBLIC_APP_ENV = "development";
    _resetEnvCacheForTests();

    expect(() => validateEnv()).toThrow("Environment validation failed");
  });

  it("validateEnv() throws for unknown NEXT_PUBLIC_APP_ENV value", () => {
    process.env.NEXT_PUBLIC_APP_ENV = "staging"; // not in enum
    _resetEnvCacheForTests();

    expect(() => validateEnv()).toThrow("Environment validation failed");
  });

  // -------------------------------------------------------------------------
  // 5. DEMO_MODE + production is a security error.
  // -------------------------------------------------------------------------
  it("validateEnv() throws security error when DEMO_MODE=true in production", () => {
    process.env.DEMO_MODE = "true";
    process.env.NEXT_PUBLIC_APP_ENV = "production";
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
