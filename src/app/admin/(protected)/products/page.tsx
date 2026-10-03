import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";

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
      { id: "demo-p3", name: "Seer Fish", localName: "Thora", storageType: "FRESH", pricePerKgCents: 280000, isActive: true, isAvailable: true, category: { name: "Fresh Fish" }, packs: [{ id: "pk4", label: "500g Pack" }] },
    ];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-sea-ink">Products & Packs</h1>
          <p className="text-xs text-sea-ink/70 mt-1">
            Manage your catalogue items, pack weights, tiers, and storage types.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-tide text-white font-bold rounded-lg hover:bg-tide/90 text-sm shadow-sm"
        >
          <span>＋</span> Add New Product
        </Link>
      </div>

      <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ice border-b border-sand text-[11px] font-bold uppercase tracking-wider text-sea-ink/70">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Storage</th>
                <th className="py-3 px-4">Base Price / kg</th>
                <th className="py-3 px-4">Packs</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/50 text-sm">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-ice/50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-sea-ink">{product.name}</div>
                    {product.localName && (
                      <div className="text-xs text-tide">{product.localName}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-sea-ink/80">
                    {product.category.name}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        product.storageType === "FRESH"
                          ? "bg-blue-100 text-blue-800"
                          : product.storageType === "FROZEN"
                          ? "bg-cyan-100 text-cyan-900"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {product.storageType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-sea-ink">
                    {formatMoney(product.pricePerKgCents)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {product.packs.map((pack) => (
                        <span
                          key={pack.id}
                          className="px-2 py-0.5 bg-sand/40 text-sea-ink text-xs rounded font-mono"
                        >
                          {pack.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        product.isActive && product.isAvailable
                          ? "bg-green-100 text-green-800"
                          : !product.isAvailable
                          ? "bg-amber-100 text-amber-900"
                          : "bg-gray-100 text-gray-700"
                      }`}
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
      </div>
    </div>
  );
}
