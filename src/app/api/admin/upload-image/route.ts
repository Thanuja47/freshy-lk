// src/app/api/admin/upload-image/route.ts — Admin image upload endpoint
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
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

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5 MB." },
        { status: 400 }
      );
    }

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const filename = `${randomUUID()}.${ext}`;
    const relativePath = `${folder}/${filename}`;

    // Try Supabase storage first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (supabaseUrl && serviceRoleKey && !serviceRoleKey.startsWith("placeholder") && serviceRoleKey.length > 20) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const buffer = Buffer.from(await file.arrayBuffer());
        const { error } = await supabase.storage
          .from("product-images")
          .upload(relativePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (!error) {
          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(relativePath);
          return NextResponse.json({ url: urlData.publicUrl, path: relativePath });
        }
        console.warn("Supabase upload failed, using local fallback:", error);
      } catch (supaErr) {
        console.warn("Supabase upload error, using local fallback:", supaErr);
      }
    }

    // Local fallback — save to /public/uploads/...
    const buffer = Buffer.from(await file.arrayBuffer());
    const publicDir = path.join(process.cwd(), "public", "uploads", folder);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDir, filename), buffer);

    const publicUrl = `/uploads/${folder}/${filename}`;
    return NextResponse.json({ url: publicUrl, path: relativePath });
  } catch (err: unknown) {
    console.error("Image upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
