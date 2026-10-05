"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart";
import {
  Search,
  ShoppingCart,
  MapPin,
  Home,
  Fish,
  Apple,
  Leaf,
  Tag,
  Mail,
  X,
  ChevronDown,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Home",       href: "/",          icon: Home,   exact: true },
  { label: "Seafood",    href: "/shop?cat=seafood", icon: Fish, dropdown: true },
  { label: "Fish",       href: "/shop?cat=fish",    icon: Fish  },
  { label: "Fruits",     href: "/shop?cat=fruits",  icon: Apple },
  { label: "Vegetables", href: "/shop?cat=vegetables", icon: Leaf },
  { label: "Offers",     href: "/shop?offers=1",    icon: Tag   },
  { label: "Contact",    href: "/contact",           icon: Mail  },
];

export default function Header() {
  const pathname = usePathname();
  const router   = useRouter();

  const [searchQuery,  setSearchQuery]  = useState("");
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [cartAnimate,  setCartAnimate]  = useState(false);

  const items          = useCartStore((s) => s.items);
  const totalCartCount = items.reduce((n, i) => n + i.quantity, 0);
  const searchRef      = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const isActive = (item: (typeof NAV_ITEMS)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href.split("?")[0]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        {/* ── Row 1: Logo | Search | Track + Cart ── */}
        <div className="border-b border-[#DDE8F0]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0" aria-label="Freshy.lk home">
              <Image
                src="/brand/logo.svg"
                alt="Freshy.lk"
                width={180}
                height={48}
                priority
                className="h-11 w-auto"
              />
            </Link>

            {/* Search bar — desktop */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex flex-1 max-w-xl items-center bg-[#F0F7FF] border border-[#DDE8F0] rounded-full overflow-hidden focus-within:border-[#1B9AE4] focus-within:ring-2 focus-within:ring-[#1B9AE4]/20 transition"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for fresh fish, fruits, vegetables..."
                className="flex-1 bg-transparent px-5 py-2.5 text-sm text-[#0D2137] placeholder:text-gray-400 focus:outline-none"
                aria-label="Search products"
              />
              <button
                type="submit"
                className="m-1 w-10 h-10 rounded-full bg-[#1B9AE4] hover:bg-[#1478BB] text-white flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="Submit search"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-2 sm:gap-4">
              {/* Track order — desktop */}
              <Link
                href="/track"
                className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-[#0D2137] hover:text-[#1B9AE4] transition-colors whitespace-nowrap"
              >
                <MapPin className="h-4 w-4" />
                Track order
              </Link>

              {/* Search icon — mobile */}
              <button
                onClick={() => setSearchOpen((o) => !o)}
                className="md:hidden p-2 rounded-full text-[#0D2137] hover:bg-[#F0F7FF] transition"
                aria-label="Search"
              >
                {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2 rounded-full text-[#0D2137] hover:bg-[#F0F7FF] transition"
                aria-label={`Cart, ${totalCartCount} items`}
              >
                <ShoppingCart className="h-5 w-5" />
                {totalCartCount > 0 && (
                  <span
                    className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#1B9AE4] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white ${
                      cartAnimate ? "animate-pop" : ""
                    }`}
                  >
                    {totalCartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile search expand */}
          {searchOpen && (
            <div className="md:hidden px-4 pb-3 animate-fade-up">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center bg-[#F0F7FF] border border-[#DDE8F0] rounded-full overflow-hidden focus-within:border-[#1B9AE4]"
              >
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for fresh fish, fruits, vegetables..."
                  className="flex-1 bg-transparent px-4 py-2.5 text-sm text-[#0D2137] placeholder:text-gray-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="m-1 w-9 h-9 rounded-full bg-[#1B9AE4] text-white flex items-center justify-center flex-shrink-0"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── Row 2: Category nav — desktop only ── */}
        <nav
          className="hidden md:block border-b border-[#DDE8F0] bg-white"
          aria-label="Category navigation"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center gap-1 h-11 overflow-x-auto scrollbar-none">
            {NAV_ITEMS.map((item) => {
              const Icon    = item.icon;
              const active  = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-3 h-full text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                    active
                      ? "border-[#1B9AE4] text-[#1B9AE4]"
                      : "border-transparent text-[#0D2137] hover:text-[#1B9AE4]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.8} />
                  {item.label}
                  {item.dropdown && <ChevronDown className="h-3 w-3 opacity-50" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── Mobile: Horizontal category chips (below header) ── */}
        <div className="md:hidden flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-none bg-white border-b border-[#DDE8F0]">
          {NAV_ITEMS.map((item) => {
            const Icon   = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  active
                    ? "bg-[#1B9AE4] text-white"
                    : "bg-[#F0F7FF] border border-[#DDE8F0] text-[#0D2137]"
                }`}
              >
                <Icon className="h-3 w-3" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* ── Mobile Fixed Bottom Nav ── */}
      <BottomNav totalCartCount={totalCartCount} />
    </>
  );
}

function BottomNav({ totalCartCount }: { totalCartCount: number }) {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#DDE8F0] flex items-center pb-safe"
      aria-label="Bottom navigation"
    >
      {[
        { href: "/",       Icon: Home,         label: "Home",  exact: true },
        { href: "/shop",   Icon: Fish,         label: "Shop" },
        { href: "/cart",   Icon: ShoppingCart, label: "Cart",  badge: totalCartCount },
        { href: "/track",  Icon: MapPin,        label: "Track" },
        {
          href: "https://wa.me/94771234567",
          Icon: () => (
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M11.999 0C5.373 0 0 5.373 0 12c0 2.117.554 4.1 1.523 5.824L.057 23.998l6.305-1.654A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.81 9.81 0 0 1-5.002-1.366l-.359-.213-3.722.976.994-3.63-.234-.373A9.77 9.77 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182 17.43 2.182 21.818 6.57 21.818 12c0 5.43-4.388 9.818-9.819 9.818z" />
            </svg>
          ),
          label: "WhatsApp",
          external: true,
        },
      ].map(({ href, Icon, label, badge, exact, external }) => {
        const active = exact ? pathname === href : !external && pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
              active ? "text-[#1B9AE4]" : "text-gray-500"
            }`}
            aria-label={label}
          >
            <span className="relative">
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
              {badge != null && badge > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] bg-[#1B9AE4] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {badge}
                </span>
              )}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
