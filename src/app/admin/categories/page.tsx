import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import CategoriesAdminClient from "@/components/admin/CategoriesAdminClient";

export const metadata: Metadata = {
  title: "Categories | Admin",
};

export default function CategoriesPage() {
  return (
    <AdminShell>
      <CategoriesAdminClient />
    </AdminShell>
  );
}
