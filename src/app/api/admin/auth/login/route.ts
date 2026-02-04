import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyPassword, signAdminToken, setAdminCookie } from "@/lib/auth";
import { checkRateLimit, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Rate limit using admin-prefixed key to avoid collision with customer logins
    const rateLimitMsg = checkRateLimit(ip, `admin:${email}`);
    if (rateLimitMsg) {
      return NextResponse.json({ error: rateLimitMsg }, { status: 429 });
    }

    const supabase = createServerClient();

    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("id, email, password_hash, name, is_active")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !admin) {
      recordFailedAttempt(ip, `admin:${email}`);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, admin.password_hash);
    if (!valid) {
      recordFailedAttempt(ip, `admin:${email}`);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (!admin.is_active) {
      return NextResponse.json(
        { error: "This admin account has been deactivated." },
        { status: 403 },
      );
    }

    clearAttempts(ip, `admin:${email}`);

    // Update last_login
    await supabase
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", admin.id);

    const token = signAdminToken(admin.id, admin.email);
    await setAdminCookie(token);

    return NextResponse.json({
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 },
    );
  }
}
