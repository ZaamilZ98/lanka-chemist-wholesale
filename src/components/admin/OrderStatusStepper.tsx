"use client";

import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/types/database";

interface Props {
  currentStatus: OrderStatus;
}

export default function OrderStatusStepper({ currentStatus }: Props) {
  const isCancelled = currentStatus === "cancelled";
  const currentIndex = ORDER_STATUS_FLOW.indexOf(
    currentStatus as (typeof ORDER_STATUS_FLOW)[number],
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      {isCancelled ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-red-700">Order Cancelled</span>
        </div>
      ) : (
        <>
          {/* Desktop: horizontal stepper */}
          <div className="hidden sm:flex items-center justify-between">
            {ORDER_STATUS_FLOW.map((step, i) => {
              const isCompleted = i < currentIndex;
              const isCurrent = i === currentIndex;
              return (
                <div key={step} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                        isCompleted
                          ? "border-brand-green bg-brand-green text-white"
                          : isCurrent
                            ? "border-brand-green bg-white text-brand-green"
                            : "border-gray-300 bg-white text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`mt-1.5 text-[10px] font-medium leading-tight text-center max-w-[72px] ${
                        isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {ORDER_STATUS_LABELS[step]}
                    </span>
                  </div>
                  {i < ORDER_STATUS_FLOW.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mt-[-16px] ${
                        i < currentIndex ? "bg-brand-green" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile: vertical stepper */}
          <div className="sm:hidden space-y-3">
            {ORDER_STATUS_FLOW.map((step, i) => {
              const isCompleted = i < currentIndex;
              const isCurrent = i === currentIndex;
              return (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      isCompleted
                        ? "border-brand-green bg-brand-green text-white"
                        : isCurrent
                          ? "border-brand-green bg-white text-brand-green"
                          : "border-gray-300 bg-white text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
