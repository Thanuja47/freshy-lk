import { z } from "zod";

export const envSchema = z.object({
  // App
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "preview", "production"]).default("development"),
  DEMO_MODE: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
  DEMO_ADMIN_PASSCODE: z.string().optional().or(z.literal("")),
  TZ: z.string().default("Asia/Colombo"),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal("")),
  DATABASE_URL: z.string().optional().or(z.literal("")),
  DIRECT_URL: z.string().optional().or(z.literal("")),

  // Seed
  SEED_ADMIN_EMAIL: z.string().email().optional().or(z.literal("")),
  SEED_ADMIN_PASSWORD: z.string().optional().or(z.literal("")),

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

  // Protection
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

export const env = envSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  DEMO_MODE: process.env.DEMO_MODE,
  DEMO_ADMIN_PASSCODE: process.env.DEMO_ADMIN_PASSCODE,
  TZ: process.env.TZ,

  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,

  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,

  PAYHERE_MODE: process.env.PAYHERE_MODE,
  PAYHERE_MERCHANT_ID: process.env.PAYHERE_MERCHANT_ID,
  PAYHERE_MERCHANT_SECRET: process.env.PAYHERE_MERCHANT_SECRET,

  SMS_PROVIDER: process.env.SMS_PROVIDER,
  NOTIFYLK_USER_ID: process.env.NOTIFYLK_USER_ID,
  NOTIFYLK_API_KEY: process.env.NOTIFYLK_API_KEY,
  NOTIFYLK_SENDER_ID: process.env.NOTIFYLK_SENDER_ID,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  OWNER_NOTIFY_EMAIL: process.env.OWNER_NOTIFY_EMAIL,
  OWNER_NOTIFY_PHONE: process.env.OWNER_NOTIFY_PHONE,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,

  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,

  SENTRY_DSN: process.env.SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,

  CRON_SECRET: process.env.CRON_SECRET,
});

if (env.DEMO_MODE && env.NEXT_PUBLIC_APP_ENV === "production") {
  throw new Error("SECURITY RISK: DEMO_MODE cannot be enabled in production environment.");
}

