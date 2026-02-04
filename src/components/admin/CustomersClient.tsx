"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminCustomerListItem, PaginatedResponse } from "@/types/admin";
import { CUSTOMER_STATUS_LABELS, CUSTOMER_TYPE_LABELS } from "@/lib/constants";
import PageHeader from "./PageHeader";
import DataTable, { type Column } from "./DataTable";
import StatusBadge from "./StatusBadge";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const PAGE_SIZE = 20;

export default function CustomersClient() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<AdminCustomerListItem>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/customers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  }, [page, status, type, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  const columns: Column<AdminCustomerListItem>[] = [
    {
      key: "business_name",
      header: "Business Name",
      render: (row) => (
        <div>
          <span className="font-medium text-gray-900">
            {row.business_name || row.contact_name}
          </span>
          {row.business_name && (
            <span className="block text-xs text-gray-500">{row.contact_name}</span>
          )}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (row) => <span className="text-gray-700">{row.email}</span>,
    },
    {
      key: "phone",
      header: "Phone",
      className: "hidden md:table-cell",
      render: (row) => <span className="text-gray-600">{row.phone}</span>,
    },
    {
      key: "customer_type",
      header: "Type",
      className: "hidden lg:table-cell",
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          {CUSTOMER_TYPE_LABELS[row.customer_type] || row.customer_type}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge type="customer" status={row.status} />,
    },
    {
      key: "created_at",
      header: "Registered",
      className: "hidden lg:table-cell",
      render: (row) => (
        <span className="text-xs text-gray-500">{formatDate(row.created_at)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Customers" />

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
            {Object.entries(CUSTOMER_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          >
            <option value="">All Types</option>
            {Object.entries(CUSTOMER_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name, email, phone..."
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green w-56"
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
          const customer = data.data[rowIndex];
          if (customer) router.push(`/admin/customers/${customer.id}`);
        }}
      >
        <DataTable
          columns={columns}
          data={data.data}
          isLoading={isLoading}
          rowKey={(row) => row.id}
          emptyTitle="No customers found"
          emptyDescription="Try adjusting your filters or search."
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
