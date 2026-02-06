"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ORDER_STATUS_LABELS,
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";
import ReorderButton from "./ReorderButton";
import type { OrderDetailResponse } from "@/types/api";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  confirmed: "bg-indigo-100 text-indigo-700",
  packing: "bg-yellow-100 text-yellow-700",
  ready: "bg-orange-100 text-orange-700",
  dispatched: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;
}

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch order");
      }

      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchOrder}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Order not found</p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 mt-4 text-brand-green hover:underline"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Orders
        </Link>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[order.status] || "bg-gray-100 text-gray-700";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-brand-green transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Orders
      </Link>

      {/* Order header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900">
                Order #{order.order_number}
              </h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle}`}>
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Placed on {formatDate(order.created_at)} at {formatTime(order.created_at)}
            </p>
          </div>
          <ReorderButton orderId={order.id} disabled={order.status === "cancelled"} />
        </div>
      </div>

      {/* Order details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                Order Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="px-4 sm:px-6 py-4 flex justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product_name}
                    </p>
                    {item.product_sku && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        SKU: {item.product_sku}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      {formatCurrency(item.unit_price)} x {item.quantity}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.total_price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order notes */}
          {order.order_notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Order Notes</h2>
              <p className="text-sm text-gray-600">{order.order_notes}</p>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="space-y-6">
          {/* Order summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="text-gray-900">
                  {order.delivery_fee > 0 ? formatCurrency(order.delivery_fee) : "Free"}
                </span>
              </div>
              {order.delivery_distance_km && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Distance</span>
                  <span className="text-gray-500">{order.delivery_distance_km} km</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-100 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Delivery</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500 block mb-0.5">Method</span>
                <span className="text-gray-900">
                  {DELIVERY_METHOD_LABELS[order.delivery_method] || order.delivery_method}
                </span>
              </div>
              {order.delivery_address && (
                <div>
                  <span className="text-gray-500 block mb-0.5">Address</span>
                  <p className="text-gray-900">
                    {order.delivery_address.label && (
                      <span className="font-medium">{order.delivery_address.label}<br /></span>
                    )}
                    {order.delivery_address.address_line1}
                    {order.delivery_address.address_line2 && (
                      <>, {order.delivery_address.address_line2}</>
                    )}
                    <br />
                    {order.delivery_address.city}, {order.delivery_address.district}
                    {order.delivery_address.postal_code && (
                      <> {order.delivery_address.postal_code}</>
                    )}
                  </p>
                </div>
              )}
              {order.preferred_delivery_date && (
                <div>
                  <span className="text-gray-500 block mb-0.5">Preferred Date</span>
                  <span className="text-gray-900">
                    {formatDate(order.preferred_delivery_date)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Payment</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500 block mb-0.5">Method</span>
                <span className="text-gray-900">
                  {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-0.5">Status</span>
                <span className={`inline-flex items-center gap-1.5 font-medium ${
                  order.payment_status === "paid" ? "text-green-600" : "text-yellow-600"
                }`}>
                  {order.payment_status === "paid" && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
