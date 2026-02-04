"use client";

import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: "green" | "blue" | "amber" | "red" | "gray";
  href?: string;
}

const colorMap = {
  green: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    border: "border-emerald-200",
  },
  blue: {
    bg: "bg-sky-50",
    icon: "text-sky-600",
    border: "border-sky-200",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    border: "border-amber-200",
  },
  red: {
    bg: "bg-red-50",
    icon: "text-red-600",
    border: "border-red-200",
  },
  gray: {
    bg: "bg-gray-50",
    icon: "text-gray-600",
    border: "border-gray-200",
  },
};

export default function StatCard({ label, value, icon, color }: StatCardProps) {
  const c = colorMap[color];

  return (
    <div className={`rounded-xl border ${c.border} bg-white p-5`}>
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}
