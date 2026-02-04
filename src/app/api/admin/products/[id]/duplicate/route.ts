import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(
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

    // Fetch original product
    const { data: original, error: fetchErr } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !original) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Generate unique SKU
    let newSku = original.sku ? `${original.sku}-COPY` : null;
    if (newSku) {
      // Ensure uniqueness (limit iterations to prevent runaway loops)
      let suffix = 1;
      let unique = false;
      const maxAttempts = 50;
      while (!unique && suffix <= maxAttempts) {
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("sku", newSku!)
          .limit(1);
        if (!existing || existing.length === 0) {
          unique = true;
        } else {
          suffix++;
          newSku = `${original.sku}-COPY-${suffix}`;
        }
      }
      if (!unique) {
        return NextResponse.json(
          { error: "Could not generate a unique SKU. Please duplicate manually." },
          { status: 409 },
        );
      }
    }

    // Clone product
    const { data: cloned, error: insertErr } = await supabase
      .from("products")
      .insert({
        generic_name: original.generic_name,
        brand_name: `${original.brand_name} (Copy)`,
        manufacturer_id: original.manufacturer_id,
        category_id: original.category_id,
        section: original.section,
        strength: original.strength,
        dosage_form: original.dosage_form,
        pack_size: original.pack_size,
        storage_conditions: original.storage_conditions,
        wholesale_price: original.wholesale_price,
        mrp: original.mrp,
        stock_quantity: 0,
        low_stock_threshold: original.low_stock_threshold,
        sku: newSku,
        barcode: null,
        is_prescription: original.is_prescription,
        is_active: false,
        is_visible: false,
        description: original.description,
        sort_order: original.sort_order,
      })
      .select("id, brand_name, sku")
      .single();

    if (insertErr || !cloned) {
      console.error("Product duplicate error:", insertErr);
      return NextResponse.json({ error: "Failed to duplicate product" }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: cloned }, { status: 201 });
  } catch (error) {
    console.error("Product duplicate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
