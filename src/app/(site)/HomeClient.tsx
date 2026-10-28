"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import {
  Truck,
  Fish,
  ArrowRight,
  Flame,
  ShoppingCart,
  ChevronRight,
  Check,
  Sun,
  ShieldCheck,
  Headphones,
  Sparkles,
} from "lucide-react";
import { formatMoney, roundPriceCents } from "@/lib/money";

export interface HomeCategoryItem {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
}

export interface HomeProductItem {
  id: string;
  slug: string;
  name: string;
  localName?: string;
  pricePerKgCents: number;
  offerPercent?: number | null;
  storageType: "FRESH" | "FROZEN" | "AMBIENT";
  imageUrl: string;
}

export interface HomeDealItem {
  id: string;
  slug: string;
  name: string;
  localName?: string;
  originalPriceCents: number;
  discountPriceCents: number;
  offerPercent: number;
  imageUrl: string;
}

const DEFAULT_CATEGORIES: HomeCategoryItem[] = [
  {
    id: "cat-fresh-fish",
    slug: "fresh-fish",
    name: "Fresh Fish",
    imageUrl: "/categories/fresh-fish.jpg",
    sortOrder: 1,
  },
  {
    id: "cat-shellfish-seafood",
    slug: "shellfish-seafood",
    name: "Seafood & Shellfish",
    imageUrl: "/categories/seafood.jpg",
    sortOrder: 2,
  },
  {
    id: "cat-fruits",
    slug: "fruits",
    name: "Fruits",
    imageUrl: "/categories/fruits.jpg",
    sortOrder: 3,
  },
  {
    id: "cat-vegetables",
    slug: "vegetables",
    name: "Vegetables",
    imageUrl: "/categories/vegetables.jpg",
    sortOrder: 4,
  },
];

interface CategoryDisplayInfo {
  id: string;
  slug: string;
  label: string;
  sinhala: string;
  eyebrow: string;
  href: string;
  imageUrl: string | null;
  comingSoon: boolean;
}

function resolveCategoryDisplay(cat: HomeCategoryItem): CategoryDisplayInfo {
  const slug = (cat.slug || "").toLowerCase();
  const name = (cat.name || "").toLowerCase();

  const isFish = slug.includes("fish") || name.includes("fish");
  const isSeafood = slug.includes("seafood") || slug.includes("shellfish") || name.includes("seafood");
  const isFruits = slug.includes("fruit") || name.includes("fruit");
  const isVegetables = slug.includes("veg") || name.includes("veg");

  if (isFish) {
    return {
      id: cat.id,
      slug: cat.slug,
      label: cat.name || "Fresh Fish",
      sinhala: "මිරිදිය මාළු",
      eyebrow: "Fish",
      href: "/fish",
      imageUrl: cat.imageUrl || "/categories/fresh-fish.jpg",
      comingSoon: false,
    };
  }

  if (isSeafood) {
    return {
      id: cat.id,
      slug: cat.slug,
      label: cat.name || "Seafood & Shellfish",
      sinhala: "මුහුදු ආහාර",
      eyebrow: "Seafood",
      href: "/seafood",
      imageUrl: cat.imageUrl || "/categories/seafood.jpg",
      comingSoon: false,
    };
  }

  if (isFruits) {
    return {
      id: cat.id,
      slug: cat.slug,
      label: cat.name || "Fruits",
      sinhala: "පලතුරු",
      eyebrow: "Coming Soon",
      href: "/shop?category=fruits",
      imageUrl: cat.imageUrl || "/categories/fruits.jpg",
      comingSoon: true,
    };
  }

  if (isVegetables) {
    return {
      id: cat.id,
      slug: cat.slug,
      label: cat.name || "Vegetables",
      sinhala: "එළවළු",
      eyebrow: "Coming Soon",
      href: "/shop?category=vegetables",
      imageUrl: cat.imageUrl || "/categories/vegetables.jpg",
      comingSoon: true,
    };
  }

  return {
    id: cat.id,
    slug: cat.slug,
    label: cat.name,
    sinhala: "",
    eyebrow: "Category",
    href: `/shop?category=${cat.slug}`,
    imageUrl: cat.imageUrl,
    comingSoon: false,
  };
}

const TRUST_ITEMS = [
  { icon: Truck, label: "Fast Delivery", sub: "Islandwide courier", color: "#1E88E5" },
  { icon: ShieldCheck, label: "Secure Payment", sub: "Safe checkout", color: "#1E88E5" },
  { icon: Fish, label: "Daily Updates", sub: "Prices updated daily", color: "#2E7D32" },
  { icon: Headphones, label: "WhatsApp Support", sub: "Quick assistance", color: "#25D366" },
];

export default function HomeClient({
  categories: initialCategories,
  featuredProducts,
  dailyDeals,
}: {
  categories?: HomeCategoryItem[];
  featuredProducts: HomeProductItem[];
  dailyDeals: HomeDealItem[];
}) {
  const activeCategories = initialCategories && initialCategories.length > 0
    ? initialCategories
    : DEFAULT_CATEGORIES;

  const displayCategories = activeCategories.map(resolveCategoryDisplay);
  const [addedId, setAddedId] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddDealToCart = (deal: HomeDealItem) => {
    addItem({
      productId: deal.id,
      productSlug: deal.slug,
      productName: deal.name,
      localName: deal.localName,
      imageUrl: deal.imageUrl,
      storageType: "FRESH",
      pricePerKgCents: deal.discountPriceCents,
      priceVersion: 1,
      weightGrams: 1000,
      packLabel: "1 kg",
      quantity: 1,
      prepOptionId: null,
      prepName: "Whole / Uncleaned",
      prepFeeCents: 0,
      prepFeeType: "FLAT",
    });
    setAddedId(deal.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleAddProductToCart = (product: HomeProductItem) => {
    const finalPrice = product.offerPercent && product.offerPercent > 0
      ? roundPriceCents(product.pricePerKgCents * (1 - product.offerPercent / 100))
      : product.pricePerKgCents;

    addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      localName: product.localName,
      imageUrl: product.imageUrl,
      storageType: product.storageType,
      pricePerKgCents: finalPrice,
      priceVersion: 1,
      weightGrams: 1000,
      packLabel: "1 kg",
      quantity: 1,
      prepOptionId: null,
      prepName: "Whole / Uncleaned",
      prepFeeCents: 0,
      prepFeeType: "FLAT",
    });
    setAddedId(`p-${product.id}`);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">
      {/* ── CUT-OFF TIME BANNER ── */}
      <div className="bg-[#EBF5FF] border border-[#1E88E5]/20 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-[#FF9800] shrink-0" />
          <span className="font-bold text-[#0D2542]">12:00 PM Order Cut-off:</span>
          <span className="text-[#0D2542]/75">Order before 12 PM for today&apos;s evening delivery in selected areas.</span>
        </div>
        <Link href="/delivery" className="font-bold text-[#1E88E5] hover:underline whitespace-nowrap text-xs">
          View Delivery Schedule &rarr;
        </Link>
      </div>

      <div className="xl:grid xl:grid-cols-[1fr_360px] xl:gap-6 items-start">
        {/* ══════════════ MAIN CONTENT ══════════════ */}
        <div className="space-y-6">
          {/* ── HERO BANNER ── */}
          <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#072448] via-[#0D3B66] to-[#1E88E5] text-white p-6 sm:p-10 shadow-lg min-h-[320px] sm:min-h-[380px] flex flex-col justify-between">
            <div className="max-w-xl space-y-4">
              <div className="inline-flex items-center space-x-1.5 bg-white/15 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-[#FFD54F]" />
                <span>Fresh Seafood Delivery</span>
              </div>
              <h1 className="font-heading font-black text-3xl sm:text-5xl tracking-tight leading-tight">
                Sri Lanka&apos;s Finest Catch, Delivered Fresh.
              </h1>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                Fresh seafood delivered across Sri Lanka. Fixed-weight packs with custom preparation options.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="bg-white text-[#072448] hover:bg-[#E8F4FE] font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                >
                  <span>Explore Daily Catch</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/offers"
                  className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all inline-flex items-center gap-2"
                >
                  <Flame className="h-4 w-4 text-[#FF5722]" />
                  <span>Today&apos;s Deals</span>
                </Link>
              </div>
            </div>
          </section>

          {/* ── CATEGORIES (FULL-BLEED FULL-COLOUR PHOTO CARDS) ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-[#0D2542] text-xl sm:text-2xl">Browse by Category</h2>
              <Link href="/shop" className="flex items-center gap-1 text-[#1E88E5] text-sm font-semibold hover:underline">
                All Products <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
              {displayCategories.map((cat, idx) => {
                const cardContent = (
                  <>
                    {/* Background Photo */}
                    {cat.imageUrl ? (
                      <Image
                        src={cat.imageUrl}
                        alt={cat.label}
                        fill
                        className={`object-cover ${
                          cat.comingSoon
                            ? ""
                            : "transition-transform duration-400 ease-out group-hover:scale-105 motion-reduce:transform-none"
                        }`}
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        quality={80}
                        priority={idx < 4}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0B2545] via-[#133E68] to-[#1E5B94]" />
                    )}

                    {/* Dark gradient overlay for text legibility only (~rgba(8,24,48,0.65) at bottom) */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#081830]/80 via-[#081830]/25 via-50% to-[#081830]/65 pointer-events-none" />

                    {/* Coming Soon Pill at top-right */}
                    {cat.comingSoon && (
                      <span className="absolute top-3.5 right-3.5 z-20 bg-white/25 backdrop-blur-md border border-white/25 text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        SOON
                      </span>
                    )}

                    {/* Card Text Content */}
                    <div className="relative z-10 w-full h-full p-3 sm:p-5 flex flex-col justify-between">
                      <div>
                        {cat.eyebrow && (
                          <span className="inline-block text-[10px] sm:text-xs font-semibold text-white/95 px-2 sm:px-2.5 py-0.5 rounded-full bg-black/35 backdrop-blur-xs tracking-wide">
                            {cat.eyebrow}
                          </span>
                        )}
                        <h3 className="font-heading font-bold text-white text-base sm:text-[22px] lg:text-2xl leading-tight mt-1 sm:mt-1.5">
                          {cat.label}
                        </h3>
                        {cat.sinhala && (
                          <p className="text-white/80 font-medium text-[11px] sm:text-sm mt-0.5">
                            {cat.sinhala}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                );

                if (cat.comingSoon) {
                  return (
                    <div
                      key={cat.id || cat.slug}
                      role="link"
                      aria-disabled="true"
                      className="group relative aspect-[4/3] sm:min-h-[180px] lg:min-h-[190px] rounded-[20px] overflow-hidden shadow-xs cursor-default flex flex-col select-none"
                    >
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={cat.id || cat.slug}
                    href={cat.href}
                    className="group relative aspect-[4/3] sm:min-h-[180px] lg:min-h-[190px] rounded-[20px] overflow-hidden shadow-xs hover:shadow-md transition-all duration-400 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E88E5] focus-visible:ring-offset-2 flex flex-col"
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ── FEATURED PRODUCTS (DATABASE-DRIVEN) ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-[#0D2542] text-xl sm:text-2xl">Featured Products</h2>
              <Link href="/shop" className="flex items-center gap-1 text-[#1E88E5] text-sm font-semibold hover:underline">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {featuredProducts.map((product) => {
                const productAdded = addedId === `p-${product.id}`;
                const hasOffer = product.offerPercent && product.offerPercent > 0;
                const effectivePrice = hasOffer
                  ? roundPriceCents(product.pricePerKgCents * (1 - (product.offerPercent ?? 0) / 100))
                  : product.pricePerKgCents;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl overflow-hidden border border-[#DDE8F0] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between"
                  >
                    <div>
                      {/* 3:2 product image */}
                      <Link href={`/product/${product.slug}`} className="block relative" style={{ paddingBottom: "66.67%" }}>
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width:640px) 50vw, 300px"
                        />
                        {hasOffer && (
                          <span className="absolute top-2 left-2 bg-[#FF5722] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs">
                            -{product.offerPercent}%
                          </span>
                        )}
                        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs text-[#1E88E5] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                          {product.storageType === "FRESH" ? "Fresh" : "Frozen"}
                        </span>
                      </Link>

                      {/* Card info */}
                      <div className="p-3">
                        <Link href={`/product/${product.slug}`}>
                          <p className="font-bold text-[#0D2542] text-sm truncate leading-tight hover:text-[#1E88E5] transition-colors">
                            {product.name}
                          </p>
                          {product.localName && (
                            <p className="text-[11px] text-[#0D2542]/60 truncate mt-0.5 font-medium">
                              {product.localName}
                            </p>
                          )}
                        </Link>
                      </div>
                    </div>

                    <div className="p-3 pt-0 flex items-end justify-between gap-2 border-t border-gray-50 mt-1">
                      <div className="min-w-0">
                        <p className="text-[#1E88E5] font-extrabold text-sm leading-tight">
                          {formatMoney(effectivePrice)}
                          <span className="text-[#0D2542]/50 font-normal text-xs"> /kg</span>
                        </p>
                        {hasOffer && (
                          <p className="text-[10px] text-[#0D2542]/45 line-through">
                            {formatMoney(product.pricePerKgCents)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddProductToCart(product)}
                        title="Add to cart"
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          productAdded ? "bg-[#2E7D32]" : "bg-[#1E88E5] hover:bg-[#1565C0]"
                        } text-white shadow-sm`}
                      >
                        {productAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ══════════════ STICKY RIGHT RAIL ══════════════ */}
        <aside className="mt-5 xl:mt-0 xl:sticky xl:top-20 xl:self-start space-y-4">
          {/* 1. TODAY'S SPECIAL BANNER */}
          <div className="relative rounded-2xl overflow-hidden shadow-sm" style={{ minHeight: 200 }}>
            <Image
              src="/banners/todays-special.jpg"
              alt="Today's Special seafood"
              fill
              className="object-cover object-right"
              sizes="360px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B3C6F] via-[#0B3C6F]/85 via-50% to-transparent" />

            <div className="relative z-10 p-5 flex flex-col justify-between h-full min-h-[200px]">
              <div>
                <span className="inline-block bg-[#1E88E5] text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2.5">
                  Today&apos;s Special
                </span>
                <h3 className="font-heading font-extrabold text-white text-2xl leading-tight">
                  Fresh Catch,<br />
                  <span className="text-[#4CAF50]">Great Prices</span>
                </h3>
                <p className="text-white/75 text-xs mt-1.5">
                  Quality fresh seafood at daily updated prices.
                </p>
              </div>
              <Link
                href="/shop"
                className="mt-4 inline-flex items-center gap-1.5 bg-white text-[#0B3C6F] hover:bg-[#E3F2FD] font-bold text-xs px-4 py-2 rounded-full shadow-sm w-fit transition-colors"
              >
                Shop Now <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* 2. TRUST ICONS CARD */}
          <div className="bg-[#EBF5FF] rounded-xl border border-[#1E88E5]/15 p-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              {TRUST_ITEMS.map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs" style={{ color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[9.5px] font-bold text-[#0D2542] leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. DAILY DEALS (DATABASE-DRIVEN) */}
          {dailyDeals.length > 0 && (
            <div className="bg-white rounded-xl border border-[#DDE8F0] shadow-xs p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DDE8F0]">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-[#FF5722]" />
                  <h3 className="font-heading font-bold text-[#0D2542] text-sm">Daily Deals</h3>
                </div>
                <Link href="/offers" className="flex items-center gap-0.5 text-[11px] font-bold text-[#1E88E5] hover:underline">
                  View All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {dailyDeals.map((deal) => {
                  const dealAdded = addedId === deal.id;
                  return (
                    <div key={deal.id} className="flex flex-col gap-1">
                      <div className="relative rounded-lg overflow-hidden aspect-square">
                        <Image
                          src={deal.imageUrl}
                          alt={deal.name}
                          fill
                          className="object-cover"
                          sizes="110px"
                        />
                        <span className="absolute top-0 left-0 bg-[#2E7D32] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-br-md">
                          -{deal.offerPercent}%
                        </span>
                      </div>
                      <p className="font-semibold text-[#0D2542] text-[11px] truncate leading-tight">{deal.name}</p>
                      <p className="font-bold text-[#0D2542] text-[11px]">
                        {formatMoney(deal.discountPriceCents)}
                        <span className="font-normal text-[#0D2542]/50"> /kg</span>
                      </p>
                      <p className="text-[10px] text-[#0D2542]/45 line-through leading-none">
                        {formatMoney(deal.originalPriceCents)}
                      </p>
                      <button
                        onClick={() => handleAddDealToCart(deal)}
                        title="Add to cart"
                        className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center self-end transition-all cursor-pointer ${
                          dealAdded ? "bg-[#2E7D32]" : "bg-[#1E88E5] hover:bg-[#1565C0]"
                        } text-white shadow-xs`}
                      >
                        {dealAdded ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3 w-3" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
