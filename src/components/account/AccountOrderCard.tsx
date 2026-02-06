"use client";

import Link from "next/link";
import { ORDER_STATUS_LABELS, DELIVERY_METHOD_LABELS } from "@/lib/constants";
import type { CustomerOrderListItem } from "@/types/api";

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

export default function AccountOrderCard({ order }: { order: CustomerOrderListItem }) {
  const statusStyle = STATUS_STYLES[order.status] || "bg-gray-100 text-gray-700";

  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-green hover:shadow-sm transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">
            #{order.order_number}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle}`}>
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {formatDate(order.created_at)} at {formatTime(order.created_at)}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          <span>
            {order.item_count} item{order.item_count !== 1 ? "s" : ""}
          </span>
          <span className="text-gray-300">|</span>
          <span>{DELIVERY_METHOD_LABELS[order.delivery_method] || order.delivery_method}</span>
          {order.payment_status === "paid" && (
            <>
              <span className="text-gray-300">|</span>
              <span className="text-green-600 font-medium">Paid</span>
            </>
          )}
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(order.total)}
          </span>
        </div>
      </div>

      {/* View details indicator */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end gap-1 text-sm text-brand-green font-medium">
        View Details
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}
