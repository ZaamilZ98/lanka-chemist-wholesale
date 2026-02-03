import type { Metadata } from "next";
import CheckoutPageClient from "@/components/checkout/CheckoutPageClient";

export const metadata: Metadata = {
  title: "Checkout | Lanka Chemist Wholesale",
  description: "Complete your order",
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
