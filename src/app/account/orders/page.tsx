import { Metadata } from "next";
import { Suspense } from "react";
import OrdersClient from "@/components/account/OrdersClient";

export const metadata: Metadata = {
  title: "My Orders - Lanka Chemist Wholesale",
  description: "View and manage your orders",
};

function OrdersLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <OrdersClient />
    </Suspense>
  );
}
