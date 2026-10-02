import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-ice flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-sea-ink text-white hidden md:flex flex-col border-r border-sand/20">
        <div className="p-6 border-b border-sand/10">
          <Link href="/admin" className="font-serif text-2xl font-bold text-sea-glass">
            Freshy<span className="text-coral">.lk</span>
          </Link>
          <div className="text-xs text-sand/60 mt-1">Admin Portal</div>
        </div>

        <nav className="flex-1 p-4 space-y-1 text-sm font-medium">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sand/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span>📊</span> Dashboard
          </Link>
          <Link
            href="/admin/prices"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white font-bold bg-tide/80 hover:bg-tide transition-colors shadow-sm"
          >
            <span>🏷️</span> Today&apos;s Prices & Stock
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sand/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span>📦</span> Orders
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sand/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span>🐟</span> Products & Packs
          </Link>
          <Link
            href="/admin/categories"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sand/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span>📁</span> Categories
          </Link>
          {admin.role === "OWNER" && (
            <Link
              href="/admin/audit"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sand/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span>📜</span> Audit Log
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-sand/10 text-xs text-sand/70">
          <div className="font-semibold text-white truncate">{admin.name}</div>
          <div className="text-tide uppercase text-[10px] tracking-wider mt-0.5">{admin.role}</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <header className="bg-white border-b border-sand px-6 py-4 flex items-center justify-between md:hidden">
          <Link href="/admin" className="font-serif text-xl font-bold text-sea-ink">
            Freshy<span className="text-coral">.lk</span> Admin
          </Link>
          <span className="text-xs bg-tide/10 text-tide font-bold px-2.5 py-1 rounded-full uppercase">
            {admin.role}
          </span>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 flex-1">{children}</div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-sea-ink border-t border-sand/20 flex justify-around p-2 text-white text-center text-xs md:hidden z-40">
        <Link href="/admin" className="p-1 flex flex-col items-center">
          <span className="text-lg">📊</span>
          <span className="text-[10px]">Dashboard</span>
        </Link>
        <Link href="/admin/prices" className="p-1 flex flex-col items-center text-coral font-bold">
          <span className="text-lg">🏷️</span>
          <span className="text-[10px]">Prices</span>
        </Link>
        <Link href="/admin/orders" className="p-1 flex flex-col items-center">
          <span className="text-lg">📦</span>
          <span className="text-[10px]">Orders</span>
        </Link>
        <Link href="/admin/products" className="p-1 flex flex-col items-center">
          <span className="text-lg">🐟</span>
          <span className="text-[10px]">Products</span>
        </Link>
      </nav>
    </div>
  );
}
