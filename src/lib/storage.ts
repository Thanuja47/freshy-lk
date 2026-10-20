// src/lib/storage.ts — Supabase storage client for private bucket uploads & signed URLs
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://whlvaunweyjmlwhjgwhj.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function getStorageAdminClient() {
  if (!serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

import { randomUUID } from "crypto";

/**
 * Validates file magic bytes to verify true file format.
 */
export function validateFileMagicBytes(buffer: Buffer): { isValid: boolean; detectedMime: string | null } {
  if (buffer.length < 4) return { isValid: false, detectedMime: null };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedMime: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, detectedMime: "image/png" };
  }

  // PDF: %PDF (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { isValid: true, detectedMime: "application/pdf" };
  }

  // WebP: RIFF ... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, detectedMime: "image/webp" };
  }

  return { isValid: false, detectedMime: null };
}

/**
 * Uploads a bank transfer slip to the private 'payment-slips' bucket with random UUID object name.
 */
export async function uploadBankSlipToStorage(
  orderId: string,
  _fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ storagePath: string; sizeBytes: number }> {
  const mimeCheck = validateFileMagicBytes(fileBuffer);
  if (!mimeCheck.isValid) {
    throw new Error("Invalid file content: file signature does not match allowed image or PDF format.");
  }

  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  const ext = extMap[mimeCheck.detectedMime || mimeType] || "bin";
  const randomKey = randomUUID();
  const storagePath = `slips/${orderId}/${randomKey}.${ext}`;
  const sizeBytes = fileBuffer.length;

  const supabase = getStorageAdminClient();
  if (supabase) {
    const { error } = await supabase.storage
      .from("payment-slips")
      .upload(storagePath, fileBuffer, {
        contentType: mimeCheck.detectedMime || mimeType,
        upsert: false,
      });

    if (error) {
      console.warn("Supabase storage upload failed, saving to local fallback:", error);
      saveLocalFallback(storagePath, fileBuffer);
    }
  } else {
    saveLocalFallback(storagePath, fileBuffer);
  }

  return { storagePath, sizeBytes };
}


/**
 * Generates a signed URL for viewing an uploaded slip in the private bucket.
 */
export async function getSlipSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
  const supabase = getStorageAdminClient();
  if (supabase) {
    const { data, error } = await supabase.storage
      .from("payment-slips")
      .createSignedUrl(storagePath, expiresIn);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  }

  // Fallback to local streaming API route
  return `/api/admin/slips/view?path=${encodeURIComponent(storagePath)}`;
}

/**
 * Uploads an invoice PDF to the private 'invoices' bucket.
 */
export async function uploadInvoicePdfToStorage(
  invoiceNo: string,
  pdfBuffer: Buffer
): Promise<{ storagePath: string }> {
  const storagePath = `invoices/${invoiceNo}.pdf`;
  const supabase = getStorageAdminClient();

  if (supabase) {
    const { error } = await supabase.storage
      .from("invoices")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.warn("Supabase invoice storage upload failed, saving to local fallback:", error);
      saveLocalFallback(storagePath, pdfBuffer);
    }
  } else {
    saveLocalFallback(storagePath, pdfBuffer);
  }

  return { storagePath };
}

function saveLocalFallback(relPath: string, buffer: Buffer): void {
  try {
    const fullPath = path.join(process.cwd(), "storage", relPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, buffer);
  } catch (err) {
    console.error("Local storage fallback write error:", err);
  }
}
