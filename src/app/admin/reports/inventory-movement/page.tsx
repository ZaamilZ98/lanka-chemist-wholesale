import { Metadata } from "next";
import InventoryMovementReportClient from "@/components/admin/reports/InventoryMovementReportClient";

export const metadata: Metadata = {
  title: "Inventory Movement - Admin | Lanka Chemist",
};

export default function InventoryMovementPage() {
  return <InventoryMovementReportClient />;
}
