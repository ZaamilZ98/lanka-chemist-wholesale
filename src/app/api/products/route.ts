import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

// Escape special characters for Supabase ilike patterns
function escapeIlike(str: string): string {
  return str.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rawQ = (searchParams.get("q")?.trim() || "").slice(0, 200);
    const q = escapeIlike(rawQ);

    const VALID_SECTIONS = ["medicines", "surgical", "equipment", "spc"];
    const VALID_SORTS = ["name_asc", "name_desc", "price_asc", "price_desc", "newest", "popular"];
    const VALID_DOSAGE_FORMS = [
      "tablet", "capsule", "syrup", "suspension", "injection", "cream",
      "ointment", "gel", "drops", "inhaler", "suppository", "patch",
      "powder", "solution", "spray", "other",
    ];

    const sectionParam = searchParams.get("section") || "";
    const section = VALID_SECTIONS.includes(sectionParam) ? sectionParam : "";
    const categorySlug = searchParams.get("category") || "";
    const manufacturerSlug = searchParams.get("manufacturer") || "";
    const dosageFormParam = searchParams.get("dosage_form") || "";
    const dosageForm = VALID_DOSAGE_FORMS.includes(dosageFormParam) ? dosageFormParam : "";
    const prescriptionParam = searchParams.get("prescription") || "";
    const prescription = ["true", "false"].includes(prescriptionParam) ? prescriptionParam : "";
    const inStock = searchParams.get("in_stock") || "";
    const sortParam = searchParams.get("sort") || "name_asc";
    const sort = VALID_SORTS.includes(sortParam) ? sortParam : "name_asc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("per_page") || String(DEFAULT_PAGE_SIZE), 10)),
    );

    const supabase = createServerClient();

    // Resolve category slug to ID
    let categoryId: string | null = null;
    if (categorySlug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();
      categoryId = cat?.id ?? null;
    }

    // Resolve manufacturer slug to ID
    let manufacturerId: string | null = null;
    if (manufacturerSlug) {
      const { data: mfr } = await supabase
        .from("manufacturers")
        .select("id")
        .eq("slug", manufacturerSlug)
        .single();
      manufacturerId = mfr?.id ?? null;
    }

    // When searching, also find matching manufacturers and categories
    let searchManufacturerIds: string[] = [];
    let searchCategoryIds: string[] = [];
    if (q) {
      const [mfrResult, catResult] = await Promise.all([
        supabase
          .from("manufacturers")
          .select("id")
          .ilike("name", `%${q}%`)
          .limit(20),
        supabase
          .from("categories")
          .select("id")
          .ilike("name", `%${q}%`)
          .limit(20),
      ]);
      searchManufacturerIds = (mfrResult.data ?? []).map((m) => m.id);
      searchCategoryIds = (catResult.data ?? []).map((c) => c.id);
    }

    // Build query
    let query = supabase
      .from("products")
      .select(
        `
        id, generic_name, brand_name, strength, dosage_form, pack_size,
        wholesale_price, mrp, stock_quantity, is_prescription, section,
        sku, total_sold, created_at,
        manufacturer:manufacturers(id, name, slug),
        category:categories(id, name, slug, section),
        images:product_images(id, url, alt_text, is_primary, sort_order)
      `,
        { count: "exact" },
      )
      .eq("is_active", true)
      .eq("is_visible", true);

    // Apply search across product fields + manufacturer/category names
    if (q) {
      const orParts = [
        `generic_name.ilike.%${q}%`,
        `brand_name.ilike.%${q}%`,
        `sku.ilike.%${q}%`,
        `barcode.ilike.%${q}%`,
      ];
      if (searchManufacturerIds.length > 0) {
        orParts.push(`manufacturer_id.in.(${searchManufacturerIds.join(",")})`);
      }
      if (searchCategoryIds.length > 0) {
        orParts.push(`category_id.in.(${searchCategoryIds.join(",")})`);
      }
      query = query.or(orParts.join(","));
    }

    if (section) {
      query = query.eq("section", section);
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (manufacturerId) {
      query = query.eq("manufacturer_id", manufacturerId);
    }

    if (dosageForm) {
      query = query.eq("dosage_form", dosageForm);
    }

    if (prescription === "true") {
      query = query.eq("is_prescription", true);
    } else if (prescription === "false") {
      query = query.eq("is_prescription", false);
    }

    if (inStock === "true") {
      query = query.gt("stock_quantity", 0);
    }

    // Apply sorting
    switch (sort) {
      case "name_desc":
        query = query.order("generic_name", { ascending: false });
        break;
      case "price_asc":
        query = query.order("wholesale_price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("wholesale_price", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "popular":
        query = query.order("total_sold", { ascending: false });
        break;
      case "name_asc":
      default:
        query = query.order("generic_name", { ascending: true });
        break;
    }

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data: products, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 },
      );
    }

    const total = count ?? 0;

    return NextResponse.json({
      products: products ?? [],
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
