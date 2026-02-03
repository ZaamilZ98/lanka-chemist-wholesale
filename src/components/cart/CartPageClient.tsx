"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { DOSAGE_FORM_LABELS } from "@/lib/constants";
import QuantitySelector from "@/components/products/QuantitySelector";
import Skeleton from "@/components/ui/Skeleton";
import type { CartItemResponse } from "@/types/api";

export default function CartPageClient() {
  const {
    items,
    warnings,
    isLoading,
    error,
    fetchCart,
    updateQuantity,
    removeItem,
  } = useCart();

  // Debounce timers per item — delays the actual API call
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Pending quantities for immediate visual update before debounced API call
  const [pendingQty, setPendingQty] = useState<Record<string, number>>({});
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCart();
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuantityChange = useCallback(
    (cartItemId: string, quantity: number) => {
      // Immediate UI update via local state
      setPendingQty((prev) => ({ ...prev, [cartItemId]: quantity }));

      // Debounce the API call
      if (timers.current[cartItemId]) {
        clearTimeout(timers.current[cartItemId]);
      }
      timers.current[cartItemId] = setTimeout(async () => {
        delete timers.current[cartItemId];
        await updateQuantity(cartItemId, quantity);
        // Clear pending once API confirms
        setPendingQty((prev) => {
          const next = { ...prev };
          delete next[cartItemId];
          return next;
        });
      }, 500);
    },
    [updateQuantity],
  );

  const handleRemove = useCallback(
    async (cartItemId: string) => {
      setRemovingIds((prev) => new Set(prev).add(cartItemId));
      await removeItem(cartItemId);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(cartItemId);
        return next;
      });
    },
    [removeItem],
  );

  // Not-approved state
  if (error === "not_approved") {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <svg
            className="mx-auto h-10 w-10 text-amber-500 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-amber-800">
            Account Pending Verification
          </h2>
          <p className="mt-2 text-sm text-amber-700">
            Your account is awaiting approval. You&apos;ll be able to add items
            to your cart and place orders once your account has been verified.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center text-sm font-medium text-amber-800 hover:text-amber-900"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-40 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-4 rounded-lg border border-gray-200 p-4"
              >
                <Skeleton className="h-20 w-20 rounded-md shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </div>
          <div>
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && error !== "not_approved") {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 text-center">
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchCart}
          className="mt-4 text-sm font-medium text-brand-green hover:text-brand-green-dark"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
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
          Browse our products and add items to your cart.
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

  // Account for pending quantity changes in the subtotal display
  const displaySubtotal = items.reduce((sum, item) => {
    const qty = pendingQty[item.id] ?? item.quantity;
    return sum + item.product.wholesale_price * qty;
  }, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

      {/* Warnings banner */}
      {warnings.length > 0 && (
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
                Some items in your cart have changed:
              </p>
              <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                {warnings.map((w, i) => (
                  <li key={i}>
                    {w.type === "out_of_stock" &&
                      `${w.product_name} is now out of stock and was removed`}
                    {w.type === "product_unavailable" &&
                      `${w.product_name} is no longer available and was removed`}
                    {w.type === "quantity_reduced" &&
                      `${w.product_name}: quantity reduced from ${w.old_quantity} to ${w.new_quantity} (limited stock)`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2">
          {/* Desktop table header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-4 pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
            <div className="col-span-6">Product</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                displayQuantity={pendingQty[item.id] ?? item.quantity}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemove}
                isRemoving={removingIds.has(item.id)}
              />
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 sticky top-24">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Order Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>
                  Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})
                </span>
                <span className="font-medium text-gray-900">
                  Rs {displaySubtotal.toLocaleString("en-LK")}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Subtotal</span>
                <span className="font-bold text-lg text-gray-900">
                  Rs {displaySubtotal.toLocaleString("en-LK")}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-5 flex w-full items-center justify-center rounded-lg bg-brand-green px-6 py-3 text-sm font-medium text-white hover:bg-brand-green-dark transition-colors"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/products"
              className="mt-3 flex w-full items-center justify-center text-sm font-medium text-gray-600 hover:text-brand-green transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Cart item row ---

function CartItemRow({
  item,
  displayQuantity,
  onQuantityChange,
  onRemove,
  isRemoving,
}: {
  item: CartItemResponse;
  displayQuantity: number;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  const product = item.product;
  const primaryImage = product.images?.find((img) => img.is_primary) ??
    product.images?.[0];
  const lineTotal = product.wholesale_price * displayQuantity;

  const details = [
    product.strength,
    product.dosage_form
      ? DOSAGE_FORM_LABELS[product.dosage_form] || product.dosage_form
      : null,
    product.pack_size,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div
      className={`py-4 px-1 sm:px-4 transition-opacity ${isRemoving ? "opacity-40" : ""}`}
    >
      {/* Mobile layout */}
      <div className="sm:hidden">
        <div className="flex gap-3">
          {/* Image */}
          <div className="h-20 w-20 shrink-0 rounded-md bg-gray-100 overflow-hidden">
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt_text || product.generic_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <svg
                  className="h-8 w-8 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                  />
                </svg>
              </div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/products/${product.id}`}
              className="text-sm font-medium text-gray-900 hover:text-brand-green line-clamp-2"
            >
              {product.generic_name}
            </Link>
            <p className="text-xs text-gray-500 mt-0.5">{product.brand_name}</p>
            {details && (
              <p className="text-xs text-gray-400 mt-0.5">{details}</p>
            )}
            <p className="text-sm font-semibold text-gray-900 mt-1">
              Rs {product.wholesale_price.toLocaleString("en-LK")}
            </p>
          </div>
          {/* Remove */}
          <button
            onClick={() => onRemove(item.id)}
            disabled={isRemoving}
            className="self-start p-1 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Remove item"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
        </div>
        {/* Mobile quantity + total row */}
        <div className="flex items-center justify-between mt-3 pl-[calc(5rem+0.75rem)]">
          <QuantitySelector
            value={displayQuantity}
            max={product.stock_quantity}
            onChange={(qty) => onQuantityChange(item.id, qty)}
          />
          <p className="text-sm font-semibold text-gray-900">
            Rs {lineTotal.toLocaleString("en-LK")}
          </p>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:grid sm:grid-cols-12 gap-4 items-center">
        {/* Product info */}
        <div className="col-span-6 flex gap-4">
          <div className="h-16 w-16 shrink-0 rounded-md bg-gray-100 overflow-hidden">
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt_text || product.generic_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <svg
                  className="h-6 w-6 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/products/${product.id}`}
              className="text-sm font-medium text-gray-900 hover:text-brand-green line-clamp-1"
            >
              {product.generic_name}
            </Link>
            <p className="text-xs text-gray-500 mt-0.5">{product.brand_name}</p>
            {details && (
              <p className="text-xs text-gray-400 mt-0.5">{details}</p>
            )}
            <button
              onClick={() => onRemove(item.id)}
              disabled={isRemoving}
              className="mt-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
        {/* Unit price */}
        <div className="col-span-2 text-right text-sm text-gray-700">
          Rs {product.wholesale_price.toLocaleString("en-LK")}
        </div>
        {/* Quantity */}
        <div className="col-span-2 flex justify-center">
          <QuantitySelector
            value={displayQuantity}
            max={product.stock_quantity}
            onChange={(qty) => onQuantityChange(item.id, qty)}
          />
        </div>
        {/* Line total */}
        <div className="col-span-2 text-right text-sm font-semibold text-gray-900">
          Rs {lineTotal.toLocaleString("en-LK")}
        </div>
      </div>
    </div>
  );
}
