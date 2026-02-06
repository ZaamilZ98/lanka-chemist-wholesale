"use client";

interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onApply: () => void;
  isLoading?: boolean;
}

export default function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onApply,
  isLoading,
}: DateRangeFilterProps) {
  // Quick date presets
  function setPreset(days: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    onFromChange(startDate.toISOString().split("T")[0]);
    onToChange(endDate.toISOString().split("T")[0]);
  }

  function setThisMonth() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    onFromChange(start.toISOString().split("T")[0]);
    onToChange(now.toISOString().split("T")[0]);
  }

  function setLastMonth() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    onFromChange(start.toISOString().split("T")[0]);
    onToChange(end.toISOString().split("T")[0]);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-end gap-4">
        {/* Date inputs */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green"
          />
        </div>

        {/* Apply button */}
        <button
          onClick={onApply}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Apply
            </>
          )}
        </button>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 ml-auto">
          <button
            onClick={() => setPreset(7)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Last 7 days
          </button>
          <button
            onClick={() => setPreset(30)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Last 30 days
          </button>
          <button
            onClick={setThisMonth}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            This month
          </button>
          <button
            onClick={setLastMonth}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Last month
          </button>
        </div>
      </div>
    </div>
  );
}
