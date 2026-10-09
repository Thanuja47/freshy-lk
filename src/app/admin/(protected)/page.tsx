import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getLowStockThresholdGrams } from "@/lib/settings";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  Clock,
  TrendingUp,
  ShoppingBag,
  FileCheck,
  Tag,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  PackageCheck,
  Truck,
  CheckCheck,
  HelpCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const now = new Date();

  // Greeting based on Sri Lanka hour
  const colomboHour = parseInt(
    now.toLocaleTimeString("en-US", { timeZone: "Asia/Colombo", hour12: false, hour: "numeric" }),
    10
  );
  let greeting = "Good morning";
  if (colomboHour >= 12 && colomboHour < 17) greeting = "Good afternoon";
  else if (colomboHour >= 17) greeting = "Good evening";

  const formattedDate = now.toLocaleDateString("en-LK", {
    timeZone: "Asia/Colombo",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lowStockThresholdGrams = await getLowStockThresholdGrams();

  // Queries
  let todayRevenueCents = 0;
  let todayOrdersCount = 0;
  let bankSlipsPendingCount = 0;
  let staleProductsCount = 0;
  let staleProductsList: { id: string; name: string }[] = [];
  let lowStockProducts: { id: string; name: string; stockGrams: number }[] = [];
  let pendingOrders: { id: string; orderNo: string; customerName: string; totalCents: number; createdAt: Date }[] = [];
  let recentOrders: Array<{
    id: string;
    orderNo: string;
    customerName: string;
    district: string;
    totalCents: number;
    status: string;
    createdAt: Date;
  }> = [];

  let statusPipelineCounts = {
    pending: 0,
    processing: 0,
    dispatched: 0,
    delivered: 0,
  };

  try {
    const [
      revenueResult,
      ordersTodayCount,
      slipsCount,
      staleProducts,
      lowStock,
      pipelinePlaced,
      pipelineConfirmed,
      pipelinePacked,
      pipelineDispatched,
      pipelineDelivered,
      pendingList,
      recentList,
    ] = await Promise.all([
      db.order.aggregate({
        where: { createdAt: { gte: startOfDay }, paymentStatus: "PAID" },
        _sum: { totalCents: true },
      }),
      db.order.count({ where: { createdAt: { gte: startOfDay } } }),
      db.bankSlip.count({ where: { status: "PENDING" } }),
      db.product.findMany({
        where: { isActive: true, priceUpdatedAt: { lt: startOfDay } },
        select: { id: true, name: true },
        take: 10,
      }),
      db.product.findMany({
        where: { trackStock: true, stockGrams: { lte: lowStockThresholdGrams } },
        select: { id: true, name: true, stockGrams: true },
        take: 10,
      }),
      db.order.count({ where: { status: "PENDING_PAYMENT" } }),
      db.order.count({ where: { status: { in: ["PLACED", "CONFIRMED"] } } }),
      db.order.count({ where: { status: "PACKED" } }),
      db.order.count({ where: { status: "DISPATCHED" } }),
      db.order.count({ where: { status: "DELIVERED" } }),
      db.order.findMany({
        where: { status: "PENDING_PAYMENT" },
        select: { id: true, orderNo: true, customerName: true, totalCents: true, createdAt: true },
        take: 5,
        orderBy: { createdAt: "asc" },
      }),
      db.order.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNo: true,
          customerName: true,
          district: true,
          totalCents: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    todayRevenueCents = revenueResult._sum.totalCents || 0;
    todayOrdersCount = ordersTodayCount;
    bankSlipsPendingCount = slipsCount;
    staleProductsCount = staleProducts.length;
    staleProductsList = staleProducts;
    lowStockProducts = lowStock;
    pendingOrders = pendingList;
    recentOrders = recentList;

    statusPipelineCounts = {
      pending: pipelinePlaced,
      processing: pipelineConfirmed + pipelinePacked,
      dispatched: pipelineDispatched,
      delivered: pipelineDelivered,
    };
  } catch (err) {
    if (process.env.DEMO_MODE !== "true") {
      throw err;
    }
    console.warn("DB query fallback in AdminDashboardPage:", err);
  }

  // Calculate cutoff countdown display
  const cutoffTimeStr = "12:00 PM";

  // Build Needs Attention Items List
  const needsAttentionItems: Array<{
    id: string;
    type: "BANK_SLIP" | "PENDING_ORDER" | "LOW_STOCK" | "STALE_PRICE";
    title: string;
    subtitle: string;
    actionLabel: string;
    actionHref: string;
    badgeColor: string;
  }> = [];

  if (bankSlipsPendingCount > 0) {
    needsAttentionItems.push({
      id: "slips-alert",
      type: "BANK_SLIP",
      title: `${bankSlipsPendingCount} Bank Payment Slips Awaiting Review`,
      subtitle: "Customers have uploaded payment receipts that need verification",
      actionLabel: "Verify Slips",
      actionHref: "/admin/orders?paymentStatus=PENDING_REVIEW",
      badgeColor: "bg-[#B26A00]/10 text-[#B26A00]",
    });
  }

  if (staleProductsCount > 0) {
    needsAttentionItems.push({
      id: "stale-prices-alert",
      type: "STALE_PRICE",
      title: `${staleProductsCount} Products Missing Today's Daily Price`,
      subtitle: "Catch rates per kg must be updated daily before opening orders",
      actionLabel: "Update Prices",
      actionHref: "/admin/prices",
      badgeColor: "bg-[#B26A00]/10 text-[#B26A00]",
    });
  }

  lowStockProducts.forEach((p) => {
    needsAttentionItems.push({
      id: `stock-${p.id}`,
      type: "LOW_STOCK",
      title: `Low Stock: ${p.name}`,
      subtitle: `Only ${(p.stockGrams / 1000).toFixed(1)} kg remaining (Threshold: ${(lowStockThresholdGrams / 1000).toFixed(1)} kg)`,
      actionLabel: "Adjust Stock",
      actionHref: `/admin/prices?search=${encodeURIComponent(p.name)}`,
      badgeColor: "bg-[#C62828]/10 text-[#C62828]",
    });
  });

  pendingOrders.forEach((o) => {
    needsAttentionItems.push({
      id: `pending-${o.id}`,
      type: "PENDING_ORDER",
      title: `Pending Payment: ${o.orderNo} (${o.customerName})`,
      subtitle: `Total: ${formatMoney(o.totalCents)} — Placed ${new Date(o.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
      actionLabel: "View Order",
      actionHref: `/admin/orders/${o.id}`,
      badgeColor: "bg-[#1E88E5]/10 text-[#1E88E5]",
    });
  });

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Header with Cut-off Countdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            {greeting}, Admin
          </h1>
          <p className="text-[13px] text-[#6E6E73] mt-1">{formattedDate}</p>
        </div>

        {/* Cutoff Pill */}
        <div className="inline-flex items-center gap-2.5 bg-white border border-black/[0.06] px-4 py-2 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] self-start md:self-auto">
          <Clock className="w-4 h-4 text-[#1E88E5]" />
          <span className="text-xs font-medium text-[#1D1D1F]">
            Next Delivery Cut-off: <strong className="font-semibold text-[#1E88E5]">{cutoffTimeStr}</strong>
          </span>
        </div>
      </div>

      {/* 2. Stat Row Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-white border border-black/[0.06] p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wider">
              Today&apos;s Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] tabular-nums tracking-tight">
            {formatMoney(todayRevenueCents)}
          </div>
          <div className="text-xs text-[#6E6E73]">
            From paid orders today
          </div>
        </div>

        {/* Orders Today Card */}
        <div className="bg-white border border-black/[0.06] p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wider">
              Orders Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#1E88E5]/10 text-[#1E88E5] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] tabular-nums tracking-tight">
            {todayOrdersCount}
          </div>
          <div className="text-xs text-[#6E6E73]">
            Placed since midnight
          </div>
        </div>

        {/* Bank Slips Review Card */}
        <div className="bg-white border border-black/[0.06] p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wider">
              Bank Slips Pending
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#B26A00]/10 text-[#B26A00] flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] tabular-nums tracking-tight">
            {bankSlipsPendingCount}
          </div>
          <div className="text-xs text-[#6E6E73]">
            Awaiting manual verification
          </div>
        </div>

        {/* Price Status Card */}
        <div className="bg-white border border-black/[0.06] p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wider">
              Daily Price Status
            </span>
            <div className="w-8 h-8 rounded-xl bg-black/[0.04] text-[#1D1D1F] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-semibold text-[#1D1D1F]">
              {staleProductsCount === 0 ? (
                <span className="text-[#2E7D32] flex items-center gap-1.5 text-lg">
                  <CheckCircle2 className="w-5 h-5" /> All Fresh
                </span>
              ) : (
                <span className="text-[#B26A00] text-lg font-semibold">
                  {staleProductsCount} Stale
                </span>
              )}
            </div>
            <Link
              href="/admin/prices"
              className="text-xs font-semibold text-[#1E88E5] hover:underline inline-flex items-center gap-0.5"
            >
              Update <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="text-xs text-[#6E6E73]">
            {staleProductsCount === 0 ? "Daily rates updated today" : "Needs catch rate update"}
          </div>
        </div>
      </div>

      {/* 3. Orders Status Pipeline */}
      <div className="bg-white border border-black/[0.06] p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <h2 className="text-base font-semibold text-[#1D1D1F]">
            Order Fulfillment Pipeline
          </h2>
          <Link href="/admin/orders" className="text-xs font-semibold text-[#1E88E5] hover:underline">
            View All Orders →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/orders?status=PENDING_PAYMENT"
            className="p-4 bg-[#F5F5F7]/80 hover:bg-[#F5F5F7] border border-black/[0.04] rounded-xl transition-all group"
          >
            <div className="text-xs font-medium text-[#6E6E73] flex items-center justify-between">
              <span>Pending Payment</span>
              <Clock className="w-4 h-4 text-[#6E6E73] group-hover:text-[#1E88E5] transition-colors" />
            </div>
            <div className="text-2xl font-semibold text-[#1D1D1F] mt-2 tabular-nums">
              {statusPipelineCounts.pending}
            </div>
          </Link>

          <Link
            href="/admin/orders?status=CONFIRMED"
            className="p-4 bg-[#F5F5F7]/80 hover:bg-[#F5F5F7] border border-black/[0.04] rounded-xl transition-all group"
          >
            <div className="text-xs font-medium text-[#6E6E73] flex items-center justify-between">
              <span>Processing</span>
              <PackageCheck className="w-4 h-4 text-[#6E6E73] group-hover:text-[#1E88E5] transition-colors" />
            </div>
            <div className="text-2xl font-semibold text-[#1D1D1F] mt-2 tabular-nums">
              {statusPipelineCounts.processing}
            </div>
          </Link>

          <Link
            href="/admin/orders?status=DISPATCHED"
            className="p-4 bg-[#F5F5F7]/80 hover:bg-[#F5F5F7] border border-black/[0.04] rounded-xl transition-all group"
          >
            <div className="text-xs font-medium text-[#6E6E73] flex items-center justify-between">
              <span>Out for Delivery</span>
              <Truck className="w-4 h-4 text-[#6E6E73] group-hover:text-[#1E88E5] transition-colors" />
            </div>
            <div className="text-2xl font-semibold text-[#1D1D1F] mt-2 tabular-nums">
              {statusPipelineCounts.dispatched}
            </div>
          </Link>

          <Link
            href="/admin/orders?status=DELIVERED"
            className="p-4 bg-[#F5F5F7]/80 hover:bg-[#F5F5F7] border border-black/[0.04] rounded-xl transition-all group"
          >
            <div className="text-xs font-medium text-[#6E6E73] flex items-center justify-between">
              <span>Delivered</span>
              <CheckCheck className="w-4 h-4 text-[#6E6E73] group-hover:text-[#2E7D32] transition-colors" />
            </div>
            <div className="text-2xl font-semibold text-[#1D1D1F] mt-2 tabular-nums">
              {statusPipelineCounts.delivered}
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Needs Attention Section */}
      <div className="bg-white border border-black/[0.06] p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#B26A00]" />
            <h2 className="text-base font-semibold text-[#1D1D1F]">
              Needs Attention ({needsAttentionItems.length})
            </h2>
          </div>
        </div>

        {needsAttentionItems.length === 0 ? (
          /* Designed Empty State */
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1D1D1F]">
                Everything is Up to Date
              </div>
              <p className="text-xs text-[#6E6E73] mt-0.5 max-w-sm mx-auto">
                No pending bank slips, unupdated prices, or low-stock alerts require action right now.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {needsAttentionItems.map((item) => (
              <div
                key={item.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#1D1D1F]">
                      {item.title}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${item.badgeColor}`}
                    >
                      {item.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-[#6E6E73]">{item.subtitle}</p>
                </div>
                <Link
                  href={item.actionHref}
                  className="px-3.5 py-1.5 bg-[#F5F5F7] hover:bg-black/[0.06] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-all self-start sm:self-auto inline-flex items-center gap-1.5"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Recent Orders Table */}
      <div className="bg-white border border-black/[0.06] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <h2 className="text-base font-semibold text-[#1D1D1F]">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs font-semibold text-[#1E88E5] hover:underline">
            Manage Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          /* Designed Empty State */
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-black/[0.04] text-[#6E6E73] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1D1D1F]">No Orders Placed Yet</div>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                New orders placed on the storefront will appear here instantly.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73]">
                  <th className="py-2.5 px-3">Order No</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] text-[13px]">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-[#1E88E5]">
                      <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                        {o.orderNo}
                      </Link>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#1D1D1F]">
                      {o.customerName}
                    </td>
                    <td className="py-3 px-3 text-[#6E6E73]">{o.district}</td>
                    <td className="py-3 px-3 font-semibold tabular-nums text-[#1D1D1F]">
                      {formatMoney(o.totalCents)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          o.status === "DELIVERED"
                            ? "bg-[#2E7D32]/10 text-[#2E7D32]"
                            : o.status === "DISPATCHED"
                            ? "bg-[#1E88E5]/10 text-[#1E88E5]"
                            : o.status === "PACKED"
                            ? "bg-purple-100 text-purple-800"
                            : o.status === "CONFIRMED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-[#B26A00]/10 text-[#B26A00]"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[o.status] || o.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-[#6E6E73] text-xs">
                      {new Date(o.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
