interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build page numbers to show (max 5 with ellipsis)
  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const btnBase =
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors min-w-[36px] h-9";
  const btnActive = "bg-brand-green text-white";
  const btnInactive =
    "text-gray-600 hover:bg-gray-100 border border-gray-200";
  const btnDisabled = "text-gray-300 cursor-not-allowed";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      {/* Mobile: simple prev/next */}
      <div className="flex flex-1 items-center justify-between sm:hidden">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`${btnBase} px-3 ${page <= 1 ? btnDisabled : btnInactive}`}
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={`${btnBase} px-3 ${page >= totalPages ? btnDisabled : btnInactive}`}
        >
          Next
        </button>
      </div>

      {/* Desktop: full pagination */}
      <div className="hidden sm:flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`${btnBase} px-2.5 ${page <= 1 ? btnDisabled : btnInactive}`}
          aria-label="Previous page"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="px-1 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={`${btnBase} px-2.5 ${page >= totalPages ? btnDisabled : btnInactive}`}
          aria-label="Next page"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
}
