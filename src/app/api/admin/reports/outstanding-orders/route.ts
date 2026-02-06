import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import { ORDER_STATUS_LABELS, DELIVERY_METHOD_LABELS } from "@/lib/constants";
import {
  createStyledWorkbook,
  workbookToBuffer,
  currencyStyle,
  numberStyle,
} from "@/lib/excel";

interface OutstandingOrderRow {
  order_number: string;
  customer_name: string;
  business_name: string | null;
  status: string;
  delivery_method: string;
  item_count: number;
  total: number;
  days_pending: number;
  created_at: string;
}

/**
 * GET /api/admin/reports/outstanding-orders
 * Pending and in-progress orders report
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const format = searchParams.get("format") || "json";
    const status = searchParams.get("status") || "";

    const supabase = createServerClient();

    // Outstanding statuses (not completed, not cancelled)
    const outstandingStatuses = ["new", "confirmed", "packing", "ready", "dispatched"];

    // Build query
    let query = supabase
      .from("orders")
      .select(`
        id, order_number, status, delivery_method, total, created_at,
        customers(contact_name, business_name),
        order_items(id)
      `)
      .in("status", status ? [status] : outstandingStatuses)
      .order("created_at", { ascending: true });

    const { data: orders, error } = await query;

    if (error) {
      logError("Outstanding orders report", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    const now = new Date();

    // Transform data
    const rows: OutstandingOrderRow[] = (orders ?? []).map((order) => {
      const customer = order.customers as unknown as {
        contact_name: string;
        business_name: string | null;
      } | null;
      const items = order.order_items as unknown as { id: string }[] | null;
      const createdAt = new Date(order.created_at);
      const daysPending = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      return {
        order_number: order.order_number,
        customer_name: customer?.contact_name || "Unknown",
        business_name: customer?.business_name || null,
        status: ORDER_STATUS_LABELS[order.status] || order.status,
        delivery_method: DELIVERY_METHOD_LABELS[order.delivery_method] || order.delivery_method,
        item_count: items?.length ?? 0,
        total: order.total,
        days_pending: daysPending,
        created_at: createdAt.toISOString().split("T")[0],
      };
    });

    // Calculate summary by status
    const statusCounts: Record<string, number> = {};
    const statusTotals: Record<string, number> = {};
    for (const row of rows) {
      statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
      statusTotals[row.status] = (statusTotals[row.status] || 0) + row.total;
    }

    const summary = {
      total_orders: rows.length,
      total_value: rows.reduce((sum, r) => sum + r.total, 0),
      by_status: Object.entries(statusCounts).map(([s, count]) => ({
        status: s,
        count,
        value: statusTotals[s],
      })),
      urgent_count: rows.filter((r) => r.days_pending > 3).length,
    };

    // Return JSON or Excel
    if (format === "xlsx") {
      const workbook = await createStyledWorkbook({
        title: "Outstanding Orders Report",
        sheetName: "Outstanding Orders",
        columns: [
          { header: "Order #", key: "order_number", width: 14 },
          { header: "Customer", key: "customer_name", width: 20 },
          { header: "Business", key: "business_name", width: 25 },
          { header: "Status", key: "status", width: 15 },
          { header: "Delivery", key: "delivery_method", width: 15 },
          { header: "Items", key: "item_count", width: 8, style: numberStyle() },
          { header: "Total", key: "total", width: 15, style: currencyStyle() },
          { header: "Days Pending", key: "days_pending", width: 12, style: numberStyle() },
          { header: "Order Date", key: "created_at", width: 12 },
        ],
        data: rows as unknown as Record<string, unknown>[],
      });

      const buffer = await workbookToBuffer(workbook);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="outstanding-orders-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    }

    return NextResponse.json({ data: rows, summary });
  } catch (error) {
    logError("Outstanding orders report", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
