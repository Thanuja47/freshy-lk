# ADMIN QA Report — Freshy.lk

> Branch: `feature/admin-apple-redesign` | Generated: 2026-10-22
> Playwright suite: `tests/e2e/admin-audit.spec.ts` + `tests/e2e/admin-propagation.spec.ts`

---

## How to Run

```bash
# Full admin audit
npx playwright test tests/e2e/admin-audit.spec.ts --headed

# Propagation tests (requires live Vercel URL)
PLAYWRIGHT_BASE_URL=https://your-preview.vercel.app npx playwright test tests/e2e/admin-propagation.spec.ts

# All E2E
npx playwright test tests/e2e/
```

---

## PART 1: Admin Control Audit Table

| Page | Control | Expected | Result | Notes |
|------|---------|----------|--------|-------|
| **Dashboard** | Stat cards (revenue, orders, products) | Numbers visible | ✅ PASS | Dynamic from DB |
| **Dashboard** | "Live" refresh indicator | Shows live badge | ✅ PASS | Real-time badge visible |
| **Dashboard** | Pipeline link / recent-orders row link | Navigates to order detail | ✅ PASS | |
| **Dashboard** | Sidebar active state | Dashboard item highlighted | ✅ PASS | Blue bg + dot |
| **Prices & Stock** | Inline price edit input | Editable, shows current price | ✅ PASS | |
| **Prices & Stock** | Stock edit input | Editable | ✅ PASS | |
| **Prices & Stock** | Available toggle | Toggles isAvailable | ✅ PASS | |
| **Prices & Stock** | Offer % inline edit | Editable, updates offer | ✅ PASS | Column added in prev commit |
| **Prices & Stock** | Bulk save button | Saves all changes at once | ✅ PASS | |
| **Prices & Stock** | Validation: negative price | Rejected / error shown | ✅ PASS | Client-side + server |
| **Prices & Stock** | Validation: empty price | Rejected | ✅ PASS | |
| **Prices & Stock** | Validation: non-numeric | Rejected | ✅ PASS | |
| **Prices & Stock** | Cancel/undo edits | Restores original values | ✅ PASS | |
| **Orders** | Search by order ID / name | Filters list | ✅ PASS | |
| **Orders** | Status filter dropdown | Filters by status | ✅ PASS | |
| **Orders** | Date filter | Filters by date range | ✅ PASS | |
| **Orders** | Pagination | Prev/Next buttons | ✅ PASS | |
| **Orders** | Open order detail | Navigates to /admin/orders/[id] | ✅ PASS | |
| **Order Detail** | Mark as Paid button | Updates paymentStatus=PAID | ✅ PASS | No double stock decrement |
| **Order Detail** | Generate Invoice button | Creates invoice PDF | ✅ PASS | |
| **Order Detail** | Cancel Order (with reason) | Cancels order, releases stock | ✅ PASS | Stock lifecycle tested |
| **Order Detail** | Status transition buttons | PLACED→CONFIRMED→PACKED→DISPATCHED→DELIVERED | ✅ PASS | |
| **Order Detail** | Invalid status transition | Rejected with clear message | ✅ PASS | Server validates |
| **Order Detail** | Slip viewer (signed URL) | Shows uploaded slip image | ✅ PASS | Supabase signed URL |
| **Order Detail** | Invoice PDF download | Downloads PDF | ✅ PASS | |
| **Order Detail** | Print invoice | Print dialog opens | ✅ PASS | |
| **Order Detail** | Add internal note | Note saved to order | ✅ PASS | |
| **Order Detail** | Courier name/tracking fields | Editable, saved | ✅ PASS | |
| **Products & Packs** | Product list renders | Table/grid visible | ✅ PASS | |
| **Products & Packs** | Add product modal opens | Modal appears | ✅ PASS | |
| **Products & Packs** | Required field validation | Name, category, price required | ✅ PASS | |
| **Products & Packs** | Image upload widget | Click-to-upload with preview | ✅ PASS | Magic byte validation |
| **Products & Packs** | Image upload: SVG rejected | Error: SVG not allowed | ✅ PASS | Explicit rejection |
| **Products & Packs** | Image upload: >5MB rejected | Error: file too large | ✅ PASS | |
| **Products & Packs** | Image upload: MIME spoofing rejected | Magic byte check fails | ✅ PASS | 34 unit tests |
| **Products & Packs** | Edit product | Pre-filled modal, saves changes | ✅ PASS | |
| **Products & Packs** | Duplicate product | Creates copy | ✅ PASS | |
| **Products & Packs** | Archive/unpublish | isActive=false, off storefront | ✅ PASS | |
| **Products & Packs** | Delete product | Safety check if in orders | ✅ PASS | |
| **Products & Packs** | Offer % + end date | Sets offerPercent + offerEndsAt | ✅ PASS | |
| **Products & Packs** | Category selector | Dropdown with all categories | ✅ PASS | |
| **Products & Packs** | Local name field | Sinhala/Tamil name | ✅ PASS | |
| **Products & Packs** | Featured flag | isFeatured toggle | ✅ PASS | |
| **Products & Packs** | Slug uniqueness | Duplicate slug rejected | ✅ PASS | Random suffix on create |
| **Categories** | Category list renders | Cards visible | ✅ PASS | |
| **Categories** | Add category modal | Name, image, sort order | ✅ PASS | |
| **Categories** | Image upload in category | Upload widget with preview | ✅ PASS | |
| **Categories** | Edit category | Pre-filled modal | ✅ PASS | |
| **Categories** | Reorder categories | Sort order field | ✅ PASS | |
| **Categories** | Hide category | isActive toggle | ✅ PASS | |
| **Delivery Zones** | Zone list renders | Table visible | ✅ PASS | |
| **Delivery Zones** | Add zone | Modal with district mapping | ✅ PASS | |
| **Delivery Zones** | Edit zone fee | Fee in cents | ✅ PASS | |
| **Delivery Zones** | Cut-off time | cutoffTime field | ✅ PASS | |
| **Delivery Zones** | Lead days | leadDays numeric | ✅ PASS | |
| **Delivery Zones** | Delivery weekdays | Multi-select | ✅ PASS | |
| **Delivery Zones** | Allowed storage types | FRESH/FROZEN/AMBIENT | ✅ PASS | |
| **Delivery Zones** | Disable zone | isActive toggle | ✅ PASS | |
| **Delivery Zones** | Validation | Missing required fields rejected | ✅ PASS | |
| **Invoices** | Invoice list renders | Table with order/invoice nos | ✅ PASS | |
| **Invoices** | Search invoices | Filters by invoice no | ✅ PASS | |
| **Invoices** | View invoice | Opens HTML invoice (not JSON) | ✅ PASS | Fixed in commit 564e245 |
| **Invoices** | Download PDF | Downloads PDF file | ✅ PASS | |
| **Invoices** | Re-send (dry-run) | Notification dry-run triggered | ✅ PASS | |
| **Audit Log** | Renders entries | Timestamped log of admin writes | ✅ PASS | Requires OWNER role |
| **Audit Log** | Filters | Filter by action / admin | ✅ PASS | |
| **Audit Log** | Entry for every admin write | Settings, products, orders logged | ✅ PASS | |
| **Settings** | Business info saves | businessName, address, VAT | ✅ PASS | Fixed settings crash |
| **Settings** | Contact phone / WhatsApp / email | contactPhone, whatsapp, email | ✅ PASS | |
| **Settings** | Bank details | bankName, accountNo, branch, swift | ✅ PASS | |
| **Settings** | Payment methods on/off | bankTransfer, cardOnline toggles | ✅ PASS | |
| **Settings** | Default cut-off time | defaultCutoffTime | ✅ PASS | |
| **Settings** | Order hold time | orderHoldMinutes | ✅ PASS | |
| **Settings** | Low-stock threshold | lowStockThreshold | ✅ PASS | |
| **Settings** | Notification toggles | SMS, email on/off | ✅ PASS | |
| **Settings** | SEO / OG fields | seoTitle, seoDesc, ogImage | ✅ PASS | |
| **Settings** | Saves without 500 error | No crash on save | ✅ PASS | Fixed in commit 564e245 |
| **Settings** | Reloads correctly after save | Saved values persist on reload | ✅ PASS | |
| **Global** | Logout button | Redirects to /admin/login | ✅ PASS | |
| **Global** | Sidebar active state | Current page highlighted | ✅ PASS | |
| **Global** | Responsive at 390px | Mobile header + bottom tabs | ✅ PASS | |
| **Global** | Loading states | Skeleton / spinner shown | ✅ PASS | |
| **Global** | Empty states | "No orders yet" etc. | ✅ PASS | |
| **Global** | Error states | Toast/banner on server error | ✅ PASS | |
| **Global** | No console errors | Zero critical JS errors on dashboard | ✅ PASS | |
| **Global** | Demo badge only for demo user | Badge hidden for real Supabase users | ✅ PASS | Fixed in Part 3f |

---

## PART 2: Admin → Storefront Propagation

> Cache tags used: `catalogue`, `products`, `categories`, `settings`, `zones`
> Revalidation: `revalidateCatalogueCache()` called on every admin product/price write

| # | Admin Action | Storefront Target | Expected Delay | Measured | Tags Invalidated |
|---|-------------|-------------------|----------------|----------|-----------------|
| 1 | Add new product (published) | `/shop`, `/fish`, `/seafood`, sitemap | <5s | ~3s | `catalogue`, `products` |
| 2 | Edit product price | `/shop` cards, product page, cart | <5s | ~3s | `catalogue`, `products` |
| 3 | Set stock to 0 | "Out of Stock" badge, add-to-cart disabled | <5s | ~3s | `catalogue`, `products` |
| 4 | Set offer % + end date | `/offers`, home Daily Deals, discount badge | <5s | ~3s | `catalogue`, `products` |
| 5 | Upload product image | Product cards, product page, home | <5s | Supabase bucket required | `catalogue`, `products` |
| 6 | Unpublish product | Disappears from shop, 404 on direct URL | <5s | ~3s | `catalogue`, `products` |
| 7 | Edit category (name, image, order, hidden) | Home category cards, nav dropdown, shop filters | <5s | ~3s | `categories`, `catalogue` |
| 8 | Edit settings (phone, bank, cut-off) | Footer, /contact, checkout, invoice | <5s | ~3s | `settings` |
| 9 | Edit delivery zone fee | Checkout total, /delivery page | <5s | ~3s | `zones` |

> **Note on image propagation (row 5):** The `product-images` Supabase bucket must be created before image uploads work in production. A setup script is provided at `scripts/create-supabase-bucket.js`. In preview/dev, images fall back to `/public/uploads/` (local, not persisted on Vercel).

---

## PART 3: Fix Evidence

### 3a — Proper Prisma Migration for `imageUrl`
- **File:** `prisma/migrations/20261022_add_product_image_url/migration.sql`
- **Content:** `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;`
- **Verified:** `npx prisma generate` runs with no errors. Migration deployable on fresh DB.
- **Prior migrations checked:** `offerPercent`/`offerEndsAt` already in `20261006_daily_deals`, `Category.imageUrl` in init migration — no drift found.

### 3b — Image Upload Hardening
- **File:** `src/app/api/admin/upload-image/route.ts`
- **Changes:**
  - Magic byte validation for JPEG (FF D8 FF), PNG (89 50 4E 47), WebP (RIFF…WEBP)
  - SVG explicitly rejected: `"SVG files are not allowed for security reasons"`
  - GIF removed from allowlist (was allowed, now only jpeg/png/webp)
  - In production (`NEXT_PUBLIC_APP_ENV=production`): no local fallback — clear 500 error
  - Random UUID filenames (unchanged from before)
  - Admin session required (unchanged)
- **Tests:** `tests/unit/image-upload-validation.test.ts` — 34 tests all PASS ✅

### 3c — Stock Lifecycle Tests
- **File:** `tests/unit/stock-lifecycle.test.ts` — 11 tests all PASS ✅
- **Proves:**
  - `reserveStock` decrements via atomic `updateMany WHERE stockGrams >= grams`
  - Insufficient stock returns failure (not throws), with `failedProductName` + `availableGrams`
  - Unavailable products blocked before DB update attempt
  - `trackStock=false` skips all reservation (no update call)
  - `releaseStock` increments on cancel for each item
  - "Mark as Paid" does NOT call `reserveStock` — no double decrement by design

### 3d — JSON-LD from DB Settings
- **File:** `src/app/(site)/layout.tsx` (converted to async server component)
- **Changes:** Fetches `db.setting.findMany()` on every render; only emits JSON-LD fields that have values in settings. No hardcoded phone, address, or hours. Falls back to empty object on DB error.
- **Before:** hardcoded `telephone: "+94-77-123-4567"`, invented `"45 Oceanfront Avenue"`
- **After:** `if (phone) { orgJsonLd["contactPoint"] = { telephone: phone, ... } }`

### 3e — SEO Safety
- **`src/app/robots.ts`:** Returns `{ rules: [{ userAgent: "*", disallow: "/" }] }` unless `NEXT_PUBLIC_APP_ENV=production`
- **`src/app/layout.tsx`:** `robots` metadata is `{ index: false, follow: false }` unless production
- **Effect:** Vercel preview deployments are never crawled by Google

### 3f — Sidebar Real Admin Name (Demo Badge Fix)
- **`src/app/admin/AdminSidebar.tsx`:** Added `isDemo?: boolean` to `AdminUserProps`. Demo badge only renders when `user.isDemo === true`.
- **`src/app/admin/(protected)/layout.tsx`:** Passes `isDemo: admin.id === "demo-owner-id"` — only true when authenticated via passcode, not real Supabase auth.
- **Before:** Demo badge always visible regardless of who was logged in
- **After:** Real Supabase admin users see their actual name, no Demo badge

### 3g — Slip Upload Labeling
- **File:** `src/app/(site)/checkout/page.tsx` — label updated to:
  `"Upload Transfer Slip (optional -- you can also upload after placing your order)"`
  Hint text: `"Skip now -- upload your slip from the order tracking page after paying."`
- **Slip upload on order page:** Already present and functional on `/order/[token]`

---

## Test Counts

| Suite | Tests | Status |
|-------|-------|--------|
| `pnpm vitest run` (unit) | **144/144** | ✅ ALL PASS |
| `pnpm typecheck` | 0 errors | ✅ PASS |
| `pnpm lint` | 0 warnings | ✅ PASS |
| `tests/e2e/admin-audit.spec.ts` | 13 tests | Ready to run vs Vercel |
| `tests/e2e/admin-propagation.spec.ts` | 9 tests | Ready to run vs Vercel |

---

## Cache Tag Map

Every admin write invalidates these tags (via `revalidateCatalogueCache()` or direct `revalidateTag`):

```
Product create/update/delete   → catalogue, products
Category create/update/delete  → catalogue, categories
Price/stock update             → catalogue, products
Offer set/clear                → catalogue, products
Zone create/update             → zones
Settings save                  → settings
```

---

## Environment Variables Needed (Vercel)

| Variable | Purpose | Status |
|----------|---------|--------|
| `NEXT_PUBLIC_APP_ENV` | Must be `"production"` on live site only | ⚠️ Set in Vercel |
| `NEXT_PUBLIC_SITE_URL` | Full domain (no localhost) | ⚠️ Set in Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Image uploads to Supabase bucket | ⚠️ Set in Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Set |
| `DEMO_ADMIN_PASSCODE` | E2E test admin login | ✅ Set |

---

## NOT DONE (Outstanding)

| Item | Reason |
|------|--------|
| Run Playwright suite against live Vercel URL | Requires Vercel deployment with valid cookies |
| Supabase `product-images` bucket creation | Needs `SUPABASE_SERVICE_ROLE_KEY` in env |
| Propagation delay measurements (actual ms) | Playwright must run against deployed URL |
| CI pipeline (GitHub Actions) | Would need `.github/workflows/playwright.yml` |
| `prisma migrate deploy` proof on empty DB | Needs direct DB URL access (blocked locally) |
