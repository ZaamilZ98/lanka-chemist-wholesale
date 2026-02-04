"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

interface ProductPrice {
  id: string;
  brand_name: string;
  generic_name: string;
  sku: string | null;
  wholesale_price: number;
  newPrice: string;
}

function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BulkPriceEditor({ open, onClose, onUpdated }: Props) {
  const [products, setProducts] = useState<ProductPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    async function loadProducts() {
      try {
        const res = await fetch("/api/admin/products?pageSize=100&is_active=true");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setProducts(
          (data.data || []).map((p: { id: string; brand_name: string; generic_name: string; sku: string | null; wholesale_price: number }) => ({
            ...p,
            newPrice: String(p.wholesale_price),
          })),
        );
      } catch {
        setError("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, [open]);

  function updatePrice(id: string, value: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, newPrice: value } : p)),
    );
  }

  const changedProducts = products.filter((p) => {
    const newPrice = parseFloat(p.newPrice);
    return !isNaN(newPrice) && newPrice > 0 && newPrice !== p.wholesale_price;
  });

  async function handleSave() {
    if (changedProducts.length === 0) return;
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const updates = changedProducts.map((p) => ({
        id: p.id,
        price: parseFloat(p.newPrice),
      }));

      const res = await fetch("/api/admin/products/bulk-price", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }

      const data = await res.json();
      setSuccessMsg(`Updated ${data.updated} of ${data.total} products.`);
      onUpdated();

      // Update local state
      setProducts((prev) =>
        prev.map((p) => {
          const newPrice = parseFloat(p.newPrice);
          if (!isNaN(newPrice) && newPrice > 0) {
            return { ...p, wholesale_price: newPrice };
          }
          return p;
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update prices");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={saving ? undefined : onClose} />
      <div className="relative w-full max-w-2xl max-h-[80vh] rounded-xl border border-gray-200 bg-white shadow-lg flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Bulk Price Update</h2>
          {changedProducts.length > 0 && (
            <span className="text-xs bg-brand-green/10 text-brand-green px-2 py-1 rounded-full font-medium">
              {changedProducts.length} changed
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No active products found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="pb-2">Product</th>
                  <th className="pb-2 text-right">Current</th>
                  <th className="pb-2 text-right w-32">New Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const newPrice = parseFloat(p.newPrice);
                  const isChanged = !isNaN(newPrice) && newPrice > 0 && newPrice !== p.wholesale_price;
                  return (
                    <tr key={p.id} className={isChanged ? "bg-amber-50/50" : ""}>
                      <td className="py-2">
                        <span className="font-medium text-gray-900">{p.brand_name}</span>
                        <span className="block text-xs text-gray-500">{p.generic_name}</span>
                      </td>
                      <td className="py-2 text-right text-gray-600 tabular-nums">
                        {formatCurrency(p.wholesale_price)}
                      </td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={p.newPrice}
                          onChange={(e) => updatePrice(p.id, e.target.value)}
                          className={`w-28 rounded border px-2 py-1 text-sm text-right tabular-nums focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green ${
                            isChanged ? "border-amber-400 bg-amber-50" : "border-gray-300"
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          {successMsg && <p className="mb-2 text-sm text-emerald-600">{successMsg}</p>}
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              loading={saving}
              disabled={changedProducts.length === 0}
            >
              Update {changedProducts.length} Price{changedProducts.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
