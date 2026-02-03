import ProductCard from "./ProductCard";
import type { ProductListItem } from "@/types/api";

interface RelatedProductsProps {
  products: ProductListItem[];
  showWholesalePrice?: boolean;
}

export default function RelatedProducts({
  products,
  showWholesalePrice = false,
}: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Related Products
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
