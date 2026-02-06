import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer, hashPassword, verifyPassword } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/validate";

/**
 * POST /api/account/change-password - Change customer password
 * Body: { current_password: string, new_password: string }
 */
export async function POST(request: NextRequest) {
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

  const currentPassword = typeof body.current_password === "string" ? body.current_password : "";
  const newPassword = typeof body.new_password === "string" ? body.new_password : "";

  if (!currentPassword) {
    return NextResponse.json({ error: "Current password is required" }, { status: 400 });
  }

  // Validate new password
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  // Check that new password is different from current
  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "New password must be different from current password" },
      { status: 400 },
    );
  }

  const supabase = createServerClient();

  // Fetch current password hash
  const { data: customer, error: fetchError } = await supabase
    .from("customers")
    .select("id, password_hash, is_active")
    .eq("id", auth.sub)
    .single();

  if (fetchError || !customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  if (!customer.is_active) {
    return NextResponse.json({ error: "Account is not active" }, { status: 403 });
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, customer.password_hash);
  if (!isValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  // Hash new password
  const newHash = await hashPassword(newPassword);

  // Update password
  const { error: updateError } = await supabase
    .from("customers")
    .update({ password_hash: newHash })
    .eq("id", auth.sub);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }

  return NextResponse.json({ message: "Password updated successfully" });
}
