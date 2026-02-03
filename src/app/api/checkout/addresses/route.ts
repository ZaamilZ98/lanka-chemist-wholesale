import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { sanitizeString, SRI_LANKAN_DISTRICTS } from "@/lib/validate";

/**
 * GET /api/checkout/addresses — Fetch customer's saved addresses
 */
export async function GET() {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  // Verify approved
  const { data: customer } = await supabase
    .from("customers")
    .select("status, is_active")
    .eq("id", auth.sub)
    .single();

  if (!customer || !customer.is_active || customer.status !== "approved") {
    return NextResponse.json(
      { error: "Account not approved" },
      { status: 403 },
    );
  }

  const { data: addresses, error } = await supabase
    .from("customer_addresses")
    .select("id, label, address_line1, address_line2, city, district, postal_code, latitude, longitude, is_default, created_at")
    .eq("customer_id", auth.sub)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 },
    );
  }

  return NextResponse.json({ addresses: addresses ?? [] });
}

/**
 * POST /api/checkout/addresses — Add new address during checkout
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  // Verify approved
  const { data: customer } = await supabase
    .from("customers")
    .select("status, is_active")
    .eq("id", auth.sub)
    .single();

  if (!customer || !customer.is_active || customer.status !== "approved") {
    return NextResponse.json(
      { error: "Account not approved" },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const label = typeof body.label === "string" ? sanitizeString(body.label).slice(0, 100) : "Default";
  const addressLine1 = typeof body.address_line1 === "string" ? sanitizeString(body.address_line1) : "";
  const addressLine2 = typeof body.address_line2 === "string" ? sanitizeString(body.address_line2) : null;
  const city = typeof body.city === "string" ? sanitizeString(body.city) : "";
  const district = typeof body.district === "string" ? sanitizeString(body.district) : "";
  const postalCode = typeof body.postal_code === "string" ? sanitizeString(body.postal_code).slice(0, 10) : null;
  const setAsDefault = body.set_as_default === true;

  // Validate required fields
  if (!addressLine1) {
    return NextResponse.json({ error: "Address line 1 is required" }, { status: 400 });
  }
  if (!city) {
    return NextResponse.json({ error: "City is required" }, { status: 400 });
  }
  if (!district || !SRI_LANKAN_DISTRICTS.includes(district as (typeof SRI_LANKAN_DISTRICTS)[number])) {
    return NextResponse.json({ error: "Valid district is required" }, { status: 400 });
  }

  // If setting as default, clear existing defaults
  if (setAsDefault) {
    await supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", auth.sub);
  }

  const { data: address, error: insertErr } = await supabase
    .from("customer_addresses")
    .insert({
      customer_id: auth.sub,
      label: label || "Default",
      address_line1: addressLine1,
      address_line2: addressLine2,
      city,
      district,
      postal_code: postalCode,
      is_default: setAsDefault,
    })
    .select("id, label, address_line1, address_line2, city, district, postal_code, latitude, longitude, is_default, created_at")
    .single();

  if (insertErr || !address) {
    return NextResponse.json(
      { error: "Failed to save address" },
      { status: 500 },
    );
  }

  return NextResponse.json({ address }, { status: 201 });
}
