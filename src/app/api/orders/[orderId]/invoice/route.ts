import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;
  const supabase = createServerClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, customer_id, invoice_url")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Verify ownership
  if (order.customer_id !== auth.sub) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!order.invoice_url) {
    return NextResponse.json({ error: "Invoice not yet generated" }, { status: 404 });
  }

  return NextResponse.redirect(order.invoice_url, 302);
}
