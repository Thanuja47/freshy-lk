"use client";

import Link from "next/link";
import { ShoppingBag, Menu, Fish } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0B1F2A] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2 font-serif text-2xl tracking-wide font-bold">
          <Fish className="h-7 w-7 text-[#FF6A4D]" />
          <span>Freshy<span className="text-[#FF6A4D]">.lk</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <Link href="/shop" className="hover:text-[#FF6A4D] transition-colors">
            Shop Catch
          </Link>
          <Link href="/wholesale" className="hover:text-[#FF6A4D] transition-colors">
            Wholesale / B2B
          </Link>
          <Link href="/delivery" className="hover:text-[#FF6A4D] transition-colors">
            Delivery Zones
          </Link>
          <Link href="/about" className="hover:text-[#FF6A4D] transition-colors">
            About Us
          </Link>
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-4">
          <Link
            href="/cart"
            className="relative p-2 text-white hover:text-[#FF6A4D] transition-colors flex items-center"
            aria-label="View Cart"
          >
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 bg-[#FF6A4D] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              0
            </span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-[#1F6F78] focus:outline-none"
            aria-label="Toggle Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B1F2A] border-t border-[#1F6F78] px-4 pt-2 pb-4 space-y-2">
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium hover:text-[#FF6A4D]"
          >
            Shop Catch
          </Link>
          <Link
            href="/wholesale"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium hover:text-[#FF6A4D]"
          >
            Wholesale / B2B
          </Link>
          <Link
            href="/delivery"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium hover:text-[#FF6A4D]"
          >
            Delivery Zones
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium hover:text-[#FF6A4D]"
          >
            About Us
          </Link>
        </div>
      )}
    </header>
  );
}
