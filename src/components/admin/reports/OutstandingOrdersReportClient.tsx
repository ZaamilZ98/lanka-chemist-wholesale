"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import DataTable, { Column } from "@/components/admin/DataTable";
import ExportButton from "./ExportButton";

interface OutstandingRow {
  order_number: string;
  customer_name: string;
  business_name: string | null;
  status: string;
  delivery_method: string;
  item_count: number;
  total: number;
  days_pending: number;
  created_at: string;
}

interface StatusSummary {
  status: string;
  count: number;
  value: number;
}

interface Summary {
  total_orders: number;
  total_value: number;
  by_status: StatusSummary[];
  urgent_count: number;
}

function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;
}

export default function OutstandingOrdersReportClient() {
  const [data, setData] = useState<OutstandingRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);

      const res = await fetch(`/api/admin/reports/outstanding-orders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch report");

      const result = await res.json();
      setData(result.data || []);
      setSummary(result.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<OutstandingRow>[] = [
    { key: "order_number", header: "Order #", render: (row) => row.order_number },
    { key: "customer_name", header: "Customer", render: (row) => row.customer_name },
    { key: "business_name", header: "Business", render: (row) => row.business_name || "-" },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const colors: Record<string, string> = {
          New: "bg-blue-100 text-blue-700",
          Confirmed: "bg-indigo-100 text-indigo-700",
          Packing: "bg-yellow-100 text-yellow-700",
          "Ready for Dispatch": "bg-orange-100 text-orange-700",
          Dispatched: "bg-purple-100 text-purple-700",
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[row.status] || "bg-gray-100 text-gray-700"}`}>
            {row.status}
          </span>
        );
      },
    },
    { key: "delivery_method", header: "Delivery", render: (row) => row.delivery_method },
    { key: "item_count", header: "Items", render: (row) => row.item_count },
    {
      key: "total",
      header: "Total",
      render: (row) => <span className="font-semibold">{formatCurrency(row.total)}</span>,
    },
    {
      key: "days_pending",
      header: "Days Pending",
      render: (row) => (
        <span className={`font-semibold ${row.days_pending > 3 ? "text-red-600" : row.days_pending > 1 ? "text-yellow-600" : "text-gray-600"}`}>
          {row.days_pending}
        </span>
      ),
    },
    { key: "created_at", header: "Order Date", render: (row) => row.created_at },
  ];

  const statusOptions = ["new", "confirmed", "packing", "ready", "dispatched"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Outstanding Orders"
          breadcrumbs={[
            { label: "Reports", href: "/admin/reports" },
            { label: "Outstanding Orders" },
          ]}
        />
        <ExportButton
          endpoint="/api/admin/reports/outstanding-orders"
          params={{ status }}
          filename={`outstanding-orders-${new Date().toISOString().split("T")[0]}.xlsx`}
        />
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status Filter</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green"
            >
              <option value="">All Outstanding</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark disabled:opacity-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Outstanding Orders</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total_orders}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-2xl font-bold text-brand-green">{formatCurrency(summary.total_value)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Urgent (3+ days)</p>
            <p className={`text-2xl font-bold ${summary.urgent_count > 0 ? "text-red-600" : "text-gray-900"}`}>
              {summary.urgent_count}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-2">By Status</p>
            <div className="space-y-1">
              {summary.by_status.map((s) => (
                <div key={s.status} className="flex justify-between text-xs">
                  <span className="text-gray-600">{s.status}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button onClick={fetchData} className="mt-4 text-sm text-red-600 hover:underline">
            Try again
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          rowKey={(row) => row.order_number}
          isLoading={isLoading}
          emptyTitle="No outstanding orders"
          emptyDescription="All orders have been completed"
        />
      )}
    </div>
  );
}
