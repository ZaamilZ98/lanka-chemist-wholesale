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
  excludeId: string,
): Promise<string> {
  let slug = baseSlug;
  let suffix = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .neq("id", excludeId)
      .limit(1);

    if (!data || data.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }
}

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

    const { data: category, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, parent_id, section, sort_order, is_active, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error || !category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Category detail error:", error);
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
    const { name, description, section, parent_id, is_active, sort_order } = body;

    const supabase = createServerClient();

    // Verify category exists
    const { data: existing, error: fetchErr } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // Handle name change (regenerate slug)
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updateData.name = name.trim();

      // Regenerate slug if name changed
      if (name.trim() !== existing.name) {
        const baseSlug = generateSlug(name.trim());
        if (!baseSlug) {
          return NextResponse.json({ error: "Name must contain at least one alphanumeric character" }, { status: 400 });
        }
        updateData.slug = await getUniqueSlug(supabase, baseSlug, id);
      }
    }

    // Handle description
    if (description !== undefined) {
      updateData.description = description && typeof description === "string" && description.trim()
        ? description.trim()
        : null;
    }

    // Handle section
    if (section !== undefined) {
      if (!VALID_SECTIONS.includes(section)) {
        return NextResponse.json(
          { error: `Section must be one of: ${VALID_SECTIONS.join(", ")}` },
          { status: 400 },
        );
      }
      updateData.section = section;
    }

    // Handle parent_id
    if (parent_id !== undefined) {
      if (parent_id === null) {
        updateData.parent_id = null;
      } else {
        // Prevent self-reference
        if (parent_id === id) {
          return NextResponse.json({ error: "Category cannot be its own parent" }, { status: 400 });
        }

        const { data: parentCat, error: parentErr } = await supabase
          .from("categories")
          .select("id")
          .eq("id", parent_id)
          .single();

        if (parentErr || !parentCat) {
          return NextResponse.json({ error: "Parent category not found" }, { status: 400 });
        }
        updateData.parent_id = parent_id;
      }
    }

    // Handle is_active
    if (is_active !== undefined) {
      if (typeof is_active !== "boolean") {
        return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 });
      }
      updateData.is_active = is_active;
    }

    // Handle sort_order
    if (sort_order !== undefined) {
      if (typeof sort_order !== "number" || !Number.isInteger(sort_order)) {
        return NextResponse.json({ error: "sort_order must be an integer" }, { status: 400 });
      }
      updateData.sort_order = sort_order;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No changes to apply" }, { status: 400 });
    }

    const { data: category, error: updateErr } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select("id, name, slug, description, parent_id, section, sort_order, is_active, created_at, updated_at")
      .single();

    if (updateErr || !category) {
      console.error("Update category error:", updateErr);
      return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Update category error:", error);
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

    // Verify category exists
    const { data: existing, error: fetchErr } = await supabase
      .from("categories")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if any products reference this category
    const { count, error: countErr } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (countErr) {
      console.error("Product count error:", countErr);
      return NextResponse.json({ error: "Failed to check category usage" }, { status: 500 });
    }

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${count} products use this category.` },
        { status: 400 },
      );
    }

    // Delete the category
    const { error: deleteErr } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (deleteErr) {
      console.error("Delete category error:", deleteErr);
      return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
