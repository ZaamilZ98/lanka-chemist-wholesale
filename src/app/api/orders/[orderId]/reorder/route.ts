import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import type { ReorderResponse, ReorderWarning } from "@/types/api";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/orders/[orderId]/reorder — Add order items to cart
 * Validates customer ownership and product availability
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;

  if (!UUID_RE.test(orderId)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    // Verify customer is approved
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

    // Fetch order and verify ownership
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, customer_id, order_number")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership — return 404 not 403 to prevent enumeration
    if (order.customer_id !== auth.sub) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch order items with current product info
    const { data: orderItems, error: itemsErr } = await supabase
      .from("order_items")
      .select(`
        id, product_id, product_name, quantity,
        product:products(id, generic_name, brand_name, stock_quantity, is_active, is_visible)
      `)
      .eq("order_id", orderId);

    if (itemsErr) {
      logError("Reorder fetch items", itemsErr);
      return NextResponse.json({ error: "Failed to fetch order items" }, { status: 500 });
    }

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ error: "Order has no items" }, { status: 400 });
    }

    // Fetch current cart items to merge quantities
    const { data: currentCart } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity")
      .eq("customer_id", auth.sub);

    const cartMap = new Map(
      (currentCart ?? []).map((item) => [item.product_id, item])
    );

    const warnings: ReorderWarning[] = [];
    let itemsAdded = 0;

    for (const item of orderItems) {
      const product = item.product as unknown as {
        id: string;
        generic_name: string;
        brand_name: string;
        stock_quantity: number;
        is_active: boolean;
        is_visible: boolean;
      } | null;

      const productName = item.product_name;

      // Product no longer exists or is unavailable
      if (!product || !product.is_active || !product.is_visible) {
        warnings.push({
          product_name: productName,
          reason: "unavailable",
        });
        continue;
      }

      // Product is out of stock
      if (product.stock_quantity <= 0) {
        warnings.push({
          product_name: productName,
          reason: "out_of_stock",
        });
        continue;
      }

      // Calculate quantity to add
      const existingCartItem = cartMap.get(product.id);
      const existingQty = existingCartItem?.quantity ?? 0;
      const requestedQty = item.quantity;
      const availableQty = product.stock_quantity - existingQty;

      if (availableQty <= 0) {
        // Already have max in cart
        warnings.push({
          product_name: productName,
          reason: "out_of_stock",
        });
        continue;
      }

      const qtyToAdd = Math.min(requestedQty, availableQty);

      if (qtyToAdd < requestedQty) {
        warnings.push({
          product_name: productName,
          reason: "quantity_reduced",
          original_quantity: requestedQty,
          added_quantity: qtyToAdd,
        });
      }

      if (existingCartItem) {
        // Update existing cart item
        const { error: updateErr } = await supabase
          .from("cart_items")
          .update({ quantity: existingQty + qtyToAdd })
          .eq("id", existingCartItem.id);

        if (updateErr) {
          logError("Reorder update cart", updateErr);
          continue;
        }
      } else {
        // Insert new cart item
        const { error: insertErr } = await supabase
          .from("cart_items")
          .insert({
            customer_id: auth.sub,
            product_id: product.id,
            quantity: qtyToAdd,
          });

        if (insertErr) {
          logError("Reorder insert cart", insertErr);
          continue;
        }
      }

      itemsAdded++;
    }

    const response: ReorderResponse = {
      success: itemsAdded > 0,
      items_added: itemsAdded,
      warnings,
    };

    return NextResponse.json(response);
  } catch (error) {
    logError("Reorder", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
