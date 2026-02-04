import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
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
      console.error("Admin setup count error:", countError);
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
      console.error("Admin setup insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create admin account" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Admin account created successfully" });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json(
      { error: "Setup failed. Please try again." },
      { status: 500 },
    );
  }
}
