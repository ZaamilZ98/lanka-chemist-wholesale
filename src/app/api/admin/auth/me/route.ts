import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const adminPayload = await getAuthenticatedAdmin();
    if (!adminPayload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createServerClient();

    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("id, email, name, is_active")
      .eq("id", adminPayload.sub)
      .single();

    if (error || !admin || !admin.is_active) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (error) {
    console.error("Admin me error:", error);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
