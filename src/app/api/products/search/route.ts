import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function escapeIlike(str: string): string {
  return str.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}

export async function GET(request: NextRequest) {
  try {
    const rawQ = (request.nextUrl.searchParams.get("q")?.trim() || "").slice(0, 200);

    if (rawQ.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const q = escapeIlike(rawQ);
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, generic_name, brand_name, strength, dosage_form")
      .eq("is_active", true)
      .eq("is_visible", true)
      .or(
        `generic_name.ilike.%${q}%,brand_name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`,
      )
      .limit(8);

    if (error) {
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ suggestions: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
