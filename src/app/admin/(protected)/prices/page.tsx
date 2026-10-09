"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatMoney } from "@/lib/money";
import { updateProductPriceAndStock, bulkUpdateAvailability } from "@/actions/prices";
import {
  Search,
  Tag,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Fish,
  Check,
  Save,
} from "lucide-react";

export interface ProductPriceItem {
  id: string;
  name: string;
  localName?: string | null;
  categoryName: string;
  pricePerKgCents: number;
  stockGrams: number;
  trackStock: boolean;
  isAvailable: boolean;
  priceUpdatedAt: string;
  imageUrl?: string | null;
}

export default function AdminPricesPage() {
  const [products, setProducts] = useState<ProductPriceItem[]>([]);
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [savedStatus, setSavedStatus] = useState<Record<string, "saving" | "saved" | "error">>({});
  const [undoState, setUndoState] = useState<{
    productId: string;
    productName: string;
    oldPriceCents: number;
  } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    productId: string;
    productName: string;
    oldPriceCents: number;
    newPriceCents: number;
    stockGrams: number;
    isAvailable: boolean;
  } | null>(null);

  // Load products on mount
  useEffect(() => {
    async function loadCatalogue() {
      try {
        const res = await fetch("/api/admin/prices-data");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadCatalogue();
  }, []);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.categoryName)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.localName && p.localName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || p.categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isUpdatedToday = (isoString: string) => {
    const date = new Date(isoString);
    const todayStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Colombo" });
    const productDateStr = date.toLocaleDateString("en-US", { timeZone: "Asia/Colombo" });
    return todayStr === productDateStr;
  };

  const handlePriceChange = (id: string, newRupees: string) => {
    const parsedRupees = parseFloat(newRupees);
    if (isNaN(parsedRupees) || parsedRupees < 0) return;

    const newCents = Math.round(parsedRupees * 100);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pricePerKgCents: newCents } : p))
    );
    setModifiedIds((prev) => new Set(prev).add(id));
  };

  const handleStockChange = (id: string, newKg: string) => {
    const parsedKg = parseFloat(newKg);
    if (isNaN(parsedKg) || parsedKg < 0) return;

    const newGrams = Math.round(parsedKg * 1000);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stockGrams: newGrams } : p))
    );
    setModifiedIds((prev) => new Set(prev).add(id));
  };

  const handleToggleAvailable = (id: string, isAvailable: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isAvailable } : p))
    );
    setModifiedIds((prev) => new Set(prev).add(id));
    const prod = products.find((p) => p.id === id);
    if (prod) {
      saveProductUpdate(prod.id, prod.pricePerKgCents, prod.stockGrams, isAvailable);
    }
  };

  const saveProductUpdate = async (
    id: string,
    priceCents: number,
    stockGrams: number,
    isAvailable: boolean,
    confirmBigChange: boolean = false
  ) => {
    setSavedStatus((prev) => ({ ...prev, [id]: "saving" }));

    const result = await updateProductPriceAndStock({
      productId: id,
      pricePerKgCents: priceCents,
      stockGrams,
      isAvailable,
      confirmBigChange,
    });

    if (result.status === "SUCCESS") {
      setSavedStatus((prev) => ({ ...prev, [id]: "saved" }));
      setModifiedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, priceUpdatedAt: result.updatedAt } : p))
      );

      if (result.oldPricePerKgCents !== result.newPricePerKgCents) {
        const prod = products.find((p) => p.id === id);
        if (prod) {
          setUndoState({
            productId: id,
            productName: prod.name,
            oldPriceCents: result.oldPricePerKgCents,
          });
        }
      }

      setTimeout(() => {
        setSavedStatus((prev) => ({ ...prev, [id]: "saved" }));
      }, 2000);
    } else if (result.status === "CONFIRM_REQUIRED") {
      const prod = products.find((p) => p.id === id);
      setConfirmDialog({
        productId: id,
        productName: prod?.name || "Product",
        oldPriceCents: result.oldPricePerKgCents,
        newPriceCents: result.newPricePerKgCents,
        stockGrams,
        isAvailable,
      });
      setSavedStatus((prev) => ({ ...prev, [id]: "error" }));
    } else {
      setSavedStatus((prev) => ({ ...prev, [id]: "error" }));
    }
  };

  const handleUndo = async () => {
    if (!undoState) return;
    const prod = products.find((p) => p.id === undoState.productId);
    if (prod) {
      await saveProductUpdate(
        undoState.productId,
        undoState.oldPriceCents,
        prod.stockGrams,
        prod.isAvailable,
        true
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.id === undoState.productId ? { ...p, pricePerKgCents: undoState.oldPriceCents } : p
        )
      );
    }
    setUndoState(null);
  };

  const handleBulkAction = async (action: "MARK_ALL_SOLD_OUT" | "OPEN_ALL_AVAILABLE") => {
    setIsLoading(true);
    await bulkUpdateAvailability(action);
    const res = await fetch("/api/admin/prices-data");
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products || []);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Today&apos;s Prices & Stock
          </h1>
          <p className="text-[13px] text-[#6E6E73] mt-1">
            Update catch prices per kg and daily stock. Changes update live in ~1 second.
          </p>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleBulkAction("OPEN_ALL_AVAILABLE")}
            className="px-3.5 py-2 bg-[#2E7D32]/10 text-[#2E7D32] hover:bg-[#2E7D32]/20 text-xs font-semibold rounded-xl transition-all"
          >
            Open All Available
          </button>
          <button
            type="button"
            onClick={() => handleBulkAction("MARK_ALL_SOLD_OUT")}
            className="px-3.5 py-2 bg-[#C62828]/10 text-[#C62828] hover:bg-[#C62828]/20 text-xs font-semibold rounded-xl transition-all"
          >
            Mark All Sold Out
          </button>
        </div>
      </div>

      {/* Undo Toast */}
      {undoState && (
        <div className="p-4 bg-[#1D1D1F] text-white rounded-2xl flex items-center justify-between shadow-lg text-xs font-medium">
          <span>
            Updated price for <strong>{undoState.productName}</strong>.
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="px-3 py-1 bg-[#1E88E5] text-white text-xs font-semibold rounded-lg hover:bg-[#1E88E5]/90 transition-all flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Undo Change
          </button>
        </div>
      )}

      {/* > 30% Price Change Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-black/[0.06]">
            <div className="flex items-center gap-2 text-[#B26A00]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-semibold text-[#1D1D1F]">Confirm Large Price Change</h3>
            </div>
            <p className="text-sm text-[#6E6E73]">
              Price for <strong>{confirmDialog.productName}</strong> is changing from{" "}
              <strong className="text-[#1D1D1F]">{formatMoney(confirmDialog.oldPriceCents)}</strong> to{" "}
              <strong className="text-[#1E88E5]">{formatMoney(confirmDialog.newPriceCents)}</strong> per kg. Is this correct?
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-[#F5F5F7] text-[#1D1D1F] rounded-xl text-xs font-semibold hover:bg-black/[0.06]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const dialog = confirmDialog;
                  setConfirmDialog(null);
                  await saveProductUpdate(
                    dialog.productId,
                    dialog.newPriceCents,
                    dialog.stockGrams,
                    dialog.isAvailable,
                    true
                  );
                }}
                className="px-4 py-2 bg-[#1E88E5] text-white rounded-xl text-xs font-semibold hover:bg-[#1E88E5]/90"
              >
                Yes, Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-black/[0.06] p-4 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search fish by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F5F5F7]/80 border border-black/[0.06] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-[#1E88E5] text-white shadow-sm"
                    : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.06]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prices Table */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-[#6E6E73] bg-white border border-black/[0.06] rounded-2xl">
          Loading daily prices...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#6E6E73] bg-white border border-black/[0.06] rounded-2xl">
          No matching products found.
        </div>
      ) : (
        <div className="bg-white border border-black/[0.06] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] bg-[#F5F5F7]/40">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Price / kg (LKR)</th>
                  <th className="py-3 px-4">Stock (kg)</th>
                  <th className="py-3 px-4 text-center">Available</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] text-sm">
                {filteredProducts.map((product) => {
                  const updatedToday = isUpdatedToday(product.priceUpdatedAt);
                  const status = savedStatus[product.id];
                  const isModified = modifiedIds.has(product.id);

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${
                        !updatedToday ? "bg-[#B26A00]/[0.02]" : "hover:bg-[#F5F5F7]/50"
                      }`}
                    >
                      {/* Product Name & Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#F5F5F7] rounded-xl overflow-hidden relative flex-shrink-0 flex items-center justify-center text-xs text-[#1E88E5] font-semibold border border-black/[0.04]">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Fish className="w-5 h-5 text-[#6E6E73]" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                              <span>{product.name}</span>
                              {isModified && (
                                <span
                                  className="w-2 h-2 rounded-full bg-[#1E88E5]"
                                  title="Modified — blur input or press Enter to save"
                                />
                              )}
                            </div>
                            {product.localName && (
                              <div className="text-xs text-[#6E6E73]">{product.localName}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Price Per Kg Input (Large Tap-Friendly Input) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-[#6E6E73] font-mono">Rs.</span>
                          <input
                            type="number"
                            step="10"
                            min="0"
                            value={(product.pricePerKgCents / 100).toString()}
                            onChange={(e) => handlePriceChange(product.id, e.target.value)}
                            onBlur={() =>
                              saveProductUpdate(
                                product.id,
                                product.pricePerKgCents,
                                product.stockGrams,
                                product.isAvailable
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveProductUpdate(
                                  product.id,
                                  product.pricePerKgCents,
                                  product.stockGrams,
                                  product.isAvailable
                                );
                              }
                            }}
                            className="w-32 px-3 py-2 bg-[#F5F5F7]/80 border border-black/[0.08] rounded-xl text-[#1D1D1F] font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 focus:bg-white text-sm transition-all"
                          />
                        </div>
                      </td>

                      {/* Stock Input */}
                      <td className="py-3.5 px-4">
                        {product.trackStock ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={(product.stockGrams / 1000).toString()}
                              onChange={(e) => handleStockChange(product.id, e.target.value)}
                              onBlur={() =>
                                saveProductUpdate(
                                  product.id,
                                  product.pricePerKgCents,
                                  product.stockGrams,
                                  product.isAvailable
                                )
                              }
                              className="w-24 px-3 py-2 bg-[#F5F5F7]/80 border border-black/[0.08] rounded-xl text-[#1D1D1F] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 focus:bg-white transition-all"
                            />
                            <span className="text-xs text-[#6E6E73]">kg</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#6E6E73]/60 font-mono">Unlimited</span>
                        )}
                      </td>

                      {/* Available Switch */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleAvailable(product.id, !product.isAvailable)
                          }
                          className={`w-11 h-6 rounded-full p-0.5 transition-all relative ${
                            product.isAvailable ? "bg-[#1E88E5]" : "bg-black/20"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                              product.isAvailable ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-right">
                        {status === "saving" ? (
                          <span className="text-xs text-[#1E88E5] font-semibold">Saving...</span>
                        ) : status === "saved" ? (
                          <span className="text-xs text-[#2E7D32] font-semibold inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Saved
                          </span>
                        ) : status === "error" ? (
                          <span className="text-xs text-[#C62828] font-semibold">Error</span>
                        ) : !updatedToday ? (
                          <span className="text-[11px] bg-[#B26A00]/10 text-[#B26A00] px-2.5 py-0.5 rounded-full font-semibold">
                            Not updated
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#6E6E73]">Updated today</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
