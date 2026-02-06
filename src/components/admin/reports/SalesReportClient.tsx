"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import DataTable, { Column } from "@/components/admin/DataTable";
import DateRangeFilter from "./DateRangeFilter";
import ExportButton from "./ExportButton";

interface SalesRow {
  date: string;
  order_number: string;
  customer_name: string;
  item_count: number;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  payment_status: string;
}

interface Summary {
  total_orders: number;
  total_revenue: number;
  total_delivery_fees: number;
  average_order_value: number;
}

function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;
}

export default function SalesReportClient() {
  const [data, setData] = useState<SalesRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to last 30 days
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
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

      const res = await fetch(`/api/admin/reports/sales?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch report");

      const result = await res.json();
      setData(result.data || []);
      setSummary(result.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<SalesRow>[] = [
    { key: "date", header: "Date", render: (row) => row.date },
    { key: "order_number", header: "Order #", render: (row) => row.order_number },
    { key: "customer_name", header: "Customer", render: (row) => row.customer_name },
    { key: "item_count", header: "Items", render: (row) => row.item_count },
    { key: "subtotal", header: "Subtotal", render: (row) => formatCurrency(row.subtotal) },
    { key: "delivery_fee", header: "Delivery", render: (row) => formatCurrency(row.delivery_fee) },
    {
      key: "total",
      header: "Total",
      render: (row) => <span className="font-semibold">{formatCurrency(row.total)}</span>,
    },
    { key: "status", header: "Status", render: (row) => row.status },
    {
      key: "payment_status",
      header: "Payment",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          row.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        }`}>
          {row.payment_status}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Sales Report"
          breadcrumbs={[
            { label: "Reports", href: "/admin/reports" },
            { label: "Sales" },
          ]}
        />
        <ExportButton
          endpoint="/api/admin/reports/sales"
          params={{ from, to }}
          filename={`sales-report-${from}-to-${to}.xlsx`}
        />
      </div>

      <DateRangeFilter
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onApply={fetchData}
        isLoading={isLoading}
      />

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total_orders}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-brand-green">{formatCurrency(summary.total_revenue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Delivery Fees</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_delivery_fees)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Avg Order Value</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.average_order_value)}</p>
          </div>
        </div>
      )}

      {/* Data table */}
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
          emptyTitle="No orders found"
          emptyDescription="No orders found for this period"
        />
      )}
    </div>
  );
}
