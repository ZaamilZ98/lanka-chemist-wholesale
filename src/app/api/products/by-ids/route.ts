import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/products/by-ids
 * Fetch multiple products by their IDs (for recently viewed, etc.)
 * Body: { ids: string[] }
 * Returns active/visible products only
 */
export async function POST(request: NextRequest) {
  try {
    let body: { ids?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.ids)) {
      return NextResponse.json(
        { error: "ids must be an array" },
        { status: 400 },
      );
    }

    // Validate and limit IDs
    const ids = body.ids
      .filter((id): id is string => typeof id === "string" && UUID_RE.test(id))
      .slice(0, 20);

    if (ids.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const supabase = createServerClient();

    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        id, generic_name, brand_name, strength, dosage_form, pack_size,
        wholesale_price, mrp, stock_quantity, is_prescription, section,
        total_sold,
        manufacturer:manufacturers(id, name, slug),
        category:categories(id, name, slug, section),
        images:product_images(id, url, alt_text, is_primary, sort_order)
      `,
      )
      .in("id", ids)
      .eq("is_active", true)
      .eq("is_visible", true);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 },
      );
    }

    // Preserve the order of the requested IDs
    const productMap = new Map((products ?? []).map((p) => [p.id, p]));
    const orderedProducts = ids
      .map((id) => productMap.get(id))
      .filter((p): p is NonNullable<typeof p> => p != null);

    return NextResponse.json({ products: orderedProducts });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
