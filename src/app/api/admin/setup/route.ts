import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth";
import { checkIpRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

const SETUP_MAX_ATTEMPTS = 5;
const SETUP_WINDOW_MINUTES = 15;

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Check rate limit
  const rateLimitError = checkIpRateLimit(ip, "admin-setup", SETUP_MAX_ATTEMPTS, SETUP_WINDOW_MINUTES);
  if (rateLimitError) {
    return NextResponse.json({ error: rateLimitError }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // Check if any admin user already exists
    const { count, error: countError } = await supabase
      .from("admin_users")
      .select("id", { count: "exact", head: true });

    if (countError) {
      logError("Admin setup", countError);
      return NextResponse.json(
        { error: "Failed to check admin status" },
        { status: 500 },
      );
    }

    if (count && count > 0) {
      return NextResponse.json(
        { error: "An admin account already exists. Setup is disabled." },
        { status: 403 },
      );
    }

    const passwordHash = await hashPassword(password);

    const { error: insertError } = await supabase
      .from("admin_users")
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        name: name.trim(),
        is_active: true,
      });

    if (insertError) {
      logError("Admin setup", insertError);
      return NextResponse.json(
        { error: "Failed to create admin account" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Admin account created successfully" });
  } catch (error) {
    logError("Admin setup", error);
    return NextResponse.json(
      { error: "Setup failed. Please try again." },
      { status: 500 },
    );
  }
}
