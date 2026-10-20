import { NextResponse } from "next/server";
import { getAdminRepository } from "@/lib/admin-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const repo = getAdminRepository();
    const products = await repo.getProducts();

    return NextResponse.json({ products });
  } catch (err: unknown) {
    console.error("Prices data endpoint error:", err);
    return NextResponse.json(
      { error: "Failed to load catalogue products", products: [] },
      { status: 500 }
    );
  }
}
