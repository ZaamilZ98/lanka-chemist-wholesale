import { Metadata } from "next";
import CustomerAnalysisReportClient from "@/components/admin/reports/CustomerAnalysisReportClient";

export const metadata: Metadata = {
  title: "Customer Analysis - Admin | Lanka Chemist",
};

export default function CustomerAnalysisPage() {
  return <CustomerAnalysisReportClient />;
}
