"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore, type CartItem } from "@/store/cart";
import { formatMoney } from "@/lib/money";
import { calculatePackPriceCents, calculatePrepFeeCents } from "@/lib/pricing";
import { Trash2, ShoppingBag, ArrowRight, Info, ShieldCheck } from "lucide-react";
import { SRI_LANKA_DISTRICTS } from "@/lib/constants";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const [selectedDistrict, setSelectedDistrict] = useState("Colombo");

  const subtotalCents = items.reduce((sum: number, item: CartItem) => {
    const packPrice = calculatePackPriceCents(item.pricePerKgCents, item.weightGrams);
    const prepFee = calculatePrepFeeCents(
      item.prepFeeCents,
      item.prepFeeType,
      item.weightGrams,
      item.quantity
    );
    return sum + packPrice * item.quantity + prepFee;
  }, 0);

  const totalCartWeightKg = (
    items.reduce((acc, item) => acc + item.weightGrams * item.quantity, 0) / 1000
  ).toFixed(1);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-[#E8F4FE] text-[#1B9AE4] rounded-3xl flex items-center justify-center mx-auto shadow-xs border border-[#1B9AE4]/20">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-extrabold text-[#0D2137]">Your Cart is Empty</h1>
          <p className="text-xs sm:text-sm text-[#0D2137]/70 max-w-sm mx-auto">
            Explore today&apos;s fresh seafood landings and select your preferred fixed-weight packs.
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center space-x-2 bg-[#0D2137] hover:bg-[#1B9AE4] text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md"
        >
          <span>Shop Today&apos;s Catch</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-24 md:pb-12 space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-[#DDE8F0] pb-4">
        <div>
          <h1 className="font-heading font-extrabold text-3xl text-[#0D2137]">Your Shopping Cart</h1>
          <p className="text-xs text-[#0D2137]/60 mt-1">Total Weight: {totalCartWeightKg} kg</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:text-red-800 font-bold px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      {/* Cart Items List */}
      <div className="space-y-4">
        {items.map((item: CartItem) => {
          const packPrice = calculatePackPriceCents(item.pricePerKgCents, item.weightGrams);
          const prepFee = calculatePrepFeeCents(
            item.prepFeeCents,
            item.prepFeeType,
            item.weightGrams,
            item.quantity
          );
          const itemTotal = packPrice * item.quantity + prepFee;

          return (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-[#DDE8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-heading font-bold text-lg text-[#0D2137]">
                    {item.productName}
                  </h3>
                  {item.localName && (
                    <span className="text-xs text-[#1B9AE4] font-bold">({item.localName})</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-[#0D2137]/70">
                  <span className="bg-[#E8F4FE] border border-[#1B9AE4]/20 px-2.5 py-0.5 rounded-md font-semibold text-[#0D2137]">
                    Pack: {item.packLabel}
                  </span>
                  <span className="bg-[#E8F4FE] border border-[#1B9AE4]/20 px-2.5 py-0.5 rounded-md font-semibold text-[#0D2137]">
                    Prep: {item.prepName || "Whole"}
                  </span>
                </div>
                <p className="text-xs text-[#0D2137]/50 pt-1">
                  Pack Rate: {formatMoney(packPrice)} {prepFee > 0 && `(+${formatMoney(prepFee)} prep)`}
                </p>
              </div>

              {/* Quantity Stepper & Price */}
              <div className="flex items-center justify-between w-full sm:w-auto space-x-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#DDE8F0]">
                <div className="flex items-center border border-[#DDE8F0] rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 bg-gray-50 hover:bg-gray-100 font-bold text-base flex items-center justify-center text-[#0D2137]"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-[#0D2137]">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 bg-gray-50 hover:bg-gray-100 font-bold text-base flex items-center justify-center text-[#0D2137]"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <span className="block font-bold text-lg text-[#0D2137]">{formatMoney(itemTotal)}</span>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  title="Remove item"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wholesale Hint */}
      <div className="bg-[#E8F4FE] border border-[#1B9AE4]/20 p-4 rounded-2xl flex items-start space-x-3 text-xs text-[#0D2137]">
        <Info className="h-5 w-5 text-[#1B9AE4] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Wholesale Tier Discount Hint</p>
          <p className="text-[#0D2137]/70">
            Adding 10 kg or more of any fish automatically applies wholesale tier pricing!
          </p>
        </div>
      </div>

      {/* District Estimate & Checkout CTA */}
      <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl space-y-6 shadow-xs">
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]">
            Select Delivery District
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full max-w-sm px-4 py-3 border border-[#DDE8F0] rounded-xl text-xs font-bold text-[#0D2137] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4]"
          >
            {SRI_LANKA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d} District
              </option>
            ))}
          </select>
          <p className="text-xs text-[#27A04E] font-bold flex items-center space-x-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Estimated delivery to {selectedDistrict}: 1 - 2 Days Cold-Chain Courier</span>
          </p>
        </div>

        {/* Subtotal & Checkout CTA */}
        <div className="border-t border-[#DDE8F0] pt-6 space-y-4">
          <div className="flex justify-between items-baseline text-lg font-bold text-[#0D2137]">
            <span>Subtotal (Excl. delivery)</span>
            <span className="text-2xl font-extrabold text-[#0D2137]">{formatMoney(subtotalCents)}</span>
          </div>

          <Link
            href="/checkout"
            className="w-full bg-[#0D2137] hover:bg-[#1B9AE4] text-white py-4 px-6 rounded-xl font-bold text-base flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
