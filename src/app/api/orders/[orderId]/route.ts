import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/orders/[orderId] — Fetch single order for confirmation page
 */
export async function GET(
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

  // Fetch order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_id, status, subtotal, delivery_fee, delivery_distance_km, total, delivery_method, delivery_address_id, payment_method, payment_status, order_notes, preferred_delivery_date, created_at",
    )
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Verify ownership — return 404 not 403 to prevent enumeration
  if (order.customer_id !== auth.sub) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Fetch order items
  const { data: items } = await supabase
    .from("order_items")
    .select(
      "id, product_id, product_name, product_generic_name, product_sku, quantity, unit_price, total_price",
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  // Fetch delivery address if set
  let deliveryAddress = null;
  if (order.delivery_address_id) {
    const { data: addr } = await supabase
      .from("customer_addresses")
      .select(
        "id, label, address_line1, address_line2, city, district, postal_code",
      )
      .eq("id", order.delivery_address_id)
      .single();
    deliveryAddress = addr;
  }

  // Remove customer_id from response
  const { customer_id: _, delivery_address_id: __, ...orderData } = order;

  return NextResponse.json({
    order: {
      ...orderData,
      items: items ?? [],
      delivery_address: deliveryAddress,
    },
  });
}
