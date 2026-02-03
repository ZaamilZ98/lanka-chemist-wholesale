import type { Metadata } from "next";
import CartPageClient from "@/components/cart/CartPageClient";

export const metadata: Metadata = {
  title: "Shopping Cart | Lanka Chemist Wholesale",
  description: "Review items in your shopping cart",
};

export default function CartPage() {
  return <CartPageClient />;
}
