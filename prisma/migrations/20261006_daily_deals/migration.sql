-- Migration: 20261006_daily_deals
-- Adds optional offer fields to Product and snapshots offer price on OrderItem.
-- Apply with: prisma migrate deploy (or psql manually)

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "offerPercent" INTEGER,
  ADD COLUMN IF NOT EXISTS "offerEndsAt"  TIMESTAMPTZ;

-- Constraint: offerPercent must be between 1 and 50 when set
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_offerPercent_range"
  CHECK ("offerPercent" IS NULL OR ("offerPercent" >= 1 AND "offerPercent" <= 50));

ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "offerPricePerKgCents" INTEGER;
