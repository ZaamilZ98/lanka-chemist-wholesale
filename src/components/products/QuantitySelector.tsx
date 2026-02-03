"use client";

interface QuantitySelectorProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export default function QuantitySelector({
  value,
  max,
  onChange,
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (value > 1) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value, 10);
    if (isNaN(num) || num < 1) {
      onChange(1);
    } else if (num > max) {
      onChange(max);
    } else {
      onChange(num);
    }
  };

  const lowStock = max <= 10 && max > 0;

  return (
    <div>
      <div className="inline-flex items-center rounded-lg border border-gray-300">
        <button
          onClick={handleDecrement}
          disabled={value <= 1}
          className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors rounded-l-lg"
          aria-label="Decrease quantity"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>
        <input
          type="number"
          value={value}
          onChange={handleInput}
          min={1}
          max={max}
          className="h-10 w-14 border-x border-gray-300 text-center text-sm font-medium text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={handleIncrement}
          disabled={value >= max}
          className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors rounded-r-lg"
          aria-label="Increase quantity"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {lowStock && (
        <p className="mt-1.5 text-xs text-amber-600">
          Only {max} left in stock
        </p>
      )}
    </div>
  );
}
