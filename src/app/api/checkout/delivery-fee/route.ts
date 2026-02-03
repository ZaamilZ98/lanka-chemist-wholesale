import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { calculateDistance, calculateDeliveryFee } from "@/lib/haversine";
import { DELIVERY_RATE_PER_KM } from "@/lib/constants";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_METHODS = ["pickup", "standard", "express"];

/**
 * POST /api/checkout/delivery-fee — Calculate delivery fee
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const deliveryMethod = typeof body.delivery_method === "string" ? body.delivery_method : "";
  const addressId = typeof body.address_id === "string" ? body.address_id : "";

  if (!VALID_METHODS.includes(deliveryMethod)) {
    return NextResponse.json({ error: "Invalid delivery method" }, { status: 400 });
  }

  // Pickup — free
  if (deliveryMethod === "pickup") {
    return NextResponse.json({
      delivery_method: "pickup",
      delivery_fee: 0,
      delivery_distance_km: null,
      fee_note: "Free — collect from store",
      has_coordinates: false,
    });
  }

  // Express — contact us
  if (deliveryMethod === "express") {
    return NextResponse.json({
      delivery_method: "express",
      delivery_fee: 0,
      delivery_distance_km: null,
      fee_note: "Contact us for express delivery pricing",
      has_coordinates: false,
    });
  }

  // Standard delivery — calculate based on distance
  if (!addressId || !UUID_RE.test(addressId)) {
    return NextResponse.json({
      delivery_method: "standard",
      delivery_fee: 0,
      delivery_distance_km: null,
      fee_note: "Select an address to calculate delivery fee",
      has_coordinates: false,
    });
  }

  const supabase = createServerClient();

  // Fetch address and verify ownership
  const { data: address } = await supabase
    .from("customer_addresses")
    .select("latitude, longitude, customer_id")
    .eq("id", addressId)
    .single();

  if (!address || address.customer_id !== auth.sub) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  // Fetch store coordinates
  const { data: storeSettings } = await supabase
    .from("store_settings")
    .select("key, value")
    .in("key", ["store_latitude", "store_longitude"]);

  const storeLat = storeSettings?.find((s) => s.key === "store_latitude")?.value;
  const storeLng = storeSettings?.find((s) => s.key === "store_longitude")?.value;

  const hasCoords =
    address.latitude != null &&
    address.longitude != null &&
    storeLat != null &&
    storeLng != null &&
    !isNaN(Number(storeLat)) &&
    !isNaN(Number(storeLng));

  if (hasCoords) {
    const distance = calculateDistance(
      Number(storeLat),
      Number(storeLng),
      Number(address.latitude),
      Number(address.longitude),
    );
    const fee = calculateDeliveryFee(distance, DELIVERY_RATE_PER_KM);
    return NextResponse.json({
      delivery_method: "standard",
      delivery_fee: fee,
      delivery_distance_km: Math.round(distance * 100) / 100,
      fee_note: `Rs ${DELIVERY_RATE_PER_KM}/km × ${distance.toFixed(1)} km (subject to change)`,
      has_coordinates: true,
    });
  }

  return NextResponse.json({
    delivery_method: "standard",
    delivery_fee: 0,
    delivery_distance_km: null,
    fee_note: "Delivery fee will be confirmed after order review",
    has_coordinates: false,
  });
}
