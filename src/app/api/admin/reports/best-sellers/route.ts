import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import {
  createStyledWorkbook,
  workbookToBuffer,
  currencyStyle,
  numberStyle,
} from "@/lib/excel";

interface BestSellerRow {
  rank: number;
  product_name: string;
  brand_name: string;
  sku: string | null;
  category: string | null;
  units_sold: number;
  revenue: number;
  current_stock: number;
}

/**
 * GET /api/admin/reports/best-sellers
 * Best selling products report
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

    // Build query for order items within date range
    let query = supabase
      .from("order_items")
      .select(`
        product_id, product_name, product_sku, quantity, total_price,
        orders!inner(created_at, status),
        products(brand_name, stock_quantity, category:categories(name))
      `)
      .not("orders.status", "eq", "cancelled");

    if (from) {
      query = query.gte("orders.created_at", `${from}T00:00:00.000Z`);
    }
    if (to) {
      query = query.lte("orders.created_at", `${to}T23:59:59.999Z`);
    }

    const { data: orderItems, error } = await query;

    if (error) {
      logError("Best sellers report", error);
      return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 });
    }

    // Aggregate by product
    const productMap = new Map<string, {
      product_id: string;
      product_name: string;
      brand_name: string;
      sku: string | null;
      category: string | null;
      units_sold: number;
      revenue: number;
      current_stock: number;
    }>();

    for (const item of orderItems ?? []) {
      const productId = item.product_id;
      const product = item.products as unknown as {
        brand_name: string;
        stock_quantity: number;
        category: { name: string } | null;
      } | null;

      const existing = productMap.get(productId);
      if (existing) {
        existing.units_sold += item.quantity;
        existing.revenue += item.total_price;
      } else {
        productMap.set(productId, {
          product_id: productId,
          product_name: item.product_name,
          brand_name: product?.brand_name || "",
          sku: item.product_sku,
          category: product?.category?.name || null,
          units_sold: item.quantity,
          revenue: item.total_price,
          current_stock: product?.stock_quantity ?? 0,
        });
      }
    }

    // Sort by units sold and add rank
    const sortedProducts = [...productMap.values()]
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, limit)
      .map((p, index): BestSellerRow => ({
        rank: index + 1,
        product_name: p.product_name,
        brand_name: p.brand_name,
        sku: p.sku,
        category: p.category,
        units_sold: p.units_sold,
        revenue: p.revenue,
        current_stock: p.current_stock,
      }));

    // Return JSON or Excel
    if (format === "xlsx") {
      const workbook = await createStyledWorkbook({
        title: `Best Sellers Report${from ? ` (${from}` : ""}${to ? ` to ${to})` : from ? ")" : ""}`,
        sheetName: "Best Sellers",
        columns: [
          { header: "#", key: "rank", width: 5, style: numberStyle() },
          { header: "Product Name", key: "product_name", width: 30 },
          { header: "Brand", key: "brand_name", width: 15 },
          { header: "SKU", key: "sku", width: 12 },
          { header: "Category", key: "category", width: 18 },
          { header: "Units Sold", key: "units_sold", width: 12, style: numberStyle() },
          { header: "Revenue", key: "revenue", width: 15, style: currencyStyle() },
          { header: "Current Stock", key: "current_stock", width: 14, style: numberStyle() },
        ],
        data: sortedProducts as unknown as Record<string, unknown>[],
      });

      const buffer = await workbookToBuffer(workbook);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="best-sellers-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    }

    return NextResponse.json({
      data: sortedProducts,
      total_products: sortedProducts.length,
    });
  } catch (error) {
    logError("Best sellers report", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
