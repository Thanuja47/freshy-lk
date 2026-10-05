"use client";

import { useState } from "react";
import Image from "next/image";
import { formatMoney } from "@/lib/money";
import { calculatePackPriceCents, calculatePrepFeeCents, getEffectivePricePerKgCents } from "@/lib/pricing";
import { useCartStore, type CartStore } from "@/store/cart";
import { ShoppingBag, CheckCircle, Sparkles } from "lucide-react";

const SAMPLE_PRODUCT_DATA = {
  id: "prod-tuna-1",
  slug: "yellowfin-tuna",
  name: "Yellowfin Tuna",
  localName: "Kelawalla",
  shortDesc: "Wild-caught premium yellowfin tuna landed daily in Negombo.",
  description: "Dense, firm flesh ideal for steaks, curry, or sashimi. Chilled immediately upon catch to maintain peak freshness.",
  tips: "Wipe clean with cold paper towel. Cut against the grain for best tenderness in curry or grilled steaks.",
  catchType: "Wild caught",
  origin: "Negombo Harbor",
  storageType: "FRESH" as const,
  pricePerKgCents: 165000,
  offerPercent: 15,
  priceVersion: 1,
  imageUrl: "/placeholders/yellowfin-tuna.jpg",
  packs: [
    { weightGrams: 500, label: "500 g" },
    { weightGrams: 1000, label: "1 kg" },
    { weightGrams: 2000, label: "2 kg" },
    { weightGrams: 5000, label: "5 kg" },
  ],
  prepOptions: [
    { id: "prep-1", name: "Whole (Uncleaned)", feeCents: 0, feeType: "FLAT" as const, isDefault: true },
    { id: "prep-2", name: "Cleaned (Gutted & Scaled)", feeCents: 10000, feeType: "PER_KG" as const, isDefault: false },
    { id: "prep-3", name: "Curry Cut (Medium Pieces)", feeCents: 10000, feeType: "PER_KG" as const, isDefault: false },
    { id: "prep-4", name: "Steaks (Thick Cut)", feeCents: 15000, feeType: "PER_KG" as const, isDefault: false },
  ],
  tiers: [
    { minWeightGrams: 10000, pricePerKgCents: 155000, label: "Wholesale 10 kg+" },
    { minWeightGrams: 25000, pricePerKgCents: 145000, label: "Wholesale 25 kg+" },
  ],
};

export default function ProductDetailPage() {
  const product = SAMPLE_PRODUCT_DATA;
  const addItem = useCartStore((state: CartStore) => state.addItem);

  const [selectedPack, setSelectedPack] = useState(product.packs[1]); // Default 1 kg
  const [selectedPrep, setSelectedPrep] = useState(product.prepOptions[0]); // Default Whole
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Calculate discount rate if present
  const activePricePerKg = product.offerPercent
    ? Math.round(product.pricePerKgCents * (1 - product.offerPercent / 100))
    : product.pricePerKgCents;

  const totalGrams = selectedPack.weightGrams * quantity;

  // Pricing calculations
  const { pricePerKgCents, tierLabel } = getEffectivePricePerKgCents(
    activePricePerKg,
    product.tiers,
    totalGrams
  );

  const basePackPrice = calculatePackPriceCents(pricePerKgCents, selectedPack.weightGrams);
  const prepFee = calculatePrepFeeCents(
    selectedPrep.feeCents,
    selectedPrep.feeType,
    selectedPack.weightGrams,
    quantity
  );
  const lineTotalCents = basePackPrice * quantity + prepFee;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      localName: product.localName,
      imageUrl: product.imageUrl,
      storageType: product.storageType,
      pricePerKgCents: pricePerKgCents,
      priceVersion: product.priceVersion,
      weightGrams: selectedPack.weightGrams,
      packLabel: selectedPack.label,
      quantity: quantity,
      prepOptionId: selectedPrep.id,
      prepName: selectedPrep.name,
      prepFeeCents: selectedPrep.feeCents,
      prepFeeType: selectedPrep.feeType,
    });

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-28 md:pb-12 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-[#DDE8F0] bg-[#E8F4FE] shadow-xs">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {product.offerPercent && (
              <span className="absolute top-4 left-4 bg-[#FF5722] text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase shadow-md">
                -{product.offerPercent}% OFF
              </span>
            )}
            <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs text-[#1B9AE4] border border-[#1B9AE4]/20 text-xs font-bold px-3 py-1 rounded-full uppercase shadow-xs">
              {product.storageType === "FRESH" ? "Fresh / Landed Today" : "Frozen"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-white border border-[#DDE8F0] rounded-2xl p-4 text-xs text-[#0D2137]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#0D2137]/50 block">Catch Origin</span>
              <span className="font-bold text-[#0D2137]">{product.origin}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#0D2137]/50 block">Catch Type</span>
              <span className="font-bold text-[#0D2137]">{product.catchType}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#0D2137]/50 block">Landings</span>
              <span className="text-[#27A04E] font-bold">5 AM Today</span>
            </div>
          </div>
        </div>

        {/* Right Column: Product Details & Selection */}
        <div className="lg:col-span-6 space-y-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 bg-[#1B9AE4]/10 border border-[#1B9AE4]/20 px-3 py-1 rounded-full text-xs font-bold text-[#1B9AE4] mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Wild Caught Morning Landings</span>
            </div>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0D2137]">{product.name}</h1>
            <p className="text-[#1B9AE4] font-bold text-base mt-0.5">{product.localName}</p>
            <p className="text-xs sm:text-sm text-[#0D2137]/70 mt-2 leading-relaxed">{product.shortDesc}</p>
          </div>

          {/* Price Box */}
          <div className="bg-[#E8F4FE]/60 border border-[#1B9AE4]/20 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#0D2137]/60 font-bold uppercase tracking-wider block">Price per kg</span>
              {product.offerPercent ? (
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-extrabold text-[#0D2137]">
                    {formatMoney(activePricePerKg)}
                  </span>
                  <span className="text-sm text-[#0D2137]/40 line-through">
                    {formatMoney(product.pricePerKgCents)}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-extrabold text-[#0D2137]">
                  {formatMoney(pricePerKgCents)}
                </span>
              )}
            </div>

            {tierLabel && (
              <span className="text-xs font-bold text-[#27A04E] bg-[#27A04E]/10 border border-[#27A04E]/20 px-3 py-1 rounded-full">
                {tierLabel} Applied
              </span>
            )}
          </div>

          {/* 1. Pack Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]">
              1. Select Pack Size
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {product.packs.map((pack) => {
                const packPrice = calculatePackPriceCents(pricePerKgCents, pack.weightGrams);
                const isSelected = selectedPack.weightGrams === pack.weightGrams;
                return (
                  <button
                    key={pack.weightGrams}
                    onClick={() => setSelectedPack(pack)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? "border-[#1B9AE4] bg-[#1B9AE4]/10 text-[#0D2137] font-bold ring-2 ring-[#1B9AE4]/20"
                        : "border-[#DDE8F0] bg-white text-[#0D2137]/80 hover:border-[#1B9AE4]"
                    }`}
                  >
                    <span className="block text-sm font-bold">{pack.label}</span>
                    <span className="block text-xs font-semibold text-[#1B9AE4] mt-0.5">{formatMoney(packPrice)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Prep Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]">
              2. Select Preparation Cut
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {product.prepOptions.map((prep) => {
                const isSelected = selectedPrep.id === prep.id;
                return (
                  <button
                    key={prep.id}
                    onClick={() => setSelectedPrep(prep)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? "border-[#1B9AE4] bg-[#1B9AE4]/10 text-[#0D2137] font-bold ring-2 ring-[#1B9AE4]/20"
                        : "border-[#DDE8F0] bg-white text-[#0D2137]/80 hover:border-[#1B9AE4]"
                    }`}
                  >
                    <span className="text-xs font-bold">{prep.name}</span>
                    <span className="text-[11px] text-[#1B9AE4] mt-1 font-semibold">
                      {prep.feeCents === 0 ? "Free Prep" : `+${formatMoney(prep.feeCents)} / kg`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Stepper */}
          <div className="flex items-center justify-between border-t border-b border-[#DDE8F0] py-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#0D2137]">Quantity:</label>
            <div className="flex items-center border border-[#DDE8F0] rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 bg-gray-50 hover:bg-gray-100 font-bold text-lg flex items-center justify-center text-[#0D2137]"
              >
                -
              </button>
              <span className="w-12 text-center text-sm font-bold text-[#0D2137]">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 bg-gray-50 hover:bg-gray-100 font-bold text-lg flex items-center justify-center text-[#0D2137]"
              >
                +
              </button>
            </div>
          </div>

          {/* Desktop Add to Cart */}
          <div className="hidden md:block space-y-3 pt-2">
            <button
              onClick={handleAddToCart}
              className="w-full bg-[#0D2137] hover:bg-[#1B9AE4] text-white py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Add to Cart ({formatMoney(lineTotalCents)})</span>
            </button>

            {addedNotice && (
              <div className="bg-[#27A04E]/10 text-[#27A04E] border border-[#27A04E]/20 text-xs font-bold p-3 rounded-2xl text-center flex items-center justify-center space-x-2 animate-fade-up">
                <CheckCircle className="h-4 w-4" />
                <span>Added to cart successfully!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Add to Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#DDE8F0] z-50 md:hidden flex items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="block text-[10px] text-[#0D2137]/60 font-bold uppercase">Total</span>
          <span className="text-xl font-extrabold text-[#0D2137]">{formatMoney(lineTotalCents)}</span>
        </div>
        <button
          onClick={handleAddToCart}
          className="bg-[#0D2137] hover:bg-[#1B9AE4] text-white px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center space-x-2 transition-all shadow-md"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
