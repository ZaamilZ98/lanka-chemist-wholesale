"use client";

import { useState } from "react";
import { STOCK_ADJUSTMENT_REASON_LABELS } from "@/lib/constants";
import Button from "@/components/ui/Button";

interface Props {
  productId: string;
  currentStock: number;
  onAdjusted: () => void;
}

const reasonOptions = Object.entries(STOCK_ADJUSTMENT_REASON_LABELS)
  .filter(([key]) => key !== "sale") // sales happen via orders
  .map(([value, label]) => ({ value, label }));

export default function StockAdjustmentForm({ productId, currentStock, onAdjusted }: Props) {
  const [change, setChange] = useState("");
  const [reason, setReason] = useState("purchase");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const changeNum = parseInt(change, 10) || 0;
  const newStock = currentStock + changeNum;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (changeNum === 0) {
      setError("Quantity change cannot be 0");
      return;
    }
    if (newStock < 0) {
      setError("Stock cannot go below 0");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${productId}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity_change: changeNum,
          reason,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      setChange("");
      setNotes("");
      onAdjusted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust stock");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Adjust Stock</h3>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Change (+/-)</label>
          <input
            type="number"
            value={change}
            onChange={(e) => { setChange(e.target.value); setError(""); }}
            placeholder="e.g. -5 or +20"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          >
            {reasonOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note..."
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        />
      </div>

      {changeNum !== 0 && (
        <p className="text-xs text-gray-500">
          Current: <strong>{currentStock}</strong> → New:{" "}
          <strong className={newStock < 0 ? "text-red-600" : ""}>{newStock}</strong>{" "}
          ({changeNum > 0 ? "+" : ""}{changeNum})
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button variant="primary" size="sm" type="submit" loading={saving} fullWidth>
        Apply Adjustment
      </Button>
    </form>
  );
}
