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
  Moon,
  ShieldCheck,
  Headphones,
  Leaf,
} from "lucide-react";
import { formatMoney } from "@/lib/money";

/* ─── Static sample data (replaced by DB calls in production) ─── */
const SAMPLE_PRODUCTS = [
  {
    id: "1",
    slug: "red-snapper",
    name: "Red Snapper",
    localName: "Rathu Hurulla",
    pricePerKgCents: 125000,
    offerPercent: null,
    storageType: "FRESH" as const,
    isAvailable: true,
    imageUrl: "/products/red-snapper.jpg",
    category: "fish",
  },
  {
    id: "2",
    slug: "yellowfin-tuna",
    name: "Tuna",
    localName: "Kelawalla",
    pricePerKgCents: 145000,
    offerPercent: null,
    storageType: "FRESH" as const,
    isAvailable: true,
    imageUrl: "/products/tuna.jpg",
    category: "fish",
  },
  {
    id: "3",
    slug: "tiger-prawns",
    name: "Prawns",
    localName: "Isso",
    pricePerKgCents: 220000,
    offerPercent: null,
    storageType: "FRESH" as const,
    isAvailable: true,
    imageUrl: "/products/prawns.jpg",
    category: "seafood",
  },
  {
    id: "4",
    slug: "mackerel",
    name: "Mackerel",
    localName: "Kumbalawa",
    pricePerKgCents: 98000,
    offerPercent: null,
    storageType: "FRESH" as const,
    isAvailable: true,
    imageUrl: "/products/mackerel.jpg",
    category: "fish",
  },
];

const DAILY_DEALS = [
  {
    id: "1",
    name: "Fresh Tuna",
    localName: "Kelawalla",
    slug: "yellowfin-tuna",
    originalPriceCents: 145000,
    discountPriceCents: 123250,
    offerPercent: 15,
    imageUrl: "/products/deal-tuna.jpg",
  },
  {
    id: "2",
    name: "Organic Tomatoes",
    localName: "Thakkali",
    slug: "tomatoes",
    originalPriceCents: 26900,
    discountPriceCents: 18000,
    offerPercent: 10,
    imageUrl: "/products/deal-tomatoes.jpg",
  },
  {
    id: "3",
    name: "Banana",
    localName: "Kesel",
    slug: "banana",
    originalPriceCents: 17000,
    discountPriceCents: 15000,
    offerPercent: 12,
    imageUrl: "/products/deal-bananas.jpg",
  },
];

const CATEGORIES = [
  {
    label: "Fresh Fish",
    sub: "Tuna, Seer, Trevally",
    href: "/shop?category=fish",
    image: "/categories/fresh-fish.png",
    bg: "#DCEFFC",
    accent: "#1E88E5",
  },
  {
    label: "Seafood",
    sub: "Prawns, Crabs, Cuttlefish",
    href: "/shop?category=seafood",
    image: "/categories/seafood.png",
    bg: "#FDE6E8",
    accent: "#E53935",
  },
  {
    label: "Fruits",
    sub: "Local & Tropical",
    href: "/shop?category=fruits",
    image: "/categories/fruits.png",
    bg: "#FFF1D9",
    accent: "#F57C00",
  },
  {
    label: "Vegetables",
    sub: "Organic Produce",
    href: "/shop?category=vegetables",
    image: "/categories/vegetables.png",
    bg: "#E4F4DD",
    accent: "#2E7D32",
  },
];

const TRUST_ITEMS = [
  { icon: Truck, label: "Fast Delivery", sub: "Islandwide courier", color: "#1E88E5" },
  { icon: ShieldCheck, label: "Secure Payment", sub: "Safe checkout", color: "#1E88E5" },
  { icon: Fish, label: "Fresh Daily", sub: "Prices updated daily", color: "#2E7D32" },
  { icon: Headphones, label: "WhatsApp Support", sub: "Quick assistance", color: "#25D366" },
];

export default function HomePage() {
  const [addedId, setAddedId] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddDealToCart = (deal: (typeof DAILY_DEALS)[0]) => {
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

  const handleAddProductToCart = (product: (typeof SAMPLE_PRODUCTS)[0]) => {
    addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      localName: product.localName,
      imageUrl: product.imageUrl,
      storageType: product.storageType,
      pricePerKgCents: product.pricePerKgCents,
      priceVersion: 1,
      weightGrams: 500,
      packLabel: "500 g",
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
    <div className="bg-[#F4F8FC] pb-24 md:pb-6 min-h-screen">
      {/* ══════════════════════════════════════════
          PAGE WRAPPER: max 1400 px, 24 px gap,
          Two-column grid: main 1fr + rail 360px
          ══════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5 py-4 xl:grid xl:grid-cols-[1fr_360px] xl:gap-6 xl:items-start">

        {/* ══════════════ MAIN COLUMN ══════════════ */}
        <div className="space-y-5">

          {/* ── HERO (inside main column) ── */}
          <section
            className="relative rounded-2xl overflow-hidden shadow-sm"
            style={{ height: "clamp(340px, 32vw, 420px)" }}
          >
            {/* 1. Background Ocean photo */}
            <Image
              src="/hero/hero-ocean.jpg"
              alt="Indian Ocean ocean background"
              fill
              priority
              quality={100}
              sizes="(max-width:1280px) 100vw, calc(100vw - 400px)"
              className="object-cover object-center"
            />

            {/* 2. Transparent Fish Cutout floating on right with gentle levitation animation */}
            <div className="absolute right-0 bottom-0 top-0 w-full sm:w-3/5 pointer-events-none z-10 animate-float">
              <Image
                src="/hero/hero-fish.png"
                alt="Fresh seafood selection"
                fill
                priority
                quality={100}
                sizes="(max-width:768px) 100vw, 60vw"
                className="object-contain object-right-bottom drop-shadow-xl p-2 sm:p-4"
              />
            </div>

            {/* 4. Blue bottom wave band */}
            <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
              <svg viewBox="0 0 800 48" className="w-full block" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0 48L40 42C80 36 160 24 240 20C320 16 400 20 480 24C560 28 640 32 720 30C760 29 780 27 800 26V48H0Z"
                  fill="#1E88E5"
                  opacity="0.18"
                />
                <path
                  d="M0 48L40 44C80 40 160 32 240 28C320 24 400 28 480 32C560 36 640 40 720 38C760 37 780 36 800 35V48H0Z"
                  fill="#F4F8FC"
                />
              </svg>
            </div>

            {/* 5. Hero text content */}
            <div className="relative z-20 h-full flex flex-col justify-center px-4 sm:px-6 py-4 animate-fade-up">
              <div className="bg-white/75 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/80 shadow-xs max-w-[460px]">
                {/* Small-caps label */}
                <p className="text-[#1E88E5] text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] mb-2">
                  Premium Quality · Fresh &amp; Natural
                </p>

                {/* 2-line headline */}
                <h1 className="font-heading font-extrabold leading-[1.08] mb-2.5"
                  style={{ fontSize: "clamp(1.65rem, 2.5vw, 2.7rem)" }}>
                  <span className="block text-[#0D2542]">Island Fresh Seafood,</span>
                  <span className="block text-[#2E7D32]">Delivered to Your Door.</span>
                </h1>

                <p className="text-[#0D2542]/85 text-xs sm:text-sm leading-snug mb-4 font-medium">
                  From Sri Lankan waters to your kitchen —<br />
                  we bring you the freshest catch, every day.
                </p>

                {/* CTA */}
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-[#0D2542] hover:bg-[#1E88E5] text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 w-fit group"
                >
                  Shop Now <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>

                {/* Delivery cut-off row */}
                <div className="mt-3.5 flex items-center flex-wrap gap-2.5 pt-2.5 border-t border-[#0D2542]/10">
                  <span className="flex items-center gap-1 text-[10.5px] font-bold text-[#0D2542]">
                    <Sun className="h-3.5 w-3.5 text-[#2E7D32] shrink-0" />
                    Before 12 PM → Same-day delivery
                  </span>
                  <span className="flex items-center gap-1 text-[10.5px] font-bold text-[#0D2542]">
                    <Moon className="h-3.5 w-3.5 text-[#1E88E5] shrink-0" />
                    After 12 PM → Next-day delivery
                  </span>
                </div>

                {/* Three neutral badges */}
                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10.5px]">
                  {[
                    { icon: Truck, text: "Chilled delivery" },
                    { icon: ShieldCheck, text: "Secure checkout" },
                    { icon: Leaf, text: "Prices updated daily" },
                  ].map(({ icon: Icon, text }) => (
                    <span key={text} className="flex items-center gap-1 bg-white/90 border border-white px-2 py-0.5 rounded-full font-bold text-[#0D2542]/90 shadow-2xs transition-transform duration-200 hover:scale-105">
                      <Icon className="h-3 w-3 text-[#1E88E5]" /> {text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── SHOP BY CATEGORY ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-[#0D2542] text-xl sm:text-2xl">Shop by Category</h2>
              <Link href="/shop" className="flex items-center gap-1 text-[#1E88E5] text-sm font-semibold hover:underline group">
                View All <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className="group relative rounded-2xl overflow-hidden border border-white/80 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg flex"
                  style={{ backgroundColor: cat.bg, aspectRatio: "4/3" }}
                >
                  {/* Left text zone (~50% width) */}
                  <div className="relative z-10 w-1/2 p-3.5 sm:p-4 flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-heading font-bold text-[#0D2542] text-base sm:text-lg leading-tight transition-colors duration-200 group-hover:text-[#1E88E5]">
                        {cat.label}
                      </h3>
                      <p className="text-xs text-[#0D2542]/80 font-medium leading-tight mt-1">
                        {cat.sub}
                      </p>
                    </div>
                    <div>
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-115 group-hover:bg-[#0D2542] shadow-xs"
                        style={{ backgroundColor: cat.accent }}
                      >
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Right image zone (~50% width) — transparent PNG cutout with smooth zoom & tilt */}
                  <div className="relative w-1/2 h-full pointer-events-none overflow-hidden">
                    <Image
                      src={cat.image}
                      alt={cat.label}
                      fill
                      className="object-contain object-bottom-right p-1.5 drop-shadow-md transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-1"
                      sizes="220px"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── FEATURED PRODUCTS ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-[#0D2542] text-xl sm:text-2xl">Featured Products</h2>
              <Link href="/shop" className="flex items-center gap-1 text-[#1E88E5] text-sm font-semibold hover:underline">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SAMPLE_PRODUCTS.map((product) => {
                const productAdded = addedId === `p-${product.id}`;
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl overflow-hidden border border-[#DDE8F0] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    {/* 3:2 product image */}
                    <Link href={`/product/${product.slug}`} className="block relative" style={{ paddingBottom: "66.67%" }}>
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width:640px) 50vw, 300px"
                      />
                      {/* Fresh badge */}
                      <span className="absolute top-2 left-2 bg-[#1E88E5] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                        Fresh
                      </span>
                    </Link>

                    {/* Card info */}
                    <div className="p-2.5 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-[#0D2542] text-sm truncate leading-tight">{product.name}</p>
                        <p className="text-[#1E88E5] font-semibold text-xs mt-0.5">{formatMoney(product.pricePerKgCents)}<span className="text-[#0D2542]/50 font-normal"> /kg</span></p>
                      </div>
                      <button
                        onClick={() => handleAddProductToCart(product)}
                        title="Add to cart"
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
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
            {/* Deep banner-blue overlay on the left */}
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
                  Premium seafood at the best rates.
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

          {/* 2. TRUST ICONS CARD (light-blue tint) */}
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

          {/* 3. DAILY DEALS */}
          <div className="bg-white rounded-xl border border-[#DDE8F0] shadow-xs p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DDE8F0]">
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-[#FF5722]" />
                <h3 className="font-heading font-bold text-[#0D2542] text-sm">Daily Deals</h3>
              </div>
              <Link href="/shop?deals=true" className="flex items-center gap-0.5 text-[11px] font-bold text-[#1E88E5] hover:underline">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DAILY_DEALS.map((deal) => {
                const dealAdded = addedId === deal.id;
                return (
                  <div key={deal.id} className="flex flex-col gap-1">
                    {/* Deal thumbnail */}
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
                    <p className="font-bold text-[#0D2542] text-[11px]">{formatMoney(deal.discountPriceCents)}<span className="font-normal text-[#0D2542]/50"> /kg</span></p>
                    <p className="text-[10px] text-[#0D2542]/45 line-through leading-none">{formatMoney(deal.originalPriceCents)}</p>
                    <button
                      onClick={() => handleAddDealToCart(deal)}
                      title="Add to cart"
                      className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center self-end transition-all ${
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

          {/* 4. PRODUCE BANNER */}
          <div className="relative rounded-xl overflow-hidden" style={{ minHeight: 140 }}>
            <Image
              src="/banners/produce.jpg"
              alt="Fresh Fruits & Vegetables"
              fill
              className="object-cover object-right"
              sizes="360px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1B5E20]/90 via-[#2E7D32]/75 via-50% to-transparent" />
            <div className="relative z-10 p-4 flex flex-col justify-between h-full min-h-[140px] text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Fresh Fruits &amp; Vegetables</p>
                <h4 className="font-heading font-bold text-lg leading-tight mt-1">
                  Healthy Life<br />Starts Here
                </h4>
              </div>
              <Link
                href="/shop?category=vegetables"
                className="inline-flex items-center gap-1 bg-white text-[#2E7D32] hover:bg-[#E8F5E9] font-bold text-xs px-3 py-1.5 rounded-full shadow-xs w-fit transition-colors mt-2"
              >
                Shop Now <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* 5. OCEAN BANNER */}
          <div className="relative rounded-xl overflow-hidden" style={{ minHeight: 110 }}>
            <Image
              src="/banners/ocean.jpg"
              alt="Sustainable ocean fishing"
              fill
              className="object-cover object-right"
              sizes="360px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B3C6F]/95 via-[#0D47A1]/85 via-60% to-transparent" />
            <div className="relative z-10 p-4 flex flex-col justify-center h-full min-h-[110px] text-white">
              <p className="text-xs font-semibold leading-snug">
                <span className="font-extrabold text-sm block">Fresh from the ocean</span>
                <span className="text-white/90">to your table</span>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
