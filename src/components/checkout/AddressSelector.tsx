"use client";

import { useState } from "react";
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

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddressAdded: (data: {
    label?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    district: string;
    postal_code?: string;
    set_as_default?: boolean;
  }) => Promise<{ error?: string }>;
  isLoading: boolean;
}

export default function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAddressAdded,
  isLoading,
}: AddressSelectorProps) {
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Form state
  const [label, setLabel] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);

  const resetForm = () => {
    setLabel("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setDistrict("");
    setPostalCode("");
    setSetAsDefault(false);
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!addressLine1.trim()) {
      setFormError("Address line 1 is required");
      return;
    }
    if (!city.trim()) {
      setFormError("City is required");
      return;
    }
    if (!district) {
      setFormError("District is required");
      return;
    }

    setIsSaving(true);
    const result = await onAddressAdded({
      label: label.trim() || undefined,
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim() || undefined,
      city: city.trim(),
      district,
      postal_code: postalCode.trim() || undefined,
      set_as_default: setAsDefault,
    });
    setIsSaving(false);

    if (result.error) {
      setFormError(result.error);
    } else {
      resetForm();
      setShowForm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Delivery Address</h3>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Delivery Address</h3>

      {/* Saved addresses */}
      {addresses.length > 0 && (
        <div className="space-y-2">
          {addresses.map((addr) => {
            const selected = selectedId === addr.id;
            return (
              <button
                key={addr.id}
                type="button"
                onClick={() => onSelect(addr.id)}
                className={`w-full flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                  selected
                    ? "border-brand-green bg-brand-green-light"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {/* Radio */}
                <div
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                    selected ? "border-brand-green" : "border-gray-300"
                  }`}
                >
                  {selected && (
                    <div className="h-2 w-2 rounded-full bg-brand-green" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {addr.label}
                    </span>
                    {addr.is_default && (
                      <span className="text-[10px] font-medium uppercase tracking-wider text-brand-green bg-brand-green-light px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {addr.address_line1}
                    {addr.address_line2 && `, ${addr.address_line2}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {addr.city}, {addr.district}
                    {addr.postal_code && ` ${addr.postal_code}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Add new address toggle */}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-medium text-brand-green hover:text-brand-green-dark transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add new address
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">New Address</h4>
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <p className="text-xs text-red-600">{formError}</p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Label (e.g. &ldquo;Clinic&rdquo;, &ldquo;Pharmacy&rdquo;)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={100}
              placeholder="Default"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              required
              placeholder="Street address"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Apartment, building, floor (optional)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                District <span className="text-red-500">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none bg-white"
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

          <div className="w-1/2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Postal Code
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              maxLength={10}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={setAsDefault}
              onChange={(e) => setSetAsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
            />
            <span className="text-xs text-gray-600">Set as default address</span>
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Address"}
          </button>
        </form>
      )}

      {addresses.length === 0 && !showForm && (
        <p className="text-xs text-gray-500">
          No saved addresses. Add one to proceed with delivery.
        </p>
      )}
    </div>
  );
}
