import { Metadata } from "next";
import BestSellersReportClient from "@/components/admin/reports/BestSellersReportClient";

export const metadata: Metadata = {
  title: "Best Sellers - Admin | Lanka Chemist",
};

export default function BestSellersPage() {
  return <BestSellersReportClient />;
}
