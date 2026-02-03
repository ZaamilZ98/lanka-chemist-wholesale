"use client";

interface DeliveryMethodSelectorProps {
  value: string;
  onChange: (method: string) => void;
}

const METHODS = [
  {
    id: "pickup",
    label: "Store Pickup",
    price: "Free",
    description: "Collect from our store",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
      </svg>
    ),
  },
  {
    id: "standard",
    label: "Standard Delivery",
    price: "Rs 25/km",
    description: "Delivered to your address",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h3.75a.75.75 0 00.75-.75V3.375m0 0h7.5a.75.75 0 01.624.334l3.948 5.922A.75.75 0 0120.25 10.5H15a.75.75 0 00-.75.75v2.25a.75.75 0 01-.75.75H7.875" />
      </svg>
    ),
  },
  {
    id: "express",
    label: "Express Delivery",
    price: "Contact us",
    description: "For urgent orders",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
];

export default function DeliveryMethodSelector({
  value,
  onChange,
}: DeliveryMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Delivery Method</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {METHODS.map((method) => {
          const selected = value === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={`relative flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors ${
                selected
                  ? "border-brand-green bg-brand-green-light"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className={`mb-2 ${selected ? "text-brand-green" : "text-gray-400"}`}>
                {method.icon}
              </div>
              <span className={`text-sm font-medium ${selected ? "text-brand-green" : "text-gray-900"}`}>
                {method.label}
              </span>
              <span className={`text-xs mt-0.5 ${selected ? "text-brand-green" : "text-gray-500"}`}>
                {method.price}
              </span>
              <span className="text-xs text-gray-400 mt-1">{method.description}</span>
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
    </div>
  );
}
