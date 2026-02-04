import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { generateInvoice } from "@/lib/invoice";

export const runtime = "nodejs";

// GET: Download existing invoice
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, invoice_url")
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!order.invoice_url) {
    return NextResponse.json({ error: "Invoice not yet generated" }, { status: 404 });
  }

  return NextResponse.redirect(order.invoice_url, 302);
}

// POST: Regenerate invoice
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();

  // Verify the order exists
  const { data: order, error } = await supabase
    .from("orders")
    .select("id")
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  try {
    const result = await generateInvoice(id);
    return NextResponse.json({ invoice_url: result.url });
  } catch (err) {
    console.error("Invoice regeneration error:", err);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
