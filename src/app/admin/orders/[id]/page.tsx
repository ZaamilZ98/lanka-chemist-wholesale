import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import OrderDetailClient from "@/components/admin/OrderDetailClient";

export const metadata: Metadata = {
  title: "Order Detail",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminShell>
      <OrderDetailClient orderId={id} />
    </AdminShell>
  );
}
