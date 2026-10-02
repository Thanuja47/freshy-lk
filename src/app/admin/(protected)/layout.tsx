import Link from "next/link";
import { LayoutDashboard, Tag, ShoppingCart, Package, MapPin, Settings, FileText, Shield, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-100 font-sans text-gray-900">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 bg-[#0B1F2A] text-white flex-col justify-between p-4 flex-shrink-0">
        <div>
          <div className="flex items-center space-x-2 font-serif text-xl font-bold mb-8 px-2">
            <span className="text-[#FF6A4D]">Freshy.lk</span>
            <span className="text-xs bg-[#1F6F78] px-2 py-0.5 rounded text-white font-sans font-normal">
              Admin
            </span>
          </div>

          <nav className="space-y-1">
            <Link href="/admin" className="flex items-center space-x-3 px-3 py-2.5 rounded-md hover:bg-[#1F6F78] text-sm font-medium">
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link href="/admin/prices" className="flex items-center space-x-3 px-3 py-2.5 rounded-md hover:bg-[#1F6F78] text-sm font-medium bg-[#1F6F78]/50">
              <Tag className="h-5 w-5 text-[#FF6A4D]" />
              <span className="font-semibold">Today&apos;s Prices</span>
            </Link>
            <Link href="/admin/orders" className="flex items-center space-x-3 px-3 py-2.5 rounded-md hover:bg-[#1F6F78] text-sm font-medium">
              <ShoppingCart className="h-5 w-5" />
              <span>Orders</span>
            </Link>
            <Link href="/admin/products" className="flex items-center space-x-3 px-3 py-2.5 rounded-md hover:bg-[#1F6F78] text-sm font-medium">
              <Package className="h-5 w-5" />
              <span>Products</span>
            </Link>
            <Link href="/admin/zones" className="flex items-center space-x-3 px-3 py-2.5 rounded-md hover:bg-[#1F6F78] text-sm font-medium">
              <MapPin className="h-5 w-5" />
              <span>Zones & Fees</span>
            </Link>
            <Link href="/admin/enquiries" className="flex items-center space-x-3 px-3 py-2.5 rounded-md hover:bg-[#1F6F78] text-sm font-medium">
              <FileText className="h-5 w-5" />
              <span>Wholesale</span>
            </Link>
            <Link href="/admin/settings" className="flex items-center space-x-3 px-3 py-2.5 rounded-md hover:bg-[#1F6F78] text-sm font-medium">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
            <Link href="/admin/audit" className="flex items-center space-x-3 px-3 py-2.5 rounded-md hover:bg-[#1F6F78] text-sm font-medium">
              <Shield className="h-5 w-5" />
              <span>Audit Logs</span>
            </Link>
          </nav>
        </div>

        <div className="border-t border-gray-700 pt-4 px-2 flex items-center justify-between text-xs text-gray-400">
          <div>
            <p className="font-semibold text-white">Staff Member</p>
            <p>staff@freshy.lk</p>
          </div>
          <button className="p-1 hover:text-white" title="Sign Out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 pb-16 md:pb-0">
        <header className="bg-white border-b border-gray-200 h-14 px-6 flex items-center justify-between md:hidden">
          <span className="font-serif font-bold text-lg text-[#0B1F2A]">Freshy.lk Admin</span>
          <span className="text-xs bg-[#FF6A4D] text-white px-2 py-0.5 rounded font-semibold">Mobile</span>
        </header>
        <main className="p-4 md:p-8 flex-grow">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B1F2A] text-white h-16 border-t border-[#1F6F78] flex items-center justify-around z-50">
        <Link href="/admin" className="flex flex-col items-center py-1 text-xs">
          <LayoutDashboard className="h-5 w-5" />
          <span>Home</span>
        </Link>
        <Link href="/admin/prices" className="flex flex-col items-center py-1 text-xs text-[#FF6A4D]">
          <Tag className="h-5 w-5" />
          <span className="font-bold">Prices</span>
        </Link>
        <Link href="/admin/orders" className="flex flex-col items-center py-1 text-xs">
          <ShoppingCart className="h-5 w-5" />
          <span>Orders</span>
        </Link>
        <Link href="/admin/products" className="flex flex-col items-center py-1 text-xs">
          <Package className="h-5 w-5" />
          <span>Products</span>
        </Link>
        <Link href="/admin/settings" className="flex flex-col items-center py-1 text-xs">
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}
