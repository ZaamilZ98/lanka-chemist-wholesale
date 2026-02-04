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
    const paymentStatus = searchParams.get("payment_status") || "";
    const search = searchParams.get("search")?.trim().slice(0, 200) || "";
    const dateFrom = searchParams.get("date_from") || "";
    const dateTo = searchParams.get("date_to") || "";

    const supabase = createServerClient();

    let query = supabase
      .from("orders")
      .select(
        `id, order_number, status, payment_status, total, created_at,
         customers(contact_name),
         order_items(id)`,
        { count: "exact" },
      );

    const validStatuses = ["new", "confirmed", "packing", "ready", "dispatched", "delivered", "cancelled"];
    if (status && validStatuses.includes(status)) {
      query = query.eq("status", status);
    }

    const validPaymentStatuses = ["pending", "paid", "refunded"];
    if (paymentStatus && validPaymentStatuses.includes(paymentStatus)) {
      query = query.eq("payment_status", paymentStatus);
    }

    if (search) {
      // Search by order number or customer name (via separate query)
      if (search.startsWith("LCW-") || search.startsWith("lcw-")) {
        query = query.ilike("order_number", `%${escapePostgrestValue(search)}%`);
      } else {
        // Find customer IDs matching the search
        const safe = escapePostgrestValue(search);
        const { data: matchingCustomers } = await supabase
          .from("customers")
          .select("id")
          .or(`contact_name.ilike.%${safe}%,business_name.ilike.%${safe}%`)
          .limit(50);

        const customerIds = (matchingCustomers ?? []).map((c) => c.id);
        if (customerIds.length > 0) {
          query = query.in("customer_id", customerIds);
        } else {
          // Also try matching order number
          query = query.ilike("order_number", `%${safe}%`);
        }
      }
    }

    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      // Add end of day
      query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);
    }

    query = query.order("created_at", { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: orders, count, error } = await query;

    if (error) {
      console.error("Order list error:", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    // Map to AdminOrderListItem format
    const mapped = (orders ?? []).map((o) => {
      const customer = o.customers as unknown as { contact_name: string } | null;
      const items = o.order_items as unknown as { id: string }[] | null;
      return {
        id: o.id,
        order_number: o.order_number,
        customer_name: customer?.contact_name ?? "Unknown",
        status: o.status,
        payment_status: o.payment_status,
        total: o.total,
        item_count: items?.length ?? 0,
        created_at: o.created_at,
      };
    });

    return NextResponse.json({
      data: mapped,
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Order list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
