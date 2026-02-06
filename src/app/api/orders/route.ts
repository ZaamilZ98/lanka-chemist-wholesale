import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { sanitizeString } from "@/lib/validate";
import { calculateDistance, calculateDeliveryFee } from "@/lib/haversine";
import { DELIVERY_RATE_PER_KM } from "@/lib/constants";
import { processNewOrder } from "@/lib/order-notifications";
import { logError } from "@/lib/logger";
import type { CartItemResponse, StockIssue, CustomerOrderListResponse } from "@/types/api";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_DELIVERY_METHODS = ["pickup", "standard", "express"];
const VALID_PAYMENT_METHODS = ["cash_on_delivery", "bank_transfer"];
const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 50;

const CART_ITEM_SELECT = `
  id, product_id, quantity, created_at, updated_at,
  product:products(
    id, generic_name, brand_name, strength, dosage_form, pack_size,
    wholesale_price, stock_quantity, is_active, is_visible, section, sku
  )
`;

/**
 * GET /api/orders — List customer orders with pagination
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, parseInt(searchParams.get("per_page") || String(DEFAULT_PER_PAGE), 10))
  );
  const status = searchParams.get("status");

  const supabase = createServerClient();

  try {
    // Build query
    let query = supabase
      .from("orders")
      .select(
        `
        id, order_number, status, subtotal, delivery_fee, total,
        delivery_method, payment_method, payment_status, created_at,
        order_items(id)
      `,
        { count: "exact" }
      )
      .eq("customer_id", auth.sub)
      .order("created_at", { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq("status", status);
    }

    // Pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data: orders, count, error } = await query;

    if (error) {
      logError("Orders GET", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    // Transform to include item_count
    const orderList = (orders ?? []).map((order) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      total: order.total,
      delivery_method: order.delivery_method,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      item_count: Array.isArray(order.order_items) ? order.order_items.length : 0,
      created_at: order.created_at,
    }));

    const total = count ?? 0;
    const totalPages = Math.ceil(total / perPage);

    const response: CustomerOrderListResponse = {
      orders: orderList,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    logError("Orders GET", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

/**
 * POST /api/orders — Place an order from cart contents
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  // Verify approved
  const { data: customer } = await supabase
    .from("customers")
    .select("status, is_active")
    .eq("id", auth.sub)
    .single();

  if (!customer || !customer.is_active || customer.status !== "approved") {
    return NextResponse.json(
      { error: "Account not approved for ordering" },
      { status: 403 },
    );
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const deliveryMethod = typeof body.delivery_method === "string" ? body.delivery_method : "";
  const paymentMethod = typeof body.payment_method === "string" ? body.payment_method : "";
  const deliveryAddressId = typeof body.delivery_address_id === "string" ? body.delivery_address_id : "";
  const orderNotes = typeof body.order_notes === "string" ? sanitizeString(body.order_notes).slice(0, 1000) : null;
  const preferredDeliveryDate = typeof body.preferred_delivery_date === "string" ? body.preferred_delivery_date : null;

  // Validate delivery method
  if (!VALID_DELIVERY_METHODS.includes(deliveryMethod)) {
    return NextResponse.json({ error: "Invalid delivery method" }, { status: 400 });
  }

  // Validate payment method
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  // Validate delivery address for delivery methods
  if ((deliveryMethod === "standard" || deliveryMethod === "express") && !deliveryAddressId) {
    return NextResponse.json(
      { error: "Delivery address is required for delivery orders" },
      { status: 400 },
    );
  }

  if (deliveryAddressId && !UUID_RE.test(deliveryAddressId)) {
    return NextResponse.json({ error: "Invalid address ID" }, { status: 400 });
  }

  // Validate preferred delivery date
  if (preferredDeliveryDate) {
    const dateObj = new Date(preferredDeliveryDate);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: "Invalid delivery date" }, { status: 400 });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) {
      return NextResponse.json({ error: "Delivery date cannot be in the past" }, { status: 400 });
    }
  }

  // Verify address ownership if provided
  let deliveryAddress: { latitude: number | null; longitude: number | null } | null = null;
  if (deliveryAddressId) {
    const { data: addr } = await supabase
      .from("customer_addresses")
      .select("id, customer_id, latitude, longitude")
      .eq("id", deliveryAddressId)
      .single();

    if (!addr || addr.customer_id !== auth.sub) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }
    deliveryAddress = addr;
  }

  // Fetch cart items
  const { data: rawItems, error: cartErr } = await supabase
    .from("cart_items")
    .select(CART_ITEM_SELECT)
    .eq("customer_id", auth.sub);

  if (cartErr) {
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }

  // Filter to available products
  type CartRaw = (typeof rawItems)[number];
  interface ProductData {
    id: string;
    generic_name: string;
    brand_name: string;
    strength: string | null;
    dosage_form: string | null;
    pack_size: string | null;
    wholesale_price: number;
    stock_quantity: number;
    is_active: boolean;
    is_visible: boolean;
    section: string;
    sku: string | null;
  }

  const validItems: { raw: CartRaw; product: ProductData }[] = [];
  for (const raw of rawItems ?? []) {
    const product = raw.product as unknown as ProductData | null;
    if (product && product.is_active && product.is_visible && product.stock_quantity > 0) {
      validItems.push({ raw, product });
    }
  }

  if (validItems.length === 0) {
    return NextResponse.json(
      { error: "Your cart is empty or all items are unavailable" },
      { status: 400 },
    );
  }

  // Stock check
  const stockIssues: StockIssue[] = [];
  for (const { raw, product } of validItems) {
    if (raw.quantity > product.stock_quantity) {
      stockIssues.push({
        product_id: product.id,
        product_name: product.generic_name,
        requested: raw.quantity,
        available: product.stock_quantity,
      });
    }
  }

  if (stockIssues.length > 0) {
    return NextResponse.json(
      {
        error: "Some items exceed available stock. Please return to your cart and adjust quantities.",
        stock_issues: stockIssues,
      },
      { status: 400 },
    );
  }

  // Calculate subtotal
  const subtotal = validItems.reduce(
    (sum, { raw, product }) => sum + product.wholesale_price * raw.quantity,
    0,
  );

  // Calculate delivery fee
  let deliveryFee = 0;
  let deliveryDistanceKm: number | null = null;

  if (deliveryMethod === "standard" && deliveryAddress) {
    // Fetch store coordinates
    const { data: storeSettings } = await supabase
      .from("store_settings")
      .select("key, value")
      .in("key", ["store_latitude", "store_longitude"]);

    const storeLat = storeSettings?.find((s) => s.key === "store_latitude")?.value;
    const storeLng = storeSettings?.find((s) => s.key === "store_longitude")?.value;

    if (
      deliveryAddress.latitude != null &&
      deliveryAddress.longitude != null &&
      storeLat && storeLng &&
      !isNaN(Number(storeLat)) && !isNaN(Number(storeLng))
    ) {
      const distance = calculateDistance(
        Number(storeLat),
        Number(storeLng),
        Number(deliveryAddress.latitude),
        Number(deliveryAddress.longitude),
      );
      deliveryFee = calculateDeliveryFee(distance, DELIVERY_RATE_PER_KM);
      deliveryDistanceKm = Math.round(distance * 100) / 100;
    }
  }

  const total = subtotal + deliveryFee;

  // Insert order (order_number generated by DB trigger)
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      customer_id: auth.sub,
      status: "new",
      delivery_method: deliveryMethod,
      delivery_address_id: deliveryAddressId || null,
      delivery_fee: deliveryFee,
      delivery_distance_km: deliveryDistanceKm,
      preferred_delivery_date: preferredDeliveryDate || null,
      subtotal,
      total,
      payment_method: paymentMethod,
      payment_status: "pending",
      order_notes: orderNotes || null,
    })
    .select("id, order_number, status, subtotal, delivery_fee, total, delivery_method, payment_method, order_notes, preferred_delivery_date, created_at")
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  // Insert order items
  const orderItems = validItems.map(({ raw, product }) => ({
    order_id: order.id,
    product_id: product.id,
    product_name: `${product.generic_name} (${product.brand_name})`,
    product_generic_name: product.generic_name,
    product_sku: product.sku,
    quantity: raw.quantity,
    unit_price: product.wholesale_price,
    total_price: product.wholesale_price * raw.quantity,
  }));

  const { data: insertedItems, error: itemsErr } = await supabase
    .from("order_items")
    .insert(orderItems)
    .select("id, product_id, product_name, product_generic_name, product_sku, quantity, unit_price, total_price");

  if (itemsErr || !insertedItems) {
    // Rollback: delete the order
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "Failed to create order items" }, { status: 500 });
  }

  // Decrement stock and record movements
  for (const { raw, product } of validItems) {
    const newStock = product.stock_quantity - raw.quantity;

    // Fetch current total_sold so we can increment it
    // (Supabase JS client does not support atomic increment)
    const { data: currentProduct } = await supabase
      .from("products")
      .select("total_sold")
      .eq("id", product.id)
      .single();

    await supabase
      .from("products")
      .update({
        stock_quantity: newStock,
        total_sold: ((currentProduct?.total_sold as number) || 0) + raw.quantity,
      })
      .eq("id", product.id);

    // Stock movement record
    await supabase.from("stock_movements").insert({
      product_id: product.id,
      quantity_change: -raw.quantity,
      quantity_before: product.stock_quantity,
      quantity_after: newStock,
      reason: "sale",
      reference_id: order.id,
      notes: `Order ${order.order_number}`,
    });
  }

  // Clear cart
  await supabase.from("cart_items").delete().eq("customer_id", auth.sub);

  // Fire-and-forget: generate invoice, send emails
  processNewOrder({ orderId: order.id, orderNumber: order.order_number, customerId: auth.sub });

  return NextResponse.json(
    {
      order: {
        ...order,
        items: insertedItems,
      },
    },
    { status: 201 },
  );
}
