import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return secret;
}
const CUSTOMER_COOKIE = "lc_token";
const ADMIN_COOKIE = "lc_admin_token";

// --- Password ---

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// --- JWT ---

interface CustomerPayload {
  sub: string; // customer id
  email: string;
  type: "customer";
}

interface AdminPayload {
  sub: string; // admin id
  email: string;
  type: "admin";
}

export function signToken(customerId: string, email: string): string {
  const payload: CustomerPayload = {
    sub: customerId,
    email,
    type: "customer",
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function signAdminToken(adminId: string, email: string): string {
  const payload: AdminPayload = { sub: adminId, email, type: "admin" };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "8h" });
}

export function verifyToken(token: string): CustomerPayload {
  const decoded = jwt.verify(token, getJwtSecret()) as CustomerPayload;
  if (decoded.type !== "customer") throw new Error("Invalid token type");
  return decoded;
}

export function verifyAdminToken(token: string): AdminPayload {
  const decoded = jwt.verify(token, getJwtSecret()) as AdminPayload;
  if (decoded.type !== "admin") throw new Error("Invalid token type");
  return decoded;
}

// --- Cookies ---

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function setAdminCookie(token: string) {
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}

export async function getTokenFromCookies(): Promise<string | null> {
  const store = await cookies();
  return store.get(CUSTOMER_COOKIE)?.value ?? null;
}

export async function getAdminTokenFromCookies(): Promise<string | null> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value ?? null;
}

// --- Helpers ---

/** Extract and verify customer from cookie. Returns null if invalid/missing. */
export async function getAuthenticatedCustomer(): Promise<CustomerPayload | null> {
  const token = await getTokenFromCookies();
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

/** Extract and verify admin from cookie. Returns null if invalid/missing. */
export async function getAuthenticatedAdmin(): Promise<AdminPayload | null> {
  const token = await getAdminTokenFromCookies();
  if (!token) return null;
  try {
    return verifyAdminToken(token);
  } catch {
    return null;
  }
}
