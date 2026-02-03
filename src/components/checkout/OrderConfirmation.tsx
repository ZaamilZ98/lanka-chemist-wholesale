"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { BankDetailsResponse, OrderDetailResponse } from "@/types/api";
import { DELIVERY_METHOD_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import Skeleton from "@/components/ui/Skeleton";

export default function OrderConfirmation() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("No order specified");
      setIsLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) {
          setError("Order not found");
          return;
        }
        const data = await res.json();
        setOrder(data.order);

        // Fetch bank details if bank transfer
        if (data.order.payment_method === "bank_transfer") {
          const bankRes = await fetch("/api/checkout/bank-details");
          if (bankRes.ok) {
            const bankData: BankDetailsResponse = await bankRes.json();
            setBankDetails(bankData);
          }
        }
      } catch {
        setError("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <Skeleton className="h-10 w-10 rounded-full mx-auto mb-4" />
        <Skeleton className="h-7 w-64 mx-auto mb-2" />
        <Skeleton className="h-5 w-48 mx-auto mb-8" />
        <Skeleton className="h-40 w-full rounded-lg mb-4" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center">
        <p className="text-gray-600">{error || "Order not found"}</p>
        <Link
          href="/products"
          className="mt-4 inline-flex text-sm font-medium text-brand-green hover:text-brand-green-dark"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const isDelivery = order.delivery_method !== "pickup";
  const isBankTransfer = order.payment_method === "bank_transfer";
  const formattedDate = new Date(order.created_at).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mb-4">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Order Placed Successfully</h1>
        <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
      </div>

      {/* Order number */}
      <div className="rounded-lg border-2 border-brand-green bg-brand-green-light p-4 text-center mb-8">
        <p className="text-xs font-medium text-brand-green uppercase tracking-wider mb-1">
          Order Number
        </p>
        <p className="text-2xl font-bold text-brand-green font-mono tracking-wider">
          {order.order_number}
        </p>
      </div>

      {/* Items table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Items Ordered</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {order.items.map((item) => (
            <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900">{item.product_name}</p>
                {item.product_sku && (
                  <p className="text-xs text-gray-400">SKU: {item.product_sku}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm text-gray-600">
                  {item.quantity} &times; Rs {item.unit_price.toLocaleString("en-LK")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  Rs {item.total_price.toLocaleString("en-LK")}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>Rs {order.subtotal.toLocaleString("en-LK")}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery Fee</span>
            <span>
              {order.delivery_fee > 0
                ? `Rs ${order.delivery_fee.toLocaleString("en-LK")}`
                : "Free"}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold text-gray-900 pt-1.5 border-t border-gray-200">
            <span>Total</span>
            <span>Rs {order.total.toLocaleString("en-LK")}</span>
          </div>
        </div>
      </div>

      {/* Order details */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3 mb-6">
        <h2 className="text-sm font-semibold text-gray-900">Order Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Delivery Method:</span>
            <p className="font-medium text-gray-900">
              {DELIVERY_METHOD_LABELS[order.delivery_method] || order.delivery_method}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Payment Method:</span>
            <p className="font-medium text-gray-900">
              {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
            </p>
          </div>
          {order.preferred_delivery_date && (
            <div>
              <span className="text-gray-500">Preferred Delivery Date:</span>
              <p className="font-medium text-gray-900">
                {new Date(order.preferred_delivery_date).toLocaleDateString("en-LK", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
          {order.order_notes && (
            <div className="sm:col-span-2">
              <span className="text-gray-500">Order Notes:</span>
              <p className="font-medium text-gray-900">{order.order_notes}</p>
            </div>
          )}
        </div>

        {/* Delivery address */}
        {isDelivery && order.delivery_address && (
          <div className="text-sm pt-2 border-t border-gray-100">
            <span className="text-gray-500">Delivery Address:</span>
            <p className="font-medium text-gray-900 mt-0.5">
              {order.delivery_address.label && (
                <span className="text-gray-500">{order.delivery_address.label}: </span>
              )}
              {order.delivery_address.address_line1}
              {order.delivery_address.address_line2 && `, ${order.delivery_address.address_line2}`}
              <br />
              {order.delivery_address.city}, {order.delivery_address.district}
              {order.delivery_address.postal_code && ` ${order.delivery_address.postal_code}`}
            </p>
          </div>
        )}
      </div>

      {/* Bank details for bank transfer */}
      {isBankTransfer && bankDetails && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            Bank Transfer Details
          </h3>
          <p className="text-xs text-blue-700 mb-3">
            Please transfer Rs {order.total.toLocaleString("en-LK")} to the following account
            and include your order number ({order.order_number}) as the payment reference.
          </p>
          <dl className="space-y-1 text-sm">
            {bankDetails.bank_name && (
              <div className="flex gap-2">
                <dt className="text-blue-600 w-28 shrink-0">Bank:</dt>
                <dd className="text-blue-900 font-medium">{bankDetails.bank_name}</dd>
              </div>
            )}
            {bankDetails.bank_account_name && (
              <div className="flex gap-2">
                <dt className="text-blue-600 w-28 shrink-0">Account Name:</dt>
                <dd className="text-blue-900 font-medium">{bankDetails.bank_account_name}</dd>
              </div>
            )}
            {bankDetails.bank_account_number && (
              <div className="flex gap-2">
                <dt className="text-blue-600 w-28 shrink-0">Account No:</dt>
                <dd className="text-blue-900 font-medium font-mono">{bankDetails.bank_account_number}</dd>
              </div>
            )}
            {bankDetails.bank_branch && (
              <div className="flex gap-2">
                <dt className="text-blue-600 w-28 shrink-0">Branch:</dt>
                <dd className="text-blue-900 font-medium">{bankDetails.bank_branch}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* COD notice */}
      {!isBankTransfer && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
          <p className="text-sm text-amber-800">
            Payment of <strong>Rs {order.total.toLocaleString("en-LK")}</strong> is due on delivery.
            Please have the exact amount ready.
          </p>
        </div>
      )}

      {/* Notices */}
      <div className="space-y-3 mb-8">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            <p className="text-sm text-gray-600">
              We may contact you by phone or WhatsApp for order confirmation and delivery coordination.
            </p>
          </div>
        </div>

        {isDelivery && order.delivery_method === "standard" && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex gap-3">
              <svg className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <p className="text-sm text-gray-600">
                The delivery fee shown is an estimate and may be adjusted after order review.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-lg bg-brand-green px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-green-dark transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
