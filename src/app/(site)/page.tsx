"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/site/ProductCard";
import { useCartStore } from "@/store/cart";
import {
  Truck,
  Fish,
  ArrowRight,
  Flame,
  ShoppingCart,
  Sparkles,
  ChevronRight,
  Check,
  Sun,
  Moon,
  Shield,
  HeadphonesIcon,
} from "lucide-react";
import { formatMoney } from "@/lib/money";

/* ── Static sample data (swapped out for DB calls in production) ── */
const SAMPLE_PRODUCTS = [
  {
    id: "1",
    slug: "yellowfin-tuna",
    name: "Yellowfin Tuna",
    localName: "Kelawalla",
    pricePerKgCents: 165000,
    offerPercent: 15,
    storageType: "FRESH" as const,
    isAvailable: true,
    imageUrl: "/placeholders/yellowfin-tuna.jpg",
    category: "fish",
  },
  {
    id: "2",
    slug: "seer-fish",
    name: "Seer Fish",
    localName: "Thora",
    pricePerKgCents: 280000,
    offerPercent: 10,
    storageType: "FRESH" as const,
    isAvailable: true,
    imageUrl: "/placeholders/seer-fish.jpg",
    category: "fish",
  },
  {
    id: "3",
    slug: "tiger-prawns",
    name: "Tiger Prawns",
    localName: "Isso",
    pricePerKgCents: 220000,
    offerPercent: null,
    storageType: "FRESH" as const,
    isAvailable: true,
    imageUrl: "/placeholders/tiger-prawns.jpg",
    category: "seafood",
  },
  {
    id: "4",
    slug: "mud-crab",
    name: "Mud Crab",
    localName: "Kakuluwo",
    pricePerKgCents: 240000,
    offerPercent: 12,
    storageType: "FRESH" as const,
    isAvailable: true,
    imageUrl: "/placeholders/mud-crab.jpg",
    category: "seafood",
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
    imageUrl: "/placeholders/yellowfin-tuna.jpg",
  },
  {
    id: "2",
    name: "Organic Tomatoes",
    localName: "Thakkali",
    slug: "seer-fish",
    originalPriceCents: 20000,
    discountPriceCents: 18000,
    offerPercent: 10,
    imageUrl: "/placeholders/seer-fish.jpg",
  },
  {
    id: "3",
    name: "Banana",
    localName: "Kesel",
    slug: "mud-crab",
    originalPriceCents: 17000,
    discountPriceCents: 15000,
    offerPercent: 12,
    imageUrl: "/placeholders/mud-crab.jpg",
  },
];

const CATEGORIES = [
  {
    label: "Fresh Fish",
    sub: "Tuna, Seer, Trevally",
    href: "/shop?category=fish",
    image: "/categories/fresh-fish.jpg",
    bg: "#EAF5FE",
    accent: "#1B9AE4",
    badge: "Fresh Catch",
  },
  {
    label: "Seafood",
    sub: "Prawns, Crabs, Cuttlefish",
    href: "/shop?category=seafood",
    image: "/categories/seafood.jpg",
    bg: "#FFF0F5",
    accent: "#FF5722",
    badge: "Shellfish",
  },
  {
    label: "Fruits",
    sub: "Local & Tropical",
    href: "/shop?category=fruits",
    image: "/categories/fruits.jpg",
    bg: "#FFF8EE",
    accent: "#FF5722",
    badge: "Island Harvest",
  },
  {
    label: "Vegetables",
    sub: "Organic Produce",
    href: "/shop?category=vegetables",
    image: "/categories/vegetables.jpg",
    bg: "#F0FAF2",
    accent: "#27A04E",
    badge: "Farm Fresh",
  },
];

const TRUST_ITEMS = [
  { icon: Truck, label: "Fast Delivery", sub: "Islandwide courier", color: "#1B9AE4" },
  { icon: Shield, label: "Secure Payment", sub: "Bank or Card online", color: "#1B9AE4" },
  { icon: Fish, label: "100% Fresh", sub: "Morning market rates", color: "#27A04E" },
  { icon: HeadphonesIcon, label: "24/7 Support", sub: "WhatsApp & call", color: "#25D366" },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"all" | "fish" | "seafood" | "deals">("all");
  const [addedDealId, setAddedDealId] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  const filteredProducts = SAMPLE_PRODUCTS.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "deals") return p.offerPercent !== null;
    return p.category === activeTab;
  });

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
    setAddedDealId(deal.id);
    setTimeout(() => setAddedDealId(null), 1500);
  };

  return (
    <div className="pb-24 md:pb-12">
      {/* ════════════════════════════════════════════
          FULL-WIDTH HERO with ocean photo background
          ════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 360 }}>
        {/* Background ocean image */}
        <Image
          src="/hero/seafood-hero.jpg"
          alt="Fresh seafood on display"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Gradient overlay — lighter on right so image shows, text readable on left */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/10" />

        {/* Hero content */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="max-w-xl animate-fade-up">
            {/* Eyebrow */}
            <div className="inline-flex items-center space-x-2 bg-[#F0F7FF] border border-[#1B9AE4]/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#1B9AE4] mb-4 shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>PREMIUM QUALITY • FRESH &amp; NATURAL</span>
            </div>

            {/* Headline — exactly 2 lines on desktop */}
            <h1 className="font-heading font-extrabold leading-tight mb-3">
              <span className="block text-[#0D2137]" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                Fresh Seafood
              </span>
              <span className="block text-[#27A04E]" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                Direct to Your Table
              </span>
            </h1>

            <p className="text-[#0D2137]/75 text-sm sm:text-base leading-relaxed mb-6">
              From the ocean to your kitchen —{" "}
              <span className="font-semibold">we bring you the freshest catch, every day.</span>
            </p>

            {/* CTA */}
            <Link
              href="/shop"
              className="inline-flex items-center space-x-2 bg-[#0D2137] hover:bg-[#1B9AE4] text-white px-7 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200"
            >
              <span>Shop Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Delivery cut-off rule */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#0D2137]">
              <span className="flex items-center space-x-1.5">
                <Sun className="h-4 w-4 text-[#27A04E]" />
                <span>Before 12 PM → Same-day delivery</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Moon className="h-4 w-4 text-[#1B9AE4]" />
                <span>After 12 PM → Next-day delivery</span>
              </span>
            </div>
          </div>
        </div>

        {/* Wave edge at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path
              d="M0 56L60 49C120 42 240 28 360 24.5C480 21 600 28 720 33.2C840 38.5 960 42 1080 39.7C1200 37.3 1320 28 1380 23.3L1440 19V56H1380C1320 56 1200 56 1080 56C960 56 840 56 720 56C600 56 480 56 360 56C240 56 120 56 60 56H0Z"
              fill="#F0F7FF"
            />
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          TWO-COLUMN LAYOUT: Main left + Right rail
          ════════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 space-y-6 xl:space-y-0 xl:grid xl:grid-cols-[1fr_340px] xl:gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-8 min-w-0">

          {/* Trust Row */}
          <section className="bg-white rounded-2xl border border-[#DDE8F0] shadow-xs p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {TRUST_ITEMS.map(({ icon: Icon, label, sub, color }) => (
                <div key={label} className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#0D2137]">{label}</p>
                    <p className="text-[11px] text-[#0D2137]/55">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Shop by Category */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold text-[#0D2137]">Shop by Category</h2>
                <p className="text-xs text-[#0D2137]/55 mt-0.5">Explore our daily fresh selections</p>
              </div>
              <Link
                href="/shop"
                className="text-xs font-bold text-[#1B9AE4] hover:text-[#1478BB] inline-flex items-center space-x-1"
              >
                <span>View All</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className="group relative rounded-2xl p-4 flex flex-col justify-between h-44 overflow-hidden transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5"
                  style={{ backgroundColor: cat.bg }}
                >
                  {/* Badge */}
                  <div className="z-10">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider bg-white/90 px-2 py-0.5 rounded-full"
                      style={{ color: cat.accent }}
                    >
                      {cat.badge}
                    </span>
                    <h3 className="font-heading font-bold text-lg text-[#0D2137] mt-2 group-hover:transition-colors" style={{ color: undefined }}>
                      {cat.label}
                    </h3>
                    <p className="text-xs text-[#0D2137]/55">{cat.sub}</p>
                  </div>

                  {/* Arrow button */}
                  <div className="z-10 flex justify-end">
                    <div
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center transition-all shadow-xs group-hover:scale-110"
                      style={{ color: cat.accent }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Circular product image bottom-right */}
                  <div className="absolute -bottom-4 -right-4 w-28 h-28 opacity-90 transition-transform group-hover:scale-105">
                    <Image
                      src={cat.image}
                      alt={cat.label}
                      fill
                      className="object-cover rounded-full"
                      sizes="112px"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Featured Products */}
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDE8F0] pb-3">
              <div>
                <h2 className="font-heading text-2xl font-bold text-[#0D2137]">Featured Products</h2>
                <p className="text-xs text-[#0D2137]/55">Morning market landings &amp; fresh harvests</p>
              </div>

              {/* Filter chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                {(["all", "fish", "seafood", "deals"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? tab === "deals"
                          ? "bg-[#FF5722] text-white shadow-xs"
                          : "bg-[#1B9AE4] text-white shadow-xs"
                        : tab === "deals"
                        ? "bg-white text-[#FF5722] hover:bg-orange-50 border border-[#FF5722]/30"
                        : "bg-white text-[#0D2137]/70 hover:bg-gray-100 border border-[#DDE8F0]"
                    }`}
                  >
                    {tab === "all" ? "All Items" : tab === "fish" ? "Fresh Fish" : tab === "seafood" ? "Seafood" : "🔥 Deals"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="text-center pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center space-x-2 border border-[#1B9AE4] text-[#1B9AE4] hover:bg-[#1B9AE4] hover:text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                <span>View All Products</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>

        {/* ── RIGHT STICKY RAIL (340px) ── */}
        <aside className="w-full xl:w-[340px] xl:sticky xl:top-24 xl:self-start space-y-4">

          {/* 1. Today's Special Banner */}
          <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#DDE8F0]" style={{ minHeight: 200 }}>
            <Image
              src="/banners/todays-special.jpg"
              alt="Today's Special"
              fill
              className="object-cover"
              sizes="340px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D2137]/90 via-[#0D2137]/65 to-transparent p-5 flex flex-col justify-between text-white z-10">
              <div className="space-y-1">
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-[#27A04E] bg-white/15 border border-white/20 px-2 py-0.5 rounded-full">
                  TODAY&apos;S SPECIAL
                </span>
                <h3 className="font-heading font-bold text-xl leading-tight mt-1">
                  Fresh Catch,{" "}
                  <span className="text-[#27A04E]">Great Prices</span>
                </h3>
                <p className="text-[12px] text-white/75">
                  Premium seafood at the best rates.
                </p>
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center space-x-1.5 bg-white text-[#0D2137] hover:bg-[#F0F7FF] px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-sm w-fit mt-3"
              >
                <span>Shop Now</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* 2. Compact Trust Icons */}
          <div className="bg-white rounded-2xl border border-[#DDE8F0] shadow-xs p-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              {TRUST_ITEMS.map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex flex-col items-center space-y-1">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                  </div>
                  <p className="text-[10px] font-bold text-[#0D2137] leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Daily Deals */}
          <div className="bg-white rounded-2xl border border-[#DDE8F0] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#DDE8F0] pb-2">
              <div className="flex items-center space-x-1.5">
                <Flame className="h-4 w-4 text-[#FF5722]" />
                <h3 className="font-heading font-bold text-sm text-[#0D2137]">Daily Deals</h3>
              </div>
              <Link href="/shop?deals=true" className="text-[11px] font-bold text-[#1B9AE4] hover:underline flex items-center space-x-0.5">
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DAILY_DEALS.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-[#F7FAFC] border border-[#DDE8F0] rounded-xl p-2 flex flex-col hover:shadow-sm transition-all group"
                >
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-1.5">
                    <Image
                      src={deal.imageUrl}
                      alt={deal.name}
                      fill
                      className="object-cover"
                      sizes="90px"
                    />
                    <span className="absolute top-0 left-0 bg-[#FF5722] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-br-lg">
                      -{deal.offerPercent}%
                    </span>
                  </div>

                  <h4 className="font-bold text-[11px] text-[#0D2137] truncate leading-tight">{deal.name}</h4>
                  <span className="text-[11px] font-extrabold text-[#0D2137]">
                    {formatMoney(deal.discountPriceCents)}
                  </span>
                  <span className="text-[9px] text-[#0D2137]/40 line-through">
                    {formatMoney(deal.originalPriceCents)}
                  </span>
                  <span className="text-[9px] text-[#0D2137]/50">/kg</span>

                  <button
                    onClick={() => handleAddDealToCart(deal)}
                    title="Add to cart"
                    className={`mt-1.5 py-1 rounded-lg flex items-center justify-center transition-all ${
                      addedDealId === deal.id
                        ? "bg-[#27A04E] text-white"
                        : "bg-[#1B9AE4] hover:bg-[#1478BB] text-white"
                    }`}
                  >
                    {addedDealId === deal.id ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <ShoppingCart className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Farm Produce Banner */}
          <div className="relative rounded-2xl overflow-hidden shadow-xs border border-[#27A04E]/20" style={{ minHeight: 140 }}>
            <Image
              src="/banners/produce.jpg"
              alt="Fresh Fruits & Vegetables"
              fill
              className="object-cover"
              sizes="340px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#27A04E]/90 via-[#27A04E]/70 to-transparent p-4 flex flex-col justify-between text-white z-10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                  Fresh Fruits &amp; Vegetables
                </span>
                <h4 className="font-heading font-bold text-base leading-tight mt-1">
                  Healthy Life<br />Starts Here
                </h4>
              </div>
              <Link
                href="/shop?category=vegetables"
                className="inline-flex items-center space-x-1 bg-white text-[#27A04E] hover:bg-[#F0FAF2] px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors w-fit shadow-sm"
              >
                <span>Shop Now</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* 5. Ocean / Wholesale Banner */}
          <div className="relative rounded-2xl overflow-hidden shadow-xs" style={{ minHeight: 110 }}>
            <Image
              src="/banners/ocean.jpg"
              alt="Sustainable seafood supply"
              fill
              className="object-cover"
              sizes="340px"
            />
            <div className="absolute inset-0 bg-[#0D2137]/70 p-4 flex flex-col justify-center text-white z-10">
              <p className="text-[11px] font-semibold text-white/80 leading-relaxed">
                Sustainable Fishing<br />
                <span className="font-bold text-white">for a Better Tomorrow</span>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
