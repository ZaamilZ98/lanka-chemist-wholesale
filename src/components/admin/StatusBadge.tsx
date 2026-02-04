import { ORDER_STATUS_LABELS, CUSTOMER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";

type BadgeType = "order" | "customer" | "payment";

const orderColors: Record<string, string> = {
  new: "bg-sky-50 text-sky-700 ring-sky-600/20",
  confirmed: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  packing: "bg-violet-50 text-violet-700 ring-violet-600/20",
  ready: "bg-amber-50 text-amber-700 ring-amber-600/20",
  dispatched: "bg-blue-50 text-blue-700 ring-blue-600/20",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-red-50 text-red-700 ring-red-600/20",
};

const customerColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
  suspended: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

const paymentColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  refunded: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

const labelMaps: Record<BadgeType, Record<string, string>> = {
  order: ORDER_STATUS_LABELS,
  customer: CUSTOMER_STATUS_LABELS,
  payment: PAYMENT_STATUS_LABELS,
};

const colorMaps: Record<BadgeType, Record<string, string>> = {
  order: orderColors,
  customer: customerColors,
  payment: paymentColors,
};

interface StatusBadgeProps {
  type: BadgeType;
  status: string;
  className?: string;
}

export default function StatusBadge({ type, status, className = "" }: StatusBadgeProps) {
  const label = labelMaps[type][status] || status;
  const colors = colorMaps[type][status] || "bg-gray-100 text-gray-600 ring-gray-500/20";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colors} ${className}`}
    >
      {label}
    </span>
  );
}
