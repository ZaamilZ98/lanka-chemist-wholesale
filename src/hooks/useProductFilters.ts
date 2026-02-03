"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import type { SortOption } from "@/types/api";
import type { ProductSection, DosageForm } from "@/types/database";

export function useProductFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Getters
  const q = searchParams.get("q") || "";
  const section = (searchParams.get("section") || "") as ProductSection | "";
  const category = searchParams.get("category") || "";
  const manufacturer = searchParams.get("manufacturer") || "";
  const dosageForm = (searchParams.get("dosage_form") || "") as DosageForm | "";
  const prescription = searchParams.get("prescription") || "";
  const inStock = searchParams.get("in_stock") === "true";
  const sort = (searchParams.get("sort") || "name_asc") as SortOption;
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Helper to update URL params
  const updateParams = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      // Reset to page 1 when filters change
      if (resetPage && !("page" in updates)) {
        params.delete("page");
      }

      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // Setters
  const setSearch = useCallback(
    (value: string) => updateParams({ q: value || null }),
    [updateParams],
  );

  const setSection = useCallback(
    (value: string) =>
      updateParams({ section: value || null, category: null }),
    [updateParams],
  );

  const setCategory = useCallback(
    (value: string) => updateParams({ category: value || null }),
    [updateParams],
  );

  const setManufacturer = useCallback(
    (value: string) => updateParams({ manufacturer: value || null }),
    [updateParams],
  );

  const setDosageForm = useCallback(
    (value: string) => updateParams({ dosage_form: value || null }),
    [updateParams],
  );

  const setPrescription = useCallback(
    (value: string) => updateParams({ prescription: value || null }),
    [updateParams],
  );

  const setInStock = useCallback(
    (value: boolean) =>
      updateParams({ in_stock: value ? "true" : null }),
    [updateParams],
  );

  const setSort = useCallback(
    (value: SortOption) =>
      updateParams({ sort: value === "name_asc" ? null : value }),
    [updateParams],
  );

  const setPage = useCallback(
    (value: number) =>
      updateParams({ page: value > 1 ? String(value) : null }, false),
    [updateParams],
  );

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  // Build API query string from current params
  const buildApiQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (section) params.set("section", section);
    if (category) params.set("category", category);
    if (manufacturer) params.set("manufacturer", manufacturer);
    if (dosageForm) params.set("dosage_form", dosageForm);
    if (prescription) params.set("prescription", prescription);
    if (inStock) params.set("in_stock", "true");
    if (sort !== "name_asc") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    return params.toString();
  }, [q, section, category, manufacturer, dosageForm, prescription, inStock, sort, page]);

  const hasActiveFilters =
    !!section ||
    !!category ||
    !!manufacturer ||
    !!dosageForm ||
    !!prescription ||
    inStock ||
    !!q;

  return {
    // Values
    q,
    section,
    category,
    manufacturer,
    dosageForm,
    prescription,
    inStock,
    sort,
    page,
    hasActiveFilters,
    // Setters
    setSearch,
    setSection,
    setCategory,
    setManufacturer,
    setDosageForm,
    setPrescription,
    setInStock,
    setSort,
    setPage,
    clearAll,
    // Utils
    buildApiQuery,
  };
}
