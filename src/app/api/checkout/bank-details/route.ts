import { NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/checkout/bank-details — Fetch store bank details for transfers
 */
export async function GET() {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  const { data: settings } = await supabase
    .from("store_settings")
    .select("key, value")
    .in("key", [
      "bank_name",
      "bank_account_name",
      "bank_account_number",
      "bank_branch",
    ]);

  const get = (key: string) =>
    settings?.find((s) => s.key === key)?.value ?? "";

  return NextResponse.json({
    bank_name: get("bank_name"),
    bank_account_name: get("bank_account_name"),
    bank_account_number: get("bank_account_number"),
    bank_branch: get("bank_branch"),
  });
}
