"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

interface ImportResult {
  inserted: number;
  updated: number;
  errors: { row: number; message: string }[];
  total_rows: number;
}

export default function CsvImportModal({ open, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError("");
    setResult(null);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Import failed");
      }

      const data: ImportResult = await res.json();
      setResult(data);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    setFile(null);
    setResult(null);
    setError("");
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={importing ? undefined : handleClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Products from CSV</h2>

        {/* Expected format */}
        <div className="mb-4 rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600">
          <p className="font-medium text-gray-700 mb-1">Expected CSV format:</p>
          <p className="font-mono">brand_name, generic_name, sku, wholesale_price, stock_quantity</p>
          <p className="mt-1">
            Optional columns: category_id, manufacturer_id, section, dosage_form,
            strength, pack_size, is_prescription, description, low_stock_threshold
          </p>
          <p className="mt-1 text-gray-500">Existing products (matched by SKU) will be updated.</p>
        </div>

        {/* File input */}
        <div
          className="mb-4 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-brand-green transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-gray-600">Click to select a CSV file</p>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="mb-4 rounded-lg border border-gray-200 p-3 text-sm">
            <p className="font-medium text-gray-900 mb-1">Import Complete</p>
            <div className="flex gap-4 text-xs">
              <span className="text-emerald-600">{result.inserted} inserted</span>
              <span className="text-blue-600">{result.updated} updated</span>
              {result.errors.length > 0 && (
                <span className="text-red-600">{result.errors.length} errors</span>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto text-xs text-red-600">
                {result.errors.map((e, i) => (
                  <p key={i}>Row {e.row}: {e.message}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={importing}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleImport}
              loading={importing}
              disabled={!file}
            >
              Import
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
