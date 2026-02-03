import type { Metadata } from "next";
import ProductsPageClient from "@/components/products/ProductsPageClient";

export const metadata: Metadata = {
  title: "Products — Lanka Chemist Wholesale",
  description:
    "Browse our wholesale pharmaceutical catalog. Medicines, surgical items, medical equipment, and SPC products for registered medical practitioners.",
};

export default function ProductsPage() {
  return <ProductsPageClient />;
}
