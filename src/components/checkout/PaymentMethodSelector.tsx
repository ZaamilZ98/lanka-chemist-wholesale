"use client";

import type { BankDetailsResponse } from "@/types/api";

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (method: string) => void;
  bankDetails: BankDetailsResponse | null;
}

const METHODS = [
  {
    id: "cash_on_delivery",
    label: "Cash on Delivery",
    description: "Pay when you receive your order",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    description: "Transfer to our bank account",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
];

export default function PaymentMethodSelector({
  value,
  onChange,
  bankDetails,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Payment Method</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {METHODS.map((method) => {
          const selected = value === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={`relative flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                selected
                  ? "border-brand-green bg-brand-green-light"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className={`mt-0.5 ${selected ? "text-brand-green" : "text-gray-400"}`}>
                {method.icon}
              </div>
              <div>
                <span className={`text-sm font-medium ${selected ? "text-brand-green" : "text-gray-900"}`}>
                  {method.label}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">{method.description}</p>
              </div>
              {/* Radio indicator */}
              <div
                className={`absolute top-3 right-3 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  selected ? "border-brand-green" : "border-gray-300"
                }`}
              >
                {selected && (
                  <div className="h-2 w-2 rounded-full bg-brand-green" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bank details when bank_transfer is selected */}
      {value === "bank_transfer" && bankDetails && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-2">
            Bank Transfer Details
          </h4>
          <dl className="space-y-1.5 text-sm">
            {bankDetails.bank_name && (
              <div className="flex gap-2">
                <dt className="text-blue-600 w-28 shrink-0">Bank:</dt>
                <dd className="text-blue-900 font-medium">{bankDetails.bank_name}</dd>
              </div>
            )}
            {bankDetails.bank_account_name && (
              <div className="flex gap-2">
                <dt className="text-blue-600 w-28 shrink-0">Account Name:</dt>
                <dd className="text-blue-900 font-medium">{bankDetails.bank_account_name}</dd>
              </div>
            )}
            {bankDetails.bank_account_number && (
              <div className="flex gap-2">
                <dt className="text-blue-600 w-28 shrink-0">Account No:</dt>
                <dd className="text-blue-900 font-medium font-mono">{bankDetails.bank_account_number}</dd>
              </div>
            )}
            {bankDetails.bank_branch && (
              <div className="flex gap-2">
                <dt className="text-blue-600 w-28 shrink-0">Branch:</dt>
                <dd className="text-blue-900 font-medium">{bankDetails.bank_branch}</dd>
              </div>
            )}
          </dl>
          <p className="text-xs text-blue-600 mt-3">
            Please include your order number as the payment reference.
          </p>
        </div>
      )}
    </div>
  );
}
