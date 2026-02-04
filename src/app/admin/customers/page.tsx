import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import CustomersClient from "@/components/admin/CustomersClient";

export const metadata: Metadata = {
  title: "Customers",
};

export default function CustomersPage() {
  return (
    <AdminShell>
      <CustomersClient />
    </AdminShell>
  );
}
