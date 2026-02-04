import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import type { DashboardStats } from "@/types/admin";

export async function GET() {
  try {
    const adminPayload = await getAuthenticatedAdmin();
    if (!adminPayload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createServerClient();

    // Today's date range (UTC start of day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Run all queries in parallel
    const [
      todayOrdersResult,
      pendingOrdersResult,
      pendingVerificationsResult,
      recentOrdersResult,
      allActiveProductsResult,
    ] = await Promise.all([
      // Today's orders count + revenue
      supabase
        .from("orders")
        .select("total")
        .gte("created_at", todayISO)
        .neq("status", "cancelled"),

      // Pending orders count (status = 'new')
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),

      // Pending verification count
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),

      // Recent 5 orders with customer name
      supabase
        .from("orders")
        .select("id, order_number, status, payment_status, total, created_at, customers(contact_name)")
        .order("created_at", { ascending: false })
        .limit(5),

      // All active products with stock info (for low-stock comparison)
      supabase
        .from("products")
        .select("id, brand_name, generic_name, stock_quantity, low_stock_threshold")
        .eq("is_active", true),
    ]);

    // Calculate today's stats
    const todayOrders = todayOrdersResult.data?.length ?? 0;
    const todayRevenue =
      todayOrdersResult.data?.reduce((sum, o) => sum + (o.total || 0), 0) ?? 0;

    // Map recent orders
    const recentOrders = (recentOrdersResult.data ?? []).map((o) => {
      const customer = o.customers as unknown as { contact_name: string } | null;
      return {
        id: o.id,
        order_number: o.order_number,
        customer_name: customer?.contact_name ?? "Unknown",
        status: o.status,
        payment_status: o.payment_status,
        total: o.total,
        created_at: o.created_at,
      };
    });

    // Filter low stock products in JS (stock_quantity <= low_stock_threshold)
    const allProducts = allActiveProductsResult.data ?? [];
    const lowStockAll = allProducts
      .filter((p) => p.stock_quantity <= p.low_stock_threshold)
      .sort((a, b) => a.stock_quantity - b.stock_quantity);

    const stats: DashboardStats = {
      todayOrders,
      todayRevenue,
      pendingOrders: pendingOrdersResult.count ?? 0,
      pendingVerifications: pendingVerificationsResult.count ?? 0,
      lowStockCount: lowStockAll.length,
      recentOrders,
      lowStockProducts: lowStockAll.slice(0, 5),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 },
    );
  }
}
