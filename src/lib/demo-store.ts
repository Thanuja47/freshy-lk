/**
 * In-memory demo order store.
 * Used only when DEMO_MODE=true so the checkout flow can be demoed
 * without a real Supabase/PostgreSQL connection.
 *
 * This module-level Map lives for the lifetime of the Next.js server process.
 * In dev, hot-reload may clear it — that is acceptable for demo purposes.
 */

export interface DemoOrderItem {
  productId: string;
  packWeightGrams: number;
  quantity: number;
  cartPricePerKgCents: number;
}

export interface DemoOrder {
  orderNo: string;
  trackingToken: string;
  customerName: string;
  phone: string;
  email: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  district: string;
  deliveryDate: string; // YYYY-MM-DD
  paymentMethod: string;
  items: DemoOrderItem[];
  createdAt: string; // ISO string
}

// Module-level singleton cache
const _demoOrders = new Map<string, DemoOrder>();

export function setDemoOrder(token: string, order: DemoOrder): void {
  _demoOrders.set(token, order);
}

export function getDemoOrder(token: string): DemoOrder | null {
  return _demoOrders.get(token) ?? null;
}
