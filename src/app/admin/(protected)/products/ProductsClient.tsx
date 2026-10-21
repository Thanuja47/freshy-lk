// src/app/admin/(protected)/products/ProductsClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { createProduct, updateProduct, duplicateProduct, deleteProduct } from "@/actions/products";
import {
  Plus,
  Fish,
  Package,
  Thermometer,
  Search,
  Copy,
  Trash2,
  Edit2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface ProductItem {
  id: string;
  name: string;
  localName: string | null;
  storageType: "FRESH" | "FROZEN" | "AMBIENT";
  pricePerKgCents: number;
  stockGrams: number;
  isActive: boolean;
  isAvailable: boolean;
  shortDesc?: string | null;
  category: { id?: string; name: string };
  packs: Array<{ id: string; label: string; weightGrams?: number }>;
}

const storageStyles: Record<string, string> = {
  FRESH: "bg-[#E3F2FD] text-[#1565C0]",
  FROZEN: "bg-[#E0F7FA] text-[#00695C]",
  AMBIENT: "bg-[#F3E5F5] text-[#6A1B9A]",
};

export default function ProductsClient({
  initialProducts,
  categories,
}: {
  initialProducts: ProductItem[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProducts(initialProducts);
  }, [initialProducts]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [localName, setLocalName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [storageType, setStorageType] = useState<"FRESH" | "FROZEN" | "AMBIENT">("FRESH");
  const [pricePerKgRupees, setPricePerKgRupees] = useState("");
  const [stockKg, setStockKg] = useState("10");
  const [shortDesc, setShortDesc] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [selectedPacks, setSelectedPacks] = useState<number[]>([500, 1000]);

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setLocalName("");
    setCategoryId(categories[0]?.id || "");
    setStorageType("FRESH");
    setPricePerKgRupees("");
    setStockKg("10");
    setShortDesc("");
    setIsAvailable(true);
    setIsActive(true);
    setSelectedPacks([500, 1000]);
    setActionError(null);
    setActionSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: ProductItem) => {
    setEditingProduct(prod);
    setName(prod.name);
    setLocalName(prod.localName || "");
    const matchingCat = categories.find((c) => c.id === prod.category.id || c.name === prod.category.name);
    setCategoryId(matchingCat ? matchingCat.id : (categories[0]?.id || ""));
    setStorageType(prod.storageType);
    setPricePerKgRupees(String(prod.pricePerKgCents / 100));
    setStockKg(String(prod.stockGrams / 1000));
    setShortDesc(prod.shortDesc || "");
    setIsAvailable(prod.isAvailable);
    setIsActive(prod.isActive);

    const weights = prod.packs
      .map((p) => {
        if (p.weightGrams) return p.weightGrams;
        if (p.label.toLowerCase().includes("kg")) return parseFloat(p.label) * 1000;
        return parseInt(p.label);
      })
      .filter((w) => !isNaN(w) && w > 0);
    setSelectedPacks(weights.length > 0 ? weights : [500, 1000]);

    setActionError(null);
    setActionSuccess(null);
    setIsModalOpen(true);
  };

  const handlePackToggle = (weight: number) => {
    setSelectedPacks((prev) =>
      prev.includes(weight) ? prev.filter((w) => w !== weight) : [...prev, weight].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);

    const priceCents = Math.round(parseFloat(pricePerKgRupees) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      setActionError("Please enter a valid price per kg.");
      setIsSubmitting(false);
      return;
    }

    const stockGrams = Math.round(parseFloat(stockKg || "0") * 1000);
    const packEntries = selectedPacks.map((w) => ({
      weightGrams: w,
      label: w >= 1000 ? `${w / 1000} kg` : `${w} g`,
    }));

    if (editingProduct) {
      // Update
      const result = await updateProduct({
        id: editingProduct.id,
        name,
        localName: localName || undefined,
        categoryId,
        storageType,
        pricePerKgCents: priceCents,
        trackStock: true,
        stockGrams,
        isAvailable,
        isActive,
        shortDesc: shortDesc || undefined,
        packs: packEntries,
      });

      setIsSubmitting(false);

      if (result.success) {
        setActionSuccess(`Product "${name}" updated successfully!`);
        const selectedCatObj = categories.find((c) => c.id === categoryId);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  name,
                  localName: localName || null,
                  storageType,
                  pricePerKgCents: priceCents,
                  stockGrams,
                  isAvailable,
                  isActive,
                  shortDesc: shortDesc || null,
                  category: { id: categoryId, name: selectedCatObj?.name || p.category.name },
                  packs: packEntries.map((pe, idx) => ({
                    id: `pack-${idx}-${Date.now()}`,
                    weightGrams: pe.weightGrams,
                    label: pe.label,
                  })),
                }
              : p
          )
        );
        setTimeout(() => {
          setIsModalOpen(false);
          setActionSuccess(null);
          router.refresh();
        }, 500);
      } else {
        setActionError(result.message || "Failed to update product.");
      }
    } else {
      // Create
      const result = await createProduct({
        name,
        localName: localName || undefined,
        categoryId,
        storageType,
        pricePerKgCents: priceCents,
        trackStock: true,
        stockGrams,
        isAvailable: true,
        isActive: true,
        shortDesc: shortDesc || undefined,
        packs: packEntries,
      });

      setIsSubmitting(false);

      if (result.success) {
        setActionSuccess(`Product "${name}" added successfully!`);
        const selectedCatObj = categories.find((c) => c.id === categoryId);
        const newProd: ProductItem = {
          id: result.productId || String(Date.now()),
          name,
          localName: localName || null,
          storageType,
          pricePerKgCents: priceCents,
          stockGrams,
          isAvailable: true,
          isActive: true,
          category: { id: categoryId, name: selectedCatObj?.name || "General" },
          packs: packEntries.map((p, idx) => ({ id: `new-pack-${idx}`, weightGrams: p.weightGrams, label: p.label })),
        };
        setProducts((prev) => [newProd, ...prev]);
        setTimeout(() => {
          setIsModalOpen(false);
          setActionSuccess(null);
          router.refresh();
        }, 500);
      } else {
        setActionError(result.message || "Failed to create product.");
      }
    }
  };

  const handleDuplicate = async (id: string, prodName: string) => {
    if (!confirm(`Duplicate "${prodName}"?`)) return;
    const res = await duplicateProduct(id);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.message || "Failed to duplicate product.");
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (!confirm(`Hide "${prodName}" from catalogue?`)) return;
    const res = await deleteProduct(id);
    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } else {
      alert(res.message || "Failed to hide product.");
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.localName && p.localName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "All" || p.category.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryNames = ["All", ...Array.from(new Set(categories.map((c) => c.name)))];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Products &amp; Packs
          </h1>
          <p className="text-sm text-[#6E6E73] mt-1">
            Manage your catalogue items, pack weights, and storage types in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-[#1E88E5] hover:bg-[#1565C0] text-white px-4 py-2.5 rounded-2xl font-medium text-sm transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E3F2FD] flex items-center justify-center text-[#1E88E5]">
            <Fish className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1D1D1F] tracking-tight">{products.length}</div>
            <div className="text-xs text-[#6E6E73] font-medium">Total Products</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32]">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
              {products.reduce((acc, p) => acc + p.packs.length, 0)}
            </div>
            <div className="text-xs text-[#6E6E73] font-medium">Active Pack Configs</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFF3E0] flex items-center justify-center text-[#B26A00]">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
              {products.filter((p) => p.storageType === "FRESH").length} /{" "}
              {products.filter((p) => p.storageType === "FROZEN").length}
            </div>
            <div className="text-xs text-[#6E6E73] font-medium">Fresh / Frozen Items</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
          <input
            type="text"
            placeholder="Search products by name or local name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F5F5F7] border border-black/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-[#1D1D1F]"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categoryNames.map((catName) => (
            <button
              key={catName}
              type="button"
              onClick={() => setSelectedCategory(catName)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === catName
                  ? "bg-[#1D1D1F] text-white shadow-xs"
                  : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]"
              }`}
            >
              {catName}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Fish className="w-12 h-12 text-[#6E6E73]/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#1D1D1F]">No products found</h3>
            <p className="text-xs text-[#6E6E73] mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F5F5F7] border-b border-black/[0.06] text-[#6E6E73] text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Storage</th>
                  <th className="py-3 px-4">Price / kg</th>
                  <th className="py-3 px-4">Available Packs</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-black/[0.015] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1D1D1F]">{product.name}</div>
                      {product.localName && (
                        <div className="text-xs text-[#6E6E73]">{product.localName}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#1D1D1F] font-medium">
                      {product.category.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${storageStyles[product.storageType] || "bg-gray-100 text-gray-700"}`}>
                        {product.storageType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1D1D1F]">
                      {formatMoney(product.pricePerKgCents)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {product.packs.map((pack) => (
                          <span
                            key={pack.id}
                            className="px-2 py-0.5 bg-black/[0.04] text-xs font-mono rounded-md text-[#1D1D1F]"
                          >
                            {pack.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.isActive && product.isAvailable
                            ? "bg-[#E8F5E9] text-[#2E7D32]"
                            : !product.isAvailable
                            ? "bg-[#FFF3E0] text-[#B26A00]"
                            : "bg-black/[0.06] text-[#6E6E73]"
                        }`}
                      >
                        {product.isActive && product.isAvailable
                          ? "Active"
                          : !product.isAvailable
                          ? "Sold Out"
                          : "Hidden"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          title="Edit product"
                          className="p-1.5 hover:bg-[#1E88E5]/10 rounded-lg text-[#6E6E73] hover:text-[#1E88E5] transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(product.id, product.name)}
                          title="Duplicate product"
                          className="p-1.5 hover:bg-black/[0.06] rounded-lg text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id, product.name)}
                          title="Hide product from store"
                          className="p-1.5 hover:bg-[#C62828]/10 rounded-lg text-[#6E6E73] hover:text-[#C62828] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-black/[0.08] space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h2 className="text-lg font-semibold text-[#1D1D1F]">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-xs text-[#6E6E73]">
                  {editingProduct
                    ? "Update product details, pricing, stock, and pack sizes"
                    : "Add fish, seafood, or item to your storefront"}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Barramundi / Modha"
                    className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                    Local Name (Sinhala/Tamil)
                  </label>
                  <input
                    type="text"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    placeholder="e.g. මෝදා"
                    className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                    Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                    Storage Type
                  </label>
                  <select
                    value={storageType}
                    onChange={(e) => setStorageType(e.target.value as "FRESH" | "FROZEN" | "AMBIENT")}
                    className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                  >
                    <option value="FRESH">FRESH (Chilled)</option>
                    <option value="FROZEN">FROZEN</option>
                    <option value="AMBIENT">AMBIENT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                    Price / kg (LKR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[#6E6E73] font-mono">Rs.</span>
                    <input
                      type="number"
                      required
                      step="10"
                      min="10"
                      value={pricePerKgRupees}
                      onChange={(e) => setPricePerKgRupees(e.target.value)}
                      placeholder="1850"
                      className="w-full pl-10 pr-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                    Stock in kg
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={stockKg}
                    onChange={(e) => setStockKg(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm"
                  />
                </div>
              </div>

              {editingProduct && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#F5F5F7] rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1E88E5] focus:ring-[#1E88E5]"
                    />
                    <span className="text-xs font-semibold text-[#1D1D1F]">In Stock (Available)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1E88E5] focus:ring-[#1E88E5]"
                    />
                    <span className="text-xs font-semibold text-[#1D1D1F]">Published (Active)</span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1.5">
                  Available Pack Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { weight: 250, label: "250 g" },
                    { weight: 500, label: "500 g" },
                    { weight: 1000, label: "1 kg" },
                    { weight: 2000, label: "2 kg" },
                  ].map((p) => {
                    const isSelected = selectedPacks.includes(p.weight);
                    return (
                      <button
                        key={p.weight}
                        type="button"
                        onClick={() => handlePackToggle(p.weight)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#1E88E5] text-white border-[#1E88E5]"
                            : "bg-[#F5F5F7] text-[#6E6E73] border-black/[0.06] hover:bg-black/[0.06]"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="Fresh day-boat catch, firm texture and mild sweet flavor..."
                  className="w-full px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-xs"
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
                    <span>{editingProduct ? "Update Product" : "Create Product"}</span>
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
