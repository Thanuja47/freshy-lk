import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminRepository } from "@/lib/admin-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const repo = getAdminRepository();
    const products = await repo.getProducts();

    return NextResponse.json({ products });
  } catch (err: unknown) {
    console.error("Prices data endpoint error:", err);
    return NextResponse.json(
      { error: "Unauthorized or failed to load catalogue products", products: [] },
      { status: 401 }
    );
  }
}
