import { Metadata } from "next";
import { Suspense } from "react";
import AddressesClient from "@/components/account/AddressesClient";

export const metadata: Metadata = {
  title: "My Addresses - Lanka Chemist Wholesale",
  description: "Manage your delivery addresses",
};

function AddressesLoading() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
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

export default function AddressesPage() {
  return (
    <Suspense fallback={<AddressesLoading />}>
      <AddressesClient />
    </Suspense>
  );
}
