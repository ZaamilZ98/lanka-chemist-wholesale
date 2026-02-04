import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import ProductDetailClient from "@/components/admin/ProductDetailClient";

export const metadata: Metadata = {
  title: "Product Detail",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminShell>
      <ProductDetailClient productId={id} />
    </AdminShell>
  );
}
