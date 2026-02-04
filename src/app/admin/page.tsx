import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import DashboardClient from "@/components/admin/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <DashboardClient />
    </AdminShell>
  );
}
