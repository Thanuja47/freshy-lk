import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let totalProducts = 0;
  let staleProductsCount = 0;
  let lowStockProducts: { id: string; name: string; stockGrams: number }[] = [];
  let todayOrdersCount = 0;
  let todayRevenueCents = 0;

  try {
    const [
      tProducts,
      sProductsCount,
      lStock,
      tOrdersCount,
      tRevenueResult,
    ] = await Promise.all([
      db.product.count({ where: { isActive: true } }),
      db.product.count({
        where: {
          isActive: true,
          priceUpdatedAt: { lt: startOfDay },
        },
      }),
      db.product.findMany({
        where: {
          trackStock: true,
          stockGrams: { lte: 2000 },
        },
        select: { id: true, name: true, stockGrams: true },
        take: 5,
      }),
      db.order.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      db.order.aggregate({
        where: {
          createdAt: { gte: startOfDay },
          paymentStatus: "PAID",
        },
        _sum: { totalCents: true },
      }),
    ]);
    totalProducts = tProducts;
    staleProductsCount = sProductsCount;
    lowStockProducts = lStock;
    todayOrdersCount = tOrdersCount;
    todayRevenueCents = tRevenueResult._sum.totalCents || 0;
  } catch (err) {
    console.warn("DB offline or unconfigured in AdminDashboardPage fallback:", err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-sea-ink">Admin Dashboard</h1>
        <p className="text-xs text-sea-ink/70 mt-1">
          Store overview for {now.toLocaleDateString("en-LK", { dateStyle: "full" })}
        </p>
      </div>

      {/* Prominent Warning Banner if Prices Not Updated Today */}
      {staleProductsCount > 0 && (
        <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h2 className="font-serif text-lg font-bold text-amber-950">
                Daily Prices Need Attention ({staleProductsCount} items not updated today)
              </h2>
              <p className="text-xs text-amber-900 mt-0.5">
                Catch prices for today have not been updated yet. Please update daily prices per kg to keep the storefront fresh.
              </p>
            </div>
          </div>
          <Link
            href="/admin/prices"
            className="px-4 py-2.5 bg-amber-800 text-white font-bold rounded-lg hover:bg-amber-900 transition-colors text-xs whitespace-nowrap text-center shadow-sm"
          >
            Update Today&apos;s Prices Now →
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-sand p-6 rounded-xl shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-sea-ink/60">
            Today&apos;s Revenue
          </div>
          <div className="font-serif text-3xl font-bold text-coral">
            {formatMoney(todayRevenueCents)}
          </div>
          <div className="text-xs text-sea-ink/50">{todayOrdersCount} orders placed today</div>
        </div>

        <div className="bg-white border border-sand p-6 rounded-xl shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-sea-ink/60">
            Active Products
          </div>
          <div className="font-serif text-3xl font-bold text-tide">{totalProducts}</div>
          <div className="text-xs text-sea-ink/50">In store catalogue</div>
        </div>

        <div className="bg-white border border-sand p-6 rounded-xl shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-sea-ink/60">
            Price Status
          </div>
          <div className="font-serif text-3xl font-bold text-sea-ink">
            {staleProductsCount === 0 ? "✓ Fresh" : `${staleProductsCount} Stale`}
          </div>
          <div className="text-xs text-sea-ink/50">Updated for today</div>
        </div>
      </div>

      {/* Low Stock Section */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white border border-sand p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-bold text-sea-ink border-b border-sand pb-2">
            Low Stock Alerts (&lt; 2 kg remaining)
          </h3>
          <div className="divide-y divide-sand/50">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="py-2.5 flex justify-between items-center text-sm">
                <span className="font-semibold text-sea-ink">{p.name}</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-mono font-bold rounded">
                  {(p.stockGrams / 1000).toFixed(1)} kg remaining
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
