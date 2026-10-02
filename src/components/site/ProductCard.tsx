import Link from "next/link";
import { formatMoney } from "@/lib/money";

export interface MockProduct {
  id: string;
  slug: string;
  name: string;
  localName?: string;
  pricePerKgCents: number;
  storageType: "FRESH" | "FROZEN";
  isAvailable: boolean;
  imageUrl?: string;
}

export default function ProductCard({ product }: { product: MockProduct }) {
  return (
    <div className="bg-white rounded-lg border border-[#DCEBE6] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="relative aspect-[4/5] bg-gradient-to-br from-[#DCEBE6] to-[#F6FAF9] flex items-center justify-center p-4">
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-[#0B1F2A]/60 flex items-center justify-center z-10">
              <span className="bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded">
                Sold Out Today
              </span>
            </div>
          )}
          <span className="text-[#0B1F2A] font-serif font-bold text-lg text-center opacity-80">
            {product.name}
            {product.localName && (
              <span className="block text-xs font-sans text-[#1F6F78] font-semibold mt-1">
                ({product.localName})
              </span>
            )}
          </span>
          <span className="absolute top-2 right-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/80 text-[#0B1F2A]">
            {product.storageType}
          </span>
        </div>

        <div className="p-4">
          <Link href={`/product/${product.slug}`} className="hover:text-[#FF6A4D] transition-colors">
            <h3 className="font-serif font-bold text-lg text-[#0B1F2A]">{product.name}</h3>
            {product.localName && (
              <p className="text-xs text-[#1F6F78] font-medium">{product.localName}</p>
            )}
          </Link>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xs text-gray-500 font-medium">Price / kg</span>
            <span className="text-base font-bold text-[#0B1F2A]">
              {formatMoney(product.pricePerKgCents)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
        <Link
          href={`/product/${product.slug}`}
          className={`w-full block text-center py-2 px-4 rounded text-sm font-semibold transition-colors ${
            product.isAvailable
              ? "bg-[#FF6A4D] text-white hover:bg-[#E5593F]"
              : "bg-gray-200 text-gray-400 pointer-events-none"
          }`}
        >
          {product.isAvailable ? "Select Pack & Prep" : "Unavailable"}
        </Link>
      </div>
    </div>
  );
}
