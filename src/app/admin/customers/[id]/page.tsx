import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import CustomerDetailClient from "@/components/admin/CustomerDetailClient";

export const metadata: Metadata = {
  title: "Customer Detail",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminShell>
      <CustomerDetailClient customerId={id} />
    </AdminShell>
  );
}
