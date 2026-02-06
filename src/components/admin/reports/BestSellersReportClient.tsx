"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import DataTable, { Column } from "@/components/admin/DataTable";
import DateRangeFilter from "./DateRangeFilter";
import ExportButton from "./ExportButton";

interface BestSellerRow {
  rank: number;
  product_name: string;
  brand_name: string;
  sku: string | null;
  category: string | null;
  units_sold: number;
  revenue: number;
  current_stock: number;
}

function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;
}

export default function BestSellersReportClient() {
  const [data, setData] = useState<BestSellerRow[]>([]);
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

      const res = await fetch(`/api/admin/reports/best-sellers?${params.toString()}`);
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

  const columns: Column<BestSellerRow>[] = [
    {
      key: "rank",
      header: "#",
      render: (row) => (
        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
          row.rank <= 3 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
        }`}>
          {row.rank}
        </span>
      ),
    },
    { key: "product_name", header: "Product", render: (row) => row.product_name },
    { key: "brand_name", header: "Brand", render: (row) => row.brand_name },
    { key: "sku", header: "SKU", render: (row) => row.sku || "-" },
    { key: "category", header: "Category", render: (row) => row.category || "-" },
    {
      key: "units_sold",
      header: "Units Sold",
      render: (row) => <span className="font-semibold">{row.units_sold.toLocaleString()}</span>,
    },
    {
      key: "revenue",
      header: "Revenue",
      render: (row) => <span className="font-semibold text-brand-green">{formatCurrency(row.revenue)}</span>,
    },
    {
      key: "current_stock",
      header: "Stock",
      render: (row) => (
        <span className={row.current_stock < 10 ? "text-red-600 font-medium" : ""}>
          {row.current_stock}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Best Sellers"
          breadcrumbs={[
            { label: "Reports", href: "/admin/reports" },
            { label: "Best Sellers" },
          ]}
        />
        <ExportButton
          endpoint="/api/admin/reports/best-sellers"
          params={{ from, to }}
          filename={`best-sellers-${from}-to-${to}.xlsx`}
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
          emptyTitle="No sales data"
          emptyDescription="No sales data found for this period"
        />
      )}
    </div>
  );
}
