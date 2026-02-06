import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import {
  createStyledWorkbook,
  workbookToBuffer,
  currencyStyle,
  numberStyle,
  dateStyle,
} from "@/lib/excel";

interface CustomerAnalysisRow {
  rank: number;
  customer_name: string;
  business_name: string | null;
  customer_type: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  last_order_date: string | null;
}

/**
 * GET /api/admin/reports/customer-analysis
 * Customer purchase analysis report
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const format = searchParams.get("format") || "json";
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));

    const supabase = createServerClient();

    // Build query for orders within date range
    let query = supabase
      .from("orders")
      .select(`
        id, customer_id, total, created_at, status,
        customers(contact_name, business_name, customer_type)
      `)
      .not("status", "eq", "cancelled");

    if (from) {
      query = query.gte("created_at", `${from}T00:00:00.000Z`);
    }
    if (to) {
      query = query.lte("created_at", `${to}T23:59:59.999Z`);
    }

    const { data: orders, error } = await query;

    if (error) {
      logError("Customer analysis report", error);
      return NextResponse.json({ error: "Failed to fetch order data" }, { status: 500 });
    }

    // Aggregate by customer
    const customerMap = new Map<string, {
      customer_id: string;
      customer_name: string;
      business_name: string | null;
      customer_type: string;
      total_orders: number;
      total_spent: number;
      last_order_date: string | null;
    }>();

    for (const order of orders ?? []) {
      const customer = order.customers as unknown as {
        contact_name: string;
        business_name: string | null;
        customer_type: string;
      } | null;

      const customerId = order.customer_id;
      const existing = customerMap.get(customerId);

      if (existing) {
        existing.total_orders += 1;
        existing.total_spent += order.total;
        if (!existing.last_order_date || new Date(order.created_at) > new Date(existing.last_order_date)) {
          existing.last_order_date = order.created_at;
        }
      } else {
        customerMap.set(customerId, {
          customer_id: customerId,
          customer_name: customer?.contact_name || "Unknown",
          business_name: customer?.business_name || null,
          customer_type: customer?.customer_type || "other",
          total_orders: 1,
          total_spent: order.total,
          last_order_date: order.created_at,
        });
      }
    }

    // Sort by total spent and add rank
    const sortedCustomers = [...customerMap.values()]
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, limit)
      .map((c, index): CustomerAnalysisRow => ({
        rank: index + 1,
        customer_name: c.customer_name,
        business_name: c.business_name,
        customer_type: c.customer_type,
        total_orders: c.total_orders,
        total_spent: c.total_spent,
        average_order_value: c.total_spent / c.total_orders,
        last_order_date: c.last_order_date ? new Date(c.last_order_date).toISOString().split("T")[0] : null,
      }));

    // Return JSON or Excel
    if (format === "xlsx") {
      const workbook = await createStyledWorkbook({
        title: `Customer Analysis${from ? ` (${from}` : ""}${to ? ` to ${to})` : from ? ")" : ""}`,
        sheetName: "Customer Analysis",
        columns: [
          { header: "#", key: "rank", width: 5, style: numberStyle() },
          { header: "Contact Name", key: "customer_name", width: 20 },
          { header: "Business Name", key: "business_name", width: 25 },
          { header: "Type", key: "customer_type", width: 12 },
          { header: "Orders", key: "total_orders", width: 10, style: numberStyle() },
          { header: "Total Spent", key: "total_spent", width: 15, style: currencyStyle() },
          { header: "Avg Order", key: "average_order_value", width: 15, style: currencyStyle() },
          { header: "Last Order", key: "last_order_date", width: 12, style: dateStyle() },
        ],
        data: sortedCustomers as unknown as Record<string, unknown>[],
      });

      const buffer = await workbookToBuffer(workbook);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="customer-analysis-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    }

    return NextResponse.json({
      data: sortedCustomers,
      total_customers: sortedCustomers.length,
    });
  } catch (error) {
    logError("Customer analysis report", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
