import { Metadata } from "next";
import OutstandingOrdersReportClient from "@/components/admin/reports/OutstandingOrdersReportClient";

export const metadata: Metadata = {
  title: "Outstanding Orders - Admin | Lanka Chemist",
};

export default function OutstandingOrdersPage() {
  return <OutstandingOrdersReportClient />;
}
