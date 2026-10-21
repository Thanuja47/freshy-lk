// src/app/admin/(protected)/categories/CategoriesClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveCategory, deleteCategory } from "@/actions/categories";
import {
  Folder,
  Package,
  Plus,
  X,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  _count: { products: number };
}

const ACCENT_COLORS = [
  { bg: "#E3F2FD", text: "#1565C0" },
  { bg: "#E8F5E9", text: "#2E7D32" },
  { bg: "#FFF3E0", text: "#B26A00" },
  { bg: "#F3E5F5", text: "#6A1B9A" },
  { bg: "#FCE4EC", text: "#880E4F" },
  { bg: "#E0F7FA", text: "#00695C" },
];

export default function CategoriesClient({
  initialCategories,
}: {
  initialCategories: CategoryItem[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategories(initialCategories);
  }, [initialCategories]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const openAddModal = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setSortOrder(categories.length);
    setActionError(null);
    setActionSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setSortOrder(cat.sortOrder);
    setActionError(null);
    setActionSuccess(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingId) {
      // Auto-generate slug
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);

    const res = await saveCategory({
      id: editingId || undefined,
      name,
      slug,
      description: description || undefined,
      sortOrder,
      isActive: true,
    });

    setIsSubmitting(false);

    if (res.success) {
      setActionSuccess(editingId ? "Category updated successfully!" : "Category created successfully!");
      if (res.category) {
        const savedCat = res.category;
        setCategories((prev) => {
          if (editingId) {
            return prev.map((c) => (c.id === editingId ? { ...c, ...savedCat, _count: c._count } : c));
          } else {
            return [...prev, { ...savedCat, _count: { products: 0 } }];
          }
        });
      }
      setTimeout(() => {
        setIsModalOpen(false);
        setActionSuccess(null);
        router.refresh();
      }, 500);
    } else {
      setActionError(res.message || "Failed to save category.");
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;

    const res = await deleteCategory(id);
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } else {
      alert(res.message || "Failed to delete category.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Categories
          </h1>
          <p className="text-sm text-[#6E6E73] mt-1">
            Organize products into Fish, Seafood, or custom groups with live storefront updates.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-[#1E88E5] text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-[#1565C0] transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Summary strip */}
      <div className="bg-white border border-black/[0.06] rounded-2xl px-5 py-3.5 shadow-xs flex items-center gap-3">
        <Folder className="w-4 h-4 text-[#1E88E5]" />
        <span className="text-xs sm:text-sm text-[#6E6E73]">
          <strong className="text-[#1D1D1F] font-semibold">{categories.length}</strong> categories,{" "}
          <strong className="text-[#1D1D1F] font-semibold">
            {categories.reduce((sum, c) => sum + (c._count?.products || 0), 0)}
          </strong>{" "}
          total products assigned
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {categories.map((cat, i) => {
          const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
          return (
            <div
              key={cat.id}
              className="bg-white border border-black/[0.06] rounded-3xl p-6 shadow-xs flex flex-col justify-between gap-4 hover:shadow-md transition-all"
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div
                  style={{ background: accent.bg }}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                >
                  <Folder style={{ color: accent.text }} className="w-5 h-5" />
                </div>
                <span
                  style={{ background: accent.bg, color: accent.text }}
                  className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"
                >
                  <Package className="w-3 h-3" />
                  {cat._count?.products || 0} Products
                </span>
              </div>

              {/* Name & Description */}
              <div>
                <h3 className="text-lg font-semibold text-[#1D1D1F] mb-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#6E6E73] leading-relaxed line-clamp-2">
                  {cat.description || "No description provided."}
                </p>
              </div>

              {/* Slug & Action buttons */}
              <div className="pt-3 border-t border-black/[0.05] flex items-center justify-between">
                <code className="text-xs font-mono text-[#6E6E73] bg-black/[0.04] px-2 py-0.5 rounded-md">
                  /{cat.slug}
                </code>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 hover:bg-black/[0.06] rounded-lg text-[#1E88E5] font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  {cat._count?.products === 0 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 hover:bg-[#C62828]/10 rounded-lg text-[#C62828] cursor-pointer"
                      title="Delete unused category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/[0.08] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h2 className="text-lg font-semibold text-[#1D1D1F]">
                  {editingId ? "Edit Category" : "Add New Category"}
                </h2>
                <p className="text-xs text-[#6E6E73]">
                  {editingId ? "Update category specifications" : "Create a new catalog section"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/[0.06] text-[#6E6E73] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-[#C62828]/10 border border-[#C62828]/20 rounded-xl text-xs font-semibold text-[#C62828] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="p-3 bg-[#2E7D32]/10 border border-[#2E7D32]/20 rounded-xl text-xs font-semibold text-[#2E7D32] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-[#1D1D1F]">
              <div>
                <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Fresh Fish"
                  className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                />
              </div>

              <div>
                <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                  URL Slug * (lowercase, letters, numbers, hyphens)
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. fresh-fish"
                  className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                />
              </div>

              <div>
                <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Wild-caught sea fish direct from Sri Lankan coastal landings..."
                  className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-xs"
                />
              </div>

              <div>
                <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-24 px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E6E73] hover:bg-black/[0.06] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1E88E5] text-white rounded-xl text-xs font-semibold hover:bg-[#1565C0] transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingId ? "Update Category" : "Create Category"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
