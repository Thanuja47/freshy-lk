import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculatePackPriceCents, calculatePrepFeeCents } from "@/lib/pricing";

export interface CartItem {
  id: string; // unique item line id
  productId: string;
  productSlug: string;
  productName: string;
  localName?: string | null;
  imageUrl?: string | null;
  storageType: "FRESH" | "FROZEN" | "AMBIENT";
  pricePerKgCents: number;
  priceVersion: number;
  weightGrams: number;
  packLabel: string;
  quantity: number;
  prepOptionId?: string | null;
  prepName?: string | null;
  prepFeeCents: number;
  prepFeeType: "FLAT" | "PER_KG";
}

export interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotalCents: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const items = get().items;
        const lineId = `${newItem.productId}-${newItem.weightGrams}-${newItem.prepOptionId || "none"}`;

        const existingIndex = items.findIndex((i) => i.id === lineId);

        if (existingIndex > -1) {
          const updated = [...items];
          updated[existingIndex].quantity += newItem.quantity;
          set({ items: updated });
        } else {
          set({ items: [...items, { ...newItem, id: lineId }] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotalCents: () => {
        return get().items.reduce((sum, item) => {
          const packPrice = calculatePackPriceCents(item.pricePerKgCents, item.weightGrams);
          const prepFee = calculatePrepFeeCents(
            item.prepFeeCents,
            item.prepFeeType,
            item.weightGrams,
            item.quantity
          );
          return sum + packPrice * item.quantity + prepFee;
        }, 0);
      },
    }),
    {
      name: "freshy_lk_cart",
    }
  )
);
