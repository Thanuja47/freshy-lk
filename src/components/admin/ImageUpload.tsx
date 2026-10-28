// src/components/admin/ImageUpload.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  aspectRatio?: "square" | "landscape";
}

export default function ImageUpload({
  value,
  onChange,
  folder = "products",
  label = "Product Image",
  aspectRatio = "square",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setUploadError(json.error || "Upload failed");
      } else {
        onChange(json.url);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const heightClass = aspectRatio === "landscape" ? "h-32" : "h-28";

  return (
    <div className="space-y-1.5">
      <label className="block text-[#6E6E73] uppercase tracking-wider font-semibold text-xs mb-1">
        {label}
      </label>

      <div
        className={`relative w-full ${heightClass} rounded-xl border-2 border-dashed border-black/[0.12] bg-[#F5F5F7] overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#1E88E5]/60 hover:bg-[#E3F2FD]/20 transition-all`}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
              sizes="200px"
              onError={() => onChange("")}
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center">
              <span className="opacity-0 hover:opacity-100 transition-opacity text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-lg">
                Change
              </span>
            </div>
            <button
              type="button"
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition z-10"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : isUploading ? (
          <div className="flex flex-col items-center gap-2 text-[#1E88E5]">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-semibold">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-[#6E6E73]">
            <Upload className="w-5 h-5" />
            <span className="text-xs font-semibold">Click to upload</span>
            <span className="text-[10px]">JPG, PNG, WebP · max 5 MB</span>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-red-600 font-medium">{uploadError}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {/* Or paste a URL */}
      <div className="flex gap-2 mt-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste image URL (e.g. /categories/fresh-fish.jpg or https://...)"
          className="flex-1 px-2.5 py-1.5 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/30 text-[#1D1D1F] font-mono"
        />
      </div>
    </div>
  );
}
