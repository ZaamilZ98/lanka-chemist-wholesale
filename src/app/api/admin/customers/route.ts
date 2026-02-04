import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

function escapePostgrestValue(str: string): string {
  return str.replace(/[,().\\]/g, (ch) => `\\${ch}`);
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10)),
    );
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const search = searchParams.get("search")?.trim().slice(0, 200) || "";

    const supabase = createServerClient();

    let query = supabase
      .from("customers")
      .select(
        "id, business_name, contact_name, email, phone, customer_type, status, created_at",
        { count: "exact" },
      );

    if (status && ["pending", "approved", "rejected", "suspended"].includes(status)) {
      query = query.eq("status", status);
    }

    if (type && ["doctor", "dentist", "pharmacy", "clinic", "dispensary", "other"].includes(type)) {
      query = query.eq("customer_type", type);
    }

    if (search) {
      const safe = escapePostgrestValue(search);
      query = query.or(
        `contact_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%,business_name.ilike.%${safe}%`,
      );
    }

    query = query.order("created_at", { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error("Customer list error:", error);
      return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Customer list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
