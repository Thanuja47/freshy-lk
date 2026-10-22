// src/app/api/admin/upload-image/route.ts — Admin image upload endpoint
// Validates: admin session, MIME type, magic bytes (no MIME spoofing), size ≤ 5 MB
// Allowed: jpeg, png, webp only — SVG explicitly rejected (XSS risk)
// Production: Supabase-only. No local /public/uploads fallback in production.
// Preview/Dev: Supabase first, local fallback if Supabase is unavailable.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedMime = (typeof ALLOWED_MIME)[number];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates the first bytes of the buffer match the declared MIME type.
 * Prevents MIME-type spoofing attacks (e.g. a JS/HTML file named .jpg).
 */
export function checkMagicBytes(buf: Buffer, mime: AllowedMime): boolean {
  if (mime === "image/jpeg") {
    // JPEG: FF D8 FF
    return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mime === "image/png") {
    // PNG: 89 50 4E 47 (‰PNG)
    return (
      buf.length >= 4 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    );
  }
  if (mime === "image/webp") {
    // WebP: RIFF????WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
    return (
      buf.length >= 12 &&
      buf[0] === 0x52 && // R
      buf[1] === 0x49 && // I
      buf[2] === 0x46 && // F
      buf[3] === 0x46 && // F
      buf[8] === 0x57 && // W
      buf[9] === 0x45 && // E
      buf[10] === 0x42 && // B
      buf[11] === 0x50   // P
    );
  }
  return false;
}

export async function POST(request: NextRequest) {
  // 1. Require admin session
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 2. Explicitly reject SVG (can contain inline scripts — XSS risk)
    if (file.type === "image/svg+xml") {
      return NextResponse.json(
        { error: "SVG files are not allowed for security reasons. Use JPEG, PNG, or WebP." },
        { status: 400 }
      );
    }

    // 3. Check allowed MIME types
    if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type "${file.type}". Only JPEG, PNG, and WebP are allowed.` },
        { status: 400 }
      );
    }

    // 4. Check file size (≤ 5 MB)
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 5 MB.` },
        { status: 400 }
      );
    }

    // 5. Read buffer and validate magic bytes (prevents MIME spoofing)
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!checkMagicBytes(buffer, file.type as AllowedMime)) {
      return NextResponse.json(
        { error: "File content does not match the declared file type. The file may be corrupt or mislabeled." },
        { status: 400 }
      );
    }

    // 6. Generate a random object name (no guessable filenames)
    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `${randomUUID()}.${ext}`;
    const relativePath = `${folder}/${filename}`;

    // 7. Try Supabase storage (primary storage in all environments)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (
      supabaseUrl &&
      serviceRoleKey &&
      !serviceRoleKey.startsWith("placeholder") &&
      serviceRoleKey.length > 20
    ) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(relativePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(relativePath);
          return NextResponse.json({ url: urlData.publicUrl, path: relativePath });
        }
        console.warn("[upload-image] Supabase upload failed:", uploadError.message);
      } catch (supaErr) {
        console.warn("[upload-image] Supabase client error:", supaErr);
      }
    }

    // 8. In production: never fall back to local disk — images would be lost on redeploy
    if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
      console.error(
        "[upload-image] Supabase unavailable in production. Ensure the 'product-images' bucket exists."
      );
      return NextResponse.json(
        {
          error:
            "Image upload failed. The storage service is unavailable. " +
            "Please ensure the 'product-images' Supabase bucket is configured and the service role key is set.",
        },
        { status: 500 }
      );
    }

    // 9. Development / preview: local /public/uploads fallback (not persisted on Vercel)
    const publicDir = path.join(process.cwd(), "public", "uploads", folder);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDir, filename), buffer);

    const publicUrl = `/uploads/${folder}/${filename}`;
    console.info("[upload-image] Local fallback used (dev/preview):", publicUrl);
    return NextResponse.json({ url: publicUrl, path: relativePath });
  } catch (err: unknown) {
    console.error("[upload-image] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed due to an unexpected error." },
      { status: 500 }
    );
  }
}
