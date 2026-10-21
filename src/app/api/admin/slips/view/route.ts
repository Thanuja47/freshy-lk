import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getStorageAdminClient } from "@/lib/storage";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const extMimeMap: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get("path");

    if (!storagePath) {
      return new NextResponse("Missing storage path", { status: 400 });
    }

    // Handle data URLs
    if (storagePath.startsWith("data:")) {
      const parts = storagePath.split(";base64,");
      const mime = parts[0].replace("data:", "") || "image/jpeg";
      const buffer = Buffer.from(parts[1] || "", "base64");
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Content-Disposition": `inline; filename="slip.jpg"`,
        },
      });
    }

    const ext = path.extname(storagePath).toLowerCase();
    const defaultMime = extMimeMap[ext] || "application/octet-stream";

    // 1. Try Supabase storage if client configured
    const supabase = getStorageAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from("payment-slips")
          .download(storagePath);

        if (!error && data) {
          const arrayBuf = await data.arrayBuffer();
          const mimeType = data.type || defaultMime;
          return new NextResponse(new Uint8Array(arrayBuf), {
            status: 200,
            headers: {
              "Content-Type": mimeType,
              "Content-Disposition": `inline; filename="${path.basename(storagePath)}"`,
            },
          });
        }
      } catch (err) {
        console.warn("Supabase download error in route, checking local storage:", err);
      }
    }

    // 2. Check Local fallback storage directory
    const localFullPath = path.join(process.cwd(), "storage", storagePath);
    if (fs.existsSync(localFullPath)) {
      const fileBuf = fs.readFileSync(localFullPath);
      return new NextResponse(new Uint8Array(fileBuf), {
        status: 200,
        headers: {
          "Content-Type": defaultMime,
          "Content-Disposition": `inline; filename="${path.basename(storagePath)}"`,
        },
      });
    }

    return new NextResponse("File not found", { status: 404 });
  } catch (err: unknown) {
    console.error("Slip view error:", err);
    return new NextResponse("Unauthorized or error viewing slip", { status: 401 });
  }
}
