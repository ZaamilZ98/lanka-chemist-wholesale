import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearAdminCookie();
    return NextResponse.json({ message: "Logged out" });
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json({ message: "Logged out" });
  }
}
