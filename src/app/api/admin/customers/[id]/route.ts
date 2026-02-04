import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { processCustomerStatusChange } from "@/lib/order-notifications";

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

    const { data: customer, error } = await supabase
      .from("customers")
      .select(
        `id, email, customer_type, business_name, contact_name,
         slmc_number, nmra_license_number, phone, whatsapp,
         status, rejection_reason, admin_notes, is_active,
         created_at, updated_at,
         verification_documents(id, document_type, file_url, file_name, uploaded_at),
         customer_addresses(id, label, address_line1, address_line2, city, district, postal_code, is_default)`,
      )
      .eq("id", id)
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Also fetch recent orders for this customer
    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({ ...customer, recent_orders: orders ?? [] });
  } catch (error) {
    console.error("Customer detail error:", error);
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
    const { status, rejection_reason, admin_notes } = body;

    if (!status || !["approved", "rejected", "suspended"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be approved, rejected, or suspended." },
        { status: 400 },
      );
    }

    if ((status === "rejected" || status === "suspended") && !rejection_reason?.trim()) {
      return NextResponse.json(
        { error: "Reason is required when rejecting or suspending a customer." },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // Build update object
    const updateData: Record<string, unknown> = { status };

    if (status === "approved") {
      updateData.rejection_reason = null;
    } else {
      updateData.rejection_reason = rejection_reason?.trim() || null;
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes?.trim() || null;
    }

    const { data, error } = await supabase
      .from("customers")
      .update(updateData)
      .eq("id", id)
      .select("id, status, contact_name")
      .single();

    if (error || !data) {
      console.error("Customer update error:", error);
      return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
    }

    // Fire-and-forget: send customer status email
    processCustomerStatusChange({
      customerId: id,
      newStatus: status,
      reason: rejection_reason?.trim() || null,
    });

    return NextResponse.json({ success: true, customer: data });
  } catch (error) {
    console.error("Customer update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
