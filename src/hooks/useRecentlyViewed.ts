"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "lc_recently_viewed";
const MAX_ITEMS = 10;
const EXPIRY_DAYS = 30;

interface RecentlyViewedItem {
  productId: string;
  viewedAt: number;
}

function getStoredItems(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: RecentlyViewedItem[] = JSON.parse(raw);
    const now = Date.now();
    const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    // Filter out expired items
    return items.filter((item) => now - item.viewedAt < expiryMs);
  } catch {
    return [];
  }
}

function setStoredItems(items: RecentlyViewedItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage might be full or disabled
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Load items from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    setItems(getStoredItems());
  }, []);

  const addToRecentlyViewed = useCallback((productId: string) => {
    setItems((prev) => {
      // Remove existing entry for this product
      const filtered = prev.filter((item) => item.productId !== productId);
      // Add to front
      const updated = [{ productId, viewedAt: Date.now() }, ...filtered].slice(
        0,
        MAX_ITEMS,
      );
      setStoredItems(updated);
      return updated;
    });
  }, []);

  const getRecentlyViewedIds = useCallback(
    (excludeProductId?: string): string[] => {
      const ids = items.map((item) => item.productId);
      if (excludeProductId) {
        return ids.filter((id) => id !== excludeProductId);
      }
      return ids;
    },
    [items],
  );

  const clearRecentlyViewed = useCallback(() => {
    setItems([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    items,
    isClient,
    addToRecentlyViewed,
    getRecentlyViewedIds,
    clearRecentlyViewed,
  };
}
