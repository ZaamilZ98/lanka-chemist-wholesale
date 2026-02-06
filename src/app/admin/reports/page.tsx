import { Metadata } from "next";
import ReportsOverview from "@/components/admin/reports/ReportsOverview";

export const metadata: Metadata = {
  title: "Reports - Admin | Lanka Chemist",
};

export default function ReportsPage() {
  return <ReportsOverview />;
}
