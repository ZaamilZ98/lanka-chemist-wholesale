import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import ProductFormClient from "@/components/admin/ProductFormClient";

export const metadata: Metadata = {
  title: "Add Product",
};

export default function NewProductPage() {
  return (
    <AdminShell>
      <ProductFormClient mode="create" />
    </AdminShell>
  );
}
