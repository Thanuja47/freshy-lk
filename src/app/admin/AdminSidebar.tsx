"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  ShoppingBag,
  Fish,
  Folder,
  Truck,
  FileText,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

export interface AdminUserProps {
  name: string;
  email: string;
  role: string;
}

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/prices", label: "Today's Prices & Stock", icon: Tag },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products & Packs", icon: Fish },
  { href: "/admin/categories", label: "Categories", icon: Folder },
  { href: "/admin/zones", label: "Delivery Zones", icon: Truck },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText, ownerOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ user }: { user: AdminUserProps }) {
  // Use pathname from next/navigation
  const pathname = usePathname() || "/admin";
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    window.location.href = "/admin/login";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isNavActive = (itemHref: string) => {
    if (itemHref === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(itemHref);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-[260px] bg-white/80 backdrop-blur-md border-r border-black/[0.06] hidden md:flex flex-col h-screen sticky top-0 z-30 select-none">
        {/* Logo Header */}
        <div className="px-6 py-5 border-b border-black/[0.04]">
          <Link href="/admin" className="flex items-center gap-2 group">
            <span className="font-semibold text-xl tracking-tight text-[#1D1D1F] font-sans">
              Freshy<span className="text-[#1E88E5]">.lk</span>
            </span>
            <span className="text-[11px] font-medium text-[#6E6E73] bg-black/[0.04] px-2 py-0.5 rounded-full">
              Admin
            </span>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            if (item.ownerOnly && user.role !== "OWNER") return null;
            const active = isNavActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 ${
                  active
                    ? "bg-[#1E88E5]/10 text-[#1E88E5] font-semibold"
                    : "text-[#1D1D1F]/80 hover:text-[#1D1D1F] hover:bg-black/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-[18px] h-[18px] stroke-[1.75] ${
                      active ? "text-[#1E88E5]" : "text-[#6E6E73]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1E88E5]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Block & Bottom Padding to clear Dev Overlay */}
        <div className="p-4 border-t border-black/[0.06] bg-white/50 space-y-3 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#1E88E5]/10 text-[#1E88E5] flex items-center justify-center font-semibold text-xs border border-[#1E88E5]/20 flex-shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-[#1D1D1F] truncate">
                  {user.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-semibold tracking-wider text-[#6E6E73] uppercase bg-black/[0.05] px-1.5 py-0.2 rounded">
                    {user.role}
                  </span>
                  <span className="text-[10px] font-medium text-[#2E7D32] bg-[#2E7D32]/10 px-1.5 py-0.2 rounded">
                    Demo
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 text-[#6E6E73] hover:text-[#C62828] hover:bg-[#C62828]/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-black/[0.06] px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-1.5 font-semibold text-lg text-[#1D1D1F]">
          Freshy<span className="text-[#1E88E5]">.lk</span>
          <span className="text-[10px] text-[#6E6E73] bg-black/[0.05] px-2 py-0.5 rounded-full">
            Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-[#1D1D1F] hover:bg-black/[0.05] rounded-xl transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-white">
          <div className="p-4 border-b border-black/[0.06] flex items-center justify-between bg-white/90 backdrop-blur-md">
            <span className="font-semibold text-lg text-[#1D1D1F]">
              Freshy<span className="text-[#1E88E5]">.lk</span> Admin
            </span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-2 text-[#1D1D1F] hover:bg-black/[0.05] rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              if (item.ownerOnly && user.role !== "OWNER") return null;
              const active = isNavActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between p-3.5 rounded-xl text-base font-medium transition-colors ${
                    active
                      ? "bg-[#1E88E5]/10 text-[#1E88E5] font-semibold"
                      : "text-[#1D1D1F] hover:bg-black/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${active ? "text-[#1E88E5]" : "text-[#6E6E73]"}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#6E6E73]" />
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-black/[0.06] bg-[#F5F5F7] space-y-3 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1E88E5] text-white flex items-center justify-center font-semibold text-sm">
                  {getInitials(user.name)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1D1D1F]">{user.name}</div>
                  <div className="text-xs text-[#6E6E73]">{user.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 text-xs font-semibold text-[#C62828] bg-[#C62828]/10 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar (for 4 main items) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-black/[0.08] flex items-center justify-around py-2 px-1 z-30">
        {[
          { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
          { href: "/admin/prices", label: "Prices", icon: Tag },
          { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
          { href: "/admin/products", label: "Products", icon: Fish },
        ].map((tab) => {
          const active = isNavActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                active ? "text-[#1E88E5]" : "text-[#6E6E73]"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
