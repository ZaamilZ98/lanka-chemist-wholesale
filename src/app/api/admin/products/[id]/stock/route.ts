import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

const VALID_REASONS = [
  "purchase", "sale", "return", "damage", "expired", "count_correction", "other",
];

export async function POST(
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
    const { quantity_change, reason, notes } = body;

    if (typeof quantity_change !== "number" || quantity_change === 0) {
      return NextResponse.json(
        { error: "quantity_change must be a non-zero number" },
        { status: 400 },
      );
    }

    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: `reason must be one of: ${VALID_REASONS.join(", ")}` },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // Get current stock
    const { data: product, error: fetchErr } = await supabase
      .from("products")
      .select("id, stock_quantity")
      .eq("id", id)
      .single();

    if (fetchErr || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const newQuantity = product.stock_quantity + quantity_change;
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: `Cannot reduce stock below 0. Current: ${product.stock_quantity}, change: ${quantity_change}` },
        { status: 400 },
      );
    }

    // Update stock
    const { error: updateErr } = await supabase
      .from("products")
      .update({ stock_quantity: newQuantity })
      .eq("id", id);

    if (updateErr) {
      console.error("Stock update error:", updateErr);
      return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
    }

    // Record stock movement
    const { error: movementErr } = await supabase
      .from("stock_movements")
      .insert({
        product_id: id,
        quantity_change,
        quantity_before: product.stock_quantity,
        quantity_after: newQuantity,
        reason,
        notes: notes?.trim() || null,
        created_by: admin.sub,
      });

    if (movementErr) {
      console.error("Stock movement insert error:", movementErr);
      // Stock was updated but movement failed — non-fatal
    }

    return NextResponse.json({
      success: true,
      stock_quantity: newQuantity,
      movement: {
        quantity_before: product.stock_quantity,
        quantity_after: newQuantity,
        quantity_change,
      },
    });
  } catch (error) {
    console.error("Stock adjustment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
