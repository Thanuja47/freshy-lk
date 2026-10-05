"use client";

import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/money";
import { useCartStore } from "@/store/cart";
import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";

export interface MockProduct {
  id: string;
  slug: string;
  name: string;
  localName?: string;
  pricePerKgCents: number;
  storageType: "FRESH" | "FROZEN" | "AMBIENT";
  isAvailable: boolean;
  imageUrl?: string;
  lowStock?: boolean;
  offerPercent?: number | null;
  offerEndsAt?: Date | string | null;
}

export default function ProductCard({ product }: { product: MockProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  // Check if offer is currently active
  const hasOffer =
    !!product.offerPercent &&
    product.offerPercent >= 1 &&
    (!product.offerEndsAt || new Date(product.offerEndsAt) > new Date());

  const offerPrice = hasOffer
    ? Math.round(product.pricePerKgCents * (1 - (product.offerPercent ?? 0) / 100))
    : null;

  const imagePath = product.imageUrl ?? `/placeholders/${product.slug}.jpg`;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      localName: product.localName,
      storageType: product.storageType,
      pricePerKgCents: offerPrice ?? product.pricePerKgCents,
      priceVersion: 1,
      weightGrams: 1000,
      packLabel: "1 kg",
      quantity: 1,
      prepOptionId: null,
      prepName: "Whole",
      prepFeeCents: 0,
      prepFeeType: "FLAT",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="group bg-white rounded-2xl border border-[#DDE8F0] overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Photo — 3:2 landscape */}
      <Link href={`/product/${product.slug}`} className="block relative aspect-[3/2] bg-[#EAF5FE] overflow-hidden">
        <Image
          src={imagePath}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-103 transition-transform duration-300"
        />

        {/* "Fresh" badge top-left */}
        {product.storageType === "FRESH" && (
          <span className="absolute top-2 left-2 text-[10px] font-bold bg-[#1B9AE4] text-white px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
            Fresh
          </span>
        )}
        {product.storageType === "FROZEN" && (
          <span className="absolute top-2 left-2 text-[10px] font-bold bg-[#6B7A8D] text-white px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
            Frozen
          </span>
        )}

        {/* Offer / discount badge */}
        {hasOffer && (
          <span className="absolute top-2 right-2 text-[10px] font-bold bg-[#FF5722] text-white px-2 py-0.5 rounded-full shadow-sm">
            -{product.offerPercent}%
          </span>
        )}

        {/* Sold out overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-[#0D2137]/60 flex items-center justify-center">
            <span className="bg-white/90 text-[#0D2137] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
              Sold Out
            </span>
          </div>
        )}
      </Link>

      {/* Content row */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-heading font-bold text-sm text-[#0D2137] leading-snug truncate">
              {product.name}
            </h3>
          </Link>
          <div className="mt-0.5 flex items-baseline gap-1.5 flex-wrap">
            {offerPrice !== null ? (
              <>
                <span className="text-sm font-bold text-[#0D2137]">
                  {formatMoney(offerPrice)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  {formatMoney(product.pricePerKgCents)}
                </span>
                <span className="text-xs text-gray-500">/kg</span>
              </>
            ) : (
              <>
                <span className="text-sm font-bold text-[#0D2137]">
                  {formatMoney(product.pricePerKgCents)}
                </span>
                <span className="text-xs text-gray-500">/kg</span>
              </>
            )}
          </div>
        </div>

        {/* Round blue cart button */}
        <button
          onClick={handleQuickAdd}
          disabled={!product.isAvailable}
          aria-label={`Add ${product.name} to cart`}
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 ${
            !product.isAvailable
              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
              : added
              ? "bg-green-500 text-white scale-90"
              : "bg-[#1B9AE4] hover:bg-[#1478BB] text-white shadow-sm hover:shadow-md"
          }`}
        >
          {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
