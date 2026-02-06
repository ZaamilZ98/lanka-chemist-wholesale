"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import type { ProductListItem } from "@/types/api";

interface ProductAlternativesProps {
  productId: string;
  showWholesalePrice?: boolean;
}

export default function ProductAlternatives({
  productId,
  showWholesalePrice = false,
}: ProductAlternativesProps) {
  const [alternatives, setAlternatives] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/products/${productId}/alternatives`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setAlternatives(data.alternatives ?? []);
      })
      .catch(() => {
        setAlternatives([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [productId]);

  if (isLoading) {
    return (
      <section className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Available Alternatives
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Same medicine or similar products in stock
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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

  if (alternatives.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 pt-6 border-t border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Available Alternatives
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Same medicine or similar products in stock
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {alternatives.map((product) => (
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
