"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AdminProductDetail } from "@/types/admin";
import {
  DOSAGE_FORM_LABELS,
  PRODUCT_SECTION_LABELS,
  STOCK_ADJUSTMENT_REASON_LABELS,
} from "@/lib/constants";
import PageHeader from "./PageHeader";
import ConfirmDialog from "./ConfirmDialog";
import StockAdjustmentForm from "./StockAdjustmentForm";
import ProductImageManager from "./ProductImageManager";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";

function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  productId: string;
}

export default function ProductDetailClient({ productId }: Props) {
  const router = useRouter();
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setProduct(data);
    } catch {
      setError("Failed to load product");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  async function handleDuplicate() {
    try {
      const res = await fetch(`/api/admin/products/${productId}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      router.push(`/admin/products/${data.product.id}/edit`);
    } catch {
      setError("Failed to duplicate product");
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      router.push("/admin/products");
    } catch {
      setError("Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Product"
          breadcrumbs={[{ label: "Products", href: "/admin/products" }, { label: "Loading..." }]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><Skeleton className="h-64 w-full rounded-xl" /></div>
          <div><Skeleton className="h-48 w-full rounded-xl" /></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div>
        <PageHeader
          title="Product"
          breadcrumbs={[{ label: "Products", href: "/admin/products" }, { label: "Error" }]}
        />
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error || "Product not found"}
        </div>
      </div>
    );
  }

  const stockPct = product.low_stock_threshold > 0
    ? (product.stock_quantity / product.low_stock_threshold) * 100
    : 100;
  const stockColor = stockPct <= 25 ? "text-red-600" : stockPct <= 75 ? "text-amber-600" : "text-emerald-600";

  return (
    <div>
      <PageHeader
        title={product.brand_name}
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: product.brand_name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/admin/products/${productId}/edit`}>
              <Button variant="primary" size="sm">Edit</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleDuplicate}>
              Duplicate
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Images + Product info */}
        <div className="lg:col-span-2 space-y-6">
          <ProductImageManager
            productId={productId}
            images={product.images}
            onImagesChanged={fetchProduct}
          />

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-semibold text-gray-900">Product Information</h2>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                  product.is_active
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                    : "bg-gray-100 text-gray-600 ring-gray-500/20"
                }`}
              >
                {product.is_active ? "Active" : "Inactive"}
              </span>
              {product.is_prescription && (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                  Rx
                </span>
              )}
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-gray-500">Brand Name</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{product.brand_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Generic Name</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{product.generic_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">SKU</dt>
                <dd className="mt-0.5 font-mono text-gray-700">{product.sku || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Barcode</dt>
                <dd className="mt-0.5 text-gray-700">{product.barcode || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Section</dt>
                <dd className="mt-0.5 text-gray-700">{PRODUCT_SECTION_LABELS[product.section] || product.section}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd className="mt-0.5 text-gray-700">{product.category_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Manufacturer</dt>
                <dd className="mt-0.5 text-gray-700">{product.manufacturer_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Dosage Form</dt>
                <dd className="mt-0.5 text-gray-700">{product.dosage_form ? (DOSAGE_FORM_LABELS[product.dosage_form] || product.dosage_form) : "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Strength</dt>
                <dd className="mt-0.5 text-gray-700">{product.strength || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Pack Size</dt>
                <dd className="mt-0.5 text-gray-700">{product.pack_size || "—"}</dd>
              </div>
              {product.storage_conditions && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Storage</dt>
                  <dd className="mt-0.5 text-gray-700">{product.storage_conditions}</dd>
                </div>
              )}
              {product.description && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Description</dt>
                  <dd className="mt-0.5 text-gray-700">{product.description}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Stock Movement History */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Stock Movement History</h2>
            {product.stock_movements.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No stock movements recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Change</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Result</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">By</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {product.stock_movements.map((m) => (
                      <tr key={m.id}>
                        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{formatDate(m.created_at)}</td>
                        <td className="px-3 py-2">
                          <span className="text-xs font-medium text-gray-700">
                            {STOCK_ADJUSTMENT_REASON_LABELS[m.reason] || m.reason}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          <span className={m.quantity_change > 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                            {m.quantity_change > 0 ? "+" : ""}{m.quantity_change}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                          {m.quantity_before} → {m.quantity_after}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500 hidden md:table-cell">{m.admin_name || "System"}</td>
                        <td className="px-3 py-2 text-xs text-gray-500 hidden lg:table-cell truncate max-w-[200px]">{m.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Pricing & Stock */}
        <div className="space-y-6">
          {/* Pricing */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Pricing</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Wholesale Price</dt>
                <dd className="font-semibold text-gray-900">{formatCurrency(product.wholesale_price)}</dd>
              </div>
              {product.mrp !== null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">MRP</dt>
                  <dd className="text-gray-700">{formatCurrency(product.mrp)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Total Sold</dt>
                <dd className="text-gray-700">{product.total_sold} units</dd>
              </div>
            </dl>
          </div>

          {/* Stock */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Stock</h2>
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-3xl font-bold tabular-nums ${stockColor}`}>
                {product.stock_quantity}
              </span>
              <span className="text-sm text-gray-500">
                / {product.low_stock_threshold} threshold
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden mb-4">
              <div
                className={`h-full rounded-full ${
                  stockPct <= 25 ? "bg-red-500" : stockPct <= 75 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(stockPct, 100)}%` }}
              />
            </div>

            <StockAdjustmentForm
              productId={productId}
              currentStock={product.stock_quantity}
              onAdjusted={fetchProduct}
            />
          </div>

          {/* Dates */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Info</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-700">{formatDate(product.created_at)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Updated</dt>
                <dd className="text-gray-700">{formatDate(product.updated_at)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Visible</dt>
                <dd className="text-gray-700">{product.is_visible ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.brand_name}"? If this product has existing orders, it will be deactivated instead.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => { if (!deleteLoading) setDeleteOpen(false); }}
      />
    </div>
  );
}
