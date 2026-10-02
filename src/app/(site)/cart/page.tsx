"use client";

import Link from "next/link";
import { useCartStore, type CartItem } from "@/store/cart";
import { formatMoney } from "@/lib/money";
import { calculatePackPriceCents, calculatePrepFeeCents } from "@/lib/pricing";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();

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

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-[#DCEBE6] text-[#1F6F78] rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#0B1F2A]">Your Cart is Empty</h1>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Explore today&apos;s fresh seafood landings and select your preferred packs and preparation style.
        </p>
        <Link
          href="/shop"
          className="inline-block bg-[#FF6A4D] hover:bg-[#E5593F] text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors"
        >
          Shop Today&apos;s Catch
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-[#DCEBE6] pb-4">
        <h1 className="font-serif text-3xl font-bold text-[#0B1F2A]">Your Shopping Cart</h1>
        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:text-red-800 font-semibold"
        >
          Clear Cart
        </button>
      </div>

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
              className="bg-white p-4 rounded-lg border border-[#DCEBE6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-[#0B1F2A]">
                  {item.productName}{" "}
                  {item.localName && <span className="text-xs text-[#1F6F78] font-normal">({item.localName})</span>}
                </h3>
                <div className="text-xs text-gray-500 space-x-3">
                  <span>Pack: <strong className="text-gray-700">{item.packLabel}</strong></span>
                  <span>Prep: <strong className="text-gray-700">{item.prepName || "Whole"}</strong></span>
                </div>
                <p className="text-xs text-gray-500">
                  Unit Pack Price: {formatMoney(packPrice)} {prepFee > 0 && `(+${formatMoney(prepFee)} prep)`}
                </p>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto space-x-6">
                <div className="flex items-center border border-gray-300 rounded bg-white">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-2.5 py-0.5 bg-gray-100 hover:bg-gray-200 font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-2.5 py-0.5 bg-gray-100 hover:bg-gray-200 font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <span className="block font-bold text-base text-[#0B1F2A]">{formatMoney(itemTotal)}</span>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-600 p-1"
                  title="Remove item"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#F6FAF9] border border-[#DCEBE6] p-6 rounded-xl space-y-4">
        <div className="flex justify-between text-base font-bold text-[#0B1F2A] border-b border-[#DCEBE6] pb-3">
          <span>Subtotal</span>
          <span>{formatMoney(subtotalCents)}</span>
        </div>
        <p className="text-xs text-gray-500">
          Delivery fees, courier cold-chain rules, and district options will be calculated at checkout.
        </p>
        <Link
          href="/checkout"
          className="w-full bg-[#FF6A4D] hover:bg-[#E5593F] text-white py-3.5 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors shadow-sm"
        >
          <span>Proceed to Checkout</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
