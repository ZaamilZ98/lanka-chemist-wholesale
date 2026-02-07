"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category, ProductSection } from "@/types/database";
import { PRODUCT_SECTION_LABELS } from "@/lib/constants";
import PageHeader from "./PageHeader";
import DataTable, { type Column } from "./DataTable";
import ConfirmDialog from "./ConfirmDialog";
import Button from "@/components/ui/Button";

interface CategoryFormData {
  name: string;
  section: ProductSection | "";
  parent_id: string;
  description: string;
  is_active: boolean;
}

const emptyForm: CategoryFormData = {
  name: "",
  section: "",
  parent_id: "",
  description: "",
  is_active: true,
};

export default function CategoriesAdminClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [sectionFilter, setSectionFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setCategories(json.categories || []);
    } catch {
      setError("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filtered data
  const filtered = categories.filter((cat) => {
    if (sectionFilter && cat.section !== sectionFilter) return false;
    if (search && !cat.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Helper to get category name by ID
  function getCategoryName(id: string | null): string {
    if (!id) return "\u2014";
    const found = categories.find((c) => c.id === id);
    return found ? found.name : "\u2014";
  }

  // Parent category options (exclude the category being edited to prevent self-reference)
  function getParentOptions() {
    return categories
      .filter((c) => c.id !== editingId)
      .map((c) => ({ value: c.id, label: c.name }));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(cat: Category) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      section: cat.section,
      parent_id: cat.parent_id || "",
      description: cat.description || "",
      is_active: cat.is_active,
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!form.section) {
      setFormError("Section is required");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        section: form.section,
        parent_id: form.parent_id || null,
        description: form.description.trim() || null,
        is_active: form.is_active,
      };

      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to save category");
      }

      closeModal();
      fetchCategories();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete category");
      }

      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: "section",
      header: "Section",
      render: (row) => (
        <span className="text-gray-600 text-sm">
          {PRODUCT_SECTION_LABELS[row.section] || row.section}
        </span>
      ),
    },
    {
      key: "parent",
      header: "Parent",
      className: "hidden md:table-cell",
      render: (row) => (
        <span className="text-gray-500 text-sm">{getCategoryName(row.parent_id)}</span>
      ),
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
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEditModal(row)}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            title="Edit"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
          <button
            onClick={() => {
              setDeleteError("");
              setDeleteTarget({ id: row.id, name: row.name });
            }}
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
        title="Categories"
        actions={
          <Button variant="primary" size="sm" onClick={openAddModal}>
            Add Category
          </Button>
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
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          >
            <option value="">All Sections</option>
            {Object.entries(PRODUCT_SECTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Category name..."
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
        data={filtered}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        emptyTitle="No categories found"
        emptyDescription="Try adjusting your filters or add a new category."
      />

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={closeModal}
          />
          {/* Dialog */}
          <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Category" : "Add Category"}
            </h2>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Name <span className="text-danger ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="e.g. Antibiotics"
                  className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-green focus:ring-brand-green/30"
                />
              </div>

              {/* Section */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Section <span className="text-danger ml-0.5">*</span>
                </label>
                <select
                  value={form.section}
                  onChange={(e) => setForm((f) => ({ ...f, section: e.target.value as ProductSection | "" }))}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-green focus:ring-brand-green/30"
                >
                  <option value="" disabled>Select a section</option>
                  {Object.entries(PRODUCT_SECTION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Parent Category */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Parent Category
                </label>
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                  className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-green focus:ring-brand-green/30"
                >
                  <option value="">None (top-level)</option>
                  {getParentOptions().map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Optional description..."
                  className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-green focus:ring-brand-green/30 resize-none"
                />
              </div>

              {/* Active */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={saving}
                >
                  {editingId ? "Save Changes" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
      >
        {deleteError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {deleteError}
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
