"use client";

import { useState } from "react";
import { getSlipSignedUrlAction } from "@/actions/orders";
import { FileText, Loader2, ExternalLink } from "lucide-react";


interface SlipItem {
  id: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  createdAt: string;
  reviewNote?: string | null;
}

export default function AdminSlipViewer({ slips }: { slips: SlipItem[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleView = async (slipId: string) => {
    if (previewUrls[slipId]) {
      window.open(previewUrls[slipId], "_blank");
      return;
    }

    setLoadingId(slipId);
    setErrorMsg(null);
    try {
      const res = await getSlipSignedUrlAction(slipId);
      if (res.success && res.url) {
        setPreviewUrls((prev) => ({ ...prev, [slipId]: res.url }));
        window.open(res.url, "_blank");
      } else {
        setErrorMsg(res.message || "Could not generate view URL for this slip.");
      }
    } catch {
      setErrorMsg("Failed to open slip.");
    } finally {
      setLoadingId(null);
    }
  };

  if (!slips || slips.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-[#6E6E73] bg-gray-50 rounded-xl border border-gray-100">
        No bank transfer slips uploaded for this order.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
          {errorMsg}
        </div>
      )}

      {slips.map((slip, idx) => {
        const formattedSize = (slip.sizeBytes / 1024).toFixed(1) + " KB";

        const isApproved = slip.status === "APPROVED";
        const isPending = slip.status === "PENDING";
        const isLoading = loadingId === slip.id;

        return (
          <div
            key={slip.id}
            className="p-3.5 bg-[#F9F9FB] border border-black/[0.06] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1E88E5] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#1D1D1F] flex items-center gap-2">
                  <span>Slip #{idx + 1}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isApproved
                        ? "bg-green-100 text-green-800"
                        : isPending
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {slip.status}
                  </span>
                </div>
                <div className="text-[11px] text-[#6E6E73] mt-0.5">
                  Uploaded: {new Date(slip.createdAt).toLocaleString("en-LK")} • {formattedSize}
                </div>
                {slip.reviewNote && (
                  <div className="text-[11px] text-[#1E88E5] mt-0.5 font-medium">
                    Note: {slip.reviewNote}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleView(slip.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-black/[0.1] text-[#1D1D1F] text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-2xs disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1E88E5]" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5 text-[#1E88E5]" />
                    <span>View Private Slip</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
