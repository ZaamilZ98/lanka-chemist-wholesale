import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "updates array is required" }, { status: 400 });
    }

    if (updates.length > 100) {
      return NextResponse.json({ error: "Maximum 100 products per batch" }, { status: 400 });
    }

    // Validate each update
    for (const update of updates) {
      if (!update.id || typeof update.price !== "number" || update.price <= 0) {
        return NextResponse.json(
          { error: `Invalid update: each item needs an id and price > 0` },
          { status: 400 },
        );
      }
    }

    const supabase = createServerClient();
    let updatedCount = 0;

    // Update each product's price
    for (const update of updates) {
      const { error } = await supabase
        .from("products")
        .update({ wholesale_price: update.price })
        .eq("id", update.id);

      if (!error) updatedCount++;
    }

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      total: updates.length,
    });
  } catch (error) {
    console.error("Bulk price update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
