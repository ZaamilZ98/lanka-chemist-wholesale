import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

const VALID_SECTIONS = ["medicines", "surgical", "equipment", "spc"];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getUniqueSlug(
  supabase: ReturnType<typeof createServerClient>,
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  let slug = baseSlug;
  let suffix = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let query = supabase
      .from("categories")
      .select("id")
      .eq("slug", slug);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data } = await query.limit(1);

    if (!data || data.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }
}

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createServerClient();

    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, parent_id, section, sort_order, is_active, created_at, updated_at")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Fetch categories error:", error);
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Categories list error:", error);
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
    const { name, section, description, parent_id, is_active } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!section || typeof section !== "string" || !VALID_SECTIONS.includes(section)) {
      return NextResponse.json(
        { error: `Section is required and must be one of: ${VALID_SECTIONS.join(", ")}` },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // Generate unique slug
    const baseSlug = generateSlug(name.trim());
    if (!baseSlug) {
      return NextResponse.json({ error: "Name must contain at least one alphanumeric character" }, { status: 400 });
    }
    const slug = await getUniqueSlug(supabase, baseSlug);

    // Validate parent_id if provided
    if (parent_id) {
      const { data: parentCat, error: parentErr } = await supabase
        .from("categories")
        .select("id")
        .eq("id", parent_id)
        .single();

      if (parentErr || !parentCat) {
        return NextResponse.json({ error: "Parent category not found" }, { status: 400 });
      }
    }

    const insertData: Record<string, unknown> = {
      name: name.trim(),
      slug,
      section,
      is_active: is_active !== undefined ? is_active : true,
    };

    if (description && typeof description === "string" && description.trim()) {
      insertData.description = description.trim();
    }

    if (parent_id) {
      insertData.parent_id = parent_id;
    }

    const { data: category, error } = await supabase
      .from("categories")
      .insert(insertData)
      .select("id, name, slug, description, parent_id, section, sort_order, is_active, created_at, updated_at")
      .single();

    if (error) {
      console.error("Create category error:", error);
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
