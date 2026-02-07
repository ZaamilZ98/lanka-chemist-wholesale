"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DOSAGE_FORM_LABELS,
  PRODUCT_SECTION_LABELS,
} from "@/lib/constants";
import PageHeader from "./PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Skeleton from "@/components/ui/Skeleton";

interface Props {
  mode: "create" | "edit";
  productId?: string;
}

interface FormData {
  brand_name: string;
  generic_name: string;
  sku: string;
  barcode: string;
  description: string;
  category_id: string;
  manufacturer_id: string;
  section: string;
  dosage_form: string;
  strength: string;
  pack_size: string;
  wholesale_price: string;
  mrp: string;
  stock_quantity: string;
  low_stock_threshold: string;
  is_prescription: boolean;
  storage_conditions: string;
  is_active: boolean;
  is_visible: boolean;
}

const emptyForm: FormData = {
  brand_name: "",
  generic_name: "",
  sku: "",
  barcode: "",
  description: "",
  category_id: "",
  manufacturer_id: "",
  section: "medicines",
  dosage_form: "",
  strength: "",
  pack_size: "",
  wholesale_price: "",
  mrp: "",
  stock_quantity: "0",
  low_stock_threshold: "10",
  is_prescription: false,
  storage_conditions: "",
  is_active: true,
  is_visible: true,
};

export default function ProductFormClient({ mode, productId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [manufacturers, setManufacturers] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load product data for edit mode
  const loadProduct = useCallback(async () => {
    if (mode !== "edit" || !productId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setForm({
        brand_name: data.brand_name || "",
        generic_name: data.generic_name || "",
        sku: data.sku || "",
        barcode: data.barcode || "",
        description: data.description || "",
        category_id: data.category_id || "",
        manufacturer_id: data.manufacturer_id || "",
        section: data.section || "medicines",
        dosage_form: data.dosage_form || "",
        strength: data.strength || "",
        pack_size: data.pack_size || "",
        wholesale_price: String(data.wholesale_price ?? ""),
        mrp: data.mrp !== null ? String(data.mrp) : "",
        stock_quantity: String(data.stock_quantity ?? 0),
        low_stock_threshold: String(data.low_stock_threshold ?? 10),
        is_prescription: data.is_prescription ?? false,
        storage_conditions: data.storage_conditions || "",
        is_active: data.is_active ?? true,
        is_visible: data.is_visible ?? true,
      });
    } catch {
      setError("Failed to load product");
    } finally {
      setIsLoading(false);
    }
  }, [mode, productId]);

  // Load dropdowns
  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [catRes, mfrRes] = await Promise.all([
          fetch("/api/categories").catch(() => null),
          fetch("/api/manufacturers").catch(() => null),
        ]);
        if (catRes?.ok) {
          const data = await catRes.json();
          const cats = (data.categories || []) as { id: string; name: string }[];
          setCategories(cats.map((c) => ({ value: c.id, label: c.name })));
        }
        if (mfrRes?.ok) {
          const data = await mfrRes.json();
          const mfrs = (data.manufacturers || []) as { id: string; name: string }[];
          setManufacturers(mfrs.map((m) => ({ value: m.id, label: m.name })));
        }
      } catch { /* ignore */ }
    }
    loadDropdowns();
  }, []);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  function updateField(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.brand_name.trim()) errors.brand_name = "Brand name is required";
    if (!form.generic_name.trim()) errors.generic_name = "Generic name is required";
    const price = parseFloat(form.wholesale_price);
    if (isNaN(price) || price <= 0) errors.wholesale_price = "Price must be greater than 0";
    if (mode === "create") {
      const stock = parseInt(form.stock_quantity, 10);
      if (isNaN(stock) || stock < 0) errors.stock_quantity = "Stock must be 0 or greater";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        brand_name: form.brand_name.trim(),
        generic_name: form.generic_name.trim(),
        wholesale_price: parseFloat(form.wholesale_price),
        is_prescription: form.is_prescription,
        is_active: form.is_active,
        is_visible: form.is_visible,
        section: form.section || "medicines",
      };

      if (form.sku.trim()) payload.sku = form.sku.trim();
      if (form.barcode.trim()) payload.barcode = form.barcode.trim();
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.category_id) payload.category_id = form.category_id;
      if (form.manufacturer_id) payload.manufacturer_id = form.manufacturer_id;
      if (form.dosage_form) payload.dosage_form = form.dosage_form;
      if (form.strength.trim()) payload.strength = form.strength.trim();
      if (form.pack_size.trim()) payload.pack_size = form.pack_size.trim();
      if (form.mrp.trim()) payload.mrp = parseFloat(form.mrp);
      if (form.storage_conditions.trim()) payload.storage_conditions = form.storage_conditions.trim();
      payload.low_stock_threshold = parseInt(form.low_stock_threshold, 10) || 10;

      if (mode === "create") {
        payload.stock_quantity = parseInt(form.stock_quantity, 10) || 0;
      }

      const url = mode === "create"
        ? "/api/admin/products"
        : `/api/admin/products/${productId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save product");
      }

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title={mode === "create" ? "Add Product" : "Edit Product"}
          breadcrumbs={[
            { label: "Products", href: "/admin/products" },
            { label: mode === "create" ? "New" : "Edit" },
          ]}
        />
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const sectionOptions = Object.entries(PRODUCT_SECTION_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const dosageOptions = [
    { value: "", label: "Select..." },
    ...Object.entries(DOSAGE_FORM_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ];

  return (
    <div>
      <PageHeader
        title={mode === "create" ? "Add Product" : "Edit Product"}
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: mode === "create" ? "New" : "Edit" },
        ]}
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Brand Name"
              required
              value={form.brand_name}
              onChange={(e) => updateField("brand_name", e.target.value)}
              error={fieldErrors.brand_name}
            />
            <Input
              label="Generic Name"
              required
              value={form.generic_name}
              onChange={(e) => updateField("generic_name", e.target.value)}
              error={fieldErrors.generic_name}
            />
            <Input
              label="SKU"
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              error={fieldErrors.sku}
              placeholder="e.g. PARA-500-TAB"
            />
            <Input
              label="Barcode"
              value={form.barcode}
              onChange={(e) => updateField("barcode", e.target.value)}
            />
            <Select
              label="Section"
              value={form.section}
              onChange={(e) => updateField("section", e.target.value)}
              options={sectionOptions}
            />
            <Select
              label="Dosage Form"
              value={form.dosage_form}
              onChange={(e) => updateField("dosage_form", e.target.value)}
              options={dosageOptions}
            />
            <Input
              label="Strength"
              value={form.strength}
              onChange={(e) => updateField("strength", e.target.value)}
              placeholder="e.g. 500mg"
            />
            <Input
              label="Pack Size"
              value={form.pack_size}
              onChange={(e) => updateField("pack_size", e.target.value)}
              placeholder="e.g. 100 tablets"
            />
          </div>
        </div>

        {/* Classification */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Classification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.length > 0 && (
              <Select
                label="Category"
                value={form.category_id}
                onChange={(e) => updateField("category_id", e.target.value)}
                options={[{ value: "", label: "Select..." }, ...categories]}
              />
            )}
            {manufacturers.length > 0 && (
              <Select
                label="Manufacturer"
                value={form.manufacturer_id}
                onChange={(e) => updateField("manufacturer_id", e.target.value)}
                options={[{ value: "", label: "Select..." }, ...manufacturers]}
              />
            )}
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_prescription}
                  onChange={(e) => updateField("is_prescription", e.target.checked)}
                  className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                />
                <span className="text-sm text-gray-700">Requires Prescription</span>
              </label>
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Pricing & Stock</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Wholesale Price (Rs)"
              required
              type="number"
              step="0.01"
              min="0.01"
              value={form.wholesale_price}
              onChange={(e) => updateField("wholesale_price", e.target.value)}
              error={fieldErrors.wholesale_price}
            />
            <Input
              label="MRP (Rs)"
              type="number"
              step="0.01"
              min="0"
              value={form.mrp}
              onChange={(e) => updateField("mrp", e.target.value)}
            />
            {mode === "create" && (
              <Input
                label="Initial Stock"
                type="number"
                min="0"
                value={form.stock_quantity}
                onChange={(e) => updateField("stock_quantity", e.target.value)}
                error={fieldErrors.stock_quantity}
              />
            )}
            <Input
              label="Low Stock Threshold"
              type="number"
              min="0"
              value={form.low_stock_threshold}
              onChange={(e) => updateField("low_stock_threshold", e.target.value)}
            />
          </div>
        </div>

        {/* Additional */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Additional</h2>
          <div className="space-y-4">
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
            />
            <Input
              label="Storage Instructions"
              value={form.storage_conditions}
              onChange={(e) => updateField("storage_conditions", e.target.value)}
              placeholder="e.g. Store below 25°C"
            />
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => updateField("is_active", e.target.checked)}
                  className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_visible}
                  onChange={(e) => updateField("is_visible", e.target.checked)}
                  className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                />
                <span className="text-sm text-gray-700">Visible on storefront</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            type="button"
            onClick={() => router.push("/admin/products")}
          >
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={saving}>
            {mode === "create" ? "Create Product" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
