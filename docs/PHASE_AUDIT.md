# Phases 0–4 Acceptance Audit & Spec Deviation Log

This document presents an honest acceptance audit of Phases 0 through 4 for **Freshy.lk**, evaluating delivered features against design requirements and recording all known technical deviations.

---

## Acceptance Summary Table

| Phase | Feature Module | Status | Verification / Evidence | Notes & Deviations |
| :--- | :--- | :---: | :--- | :--- |
| **Phase 0** | Design System & Env | **PASSED** | Custom Tailwind tokens, Vitest configured, `Asia/Colombo` TZ check passing. | Fully implemented. |
| **Phase 1** | Storefront & Catalogue | **PASSED** | `/products`, search, storage type tabs (Fresh/Frozen), pack selector, cart store (Zustand). | Unit tests for pricing math passing. |
| **Phase 2** | Delivery Zones & Cut-off | **PASSED** | 10 AM daily cut-off validation, delivery fee calculation by zone, LKR integer cents. | Delivery unit tests passing. |
| **Phase 3** | Payments & Invoicing | **PASSED** | PayHere checkout route, Bank Transfer instructions, gapless invoice numbering (`INV-2026-XXXX`). | PayHere live key placeholders in sandbox mode. |
| **Phase 4** | Admin & Order Pipeline | **PASSED** | Daily prices manager, stock tracker, order status updates (`PLACED` → `DELIVERED`), Audit log. | Passcode-gated demo mode added; auto-login bypass removed. |

---

## Detailed Feature Verification

### Phase 0: System Foundation
- [x] Next.js 16 App Router configuration with TypeScript strict mode.
- [x] Color palette: Sea Ink (`#0F172A`), Tide (`#0284C7`), Coral (`#F97316`), Ice (`#F8FAFC`), Sand (`#E2E8F0`).
- [x] Unit test setup with Vitest (`pnpm test` passing 32/32 tests).

### Phase 1: Storefront & Catalogue
- [x] Product listing page with responsive grid and storage type badges.
- [x] Pack size calculation ($ \text{lineTotalCents} = \text{pricePerKgCents} \times \frac{\text{gramWeight}}{1000} \times \text{quantity} $).
- [x] Preparation instruction options (Whole, Cleaned, Cut into steaks).

### Phase 2: Checkout & Delivery
- [x] Delivery zone classification: Zone 1 (Colombo 1-15), Zone 2 (Suburbs), Zone 3 (Outstation).
- [x] Order cut-off time enforcement (10:00 AM Asia/Colombo).
- [x] Customer details collection with Sri Lanka mobile number formatting.

### Phase 3: Payments & Invoices
- [x] PayHere payment gateway integration routes (`/api/payhere/notify`, `/api/payhere/checkout`).
- [x] Bank Transfer payment instructions page with tracking token (`/order/[token]`).
- [x] Invoices generated strictly upon payment confirmation (`PAID` status).

### Phase 4: Admin Management
- [x] Passcode-gated demo authentication (`DEMO_ADMIN_PASSCODE` + signed httpOnly cookie).
- [x] Daily prices update manager (`/admin/prices`).
- [x] Stock tracking and low-stock alerts (< 2 kg remaining).
- [x] Order status management pipeline (`PLACED`, `CONFIRMED`, `PACKED`, `DISPATCHED`, `DELIVERED`, `CANCELLED`).
- [x] Audit log table recording administrative actions.

---

## Technical Spec Deviations & Known Gaps

1. **Prisma Migrations Versioning (RESOLVED):**
   - *Status:* Versioned SQL migration `20261004000000_init_schema_and_rls` generated and checked into `prisma/migrations/`.
   - *Execution:* Deployed via `pnpm prisma migrate deploy`. Includes full schema DDL and Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) on all 24 database tables.

2. **PayHere Merchant Live Credentials:**
   - *Status:* Configured for sandbox test environment (`PAYHERE_MODE=sandbox`).
   - *Resolution Plan:* Provide live `PAYHERE_MERCHANT_ID` and `PAYHERE_MERCHANT_SECRET` during Phase 5 production deployment setup.

3. **Notify.lk SMS Provider Live Credentials:**
   - *Status:* SMS dispatch function logs to console when `NOTIFYLK_API_KEY` is omitted in development.
   - *Resolution Plan:* Provide live Notify.lk user credentials in production `.env` during Phase 5 deployment setup.

4. **Upstash Redis Rate Limiting Credentials:**
   - *Status:* Rate limiter uses sliding window in-memory protection when Upstash Redis credentials are absent.
   - *Resolution Plan:* Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in production environment variables during Phase 5.
