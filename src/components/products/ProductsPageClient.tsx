"use client";

import { useEffect, useState, Suspense } from "react";
import { useProductFilters } from "@/hooks/useProductFilters";
import { useAuth } from "@/hooks/useAuth";
import SearchBar from "./SearchBar";
import FilterSidebar from "./FilterSidebar";
import SortDropdown from "./SortDropdown";
import SpcNotice from "./SpcNotice";
import ProductGrid from "./ProductGrid";
import Pagination from "./Pagination";
import type { ProductListItem } from "@/types/api";

function ProductsContent() {
  const filters = useProductFilters();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const qs = filters.buildApiQuery();
    fetch(`/api/products${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 0);
        setPerPage(data.per_page ?? 20);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setTotal(0);
        setTotalPages(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters.buildApiQuery]);

  const showWholesale = isAuthenticated;

  // Calculate result range
  const rangeStart = total > 0 ? (filters.page - 1) * perPage + 1 : 0;
  const rangeEnd = Math.min(filters.page * perPage, total);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      {/* Search bar */}
      <div className="mb-6 max-w-xl">
        <SearchBar initialValue={filters.q} onSearch={filters.setSearch} />
      </div>

      {/* SPC notice */}
      {filters.section === "spc" && (
        <div className="mb-6">
          <SpcNotice />
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar */}
        <FilterSidebar
          section={filters.section}
          category={filters.category}
          manufacturer={filters.manufacturer}
          dosageForm={filters.dosageForm}
          prescription={filters.prescription}
          inStock={filters.inStock}
          hasActiveFilters={filters.hasActiveFilters}
          onSectionChange={filters.setSection}
          onCategoryChange={filters.setCategory}
          onManufacturerChange={filters.setManufacturer}
          onDosageFormChange={filters.setDosageForm}
          onPrescriptionChange={filters.setPrescription}
          onInStockChange={filters.setInStock}
          onClearAll={filters.clearAll}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Mobile filter button rendered by FilterSidebar */}
              <p className="text-sm text-gray-500">
                {isLoading ? (
                  <span className="inline-block h-4 w-32 animate-pulse rounded bg-gray-200" />
                ) : total > 0 ? (
                  <>
                    Showing {rangeStart}–{rangeEnd} of {total} products
                  </>
                ) : (
                  "No products found"
                )}
              </p>
            </div>
            <SortDropdown value={filters.sort} onChange={filters.setSort} />
          </div>

          {/* Product grid */}
          <ProductGrid
            products={products}
            showWholesalePrice={showWholesale}
            isLoading={isLoading}
            onClearFilters={filters.clearAll}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                page={filters.page}
                totalPages={totalPages}
                onPageChange={filters.setPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPageClient() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-gray-200 mb-6" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-white overflow-hidden"
              >
                <div className="aspect-square animate-pulse bg-gray-200" />
                <div className="p-3.5 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
