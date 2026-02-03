import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: manufacturers, error } = await supabase
      .from("manufacturers")
      .select("id, name, slug, country")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch manufacturers" },
        { status: 500 },
      );
    }

    return NextResponse.json({ manufacturers });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
