/**
 * src/lib/env.ts
 *
 * Environment variable validation — RUNTIME ONLY, never at build time.
 *
 * Design:
 *  - `env` is a lazy Proxy. The Zod parse runs on the FIRST property access,
 *    which happens during a real request (or server startup), never during
 *    `next build`.
 *  - In production, `validateEnv()` is called from `instrumentation.ts` so
 *    the server refuses to start if required vars are missing.
 *  - Client components must read NEXT_PUBLIC_* from `process.env` directly
 *    (Next.js inlines them at build time). Do NOT import `env` in "use client"
 *    files.
 */

import { z } from "zod";

export const envSchema = z.object({
  // App
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_ENV: z
    .enum(["development", "preview", "production"])
    .default("development"),
  DEMO_MODE: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .default(false),
  DEMO_ADMIN_PASSCODE: z.string().optional().or(z.literal("")),
  DEMO_HMAC_SECRET: z.string().optional().or(z.literal("")),
  TZ: z.string().default("Asia/Colombo"),

  // Supabase / DB
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal("")),
  DATABASE_URL: z.string().optional().or(z.literal("")),
  DIRECT_URL: z.string().optional().or(z.literal("")),

  // Seed bootstrap (no password field — passwords live in Supabase Auth only)
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().optional().or(z.literal("")),
  ADMIN_BOOTSTRAP_NAME: z.string().optional().or(z.literal("")),
  ADMIN_BOOTSTRAP_AUTH_ID: z.string().optional().or(z.literal("")),

  // PayHere
  PAYHERE_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
  PAYHERE_MERCHANT_ID: z.string().optional().or(z.literal("")),
  PAYHERE_MERCHANT_SECRET: z.string().optional().or(z.literal("")),

  // Notifications
  SMS_PROVIDER: z.string().default("notifylk"),
  NOTIFYLK_USER_ID: z.string().optional().or(z.literal("")),
  NOTIFYLK_API_KEY: z.string().optional().or(z.literal("")),
  NOTIFYLK_SENDER_ID: z.string().optional().or(z.literal("")),
  RESEND_API_KEY: z.string().optional().or(z.literal("")),
  EMAIL_FROM: z.string().default("Freshy.lk <orders@freshy.lk>"),
  OWNER_NOTIFY_EMAIL: z.string().email().optional().or(z.literal("")),
  OWNER_NOTIFY_PHONE: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().default("94770000000"),

  // Protection / Rate-limiting
  UPSTASH_REDIS_REST_URL: z.string().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional().or(z.literal("")),
  TURNSTILE_SECRET_KEY: z.string().optional().or(z.literal("")),

  // Monitoring
  SENTRY_DSN: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().or(z.literal("")),
  SENTRY_AUTH_TOKEN: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_GA_ID: z.string().optional().or(z.literal("")),

  // Cron
  CRON_SECRET: z.string().default("dev_cron_secret_123456"),
});

export type Env = z.infer<typeof envSchema>;

// ---------------------------------------------------------------------------
// Lazy singleton — parse is deferred until first property access.
// This means `next build` never triggers validation.
// ---------------------------------------------------------------------------

let _parsed: Env | null = null;

function getParsed(): Env {
  if (_parsed) return _parsed;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${issues}`);
  }
  // Production safety guard: DEMO_MODE must not be true in production.
  if (result.data.DEMO_MODE && result.data.NEXT_PUBLIC_APP_ENV === "production") {
    throw new Error(
      "SECURITY RISK: DEMO_MODE cannot be enabled in production environment."
    );
  }

  // Production required variables check.
  // Key ONLY on NEXT_PUBLIC_APP_ENV — never on NODE_ENV.
  // Vercel previews have NODE_ENV=production but APP_ENV=preview, so they
  // must NOT trigger the production hard-fail.
  const isProductionAppEnv = result.data.NEXT_PUBLIC_APP_ENV === "production";

  if (isProductionAppEnv) {
    const requiredProdVars: (keyof Env)[] = [
      "DATABASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];
    const missing = requiredProdVars.filter((key) => !result.data[key]);
    if (missing.length > 0) {
      throw new Error(
        `Production startup failed: Required production environment variables are missing:\n  ${missing.join(", ")}`
      );
    }
  }

  _parsed = result.data;
  return _parsed;
}

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return getParsed()[prop as keyof Env];
  },
  set() {
    throw new Error("env is read-only");
  },
});

// ---------------------------------------------------------------------------
// validateEnv() — call from instrumentation.ts to fail-fast at server startup.
// ---------------------------------------------------------------------------

/**
 * Validates all environment variables. Throws a descriptive error if any
 * required variable is missing or invalid. Safe to call multiple times.
 *
 * In production this must be called before accepting traffic (see instrumentation.ts).
 * In test environments the parse errors are the test subject — do not call this.
 */
export function validateEnv(): Env {
  return getParsed();
}

/** Reset the parsed cache — only use in tests. */
export function _resetEnvCacheForTests(): void {
  _parsed = null;
}
