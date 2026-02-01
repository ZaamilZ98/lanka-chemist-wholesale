import { NextRequest, NextResponse } from "next/server";

const CUSTOMER_COOKIE = "lc_token";
const ADMIN_COOKIE = "lc_admin_token";

// Routes requiring customer auth
const PROTECTED_PREFIXES = ["/account", "/cart", "/checkout"];
// Routes only for unauthenticated users
const AUTH_PAGES = ["/auth/login", "/auth/register"];

/**
 * Lightweight JWT structure check for Edge runtime (can't use jsonwebtoken).
 * Verifies: 3 base64url segments, payload decodes to JSON with expected fields.
 * Full signature verification happens in API routes via jsonwebtoken.
 */
function isPlausibleJwt(token: string, expectedType: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.type === expectedType && typeof payload.sub === "string" && !!payload.sub;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const customerToken = request.cookies.get(CUSTOMER_COOKIE)?.value;
  const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
  const hasValidCustomerToken = !!customerToken && isPlausibleJwt(customerToken, "customer");
  const hasValidAdminToken = !!adminToken && isPlausibleJwt(adminToken, "admin");

  // Protect customer routes — redirect to login if no valid cookie
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!hasValidCustomerToken) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from login/register
  if (AUTH_PAGES.some((p) => pathname === p)) {
    if (hasValidCustomerToken) {
      return NextResponse.redirect(new URL("/account", request.url));
    }
  }

  // Protect admin routes — redirect to login if no valid admin cookie
  if (pathname.startsWith("/admin")) {
    if (!hasValidAdminToken) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/auth/login",
    "/auth/register",
    "/admin/:path*",
  ],
};
