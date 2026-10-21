"use client";

import { useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import {
  FileText,
  Search,
  ExternalLink,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export interface InvoiceRow {
  id: string;
  invoiceNo: string;
  orderId: string;
  issuedAt: string | Date;
  order: {
    id: string;
    orderNo: string;
    customerName: string;
    phone: string;
    city: string;
    totalCents: number;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
  };
}

export default function InvoicesClient({ initialInvoices }: { initialInvoices: InvoiceRow[] }) {
  const [invoices] = useState<InvoiceRow[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNo.toLowerCase().includes(q) ||
      inv.order.orderNo.toLowerCase().includes(q) ||
      inv.order.customerName.toLowerCase().includes(q) ||
      inv.order.phone.includes(q)
    );
  });

  const totalRevenueCents = invoices.reduce((sum, inv) => sum + inv.order.totalCents, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Invoices
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6E73] mt-1">
            Browse and download customer invoices, track payment status, and export PDF receipts.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-black/[0.06] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">
            <span>Total Invoices</span>
            <FileText className="w-4 h-4 text-[#1E88E5]" />
          </div>
          <div className="text-2xl font-bold text-[#1D1D1F] tabular-nums">{invoices.length}</div>
        </div>

        <div className="bg-white border border-black/[0.06] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">
            <span>Invoiced Value</span>
            <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
          </div>
          <div className="text-2xl font-bold text-[#1D1D1F] tabular-nums">
            {formatMoney(totalRevenueCents)}
          </div>
        </div>

        <div className="bg-white border border-black/[0.06] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">
            <span>Paid Invoices</span>
            <Clock className="w-4 h-4 text-[#B26A00]" />
          </div>
          <div className="text-2xl font-bold text-[#1D1D1F] tabular-nums">
            {invoices.filter((i) => i.order.paymentStatus === "PAID").length}
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-black/[0.06] shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Invoice #, Order #, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F5F5F7] border border-black/[0.06] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 focus:bg-white font-medium"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-black/[0.06] rounded-2xl shadow-xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText className="w-10 h-10 text-[#6E6E73]/40 mx-auto" />
            <div className="font-semibold text-[#1D1D1F]">No invoices found</div>
            <p className="text-xs text-[#6E6E73] max-w-sm mx-auto">
              Invoices are automatically generated when customer orders are marked as PAID or verified.
            </p>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E88E5] text-white text-xs font-semibold rounded-xl hover:bg-[#1565C0] transition-colors"
            >
              <span>View Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#F5F5F7] text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Issued Date</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F5F5F7]/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1E88E5]">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/orders/${inv.order.id}`}
                        className="font-mono text-xs font-semibold text-[#1D1D1F] hover:text-[#1E88E5] flex items-center gap-1"
                      >
                        <span>{inv.order.orderNo}</span>
                        <ChevronRight className="w-3 h-3 text-[#6E6E73]" />
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1D1D1F] text-xs">{inv.order.customerName}</div>
                      <div className="text-[11px] text-[#6E6E73] font-mono">{inv.order.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1D1D1F]">
                      {formatMoney(inv.order.totalCents)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#6E6E73]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-black/30" />
                        <span>
                          {new Date(inv.issuedAt).toLocaleDateString("en-LK", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.order.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {inv.order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/api/invoices/${encodeURIComponent(inv.invoiceNo)}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View HTML Invoice"
                          className="p-1.5 hover:bg-black/[0.06] rounded-lg text-[#1E88E5] font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </a>
                        <a
                          href={`/api/invoices/${encodeURIComponent(inv.invoiceNo)}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          title="Download PDF"
                          className="p-1.5 hover:bg-black/[0.06] rounded-lg text-[#2E7D32] font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">PDF</span>
                        </a>
                      </div>
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
