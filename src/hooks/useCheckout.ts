"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCart } from "./useCart";
import type {
  BankDetailsResponse,
  CartItemResponse,
  DeliveryFeeResponse,
  StockIssue,
} from "@/types/api";

interface Address {
  id: string;
  label: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  district: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
}

interface AddAddressData {
  label?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  district: string;
  postal_code?: string;
  set_as_default?: boolean;
}

export function useCheckout() {
  const cart = useCart();

  // Checkout state
  const [deliveryMethod, setDeliveryMethod] = useState<string>("standard");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash_on_delivery");
  const [orderNotes, setOrderNotes] = useState("");
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState("");

  // Data state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryFeeNote, setDeliveryFeeNote] = useState("");
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetailsResponse | null>(null);

  // Loading / error state
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [stockIssues, setStockIssues] = useState<StockIssue[]>([]);

  // Fetch addresses
  const fetchAddresses = useCallback(async () => {
    setIsLoadingAddresses(true);
    try {
      const res = await fetch("/api/checkout/addresses");
      if (res.ok) {
        const data = await res.json();
        const addrs: Address[] = data.addresses ?? [];
        setAddresses(addrs);
        // Auto-select default address
        const defaultAddr = addrs.find((a) => a.is_default);
        if (defaultAddr && !selectedAddressId) {
          setSelectedAddressId(defaultAddr.id);
        } else if (addrs.length > 0 && !selectedAddressId) {
          setSelectedAddressId(addrs[0].id);
        }
      }
    } catch {
      // silently fail
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [selectedAddressId]);

  // Add address
  const addAddress = useCallback(
    async (data: AddAddressData): Promise<{ error?: string }> => {
      try {
        const res = await fetch("/api/checkout/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          return { error: err.error || "Failed to add address" };
        }
        const result = await res.json();
        setAddresses((prev) => [result.address, ...prev]);
        setSelectedAddressId(result.address.id);
        return {};
      } catch {
        return { error: "Failed to add address" };
      }
    },
    [],
  );

  // Calculate delivery fee
  const calculateFee = useCallback(async () => {
    setIsCalculatingFee(true);
    try {
      const res = await fetch("/api/checkout/delivery-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_method: deliveryMethod,
          address_id: selectedAddressId,
        }),
      });
      if (res.ok) {
        const data: DeliveryFeeResponse = await res.json();
        setDeliveryFee(data.delivery_fee);
        setDeliveryFeeNote(data.fee_note);
        setDeliveryDistanceKm(data.delivery_distance_km);
      }
    } catch {
      setDeliveryFee(0);
      setDeliveryFeeNote("Unable to calculate delivery fee");
    } finally {
      setIsCalculatingFee(false);
    }
  }, [deliveryMethod, selectedAddressId]);

  // Recalculate fee when delivery method or address changes
  useEffect(() => {
    calculateFee();
  }, [calculateFee]);

  // Fetch bank details when bank_transfer selected
  const fetchBankDetails = useCallback(async () => {
    try {
      const res = await fetch("/api/checkout/bank-details");
      if (res.ok) {
        const data: BankDetailsResponse = await res.json();
        setBankDetails(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (paymentMethod === "bank_transfer" && !bankDetails) {
      fetchBankDetails();
    }
  }, [paymentMethod, bankDetails, fetchBankDetails]);

  // Place order
  const placeOrder = useCallback(async (): Promise<{
    orderId?: string;
    orderNumber?: string;
    error?: string;
    stockIssues?: StockIssue[];
  }> => {
    setIsSubmitting(true);
    setSubmitError("");
    setStockIssues([]);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_method: deliveryMethod,
          delivery_address_id: selectedAddressId || undefined,
          payment_method: paymentMethod,
          order_notes: orderNotes || undefined,
          preferred_delivery_date: preferredDeliveryDate || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.stock_issues) {
          setStockIssues(data.stock_issues);
        }
        setSubmitError(data.error || "Failed to place order");
        return {
          error: data.error || "Failed to place order",
          stockIssues: data.stock_issues,
        };
      }

      return {
        orderId: data.order.id,
        orderNumber: data.order.order_number,
      };
    } catch {
      setSubmitError("Failed to place order. Please try again.");
      return { error: "Failed to place order. Please try again." };
    } finally {
      setIsSubmitting(false);
    }
  }, [deliveryMethod, selectedAddressId, paymentMethod, orderNotes, preferredDeliveryDate]);

  // Computed values
  const subtotal = cart.subtotal;
  const total = subtotal + deliveryFee;

  const needsAddress = deliveryMethod === "standard" || deliveryMethod === "express";

  const canSubmit = useMemo(() => {
    if (cart.items.length === 0) return false;
    if (!deliveryMethod) return false;
    if (needsAddress && !selectedAddressId) return false;
    if (!paymentMethod) return false;
    if (isSubmitting) return false;
    return true;
  }, [cart.items.length, deliveryMethod, needsAddress, selectedAddressId, paymentMethod, isSubmitting]);

  return {
    // Cart data
    items: cart.items,
    warnings: cart.warnings,
    isLoadingCart: cart.isLoading,
    cartError: cart.error,
    fetchCart: cart.fetchCart,

    // Checkout state
    deliveryMethod,
    setDeliveryMethod,
    selectedAddressId,
    setSelectedAddressId,
    paymentMethod,
    setPaymentMethod,
    orderNotes,
    setOrderNotes,
    preferredDeliveryDate,
    setPreferredDeliveryDate,

    // Data
    addresses,
    deliveryFee,
    deliveryFeeNote,
    deliveryDistanceKm,
    bankDetails,

    // Loading
    isLoadingAddresses,
    isCalculatingFee,
    isSubmitting,
    submitError,
    stockIssues,

    // Actions
    fetchAddresses,
    addAddress,
    calculateFee,
    fetchBankDetails,
    placeOrder,

    // Computed
    subtotal,
    total,
    needsAddress,
    canSubmit,
  };
}
