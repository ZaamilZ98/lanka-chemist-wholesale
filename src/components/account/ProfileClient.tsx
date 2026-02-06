"use client";

import { useEffect, useState } from "react";
import { CUSTOMER_TYPE_LABELS, CUSTOMER_STATUS_LABELS } from "@/lib/constants";
import PasswordChangeForm from "./PasswordChangeForm";

interface Profile {
  id: string;
  email: string;
  customer_type: string;
  contact_name: string;
  business_name: string | null;
  phone: string;
  whatsapp: string | null;
  slmc_number: string | null;
  nmra_license_number: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
}

export default function ProfileClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    contact_name: "",
    phone: "",
    whatsapp: "",
    business_name: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/account/profile");
      if (!res.ok) {
        throw new Error("Failed to load profile");
      }
      const data = await res.json();
      setProfile(data.profile);
      setFormData({
        contact_name: data.profile.contact_name || "",
        phone: data.profile.phone || "",
        whatsapp: data.profile.whatsapp || "",
        business_name: data.profile.business_name || "",
      });
    } catch {
      setError("Failed to load profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit() {
    setIsEditing(true);
    setSaveError("");
    setSaveSuccess(false);
    setFieldErrors({});
  }

  function handleCancel() {
    setIsEditing(false);
    setSaveError("");
    setFieldErrors({});
    // Reset form to current profile values
    if (profile) {
      setFormData({
        contact_name: profile.contact_name || "",
        phone: profile.phone || "",
        whatsapp: profile.whatsapp || "",
        business_name: profile.business_name || "",
      });
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError("");
    setFieldErrors({});
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        setSaveError(data.error || "Failed to save changes");
        return;
      }

      setProfile(data.profile);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-10 w-full bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
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
            onClick={fetchProfile}
            className="text-brand-green hover:text-brand-green-dark font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const statusColor =
    profile.status === "approved"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : profile.status === "pending"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

      {/* Success message */}
      {saveSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Profile updated successfully.
        </div>
      )}

      {/* Profile form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Contact Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contact Name
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green ${
                      fieldErrors.contact_name ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {fieldErrors.contact_name && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.contact_name}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-900">{profile.contact_name}</p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
                <span className="ml-1 text-xs text-gray-400">(cannot be changed)</span>
              </label>
              <p className="text-sm text-gray-900">{profile.email}</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green ${
                      fieldErrors.phone ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="0771234567"
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-900">{profile.phone || "—"}</p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                WhatsApp Number
                <span className="ml-1 text-xs text-gray-400">(optional)</span>
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green ${
                      fieldErrors.whatsapp ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="0771234567"
                  />
                  {fieldErrors.whatsapp && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.whatsapp}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-900">{profile.whatsapp || "—"}</p>
              )}
            </div>

            {/* Business Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Business Name
                <span className="ml-1 text-xs text-gray-400">(optional)</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.business_name || "—"}</p>
              )}
            </div>
          </div>

          {/* Save/Cancel buttons */}
          {isEditing && (
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-lg bg-brand-green px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              {saveError && (
                <p className="text-sm text-red-600">{saveError}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Information (read-only) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Account Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Account Type
              </label>
              <p className="text-sm text-gray-900">
                {CUSTOMER_TYPE_LABELS[profile.customer_type] || profile.customer_type}
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Verification Status
              </label>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                {CUSTOMER_STATUS_LABELS[profile.status] || profile.status}
              </span>
            </div>

            {/* SLMC Number */}
            {profile.slmc_number && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  SLMC Number
                </label>
                <p className="text-sm text-gray-900 font-mono">{profile.slmc_number}</p>
              </div>
            )}

            {/* NMRA License */}
            {profile.nmra_license_number && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  NMRA License Number
                </label>
                <p className="text-sm text-gray-900 font-mono">{profile.nmra_license_number}</p>
              </div>
            )}

            {/* Member Since */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Member Since
              </label>
              <p className="text-sm text-gray-900">
                {new Date(profile.created_at).toLocaleDateString("en-LK", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Security</h2>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Change Password
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <PasswordChangeForm onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}
