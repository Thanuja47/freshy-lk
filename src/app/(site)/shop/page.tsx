import ProductCard from "@/components/site/ProductCard";

const ALL_PRODUCTS = [
  { id: "1", slug: "yellowfin-tuna", name: "Yellowfin Tuna", localName: "Kelawalla", pricePerKgCents: 165000, storageType: "FRESH" as const, isAvailable: true },
  { id: "2", slug: "skipjack-tuna", name: "Skipjack Tuna", localName: "Balaya", pricePerKgCents: 110000, storageType: "FRESH" as const, isAvailable: true },
  { id: "3", slug: "seer-fish", name: "Seer Fish", localName: "Thora", pricePerKgCents: 280000, storageType: "FRESH" as const, isAvailable: true },
  { id: "4", slug: "trevally", name: "Trevally", localName: "Paraw", pricePerKgCents: 175000, storageType: "FRESH" as const, isAvailable: true },
  { id: "5", slug: "tiger-prawns", name: "Tiger Prawns", localName: "Isso", pricePerKgCents: 220000, storageType: "FRESH" as const, isAvailable: true },
  { id: "6", slug: "mud-crab", name: "Mud Crab", localName: "Kakuluwo", pricePerKgCents: 240000, storageType: "FRESH" as const, isAvailable: true },
  { id: "7", slug: "cuttlefish", name: "Cuttlefish", localName: "Dallo", pricePerKgCents: 190000, storageType: "FRESH" as const, isAvailable: true },
  { id: "8", slug: "sprats", name: "Sprats", localName: "Hurulla", pricePerKgCents: 95000, storageType: "FRESH" as const, isAvailable: false },
];

export default function ShopPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#0B1F2A]">Shop All Fish</h1>
        <p className="text-sm text-gray-500 mt-1">Fresh daily catch directly from Sri Lankan fish landings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ALL_PRODUCTS.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
