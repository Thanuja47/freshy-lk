// src/app/admin/(protected)/messages/MessagesClient.tsx
"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Phone,
  Mail,
  Clock,
  Search,
  CheckCircle2,
  MessageCircle,
  Trash2,
  Edit3,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { updateInquiryStatus, updateInquiryNote, deleteInquiry } from "@/actions/inquiries";
import { EnquiryStatus } from "@prisma/client";

export interface InquiryRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: EnquiryStatus;
  adminNote: string | null;
  createdAt: string;
}

export interface StatsProps {
  total: number;
  newCount: number;
  contactedCount: number;
  quotedCount: number;
  wonCount: number;
  lostCount: number;
}

const STATUS_CONFIG: Record<
  EnquiryStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  NEW: {
    label: "New",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  CONTACTED: {
    label: "Contacted",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  QUOTED: {
    label: "Quoted",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  WON: {
    label: "Resolved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  LOST: {
    label: "Archived",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

export default function MessagesClient({
  initialInquiries,
  initialStats,
}: {
  initialInquiries: InquiryRow[];
  initialStats: StatsProps;
}) {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<InquiryRow[]>(initialInquiries);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered list
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((iq) => {
      // Status filter
      if (statusFilter !== "ALL" && iq.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = iq.name.toLowerCase().includes(q);
        const matchesPhone = iq.phone.toLowerCase().includes(q);
        const matchesEmail = iq.email ? iq.email.toLowerCase().includes(q) : false;
        const matchesMsg = iq.message.toLowerCase().includes(q);
        const matchesNote = iq.adminNote ? iq.adminNote.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesMsg && !matchesNote) {
          return false;
        }
      }
      return true;
    });
  }, [inquiries, statusFilter, searchQuery]);

  // Compute live stats
  const stats = useMemo(() => {
    if (inquiries.length === 0 && initialStats.total > 0) {
      return {
        total: initialStats.total,
        newCount: initialStats.newCount,
        inProgressCount: initialStats.contactedCount + initialStats.quotedCount,
        resolvedCount: initialStats.wonCount,
      };
    }
    const s = {
      total: inquiries.length,
      newCount: 0,
      inProgressCount: 0,
      resolvedCount: 0,
    };
    for (const iq of inquiries) {
      if (iq.status === "NEW") s.newCount++;
      else if (iq.status === "CONTACTED" || iq.status === "QUOTED") s.inProgressCount++;
      else if (iq.status === "WON") s.resolvedCount++;
    }
    return s;
  }, [inquiries, initialStats]);

  // Change status
  const handleStatusChange = async (id: string, newStatus: EnquiryStatus) => {
    // Optimistic update
    setInquiries((prev) =>
      prev.map((iq) => (iq.id === id ? { ...iq, status: newStatus } : iq))
    );

    startTransition(async () => {
      const res = await updateInquiryStatus(id, newStatus);
      if (res.success) {
        showToast(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
        router.refresh();
      } else {
        showToast(res.message || "Failed to update status");
        router.refresh();
      }
    });
  };

  // Save admin note
  const handleSaveNote = async (id: string) => {
    const textToSave = noteDraft;
    setInquiries((prev) =>
      prev.map((iq) => (iq.id === id ? { ...iq, adminNote: textToSave.trim() || null } : iq))
    );
    setEditingNoteId(null);

    startTransition(async () => {
      const res = await updateInquiryNote(id, textToSave);
      if (res.success) {
        showToast("Admin note saved");
        router.refresh();
      } else {
        showToast(res.message || "Failed to save note");
        router.refresh();
      }
    });
  };

  // Delete inquiry
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete message from ${name}?`)) return;

    setInquiries((prev) => prev.filter((iq) => iq.id !== id));

    startTransition(async () => {
      const res = await deleteInquiry(id);
      if (res.success) {
        showToast("Message deleted");
        router.refresh();
      } else {
        showToast(res.message || "Failed to delete message");
        router.refresh();
      }
    });
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0D2137] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
              Inquiries & Messages
            </h1>
            {stats.newCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                {stats.newCount} New
              </span>
            )}
            {isPending && (
              <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
            )}
          </div>
          <p className="text-sm text-[#6E6E73] mt-1">
            Customer inquiries submitted through the contact page with 1-click WhatsApp and phone actions.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6E6E73]">Total Messages</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-semibold text-[#1D1D1F] tracking-tight">
            {stats.total}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-sky-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-800">New / Unread</span>
            <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-semibold text-sky-700 tracking-tight">
            {stats.newCount}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800">In Progress</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-semibold text-amber-700 tracking-tight">
            {stats.inProgressCount}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">Resolved</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-semibold text-emerald-700 tracking-tight">
            {stats.resolvedCount}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-black/[0.06] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email, or message..."
            className="w-full pl-9 pr-8 py-2 bg-[#F5F5F7] border border-transparent rounded-xl text-sm text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#1E88E5] focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: "ALL", label: "All" },
            { id: "NEW", label: "New" },
            { id: "CONTACTED", label: "Contacted" },
            { id: "QUOTED", label: "Quoted" },
            { id: "WON", label: "Resolved" },
            { id: "LOST", label: "Archived" },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-[#1D1D1F] text-white shadow-sm"
                    : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#EBEBEF]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inquiries List */}
      {filteredInquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#1D1D1F]">No messages found</h3>
          <p className="text-sm text-[#86868B] mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "ALL"
              ? "Try adjusting your search query or status filter to see other messages."
              : "When customers submit the contact form, inquiries will appear here instantly."}
          </p>
          {(searchQuery || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className="mt-4 px-4 py-2 bg-[#F5F5F7] hover:bg-[#EBEBEF] text-[#1D1D1F] text-xs font-semibold rounded-full transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredInquiries.map((iq) => {
            const statusMeta = STATUS_CONFIG[iq.status] || STATUS_CONFIG.NEW;
            const cleanPhone = iq.phone.replace(/[^0-9]/g, "");
            const waGreeting = `Hello ${iq.name}, thank you for reaching out to Freshy.lk! Regarding your message: "${iq.message.slice(0, 70)}..."`;
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waGreeting)}`;
            const isEditingNote = editingNoteId === iq.id;

            return (
              <div
                key={iq.id}
                data-testid="inquiry-card"
                className="bg-white rounded-2xl border border-black/[0.06] p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Top Row: Customer Info + Date + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-black/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#EAF4FD] text-[#0284C7] font-bold text-sm flex items-center justify-center shrink-0">
                      {iq.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-[#1D1D1F] leading-tight">
                        {iq.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#86868B] mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(iq.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown Selector */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                      {statusMeta.label}
                    </span>

                    <select
                      value={iq.status}
                      onChange={(e) => handleStatusChange(iq.id, e.target.value as EnquiryStatus)}
                      className="text-xs bg-[#F5F5F7] hover:bg-[#EBEBEF] text-[#1D1D1F] font-medium border border-transparent rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#1E88E5] cursor-pointer transition-colors"
                      aria-label="Change status"
                    >
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUOTED">Quoted</option>
                      <option value="WON">Resolved</option>
                      <option value="LOST">Archived</option>
                    </select>

                    <button
                      onClick={() => handleDelete(iq.id, iq.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-1"
                      title="Delete inquiry"
                      aria-label="Delete inquiry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Customer Contact Quick Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-3">
                  {/* Phone */}
                  <a
                    href={`tel:${iq.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F7FF] text-[#0284C7] hover:bg-[#E0EFFF] rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{iq.phone}</span>
                  </a>

                  {/* WhatsApp Quick Reply */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0] rounded-xl text-xs font-semibold transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Chat on WhatsApp</span>
                  </a>

                  {/* Email */}
                  {iq.email && (
                    <a
                      href={`mailto:${iq.email}?subject=Freshy.lk%20Customer%20Support`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F5F7] text-[#48484A] hover:bg-[#EBEBEF] rounded-xl text-xs font-medium transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#86868B]" />
                      <span>{iq.email}</span>
                    </a>
                  )}
                </div>

                {/* Customer Message Box */}
                <div className="mt-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
                  {iq.message}
                </div>

                {/* Admin Note Section */}
                <div className="mt-3 pt-3 border-t border-black/[0.04]">
                  {isEditingNote ? (
                    <div className="space-y-2">
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add internal note (e.g. customer called, arranged 4kg seer fish for Friday)..."
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1E88E5] text-[#1D1D1F] min-h-[60px]"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="px-2.5 py-1 text-xs text-[#6E6E73] hover:text-[#1D1D1F]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNote(iq.id)}
                          className="px-3 py-1 bg-[#1D1D1F] text-white rounded-lg text-xs font-medium hover:bg-black flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save Note
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      {iq.adminNote ? (
                        <div className="flex items-start gap-2 text-slate-600 bg-amber-50/60 border border-amber-200/50 rounded-lg p-2 flex-1 mr-2">
                          <span className="font-semibold text-amber-800 shrink-0">Note:</span>
                          <span className="italic">{iq.adminNote}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No internal note yet.</span>
                      )}

                      <button
                        onClick={() => {
                          setEditingNoteId(iq.id);
                          setNoteDraft(iq.adminNote || "");
                        }}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-[#0284C7] font-medium py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{iq.adminNote ? "Edit Note" : "Add Note"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
