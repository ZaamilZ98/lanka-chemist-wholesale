import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import OrdersClient from "@/components/admin/OrdersClient";

export const metadata: Metadata = {
  title: "Orders",
};

export default function OrdersPage() {
  return (
    <AdminShell>
      <OrdersClient />
    </AdminShell>
  );
}
