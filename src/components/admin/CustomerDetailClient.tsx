"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { AdminCustomerDetail } from "@/types/admin";
import type { OrderStatus, PaymentStatus } from "@/types/database";
import { CUSTOMER_TYPE_LABELS, CUSTOMER_STATUS_LABELS } from "@/lib/constants";
import PageHeader from "./PageHeader";
import StatusBadge from "./StatusBadge";
import ConfirmDialog from "./ConfirmDialog";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Props {
  customerId: string;
}

export default function CustomerDetailClient({ customerId }: Props) {
  const [customer, setCustomer] = useState<
    AdminCustomerDetail & {
      recent_orders?: {
        id: string;
        order_number: string;
        status: OrderStatus;
        payment_status: PaymentStatus;
        total: number;
        created_at: string;
      }[];
    }
  | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Action state
  const [actionDialog, setActionDialog] = useState<{
    action: "approved" | "rejected" | "suspended";
    open: boolean;
  }>({ action: "approved", open: false });
  const [reason, setReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchCustomer = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCustomer(data);
    } catch {
      setError("Failed to load customer details");
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  async function handleStatusChange() {
    if (!customer) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionDialog.action,
          rejection_reason: reason.trim() || undefined,
          admin_notes: adminNotes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      setActionDialog({ ...actionDialog, open: false });
      setReason("");
      setAdminNotes("");
      fetchCustomer();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update customer");
    } finally {
      setActionLoading(false);
    }
  }

  function openAction(action: "approved" | "rejected" | "suspended") {
    setActionDialog({ action, open: true });
    setReason("");
    setAdminNotes("");
    setActionError("");
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Customer Detail"
          breadcrumbs={[
            { label: "Customers", href: "/admin/customers" },
            { label: "Loading..." },
          ]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full max-w-sm" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <Skeleton className="h-6 w-36 mb-4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div>
        <PageHeader
          title="Customer Detail"
          breadcrumbs={[
            { label: "Customers", href: "/admin/customers" },
            { label: "Error" },
          ]}
        />
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error || "Customer not found"}
        </div>
      </div>
    );
  }

  const actionButtons = [];
  if (customer.status === "pending") {
    actionButtons.push(
      <Button key="approve" variant="primary" size="sm" onClick={() => openAction("approved")}>
        Approve
      </Button>,
      <Button key="reject" variant="danger" size="sm" onClick={() => openAction("rejected")}>
        Reject
      </Button>,
    );
  } else if (customer.status === "approved") {
    actionButtons.push(
      <Button key="suspend" variant="danger" size="sm" onClick={() => openAction("suspended")}>
        Suspend
      </Button>,
    );
  } else if (customer.status === "suspended" || customer.status === "rejected") {
    actionButtons.push(
      <Button key="approve" variant="primary" size="sm" onClick={() => openAction("approved")}>
        Approve
      </Button>,
    );
  }

  const dialogTitles: Record<string, string> = {
    approved: "Approve Customer",
    rejected: "Reject Customer",
    suspended: "Suspend Customer",
  };
  const dialogMessages: Record<string, string> = {
    approved: `Are you sure you want to approve ${customer.contact_name}? They will be able to place orders.`,
    rejected: `Are you sure you want to reject ${customer.contact_name}? They will not be able to use the platform.`,
    suspended: `Are you sure you want to suspend ${customer.contact_name}? They will not be able to place orders.`,
  };

  return (
    <div>
      <PageHeader
        title={customer.business_name || customer.contact_name}
        breadcrumbs={[
          { label: "Customers", href: "/admin/customers" },
          { label: customer.business_name || customer.contact_name },
        ]}
        actions={<div className="flex items-center gap-2">{actionButtons}</div>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-semibold text-gray-900">Customer Information</h2>
              <StatusBadge type="customer" status={customer.status} />
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-gray-500">Contact Name</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{customer.contact_name}</dd>
              </div>
              {customer.business_name && (
                <div>
                  <dt className="text-gray-500">Business Name</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{customer.business_name}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{customer.email}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{customer.phone}</dd>
              </div>
              {customer.whatsapp && (
                <div>
                  <dt className="text-gray-500">WhatsApp</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{customer.whatsapp}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Customer Type</dt>
                <dd className="mt-0.5 font-medium text-gray-900">
                  {CUSTOMER_TYPE_LABELS[customer.customer_type] || customer.customer_type}
                </dd>
              </div>
              {customer.slmc_number && (
                <div>
                  <dt className="text-gray-500">SLMC Number</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{customer.slmc_number}</dd>
                </div>
              )}
              {customer.nmra_license_number && (
                <div>
                  <dt className="text-gray-500">NMRA License</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{customer.nmra_license_number}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Registered</dt>
                <dd className="mt-0.5 text-gray-700">{formatDate(customer.created_at)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="mt-0.5 text-gray-700">{formatDate(customer.updated_at)}</dd>
              </div>
            </dl>
            {customer.rejection_reason && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs font-medium text-red-800">Rejection/Suspension Reason</p>
                <p className="mt-1 text-sm text-red-700">{customer.rejection_reason}</p>
              </div>
            )}
            {customer.admin_notes && (
              <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-3">
                <p className="text-xs font-medium text-gray-600">Admin Notes</p>
                <p className="mt-1 text-sm text-gray-700">{customer.admin_notes}</p>
              </div>
            )}
          </div>

          {/* Addresses */}
          {customer.customer_addresses.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Addresses</h2>
              <div className="space-y-3">
                {customer.customer_addresses.map((addr) => (
                  <div key={addr.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{addr.label}</span>
                      {addr.is_default && (
                        <span className="text-xs bg-brand-green/10 text-brand-green px-1.5 py-0.5 rounded font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">
                      {addr.address_line1}
                      {addr.address_line2 && `, ${addr.address_line2}`}
                      <br />
                      {addr.city}, {addr.district}
                      {addr.postal_code && ` ${addr.postal_code}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {customer.recent_orders && customer.recent_orders.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Payment</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customer.recent_orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-medium text-brand-green hover:underline"
                          >
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge type="order" status={order.status} />
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge type="payment" status={order.payment_status} />
                        </td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Documents & Actions */}
        <div className="space-y-6">
          {/* Verification Documents */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Verification Documents</h2>
            {customer.verification_documents.length === 0 ? (
              <p className="text-sm text-gray-500">No documents uploaded.</p>
            ) : (
              <div className="space-y-3">
                {customer.verification_documents.map((doc) => (
                  <div key={doc.id} className="rounded-lg border border-gray-100 p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      {doc.document_type === "slmc_id" ? "SLMC ID" : "NMRA License"}
                    </p>
                    <p className="mt-1 text-sm text-gray-700 truncate">{doc.file_name}</p>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-green hover:underline"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      View Document
                    </a>
                    <p className="mt-1 text-xs text-gray-400">
                      Uploaded {formatDate(doc.uploaded_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Status */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Status</h2>
            <div className="flex items-center gap-2 mb-4">
              <StatusBadge type="customer" status={customer.status} />
              <span className="text-sm text-gray-500">
                {CUSTOMER_STATUS_LABELS[customer.status]}
              </span>
            </div>
            <div className="space-y-2">
              {actionButtons.map((btn) => (
                <div key={btn.key} className="[&>button]:w-full">{btn}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={actionDialog.open}
        title={dialogTitles[actionDialog.action]}
        message={dialogMessages[actionDialog.action]}
        confirmLabel={
          actionDialog.action === "approved" ? "Approve" : actionDialog.action === "rejected" ? "Reject" : "Suspend"
        }
        variant={actionDialog.action === "approved" ? "default" : "destructive"}
        loading={actionLoading}
        onConfirm={handleStatusChange}
        onCancel={() => {
          if (!actionLoading) {
            setActionDialog({ ...actionDialog, open: false });
            setActionError("");
          }
        }}
      >
        {(actionDialog.action === "rejected" || actionDialog.action === "suspended") && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
                placeholder="Enter the reason..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Notes (optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
                placeholder="Internal notes..."
              />
            </div>
          </div>
        )}
        {actionError && (
          <p className="mt-2 text-sm text-red-600">{actionError}</p>
        )}
      </ConfirmDialog>
    </div>
  );
}
