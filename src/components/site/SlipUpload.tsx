"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadPaymentSlipAction } from "@/actions/orders";
import { UploadCloud, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";

interface SlipUploadProps {
  orderToken: string;
  orderNo: string;
  paymentStatus: string;
  slips: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

export default function SlipUpload({
  orderToken,
  orderNo,
  paymentStatus,
  slips,
}: SlipUploadProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isPaid = paymentStatus === "PAID";
  const hasSlips = slips && slips.length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFeedback(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setFeedback({ type: "error", message: "Please select a slip image or PDF to upload." });
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("token", orderToken);
    formData.append("file", file);

    const res = await uploadPaymentSlipAction(formData);
    setIsUploading(false);

    if (res.success) {
      setFile(null);
      setFeedback({ type: "success", message: res.message || "Slip uploaded successfully!" });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.message || "Upload failed. Please try again." });
    }
  };

  return (
    <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#DDE8F0] pb-3">
        <h3 className="font-heading text-lg font-bold text-[#0D2137] flex items-center gap-2">
          <span>🧾</span> Bank Transfer Slip
        </h3>
        {isPaid ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 font-bold text-xs rounded-full border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Payment Verified
          </span>
        ) : hasSlips ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Verification Pending
          </span>
        ) : null}
      </div>

      {hasSlips && (
        <div className="space-y-2">
          <p className="text-xs text-[#0D2137]/70">Uploaded Slips:</p>
          <div className="space-y-1.5">
            {slips.map((s, idx) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs border border-gray-100"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0D2137]">Slip #{idx + 1}</span>
                  <span className="text-[11px] text-[#0D2137]/50">
                    {new Date(s.createdAt).toLocaleString("en-LK")}
                  </span>
                </div>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                    s.status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : s.status === "REJECTED"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isPaid && (
        <form onSubmit={handleUpload} className="space-y-3 pt-2">
          <p className="text-xs text-[#0D2137]/80">
            Upload a photo or PDF screenshot of your bank transfer receipt for order {orderNo} (Max 10MB):
          </p>


          <div className="relative border-2 border-dashed border-[#DDE8F0] hover:border-[#1B9AE4] rounded-xl p-4 text-center cursor-pointer transition-colors bg-sand/20">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-1">
              <UploadCloud className="w-6 h-6 text-[#1B9AE4]" />
              <span className="text-xs font-semibold text-[#0D2137]">
                {file ? file.name : "Tap to browse or drop slip here"}
              </span>
              <span className="text-[10px] text-[#0D2137]/50">JPG, PNG, WebP or PDF</span>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || isUploading}
            className="w-full py-2.5 px-4 bg-[#1B9AE4] hover:bg-[#1681be] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading Slip...
              </>
            ) : (
              "Submit Slip for Verification"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
