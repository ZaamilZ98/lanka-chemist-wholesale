"use client";

import { useEffect, useState, useCallback } from "react";
import AddressCard from "./AddressCard";
import AddressForm from "./AddressForm";

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

export default function AddressesClient() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/account/addresses");
      if (!res.ok) {
        throw new Error("Failed to load addresses");
      }
      const data = await res.json();
      setAddresses(data.addresses ?? []);
    } catch {
      setError("Failed to load addresses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  function handleAddNew() {
    setEditingAddress(null);
    setShowForm(true);
  }

  function handleEdit(address: Address) {
    setEditingAddress(address);
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingAddress(null);
  }

  async function handleSave(data: {
    label: string;
    address_line1: string;
    address_line2: string;
    city: string;
    district: string;
    postal_code: string;
    set_as_default: boolean;
  }): Promise<{ error?: string }> {
    setIsSaving(true);

    try {
      const url = editingAddress
        ? `/api/account/addresses/${editingAddress.id}`
        : "/api/account/addresses";
      const method = editingAddress ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        return { error: result.error || "Failed to save address" };
      }

      // Refresh addresses
      await fetchAddresses();
      setShowForm(false);
      setEditingAddress(null);
      return {};
    } catch {
      return { error: "Failed to save address. Please try again." };
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setShowDeleteConfirm(id);
  }

  async function confirmDelete() {
    if (!showDeleteConfirm) return;

    const id = showDeleteConfirm;
    setShowDeleteConfirm(null);
    setDeletingId(id);

    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete address");
        return;
      }

      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Failed to delete address. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ set_as_default: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to set default address");
        return;
      }

      // Update local state
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === id,
        })),
      );
    } catch {
      alert("Failed to set default address. Please try again.");
    }
  }

  if (isLoading) {
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

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAddresses}
            className="text-brand-green hover:text-brand-green-dark font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Addresses</h1>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Address
        </button>
      </div>

      {/* Addresses list */}
      {addresses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
            <p className="text-gray-600 mb-4">No addresses saved yet</p>
            <button
              onClick={handleAddNew}
              className="text-brand-green hover:text-brand-green-dark font-medium"
            >
              Add your first address
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
              isDeleting={deletingId === address.id}
            />
          ))}
        </div>
      )}

      {/* Address form modal */}
      {showForm && (
        <AddressForm
          address={editingAddress}
          onSave={handleSave}
          onCancel={handleCancelForm}
          isSaving={isSaving}
        />
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Address</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this address? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
