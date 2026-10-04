# Freshy.lk — System Specification (SPEC.md)

This document defines the complete technical specifications for the **Freshy.lk** Sri Lankan seafood e-commerce platform across Phases 0 through 5.

---

## 1. Vision & Core Philosophy
Freshy.lk connects local Sri Lankan fisheries directly to retail consumers and wholesale B2B buyers (hotels, restaurants, catering services). All pricing is based on daily catch rates per kilogram.

---

## 2. Architecture & Technology Stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict mode)
- **Database:** Supabase Postgres with Prisma ORM
- **Authentication:** Supabase Auth (`@supabase/ssr`) with passcode-gated DEMO_MODE fallback for testing
- **Styling:** Vanilla Tailwind CSS with curated design tokens
- **Testing:** Vitest for unit tests, Playwright for E2E tests

---

## 3. Data Integrity & Financial Models
- **Monetary Amounts:** Stored as integer LKR cents ($1\text{ LKR} = 100\text{ cents}$)
- **Weight Storage:** Stored in integer grams ($1\text{ kg} = 1000\text{ g}$)
- **Invoices:** Gapless invoice sequence (`FR-YYYY-NNNNNN`), generated ONLY upon confirmed payment (`PAID` status)

---

## 4. URL Structure & Customer Routing
- `/` — Homepage
- `/shop` — All products catalogue
- `/shop/[category]` — Category-filtered catalogue page
- `/product/[slug]` — Product detail page
- `/cart` — Cart review page
- `/checkout` — Customer checkout page
- `/order/[token]` — Order tracking page
- `/admin` — Admin dashboard
- `/admin/login` — Admin login page
- `/admin/prices` — Daily catch prices manager
- `/admin/products` — Product catalogue management
- `/admin/orders` — Orders management pipeline
- `/admin/orders/new` — Manual order creation form for admin
- `/admin/orders/[id]` — Order detail & dispatch page
- `/admin/audit` — System audit log

---

## 5. Storefront & Catalogue Specifications
- **5.1 Display:** Responsive product grid displaying local name (e.g. *Kelawalla*, *Thora*, *Balaya*), storage type (FRESH / FROZEN / AMBIENT), and base price per kg.
- **5.2 Preparation Options:** Whole, Cleaned, Cut into steaks/fillets with flat or per-kg preparation fees.
- **5.3 Cart Warnings:** If a product's price updates while in cart, display a `PRICE_CHANGED` warning banner requiring user acknowledgment before checkout.
- **5.4 Wholesale Tier Hints:** Display volume discount tier badges (e.g., "Order 10+ kg for LKR 1,500/kg").

---

## 6. Cart & Checkout Specifications
- **6.1 Pricing Calculation:** $ \text{lineTotalCents} = \text{pricePerKgCents} \times \frac{\text{weightGrams}}{1000} \times \text{quantity} $
- **6.2 Customer Details:** Sri Lankan phone number validation (`+94` format), address lines, city, district.
- **6.3 Payment Methods:** PayHere online gateway, Bank Transfer (with slip upload), Cash on Delivery (COD).

---

## 7. Delivery System Specifications
- **7.1 Delivery Zones:** Multi-zone delivery structure (Colombo 1-15, Suburbs, Outstation).
- **7.2 Dynamic Delivery Parameters:** Delivery cut-off time (`cutoffTime`), base fee (`baseFeeCents`), per-kg fee (`perKgFeeCents`), allowed storage types (`allowedStorage`), and operating weekdays (`deliveryWeekdays`) MUST be dynamically retrieved from the `DeliveryZone` database table.

---

## 8. Design Tokens & Aesthetics
- **8.1 Palette Specification:**
  - Deep Ocean / Sea Ink: `#0B1F2A`
  - Ice / Background Light: `#F6FAF9`
  - Sea Glass / Light Accent: `#DCEBE6`
  - Tide / Primary Brand: `#1F6F78`
  - Coral / Accent Highlight: `#FF6A4D`
  - Sand / Neutral Border: `#E9E2D3`

---

## 9. Security & Protection
- **9.1 Row Level Security (RLS):** Enabled on all 24 database tables with 0 public policies (Deny-All Defense).
- **9.2 Production Rate Limiting:** Uses Upstash Redis in production. If Upstash configuration variables are missing in production, fail closed (reject request) and log a Sentry error. In-memory rate limiting is permitted only when `DEMO_MODE=true` or in `development`.
- **9.3 Demo Mode Hardening:** Passcode-gated demo login with `timingSafeCompare`, `DEMO_HMAC_SECRET`, IP rate limiting, and 2-hour max age httpOnly cookies.

---

## 10. Operational & Financial Specifications
- **10.1 Low-Stock Alert Threshold:** Configurable via system `Setting` (key: `LOW_STOCK_THRESHOLD_GRAMS`).
- **10.2 Order Numbering:** `FRS-yyMMdd-NNNN` (e.g. `FRS-261004-0001`).
- **10.3 Invoice Numbering:** `FR-YYYY-NNNNNN` (6-digit zero-padded, e.g. `FR-2026-000001`).
- **10.4 Order Dispatch:** Admin can record courier name, tracking number, and tracking URL when dispatching orders.
- **10.5 Notifications:** Templated SMS and Email dispatchers for order placement, status updates, and invoices.
- **10.6 Price History:** Historical price change audit trail per product.

---

## 11. Database Migrations
- Schema updates must use versioned Prisma migrations in `prisma/migrations/`.
- Deployment command: `pnpm prisma migrate deploy`.

---

## 12. Verification & Testing
- Unit tests run with Vitest (`pnpm test`).
- Typecheck with TypeScript strict (`pnpm run typecheck`).
- ESLint checks (`pnpm run lint`).
- Next.js production build (`pnpm run build`).

---

## 13. Phase Definitions
- **Phase 0:** System Foundation, Design System, & Environment Setup
- **Phase 1:** Core Catalogue, Product Pages, & Cart System
- **Phase 2:** Dynamic Delivery Zones, Cut-off Validation, & Checkout
- **Phase 3:** Payment Gateway, Bank Transfer, & Invoice Engine
- **Phase 4:** Admin Portal, Order Pipeline, Stock Management, Audit, & Dispatch
- **Phase 5:** Production Hardening, Sentry Monitoring, & Final Launch Readiness
