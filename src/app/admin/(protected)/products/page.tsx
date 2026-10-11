import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Plus, Fish, Package, Thermometer } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  let products: Array<{
    id: string;
    name: string;
    localName: string | null;
    storageType: "FRESH" | "FROZEN" | "AMBIENT";
    pricePerKgCents: number;
    isActive: boolean;
    isAvailable: boolean;
    category: { name: string };
    packs: Array<{ id: string; label: string }>;
  }> = [];

  try {
    products = await db.product.findMany({
      include: {
        category: { select: { name: true } },
        packs: true,
      },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    });
  } catch (err) {
    if (process.env.DEMO_MODE !== "true") {
      throw err;
    }
    console.warn("DB offline in AdminProductsPage, returning demo product list:", err);
    products = [
      { id: "demo-p1", name: "Yellowfin Tuna", localName: "Kelawalla", storageType: "FRESH", pricePerKgCents: 165000, isActive: true, isAvailable: true, category: { name: "Fresh Fish" }, packs: [{ id: "pk1", label: "500g Pack" }, { id: "pk2", label: "1kg Pack" }] },
      { id: "demo-p2", name: "Skipjack Tuna", localName: "Balaya", storageType: "FRESH", pricePerKgCents: 110000, isActive: true, isAvailable: true, category: { name: "Fresh Fish" }, packs: [{ id: "pk3", label: "1kg Pack" }] },
      { id: "demo-p3", name: "Seer Fish", localName: "Thora", storageType: "FRESH", pricePerKgCents: 280000, isActive: false, isAvailable: true, category: { name: "Fresh Fish" }, packs: [{ id: "pk4", label: "500g Pack" }] },
      { id: "demo-p4", name: "Tiger Prawns", localName: "Isso", storageType: "FRESH", pricePerKgCents: 320000, isActive: true, isAvailable: false, category: { name: "Shellfish" }, packs: [{ id: "pk5", label: "500g Pack" }] },
    ];
  }

  const storageStyles: Record<string, string> = {
    FRESH: "bg-[#E3F2FD] text-[#1565C0]",
    FROZEN: "bg-[#E0F7FA] text-[#00695C]",
    AMBIENT: "bg-[#F3E5F5] text-[#6A1B9A]",
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            style={{
              fontFamily: "-apple-system, 'SF Pro Text', Inter, system-ui, sans-serif",
              fontSize: "28px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#1D1D1F",
              margin: 0,
            }}
          >
            Products &amp; Packs
          </h1>
          <p style={{ fontSize: "14px", color: "#6E6E73", marginTop: "4px" }}>
            Manage your catalogue items, pack weights, and storage types.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#1E88E5",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            padding: "9px 18px",
            borderRadius: "12px",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
        >
          <Plus style={{ width: 15, height: 15, strokeWidth: 2.5 }} />
          Add Product
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: products.length, icon: Fish, color: "#1E88E5" },
          { label: "Active", value: products.filter(p => p.isActive && p.isAvailable).length, icon: Fish, color: "#2E7D32" },
          { label: "Sold Out", value: products.filter(p => !p.isAvailable).length, icon: Package, color: "#B26A00" },
          { label: "Hidden", value: products.filter(p => !p.isActive).length, icon: Thermometer, color: "#6E6E73" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            style={{
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: "16px",
              padding: "16px 20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Icon style={{ width: 15, height: 15, color, strokeWidth: 1.75 }} />
              <span style={{ fontSize: "12px", color: "#6E6E73", fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#1D1D1F", fontVariantNumeric: "tabular-nums" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        {products.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center", color: "#6E6E73" }}>
            <Fish style={{ width: 36, height: 36, strokeWidth: 1.25, margin: "0 auto 12px", opacity: 0.4 }} />
            <p style={{ fontWeight: 600, color: "#1D1D1F" }}>No products yet</p>
            <p style={{ fontSize: "13px", marginTop: 4 }}>Add your first product to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    background: "#F5F5F7",
                  }}
                >
                  {["Product", "Category", "Storage", "Base Price / kg", "Packs", "Status"].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "11px 16px",
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        color: "#6E6E73",
                        textAlign: "left",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product, i) => (
                  <tr
                    key={product.id}
                    style={{
                      borderBottom: i < products.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#1D1D1F" }}>{product.name}</div>
                      {product.localName && (
                        <div style={{ fontSize: "12px", color: "#1E88E5", marginTop: 2 }}>
                          {product.localName}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#6E6E73", fontWeight: 500 }}>
                      {product.category.name}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                        }}
                        className={storageStyles[product.storageType]}
                      >
                        {product.storageType}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        fontFamily: "monospace",
                        color: "#1D1D1F",
                      }}
                    >
                      {formatMoney(product.pricePerKgCents)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {product.packs.map((pack) => (
                          <span
                            key={pack.id}
                            style={{
                              padding: "2px 8px",
                              background: "rgba(0,0,0,0.04)",
                              color: "#1D1D1F",
                              fontSize: "11px",
                              borderRadius: "6px",
                              fontFamily: "monospace",
                            }}
                          >
                            {pack.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background:
                            product.isActive && product.isAvailable
                              ? "#E8F5E9"
                              : !product.isAvailable
                              ? "#FFF3E0"
                              : "rgba(0,0,0,0.06)",
                          color:
                            product.isActive && product.isAvailable
                              ? "#2E7D32"
                              : !product.isAvailable
                              ? "#B26A00"
                              : "#6E6E73",
                        }}
                      >
                        {product.isActive && product.isAvailable
                          ? "Active"
                          : !product.isAvailable
                          ? "Sold Out"
                          : "Hidden"}
                      </span>
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
