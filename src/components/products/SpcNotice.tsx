import { SPC_MINIMUM_ORDER } from "@/lib/constants";

export default function SpcNotice() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
      <svg
        className="h-5 w-5 shrink-0 text-amber-500 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <div>
        <p className="text-sm font-medium text-amber-800">
          SPC Items — Minimum Order Required
        </p>
        <p className="mt-0.5 text-sm text-amber-700">
          We only offer SPC items on bills above Rs{" "}
          {SPC_MINIMUM_ORDER.toLocaleString("en-LK")}. Please contact us on our
          hotline or WhatsApp to discuss directly.
        </p>
      </div>
    </div>
  );
}
