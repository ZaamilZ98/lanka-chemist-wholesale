import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import type { CartItemResponse, CartWarning } from "@/types/api";

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
 * GET /api/cart — Fetch cart with stock revalidation
 */
export async function GET() {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // Fetch cart items with product details
  const { data: rawItems, error } = await supabase
    .from("cart_items")
    .select(CART_ITEM_SELECT)
    .eq("customer_id", auth.sub)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 },
    );
  }

  const warnings: CartWarning[] = [];
  const validItems: CartItemResponse[] = [];
  const removeIds: string[] = [];
  const updates: { id: string; quantity: number }[] = [];

  for (const raw of rawItems ?? []) {
    const product = raw.product as unknown as CartItemResponse["product"] | null;

    // Product deleted or no longer active/visible
    if (!product || !product.is_active || !product.is_visible) {
      removeIds.push(raw.id);
      warnings.push({
        type: "product_unavailable",
        product_name: product?.generic_name ?? "Unknown product",
      });
      continue;
    }

    // Product out of stock
    if (product.stock_quantity <= 0) {
      removeIds.push(raw.id);
      warnings.push({
        type: "out_of_stock",
        product_name: product.generic_name,
        old_quantity: raw.quantity,
      });
      continue;
    }

    // Quantity exceeds available stock — clamp
    if (raw.quantity > product.stock_quantity) {
      const clamped = product.stock_quantity;
      updates.push({ id: raw.id, quantity: clamped });
      warnings.push({
        type: "quantity_reduced",
        product_name: product.generic_name,
        old_quantity: raw.quantity,
        new_quantity: clamped,
      });
      validItems.push({
        id: raw.id,
        product_id: raw.product_id,
        quantity: clamped,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
        product,
      });
      continue;
    }

    validItems.push({
      id: raw.id,
      product_id: raw.product_id,
      quantity: raw.quantity,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      product,
    });
  }

  // Apply removals and quantity adjustments in parallel
  if (removeIds.length > 0 || updates.length > 0) {
    const ops = [];
    if (removeIds.length > 0) {
      ops.push(
        supabase.from("cart_items").delete().in("id", removeIds).then(),
      );
    }
    for (const u of updates) {
      ops.push(
        supabase
          .from("cart_items")
          .update({ quantity: u.quantity })
          .eq("id", u.id)
          .then(),
      );
    }
    await Promise.all(ops);
  }

  return NextResponse.json({ items: validItems, warnings });
}

/**
 * POST /api/cart — Add item to cart (upsert)
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  let body: { product_id?: unknown; quantity?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const productId = typeof body.product_id === "string" ? body.product_id : "";
  const quantity =
    typeof body.quantity === "number" ? Math.floor(body.quantity) : 0;

  if (!UUID_RE.test(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }
  if (quantity < 1 || quantity > 9999) {
    return NextResponse.json(
      { error: "Quantity must be between 1 and 9999" },
      { status: 400 },
    );
  }

  // Validate product
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("id, stock_quantity, is_active, is_visible, section")
    .eq("id", productId)
    .single();

  if (prodErr || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 400 });
  }
  if (!product.is_active || !product.is_visible) {
    return NextResponse.json(
      { error: "Product is not available" },
      { status: 400 },
    );
  }
  if (product.section === "spc") {
    return NextResponse.json(
      { error: "SPC products cannot be added to cart" },
      { status: 400 },
    );
  }
  if (product.stock_quantity <= 0) {
    return NextResponse.json(
      { error: "Product is out of stock" },
      { status: 400 },
    );
  }

  // Check for existing cart item
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("customer_id", auth.sub)
    .eq("product_id", productId)
    .single();

  let cartItemId: string;
  const clampedMax = product.stock_quantity;

  if (existing) {
    // Update quantity (cumulative)
    const newQty = Math.min(existing.quantity + quantity, clampedMax);
    const { error: updateErr } = await supabase
      .from("cart_items")
      .update({ quantity: newQty })
      .eq("id", existing.id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update cart" },
        { status: 500 },
      );
    }
    cartItemId = existing.id;
  } else {
    // Insert new
    const newQty = Math.min(quantity, clampedMax);
    const { data: inserted, error: insertErr } = await supabase
      .from("cart_items")
      .insert({
        customer_id: auth.sub,
        product_id: productId,
        quantity: newQty,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      return NextResponse.json(
        { error: "Failed to add to cart" },
        { status: 500 },
      );
    }
    cartItemId = inserted.id;
  }

  // Fetch the full cart item to return
  const { data: cartItem, error: fetchErr } = await supabase
    .from("cart_items")
    .select(CART_ITEM_SELECT)
    .eq("id", cartItemId)
    .single();

  if (fetchErr || !cartItem) {
    return NextResponse.json(
      { error: "Failed to fetch cart item" },
      { status: 500 },
    );
  }

  const itemProduct = cartItem.product as unknown as CartItemResponse["product"];
  const item: CartItemResponse = {
    id: cartItem.id,
    product_id: cartItem.product_id,
    quantity: cartItem.quantity,
    created_at: cartItem.created_at,
    updated_at: cartItem.updated_at,
    product: itemProduct,
  };

  return NextResponse.json({ item }, { status: 201 });
}
