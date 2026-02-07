import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, verifyPassword, hashPassword } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { current_password, new_password } = body;

    if (!current_password || typeof current_password !== "string") {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }

    if (!new_password || typeof new_password !== "string") {
      return NextResponse.json({ error: "New password is required" }, { status: 400 });
    }

    if (new_password.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch current password hash
    const { data: adminUser, error: fetchErr } = await supabase
      .from("admin_users")
      .select("id, password_hash")
      .eq("id", admin.sub)
      .single();

    if (fetchErr || !adminUser) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Verify current password
    const valid = await verifyPassword(current_password, adminUser.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }

    // Hash and update
    const newHash = await hashPassword(new_password);
    const { error: updateErr } = await supabase
      .from("admin_users")
      .update({ password_hash: newHash })
      .eq("id", admin.sub);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
