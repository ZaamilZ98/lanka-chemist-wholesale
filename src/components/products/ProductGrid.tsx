import ProductCard from "./ProductCard";
import Skeleton from "@/components/ui/Skeleton";
import type { ProductListItem } from "@/types/api";

interface ProductGridProps {
  products: ProductListItem[];
  showWholesalePrice?: boolean;
  isLoading?: boolean;
  onClearFilters?: () => void;
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3.5 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <div className="pt-2">
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </div>
  );
}

export default function ProductGrid({
  products,
  showWholesalePrice = false,
  isLoading = false,
  onClearFilters,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="h-12 w-12 text-gray-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <p className="text-gray-600 font-medium">No products found</p>
        <p className="text-sm text-gray-400 mt-1">
          Try adjusting your search or filters
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="mt-4 text-sm font-medium text-brand-green hover:text-brand-green-dark transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          showWholesalePrice={showWholesalePrice}
        />
      ))}
    </div>
  );
}
