"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { CUSTOMER_STATUS_LABELS } from "@/lib/constants";

export default function Header() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const statusBadge = user ? (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        user.status === "approved"
          ? "bg-success-light text-green-700"
          : user.status === "pending"
            ? "bg-warning-light text-yellow-700"
            : "bg-danger-light text-red-700"
      }`}
    >
      {CUSTOMER_STATUS_LABELS[user.status] || user.status}
    </span>
  ) : null;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-green text-white font-bold text-lg">
              LC
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-gray-900">
                Lanka Chemist
              </span>
              <span className="text-xs text-gray-500 block leading-none -mt-0.5">
                Wholesale
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className="text-sm font-medium text-gray-600 hover:text-brand-green transition-colors"
            >
              Products
            </Link>
            <Link
              href="/categories"
              className="text-sm font-medium text-gray-600 hover:text-brand-green transition-colors"
            >
              Categories
            </Link>
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
            ) : isAuthenticated ? (
              <>
                {statusBadge}
                <Link
                  href="/account"
                  className="text-sm font-medium text-gray-700 hover:text-brand-green transition-colors"
                >
                  {user?.contact_name?.split(" ")[0] || "Account"}
                </Link>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-700 hover:text-brand-green transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-3">
            <Link
              href="/products"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-gray-600 hover:text-brand-green"
            >
              Products
            </Link>
            <Link
              href="/categories"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-gray-600 hover:text-brand-green"
            >
              Categories
            </Link>
            <div className="border-t border-gray-100 pt-3">
              {isLoading ? null : isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-800">
                      {user?.contact_name}
                    </span>
                    {statusBadge}
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="block text-sm text-gray-600 hover:text-brand-green mb-2"
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 text-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-brand-green"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 text-center rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
