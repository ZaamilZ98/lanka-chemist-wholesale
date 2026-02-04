"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminOrderDetail } from "@/types/admin";
import {
  ORDER_STATUS_LABELS,
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  VALID_ORDER_TRANSITIONS,
} from "@/lib/constants";
import PageHeader from "./PageHeader";
import StatusBadge from "./StatusBadge";
import OrderStatusStepper from "./OrderStatusStepper";
import OrderStatusTimeline from "./OrderStatusTimeline";
import ConfirmDialog from "./ConfirmDialog";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";

function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  orderId: string;
}

export default function OrderDetailClient({ orderId }: Props) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Status change
  const [statusAction, setStatusAction] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // Payment status
  const [paymentAction, setPaymentAction] = useState<string | null>(null);

  // Invoice
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOrder(data);
    } catch {
      setError("Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function handleStatusChange() {
    if (!order || !statusAction) return;
    setActionLoading(true);
    setActionError("");
    try {
      const body: Record<string, string> = { status: statusAction };
      if (statusAction === "cancelled") body.cancelled_reason = cancelReason;
      if (statusNotes.trim()) body.notes = statusNotes.trim();

      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      setStatusAction(null);
      setCancelReason("");
      setStatusNotes("");
      fetchOrder();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePaymentChange() {
    if (!order || !paymentAction) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: paymentAction }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      setPaymentAction(null);
      fetchOrder();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update payment");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGenerateInvoice() {
    if (!order) return;
    setInvoiceLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/invoice`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate invoice");
      }
      fetchOrder();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to generate invoice");
    } finally {
      setInvoiceLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Order Detail"
          breadcrumbs={[{ label: "Orders", href: "/admin/orders" }, { label: "Loading..." }]}
        />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <PageHeader
          title="Order Detail"
          breadcrumbs={[{ label: "Orders", href: "/admin/orders" }, { label: "Error" }]}
        />
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error || "Order not found"}
        </div>
      </div>
    );
  }

  const allowedTransitions = VALID_ORDER_TRANSITIONS[order.status] || [];
  const nonCancelTransitions = allowedTransitions.filter((s) => s !== "cancelled");
  const canCancel = allowedTransitions.includes("cancelled");

  return (
    <div>
      <PageHeader
        title={order.order_number}
        breadcrumbs={[
          { label: "Orders", href: "/admin/orders" },
          { label: order.order_number },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {order.status !== "cancelled" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/admin/orders/${orderId}/picking-list`, "_blank")}
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Picking List
              </Button>
            )}
            {nonCancelTransitions.map((nextStatus) => (
              <Button
                key={nextStatus}
                variant="primary"
                size="sm"
                onClick={() => { setStatusAction(nextStatus); setActionError(""); }}
              >
                {nextStatus === "confirmed" && "Confirm Order"}
                {nextStatus === "packing" && "Mark as Packing"}
                {nextStatus === "ready" && "Mark as Ready"}
                {nextStatus === "dispatched" && "Mark as Dispatched"}
                {nextStatus === "delivered" && "Mark as Delivered"}
              </Button>
            ))}
            {canCancel && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => { setStatusAction("cancelled"); setActionError(""); }}
              >
                Cancel Order
              </Button>
            )}
          </div>
        }
      />

      {/* Status stepper */}
      <div className="mb-6">
        <OrderStatusStepper currentStatus={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Order Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">SKU</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-gray-900">{item.product_name}</span>
                          {item.product_generic_name && (
                            <span className="block text-xs text-gray-500">{item.product_generic_name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{item.product_sku || "—"}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-sm text-gray-600">Subtotal</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-gray-900">{formatCurrency(order.subtotal)}</td>
                  </tr>
                  {order.delivery_fee > 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right text-sm text-gray-600">
                        Delivery Fee
                        {order.delivery_distance_km && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({order.delivery_distance_km} km)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium text-gray-900">{formatCurrency(order.delivery_fee)}</td>
                    </tr>
                  )}
                  <tr className="border-t border-gray-300">
                    <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Total</td>
                    <td className="px-4 py-3 text-right tabular-nums text-lg font-bold text-gray-900">{formatCurrency(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Status History */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Status History</h2>
            <OrderStatusTimeline history={order.status_history} />
          </div>
        </div>

        {/* Right: Customer, Delivery, Payment */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Customer</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900">
                  {order.customer.contact_name}
                  {order.customer.business_name && (
                    <span className="block text-xs text-gray-500">{order.customer.business_name}</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-700">{order.customer.email}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-700">{order.customer.phone}</dd>
              </div>
            </dl>
          </div>

          {/* Delivery */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Delivery</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Method</dt>
                <dd className="font-medium text-gray-900">
                  {DELIVERY_METHOD_LABELS[order.delivery_method] || order.delivery_method}
                </dd>
              </div>
              {order.delivery_address && (
                <div>
                  <dt className="text-gray-500">Address</dt>
                  <dd className="text-gray-700">
                    {order.delivery_address.address_line1}
                    {order.delivery_address.address_line2 && (
                      <>, {order.delivery_address.address_line2}</>
                    )}
                    <br />
                    {order.delivery_address.city}, {order.delivery_address.district}
                    {order.delivery_address.postal_code && ` ${order.delivery_address.postal_code}`}
                  </dd>
                </div>
              )}
              {order.preferred_delivery_date && (
                <div>
                  <dt className="text-gray-500">Preferred Date</dt>
                  <dd className="text-gray-700">{order.preferred_delivery_date}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Payment</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Method</dt>
                <dd className="font-medium text-gray-900">
                  {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="mt-1">
                  <StatusBadge type="payment" status={order.payment_status} />
                </dd>
              </div>
            </dl>
            {order.payment_status !== "paid" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => setPaymentAction("paid")}
              >
                Mark as Paid
              </Button>
            )}
            {order.payment_status === "paid" && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
                onClick={() => setPaymentAction("refunded")}
              >
                Mark as Refunded
              </Button>
            )}
          </div>

          {/* Invoice */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Invoice</h2>
            {order.invoice_url ? (
              <div className="space-y-3">
                <a
                  href={`/api/admin/orders/${orderId}/invoice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand-green hover:underline"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Invoice
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleGenerateInvoice}
                  disabled={invoiceLoading}
                >
                  {invoiceLoading ? "Regenerating..." : "Regenerate Invoice"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">No invoice generated yet.</p>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={handleGenerateInvoice}
                  disabled={invoiceLoading}
                >
                  {invoiceLoading ? "Generating..." : "Generate Invoice"}
                </Button>
              </div>
            )}
          </div>

          {/* Order Notes */}
          {(order.order_notes || order.admin_notes || order.cancelled_reason) && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Notes</h2>
              {order.order_notes && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500">Customer Notes</p>
                  <p className="mt-1 text-sm text-gray-700">{order.order_notes}</p>
                </div>
              )}
              {order.admin_notes && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500">Admin Notes</p>
                  <p className="mt-1 text-sm text-gray-700">{order.admin_notes}</p>
                </div>
              )}
              {order.cancelled_reason && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-xs font-medium text-red-800">Cancellation Reason</p>
                  <p className="mt-1 text-sm text-red-700">{order.cancelled_reason}</p>
                </div>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Timeline</h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-gray-500">Created</dt><dd className="text-gray-700">{formatDate(order.created_at)}</dd></div>
              {order.confirmed_at && <div><dt className="text-gray-500">Confirmed</dt><dd className="text-gray-700">{formatDate(order.confirmed_at)}</dd></div>}
              {order.dispatched_at && <div><dt className="text-gray-500">Dispatched</dt><dd className="text-gray-700">{formatDate(order.dispatched_at)}</dd></div>}
              {order.delivered_at && <div><dt className="text-gray-500">Delivered</dt><dd className="text-gray-700">{formatDate(order.delivered_at)}</dd></div>}
            </dl>
          </div>
        </div>
      </div>

      {/* Status change dialog */}
      <ConfirmDialog
        open={!!statusAction && statusAction !== "cancelled"}
        title={`Update Order Status`}
        message={`Change order ${order.order_number} status to "${ORDER_STATUS_LABELS[statusAction || ""] || statusAction}"?`}
        confirmLabel={ORDER_STATUS_LABELS[statusAction || ""] || "Update"}
        variant="default"
        loading={actionLoading}
        onConfirm={handleStatusChange}
        onCancel={() => { if (!actionLoading) { setStatusAction(null); setActionError(""); } }}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            rows={2}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
            placeholder="Optional notes..."
          />
        </div>
        {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
      </ConfirmDialog>

      {/* Cancel dialog */}
      <ConfirmDialog
        open={statusAction === "cancelled"}
        title="Cancel Order"
        message={`Are you sure you want to cancel order ${order.order_number}? This cannot be undone.`}
        confirmLabel="Cancel Order"
        variant="destructive"
        loading={actionLoading}
        onConfirm={handleStatusChange}
        onCancel={() => { if (!actionLoading) { setStatusAction(null); setCancelReason(""); setActionError(""); } }}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
              placeholder="Why is this order being cancelled?"
            />
          </div>
        </div>
        {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
      </ConfirmDialog>

      {/* Payment dialog */}
      <ConfirmDialog
        open={!!paymentAction}
        title="Update Payment Status"
        message={`Mark payment as "${paymentAction === "paid" ? "Paid" : "Refunded"}" for order ${order.order_number}?`}
        confirmLabel={paymentAction === "paid" ? "Mark as Paid" : "Mark as Refunded"}
        variant={paymentAction === "refunded" ? "destructive" : "default"}
        loading={actionLoading}
        onConfirm={handlePaymentChange}
        onCancel={() => { if (!actionLoading) { setPaymentAction(null); setActionError(""); } }}
      >
        {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
      </ConfirmDialog>
    </div>
  );
}
