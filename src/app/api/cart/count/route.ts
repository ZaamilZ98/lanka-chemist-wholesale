import { NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/cart/count — Lightweight count for header badge
 */
export async function GET() {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ count: 0 });
  }

  const supabase = createServerClient();

  const { count, error } = await supabase
    .from("cart_items")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", auth.sub);

  if (error) {
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
