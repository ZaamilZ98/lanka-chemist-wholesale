"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AdminProductListItem, PaginatedResponse } from "@/types/admin";
import PageHeader from "./PageHeader";
import DataTable, { type Column } from "./DataTable";
import ConfirmDialog from "./ConfirmDialog";
import CsvImportModal from "./CsvImportModal";
import BulkPriceEditor from "./BulkPriceEditor";
import Button from "@/components/ui/Button";

function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PAGE_SIZE = 20;

export default function ProductsAdminClient() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<AdminProductListItem>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [categoryId, setCategoryId] = useState("");
  const [manufacturerId, setManufacturerId] = useState("");
  const [isActive, setIsActive] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  // Dropdowns data
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [manufacturers, setManufacturers] = useState<{ id: string; name: string }[]>([]);

  // Modals
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch categories and manufacturers for filter dropdowns
  useEffect(() => {
    async function loadFilters() {
      try {
        const [catRes, mfrRes] = await Promise.all([
          fetch("/api/admin/categories").catch(() => null),
          fetch("/api/admin/manufacturers").catch(() => null),
        ]);
        if (catRes?.ok) {
          const data = await catRes.json();
          setCategories(data.data || data || []);
        }
        if (mfrRes?.ok) {
          const data = await mfrRes.json();
          setManufacturers(data.data || data || []);
        }
      } catch { /* ignore - dropdowns are optional */ }
    }
    loadFilters();
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (categoryId) params.set("category_id", categoryId);
      if (manufacturerId) params.set("manufacturer_id", manufacturerId);
      if (isActive) params.set("is_active", isActive);
      if (lowStock) params.set("low_stock", "true");
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/products?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, [page, categoryId, manufacturerId, isActive, lowStock, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  async function handleDuplicate(id: string) {
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate");
      const data = await res.json();
      router.push(`/admin/products/${data.product.id}/edit`);
    } catch {
      setError("Failed to duplicate product");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteTarget(null);
      fetchProducts();
    } catch {
      setError("Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  }

  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  const columns: Column<AdminProductListItem>[] = [
    {
      key: "product",
      header: "Product",
      render: (row) => (
        <div>
          <Link
            href={`/admin/products/${row.id}`}
            className="font-medium text-gray-900 hover:text-brand-green"
            onClick={(e) => e.stopPropagation()}
          >
            {row.brand_name}
          </Link>
          <span className="block text-xs text-gray-500">{row.generic_name}</span>
        </div>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      className: "hidden md:table-cell",
      render: (row) => <span className="text-gray-600 text-xs font-mono">{row.sku || "—"}</span>,
    },
    {
      key: "price",
      header: "Price",
      className: "text-right",
      render: (row) => (
        <span className="font-medium text-gray-900 tabular-nums">
          {formatCurrency(row.wholesale_price)}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      className: "text-right",
      render: (row) => (
        <span className={`tabular-nums font-medium ${row.stock_quantity <= 0 ? "text-red-600" : "text-gray-700"}`}>
          {row.stock_quantity}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      className: "hidden lg:table-cell",
      render: (row) => <span className="text-gray-600 text-xs">{row.category_name || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
            row.is_active
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-gray-100 text-gray-600 ring-gray-500/20"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/admin/products/${row.id}/edit`}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            title="Edit"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </Link>
          <button
            onClick={() => handleDuplicate(row.id)}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            title="Duplicate"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
            </svg>
          </button>
          <button
            onClick={() => setDeleteTarget({ id: row.id, name: row.brand_name })}
            className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCsvModalOpen(true)}>
              Import CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkPriceOpen(true)}>
              Bulk Price
            </Button>
            <Link href="/admin/products/new">
              <Button variant="primary" size="sm">Add Product</Button>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        {categories.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {manufacturers.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Manufacturer</label>
            <select
              value={manufacturerId}
              onChange={(e) => { setManufacturerId(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
            >
              <option value="">All Manufacturers</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={isActive}
            onChange={(e) => { setIsActive(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end pb-0.5">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(e) => { setLowStock(e.target.checked); setPage(1); }}
              className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
            />
            <span className="text-sm text-gray-700">Low Stock</span>
          </label>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name, SKU..."
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
      <DataTable
        columns={columns}
        data={data.data}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        emptyTitle="No products found"
        emptyDescription="Try adjusting your filters or add a new product."
      />

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
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
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

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? If this product has existing orders, it will be deactivated instead.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => { if (!deleteLoading) setDeleteTarget(null); }}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onImported={fetchProducts}
      />

      {/* Bulk Price Editor */}
      <BulkPriceEditor
        open={bulkPriceOpen}
        onClose={() => setBulkPriceOpen(false)}
        onUpdated={fetchProducts}
      />
    </div>
  );
}
