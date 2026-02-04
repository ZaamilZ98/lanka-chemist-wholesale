import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import ProductsAdminClient from "@/components/admin/ProductsAdminClient";

export const metadata: Metadata = {
  title: "Products",
};

export default function ProductsPage() {
  return (
    <AdminShell>
      <ProductsAdminClient />
    </AdminShell>
  );
}
