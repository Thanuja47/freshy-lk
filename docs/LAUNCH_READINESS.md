# Launch Readiness Report — Freshy.lk

**Date:** 2026-10-31  
**Branch:** `feature/launch-readiness`  
**Platform:** Next.js 16.4.1 / React 19 / Prisma 7 / Supabase PostgreSQL  
**Mode:** Launch Scope — Bank Transfer Only (Card / PayHere disabled via Admin Settings toggle & env configuration)

---

## Launch Readiness Gate Summary

| Gate | Requirement | Evidence | Status |
| :--- | :--- | :--- | :--- |
| **GATE 0** | **Bank Transfer Launch Scope**<br>Launch with BANK TRANSFER only. Card (PayHere) OFF via admin toggle & env vars. Card option hidden across checkout, order page, emails, FAQ, and footer. COD stays off. | `tests/e2e/gate0-launch-scope.spec.ts`<br>• Test 1: Checkout displays only Bank Transfer and hides Card options.<br>• Test 2: Public storefront pages have zero claims implying active card payments.<br>• Test 3: Complete Bank Transfer order creation (`FRS-261031-0001`), bank details display, slip upload magic bytes validation, admin verification. | **PASS** |
| **GATE 0** | **Slip Upload & Magic Bytes Validation**<br>Slip upload must validate file signatures (JPEG, PNG, WebP, PDF) and reject spoofed MIME types. | `tests/unit/slip-upload.test.ts` (5 unit tests passed)<br>`src/lib/storage.ts` validates binary signatures.<br>`uploadPaymentSlipAction` in `src/actions/orders.ts`. | **PASS** |
| **GATE 1** | **Admin Real-Time Polling (SWR 10s)**<br>Use SWR polling every 10s (pause when tab hidden, revalidate on focus) for orders list, detail, and inquiries. New orders appear within 15s without page refresh, with subtle "NEW" badge highlight and unread badge in sidebar. | `tests/e2e/gate1-admin-realtime.spec.ts`<br>• Test 1: Order `FRS-261031-0002` created in customer context appeared in admin orders table within 15s without reload. Subtle "NEW" badge confirmed.<br>• Sidebar badge polled via `/api/admin/sidebar-badges`. | **PASS** |
| **GATE 1** | **Concurrent Admin Edit Conflict Handling**<br>Concurrent price edits handle conflicts cleanly with last-write-wins and an "updated by someone else" notice. | `tests/e2e/gate1-admin-realtime.spec.ts`<br>• Test 2: Background dirty edit detection on `/admin/prices` triggers conflict notice and saves successfully with inline indicator. | **PASS** |
| **GATE 1** | **Admin Speed Optimization**<br>Independent queries parallelized with `Promise.all`; selected only needed columns; paginate table queries; stream page shell with skeletons; cache read-only aggregates. | `src/app/api/admin/sidebar-badges/route.ts` runs order & inquiry counts in `Promise.all`.<br>`src/app/api/admin/orders-data/route.ts` selects specific fields and limits to recent items.<br>`src/app/api/admin/prices-data/route.ts` optimized with repository caching. | **PASS** |
| **GATE 2** | **Full Functional QA — Admin Control Audit**<br>Complete audit for every admin page and every button, form, modal, and filter. | `docs/ADMIN_QA.md` with complete expected vs actual verification across Dashboard, Prices & Stock, Orders, Order Detail, Products, Categories, Delivery Zones, Invoices, Audit Log, and Settings. | **PASS** |
| **GATE 2** | **Admin Changes Propagation Within 60s**<br>Admin changes (price, stock, availability) reflect on the storefront within 60s without redeploy. | `tests/e2e/price-propagation.spec.ts` & `tests/e2e/admin-propagation.spec.ts`<br>• Admin price change propagates to `/shop` product cards, product page, and cart.<br>• Tag-based cache invalidation via `revalidateCatalogueCache()`. | **PASS** |
| **GATE 2** | **Invoice Generation & Gapless Numbering**<br>Sequential `FR-YYYY-NNNNNN` invoice numbers generated upon "Mark as Paid". Invoice downloadable via PDF and customer tracking page. | `tests/e2e/gate2-invoice-pdf.spec.ts`<br>• Order `FRS-261031-0004` marked as paid.<br>• Generated sequential invoice `FR-2026-000007`.<br>• Verified PDF download via `/api/invoices/FR-2026-000007/pdf?token=...` with `%PDF` magic bytes. | **PASS** |
| **GATE 2** | **Order Status Lifecycle & Stock Management**<br>Transitions: `PENDING_PAYMENT` → `CONFIRMED` → `PACKED` → `DISPATCHED` → `DELIVERED`. Stock releases upon pre-dispatch cancellation. | `tests/e2e/gate3-order-lifecycle.spec.ts`<br>• Order `FRS-261031-0005` progressed through lifecycle.<br>`tests/unit/stock-lifecycle.test.ts` (11 unit tests passed). | **PASS** |
| **GATE 2** | **Cutoff Time & 12:00 PM Asia/Colombo Logic**<br>Shared earliest-delivery-date function for client and server. No silent date changes. Cutoff passed modal prompts customer before placement. | `src/lib/delivery.ts` (`getEarliestDeliveryDate`)<br>`tests/unit/delivery.test.ts` (12 unit tests passed for 11:59 AM same-day vs 12:00 PM / 12:01 PM next-day in Asia/Colombo). | **PASS** |
| **GATE 2** | **Server-Side Idempotency**<br>Idempotency key required in order placement; key recorded only when order is successfully created. | `src/actions/checkout.ts` (line 114: lookup by `idempotencyKey`; line 372: recorded in DB).<br>`tests/unit/checkout.test.ts` (5 unit tests passed). | **PASS** |
| **GATE 3** | **Performance & Asset Delivery**<br>Unoptimized image setting removed. AVIF and WebP configured with responsive qualities. JS bundle minimized. | `next.config.ts` configured with `formats: ["image/avif", "image/webp"]` and `qualities: [75, 80]`.<br>All public routes prerendered statically (`○`) with 1m dynamic revalidation. | **PASS** |
| **GATE 4** | **SEO & Discoverability**<br>Non-production blocks crawlers (`Disallow: /`); production allows public pages. Sitemap generated dynamically with product slugs. Core tags present. | `tests/e2e/gate4-seo.spec.ts`<br>• Test 1: `/robots.txt` verified.<br>• Test 2: `/sitemap.xml` verified with `<urlset>` and product routes.<br>• Test 3: Root layout `lang="en"`, title, viewport, and meta description verified.<br>• Test 4: Product page OpenGraph tags verified. | **PASS** |
| **GATE 5** | **Security Hardening & IDOR Protection**<br>Admin routes redirect to login when unauthenticated; admin APIs return 401 without session; security headers active; order tracking protected. | `tests/e2e/gate5-security.spec.ts`<br>• Test 1: `/admin/*` redirects to `/admin/login`.<br>• Test 2: `/api/admin/*` endpoints return 401 Unauthorized without session cookie.<br>• Test 3: Security headers verified (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Content-Security-Policy`).<br>• Test 4: Order tracking API requires matching phone + order number. | **PASS** |
| **GATE 5** | **Supply Chain & CVE Mitigation**<br>Upgrade Next.js to eliminate critical CVEs (SVG RCE & `use cache` typed arrays). | `next@16.4.1` and `eslint-config-next@16.4.1` installed.<br>`pnpm audit` shows **0 critical vulnerabilities** (down from 2 critical). | **PASS** |

---

## Raw Evidence Log

### 1. Unit Test Suite Execution
- **Command:** `pnpm test`
- **Result:**
  ```text
  Test Files  25 passed (25)
       Tests  144 passed (144)
    Duration  7.91s
  ```

### 2. TypeScript Compilation Check
- **Command:** `pnpm typecheck`
- **Result:**
  ```text
  $ tsc --noEmit
  Exited with code 0 (clean, 0 type errors).
  ```

### 3. Production Build
- **Command:** `pnpm build`
- **Result:**
  ```text
  ✔ Generated Prisma Client (v7.10.0)
  ▲ Next.js 16.4.1 (Turbopack)
  ✓ Compiled successfully in 28.1s
  ✓ Generating static pages using 3 workers (31/31) in 5.8s
  All routes compiled and optimized.
  ```

### 4. End-to-End Playwright Gate Test Results
- **Gate 0:** `npx playwright test tests/e2e/gate0-launch-scope.spec.ts` → **3 passed**
- **Gate 1:** `npx playwright test tests/e2e/gate1-admin-realtime.spec.ts` → **2 passed**
- **Gate 2:** `npx playwright test tests/e2e/gate2-invoice-pdf.spec.ts` → **1 passed**
- **Gate 3:** `npx playwright test tests/e2e/gate3-order-lifecycle.spec.ts` → **1 passed**
- **Gate 4:** `npx playwright test tests/e2e/gate4-seo.spec.ts` → **4 passed**
- **Gate 5:** `npx playwright test tests/e2e/gate5-security.spec.ts` → **4 passed**

---

## Items Explicitly Deferred (Per User Instruction)
- **Database Region Relocation:** Retained current Supabase instance as instructed ("without touching database thing do other things we can change database later").
- **Live Supabase Storage Bucket for Slips in Production:** Local test uploads verified with valid magic byte validation; real Supabase private bucket `slips` and `product-images` setup documented in `docs/SUPABASE_STAGING_SETUP.md`.
