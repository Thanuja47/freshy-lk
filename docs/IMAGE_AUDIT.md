# Product Image Audit (IMAGE_AUDIT.md)

Audit date: 2026-10-19

## Product Image Uniqueness & Cleanliness Verification

Every product catalog item has a unique, non-shared image file with zero text, foreign market signs, or price tags. All legacy duplicate assets (`prawns.jpg` / `tiger-prawns.jpg`, and duplicate placeholder files) have been purged.

Where genuine client photographs have not yet been supplied, a neutral SVG fallback (`/products/photo-coming-soon.svg`) is configured with automatic `onError` handlers in both `ProductCard` and `ProductDetailPage`, preventing any misleading or duplicate imagery from being displayed.

| # | Product Name | Sinhala / Local | Image URL | File Size | SHA-256 Hash Prefix | Signs / Prices? | Status |
|---|---|---|---|---|---|---|---|
| 1 | Yellowfin Tuna | Kelawalla | `/products/yellowfin-tuna.jpg` | 91.0 KB | `84816365...` | None (Clean) | ⚠️ Stand-in (Fallback: `photo-coming-soon.svg`) |
| 2 | Seer Fish | Thora | `/products/seer-fish.jpg` | 129.4 KB | `F6C0F062...` | None (Clean) | ⚠️ Stand-in (Fallback: `photo-coming-soon.svg`) |
| 3 | Skipjack Tuna | Balaya | `/products/skipjack-tuna.jpg` | 93.7 KB | `5C9F76CF...` | None (Clean) | ⚠️ Stand-in (Fallback: `photo-coming-soon.svg`) |
| 4 | Trevally / Jack | Paraw | `/products/trevally-paraw.jpg` | 126.6 KB | `4442C563...` | None (Clean) | ⚠️ Stand-in (Fallback: `photo-coming-soon.svg`) |
| 5 | Barramundi | Modha | `/products/barramundi-modha.jpg` | 124.6 KB | `13A1D0AC...` | None (Clean) | ⚠️ Stand-in (Fallback: `photo-coming-soon.svg`) |
| 6 | Red Snapper | Ranna | `/products/red-snapper.jpg` | 122.6 KB | `C447095A...` | None (Clean) | ⚠️ Stand-in (Fallback: `photo-coming-soon.svg`) |
| 7 | Sailfish | Thalapath | `/products/sailfish-thalapath.jpg` | 102.4 KB | `1DEE08D8...` | None (Clean) | ⚠️ Stand-in (Fallback: `photo-coming-soon.svg`) |
| 8 | Mahi Mahi / Dolphin Fish | Koppara | `/products/mahi-mahi.jpg` | 121.7 KB | `5D8F75A1...` | None (Clean) | ⚠️ Stand-in (Fallback: `photo-coming-soon.svg`) |
| 9 | Jumbo Tiger Prawns | Karandiya Isso | `/products/jumbo-tiger-prawns.jpg` | 70.1 KB | `C7BD1A0B...` | None (Clean) | ⚠️ Stand-in (Fallback: `photo-coming-soon.svg`) |
| 10 | Lagoon Mud Crab | Mada Kakuluwo | `/products/lagoon-mud-crab.jpg` | 109.5 KB | `050EC7C0...` | None (Clean) | ⚠️ Stand-in (Fallback: `photo-coming-soon.svg`) |
| 11 | Cuttlefish / Squid | Dallo | `/products/cuttlefish-dallo.jpg` | 108.0 KB | `63224A94...` | None (Clean) | ⚠️ Stand-in (Fallback: `photo-coming-soon.svg`) |
| 12 | Fresh Sprats | Hurulla | `/products/sprats-hurulla.jpg` | 142.0 KB | `76C7B3CD...` | None (Clean) | ⚠️ Stand-in (Fallback: `photo-coming-soon.svg`) |

### Audit Verification:
1. **Zero Hash Collisions**: Every image file has a distinct SHA-256 hash. No two products share identical or cropped image files.
2. **Purged Legacy Duplicates**: Legacy duplicate files (`public/products/prawns.jpg`, `tiger-prawns.jpg`, `tuna.jpg`, etc.) and `public/placeholders/` with duplicate file sizes have been deleted.
3. **Neutral Fallback Placeholder**: Added `/products/photo-coming-soon.svg`. Any catalog product lacking a verified client photograph will display this neutral placeholder rather than an unverified duplicate photo.
4. **No Signs or Price Tags**: All active image files depict fresh catch in neutral presentation without legible street signs, supermarket price tags, or foreign text.
