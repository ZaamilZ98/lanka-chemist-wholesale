"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import type { ProductListItem } from "@/types/api";

interface RecentlyViewedProductsProps {
  currentProductId: string;
  showWholesalePrice?: boolean;
  maxItems?: number;
}

export default function RecentlyViewedProducts({
  currentProductId,
  showWholesalePrice = false,
  maxItems = 4,
}: RecentlyViewedProductsProps) {
  const { getRecentlyViewedIds, isClient } = useRecentlyViewed();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isClient) return;

    const ids = getRecentlyViewedIds(currentProductId).slice(0, maxItems);
    if (ids.length === 0) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch("/api/products/by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setProducts(data.products ?? []);
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isClient, currentProductId, getRecentlyViewedIds, maxItems]);

  // Don't render anything on server or while checking
  if (!isClient) return null;

  // Don't render while loading or if no products
  if (isLoading) {
    const ids = getRecentlyViewedIds(currentProductId);
    if (ids.length === 0) return null;

    return (
      <section className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recently Viewed
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(Math.min(ids.length, maxItems))].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-gray-200 bg-white"
            >
              <div className="aspect-square bg-gray-100" />
              <div className="p-3.5 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Recently Viewed
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            showWholesalePrice={showWholesalePrice}
          />
        ))}
      </div>
    </section>
  );
}
