"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReorderResponse } from "@/types/api";

interface ReorderButtonProps {
  orderId: string;
  disabled?: boolean;
}

export default function ReorderButton({ orderId, disabled }: ReorderButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState<ReorderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReorder() {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/reorder`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reorder");
      }

      setResult(data as ReorderResponse);
      setShowModal(true);

      // Dispatch cart-updated event
      window.dispatchEvent(new CustomEvent("cart-updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder");
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setShowModal(false);
    if (result?.success) {
      router.push("/cart");
    }
  }

  function handleGoToCart() {
    setShowModal(false);
    router.push("/cart");
  }

  return (
    <>
      <button
        onClick={handleReorder}
        disabled={disabled || isLoading}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Adding to Cart...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Reorder
          </>
        )}
      </button>

      {/* Result modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={handleClose}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            {error ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Failed to Reorder</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">{error}</p>
                <button
                  onClick={handleClose}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </>
            ) : result ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    result.success ? "bg-green-100" : "bg-yellow-100"
                  }`}>
                    <svg
                      className={`h-5 w-5 ${result.success ? "text-green-600" : "text-yellow-600"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      {result.success ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      )}
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {result.success ? "Items Added to Cart" : "Some Items Could Not Be Added"}
                  </h3>
                </div>

                {result.items_added > 0 && (
                  <p className="text-sm text-gray-600 mb-4">
                    {result.items_added} item{result.items_added !== 1 ? "s" : ""} added to your cart.
                  </p>
                )}

                {result.warnings.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-900 mb-2">Notices:</p>
                    <ul className="space-y-2">
                      {result.warnings.map((warning, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <svg className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                          <span>
                            <strong>{warning.product_name}</strong>
                            {warning.reason === "out_of_stock" && " is out of stock"}
                            {warning.reason === "unavailable" && " is no longer available"}
                            {warning.reason === "quantity_reduced" && (
                              <> - only {warning.added_quantity} of {warning.original_quantity} added (limited stock)</>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {result.success ? "Close" : "Back"}
                  </button>
                  {result.items_added > 0 && (
                    <button
                      onClick={handleGoToCart}
                      className="flex-1 rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark transition-colors"
                    >
                      Go to Cart
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
