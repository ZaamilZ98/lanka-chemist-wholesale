"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PRODUCT_SECTION_LABELS } from "@/lib/constants";
import Skeleton from "@/components/ui/Skeleton";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  section: string;
  sort_order: number;
}

export default function CategoriesPageClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Group categories by section
  const sections = Object.keys(PRODUCT_SECTION_LABELS) as string[];
  const grouped: Record<string, Category[]> = {};
  for (const section of sections) {
    const sectionCats = categories.filter((c) => c.section === section && !c.parent_id);
    if (sectionCats.length > 0) {
      grouped[section] = sectionCats;
    }
  }

  // Get child categories for a parent
  function getChildren(parentId: string): Category[] {
    return categories.filter((c) => c.parent_id === parentId);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Categories</h1>
        <p className="text-gray-500">No categories available yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Product Categories</h1>

      <div className="space-y-10">
        {sections.map((section) => {
          const sectionCats = grouped[section];
          if (!sectionCats || sectionCats.length === 0) return null;

          return (
            <div key={section}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                {PRODUCT_SECTION_LABELS[section]}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionCats.map((cat) => {
                  const children = getChildren(cat.id);
                  return (
                    <div
                      key={cat.id}
                      className="rounded-lg border border-gray-200 bg-white p-5 hover:border-brand-green hover:shadow-sm transition-all"
                    >
                      <Link
                        href={`/products?category=${cat.slug}`}
                        className="text-base font-medium text-gray-900 hover:text-brand-green transition-colors"
                      >
                        {cat.name}
                      </Link>
                      {cat.description && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                      {children.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/products?category=${child.slug}`}
                              className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-brand-green-light hover:text-brand-green transition-colors"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
