"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import DataTable, { Column } from "@/components/admin/DataTable";
import DateRangeFilter from "./DateRangeFilter";
import ExportButton from "./ExportButton";
import { CUSTOMER_TYPE_LABELS } from "@/lib/constants";

interface CustomerRow {
  rank: number;
  customer_name: string;
  business_name: string | null;
  customer_type: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  last_order_date: string | null;
}

function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;
}

export default function CustomerAnalysisReportClient() {
  const [data, setData] = useState<CustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const res = await fetch(`/api/admin/reports/customer-analysis?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch report");

      const result = await res.json();
      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<CustomerRow>[] = [
    {
      key: "rank",
      header: "#",
      render: (row) => (
        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
          row.rank <= 3 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
        }`}>
          {row.rank}
        </span>
      ),
    },
    { key: "customer_name", header: "Contact Name", render: (row) => row.customer_name },
    { key: "business_name", header: "Business", render: (row) => row.business_name || "-" },
    {
      key: "customer_type",
      header: "Type",
      render: (row) => CUSTOMER_TYPE_LABELS[row.customer_type] || row.customer_type,
    },
    {
      key: "total_orders",
      header: "Orders",
      render: (row) => row.total_orders.toLocaleString(),
    },
    {
      key: "total_spent",
      header: "Total Spent",
      render: (row) => <span className="font-semibold text-brand-green">{formatCurrency(row.total_spent)}</span>,
    },
    {
      key: "average_order_value",
      header: "Avg Order",
      render: (row) => formatCurrency(row.average_order_value),
    },
    { key: "last_order_date", header: "Last Order", render: (row) => row.last_order_date || "-" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Customer Analysis"
          breadcrumbs={[
            { label: "Reports", href: "/admin/reports" },
            { label: "Customer Analysis" },
          ]}
        />
        <ExportButton
          endpoint="/api/admin/reports/customer-analysis"
          params={{ from, to }}
          filename={`customer-analysis-${from}-to-${to}.xlsx`}
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
          rowKey={(row) => String(row.rank)}
          isLoading={isLoading}
          emptyTitle="No customer data"
          emptyDescription="No customer data found for this period"
        />
      )}
    </div>
  );
}
