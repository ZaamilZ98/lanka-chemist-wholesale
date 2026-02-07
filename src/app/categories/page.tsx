import type { Metadata } from "next";
import CategoriesPageClient from "@/components/categories/CategoriesPageClient";

export const metadata: Metadata = {
  title: "Categories — Lanka Chemist Wholesale",
  description:
    "Browse product categories. Medicines, surgical items, medical equipment, and SPC products.",
};

export default function CategoriesPage() {
  return <CategoriesPageClient />;
}
