import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { sanitizeString, validatePhone } from "@/lib/validate";

/**
 * GET /api/account/profile - Get current customer profile
 */
export async function GET() {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select(
      `
      id, email, customer_type, contact_name, business_name,
      phone, whatsapp, slmc_number, nmra_license_number,
      status, is_active, created_at
    `,
    )
    .eq("id", auth.sub)
    .single();

  if (error || !customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ profile: customer });
}

/**
 * PATCH /api/account/profile - Update allowed profile fields
 * Editable: contact_name, phone, whatsapp, business_name
 * Read-only: email, customer_type, slmc_number, nmra_license_number, status
 */
export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Fetch current customer to verify existence
  const { data: customer, error: fetchError } = await supabase
    .from("customers")
    .select("id, is_active")
    .eq("id", auth.sub)
    .single();

  if (fetchError || !customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  if (!customer.is_active) {
    return NextResponse.json({ error: "Account is not active" }, { status: 403 });
  }

  // Build update object with only allowed fields
  const updates: Record<string, string> = {};
  const errors: Record<string, string> = {};

  // contact_name
  if (typeof body.contact_name === "string") {
    const name = sanitizeString(body.contact_name).slice(0, 100);
    if (name.length < 2) {
      errors.contact_name = "Name must be at least 2 characters";
    } else {
      updates.contact_name = name;
    }
  }

  // phone
  if (typeof body.phone === "string") {
    const phone = body.phone.trim();
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      errors.phone = phoneErr;
    } else {
      updates.phone = phone;
    }
  }

  // whatsapp (optional)
  if (body.whatsapp !== undefined) {
    if (body.whatsapp === "" || body.whatsapp === null) {
      updates.whatsapp = "";
    } else if (typeof body.whatsapp === "string") {
      const wa = body.whatsapp.trim();
      if (wa) {
        const waErr = validatePhone(wa);
        if (waErr) {
          errors.whatsapp = waErr;
        } else {
          updates.whatsapp = wa;
        }
      }
    }
  }

  // business_name (optional)
  if (body.business_name !== undefined) {
    if (body.business_name === "" || body.business_name === null) {
      updates.business_name = "";
    } else if (typeof body.business_name === "string") {
      updates.business_name = sanitizeString(body.business_name).slice(0, 200);
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("customers")
    .update(updates)
    .eq("id", auth.sub)
    .select(
      `
      id, email, customer_type, contact_name, business_name,
      phone, whatsapp, slmc_number, nmra_license_number,
      status, is_active, created_at
    `,
    )
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ profile: updated });
}
