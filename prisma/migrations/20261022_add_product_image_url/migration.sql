-- Migration: Add imageUrl column to Product table
-- This column was previously added via raw SQL outside of Prisma migrations.
-- This migration makes it official so `prisma migrate deploy` on a fresh DB will include it.

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
