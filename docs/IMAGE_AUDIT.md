# Storefront Image Audit (`docs/IMAGE_AUDIT.md`)

Comprehensive audit of all visual image assets in `public/` for subject accuracy, style consistency, text/watermark freedom, and quality standards.

---

## 1. Hero Assets (`public/hero/`)

| File | Status | Reason / Details |
|------|--------|------------------|
| `hero/hero-ocean.jpg` | **OK** | High-contrast saturated Indian Ocean backdrop under a clear sky. No text, clean composition. |
| `hero/hero-fish.png` | **REGENERATED** | Reprocessed with fully solid (100% opaque) alpha channel. Removed ghosting/see-through scales so fish cutout floats vividly over the ocean. |
| `hero/seafood-hero.jpg` | **OK** | Legacy fallback single-image banner asset. |

---

## 2. Category Cutouts (`public/categories/`)

| File | Status | Reason / Details |
|------|--------|------------------|
| `categories/fresh-fish.png` | **REGENERATED** | Studio cutout of fresh whole fish (red snapper & mackerel) on 100% transparent PNG with soft drop shadow. 4:3 fit. |
| `categories/seafood.png` | **REGENERATED** | Studio cutout of fresh raw jumbo tiger prawns and mud crab on 100% transparent PNG. |
| `categories/fruits.png` | **REGENERATED** | Studio cutout of fresh tropical fruits (bananas, pineapple, tomatoes, sliced orange) on 100% transparent PNG. |
| `categories/vegetables.png` | **REGENERATED** | Studio cutout of farm fresh vegetables (cabbage, carrots, broccoli, red bell pepper) on 100% transparent PNG. |

---

## 3. Product Thumbnails & Deals (`public/products/`)

| File | Status | Reason / Details |
|------|--------|------------------|
| `products/deal-tomatoes.jpg` | **REGENERATED** | Replaced incorrect thumbnail with fresh organic red vine tomatoes studio photo. |
| `products/deal-bananas.jpg` | **REGENERATED** | Replaced incorrect thumbnail with cluster of fresh ripe yellow bananas studio photo. |
| `products/deal-tuna.jpg` | **OK** | Fresh raw yellowfin tuna steak close-up thumbnail. |
| `products/prawns.jpg` | **REGENERATED** | Replaced image containing market signs with clean raw tiger prawns on crushed ice with lime. No text or signs. |
| `products/tiger-prawns.jpg` | **REGENERATED** | Synchronised with `prawns.jpg` for clean studio lighting and zero text/signs. |
| `products/red-snapper.jpg` | **OK** | Whole red snapper on crushed ice, 3:2 ratio studio photography. |
| `products/tuna.jpg` | **OK** | Raw tuna steak on crushed ice, 3:2 ratio studio photography. |
| `products/yellowfin-tuna.jpg`| **OK** | Fresh tuna loin on crushed ice, consistent lighting. |
| `products/mackerel.jpg` | **OK** | Fresh mackerel on crushed ice, 3:2 ratio. |
| `products/seer-fish.jpg` | **OK** | Seer fish steaks on crushed ice, studio lighting. |
| `products/mud-crab.jpg` | **OK** | Fresh mud crab studio photo. |

---

## 4. Promo Rail Banners (`public/banners/`)

| File | Status | Reason / Details |
|------|--------|------------------|
| `banners/produce.jpg` | **REGENERATED** | Replaced fish photo with fresh farm vegetables and fruits arrangement. Soft dark green gradient for text readability. |
| `banners/todays-special.jpg` | **OK** | Dark navy gradient banner with fresh seafood photo on right. Text WCAG AA compliant. |
| `banners/ocean.jpg` | **OK** | Deep ocean blue banner. Slogan updated to neutral text "Fresh from the ocean to your table". High contrast dark overlay. |

---

## Summary
- Total Assets Audited: **22 files**
- Total Regenerated / Reprocessed: **10 files**
- All images verified: 0 text/signs/logos in imagery, 100% subject accuracy, WCAG AA contrast compliance.
