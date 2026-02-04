"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { CUSTOMER_STATUS_LABELS } from "@/lib/constants";

export default function Header() {
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Hide storefront header on admin pages
  if (pathname.startsWith("/admin")) return null;

  const fetchCartCount = useCallback(async () => {
    try {
      const res = await fetch("/api/cart/count");
      if (res.ok) {
        const data = await res.json();
        setCartCount(data.count ?? 0);
      }
    } catch {
      // silently fail — badge just won't show
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.status === "approved") {
      fetchCartCount();
    } else {
      setCartCount(0);
    }
  }, [isAuthenticated, user?.status, fetchCartCount]);

  // Listen for cart-updated events
  useEffect(() => {
    const handler = () => fetchCartCount();
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, [fetchCartCount]);

  const showCart = isAuthenticated && user?.status === "approved";

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

          {/* Desktop cart + auth */}
          <div className="hidden md:flex items-center gap-3">
            {showCart && (
              <Link
                href="/cart"
                className="relative p-2 text-gray-600 hover:text-brand-green transition-colors"
                aria-label="Shopping cart"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-green px-1 text-[10px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            )}
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
            {showCart && (
              <Link
                href="/cart"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-green"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Cart{cartCount > 0 && ` (${cartCount})`}
              </Link>
            )}
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
