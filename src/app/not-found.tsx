import Link from "next/link";
import { Compass, ShoppingBag, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F5F8FA]">
      <div className="max-w-md w-full bg-white border border-[#DDE8F0] p-8 rounded-3xl shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#E8F4FE] text-[#1B9AE4] flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B9AE4]">Error 404</span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0D2137]">
            Off Course at Sea
          </h1>
          <p className="text-xs sm:text-sm text-[#0D2137]/70 leading-relaxed">
            The page or product you are looking for doesn&apos;t exist, has been moved, or the catch is no longer available.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#0D2137] font-bold text-xs rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B9AE4] hover:bg-[#1580be] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Shop</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
