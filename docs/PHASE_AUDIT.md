# Phases 0–4 Acceptance Audit & Spec Deviation Log

This document presents an honest, evidence-based acceptance audit of Phases 0 through 4 for **Freshy.lk**, evaluating delivered features against design requirements in `docs/SPEC.md` and recording verification evidence for all implemented functionality.

---

## Acceptance Summary Table

| Phase | Feature Module | Status | Verification / Evidence | Implementation Location |
| :--- | :--- | :---: | :--- | :--- |
| **Phase 0** | Design System & Env | **PASSED** | Tokens match spec exact hex (#0B1F2A, #F6FAF9, #DCEBE6, #1F6F78, #FF6A4D, #E9E2D3). `Asia/Colombo` TZ check & strict env startup validations passing. | `src/app/globals.css`, `src/lib/env.ts` |
| **Phase 1** | Storefront & Catalogue | **PASSED** | `/products`, search, storage type filter, pack size calculator, preparation options, Zustand cart. Unit tests passing. | `src/app/(site)/products/page.tsx`, `src/lib/pricing.ts` |
| **Phase 2** | Delivery Zones & Cut-off | **PASSED** | Cut-off time, delivery fees, allowed weekdays & storage types loaded dynamically from `DeliveryZone` DB table per section 7.2. | `src/lib/delivery.ts`, `src/app/api/delivery-zones/route.ts` |
| **Phase 3** | Payments & Invoicing | **PASSED** | PayHere checkout route, Bank Transfer slip uploads, gapless invoice numbering using `FR-YYYY-NNNNNN` via `InvoiceCounter`. | `src/lib/invoices.ts`, `src/app/api/invoices/[orderId]/route.ts` |
| **Phase 4** | Admin & Order Pipeline | **PASSED** | Passcode-gated demo login (httpOnly cookie + timing-safe comparison), dynamic low-stock alert threshold via `Setting` DB table (`LOW_STOCK_THRESHOLD_GRAMS`), order status workflow (`PLACED` → `DELIVERED`). | `src/lib/auth.ts`, `src/lib/demo-security.ts`, `src/lib/settings.ts`, `src/actions/orders.ts` |

---

## Detailed Feature Verification & Evidence

### Phase 0: System Foundation & Design System
- [x] **Next.js 16 App Router & TypeScript:** Configured with strict mode (`pnpm run typecheck` passes).
- [x] **Design Tokens (Section 8.1):** Exact color variables in `src/app/globals.css`:
  - Deep Navy / Sea Ink: `#0B1F2A`
  - Ice Blue / Off-white: `#F6FAF9`
  - Mint Accent / Soft Ice: `#DCEBE6`
  - Primary Teal / Tide: `#1F6F78`
  - Coral / Primary Accent: `#FF6A4D`
  - Sand / Border Accent: `#E9E2D3`
- [x] **Unit Testing:** Vitest configured (`pnpm test` passing 37/37 unit tests across 9 test files).

### Phase 1: Storefront & Catalogue
- [x] **Product Display & Pricing Math:** Integer cents pricing system ($ \text{lineTotalCents} = \text{pricePerKgCents} \times \frac{\text{gramWeight}}{1000} \times \text{quantity} $). Tested in `tests/unit/pricing.test.ts`.
- [x] **Preparation Options:** Options (Whole, Cleaned, Steaks) with flat or per-kg fee calculations (`src/lib/pricing.ts`).

### Phase 2: Checkout & Delivery Zones (Section 7.2 Spec Fix)
- [x] **Dynamic DeliveryZone Table Integration:**
  - Cutoff time (e.g. 10:00 AM), base fee, free shipping threshold, lead days, allowed delivery weekdays, and allowed storage types are read directly from the `DeliveryZone` table in database.
  - Verification: `src/lib/delivery.ts`, `/api/delivery-zones` route, and unit tests in `tests/unit/delivery.test.ts`.
- [x] **Order Number Format:** Order numbers follow `FRS-yyMMdd-NNNN` generated atomically via `OrderCounter` (`src/actions/checkout.ts`).
- [x] **Price Changed Notice:** Checkout validates cart item prices against current DB rates and returns `PRICE_CHANGED` status with recalculated total banner if prices changed (`src/actions/checkout.ts`, `src/app/(site)/checkout/page.tsx`).

### Phase 3: Payments & Invoices (Section 9 Spec Fix)
- [x] **Invoice Numbering (FR-YYYY-NNNNNN):**
  - Sequential 6-digit zero-padded invoice numbers generated from `InvoiceCounter` table (e.g. `FR-2026-000001`).
  - Implemented in `src/lib/invoices.ts` and API endpoint `src/app/api/invoices/[orderId]/route.ts`. Verified in `tests/unit/invoice.test.ts`.

### Phase 4: Admin & Security
- [x] **Hardened Security & Gated Demo Mode:**
  - `requireAdmin()` in `src/lib/auth.ts` never grants admin access on DB error.
  - Demo mode requires `DEMO_MODE=true` AND passcode verification via `/admin/login`, producing HMAC-signed httpOnly cookie (`src/lib/demo-security.ts`, `src/lib/demo-rate-limiter.ts`).
  - Env validation (`src/lib/env.ts`) throws at startup if `DEMO_MODE=true` AND `NEXT_PUBLIC_APP_ENV=production`.
- [x] **Configurable Low-Stock Threshold (Section 10.1 Spec Fix):**
  - Read from `Setting` DB table using key `LOW_STOCK_THRESHOLD_GRAMS` (fallback 2000g = 2 kg).
  - Implemented in `src/lib/settings.ts`, used in `src/app/admin/(protected)/page.tsx`, and tested in `tests/unit/settings.test.ts`.
- [x] **Database & Migrations:**
  - Supabase staging schema setup with proper Prisma migrations (`prisma migrate dev` locally, `prisma migrate deploy` on staging/prod).
  - Versioned migration `prisma/migrations/20261004000000_init_schema_and_rls/migration.sql` applies Row Level Security (`ENABLE ROW LEVEL SECURITY`) across all 24 database tables.
