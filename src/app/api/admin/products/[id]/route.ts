import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServerClient();

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `*, category:categories(name), manufacturer:manufacturers(name),
         images:product_images(id, url, alt_text, is_primary, sort_order)`,
      )
      .eq("id", id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Fetch recent stock movements
    const { data: movements } = await supabase
      .from("stock_movements")
      .select("id, quantity_change, quantity_before, quantity_after, reason, notes, created_by, created_at")
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Resolve admin names
    const adminIds = [...new Set((movements ?? []).map((m) => m.created_by).filter(Boolean))] as string[];
    let adminMap: Record<string, string> = {};
    if (adminIds.length > 0) {
      const { data: admins } = await supabase
        .from("admin_users")
        .select("id, name")
        .in("id", adminIds);
      adminMap = Object.fromEntries((admins ?? []).map((a) => [a.id, a.name]));
    }

    const category = product.category as unknown as { name: string } | null;
    const manufacturer = product.manufacturer as unknown as { name: string } | null;

    return NextResponse.json({
      ...product,
      category_name: category?.name ?? null,
      manufacturer_name: manufacturer?.name ?? null,
      stock_movements: (movements ?? []).map((m) => ({
        ...m,
        admin_name: m.created_by ? (adminMap[m.created_by] ?? null) : null,
      })),
    });
  } catch (error) {
    console.error("Product detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    // Build update from provided fields
    const allowedFields = [
      "brand_name", "generic_name", "sku", "barcode", "description",
      "category_id", "manufacturer_id", "section", "dosage_form",
      "strength", "pack_size", "wholesale_price", "mrp",
      "low_stock_threshold", "is_prescription", "storage_conditions",
      "is_active", "is_visible", "sort_order",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Validate price if changed
    if (updateData.wholesale_price !== undefined && (updateData.wholesale_price as number) <= 0) {
      return NextResponse.json({ error: "Price must be greater than 0" }, { status: 400 });
    }

    // Check SKU uniqueness if changed
    if (updateData.sku !== undefined && updateData.sku) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("sku", updateData.sku as string)
        .neq("id", id)
        .limit(1);
      if (existing && existing.length > 0) {
        return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 400 });
      }
    }

    const { data: product, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select("id, brand_name, sku")
      .single();

    if (error || !product) {
      console.error("Product update error:", error);
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServerClient();

    // Check if product has order references
    const { count } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("product_id", id);

    if (count && count > 0) {
      // Soft delete only — deactivate
      const { error } = await supabase
        .from("products")
        .update({ is_active: false, is_visible: false })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: "Failed to deactivate product" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        soft_delete: true,
        message: "Product has been deactivated (it has existing order references).",
      });
    }

    // Hard delete
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Product delete error:", error);
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }

    return NextResponse.json({ success: true, soft_delete: false });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
