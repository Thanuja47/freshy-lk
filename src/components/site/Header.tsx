"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/store/cart";
import {
  Search,
  ShoppingCart,
  MapPin,
  Truck,
  MessageCircle,
  Home,
  Store,
  X,
  ChevronDown,
  Fish,
  Leaf,
  Apple,
  Tag,
  Mail,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/", icon: Home },
  {
    label: "Seafood",
    href: "/shop?category=seafood",
    icon: Fish,
    children: [
      { label: "Tiger Prawns", href: "/shop?category=seafood&q=prawns" },
      { label: "Mud Crab", href: "/shop?category=seafood&q=crab" },
      { label: "Cuttlefish", href: "/shop?category=seafood&q=cuttlefish" },
      { label: "Lobster", href: "/shop?category=seafood&q=lobster" },
    ],
  },
  { label: "Fish", href: "/shop?category=fish", icon: Fish },
  { label: "Fruits", href: "/shop?category=fruits", icon: Apple },
  { label: "Vegetables", href: "/shop?category=vegetables", icon: Leaf },
  { label: "Offers", href: "/shop?deals=true", icon: Tag },
  { label: "Contact", href: "/contact", icon: Mail },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartAnimate, setCartAnimate] = useState(false);
  const [seafoodOpen, setSeafoodOpen] = useState(false);
  const seafoodRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const items = useCartStore((s) => s.items);
  const totalCartCount = items.reduce((n, i) => n + i.quantity, 0);

  // Animate cart badge on count change
  useEffect(() => {
    if (totalCartCount > 0) {
      const raf = requestAnimationFrame(() => setCartAnimate(true));
      const t = setTimeout(() => setCartAnimate(false), 300);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(t);
      };
    }
  }, [totalCartCount]);

  // Focus search input when overlay opens
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Close seafood dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (seafoodRef.current && !seafoodRef.current.contains(e.target as Node)) {
        setSeafoodOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("?")[0]);
  };

  return (
    <>
      {/* ── Top utility bar ── */}
      <div className="bg-[#0D2137] text-white text-[11px] py-1.5 px-4 hidden sm:block">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <Truck className="h-3 w-3 text-[#1B9AE4]" />
              <span>Chilled Delivery Islandwide</span>
            </span>
            <span className="text-white/30">|</span>
            <span className="text-white/80">
              Order before 12 PM → same-day delivery in selected zones
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/track" className="hover:text-[#1B9AE4] transition-colors">
              Track Order
            </Link>
            <a
              href="https://wa.me/94771234567"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-[#25D366] font-bold hover:underline"
            >
              <MessageCircle className="h-3 w-3" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Main sticky header ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DDE8F0] shadow-sm">
        {/* Row 1: Logo + Search + Account/Wishlist/Cart */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <div className="relative h-12 w-40">
              <Image
                src="/brand/logo.svg"
                alt="Freshy.lk — Fresh from the Ocean & Farm"
                fill
                priority
                className="object-contain object-left"
                sizes="160px"
              />
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for fresh fish, fruits, vegetables..."
                className="w-full pl-4 pr-14 py-2.5 bg-[#F0F7FF] border border-[#DDE8F0] rounded-full text-sm text-[#0D2137] placeholder-[#0D2137]/40 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 h-8 w-8 bg-[#1B9AE4] hover:bg-[#1478BB] text-white rounded-full flex items-center justify-center transition-colors"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Right: Account, Wishlist, Cart */}
          <div className="flex items-center space-x-1 sm:space-x-3 ml-auto md:ml-0">
            {/* Mobile search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2 text-[#0D2137] hover:text-[#1B9AE4] transition-colors"
              aria-label="Search"
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>

            {/* Track Order */}
            <Link
              href="/track"
              className="hidden sm:flex flex-col items-center text-[#0D2137] hover:text-[#1B9AE4] transition-colors p-1"
              aria-label="Track Order"
            >
              <MapPin className="h-5 w-5" />
              <span className="text-[10px] font-semibold mt-0.5">Track Order</span>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className={`flex flex-col items-center text-[#0D2137] hover:text-[#1B9AE4] transition-colors p-1 relative ${
                cartAnimate ? "animate-pop" : ""
              }`}
              aria-label="Cart"
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#1B9AE4] text-white text-[9px] font-extrabold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 shadow-sm">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold mt-0.5">Cart</span>
            </Link>
          </div>
        </div>

        {/* Row 2: Category Nav (desktop only) */}
        <nav className="hidden md:block border-t border-[#DDE8F0] bg-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center space-x-1 h-10">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);

              if (link.children) {
                return (
                  <div key={link.label} ref={seafoodRef} className="relative">
                    <button
                      onClick={() => setSeafoodOpen(!seafoodOpen)}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        active
                          ? "text-[#1B9AE4] bg-[#EAF5FE]"
                          : "text-[#0D2137] hover:text-[#1B9AE4] hover:bg-[#F0F7FF]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{link.label}</span>
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${seafoodOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {seafoodOpen && (
                      <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-[#DDE8F0] rounded-xl shadow-lg py-1.5 z-50 animate-fade-in">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setSeafoodOpen(false)}
                            className="block px-4 py-2 text-xs font-medium text-[#0D2137] hover:text-[#1B9AE4] hover:bg-[#F0F7FF] transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    active
                      ? "text-[#1B9AE4] bg-[#EAF5FE] border-b-2 border-[#1B9AE4]"
                      : "text-[#0D2137] hover:text-[#1B9AE4] hover:bg-[#F0F7FF]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile Search Overlay */}
        {searchOpen && (
          <div className="md:hidden px-4 pb-3 border-t border-[#DDE8F0] pt-2 bg-white animate-fade-in">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fish, seafood, vegetables..."
                className="w-full pl-4 pr-12 py-2.5 bg-[#F0F7FF] border border-[#DDE8F0] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1B9AE4]"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 h-8 w-8 bg-[#1B9AE4] text-white rounded-full flex items-center justify-center"
                aria-label="Search"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#DDE8F0] px-2 py-1 flex justify-around items-center shadow-lg">
        <Link
          href="/"
          className={`flex flex-col items-center p-1.5 ${
            pathname === "/" ? "text-[#1B9AE4]" : "text-[#0D2137]/60"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[9px] font-bold mt-0.5">Home</span>
        </Link>

        <Link
          href="/shop"
          className={`flex flex-col items-center p-1.5 ${
            pathname === "/shop" ? "text-[#1B9AE4]" : "text-[#0D2137]/60"
          }`}
        >
          <Store className="h-5 w-5" />
          <span className="text-[9px] font-bold mt-0.5">Shop</span>
        </Link>

        <Link
          href="/shop?deals=true"
          className={`flex flex-col items-center p-1.5 ${
            pathname.includes("deals") ? "text-[#FF5722]" : "text-[#0D2137]/60"
          }`}
        >
          <Tag className="h-5 w-5" />
          <span className="text-[9px] font-bold mt-0.5">Offers</span>
        </Link>

        <Link
          href="/cart"
          className={`relative flex flex-col items-center p-1.5 ${
            pathname === "/cart" ? "text-[#1B9AE4]" : "text-[#0D2137]/60"
          }`}
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {totalCartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#1B9AE4] text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {totalCartCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold mt-0.5">Cart</span>
        </Link>

        <a
          href="https://wa.me/94771234567"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center p-1.5 text-[#25D366]"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[9px] font-bold mt-0.5">WhatsApp</span>
        </a>
      </nav>
    </>
  );
}
