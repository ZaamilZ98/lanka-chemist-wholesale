import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    const supabase = createServerClient();

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `
        id, generic_name, brand_name, strength, dosage_form, pack_size,
        storage_conditions, wholesale_price, mrp, stock_quantity,
        low_stock_threshold, sku, barcode, is_prescription, is_active,
        is_visible, description, section, total_sold, created_at, updated_at,
        manufacturer:manufacturers(id, name, slug, country),
        category:categories(id, name, slug, section),
        images:product_images(id, url, alt_text, is_primary, sort_order)
      `,
      )
      .eq("id", id)
      .eq("is_active", true)
      .eq("is_visible", true)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    // Fetch related products: same category or same generic name, excluding this product
    const relatedSelect = `
      id, generic_name, brand_name, strength, dosage_form, pack_size,
      wholesale_price, mrp, stock_quantity, is_prescription, section,
      total_sold,
      manufacturer:manufacturers(id, name, slug),
      category:categories(id, name, slug, section),
      images:product_images(id, url, alt_text, is_primary, sort_order)
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let related: any[] = [];

    // Extract category ID from the joined data
    const categoryData = product.category as unknown;
    const categoryId =
      categoryData && typeof categoryData === "object" && "id" in (categoryData as Record<string, unknown>)
        ? (categoryData as { id: string }).id
        : null;

    if (categoryId) {
      const { data: relatedByCat } = await supabase
        .from("products")
        .select(relatedSelect)
        .eq("is_active", true)
        .eq("is_visible", true)
        .eq("category_id", categoryId)
        .neq("id", id)
        .limit(4);

      related = relatedByCat ?? [];
    }

    // If we don't have 4 related products, fill with same generic name
    if (related.length < 4) {
      const { data: relatedByName } = await supabase
        .from("products")
        .select(relatedSelect)
        .eq("is_active", true)
        .eq("is_visible", true)
        .ilike("generic_name", product.generic_name)
        .neq("id", id)
        .limit(4 - related.length);

      if (relatedByName) {
        const existingIds = new Set(related.map((r: { id: string }) => r.id));
        for (const item of relatedByName) {
          if (!existingIds.has(item.id)) {
            related.push(item);
          }
        }
      }
    }

    return NextResponse.json({ product, related });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
