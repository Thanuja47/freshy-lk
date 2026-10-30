// src/app/admin/(protected)/orders/OrdersClient.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import useSWR from "swr";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  ShoppingBag,
  ChevronRight,
  Search,
  RefreshCw,
} from "lucide-react";
import type { OrderStatus } from "@prisma/client";

export interface OrderItemRow {
  id: string;
  orderNo: string;
  customerName: string;
  phone: string;
  city: string;
  district?: string;
  totalCents: number;
  status: OrderStatus;
  createdAt: string | Date;
  deliveryDate?: string | Date;
  zone: { name: string };
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    packLabel: string;
    prepName: string | null;
  }>;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING_PAYMENT: { bg: "bg-[#F5F5F7]", text: "text-[#6E6E73]" },
  PLACED: { bg: "bg-[#FFF3E0]", text: "text-[#B26A00]" },
  CONFIRMED: { bg: "bg-[#E3F2FD]", text: "text-[#1E88E5]" },
  PROCESSING: { bg: "bg-purple-50", text: "text-purple-700" },
  PACKED: { bg: "bg-purple-50", text: "text-purple-700" },
  DISPATCHED: { bg: "bg-indigo-50", text: "text-indigo-700" },
  DELIVERED: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-700" },
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function OrdersClient({
  initialOrders,
}: {
  initialOrders: OrderItemRow[];
}) {
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const prevOrderIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));

  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // SWR Real-time polling every 10 seconds (pauses on tab hide, revalidates on focus)
  const { data, isValidating, mutate } = useSWR<{ orders: OrderItemRow[] }>(
    "/api/admin/orders-data",
    fetcher,
    {
      fallbackData: { orders: initialOrders },
      refreshInterval: 10000,
      revalidateOnFocus: true,
      dedupingInterval: 4000,
    }
  );

  const orders = data?.orders || initialOrders;

  // Track newly arrived orders for subtle highlight
  useEffect(() => {
    if (!data?.orders) return;
    setLastRefreshedAt(new Date());
    const currentIds = new Set(data.orders.map((o) => o.id));
    const newlyAdded: string[] = [];
    for (const order of data.orders) {
      if (!prevOrderIdsRef.current.has(order.id)) {
        newlyAdded.push(order.id);
      }
    }
    if (newlyAdded.length > 0) {
      setNewOrderIds((prev) => new Set([...prev, ...newlyAdded]));
      prevOrderIdsRef.current = currentIds;
    }
  }, [data?.orders]);

  const counts = {
    all: orders.length,
    placed: orders.filter((o) => o.status === "PLACED").length,
    confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
    packed: orders.filter((o) => o.status === "PACKED").length,
    dispatched: orders.filter((o) => o.status === "DISPATCHED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    pending: orders.filter((o) => o.status === "PENDING_PAYMENT").length,
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      selectedStatus === "ALL" || o.status === selectedStatus;

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      o.orderNo.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.phone.includes(q) ||
      o.city.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header with live status & Refresh button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Orders Management
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6E73] mt-1">
            Track customer orders, review status, and dispatch deliveries in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/60 rounded-xl text-xs font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Sync</span>
            <span className="text-[11px] text-emerald-600 font-normal">
              ({lastRefreshedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })})
            </span>
          </div>

          <button
            type="button"
            onClick={() => mutate()}
            disabled={isValidating}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs font-semibold text-[#1D1D1F] hover:bg-[#F5F5F7] transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? "animate-spin text-[#1E88E5]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Clickable Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { label: "Total", key: "ALL", count: counts.all, color: "text-[#1D1D1F]" },
          { label: "Placed", key: "PLACED", count: counts.placed, color: "text-[#B26A00]" },
          { label: "Confirmed", key: "CONFIRMED", count: counts.confirmed, color: "text-[#1E88E5]" },
          { label: "Packed", key: "PACKED", count: counts.packed, color: "text-purple-700" },
          { label: "Dispatched", key: "DISPATCHED", count: counts.dispatched, color: "text-indigo-700" },
          { label: "Delivered", key: "DELIVERED", count: counts.delivered, color: "text-[#2E7D32]" },
          { label: "Pending", key: "PENDING_PAYMENT", count: counts.pending, color: "text-[#6E6E73]" },
        ].map((item) => {
          const isSelected = selectedStatus === item.key;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setSelectedStatus(item.key)}
              className={`p-3 rounded-2xl text-center border transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#1E88E5] text-white border-[#1E88E5] shadow-sm"
                  : "bg-white border-black/[0.06] hover:bg-[#F5F5F7] shadow-xs"
              }`}
            >
              <div
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isSelected ? "text-white/80" : "text-[#6E6E73]"
                }`}
              >
                {item.label}
              </div>
              <div
                className={`text-xl font-bold mt-0.5 tabular-nums ${
                  isSelected ? "text-white" : item.color
                }`}
              >
                {item.count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-black/[0.06] shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by order #, customer name, phone, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F5F5F7]/80 border border-black/[0.06] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 focus:bg-white transition-all font-medium"
          />
        </div>
        {selectedStatus !== "ALL" && (
          <button
            type="button"
            onClick={() => setSelectedStatus("ALL")}
            className="text-xs font-semibold text-[#1E88E5] hover:underline whitespace-nowrap cursor-pointer"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-black/[0.06] rounded-2xl shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-black/[0.04] text-[#6E6E73] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-semibold text-[#1D1D1F]">No Orders Found</div>
              <p className="text-xs text-[#6E6E73] mt-1 max-w-sm mx-auto">
                {selectedStatus !== "ALL"
                  ? `No orders currently match status "${selectedStatus}".`
                  : "No orders matching your search query."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] bg-[#F5F5F7]">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filteredOrders.map((order) => {
                  const style = statusColors[order.status] || { bg: "bg-gray-100", text: "text-gray-700" };
                  const isNew = newOrderIds.has(order.id);
                  const dateStr = new Date(order.createdAt).toLocaleDateString("en-LK", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        isNew
                          ? "bg-emerald-50/80 hover:bg-emerald-100/70 border-l-4 border-l-emerald-500"
                          : "hover:bg-[#F5F5F7]/50"
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1E88E5]">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                            {order.orderNo}
                          </Link>
                          {isNew && (
                            <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-600 text-white rounded-md tracking-wider animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1D1D1F]">{order.customerName}</div>
                        <div className="text-xs text-[#6E6E73]">{order.phone} • {order.city}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#1D1D1F]">
                        {order.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="truncate max-w-[200px]">
                            {item.quantity}x {item.productName} ({item.packLabel})
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-[#6E6E73] text-[11px]">
                            +{order.items.length - 2} more item(s)
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1D1D1F]">
                        {formatMoney(order.totalCents)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${style.bg} ${style.text}`}
                        >
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#6E6E73] whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="p-1.5 hover:bg-black/[0.06] rounded-lg inline-flex items-center text-[#1E88E5] font-semibold text-xs transition-colors"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
