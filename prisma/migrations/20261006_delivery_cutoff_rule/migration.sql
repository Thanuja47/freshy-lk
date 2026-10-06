-- AlterTable: Add cutoff, sameDayAvailable, and maxSameDayOrders to DeliveryZone
ALTER TABLE "DeliveryZone" ADD COLUMN IF NOT EXISTS "sameDayAvailable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "DeliveryZone" ADD COLUMN IF NOT EXISTS "maxSameDayOrders" INTEGER;
ALTER TABLE "DeliveryZone" ADD COLUMN IF NOT EXISTS "currentSameDayOrders" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DeliveryZone" ALTER COLUMN "cutoffTime" SET DEFAULT '12:00';
