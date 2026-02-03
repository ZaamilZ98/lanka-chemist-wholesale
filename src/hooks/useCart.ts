"use client";

import { useCallback, useMemo, useState } from "react";
import type { CartItemResponse, CartWarning } from "@/types/api";

function dispatchCartUpdated() {
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

export function useCart() {
  const [items, setItems] = useState<CartItemResponse[]>([]);
  const [warnings, setWarnings] = useState<CartWarning[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cart");
      if (res.status === 403) {
        setError("not_approved");
        setItems([]);
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load cart");
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setWarnings(data.warnings ?? []);
    } catch {
      setError("Failed to load cart");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToCart = useCallback(
    async (
      productId: string,
      quantity: number,
    ): Promise<{ error?: string }> => {
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId, quantity }),
        });

        if (!res.ok) {
          const data = await res.json();
          return { error: data.error || "Failed to add to cart" };
        }

        dispatchCartUpdated();
        return {};
      } catch {
        return { error: "Failed to add to cart" };
      }
    },
    [],
  );

  const updateQuantity = useCallback(
    async (
      cartItemId: string,
      quantity: number,
    ): Promise<{ error?: string }> => {
      // Optimistic update
      const prev = items;
      setItems((current) =>
        current.map((item) =>
          item.id === cartItemId ? { ...item, quantity } : item,
        ),
      );

      try {
        const res = await fetch(`/api/cart/${cartItemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });

        if (!res.ok) {
          // Revert optimistic update
          setItems(prev);
          const data = await res.json();
          return { error: data.error || "Failed to update quantity" };
        }

        const data = await res.json();
        // Update with server-confirmed data (may be clamped)
        setItems((current) =>
          current.map((item) =>
            item.id === cartItemId ? data.item : item,
          ),
        );
        dispatchCartUpdated();
        return {};
      } catch {
        setItems(prev);
        return { error: "Failed to update quantity" };
      }
    },
    [items],
  );

  const removeItem = useCallback(
    async (cartItemId: string): Promise<{ error?: string }> => {
      // Optimistic update
      const prev = items;
      setItems((current) => current.filter((item) => item.id !== cartItemId));

      try {
        const res = await fetch(`/api/cart/${cartItemId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          setItems(prev);
          return { error: "Failed to remove item" };
        }

        dispatchCartUpdated();
        return {};
      } catch {
        setItems(prev);
        return { error: "Failed to remove item" };
      }
    },
    [items],
  );

  const itemCount = items.length;

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.product.wholesale_price * item.quantity,
        0,
      ),
    [items],
  );

  return {
    items,
    warnings,
    isLoading,
    error,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    itemCount,
    subtotal,
  };
}
