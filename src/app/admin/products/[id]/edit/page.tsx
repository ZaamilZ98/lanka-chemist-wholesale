import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import ProductFormClient from "@/components/admin/ProductFormClient";

export const metadata: Metadata = {
  title: "Edit Product",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminShell>
      <ProductFormClient mode="edit" productId={id} />
    </AdminShell>
  );
}
