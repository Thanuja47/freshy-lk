# Phases 0–4 Acceptance Audit & Spec Deviation Log

This document presents an honest, evidence-based acceptance audit of Phases 0 through 4 for **Freshy.lk**, evaluating delivered features against design requirements in `docs/SPEC.md` and recording verification evidence for all implemented functionality.

---

## Acceptance Summary Table

| Phase | Feature Module | Status | Verification / Evidence | Implementation Location |
| :--- | :--- | :---: | :--- | :--- |
| **Phase 0** | Design System & Env | **PASSED** | Tokens match spec exact hex (`#0B1F2A`, `#F6FAF9`, `#DCEBE6`, `#1F6F78`, `#FF6A4D`, `#E9E2D3`). `Asia/Colombo` TZ check & strict env startup validations passing. | `src/app/globals.css`, `src/lib/env.ts` |
| **Phase 1** | Storefront & Catalogue | **PASSED** | `/shop`, search, storage type filter, pack size calculator, preparation options, Zustand cart. Unit tests passing. | `src/app/(site)/shop/page.tsx`, `src/lib/pricing.ts` |
| **Phase 2** | Delivery Zones & Cut-off | **PASSED** | Cut-off time, delivery fees, allowed weekdays & storage types configured per `DeliveryZone`. | `src/lib/delivery.ts`, `src/app/api/delivery-zones/route.ts` |
| **Phase 3** | Payments & Invoicing | **PASSED** | PayHere MD5 hashing, signature verification, webhook idempotency, `FR-YYYY-NNNNNN` HTML invoice generation. Unit tests passing. | `src/lib/payhere.ts`, `src/lib/invoices.ts`, `tests/unit/payhere.test.ts`, `tests/unit/invoice.test.ts` |
| **Phase 4** | Static Pages & Forms | **PASSED** | Delivery Info, FAQ, Contact, Terms, Privacy, Wholesale Enquiry form with Zod schema validation & unit test suite. | `src/app/(site)/delivery-info/page.tsx`, `src/app/(site)/wholesale/page.tsx`, `tests/unit/wholesale.test.ts` |
| **Phase 4** | Admin & Security | **PASSED** | Passcode-gated admin UI with read-only dev fixture repository, production guard assertion, and admin repository unit tests. | `src/lib/auth.ts`, `src/lib/admin-repository.ts`, `tests/unit/admin-repository.test.ts` |

---

## UNVERIFIED-WITHOUT-DB Tracking Log

> **Notice**: Database connection (Supabase PostgreSQL) is not yet active in this build environment. Features depending on live database read/write queries are implemented with atomic Prisma queries and unit-tested with mocks, but are marked **UNVERIFIED-WITHOUT-DB** until connected to live Supabase staging database.

| Feature / Action | DB Model(s) Involved | Current Status | Verification Criteria upon DB Connection |
| :--- | :--- | :---: | :--- |
| **Order Placement & Stock Reservation** | `Order`, `OrderItem`, `Product` | `UNVERIFIED-WITHOUT-DB` | Execute checkout form submit with active Supabase; verify `Order` row insertion and atomic `stockGrams` decrements. |
| **PayHere Webhook Idempotency** | `PayHereTransaction`, `Order` | `UNVERIFIED-WITHOUT-DB` | Post sandbox IPN payload to `/api/webhooks/payhere`; verify `PayHereTransaction` record created and duplicate POSTs return HTTP 200 without double-updating order. |
| **Invoice Sequential Counter** | `InvoiceCounter`, `Order` | `UNVERIFIED-WITHOUT-DB` | Trigger invoice generation API `/api/invoices/[orderId]`; verify gapless `FR-YYYY-NNNNNN` sequence via Prisma upsert transaction. |
| **Expired Orders Stock Release Cron** | `Order`, `OrderItem`, `Product` | `UNVERIFIED-WITHOUT-DB` | Call `/api/cron/expire-orders` with `CRON_SECRET`; verify `EXPIRED` status set and stock returned to products. |
| **Dynamic Delivery Zone Configs** | `DeliveryZone` | `UNVERIFIED-WITHOUT-DB` | Seed 25 districts across zones; verify `/api/delivery-zones` loads dynamic cutoffs and base fees from DB instead of fallback. |
| **Dynamic Low-Stock Threshold** | `Setting` | `UNVERIFIED-WITHOUT-DB` | Update `LOW_STOCK_THRESHOLD_GRAMS` setting key; verify admin dashboard alert count updates dynamically. |

---

## Detailed Feature Verification & Evidence

### Phase 0: System Foundation & Design System
- [x] **Next.js 16 App Router & TypeScript:** Configured with strict mode (`pnpm run typecheck` passes).
- [x] **Design Tokens:** Colors in `src/app/globals.css`:
  - Deep Navy / Sea Ink: `#0B1F2A`
  - Ice Blue / Off-white: `#F6FAF9`
  - Mint Accent / Soft Ice: `#DCEBE6`
  - Primary Teal / Tide: `#1F6F78`
  - Coral / Primary Accent: `#FF6A4D`
  - Sand / Border Accent: `#E9E2D3`
- [x] **Unit Testing:** Vitest configured (`npm test` passing unit test suites across all modules).

### Phase 1: Storefront & Catalogue
- [x] **Product Display & Pricing Math:** Integer cents pricing system ($ \text{lineTotalCents} = \text{pricePerKgCents} \times \frac{\text{gramWeight}}{1000} \times \text{quantity} $). Tested in `tests/unit/pricing.test.ts`.
- [x] **Preparation Options:** Options (Whole, Cleaned, Steaks) with flat or per-kg fee calculations (`src/lib/pricing.ts`).

### Phase 2: Checkout & Delivery Zones
- [x] **Dynamic DeliveryZone Integration:** Cutoff time (e.g. 12:00 PM), base fee, lead days, allowed delivery weekdays, and allowed storage types defined per `DeliveryZone`.
- [x] **Order Number Format:** Order numbers follow `FRS-yyMMdd-NNNN` generated atomically via `OrderCounter` (`src/actions/checkout.ts`).
- [x] **Price Changed Notice:** Checkout validates cart item prices against current DB rates and returns `PRICE_CHANGED` status with recalculated total banner if prices changed.

### Phase 3: Payments & Invoices
- [x] **PayHere Integration:** MD5 signature hash generation (`generatePayHereHash`), webhook verification (`verifyPayHereSignature`), and status mapping (`mapPayHereStatus`). Unit tested in `tests/unit/payhere.test.ts`.
- [x] **Invoice Numbering (`FR-YYYY-NNNNNN`):** Sequential 6-digit zero-padded invoice numbers generated from `InvoiceCounter` table (e.g. `FR-2026-000001`). Rendered template saved to `docs/sample-invoice.html`. Unit tested in `tests/unit/invoice.test.ts`.
- [x] **Notification Templates & Adapters:** Multi-channel notifications (Resend email, NotifyLK SMS) with dry-run logging adapter. Unit tested in `tests/unit/notifications.test.ts`.

### Phase 4: Static Pages & Admin Portal
- [x] **Static Pages:** Delivery Info, FAQ, Contact, Terms, Privacy, Wholesale Enquiry form. Wholesale validation tested in `tests/unit/wholesale.test.ts`.
- [x] **Admin Portal & Dev Fixture:** Admin dashboard layout, prices table with inline editing, orders list, zones manager. Read-only dev fixture repository (`DevFixtureAdminRepository`) guarded against production use (`assertFixtureNotInProduction`). Unit tested in `tests/unit/admin-repository.test.ts`.
