"use client";

import { useState, useEffect } from "react";
import { SRI_LANKAN_DISTRICTS } from "@/lib/validate";

interface Address {
  id: string;
  label: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  district: string;
  postal_code: string | null;
  is_default: boolean;
}

interface AddressFormProps {
  address?: Address | null;
  onSave: (data: AddressFormData) => Promise<{ error?: string }>;
  onCancel: () => void;
  isSaving: boolean;
}

interface AddressFormData {
  label: string;
  address_line1: string;
  address_line2: string;
  city: string;
  district: string;
  postal_code: string;
  set_as_default: boolean;
}

export default function AddressForm({
  address,
  onSave,
  onCancel,
  isSaving,
}: AddressFormProps) {
  const isEditing = !!address;

  const [formData, setFormData] = useState<AddressFormData>({
    label: "",
    address_line1: "",
    address_line2: "",
    city: "",
    district: "",
    postal_code: "",
    set_as_default: false,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (address) {
      setFormData({
        label: address.label || "",
        address_line1: address.address_line1 || "",
        address_line2: address.address_line2 || "",
        city: address.city || "",
        district: address.district || "",
        postal_code: address.postal_code || "",
        set_as_default: address.is_default,
      });
    }
  }, [address]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate
    if (!formData.address_line1.trim()) {
      setError("Address line 1 is required");
      return;
    }
    if (!formData.city.trim()) {
      setError("City is required");
      return;
    }
    if (!formData.district) {
      setError("District is required");
      return;
    }

    const result = await onSave(formData);
    if (result.error) {
      setError(result.error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit Address" : "Add New Address"}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Label
              <span className="ml-1 text-xs text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="e.g., Home, Office, Clinic"
            />
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="Street address, building name"
            />
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Address Line 2
              <span className="ml-1 text-xs text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.address_line2}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="Apartment, floor, etc."
            />
          </div>

          {/* City & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                District <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
              >
                <option value="">Select district</option>
                {SRI_LANKAN_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Postal Code
              <span className="ml-1 text-xs text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              className="w-full max-w-[150px] rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="00000"
            />
          </div>

          {/* Set as default */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="set_as_default"
              checked={formData.set_as_default}
              onChange={(e) => setFormData({ ...formData, set_as_default: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
            />
            <label htmlFor="set_as_default" className="text-sm text-gray-700">
              Set as default address
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Add Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
