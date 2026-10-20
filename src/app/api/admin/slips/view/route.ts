import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getStorageAdminClient } from "@/lib/storage";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get("path");

    if (!storagePath) {
      return new NextResponse("Missing storage path", { status: 400 });
    }

    const supabase = getStorageAdminClient();
    if (supabase) {
      const { data, error } = await supabase.storage
        .from("payment-slips")
        .download(storagePath);

      if (!error && data) {
        const arrayBuf = await data.arrayBuffer();
        const mimeType = data.type || "application/octet-stream";
        return new NextResponse(new Uint8Array(arrayBuf), {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Content-Disposition": `inline; filename="${path.basename(storagePath)}"`,
          },
        });
      }
    }

    // Local fallback
    const localFullPath = path.join(process.cwd(), "storage", storagePath);
    if (fs.existsSync(localFullPath)) {
      const fileBuf = fs.readFileSync(localFullPath);
      return new NextResponse(new Uint8Array(fileBuf), {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
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
