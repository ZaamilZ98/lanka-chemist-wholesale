"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminOrderListItem, PaginatedResponse } from "@/types/admin";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import PageHeader from "./PageHeader";
import DataTable, { type Column } from "./DataTable";
import StatusBadge from "./StatusBadge";

function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-LK", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 20;

export default function OrdersClient() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<AdminOrderListItem>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (status) params.set("status", status);
      if (paymentStatus) params.set("payment_status", paymentStatus);
      if (search) params.set("search", search);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [page, status, paymentStatus, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  const columns: Column<AdminOrderListItem>[] = [
    {
      key: "order_number",
      header: "Order #",
      render: (row) => (
        <span className="font-medium text-gray-900">{row.order_number}</span>
      ),
    },
    {
      key: "customer_name",
      header: "Customer",
      render: (row) => <span className="text-gray-700">{row.customer_name}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge type="order" status={row.status} />,
    },
    {
      key: "payment_status",
      header: "Payment",
      className: "hidden md:table-cell",
      render: (row) => <StatusBadge type="payment" status={row.payment_status} />,
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      render: (row) => (
        <span className="font-medium text-gray-900 tabular-nums">
          {formatCurrency(row.total)}
        </span>
      ),
    },
    {
      key: "item_count",
      header: "Items",
      className: "text-center hidden lg:table-cell",
      render: (row) => <span className="text-gray-600">{row.item_count}</span>,
    },
    {
      key: "created_at",
      header: "Date",
      className: "hidden md:table-cell",
      render: (row) => (
        <span className="text-xs text-gray-500">{formatDate(row.created_at)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Orders" />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          >
            <option value="">All Statuses</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Payment</label>
          <select
            value={paymentStatus}
            onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          >
            <option value="">All Payments</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          />
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Order # or customer..."
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green w-48"
            />
          </div>
          <button
            type="submit"
            className="self-end rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div
        className="cursor-pointer"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const row = target.closest("tr");
          if (!row || row.closest("thead")) return;
          const rowIndex = Array.from(row.parentElement?.children || []).indexOf(row);
          const order = data.data[rowIndex];
          if (order) router.push(`/admin/orders/${order.id}`);
        }}
      >
        <DataTable
          columns={columns}
          data={data.data}
          isLoading={isLoading}
          rowKey={(row) => row.id}
          emptyTitle="No orders found"
          emptyDescription="Try adjusting your filters or date range."
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.total)} of {data.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
