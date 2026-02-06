"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import DataTable, { Column } from "@/components/admin/DataTable";
import ExportButton from "./ExportButton";
import { STOCK_ADJUSTMENT_REASON_LABELS } from "@/lib/constants";

interface MovementRow {
  date: string;
  time: string;
  product_name: string;
  product_sku: string | null;
  reason: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference: string | null;
  notes: string | null;
}

interface Summary {
  total_movements: number;
  total_additions: number;
  total_deductions: number;
}

export default function InventoryMovementReportClient() {
  const [data, setData] = useState<MovementRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (reason) params.set("reason", reason);

      const res = await fetch(`/api/admin/reports/inventory-movement?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch report");

      const result = await res.json();
      setData(result.data || []);
      setSummary(result.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [from, to, reason]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<MovementRow>[] = [
    { key: "date", header: "Date", render: (row) => row.date },
    { key: "time", header: "Time", render: (row) => row.time },
    { key: "product_name", header: "Product", render: (row) => row.product_name },
    { key: "product_sku", header: "SKU", render: (row) => row.product_sku || "-" },
    { key: "reason", header: "Reason", render: (row) => row.reason },
    {
      key: "quantity_change",
      header: "Change",
      render: (row) => (
        <span className={`font-semibold ${row.quantity_change > 0 ? "text-green-600" : "text-red-600"}`}>
          {row.quantity_change > 0 ? "+" : ""}{row.quantity_change}
        </span>
      ),
    },
    { key: "quantity_before", header: "Before", render: (row) => row.quantity_before },
    { key: "quantity_after", header: "After", render: (row) => row.quantity_after },
    { key: "notes", header: "Notes", render: (row) => row.notes || "-" },
  ];

  const reasonOptions = Object.entries(STOCK_ADJUSTMENT_REASON_LABELS);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Inventory Movement"
          breadcrumbs={[
            { label: "Reports", href: "/admin/reports" },
            { label: "Inventory Movement" },
          ]}
        />
        <ExportButton
          endpoint="/api/admin/reports/inventory-movement"
          params={{ from, to, reason }}
          filename={`inventory-movement-${from}-to-${to}.xlsx`}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Date inputs */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green"
            >
              <option value="">All Reasons</option>
              {reasonOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark disabled:opacity-50 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Movements</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total_movements}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Additions</p>
            <p className="text-2xl font-bold text-green-600">+{summary.total_additions}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Deductions</p>
            <p className="text-2xl font-bold text-red-600">-{summary.total_deductions}</p>
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
          rowKey={(row) => `${row.date}-${row.time}-${row.product_name}`}
          isLoading={isLoading}
          emptyTitle="No stock movements"
          emptyDescription="No stock movements found for this period"
        />
      )}
    </div>
  );
}
