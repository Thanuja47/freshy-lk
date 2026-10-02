"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { calculatePackPriceCents, calculatePrepFeeCents, getEffectivePricePerKgCents } from "@/lib/pricing";
import { useCartStore, type CartStore } from "@/store/cart";
import { ShoppingBag, CheckCircle, Info } from "lucide-react";

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
  priceVersion: 1,
  packs: [
    { weightGrams: 500, label: "500 g" },
    { weightGrams: 1000, label: "1 kg" },
    { weightGrams: 2000, label: "2 kg" },
    { weightGrams: 5000, label: "5 kg" },
  ],
  prepOptions: [
    { id: "prep-1", name: "Whole", feeCents: 0, feeType: "FLAT" as const, isDefault: true },
    { id: "prep-2", name: "Cleaned (Gutted & Scaled)", feeCents: 10000, feeType: "PER_KG" as const, isDefault: false },
    { id: "prep-3", name: "Curry Cut (Medium Pieces)", feeCents: 10000, feeType: "PER_KG" as const, isDefault: false },
    { id: "prep-4", name: "Steaks", feeCents: 15000, feeType: "PER_KG" as const, isDefault: false },
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

  // Calculate total grams for line item
  const totalGrams = selectedPack.weightGrams * quantity;

  // Pricing calculations
  const { pricePerKgCents, tierLabel } = getEffectivePricePerKgCents(
    product.pricePerKgCents,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Product Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/3] bg-gradient-to-br from-[#DCEBE6] to-[#F6FAF9] border border-[#DCEBE6] rounded-xl flex items-center justify-center p-8 text-center relative overflow-hidden">
            <div>
              <span className="font-serif font-bold text-3xl text-[#0B1F2A] block">{product.name}</span>
              <span className="text-[#1F6F78] font-bold text-lg">{product.localName}</span>
            </div>
            <span className="absolute top-4 left-4 bg-white/90 text-[#0B1F2A] text-xs font-bold px-3 py-1 rounded-full uppercase">
              {product.storageType} Chilled
            </span>
          </div>

          <div className="bg-[#DCEBE6]/40 border border-[#DCEBE6] rounded-lg p-4 text-xs text-gray-600 space-y-1">
            <p><strong className="text-[#0B1F2A]">Catch Type:</strong> {product.catchType}</p>
            <p><strong className="text-[#0B1F2A]">Origin:</strong> {product.origin}</p>
          </div>
        </div>

        {/* Product Details & Selection Form */}
        <div className="space-y-6">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#0B1F2A]">{product.name}</h1>
            <p className="text-[#1F6F78] text-[#1F6F78] font-semibold text-lg">{product.localName}</p>
            <p className="text-sm text-gray-600 mt-2">{product.shortDesc}</p>
          </div>

          <div className="border-t border-b border-[#DCEBE6] py-3 flex items-baseline justify-between">
            <span className="text-sm text-gray-500 font-medium">Daily Base Price</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-[#0B1F2A]">
                {formatMoney(pricePerKgCents)}
              </span>
              <span className="text-xs text-gray-500 font-normal"> / kg</span>
              {tierLabel && (
                <span className="block text-xs font-bold text-[#FF6A4D]">{tierLabel} Applied!</span>
              )}
            </div>
          </div>

          {/* Pack Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              1. Choose Pack Size (Fixed Weight)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {product.packs.map((pack) => {
                const packPrice = calculatePackPriceCents(pricePerKgCents, pack.weightGrams);
                const isSelected = selectedPack.weightGrams === pack.weightGrams;
                return (
                  <button
                    key={pack.weightGrams}
                    onClick={() => setSelectedPack(pack)}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      isSelected
                        ? "border-[#FF6A4D] bg-[#FF6A4D]/10 text-[#0B1F2A] font-bold"
                        : "border-gray-200 bg-white hover:border-[#1F6F78]"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{pack.label}</span>
                    <span className="block text-xs text-gray-500">{formatMoney(packPrice)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prep Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              2. Choose Prep Option
            </label>
            <div className="space-y-2">
              {product.prepOptions.map((prep) => {
                const isSelected = selectedPrep.id === prep.id;
                return (
                  <button
                    key={prep.id}
                    onClick={() => setSelectedPrep(prep)}
                    className={`w-full p-3 rounded-lg border flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? "border-[#1F6F78] bg-[#DCEBE6]/50 text-[#0B1F2A] font-bold"
                        : "border-gray-200 bg-white hover:border-[#1F6F78]"
                    }`}
                  >
                    <span className="text-sm">{prep.name}</span>
                    <span className="text-xs text-gray-500">
                      {prep.feeCents === 0 ? "Free" : `+${formatMoney(prep.feeCents)} / kg`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Stepper */}
          <div className="flex items-center space-x-4">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Quantity:</label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 font-bold"
              >
                -
              </button>
              <span className="px-4 py-1 text-sm font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Wholesale Tiers Info */}
          {product.tiers.length > 0 && (
            <div className="bg-[#F6FAF9] border border-[#DCEBE6] p-3 rounded-lg flex items-start space-x-2 text-xs text-gray-600">
              <Info className="h-4 w-4 text-[#1F6F78] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#0B1F2A]">Automatic Wholesale Discounts</p>
                <p>Buy 10 kg+ at Rs. 1,550/kg | Buy 25 kg+ at Rs. 1,450/kg</p>
              </div>
            </div>
          )}

          {/* Add to Cart CTA */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleAddToCart}
              className="w-full bg-[#FF6A4D] hover:bg-[#E5593F] text-white py-3.5 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors shadow-sm"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Add to Cart ({formatMoney(lineTotalCents)})</span>
            </button>

            {addedNotice && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold p-2.5 rounded text-center flex items-center justify-center space-x-1">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Added to cart successfully!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
