import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { VALID_ORDER_TRANSITIONS } from "@/lib/constants";
import { processOrderStatusChange } from "@/lib/order-notifications";

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

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `id, order_number, customer_id, status, delivery_method, delivery_fee,
         delivery_distance_km, preferred_delivery_date, subtotal, total,
         payment_method, payment_status, order_notes, admin_notes,
         cancelled_reason, invoice_url, created_at, updated_at, confirmed_at,
         dispatched_at, delivered_at,
         customers(id, contact_name, business_name, email, phone, customer_type),
         delivery_address:customer_addresses(address_line1, address_line2, city, district, postal_code),
         order_items(id, product_id, product_name, product_generic_name, product_sku, quantity, unit_price, total_price)`,
      )
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch status history with admin names
    const { data: history } = await supabase
      .from("order_status_history")
      .select("id, old_status, new_status, notes, changed_by, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: false });

    // Resolve admin names for status history
    const adminIds = [...new Set((history ?? []).map((h) => h.changed_by).filter(Boolean))] as string[];
    let adminMap: Record<string, string> = {};
    if (adminIds.length > 0) {
      const { data: admins } = await supabase
        .from("admin_users")
        .select("id, name")
        .in("id", adminIds);
      adminMap = Object.fromEntries((admins ?? []).map((a) => [a.id, a.name]));
    }

    const statusHistory = (history ?? []).map((h) => ({
      ...h,
      admin_name: h.changed_by ? (adminMap[h.changed_by] ?? null) : null,
    }));

    return NextResponse.json({
      ...order,
      customer: order.customers,
      delivery_address: order.delivery_address,
      items: order.order_items,
      status_history: statusHistory,
    });
  } catch (error) {
    console.error("Order detail error:", error);
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
    const { status, payment_status, notes, cancelled_reason } = body;

    const supabase = createServerClient();

    // Get current order
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("id, status, payment_status")
      .eq("id", id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // Handle status change
    if (status && status !== order.status) {
      const allowed = VALID_ORDER_TRANSITIONS[order.status] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { error: `Cannot change status from "${order.status}" to "${status}". Allowed: ${allowed.join(", ") || "none"}` },
          { status: 400 },
        );
      }

      updateData.status = status;

      // Set timestamps for specific transitions
      if (status === "confirmed") updateData.confirmed_at = new Date().toISOString();
      if (status === "dispatched") updateData.dispatched_at = new Date().toISOString();
      if (status === "delivered") updateData.delivered_at = new Date().toISOString();
      if (status === "cancelled") {
        if (!cancelled_reason?.trim()) {
          return NextResponse.json(
            { error: "Cancellation reason is required." },
            { status: 400 },
          );
        }
        updateData.cancelled_reason = cancelled_reason.trim();
      }

      // Insert status history
      await supabase.from("order_status_history").insert({
        order_id: id,
        old_status: order.status,
        new_status: status,
        notes: notes?.trim() || null,
        changed_by: admin.sub,
      });
    }

    // Handle payment status change
    if (payment_status && payment_status !== order.payment_status) {
      const validPaymentStatuses = ["pending", "paid", "refunded"];
      if (!validPaymentStatuses.includes(payment_status)) {
        return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
      }
      updateData.payment_status = payment_status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No changes to apply" }, { status: 400 });
    }

    const { data: updated, error: updateErr } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select("id, status, payment_status")
      .single();

    if (updateErr || !updated) {
      console.error("Order update error:", updateErr);
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    // Fire-and-forget: send status update email if status changed
    if (status && status !== order.status) {
      processOrderStatusChange({ orderId: id, newStatus: status, notes: notes?.trim() || null });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
