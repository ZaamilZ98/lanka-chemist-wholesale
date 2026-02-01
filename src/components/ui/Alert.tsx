"use client";

import { useState, type ReactNode } from "react";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertProps {
  type: AlertType;
  children: ReactNode;
  dismissible?: boolean;
  className?: string;
}

const styles: Record<AlertType, string> = {
  success: "bg-success-light border-success/30 text-green-800",
  error: "bg-danger-light border-danger/30 text-red-800",
  warning: "bg-warning-light border-warning/30 text-yellow-800",
  info: "bg-info-light border-info/30 text-blue-800",
};

const icons: Record<AlertType, string> = {
  success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  error: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  warning:
    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

export default function Alert({
  type,
  children,
  dismissible = false,
  className = "",
}: AlertProps) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border p-4 ${styles[type]} ${className}`}
    >
      <svg
        className="h-5 w-5 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[type]} />
      </svg>
      <div className="flex-1 text-sm">{children}</div>
      {dismissible && (
        <button
          onClick={() => setVisible(false)}
          className="flex-shrink-0 rounded p-0.5 hover:opacity-70 transition-opacity"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
