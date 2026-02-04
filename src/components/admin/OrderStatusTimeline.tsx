"use client";

import StatusBadge from "./StatusBadge";

interface TimelineEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  notes: string | null;
  admin_name: string | null;
  created_at: string;
}

interface Props {
  history: TimelineEntry[];
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderStatusTimeline({ history }: Props) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">No status history recorded.</p>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-4">
        {history.map((entry, i) => (
          <li key={entry.id} className="relative pb-4">
            {i < history.length - 1 && (
              <span
                className="absolute left-3 top-6 -ml-px h-full w-0.5 bg-gray-200"
                aria-hidden="true"
              />
            )}
            <div className="relative flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 ring-2 ring-white">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {entry.old_status && (
                    <>
                      <StatusBadge type="order" status={entry.old_status} />
                      <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                  <StatusBadge type="order" status={entry.new_status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                  <span>{formatDateTime(entry.created_at)}</span>
                  {entry.admin_name && (
                    <>
                      <span>&middot;</span>
                      <span>by {entry.admin_name}</span>
                    </>
                  )}
                </div>
                {entry.notes && (
                  <p className="mt-1 text-sm text-gray-600">{entry.notes}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
