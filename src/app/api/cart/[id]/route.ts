import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import type { CartItemResponse } from "@/types/api";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CART_ITEM_SELECT = `
  id, product_id, quantity, created_at, updated_at,
  product:products(
    id, generic_name, brand_name, strength, dosage_form, pack_size,
    wholesale_price, stock_quantity, is_active, is_visible, section,
    images:product_images(id, url, alt_text, is_primary, sort_order)
  )
`;

/**
 * PATCH /api/cart/:id — Update cart item quantity
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid cart item ID" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Verify customer is approved and active
  const { data: customer } = await supabase
    .from("customers")
    .select("status, is_active")
    .eq("id", auth.sub)
    .single();

  if (!customer || !customer.is_active || customer.status !== "approved") {
    return NextResponse.json(
      { error: "Account not approved for ordering" },
      { status: 403 },
    );
  }

  // Parse and validate body
  let body: { quantity?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const quantity =
    typeof body.quantity === "number" ? Math.floor(body.quantity) : 0;

  if (quantity < 1 || quantity > 9999) {
    return NextResponse.json(
      { error: "Quantity must be between 1 and 9999" },
      { status: 400 },
    );
  }

  // Fetch cart item — verify ownership
  const { data: cartItem, error: fetchErr } = await supabase
    .from("cart_items")
    .select("id, customer_id, product_id")
    .eq("id", id)
    .single();

  if (fetchErr || !cartItem) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }
  if (cartItem.customer_id !== auth.sub) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  // Fetch product for stock validation
  const { data: product } = await supabase
    .from("products")
    .select("id, stock_quantity, is_active, is_visible")
    .eq("id", cartItem.product_id)
    .single();

  if (!product || !product.is_active || !product.is_visible) {
    // Product no longer available — remove from cart
    await supabase.from("cart_items").delete().eq("id", id);
    return NextResponse.json(
      { error: "Product is no longer available" },
      { status: 400 },
    );
  }

  if (product.stock_quantity <= 0) {
    await supabase.from("cart_items").delete().eq("id", id);
    return NextResponse.json(
      { error: "Product is out of stock" },
      { status: 400 },
    );
  }

  // Clamp to stock
  const clamped = Math.min(quantity, product.stock_quantity);

  const { error: updateErr } = await supabase
    .from("cart_items")
    .update({ quantity: clamped })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json(
      { error: "Failed to update cart item" },
      { status: 500 },
    );
  }

  // Return updated item
  const { data: updated, error: refetchErr } = await supabase
    .from("cart_items")
    .select(CART_ITEM_SELECT)
    .eq("id", id)
    .single();

  if (refetchErr || !updated) {
    return NextResponse.json(
      { error: "Failed to fetch updated item" },
      { status: 500 },
    );
  }

  const updatedProduct = updated.product as unknown as CartItemResponse["product"];
  const item: CartItemResponse = {
    id: updated.id,
    product_id: updated.product_id,
    quantity: updated.quantity,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
    product: updatedProduct,
  };

  return NextResponse.json({ item });
}

/**
 * DELETE /api/cart/:id — Remove item from cart
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid cart item ID" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Delete only if owned by authenticated customer
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", id)
    .eq("customer_id", auth.sub);

  if (error) {
    return NextResponse.json(
      { error: "Failed to remove cart item" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
