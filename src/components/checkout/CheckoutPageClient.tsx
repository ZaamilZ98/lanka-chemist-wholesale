"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useCheckout } from "@/hooks/useCheckout";
import DeliveryMethodSelector from "./DeliveryMethodSelector";
import AddressSelector from "./AddressSelector";
import PaymentMethodSelector from "./PaymentMethodSelector";
import OrderSummary from "./OrderSummary";
import Skeleton from "@/components/ui/Skeleton";

function dispatchCartUpdated() {
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

export default function CheckoutPageClient() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isApproved } = useAuth();
  const checkout = useCheckout();
  const [initialized, setInitialized] = useState(false);

  // Load cart and addresses on mount
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/checkout");
      return;
    }
    if (!isApproved) return;

    const init = async () => {
      await Promise.all([checkout.fetchCart(), checkout.fetchAddresses()]);
      setInitialized(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, isApproved]);

  const handlePlaceOrder = async () => {
    const result = await checkout.placeOrder();
    if (result.orderId) {
      dispatchCartUpdated();
      router.push(`/checkout/confirmation?order=${result.orderId}`);
    }
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-40 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Not authenticated — redirecting
  if (!isAuthenticated) return null;

  // Not approved
  if (!isApproved) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-amber-800">
            Account Pending Verification
          </h2>
          <p className="mt-2 text-sm text-amber-700">
            Your account is awaiting approval. You can place orders once verified.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-flex text-sm font-medium text-amber-800 hover:text-amber-900"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  // Loading cart
  if (!initialized || checkout.isLoadingCart) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-40 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Cart error
  if (checkout.cartError) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 text-center">
        <p className="text-gray-600">{checkout.cartError}</p>
        <button
          onClick={checkout.fetchCart}
          className="mt-4 text-sm font-medium text-brand-green hover:text-brand-green-dark"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty cart
  if (checkout.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 text-center">
        <svg
          className="mx-auto h-16 w-16 text-gray-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Your cart is empty
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Add items to your cart before checking out.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-lg bg-brand-green px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-green-dark transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        <Link
          href="/cart"
          className="text-sm font-medium text-brand-green hover:text-brand-green-dark transition-colors"
        >
          Edit Cart
        </Link>
      </div>

      {/* Cart warnings */}
      {checkout.warnings.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <svg
              className="h-5 w-5 text-amber-500 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">
                Some items have changed since you added them:
              </p>
              <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                {checkout.warnings.map((w, i) => (
                  <li key={i}>
                    {w.type === "out_of_stock" &&
                      `${w.product_name} is now out of stock and was removed`}
                    {w.type === "product_unavailable" &&
                      `${w.product_name} is no longer available and was removed`}
                    {w.type === "quantity_reduced" &&
                      `${w.product_name}: quantity reduced from ${w.old_quantity} to ${w.new_quantity}`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stock issues error */}
      {checkout.stockIssues.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <svg
              className="h-5 w-5 text-red-500 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">
                Some items exceed available stock:
              </p>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {checkout.stockIssues.map((issue) => (
                  <li key={issue.product_id}>
                    {issue.product_name}: requested {issue.requested}, only {issue.available} available
                  </li>
                ))}
              </ul>
              <Link
                href="/cart"
                className="mt-2 inline-flex text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Return to cart to adjust quantities
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Submit error */}
      {checkout.submitError && checkout.stockIssues.length === 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{checkout.submitError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column — form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order items review */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Items ({checkout.items.length})
            </h3>
            <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
              {checkout.items.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 line-clamp-1">
                      {item.product.generic_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.product.brand_name}
                      {item.product.strength && ` / ${item.product.strength}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">
                      {item.quantity} &times; Rs {item.product.wholesale_price.toLocaleString("en-LK")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      Rs {(item.product.wholesale_price * item.quantity).toLocaleString("en-LK")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery method */}
          <DeliveryMethodSelector
            value={checkout.deliveryMethod}
            onChange={checkout.setDeliveryMethod}
          />

          {/* Address selector — shown for delivery methods */}
          {checkout.needsAddress && (
            <AddressSelector
              addresses={checkout.addresses}
              selectedId={checkout.selectedAddressId}
              onSelect={checkout.setSelectedAddressId}
              onAddressAdded={checkout.addAddress}
              isLoading={checkout.isLoadingAddresses}
            />
          )}

          {/* Payment method */}
          <PaymentMethodSelector
            value={checkout.paymentMethod}
            onChange={checkout.setPaymentMethod}
            bankDetails={checkout.bankDetails}
          />

          {/* Order notes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Order Notes <span className="font-normal text-gray-400">(optional)</span>
            </h3>
            <textarea
              value={checkout.orderNotes}
              onChange={(e) => checkout.setOrderNotes(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Any special instructions for your order..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {checkout.orderNotes.length}/1000
            </p>
          </div>

          {/* Preferred delivery date — shown for delivery methods */}
          {checkout.needsAddress && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Preferred Delivery Date <span className="font-normal text-gray-400">(optional)</span>
              </h3>
              <input
                type="date"
                value={checkout.preferredDeliveryDate}
                onChange={(e) => checkout.setPreferredDeliveryDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none"
              />
            </div>
          )}

          {/* Contact notice */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex gap-3">
              <svg className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <p className="text-sm text-gray-600">
                We may contact you by phone or WhatsApp for order confirmation and delivery coordination.
              </p>
            </div>
          </div>

          {/* Mobile place order button */}
          <div className="lg:hidden">
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  Rs {checkout.total.toLocaleString("en-LK")}
                </span>
              </div>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={!checkout.canSubmit || checkout.isSubmitting}
                className="flex w-full items-center justify-center rounded-lg bg-brand-green px-6 py-3 text-sm font-medium text-white hover:bg-brand-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkout.isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right column — order summary (desktop) */}
        <div className="hidden lg:block">
          <OrderSummary
            items={checkout.items}
            subtotal={checkout.subtotal}
            deliveryFee={checkout.deliveryFee}
            deliveryFeeNote={checkout.deliveryFeeNote}
            total={checkout.total}
            onPlaceOrder={handlePlaceOrder}
            isSubmitting={checkout.isSubmitting}
            canSubmit={checkout.canSubmit}
            isCalculatingFee={checkout.isCalculatingFee}
          />
        </div>
      </div>
    </div>
  );
}
