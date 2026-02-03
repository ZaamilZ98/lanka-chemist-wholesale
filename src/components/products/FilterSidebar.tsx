"use client";

import { useEffect, useState } from "react";
import {
  PRODUCT_SECTION_LABELS,
  DOSAGE_FORM_LABELS,
} from "@/lib/constants";
import type { Category, Manufacturer } from "@/types/database";

interface FilterSidebarProps {
  section: string;
  category: string;
  manufacturer: string;
  dosageForm: string;
  prescription: string;
  inStock: boolean;
  hasActiveFilters: boolean;
  onSectionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onManufacturerChange: (value: string) => void;
  onDosageFormChange: (value: string) => void;
  onPrescriptionChange: (value: string) => void;
  onInStockChange: (value: boolean) => void;
  onClearAll: () => void;
}

export default function FilterSidebar({
  section,
  category,
  manufacturer,
  dosageForm,
  prescription,
  inStock,
  hasActiveFilters,
  onSectionChange,
  onCategoryChange,
  onManufacturerChange,
  onDosageFormChange,
  onPrescriptionChange,
  onInStockChange,
  onClearAll,
}: FilterSidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/manufacturers")
      .then((r) => r.json())
      .then((data) => setManufacturers(data.manufacturers ?? []))
      .catch(() => {});
  }, []);

  const filteredCategories = section
    ? categories.filter((c) => c.section === section)
    : categories;

  const sections = Object.entries(PRODUCT_SECTION_LABELS);
  const dosageForms = Object.entries(DOSAGE_FORM_LABELS);

  const filterContent = (
    <div className="space-y-6">
      {/* Section */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
          Section
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => onSectionChange("")}
            className={`block w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors ${
              !section
                ? "bg-brand-green-light text-brand-green font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All sections
          </button>
          {sections.map(([value, label]) => (
            <button
              key={value}
              onClick={() => onSectionChange(value)}
              className={`block w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors ${
                section === value
                  ? "bg-brand-green-light text-brand-green font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      {filteredCategories.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
            Category
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            <button
              onClick={() => onCategoryChange("")}
              className={`block w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors ${
                !category
                  ? "bg-brand-green-light text-brand-green font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All categories
            </button>
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.slug)}
                className={`block w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors ${
                  category === cat.slug
                    ? "bg-brand-green-light text-brand-green font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manufacturer */}
      {manufacturers.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
            Manufacturer
          </h3>
          <select
            value={manufacturer}
            onChange={(e) => onManufacturerChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 px-2.5 text-sm text-gray-700 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          >
            <option value="">All manufacturers</option>
            {manufacturers.map((m) => (
              <option key={m.id} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Dosage form */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
          Dosage Form
        </h3>
        <select
          value={dosageForm}
          onChange={(e) => onDosageFormChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 px-2.5 text-sm text-gray-700 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        >
          <option value="">All forms</option>
          {dosageForms.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Prescription */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
          Type
        </h3>
        <div className="flex gap-1">
          {[
            { value: "", label: "All" },
            { value: "true", label: "Rx" },
            { value: "false", label: "OTC" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onPrescriptionChange(opt.value)}
              className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                prescription === opt.value
                  ? "bg-brand-green text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* In stock */}
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => onInStockChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
          />
          <span className="text-sm text-gray-700">In stock only</span>
        </label>
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="w-full text-sm font-medium text-brand-green hover:text-brand-green-dark transition-colors py-2 border border-brand-green rounded-lg hover:bg-brand-green-light"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
            />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-white">
              !
            </span>
          )}
        </button>
      </div>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <div className="absolute inset-y-0 left-0 w-full max-w-xs bg-white shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Filters
                </h2>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {filterContent}
              </div>
              <div className="border-t border-gray-200 px-4 py-3">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-lg bg-brand-green py-2.5 text-sm font-medium text-white hover:bg-brand-green-dark transition-colors"
                >
                  Show results
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-60 shrink-0">
        {filterContent}
      </div>
    </>
  );
}
