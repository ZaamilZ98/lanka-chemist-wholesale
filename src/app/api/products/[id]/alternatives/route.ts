import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/products/[id]/alternatives
 * Returns up to 4 in-stock alternatives for an out-of-stock product.
 * Priority 1: Same generic name (different brand/strength)
 * Priority 2: Same category (if < 4 from priority 1)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    const supabase = createServerClient();

    // Fetch the source product to get generic_name and category_id
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, generic_name, category_id")
      .eq("id", id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    const selectFields = `
      id, generic_name, brand_name, strength, dosage_form, pack_size,
      wholesale_price, mrp, stock_quantity, is_prescription, section,
      total_sold,
      manufacturer:manufacturers(id, name, slug),
      category:categories(id, name, slug, section),
      images:product_images(id, url, alt_text, is_primary, sort_order)
    `;

    // Priority 1: Same generic name (case-insensitive), excluding current product
    const { data: sameGeneric } = await supabase
      .from("products")
      .select(selectFields)
      .ilike("generic_name", product.generic_name)
      .neq("id", id)
      .eq("is_active", true)
      .eq("is_visible", true)
      .gt("stock_quantity", 0)
      .order("stock_quantity", { ascending: false })
      .limit(4);

    const alternatives = sameGeneric ?? [];

    // Priority 2: Same category (if we have fewer than 4)
    if (alternatives.length < 4 && product.category_id) {
      const existingIds = new Set(alternatives.map((a) => a.id));
      const remaining = 4 - alternatives.length;

      const { data: sameCategory } = await supabase
        .from("products")
        .select(selectFields)
        .eq("category_id", product.category_id)
        .neq("id", id)
        .eq("is_active", true)
        .eq("is_visible", true)
        .gt("stock_quantity", 0)
        .order("total_sold", { ascending: false })
        .limit(remaining + 4); // Fetch extra in case of overlap

      if (sameCategory) {
        for (const item of sameCategory) {
          if (!existingIds.has(item.id)) {
            // Also exclude items with the same generic name (already in priority 1)
            const itemGeneric = item.generic_name?.toLowerCase() ?? "";
            const sourceGeneric = product.generic_name?.toLowerCase() ?? "";
            if (itemGeneric !== sourceGeneric) {
              alternatives.push(item);
              if (alternatives.length >= 4) break;
            }
          }
        }
      }
    }

    return NextResponse.json({ alternatives });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
