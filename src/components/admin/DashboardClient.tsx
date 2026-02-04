"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardStats, RecentOrder, LowStockProduct } from "@/types/admin";
import StatCard from "./StatCard";
import StatusBadge from "./StatusBadge";
import DataTable, { type Column } from "./DataTable";
import PageHeader from "./PageHeader";
import Skeleton from "@/components/ui/Skeleton";

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

const orderColumns: Column<RecentOrder>[] = [
  {
    key: "order_number",
    header: "Order",
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
    key: "created_at",
    header: "Date",
    render: (row) => (
      <span className="text-gray-500 text-xs">{formatDate(row.created_at)}</span>
    ),
  },
];

const lowStockColumns: Column<LowStockProduct>[] = [
  {
    key: "name",
    header: "Product",
    render: (row) => (
      <div>
        <span className="font-medium text-gray-900">{row.brand_name}</span>
        <span className="block text-xs text-gray-500">{row.generic_name}</span>
      </div>
    ),
  },
  {
    key: "stock",
    header: "Stock",
    className: "text-right",
    render: (row) => {
      const pct = row.low_stock_threshold > 0
        ? (row.stock_quantity / row.low_stock_threshold) * 100
        : 0;
      const barColor = pct <= 25 ? "bg-red-500" : pct <= 50 ? "bg-amber-500" : "bg-emerald-500";
      return (
        <div className="flex items-center gap-3 justify-end">
          <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className="text-sm tabular-nums font-medium text-gray-700 min-w-[4rem] text-right">
            {row.stock_quantity} / {row.low_stock_threshold}
          </span>
        </div>
      );
    },
  },
];

// Stat card icons as SVG elements
const OrdersIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const RevenueIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PendingOrdersIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const VerificationIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setStats(data);
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            </div>
          ))
        ) : stats ? (
          <>
            <StatCard
              label="Today's Orders"
              value={stats.todayOrders}
              icon={OrdersIcon}
              color="blue"
            />
            <StatCard
              label="Today's Revenue"
              value={formatCurrency(stats.todayRevenue)}
              icon={RevenueIcon}
              color="green"
            />
            <StatCard
              label="Pending Orders"
              value={stats.pendingOrders}
              icon={PendingOrdersIcon}
              color="amber"
            />
            <StatCard
              label="Pending Verifications"
              value={stats.pendingVerifications}
              icon={VerificationIcon}
              color="red"
            />
          </>
        ) : null}
      </div>

      {/* Two-column layout: Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm text-brand-green hover:text-brand-green-dark font-medium transition-colors"
            >
              View All
            </Link>
          </div>
          <DataTable
            columns={orderColumns}
            data={stats?.recentOrders ?? []}
            isLoading={isLoading}
            rowKey={(row) => row.id}
            emptyTitle="No orders yet"
            emptyDescription="Orders will appear here once customers start placing them."
            emptyIcon={OrdersIcon}
          />
        </div>

        {/* Low Stock Alerts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">
              Low Stock Alerts
              {stats && stats.lowStockCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                  {stats.lowStockCount}
                </span>
              )}
            </h2>
            <Link
              href="/admin/products"
              className="text-sm text-brand-green hover:text-brand-green-dark font-medium transition-colors"
            >
              View All
            </Link>
          </div>
          <DataTable
            columns={lowStockColumns}
            data={stats?.lowStockProducts ?? []}
            isLoading={isLoading}
            rowKey={(row) => row.id}
            emptyTitle="No low stock items"
            emptyDescription="All products are sufficiently stocked."
          />
        </div>
      </div>
    </div>
  );
}
