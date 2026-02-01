import { NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ customer: null }, { status: 401 });
  }

  // Fetch fresh customer data (status may have changed since token was issued)
  const supabase = createServerClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .select(
      "id, email, customer_type, business_name, contact_name, slmc_number, nmra_license_number, phone, whatsapp, status, rejection_reason, is_active, created_at",
    )
    .eq("id", auth.sub)
    .single();

  if (error || !customer) {
    return NextResponse.json({ customer: null }, { status: 401 });
  }

  if (!customer.is_active) {
    return NextResponse.json({ customer: null }, { status: 403 });
  }

  return NextResponse.json({ customer });
}
