"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatMoney } from "@/lib/money";
import { updateProductPriceAndStock, bulkUpdateAvailability } from "@/actions/prices";

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
        // Fallback demo data if endpoint is loading
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

  // Check if updated today in Asia/Colombo time
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
  };

  const handleStockChange = (id: string, newKg: string) => {
    const parsedKg = parseFloat(newKg);
    if (isNaN(parsedKg) || parsedKg < 0) return;

    const newGrams = Math.round(parsedKg * 1000);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stockGrams: newGrams } : p))
    );
  };

  const handleToggleAvailable = (id: string, isAvailable: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isAvailable } : p))
    );
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
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, priceUpdatedAt: result.updatedAt } : p
        )
      );

      // Show Undo Toast if price changed
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
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-sea-ink">Today&apos;s Prices & Stock</h1>
          <p className="text-xs text-sea-ink/70 mt-1">
            Update prices per kg and daily stock. Storefront updates live in ~1 second.
          </p>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleBulkAction("OPEN_ALL_AVAILABLE")}
            className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-semibold rounded-lg hover:bg-green-200"
          >
            Open All Available
          </button>
          <button
            type="button"
            onClick={() => handleBulkAction("MARK_ALL_SOLD_OUT")}
            className="px-3 py-1.5 bg-red-100 text-red-800 text-xs font-semibold rounded-lg hover:bg-red-200"
          >
            Mark All Sold Out
          </button>
        </div>
      </div>

      {/* Undo Toast */}
      {undoState && (
        <div className="p-4 bg-sea-ink text-white rounded-xl flex items-center justify-between shadow-lg">
          <span className="text-sm">
            Updated price for <strong>{undoState.productName}</strong>.
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="px-3 py-1 bg-coral text-white text-xs font-bold rounded hover:bg-coral/90"
          >
            Undo Change
          </button>
        </div>
      )}

      {/* > 30% Price Change Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-serif text-xl font-bold text-sea-ink">⚠️ Confirm Large Price Change</h3>
            <p className="text-sm text-sea-ink/80">
              Price for <strong>{confirmDialog.productName}</strong> is changing from{" "}
              <strong>{formatMoney(confirmDialog.oldPriceCents)}</strong> to{" "}
              <strong>{formatMoney(confirmDialog.newPriceCents)}</strong> per kg. Is this correct?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-sand/40 text-sea-ink rounded-lg text-sm font-semibold hover:bg-sand/60"
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
                className="px-4 py-2 bg-coral text-white rounded-lg text-sm font-bold hover:bg-coral/90"
              >
                Yes, Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Category Tabs Filter Bar */}
      <div className="bg-white border border-sand p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Search fish by English or Sinhala name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 border border-sand rounded-lg text-sm text-sea-ink focus:outline-none focus:ring-2 focus:ring-tide/50"
          />

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-tide text-white"
                    : "bg-ice text-sea-ink/70 hover:bg-sand/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price Table / Cards List */}
      {isLoading ? (
        <div className="py-12 text-center text-sea-ink/60">Loading daily prices...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-12 text-center text-sea-ink/60 bg-white border border-sand rounded-xl">
          No matching products found.
        </div>
      ) : (
        <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ice border-b border-sand text-[11px] font-bold uppercase tracking-wider text-sea-ink/70">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Price / kg (LKR)</th>
                  <th className="py-3 px-4">Stock (kg)</th>
                  <th className="py-3 px-4 text-center">Available</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/50 text-sm">
                {filteredProducts.map((product) => {
                  const updatedToday = isUpdatedToday(product.priceUpdatedAt);
                  const status = savedStatus[product.id];

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${
                        !updatedToday ? "bg-amber-50/60" : "hover:bg-ice/50"
                      }`}
                    >
                      {/* Product Thumbnail & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-sand/30 rounded-md overflow-hidden relative flex-shrink-0 flex items-center justify-center text-xs text-tide font-bold">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span>🐟</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-sea-ink">{product.name}</div>
                            {product.localName && (
                              <div className="text-xs text-tide">{product.localName}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Price Per Kg Input */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-sea-ink/60 font-mono">Rs.</span>
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
                            className="w-28 px-2 py-1.5 border border-sand rounded-md text-sea-ink font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-tide/50 text-base"
                          />
                        </div>
                      </td>

                      {/* Stock Input */}
                      <td className="py-3 px-4">
                        {product.trackStock ? (
                          <div className="flex items-center gap-1">
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
                              className="w-20 px-2 py-1.5 border border-sand rounded-md text-sea-ink font-mono text-sm focus:outline-none focus:ring-2 focus:ring-tide/50"
                            />
                            <span className="text-xs text-sea-ink/60">kg</span>
                          </div>
                        ) : (
                          <span className="text-xs text-sea-ink/40 font-mono">Unlimited</span>
                        )}
                      </td>

                      {/* Available Switch */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleAvailable(product.id, !product.isAvailable)
                          }
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                            product.isAvailable ? "bg-tide" : "bg-sand"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full transition-transform ${
                              product.isAvailable ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Status Checkmark & Timestamp */}
                      <td className="py-3 px-4 text-right">
                        {status === "saving" ? (
                          <span className="text-xs text-tide font-semibold">Saving...</span>
                        ) : status === "saved" ? (
                          <span className="text-xs text-green-700 font-bold flex items-center justify-end gap-1">
                            ✓ Saved
                          </span>
                        ) : status === "error" ? (
                          <span className="text-xs text-red-600 font-bold">Error</span>
                        ) : !updatedToday ? (
                          <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-medium">
                            Stale (Not updated)
                          </span>
                        ) : (
                          <span className="text-[11px] text-sea-ink/50">Updated today</span>
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
