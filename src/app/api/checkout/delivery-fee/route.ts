import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { calculateDistance, calculateDeliveryFee } from "@/lib/haversine";
import { DELIVERY_RATE_PER_KM } from "@/lib/constants";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_METHODS = ["pickup", "standard", "express"];

// In-memory cache for store coordinates (static, rarely changes)
let storeCoordinatesCache: { lat: number; lng: number; expiry: number } | null = null;
const STORE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// In-memory cache for calculated fees (address-based)
const feeCache = new Map<string, { fee: number; distance: number; expiry: number }>();
const FEE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getFeeCache(addressId: string): { fee: number; distance: number } | null {
  const cached = feeCache.get(addressId);
  if (!cached) return null;
  if (Date.now() > cached.expiry) {
    feeCache.delete(addressId);
    return null;
  }
  return { fee: cached.fee, distance: cached.distance };
}

function setFeeCache(addressId: string, fee: number, distance: number) {
  // Limit cache size to prevent memory issues
  if (feeCache.size > 1000) {
    // Remove oldest entries
    const entries = Array.from(feeCache.entries());
    entries.sort((a, b) => a[1].expiry - b[1].expiry);
    for (let i = 0; i < 100; i++) {
      feeCache.delete(entries[i][0]);
    }
  }
  feeCache.set(addressId, { fee, distance, expiry: Date.now() + FEE_CACHE_TTL });
}

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

  // Check if address has coordinates
  if (address.latitude == null || address.longitude == null) {
    return NextResponse.json({
      delivery_method: "standard",
      delivery_fee: 0,
      delivery_distance_km: null,
      fee_note: "Delivery fee will be confirmed after order review",
      has_coordinates: false,
    });
  }

  // Check fee cache first
  const cachedFee = getFeeCache(addressId);
  if (cachedFee) {
    return NextResponse.json({
      delivery_method: "standard",
      delivery_fee: cachedFee.fee,
      delivery_distance_km: Math.round(cachedFee.distance * 100) / 100,
      fee_note: `Rs ${DELIVERY_RATE_PER_KM}/km × ${cachedFee.distance.toFixed(1)} km (subject to change)`,
      has_coordinates: true,
    });
  }

  // Get store coordinates (cached)
  let storeLat: number;
  let storeLng: number;

  if (storeCoordinatesCache && Date.now() < storeCoordinatesCache.expiry) {
    storeLat = storeCoordinatesCache.lat;
    storeLng = storeCoordinatesCache.lng;
  } else {
    // Fetch store coordinates from DB
    const { data: storeSettings } = await supabase
      .from("store_settings")
      .select("key, value")
      .in("key", ["store_latitude", "store_longitude"]);

    const latVal = storeSettings?.find((s) => s.key === "store_latitude")?.value;
    const lngVal = storeSettings?.find((s) => s.key === "store_longitude")?.value;

    if (!latVal || !lngVal || isNaN(Number(latVal)) || isNaN(Number(lngVal))) {
      return NextResponse.json({
        delivery_method: "standard",
        delivery_fee: 0,
        delivery_distance_km: null,
        fee_note: "Delivery fee will be confirmed after order review",
        has_coordinates: false,
      });
    }

    storeLat = Number(latVal);
    storeLng = Number(lngVal);

    // Cache store coordinates
    storeCoordinatesCache = {
      lat: storeLat,
      lng: storeLng,
      expiry: Date.now() + STORE_CACHE_TTL,
    };
  }

  // Calculate distance and fee
  const distance = calculateDistance(
    storeLat,
    storeLng,
    Number(address.latitude),
    Number(address.longitude),
  );
  const fee = calculateDeliveryFee(distance, DELIVERY_RATE_PER_KM);

  // Cache the result
  setFeeCache(addressId, fee, distance);

  return NextResponse.json({
    delivery_method: "standard",
    delivery_fee: fee,
    delivery_distance_km: Math.round(distance * 100) / 100,
    fee_note: `Rs ${DELIVERY_RATE_PER_KM}/km × ${distance.toFixed(1)} km (subject to change)`,
    has_coordinates: true,
  });
}
