import type { Metadata } from "next";
import { Suspense } from "react";
import OrderConfirmation from "@/components/checkout/OrderConfirmation";

export const metadata: Metadata = {
  title: "Order Confirmation | Lanka Chemist Wholesale",
  description: "Your order has been placed successfully",
};

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<ConfirmationSkeleton />}>
      <OrderConfirmation />
    </Suspense>
  );
}

function ConfirmationSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <div className="h-14 w-14 rounded-full bg-gray-100 animate-pulse mx-auto mb-4" />
      <div className="h-7 w-64 bg-gray-100 animate-pulse mx-auto rounded mb-2" />
      <div className="h-5 w-48 bg-gray-100 animate-pulse mx-auto rounded mb-8" />
      <div className="h-40 w-full bg-gray-100 animate-pulse rounded-lg mb-4" />
      <div className="h-32 w-full bg-gray-100 animate-pulse rounded-lg" />
    </div>
  );
}
