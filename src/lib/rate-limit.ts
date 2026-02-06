import { MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_MINUTES } from "./constants";

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

// In-memory store (resets on server restart — acceptable for single-instance)
const attempts = new Map<string, AttemptRecord>();

// Max entries to prevent unbounded memory growth
const MAX_ENTRIES = 10_000;
// Stale entry TTL: entries older than lockout period + buffer are cleaned up
const STALE_TTL_MS = (LOGIN_LOCKOUT_MINUTES + 5) * 60_000;

function getKey(ip: string, email: string): string {
  return `${ip}:${email.toLowerCase()}`;
}

/** Remove expired/stale entries periodically */
function cleanup() {
  if (attempts.size <= MAX_ENTRIES / 2) return;
  const now = Date.now();
  for (const [key, record] of attempts) {
    const age = now - record.firstAttempt;
    const lockoutExpired =
      record.lockedUntil !== null && now > record.lockedUntil;
    if (age > STALE_TTL_MS || lockoutExpired) {
      attempts.delete(key);
    }
  }
  // If still too large, remove oldest entries
  if (attempts.size > MAX_ENTRIES) {
    const entries = [...attempts.entries()].sort(
      (a, b) => a[1].firstAttempt - b[1].firstAttempt,
    );
    const toRemove = entries.slice(0, attempts.size - MAX_ENTRIES);
    for (const [key] of toRemove) {
      attempts.delete(key);
    }
  }
}

/** Returns null if OK, or a message string if rate-limited. */
export function checkRateLimit(ip: string, email: string): string | null {
  const key = getKey(ip, email);
  const record = attempts.get(key);
  if (!record) return null;

  // Check if lockout has expired
  if (record.lockedUntil) {
    if (Date.now() < record.lockedUntil) {
      const remaining = Math.ceil(
        (record.lockedUntil - Date.now()) / 60_000,
      );
      return `Too many failed attempts. Try again in ${remaining} minute${remaining !== 1 ? "s" : ""}.`;
    }
    // Lockout expired — reset
    attempts.delete(key);
    return null;
  }

  return null;
}

export function recordFailedAttempt(ip: string, email: string): void {
  // Run cleanup if map is getting large
  cleanup();

  const key = getKey(ip, email);
  const record = attempts.get(key);

  if (!record) {
    attempts.set(key, {
      count: 1,
      firstAttempt: Date.now(),
      lockedUntil: null,
    });
    return;
  }

  record.count += 1;

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOGIN_LOCKOUT_MINUTES * 60_000;
  }

  attempts.set(key, record);
}

export function clearAttempts(ip: string, email: string): void {
  attempts.delete(getKey(ip, email));
}

// --- IP-based rate limiting (for endpoints without email, e.g., admin setup) ---

interface IpAttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

// Separate store for IP-only rate limiting
const ipAttempts = new Map<string, IpAttemptRecord>();
const IP_MAX_ENTRIES = 10_000;

function getIpKey(ip: string, endpoint: string): string {
  return `${ip}:${endpoint}`;
}

/** Remove expired IP-based entries periodically */
function cleanupIpAttempts(windowMinutes: number) {
  if (ipAttempts.size <= IP_MAX_ENTRIES / 2) return;
  const now = Date.now();
  const staleTtl = (windowMinutes + 5) * 60_000;

  for (const [key, record] of ipAttempts) {
    const age = now - record.firstAttempt;
    const lockoutExpired =
      record.lockedUntil !== null && now > record.lockedUntil;
    if (age > staleTtl || lockoutExpired) {
      ipAttempts.delete(key);
    }
  }

  // If still too large, remove oldest entries
  if (ipAttempts.size > IP_MAX_ENTRIES) {
    const entries = [...ipAttempts.entries()].sort(
      (a, b) => a[1].firstAttempt - b[1].firstAttempt,
    );
    const toRemove = entries.slice(0, ipAttempts.size - IP_MAX_ENTRIES);
    for (const [key] of toRemove) {
      ipAttempts.delete(key);
    }
  }
}

/**
 * Check IP-based rate limit for a specific endpoint.
 * Returns null if OK, or a message string if rate-limited.
 * Automatically records the attempt.
 */
export function checkIpRateLimit(
  ip: string,
  endpoint: string,
  maxAttempts: number,
  windowMinutes: number,
): string | null {
  const key = getIpKey(ip, endpoint);
  const now = Date.now();
  const record = ipAttempts.get(key);

  // Check if currently locked out
  if (record?.lockedUntil) {
    if (now < record.lockedUntil) {
      const remaining = Math.ceil((record.lockedUntil - now) / 60_000);
      return `Too many requests. Try again in ${remaining} minute${remaining !== 1 ? "s" : ""}.`;
    }
    // Lockout expired — reset
    ipAttempts.delete(key);
  }

  // Run cleanup if map is getting large
  cleanupIpAttempts(windowMinutes);

  // Get or create record
  const currentRecord = ipAttempts.get(key);

  if (!currentRecord) {
    // First attempt
    ipAttempts.set(key, {
      count: 1,
      firstAttempt: now,
      lockedUntil: null,
    });
    return null;
  }

  // Check if window has expired (reset if so)
  const windowMs = windowMinutes * 60_000;
  if (now - currentRecord.firstAttempt > windowMs) {
    ipAttempts.set(key, {
      count: 1,
      firstAttempt: now,
      lockedUntil: null,
    });
    return null;
  }

  // Increment count
  currentRecord.count += 1;

  // Check if limit exceeded
  if (currentRecord.count > maxAttempts) {
    currentRecord.lockedUntil = now + windowMs;
    ipAttempts.set(key, currentRecord);
    return `Too many requests. Try again in ${windowMinutes} minute${windowMinutes !== 1 ? "s" : ""}.`;
  }

  ipAttempts.set(key, currentRecord);
  return null;
}
