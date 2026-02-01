"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";
import FileUpload from "@/components/ui/FileUpload";
import { SRI_LANKAN_DISTRICTS } from "@/lib/validate";
import type { CustomerType } from "@/types/database";

const CUSTOMER_TYPE_OPTIONS = [
  { value: "doctor", label: "Doctor" },
  { value: "dentist", label: "Dentist" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "clinic", label: "Private Health Clinic" },
  { value: "dispensary", label: "Dispensary" },
  { value: "other", label: "Other Registered Business" },
];

const DISTRICT_OPTIONS = SRI_LANKAN_DISTRICTS.map((d) => ({
  value: d,
  label: d,
}));

const STEPS = [
  "Account Type",
  "Your Details",
  "Verification",
  "Delivery Address",
] as const;

interface FormData {
  customer_type: CustomerType;
  email: string;
  password: string;
  confirm_password: string;
  contact_name: string;
  business_name: string;
  phone: string;
  whatsapp: string;
  slmc_number: string;
  nmra_license_number: string;
  document_url: string;
  document_file_name: string;
  document_file_size: number;
  document_mime_type: string;
  address_line1: string;
  address_line2: string;
  city: string;
  district: string;
  postal_code: string;
}

const initialFormData: FormData = {
  customer_type: "doctor",
  email: "",
  password: "",
  confirm_password: "",
  contact_name: "",
  business_name: "",
  phone: "",
  whatsapp: "",
  slmc_number: "",
  nmra_license_number: "",
  document_url: "",
  document_file_name: "",
  document_file_size: 0,
  document_mime_type: "",
  address_line1: "",
  address_line2: "",
  city: "",
  district: "",
  postal_code: "",
};

export default function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSlmcType = ["doctor", "dentist"].includes(form.customer_type);

  const update = (field: keyof FormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // --- Step validation ---
  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};

    if (s === 0) {
      // Customer type is always selected via radio — no validation needed
    }

    if (s === 1) {
      if (!form.contact_name.trim()) errs.contact_name = "Name is required";
      if (!form.email.trim()) errs.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = "Invalid email address";
      if (!form.password) errs.password = "Password is required";
      else if (form.password.length < 8)
        errs.password = "Password must be at least 8 characters";
      else if (!/[a-z]/.test(form.password))
        errs.password = "Must contain a lowercase letter";
      else if (!/[A-Z]/.test(form.password))
        errs.password = "Must contain an uppercase letter";
      else if (!/\d/.test(form.password))
        errs.password = "Must contain a digit";
      if (form.password !== form.confirm_password)
        errs.confirm_password = "Passwords do not match";
      if (!form.phone.trim()) errs.phone = "Phone number is required";
      else {
        const cleaned = form.phone.replace(/[\s\-()]/g, "");
        if (!/^(\+94\d{9}|0\d{9})$/.test(cleaned))
          errs.phone = "Enter a valid Sri Lankan phone number";
      }
      if (!isSlmcType && !form.business_name.trim())
        errs.business_name = "Business name is required";
      if (isSlmcType) {
        if (!form.slmc_number.trim())
          errs.slmc_number = "SLMC number is required";
        else if (!/^\d{4,10}$/.test(form.slmc_number.trim()))
          errs.slmc_number = "Enter a valid SLMC number (4-10 digits)";
      } else {
        if (!form.nmra_license_number.trim())
          errs.nmra_license_number = "NMRA license number is required";
        else if (!/^[A-Za-z0-9\-/]{3,20}$/.test(form.nmra_license_number.trim()))
          errs.nmra_license_number = "Enter a valid NMRA license number";
      }
    }

    if (s === 2) {
      if (!form.document_url)
        errs.document_url = isSlmcType
          ? "Please upload your SLMC ID"
          : "Please upload your NMRA License";
    }

    if (s === 3) {
      if (!form.address_line1.trim())
        errs.address_line1 = "Address is required";
      if (!form.city.trim()) errs.city = "City is required";
      if (!form.district) errs.district = "District is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setServerError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          // Go to step that has errors
          if (data.errors.email || data.errors.password || data.errors.contact_name || data.errors.phone) {
            setStep(1);
          }
        } else {
          setServerError(data.error || "Registration failed");
        }
        return;
      }

      router.push("/auth/pending");
    } catch {
      setServerError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1 flex items-center">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i <= step
                    ? "bg-brand-green text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`hidden sm:block text-xs font-medium ${
                  i <= step ? "text-gray-800" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-px flex-1 ${
                  i < step ? "bg-brand-green" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {serverError && (
        <Alert type="error" dismissible>
          {serverError}
        </Alert>
      )}

      {/* Step 0: Account type */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            What type of account do you need?
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {CUSTOMER_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("customer_type", opt.value)}
                className={`rounded-lg border-2 p-4 text-left transition-colors ${
                  form.customer_type === opt.value
                    ? "border-brand-green bg-brand-green-light"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    form.customer_type === opt.value
                      ? "text-brand-green"
                      : "text-gray-700"
                  }`}
                >
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Your details
          </h2>
          <Input
            label="Full name"
            required
            placeholder="Dr. John Perera"
            value={form.contact_name}
            onChange={(e) => update("contact_name", e.target.value)}
            error={errors.contact_name}
          />
          {!isSlmcType && (
            <Input
              label="Business name"
              required
              placeholder="ABC Pharmacy (Pvt) Ltd"
              value={form.business_name}
              onChange={(e) => update("business_name", e.target.value)}
              error={errors.business_name}
            />
          )}
          <Input
            label="Email address"
            type="email"
            required
            placeholder="you@example.com"
            autoComplete="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              error={errors.password}
              hint="Upper + lowercase + digit"
            />
            <Input
              label="Confirm password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={form.confirm_password}
              onChange={(e) => update("confirm_password", e.target.value)}
              error={errors.confirm_password}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone number"
              type="tel"
              required
              placeholder="0771234567"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              error={errors.phone}
            />
            <Input
              label="WhatsApp (optional)"
              type="tel"
              placeholder="0771234567"
              value={form.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              error={errors.whatsapp}
              hint="If different from phone"
            />
          </div>
          {isSlmcType ? (
            <Input
              label="SLMC registration number"
              required
              placeholder="e.g. 12345"
              value={form.slmc_number}
              onChange={(e) => update("slmc_number", e.target.value)}
              error={errors.slmc_number}
            />
          ) : (
            <Input
              label="NMRA license number"
              required
              placeholder="e.g. WP/DA/PH/2024/001"
              value={form.nmra_license_number}
              onChange={(e) => update("nmra_license_number", e.target.value)}
              error={errors.nmra_license_number}
            />
          )}
        </div>
      )}

      {/* Step 2: Document upload */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Upload verification document
          </h2>
          <p className="text-sm text-gray-600">
            {isSlmcType
              ? "Please upload a clear photo of your SLMC ID card."
              : "Please upload a clear photo or scan of your NMRA License."}
          </p>
          <FileUpload
            label={isSlmcType ? "SLMC ID" : "NMRA License"}
            required
            hint="A clear, readable photo or scan of the document"
            error={errors.document_url}
            value={
              form.document_url
                ? {
                    url: form.document_url,
                    fileName: form.document_file_name,
                    fileSize: form.document_file_size,
                    mimeType: form.document_mime_type,
                  }
                : null
            }
            onUpload={(result) => {
              update("document_url", result.url);
              setForm((prev) => ({
                ...prev,
                document_file_name: result.fileName,
                document_file_size: result.fileSize,
                document_mime_type: result.mimeType,
              }));
              setErrors((prev) => {
                const next = { ...prev };
                delete next.document_url;
                return next;
              });
            }}
            onRemove={() => {
              update("document_url", "");
              setForm((prev) => ({
                ...prev,
                document_file_name: "",
                document_file_size: 0,
                document_mime_type: "",
              }));
            }}
          />
          <Alert type="info">
            Your document will be reviewed by our team. You&apos;ll receive an
            email once your account is verified.
          </Alert>
        </div>
      )}

      {/* Step 3: Address */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Delivery address
          </h2>
          <Input
            label="Address line 1"
            required
            placeholder="Street address"
            value={form.address_line1}
            onChange={(e) => update("address_line1", e.target.value)}
            error={errors.address_line1}
          />
          <Input
            label="Address line 2 (optional)"
            placeholder="Apartment, suite, etc."
            value={form.address_line2}
            onChange={(e) => update("address_line2", e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="City"
              required
              placeholder="e.g. Colombo"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              error={errors.city}
            />
            <Select
              label="District"
              required
              placeholder="Select district"
              options={DISTRICT_OPTIONS}
              value={form.district}
              onChange={(e) => update("district", e.target.value)}
              error={errors.district}
            />
          </div>
          <Input
            label="Postal code (optional)"
            placeholder="e.g. 10100"
            value={form.postal_code}
            onChange={(e) => update("postal_code", e.target.value)}
          />
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between gap-3 pt-2">
        {step > 0 ? (
          <Button variant="outline" onClick={prevStep} type="button">
            Back
          </Button>
        ) : (
          <div />
        )}
        {step < STEPS.length - 1 ? (
          <Button onClick={nextStep} type="button">
            Continue
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={loading} type="button">
            Create account
          </Button>
        )}
      </div>

      {step === 0 && (
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-brand-green hover:text-brand-green-dark transition-colors"
          >
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
