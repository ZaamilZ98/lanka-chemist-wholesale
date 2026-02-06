"use client";

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

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  isDeleting?: boolean;
}

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isDeleting = false,
}: AddressCardProps) {
  return (
    <div className={`bg-white rounded-xl border ${address.is_default ? "border-brand-green" : "border-gray-200"} p-4 transition-opacity ${isDeleting ? "opacity-50" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">{address.label}</h3>
          {address.is_default && (
            <span className="inline-flex items-center rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-medium text-brand-green">
              Default
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(address)}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Edit address"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(address.id)}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete address"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Address details */}
      <div className="text-sm text-gray-600 space-y-0.5">
        <p>{address.address_line1}</p>
        {address.address_line2 && <p>{address.address_line2}</p>}
        <p>
          {address.city}, {address.district}
          {address.postal_code && ` ${address.postal_code}`}
        </p>
      </div>

      {/* Set as default button */}
      {!address.is_default && (
        <button
          onClick={() => onSetDefault(address.id)}
          disabled={isDeleting}
          className="mt-3 text-sm font-medium text-brand-green hover:text-brand-green-dark transition-colors"
        >
          Set as default
        </button>
      )}
    </div>
  );
}
