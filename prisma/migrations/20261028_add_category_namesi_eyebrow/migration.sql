-- Migration: Add nameSi and eyebrow columns to Category table
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "nameSi" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "eyebrow" TEXT;
