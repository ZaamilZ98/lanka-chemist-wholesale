import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

function escapePostgrestValue(str: string): string {
  return str.replace(/[,().\\]/g, (ch) => `\\${ch}`);
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10)),
    );
    const categoryId = searchParams.get("category_id") || "";
    const manufacturerId = searchParams.get("manufacturer_id") || "";
    const isActive = searchParams.get("is_active") || "";
    const lowStock = searchParams.get("low_stock") || "";
    const search = searchParams.get("search")?.trim().slice(0, 200) || "";

    const supabase = createServerClient();

    let query = supabase
      .from("products")
      .select(
        `id, brand_name, generic_name, sku, wholesale_price, stock_quantity,
         is_active, section, dosage_form, low_stock_threshold,
         category:categories(name),
         manufacturer:manufacturers(name)`,
        { count: "exact" },
      );

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (manufacturerId) {
      query = query.eq("manufacturer_id", manufacturerId);
    }

    if (isActive === "true") {
      query = query.eq("is_active", true);
    } else if (isActive === "false") {
      query = query.eq("is_active", false);
    }

    if (search) {
      const safe = escapePostgrestValue(search);
      query = query.or(
        `brand_name.ilike.%${safe}%,generic_name.ilike.%${safe}%,sku.ilike.%${safe}%`,
      );
    }

    query = query.order("created_at", { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: products, count, error } = await query;

    if (error) {
      console.error("Product list error:", error);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    // Map to AdminProductListItem format, applying low_stock filter in JS
    let mapped = (products ?? []).map((p) => {
      const category = p.category as unknown as { name: string } | null;
      const manufacturer = p.manufacturer as unknown as { name: string } | null;
      return {
        id: p.id,
        brand_name: p.brand_name,
        generic_name: p.generic_name,
        sku: p.sku,
        wholesale_price: p.wholesale_price,
        stock_quantity: p.stock_quantity,
        is_active: p.is_active,
        category_name: category?.name ?? null,
        manufacturer_name: manufacturer?.name ?? null,
        section: p.section,
        dosage_form: p.dosage_form,
        low_stock_threshold: p.low_stock_threshold,
      };
    });

    // Low stock filter applied in JS since it compares two columns
    if (lowStock === "true") {
      mapped = mapped.filter((p) => p.stock_quantity <= p.low_stock_threshold);
    }

    return NextResponse.json({
      data: mapped,
      total: lowStock === "true" ? mapped.length : (count ?? 0),
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Product list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      brand_name, generic_name, sku, barcode, description, category_id,
      manufacturer_id, section, dosage_form, strength, pack_size,
      wholesale_price, mrp, stock_quantity, low_stock_threshold,
      is_prescription, storage_conditions, is_active, is_visible, sort_order,
    } = body;

    // Validate required fields
    if (!brand_name?.trim()) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }
    if (!generic_name?.trim()) {
      return NextResponse.json({ error: "Generic name is required" }, { status: 400 });
    }
    if (wholesale_price === undefined || wholesale_price <= 0) {
      return NextResponse.json({ error: "Price must be greater than 0" }, { status: 400 });
    }
    if (stock_quantity === undefined || stock_quantity < 0) {
      return NextResponse.json({ error: "Stock quantity cannot be negative" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Check SKU uniqueness if provided
    if (sku?.trim()) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("sku", sku.trim())
        .limit(1);
      if (existing && existing.length > 0) {
        return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 400 });
      }
    }

    const insertData: Record<string, unknown> = {
      brand_name: brand_name.trim(),
      generic_name: generic_name.trim(),
      wholesale_price,
      stock_quantity: stock_quantity ?? 0,
      low_stock_threshold: low_stock_threshold ?? 10,
      is_prescription: is_prescription ?? false,
      is_active: is_active ?? true,
      is_visible: is_visible ?? true,
      section: section || "medicines",
      sort_order: sort_order ?? 0,
    };

    if (sku?.trim()) insertData.sku = sku.trim();
    if (barcode?.trim()) insertData.barcode = barcode.trim();
    if (description?.trim()) insertData.description = description.trim();
    if (category_id) insertData.category_id = category_id;
    if (manufacturer_id) insertData.manufacturer_id = manufacturer_id;
    if (dosage_form) insertData.dosage_form = dosage_form;
    if (strength?.trim()) insertData.strength = strength.trim();
    if (pack_size?.trim()) insertData.pack_size = pack_size.trim();
    if (mrp !== undefined && mrp !== null) insertData.mrp = mrp;
    if (storage_conditions?.trim()) insertData.storage_conditions = storage_conditions.trim();

    const { data: product, error } = await supabase
      .from("products")
      .insert(insertData)
      .select("id, brand_name, sku")
      .single();

    if (error) {
      console.error("Product create error:", error);
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
