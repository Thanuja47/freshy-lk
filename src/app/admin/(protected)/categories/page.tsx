import { db } from "@/lib/db";
import { Folder, Package, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  let categories: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    _count: { products: number };
  }> = [];

  try {
    categories = await db.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    });
  } catch (err) {
    if (process.env.DEMO_MODE !== "true") {
      throw err;
    }
    console.warn("DB offline in AdminCategoriesPage fallback:", err);
    categories = [
      { id: "demo-c1", slug: "fresh-fish", name: "Fresh Fish", description: "Wild caught sea fish direct from Sri Lankan landings.", _count: { products: 8 } },
      { id: "demo-c2", slug: "shellfish", name: "Shellfish & Crabs", description: "Fresh jumbo prawns, mud crabs, and cuttlefish.", _count: { products: 4 } },
      { id: "demo-c3", slug: "vegetables", name: "Vegetables", description: "Farm-fresh locally grown vegetables.", _count: { products: 6 } },
      { id: "demo-c4", slug: "fruits", name: "Fruits", description: "Seasonal tropical fruits from local farms.", _count: { products: 5 } },
    ];
  }

  const ACCENT_COLORS = [
    { bg: "#E3F2FD", text: "#1565C0" },
    { bg: "#E8F5E9", text: "#2E7D32" },
    { bg: "#FFF3E0", text: "#B26A00" },
    { bg: "#F3E5F5", text: "#6A1B9A" },
    { bg: "#FCE4EC", text: "#880E4F" },
    { bg: "#E0F7FA", text: "#00695C" },
  ];

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
            Categories
          </h1>
          <p style={{ fontSize: "14px", color: "#6E6E73", marginTop: "4px" }}>
            Organize products into Fish, Vegetables, Fruits, or seasonal groups.
          </p>
        </div>
        <button
          type="button"
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
            border: "none",
            cursor: "pointer",
          }}
        >
          <Plus style={{ width: 15, height: 15, strokeWidth: 2.5 }} />
          Add Category
        </button>
      </div>

      {/* Summary strip */}
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: "16px",
          padding: "14px 20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Folder style={{ width: 16, height: 16, color: "#1E88E5", strokeWidth: 1.75 }} />
        <span style={{ fontSize: "14px", color: "#6E6E73" }}>
          <strong style={{ color: "#1D1D1F" }}>{categories.length}</strong> categories,{" "}
          <strong style={{ color: "#1D1D1F" }}>
            {categories.reduce((sum, c) => sum + c._count.products, 0)}
          </strong>{" "}
          total products
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {categories.map((cat, i) => {
          const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
          return (
            <div
              key={cat.id}
              style={{
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                transition: "box-shadow 0.15s",
              }}
            >
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    background: accent.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Folder style={{ width: 22, height: 22, color: accent.text, strokeWidth: 1.5 }} />
                </div>
                <span
                  style={{
                    background: accent.bg,
                    color: accent.text,
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Package style={{ width: 11, height: 11, strokeWidth: 2 }} />
                  {cat._count.products} Products
                </span>
              </div>

              {/* Name & Description */}
              <div>
                <h3
                  style={{
                    fontFamily: "-apple-system, 'SF Pro Text', Inter, system-ui, sans-serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1D1D1F",
                    margin: "0 0 6px",
                  }}
                >
                  {cat.name}
                </h3>
                <p style={{ fontSize: "13px", color: "#6E6E73", lineHeight: 1.5, margin: 0 }}>
                  {cat.description || "No description provided."}
                </p>
              </div>

              {/* Slug */}
              <div
                style={{
                  paddingTop: "12px",
                  borderTop: "1px solid rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <code
                  style={{
                    fontSize: "11px",
                    color: "#6E6E73",
                    fontFamily: "monospace",
                    background: "rgba(0,0,0,0.04)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  /{cat.slug}
                </code>
                <button
                  type="button"
                  style={{
                    fontSize: "12px",
                    color: "#1E88E5",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    padding: "2px 4px",
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
