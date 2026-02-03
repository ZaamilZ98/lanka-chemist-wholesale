const variantClasses = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  gray: "bg-gray-100 text-gray-600 ring-gray-500/20",
} as const;

type BadgeVariant = keyof typeof variantClasses;

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({
  children,
  variant = "gray",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
