import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";
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

    // Get client IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Rate limit check
    const rateLimitMsg = checkRateLimit(ip, email);
    if (rateLimitMsg) {
      return NextResponse.json({ error: rateLimitMsg }, { status: 429 });
    }

    const supabase = createServerClient();

    // Find customer — need password_hash for verification, but don't return it
    const { data: customer, error } = await supabase
      .from("customers")
      .select(
        "id, email, password_hash, customer_type, business_name, contact_name, slmc_number, nmra_license_number, phone, whatsapp, status, rejection_reason, is_active, created_at",
      )
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !customer) {
      recordFailedAttempt(ip, email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Verify password
    const valid = await verifyPassword(password, customer.password_hash);
    if (!valid) {
      recordFailedAttempt(ip, email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Check if active
    if (!customer.is_active) {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact support." },
        { status: 403 },
      );
    }

    // Clear rate limit on success
    clearAttempts(ip, email);

    // Sign JWT and set cookie
    const token = signToken(customer.id, customer.email);
    await setAuthCookie(token);

    // Return customer data — strip password_hash
    const { password_hash: _, ...safeCustomer } = customer;

    return NextResponse.json({ customer: safeCustomer });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 },
    );
  }
}
