import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import {
  createStyledWorkbook,
  workbookToBuffer,
  currencyStyle,
  dateStyle,
  numberStyle,
} from "@/lib/excel";

interface SalesReportRow {
  date: string;
  order_number: string;
  customer_name: string;
  item_count: number;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  payment_status: string;
}

interface SalesReportSummary {
  total_orders: number;
  total_revenue: number;
  total_delivery_fees: number;
  average_order_value: number;
}

/**
 * GET /api/admin/reports/sales
 * Sales report with orders by period
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

    const supabase = createServerClient();

    // Build query
    let query = supabase
      .from("orders")
      .select(`
        id, order_number, status, payment_status, subtotal, delivery_fee, total, created_at,
        customers(contact_name, business_name),
        order_items(id)
      `)
      .not("status", "eq", "cancelled")
      .order("created_at", { ascending: false });

    // Date filters
    if (from) {
      query = query.gte("created_at", `${from}T00:00:00.000Z`);
    }
    if (to) {
      query = query.lte("created_at", `${to}T23:59:59.999Z`);
    }

    const { data: orders, error } = await query;

    if (error) {
      logError("Sales report", error);
      return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 });
    }

    // Transform data
    const rows: SalesReportRow[] = (orders ?? []).map((order) => {
      const customer = order.customers as unknown as { contact_name: string; business_name: string } | null;
      const items = order.order_items as unknown as { id: string }[] | null;
      return {
        date: new Date(order.created_at).toISOString().split("T")[0],
        order_number: order.order_number,
        customer_name: customer?.business_name || customer?.contact_name || "Unknown",
        item_count: items?.length ?? 0,
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        total: order.total,
        status: order.status,
        payment_status: order.payment_status,
      };
    });

    // Calculate summary
    const summary: SalesReportSummary = {
      total_orders: rows.length,
      total_revenue: rows.reduce((sum, r) => sum + r.total, 0),
      total_delivery_fees: rows.reduce((sum, r) => sum + r.delivery_fee, 0),
      average_order_value: rows.length > 0
        ? rows.reduce((sum, r) => sum + r.total, 0) / rows.length
        : 0,
    };

    // Return JSON or Excel
    if (format === "xlsx") {
      const workbook = await createStyledWorkbook({
        title: `Sales Report${from ? ` (${from}` : ""}${to ? ` to ${to})` : from ? ")" : ""}`,
        sheetName: "Sales",
        columns: [
          { header: "Date", key: "date", width: 12, style: dateStyle() },
          { header: "Order #", key: "order_number", width: 14 },
          { header: "Customer", key: "customer_name", width: 25 },
          { header: "Items", key: "item_count", width: 8, style: numberStyle() },
          { header: "Subtotal", key: "subtotal", width: 15, style: currencyStyle() },
          { header: "Delivery", key: "delivery_fee", width: 12, style: currencyStyle() },
          { header: "Total", key: "total", width: 15, style: currencyStyle() },
          { header: "Status", key: "status", width: 12 },
          { header: "Payment", key: "payment_status", width: 10 },
        ],
        data: rows as unknown as Record<string, unknown>[],
      });

      const buffer = await workbookToBuffer(workbook);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="sales-report-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    }

    return NextResponse.json({ data: rows, summary });
  } catch (error) {
    logError("Sales report", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
