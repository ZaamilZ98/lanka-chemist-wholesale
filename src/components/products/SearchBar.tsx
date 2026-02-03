"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SearchSuggestion } from "@/types/api";
import { DOSAGE_FORM_LABELS } from "@/lib/constants";

interface SearchBarProps {
  initialValue?: string;
  onSearch?: (term: string) => void;
}

function highlightMatch(text: string, query: string) {
  if (!query || query.length < 2) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-amber-100 text-inherit rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default function SearchBar({ initialValue = "", onSearch }: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  // Update value when initialValue changes (e.g. from URL params)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const fetchSuggestions = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/products/search?q=${encodeURIComponent(term)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions);
        setIsOpen(data.suggestions.length > 0);
      }
    } catch {
      // Silently fail on autocomplete
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setValue(term);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(term), 300);
  };

  const submitSearch = (term: string) => {
    setIsOpen(false);
    if (onSearch) {
      onSearch(term);
    } else {
      router.push(`/products?q=${encodeURIComponent(term)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        router.push(`/products/${suggestions[activeIndex].id}`);
        setIsOpen(false);
      } else {
        submitSearch(value);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearSearch = () => {
    setValue("");
    setSuggestions([]);
    setIsOpen(false);
    if (onSearch) onSearch("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Search by name, brand, SKU..."
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-9 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        />

        {/* Loading spinner or clear button */}
        {value && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            {isLoading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden"
        >
          {suggestions.map((item, index) => (
            <button
              key={item.id}
              onClick={() => {
                router.push(`/products/${item.id}`);
                setIsOpen(false);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`w-full px-3.5 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                index === activeIndex ? "bg-gray-50" : ""
              }`}
            >
              <svg
                className="h-4 w-4 shrink-0 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">
                  {highlightMatch(item.generic_name, value)}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {highlightMatch(item.brand_name, value)}
                  {item.strength && ` · ${item.strength}`}
                  {item.dosage_form && ` · ${DOSAGE_FORM_LABELS[item.dosage_form] || item.dosage_form}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
