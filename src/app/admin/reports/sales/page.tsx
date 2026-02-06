import { Metadata } from "next";
import SalesReportClient from "@/components/admin/reports/SalesReportClient";

export const metadata: Metadata = {
  title: "Sales Report - Admin | Lanka Chemist",
};

export default function SalesReportPage() {
  return <SalesReportClient />;
}
