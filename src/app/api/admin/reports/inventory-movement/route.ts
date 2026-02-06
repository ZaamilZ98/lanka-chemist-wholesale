import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import { STOCK_ADJUSTMENT_REASON_LABELS } from "@/lib/constants";
import {
  createStyledWorkbook,
  workbookToBuffer,
  numberStyle,
} from "@/lib/excel";

interface InventoryMovementRow {
  date: string;
  time: string;
  product_name: string;
  product_sku: string | null;
  reason: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference: string | null;
  notes: string | null;
}

/**
 * GET /api/admin/reports/inventory-movement
 * Stock movements log
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
    const reason = searchParams.get("reason") || "";

    const supabase = createServerClient();

    // Build query
    let query = supabase
      .from("stock_movements")
      .select(`
        id, product_id, quantity_change, quantity_before, quantity_after,
        reason, reference_id, notes, created_at,
        products(generic_name, brand_name, sku)
      `)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (from) {
      query = query.gte("created_at", `${from}T00:00:00.000Z`);
    }
    if (to) {
      query = query.lte("created_at", `${to}T23:59:59.999Z`);
    }
    if (reason) {
      query = query.eq("reason", reason);
    }

    const { data: movements, error } = await query;

    if (error) {
      logError("Inventory movement report", error);
      return NextResponse.json({ error: "Failed to fetch movement data" }, { status: 500 });
    }

    // Transform data
    const rows: InventoryMovementRow[] = (movements ?? []).map((m) => {
      const product = m.products as unknown as {
        generic_name: string;
        brand_name: string;
        sku: string | null;
      } | null;
      const createdAt = new Date(m.created_at);

      return {
        date: createdAt.toISOString().split("T")[0],
        time: createdAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        product_name: product
          ? `${product.generic_name} (${product.brand_name})`
          : "Unknown Product",
        product_sku: product?.sku || null,
        reason: STOCK_ADJUSTMENT_REASON_LABELS[m.reason] || m.reason,
        quantity_change: m.quantity_change,
        quantity_before: m.quantity_before,
        quantity_after: m.quantity_after,
        reference: m.reference_id || null,
        notes: m.notes || null,
      };
    });

    // Calculate summary
    const summary = {
      total_movements: rows.length,
      total_additions: rows.filter((r) => r.quantity_change > 0).reduce((sum, r) => sum + r.quantity_change, 0),
      total_deductions: rows.filter((r) => r.quantity_change < 0).reduce((sum, r) => sum + Math.abs(r.quantity_change), 0),
    };

    // Return JSON or Excel
    if (format === "xlsx") {
      const workbook = await createStyledWorkbook({
        title: `Inventory Movement${from ? ` (${from}` : ""}${to ? ` to ${to})` : from ? ")" : ""}`,
        sheetName: "Stock Movements",
        columns: [
          { header: "Date", key: "date", width: 12 },
          { header: "Time", key: "time", width: 8 },
          { header: "Product", key: "product_name", width: 30 },
          { header: "SKU", key: "product_sku", width: 12 },
          { header: "Reason", key: "reason", width: 15 },
          { header: "Change", key: "quantity_change", width: 10, style: numberStyle() },
          { header: "Before", key: "quantity_before", width: 10, style: numberStyle() },
          { header: "After", key: "quantity_after", width: 10, style: numberStyle() },
          { header: "Reference", key: "reference", width: 20 },
          { header: "Notes", key: "notes", width: 25 },
        ],
        data: rows as unknown as Record<string, unknown>[],
      });

      const buffer = await workbookToBuffer(workbook);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="inventory-movement-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    }

    return NextResponse.json({ data: rows, summary });
  } catch (error) {
    logError("Inventory movement report", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
