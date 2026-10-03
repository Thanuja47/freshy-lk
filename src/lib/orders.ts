// src/lib/orders.ts — Validated order status transitions & lifecycle management

import type { OrderStatus } from "@prisma/client";

// Allowed status transition matrix
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PLACED", "CANCELLED"],
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DELIVERED", "RETURNED"],
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
};

/**
 * Validates whether transitioning from currentStatus to nextStatus is allowed.
 * Returns true if valid, or if isOwnerOverride is true.
 */
export function isValidStatusTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
  isOwnerOverride: boolean = false
): boolean {
  if (currentStatus === nextStatus) return true;
  if (isOwnerOverride) return true;

  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}
