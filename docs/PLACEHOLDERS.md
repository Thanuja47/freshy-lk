# Placeholders Registry (PLACEHOLDERS.md)

Every placeholder value awaiting final confirmation from the client is documented here.

## 1. System & Integration Credentials

| Item | Placeholder Value | Required Action / Confirmation |
|---|---|---|
| Business Registration Number | `PV-123456` | Client to provide official BR number |
| VAT Registration Number | `123456789-9000` | Accountant to clarify VAT mode (`NONE`, `INCLUSIVE`, `EXCLUSIVE`) |
| Bank Account Details | Commercial Bank, A/C: 1000200300, Freshy LK (Pvt) Ltd | Client to supply real bank details for bank transfer payments |
| PayHere Credentials | Merchant ID: `123456`, Secret: Sandbox Placeholder | Client to provide live PayHere credentials |
| NotifyLK SMS Credentials | User ID, API Key, Sender ID: `Freshy` | Client to provide approved Sri Lanka SMS sender ID |
| Privacy & Terms Policy | Standard baseline template | Client's legal counsel to review Sri Lanka PDPA compliance |
| Product Photography | Placeholder images with fish names | Real product photography to be uploaded via admin |

## 2. Marketing Claims Audit & Neutral Replacements

Per Round 2 directives, unverified promotional claims have been removed and replaced with neutral, setting-backed copy:

| Original Unsupplied Claim | Action Taken | Neutral Replacement Used |
|---|---|---|
| "Grade-A sashimi quality" | Removed | Neutral product descriptions |
| "landed at Negombo harbor 5 AM" | Removed | "Prices updated daily" |
| "Hygienic processing under 4°C" | Replaced | "Chilled delivery" |
| "Vacuum packed" | Replaced | "Chilled delivery" |
| "100% Wild Caught" | Replaced | "Fresh Catch" (Catch type shown only if in DB record) |
| "100% Fresh Landings" | Replaced | "Fresh Daily" |
| "Sourced directly from trusted harbor boats" | Replaced | "Island-wide courier" |
| "24/7 Support" | Replaced | "WhatsApp Support" (Quick assistance) |
| "Morning market rates" | Replaced | "Prices updated daily" |
| "Vacuum Prepped" | Replaced | "Fresh Chilled & Frozen Delivery" |
| "Cold-Chain Express" | **Removed** | "Fresh Delivery" — ⚠️ client to confirm cold-chain capability |
| "Cold-Chain Courier" | **Removed** | "Courier Dispatch" — ⚠️ client to confirm |
| "Direct cold-chain delivery setup" | **Removed** | "Fast delivery across Sri Lanka" — ⚠️ client to confirm |
| "Chilled & Frozen Cold-Chain" | **Removed** | "Chilled & Frozen" — ⚠️ client to confirm |
| "Guaranteed Cold-Chain Logistics" | **Removed** | "Reliable Delivery Logistics" — ⚠️ client to confirm |
| "Order packed in cold-chain box" | **Removed** | "Order packed for dispatch" — ⚠️ client to confirm packaging |
| "Chilled Delivery Islandwide" | **Removed** | "Delivery across Sri Lanka" — ⚠️ client to confirm |
| "delivered chilled" | **Removed** | "delivered across Sri Lanka" — ⚠️ client to confirm |
| "Morning harbor rates" | **Removed** | "Updated daily rates" — ⚠️ client to confirm |
| "Morning Harbor Catch" | **Removed** | "Fresh Coastal Catch" — ⚠️ client to confirm |
| "Packed Chilled" | **Removed** | "Packed for Dispatch" — ⚠️ client to confirm |
| "Fresh Chilled" | **Removed** | "Fresh" — ⚠️ client to confirm |
| "Direct from southern and western harbors" | **Replaced** | "Fresh seafood delivered across Sri Lanka" -- client to confirm harbor sourcing |
| "Cleaned, sliced, or whole-prepped to your kitchen specifications" | **Replaced** | "Fixed-weight packs with custom preparation options" -- client to confirm |
| "Premium seafood at verified harbor landing rates" | **Replaced** | "Quality fresh seafood at daily updated prices" -- client to confirm |
| "verified harbor landing rates" | **Replaced** | "daily updated prices" -- client to confirm |
| "Fresh Daily" (trust badge) | **Replaced** | "Daily Updates" -- client to confirm |
| "Landed Daily" (category eyebrow) | **Replaced** | "Fish" (neutral category label) -- client to confirm |
| "Wild Caught" (category eyebrow) | **Replaced** | "Seafood" (neutral category label) -- client to confirm |

---

## 3. Preparation Fees (`scripts/seed.ts` → prep options)

Fees charged on top of the fish price when the customer selects a prep option.

| Option | Fee type | Seeded value (LKR) | Status |
|---|---|---|---|
| Whole (Uncleaned) | Flat | LKR 0.00 | ✅ reasonable default — confirm |
| Cleaned & Gutted | Flat | **LKR 150.00** | ⚠️ client to confirm |
| Steaks / Slices | Per kg | **LKR 200.00 / kg** | ⚠️ client to confirm |
| Boneless Fillet | Per kg | **LKR 350.00 / kg** | ⚠️ client to confirm |

---

## 4. Delivery Zones & Fees (`scripts/seed.ts` → delivery zones)

All base delivery fees, cut-off times, and lead-day counts are invented.

| Zone | Districts | Base fee (LKR) | Cut-off | Lead days | Same-day? |
|---|---|---|---|---|---|
| Colombo Metro Express | Colombo | **LKR 350.00** | 12:00 | 0 | ✅ yes |
| Western Province Region | Gampaha, Kalutara | **LKR 450.00** | 12:00 | 0 | ✅ yes |
| Central & Southern Region | Kandy, Matale, Nuwara Eliya, Galle, Matara, Hambantota | **LKR 550.00** | 10:00 | 1 | ❌ no |
| North Western & North Central | Kurunegala, Puttalam, Anuradhapura, Polonnaruwa | **LKR 600.00** | 10:00 | 1 | ❌ no |
| Northern & Eastern Region | Jaffna, Kilinochchi, Mannar, Vavuniya, Mullaitivu, Batticaloa, Ampara, Trincomalee | **LKR 750.00** | 09:00 | 2 | ❌ no |
| Uva & Sabaragamuwa | Badulla, Moneragala, Ratnapura, Kegalle | **LKR 650.00** | 10:00 | 1 | ❌ no |

> "Lead days" = minimum days from order to earliest possible delivery. `0` = same-day if before cut-off.

---

## 5. Demo Products — Prices & Stock (`scripts/seed-demo.ts`)

> **`seed-demo.ts` refuses to run when `NEXT_PUBLIC_APP_ENV=production`.**
> These values are for development / preview environments only.

Prices stored as cents (LKR × 100). Shown on storefront as `LKR X,XXX / kg`.

| Product | Local name | Price / kg (LKR) | Opening stock | Featured? |
|---|---|---|---|---|
| Yellowfin Tuna | Kelawalla | **LKR 1,800** | 25,000 g | ✅ |
| Seer Fish | Thora | **LKR 2,400** | 15,000 g | ✅ |
| Skipjack Tuna | Balaya | **LKR 1,200** | 30,000 g | ❌ |
| Trevally / Jack | Paraw | **LKR 1,750** | 20,000 g | ✅ |
| Barramundi | Modha | **LKR 2,100** | 12,000 g | ❌ |
| Red Snapper | Ranna | **LKR 1,950** | 18,000 g | ❌ |
| Sailfish | Thalapath | **LKR 1,850** | 22,000 g | ✅ |
| Mahi Mahi / Dolphin Fish | Gal Malu | **LKR 1,600** | 15,000 g | ❌ |
| Jumbo Tiger Prawns | Isso | **LKR 3,200** | 10,000 g | ✅ |
| Lagoon Mud Crab | Kakuluwo | **LKR 2,600** | 8,000 g | ✅ |
| Cuttlefish / Squid | Dallo | **LKR 2,100** | 14,000 g | ❌ |
| Fresh Sprats | Hurulla | **LKR 980** | 20,000 g | ❌ |

All prices and stock quantities are **client to confirm**. Edit `scripts/seed-demo.ts → productList`.

---

## 6. System Settings (`scripts/seed.ts`)

| Key | Seeded value | Description | Status |
|---|---|---|---|
| `LOW_STOCK_THRESHOLD_GRAMS` | **2,000 g** | Admin low-stock alert threshold | ⚠️ client to confirm |

---

## How to Update

1. Locate the value in the seed file referenced in each section.
2. Replace the placeholder with the confirmed value.
3. Re-run `pnpm seed` (reference data) or `pnpm seed:demo` (demo, non-production only).
4. Change the row status from `⚠️ client to confirm` → `✅ confirmed (YYYY-MM-DD)`.
5. Remove the row once confirmed and reflected in a proper Prisma migration.
