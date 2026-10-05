"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/site/ProductCard";
import { useCartStore } from "@/store/cart";
import {
  Truck,
  ShieldCheck,
  Leaf,
  MessageCircle,
  ArrowRight,
  Flame,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  Check,
} from "lucide-react";
import { formatMoney } from "@/lib/money";

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
    name: "Yellowfin Tuna",
    localName: "Kelawalla",
    slug: "yellowfin-tuna",
    originalPriceCents: 165000,
    discountPriceCents: 140250,
    offerPercent: 15,
    imageUrl: "/placeholders/yellowfin-tuna.jpg",
  },
  {
    id: "2",
    name: "Seer Fish",
    localName: "Thora",
    slug: "seer-fish",
    originalPriceCents: 280000,
    discountPriceCents: 252000,
    offerPercent: 10,
    imageUrl: "/placeholders/seer-fish.jpg",
  },
  {
    id: "4",
    name: "Mud Crab",
    localName: "Kakuluwo",
    slug: "mud-crab",
    originalPriceCents: 240000,
    discountPriceCents: 211200,
    offerPercent: 12,
    imageUrl: "/placeholders/mud-crab.jpg",
  },
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

  const handleAddDealToCart = (deal: typeof DAILY_DEALS[0]) => {
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
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-24 md:pb-12">
      <div className="xl:grid xl:grid-cols-[1fr_340px] xl:gap-6 space-y-6 xl:space-y-0">
        {/* ─── LEFT COLUMN: Main Content ─── */}
        <div className="space-y-8">
          {/* 1. Hero Section */}
          <section className="bg-gradient-to-br from-[#E8F4FE] via-[#EEF8FF] to-white rounded-3xl p-6 sm:p-10 border border-[#DDE8F0] shadow-xs relative overflow-hidden">
            {/* Background decorative waves */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#1B9AE4]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#27A04E]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Text Left */}
              <div className="lg:col-span-7 space-y-5 animate-fade-up">
                <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-xs border border-[#1B9AE4]/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#1B9AE4] shadow-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>PREMIUM QUALITY · FRESH & NATURAL</span>
                </div>

                <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight">
                  <span className="block text-[#0D2137]">Fresh Seafood</span>
                  <span className="block text-[#27A04E] mt-1">Direct to Your Table</span>
                </h1>

                <p className="text-[#0D2137]/75 text-base sm:text-lg leading-relaxed max-w-xl">
                  Wild-caught fresh seafood landed daily along Sri Lankan coasts. Custom prepped, vacuum packed &amp; delivered chilled directly to your kitchen.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href="/shop"
                    className="bg-[#0D2137] hover:bg-[#1B9AE4] text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center space-x-2"
                  >
                    <span>Shop Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/shop"
                    className="bg-white hover:bg-gray-50 text-[#0D2137] border border-[#DDE8F0] px-6 py-3.5 rounded-xl font-bold text-sm transition-colors shadow-xs"
                  >
                    Explore Categories
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#DDE8F0]/60">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-[#1B9AE4]/10 flex items-center justify-center text-[#1B9AE4]">
                      <Truck className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#0D2137]">Express Delivery</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-[#27A04E]/10 flex items-center justify-center text-[#27A04E]">
                      <Leaf className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#0D2137]">100% Wild Caught</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FF5722]/10 flex items-center justify-center text-[#FF5722]">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#0D2137]">Cold-Chain Packed</span>
                  </div>
                </div>
              </div>

              {/* Image Right */}
              <div className="lg:col-span-5 relative">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white shadow-xl">
                  <Image
                    src="/hero/seafood-hero.jpg"
                    alt="Fresh seafood counter display"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D2137]/30 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Shop by Category */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold text-[#0D2137]">Shop by Category</h2>
                <p className="text-xs text-[#0D2137]/60 mt-0.5">Explore our daily fresh selections</p>
              </div>
              <Link
                href="/shop"
                className="text-xs font-bold text-[#1B9AE4] hover:text-[#1478BB] inline-flex items-center space-x-1"
              >
                <span>View All</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Fresh Fish Card */}
              <Link
                href="/shop?category=fish"
                className="group relative bg-[#EAF5FE] hover:bg-[#DDF0FE] border border-[#1B9AE4]/20 rounded-2xl p-4 flex flex-col justify-between h-44 overflow-hidden transition-all shadow-xs hover:shadow-md"
              >
                <div className="z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B9AE4] bg-white/90 px-2 py-0.5 rounded-full">
                    Fresh Catch
                  </span>
                  <h3 className="font-heading font-bold text-lg text-[#0D2137] mt-2 group-hover:text-[#1B9AE4] transition-colors">
                    Fresh Fish
                  </h3>
                  <p className="text-xs text-[#0D2137]/60">Tuna, Seer, Trevally</p>
                </div>
                <div className="z-10 flex justify-end">
                  <div className="w-8 h-8 rounded-full bg-white text-[#0D2137] group-hover:bg-[#1B9AE4] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-28 h-28 opacity-90 transition-transform group-hover:scale-105">
                  <Image
                    src="/categories/fresh-fish.jpg"
                    alt="Fresh Fish"
                    fill
                    className="object-cover rounded-full"
                    sizes="112px"
                  />
                </div>
              </Link>

              {/* Seafood Card */}
              <Link
                href="/shop?category=seafood"
                className="group relative bg-[#FFF0F5] hover:bg-[#FFE4EE] border border-[#FF5722]/15 rounded-2xl p-4 flex flex-col justify-between h-44 overflow-hidden transition-all shadow-xs hover:shadow-md"
              >
                <div className="z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5722] bg-white/90 px-2 py-0.5 rounded-full">
                    Shellfish
                  </span>
                  <h3 className="font-heading font-bold text-lg text-[#0D2137] mt-2 group-hover:text-[#FF5722] transition-colors">
                    Seafood
                  </h3>
                  <p className="text-xs text-[#0D2137]/60">Prawns, Crabs, Cuttlefish</p>
                </div>
                <div className="z-10 flex justify-end">
                  <div className="w-8 h-8 rounded-full bg-white text-[#0D2137] group-hover:bg-[#FF5722] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-28 h-28 opacity-90 transition-transform group-hover:scale-105">
                  <Image
                    src="/categories/seafood.jpg"
                    alt="Seafood"
                    fill
                    className="object-cover rounded-full"
                    sizes="112px"
                  />
                </div>
              </Link>

              {/* Fruits Card */}
              <Link
                href="/shop?category=fruits"
                className="group relative bg-[#FFF8EE] hover:bg-[#FFF0DA] border border-[#FF5722]/15 rounded-2xl p-4 flex flex-col justify-between h-44 overflow-hidden transition-all shadow-xs hover:shadow-md"
              >
                <div className="z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5722] bg-white/90 px-2 py-0.5 rounded-full">
                    Island Harvest
                  </span>
                  <h3 className="font-heading font-bold text-lg text-[#0D2137] mt-2 group-hover:text-[#FF5722] transition-colors">
                    Fresh Fruits
                  </h3>
                  <p className="text-xs text-[#0D2137]/60">Local &amp; Tropical</p>
                </div>
                <div className="z-10 flex justify-end">
                  <div className="w-8 h-8 rounded-full bg-white text-[#0D2137] group-hover:bg-[#FF5722] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-28 h-28 opacity-90 transition-transform group-hover:scale-105">
                  <Image
                    src="/categories/fruits.jpg"
                    alt="Fresh Fruits"
                    fill
                    className="object-cover rounded-full"
                    sizes="112px"
                  />
                </div>
              </Link>

              {/* Vegetables Card */}
              <Link
                href="/shop?category=vegetables"
                className="group relative bg-[#F0FAF2] hover:bg-[#E2F7E6] border border-[#27A04E]/20 rounded-2xl p-4 flex flex-col justify-between h-44 overflow-hidden transition-all shadow-xs hover:shadow-md"
              >
                <div className="z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#27A04E] bg-white/90 px-2 py-0.5 rounded-full">
                    Farm Fresh
                  </span>
                  <h3 className="font-heading font-bold text-lg text-[#0D2137] mt-2 group-hover:text-[#27A04E] transition-colors">
                    Vegetables
                  </h3>
                  <p className="text-xs text-[#0D2137]/60">Organic Produce</p>
                </div>
                <div className="z-10 flex justify-end">
                  <div className="w-8 h-8 rounded-full bg-white text-[#0D2137] group-hover:bg-[#27A04E] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-28 h-28 opacity-90 transition-transform group-hover:scale-105">
                  <Image
                    src="/categories/vegetables.jpg"
                    alt="Vegetables"
                    fill
                    className="object-cover rounded-full"
                    sizes="112px"
                  />
                </div>
              </Link>
            </div>
          </section>

          {/* 3. Featured Products */}
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDE8F0] pb-3">
              <div>
                <h2 className="font-heading text-2xl font-bold text-[#0D2137]">Featured Products</h2>
                <p className="text-xs text-[#0D2137]/60">Today&apos;s morning ocean landings</p>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                    activeTab === "all"
                      ? "bg-[#1B9AE4] text-white shadow-xs"
                      : "bg-white text-[#0D2137]/70 hover:bg-gray-100 border border-[#DDE8F0]"
                  }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setActiveTab("fish")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                    activeTab === "fish"
                      ? "bg-[#1B9AE4] text-white shadow-xs"
                      : "bg-white text-[#0D2137]/70 hover:bg-gray-100 border border-[#DDE8F0]"
                  }`}
                >
                  Fresh Fish
                </button>
                <button
                  onClick={() => setActiveTab("seafood")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                    activeTab === "seafood"
                      ? "bg-[#1B9AE4] text-white shadow-xs"
                      : "bg-white text-[#0D2137]/70 hover:bg-gray-100 border border-[#DDE8F0]"
                  }`}
                >
                  Seafood
                </button>
                <button
                  onClick={() => setActiveTab("deals")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                    activeTab === "deals"
                      ? "bg-[#FF5722] text-white shadow-xs"
                      : "bg-white text-[#FF5722] hover:bg-orange-50 border border-[#FF5722]/30"
                  }`}
                >
                  🔥 Special Deals
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </div>

        {/* ─── RIGHT COLUMN: Sticky Rail (340px) ─── */}
        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          {/* 1. Today's Special Banner */}
          <div className="bg-[#0D2137] text-white rounded-2xl p-5 relative overflow-hidden shadow-md">
            <div className="relative z-10 space-y-2">
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-[#1B9AE4] bg-[#1B9AE4]/10 border border-[#1B9AE4]/30 px-2.5 py-0.5 rounded-full">
                TODAY&apos;S SPECIAL
              </span>
              <h3 className="font-heading font-bold text-xl leading-tight">
                Yellowfin Tuna (Kelawalla)
              </h3>
              <p className="text-xs text-white/70">
                Grade-A sashimi quality landed at Negombo harbor 5 AM.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-white/60 block">Special Price</span>
                  <span className="text-lg font-bold text-[#27A04E]">
                    {formatMoney(140250)} <span className="text-xs text-white/60 font-normal">/ kg</span>
                  </span>
                </div>
                <Link
                  href="/product/yellowfin-tuna"
                  className="bg-[#1B9AE4] hover:bg-[#1478BB] text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-xs"
                >
                  Order Now →
                </Link>
              </div>
            </div>
            {/* Background image overlay */}
            <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
              <Image
                src="/banners/todays-special.jpg"
                alt="Today's Special"
                fill
                className="object-cover object-right"
              />
            </div>
          </div>

          {/* 2. Trust Row */}
          <div className="bg-white rounded-2xl border border-[#DDE8F0] p-4 shadow-xs space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0D2137]/60">
              Why Freshy.lk?
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-full bg-[#1B9AE4]/10 text-[#1B9AE4] flex items-center justify-center shrink-0">
                  <Truck className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-bold text-[#0D2137]">Express Chilled Delivery</p>
                  <p className="text-[11px] text-[#0D2137]/60">Same-day delivery to Colombo &amp; Suburbs</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-full bg-[#27A04E]/10 text-[#27A04E] flex items-center justify-center shrink-0">
                  <Leaf className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-bold text-[#0D2137]">100% Fresh Landings</p>
                  <p className="text-[11px] text-[#0D2137]/60">Sourced directly from trusted harbor boats</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-full bg-[#FF5722]/10 text-[#FF5722] flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-bold text-[#0D2137]">Vacuum Packed &amp; Chilled</p>
                  <p className="text-[11px] text-[#0D2137]/60">Hygienic processing under 4°C</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                  <MessageCircle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-bold text-[#0D2137]">WhatsApp Quick Order</p>
                  <p className="text-[11px] text-[#0D2137]/60">Instant support &amp; custom cut requests</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Daily Deals Section */}
          <div className="bg-white rounded-2xl border border-[#DDE8F0] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#DDE8F0] pb-2">
              <div className="flex items-center space-x-1.5">
                <Flame className="h-4 w-4 text-[#FF5722]" />
                <h3 className="font-heading font-bold text-sm text-[#0D2137]">Daily Deals</h3>
                <span className="bg-[#FF5722] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                  HOT
                </span>
              </div>
              <Link
                href="/shop?deals=true"
                className="text-[11px] font-bold text-[#1B9AE4] hover:text-[#1478BB]"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {DAILY_DEALS.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 border border-transparent hover:border-[#DDE8F0] transition-all group"
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-[#DDE8F0]">
                    <Image
                      src={deal.imageUrl}
                      alt={deal.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                    <span className="absolute top-0 left-0 bg-[#FF5722] text-white text-[9px] font-extrabold px-1 py-0.5 rounded-br">
                      -{deal.offerPercent}%
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${deal.slug}`}
                      className="font-bold text-xs text-[#0D2137] truncate block group-hover:text-[#1B9AE4] transition-colors"
                    >
                      {deal.name}
                    </Link>
                    {deal.localName && (
                      <span className="text-[10px] text-[#0D2137]/60 block truncate">
                        ({deal.localName})
                      </span>
                    )}
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="text-xs font-bold text-[#0D2137]">
                        {formatMoney(deal.discountPriceCents)}
                      </span>
                      <span className="text-[10px] text-[#0D2137]/40 line-through">
                        {formatMoney(deal.originalPriceCents)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddDealToCart(deal)}
                    title="Add to cart"
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      addedDealId === deal.id
                        ? "bg-[#27A04E] text-white"
                        : "bg-[#1B9AE4] hover:bg-[#1478BB] text-white shadow-xs"
                    }`}
                  >
                    {addedDealId === deal.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <ShoppingBag className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Fresh Farm Produce Banner */}
          <div className="bg-[#E8FAF0] border border-[#27A04E]/20 rounded-2xl p-5 relative overflow-hidden shadow-xs">
            <div className="relative z-10 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#27A04E] bg-white/80 px-2 py-0.5 rounded-full border border-[#27A04E]/20">
                FARM DIRECT
              </span>
              <h4 className="font-heading font-bold text-base text-[#0D2137]">
                Fresh Organic Vegetables
              </h4>
              <p className="text-xs text-[#0D2137]/70">
                Hand-picked from Nuwara Eliya farms every morning.
              </p>
              <div className="pt-2">
                <Link
                  href="/shop?category=vegetables"
                  className="inline-flex items-center space-x-1 text-xs font-bold text-[#27A04E] hover:text-[#1E7D3B]"
                >
                  <span>Browse Vegetables</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-full opacity-20 pointer-events-none">
              <Image
                src="/banners/produce.jpg"
                alt="Farm Produce"
                fill
                className="object-cover object-right"
              />
            </div>
          </div>

          {/* 5. Wholesale Ocean Banner */}
          <div className="bg-gradient-to-r from-[#0D2137] to-[#1B9AE4] text-white rounded-2xl p-5 relative overflow-hidden shadow-xs">
            <div className="relative z-10 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B9AE4] bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                B2B &amp; HOTELS
              </span>
              <h4 className="font-heading font-bold text-base">Wholesale Seafood Supply</h4>
              <p className="text-xs text-white/70">
                Tiered discounts at 10kg &amp; 25kg+ for commercial kitchens.
              </p>
              <div className="pt-2">
                <Link
                  href="/wholesale"
                  className="inline-flex items-center space-x-1 text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg border border-white/20 transition-colors"
                >
                  <span>View Wholesale Tiers</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-36 h-full opacity-15 pointer-events-none">
              <Image
                src="/banners/ocean.jpg"
                alt="Wholesale Supply"
                fill
                className="object-cover object-right"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
