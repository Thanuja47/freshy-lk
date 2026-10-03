"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, dispatchOrder } from "@/actions/orders";
import type { OrderStatus } from "@prisma/client";

export default function OrderDetailActions({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  const [courierName, setCourierName] = useState("Prompt Express");
  const [trackingNo, setTrackingNo] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  const handleStatusChange = async (nextStatus: OrderStatus, note?: string) => {
    setIsUpdating(true);
    const res = await updateOrderStatus(orderId, nextStatus, note);
    setIsUpdating(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.message);
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    const res = await dispatchOrder(orderId, courierName, trackingNo, trackingUrl || undefined);
    setIsUpdating(false);
    setShowDispatchModal(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.message);
    }
  };

  const isCancelled = currentStatus === "CANCELLED";
  const isDelivered = currentStatus === "DELIVERED";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Confirm Button */}
      {currentStatus === "PLACED" && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => handleStatusChange("CONFIRMED", "Order confirmed by admin")}
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
        >
          Confirm Order
        </button>
      )}

      {/* Mark Packed Button */}
      {currentStatus === "CONFIRMED" && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => handleStatusChange("PACKED", "Order packed in cold-chain box")}
          className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg text-xs hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
        >
          Mark Packed
        </button>
      )}

      {/* Dispatch Button */}
      {(currentStatus === "PACKED" || currentStatus === "CONFIRMED" || currentStatus === "PLACED") && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => setShowDispatchModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
        >
          Dispatch Order...
        </button>
      )}

      {/* Mark Delivered Button */}
      {currentStatus === "DISPATCHED" && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => handleStatusChange("DELIVERED", "Delivered to customer")}
          className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg text-xs hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
        >
          Mark Delivered
        </button>
      )}

      {/* Cancel Order Button */}
      {!isCancelled && !isDelivered && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => {
            const reason = prompt("Enter cancellation reason:");
            if (reason) {
              handleStatusChange("CANCELLED", reason);
            }
          }}
          className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-lg text-xs hover:bg-red-200 transition-colors disabled:opacity-50"
        >
          Cancel Order
        </button>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-serif text-xl font-bold text-sea-ink">🚚 Courier Dispatch Details</h3>
            <form onSubmit={handleDispatchSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                  Courier Name *
                </label>
                <input
                  type="text"
                  required
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Prompt Express / DOMEX"
                  className="w-full px-3 py-2 border border-sand rounded-md text-sm text-sea-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                  Tracking Number *
                </label>
                <input
                  type="text"
                  required
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  placeholder="e.g. PR-98765432"
                  className="w-full px-3 py-2 border border-sand rounded-md text-sm text-sea-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                  Tracking URL (Optional)
                </label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://track.courier.lk/..."
                  className="w-full px-3 py-2 border border-sand rounded-md text-sm text-sea-ink"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 bg-sand/40 text-sea-ink rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                >
                  Confirm Dispatch & Send SMS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
