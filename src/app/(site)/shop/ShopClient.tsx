"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard, { type MockProduct } from "@/components/site/ProductCard";
import { Search, ArrowUpDown, Sparkles } from "lucide-react";

export interface ShopProductItem extends MockProduct {
  category?: string;
}

export default function ShopClient({ initialProducts }: { initialProducts: ShopProductItem[] }) {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") || "";
  const catParam = searchParams.get("category") || "all";

  const [localCategory, setLocalCategory] = useState<string | null>(null);
  const [storageFilter, setStorageFilter] = useState<"ALL" | "FRESH" | "FROZEN">("ALL");
  const [localSearch, setLocalSearch] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"PRICE_ASC" | "PRICE_DESC" | "NAME">("NAME");

  const selectedCategory = localCategory !== null ? localCategory : catParam;
  const searchQuery = localSearch !== null ? localSearch : qParam;

  const filteredProducts = initialProducts
    .filter((p) => {
      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "deals" ? p.offerPercent !== null && (p.offerPercent ?? 0) > 0 : p.category === selectedCategory);
      const matchesStorage =
        storageFilter === "ALL" || p.storageType === storageFilter;
      const matchesSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.localName && p.localName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesStorage && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "PRICE_ASC") return a.pricePerKgCents - b.pricePerKgCents;
      if (sortBy === "PRICE_DESC") return b.pricePerKgCents - a.pricePerKgCents;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-24 md:pb-12 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#E8F4FE] via-[#EEF8FF] to-white border border-[#DDE8F0] p-6 sm:p-8 rounded-3xl space-y-2 relative overflow-hidden shadow-xs">
        <div className="inline-flex items-center space-x-1.5 bg-white border border-[#1B9AE4]/20 px-3 py-1 rounded-full text-xs font-bold text-[#1B9AE4]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Daily Coastal Landings</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0D2137]">
          Shop Catch of the Day
        </h1>
        <p className="text-xs sm:text-sm text-[#0D2137]/70 max-w-xl">
          Order fresh fish online directly from Sri Lankan coastal waters. Fixed-weight packs &amp; custom preparations delivered across Sri Lanka.
        </p>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md border border-[#DDE8F0] p-3.5 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setLocalCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === "all"
                  ? "bg-[#1B9AE4] text-white shadow-xs"
                  : "bg-gray-100 text-[#0D2137]/80 hover:bg-gray-200"
              }`}
            >
              All Catch ({initialProducts.length})
            </button>
            <button
              onClick={() => setLocalCategory("fish")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === "fish"
                  ? "bg-[#1B9AE4] text-white shadow-xs"
                  : "bg-gray-100 text-[#0D2137]/80 hover:bg-gray-200"
              }`}
            >
              Fresh Fish
            </button>
            <button
              onClick={() => setLocalCategory("seafood")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === "seafood"
                  ? "bg-[#1B9AE4] text-white shadow-xs"
                  : "bg-gray-100 text-[#0D2137]/80 hover:bg-gray-200"
              }`}
            >
              Seafood &amp; Shellfish
            </button>
            <button
              onClick={() => setLocalCategory("deals")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === "deals"
                  ? "bg-[#FF5722] text-white shadow-xs"
                  : "bg-orange-50 text-[#FF5722] hover:bg-orange-100 border border-[#FF5722]/30"
              }`}
            >
              🔥 Daily Deals
            </button>
          </div>

          {/* Right Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Fresh / Frozen Toggle */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center text-xs font-bold">
              <button
                onClick={() => setStorageFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  storageFilter === "ALL" ? "bg-white text-[#0D2137] shadow-xs" : "text-[#0D2137]/60"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStorageFilter("FRESH")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  storageFilter === "FRESH" ? "bg-white text-[#1B9AE4] shadow-xs" : "text-[#0D2137]/60"
                }`}
              >
                Fresh Only
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-44">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-[#DDE8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B9AE4]"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-1 border border-[#DDE8F0] bg-gray-50 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0D2137]">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#1B9AE4]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "PRICE_ASC" | "PRICE_DESC" | "NAME")}
                className="bg-transparent focus:outline-none"
              >
                <option value="NAME">Sort by Name</option>
                <option value="PRICE_ASC">Price: Low to High</option>
                <option value="PRICE_DESC">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Result Count */}
      <div className="flex items-center justify-between text-xs font-bold text-[#0D2137]/60">
        <span>Showing {filteredProducts.length} items</span>
        <span>Updated daily rates</span>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {filteredProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
