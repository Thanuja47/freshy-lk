import { db } from "@/lib/db";

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
    console.warn("DB offline in AdminCategoriesPage fallback:", err);
    categories = [
      { id: "demo-c1", slug: "fresh-fish", name: "Fresh Fish", description: "Wild caught sea fish direct from Sri Lankan landings.", _count: { products: 8 } },
      { id: "demo-c2", slug: "shellfish", name: "Shellfish & Crabs", description: "Fresh jumbo prawns, mud crabs, and cuttlefish.", _count: { products: 4 } },
    ];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-sea-ink">Categories</h1>
          <p className="text-xs text-sea-ink/70 mt-1">
            Organize products into Fish, Vegetables, Fruits, or seasonal categories.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white border border-sand p-6 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 bg-sea-glass text-tide font-serif font-bold text-xl rounded-lg flex items-center justify-center">
                📁
              </span>
              <span className="px-2.5 py-1 bg-tide/10 text-tide font-bold text-xs rounded-full">
                {cat._count.products} Products
              </span>
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-sea-ink">{cat.name}</h3>
              <p className="text-xs text-sea-ink/70 mt-1">{cat.description || "No description provided."}</p>
            </div>
            <div className="text-xs font-mono text-sea-ink/50 pt-2 border-t border-sand/50">
              Slug: /{cat.slug}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
