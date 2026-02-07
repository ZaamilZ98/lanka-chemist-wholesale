"use client";

import type { CartItemResponse } from "@/types/api";

interface OrderSummaryProps {
  items: CartItemResponse[];
  subtotal: number;
  deliveryFee: number;
  deliveryFeeNote: string;
  total: number;
  onPlaceOrder: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  isCalculatingFee: boolean;
  deliveryMethod?: string;
}

export default function OrderSummary({
  items,
  subtotal,
  deliveryFee,
  deliveryFeeNote,
  total,
  onPlaceOrder,
  isSubmitting,
  canSubmit,
  isCalculatingFee,
  deliveryMethod,
}: OrderSummaryProps) {
  const isStandardDelivery = deliveryMethod === "standard";

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 sticky top-24">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Order Summary
      </h2>

      {/* Compact item list */}
      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
        {items.map((item) => {
          const lineTotal = item.product.wholesale_price * item.quantity;
          return (
            <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <span className="text-gray-700 line-clamp-1">
                  {item.product.generic_name}
                </span>
                <span className="text-xs text-gray-400 block">
                  {item.quantity} &times; Rs {item.product.wholesale_price.toLocaleString("en-LK")}
                </span>
              </div>
              <span className="text-gray-900 font-medium shrink-0">
                Rs {lineTotal.toLocaleString("en-LK")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
          <span className="font-medium text-gray-900">
            Rs {subtotal.toLocaleString("en-LK")}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Delivery</span>
          <span className="font-medium text-gray-900">
            {isCalculatingFee ? (
              <span className="text-gray-400">Calculating...</span>
            ) : isStandardDelivery ? (
              <span className="text-amber-600">To be confirmed</span>
            ) : deliveryFee > 0 ? (
              `Rs ${deliveryFee.toLocaleString("en-LK")}`
            ) : (
              <span className="text-gray-500">Free</span>
            )}
          </span>
        </div>
        {deliveryFeeNote && !isCalculatingFee && (
          <p className="text-xs text-gray-400">{deliveryFeeNote}</p>
        )}
        <div className="border-t border-gray-200 pt-3 flex justify-between">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-lg text-gray-900">
            Rs {total.toLocaleString("en-LK")}
          </span>
        </div>
        {isStandardDelivery && (
          <p className="text-xs text-amber-600">
            Delivery fee is not included. It will be confirmed before dispatch.
          </p>
        )}
      </div>

      {/* Place Order button — desktop */}
      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={!canSubmit || isSubmitting}
        className="mt-5 flex w-full items-center justify-center rounded-lg bg-brand-green px-6 py-3 text-sm font-medium text-white hover:bg-brand-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Placing Order...
          </>
        ) : (
          "Place Order"
        )}
      </button>
    </div>
  );
}
