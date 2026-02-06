import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { sanitizeString, SRI_LANKAN_DISTRICTS } from "@/lib/validate";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PATCH /api/account/addresses/[id] - Update an address
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
    return NextResponse.json({ error: "Invalid address ID" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("customer_addresses")
    .select("id, customer_id")
    .eq("id", id)
    .single();

  if (!existing || existing.customer_id !== auth.sub) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  // Build update object
  const updates: Record<string, string | boolean | null> = {};

  if (typeof body.label === "string") {
    updates.label = sanitizeString(body.label).slice(0, 100) || "Default";
  }

  if (typeof body.address_line1 === "string") {
    const addr1 = sanitizeString(body.address_line1);
    if (!addr1) {
      return NextResponse.json({ error: "Address line 1 is required" }, { status: 400 });
    }
    updates.address_line1 = addr1;
  }

  if (body.address_line2 !== undefined) {
    updates.address_line2 = typeof body.address_line2 === "string"
      ? sanitizeString(body.address_line2) || null
      : null;
  }

  if (typeof body.city === "string") {
    const city = sanitizeString(body.city);
    if (!city) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }
    updates.city = city;
  }

  if (typeof body.district === "string") {
    const district = sanitizeString(body.district);
    if (!SRI_LANKAN_DISTRICTS.includes(district as (typeof SRI_LANKAN_DISTRICTS)[number])) {
      return NextResponse.json({ error: "Valid district is required" }, { status: 400 });
    }
    updates.district = district;
  }

  if (body.postal_code !== undefined) {
    updates.postal_code = typeof body.postal_code === "string"
      ? sanitizeString(body.postal_code).slice(0, 10) || null
      : null;
  }

  // Handle set_as_default
  if (body.set_as_default === true) {
    // Clear other defaults first
    await supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", auth.sub)
      .neq("id", id);
    updates.is_default = true;
  } else if (body.set_as_default === false) {
    updates.is_default = false;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: updated, error: updateErr } = await supabase
    .from("customer_addresses")
    .update(updates)
    .eq("id", id)
    .select("id, label, address_line1, address_line2, city, district, postal_code, latitude, longitude, is_default, created_at")
    .single();

  if (updateErr || !updated) {
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }

  return NextResponse.json({ address: updated });
}

/**
 * DELETE /api/account/addresses/[id] - Delete an address
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
    return NextResponse.json({ error: "Invalid address ID" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("customer_addresses")
    .select("id, customer_id")
    .eq("id", id)
    .single();

  if (!existing || existing.customer_id !== auth.sub) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  const { error: deleteErr } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", id);

  if (deleteErr) {
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }

  return NextResponse.json({ message: "Address deleted" });
}
