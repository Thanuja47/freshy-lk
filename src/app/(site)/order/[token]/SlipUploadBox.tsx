"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { uploadPaymentSlipAction } from "@/actions/orders";

interface SlipUploadBoxProps {
  token: string;
  orderId: string;
  hasExistingSlip?: boolean;
}

export default function SlipUploadBox({ token, orderId, hasExistingSlip }: SlipUploadBoxProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select a slip image or PDF to upload.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.set("token", token);
      formData.set("orderId", orderId);
      formData.set("file", file);

      const res = await uploadPaymentSlipAction(formData);
      if (res.success) {
        setSuccessMsg("Payment slip uploaded successfully. Our accounts team will verify it shortly.");
        setFile(null);
        router.refresh();
      } else {
        setErrorMsg(res.message || "Failed to upload payment slip. Please try again.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred while uploading. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#DDE8F0] pb-3">
        <div className="flex items-center gap-2 font-bold text-base text-[#0D2137]">
          <Upload className="w-5 h-5 text-[#1B9AE4]" />
          <span>Upload Bank Transfer Slip</span>
        </div>
        {hasExistingSlip && (
          <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
            Slip Received
          </span>
        )}
      </div>

      <p className="text-xs text-[#0D2137]/70 leading-relaxed">
        After completing your bank transfer or cash deposit, upload a clear photo or PDF of your transfer receipt below.
      </p>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-[#0D2137] mb-1.5">
            Select Receipt (JPG, PNG, WebP or PDF, max 10MB)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setErrorMsg(null);
            }}
            className="w-full text-xs text-[#0D2137] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1B9AE4] file:text-white hover:file:bg-[#1580C2] cursor-pointer"
          />
          {file && (
            <p className="text-[11px] text-[#0D2137]/60 mt-1 font-mono">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!file || isUploading}
          className="w-full py-3 px-4 bg-[#1B9AE4] hover:bg-[#1580C2] text-white font-bold rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading Receipt...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Submit Payment Slip</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
