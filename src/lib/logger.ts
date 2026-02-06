/**
 * Sanitized error logging utility.
 * In production, only logs error messages without stack traces.
 * In development, logs full error details for debugging.
 */

/**
 * Log an error with context. Sanitizes output in production.
 * @param context - Identifier for where the error occurred (e.g., "Admin setup")
 * @param error - The error object or unknown value
 */
export function logError(context: string, error: unknown): void {
  const timestamp = new Date().toISOString();

  if (process.env.NODE_ENV === "production") {
    // In production, only log sanitized message without stack trace
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[${timestamp}] [${context}] ${message}`);
  } else {
    // In development, log full error details for debugging
    console.error(`[${timestamp}] [${context}]`, error);
  }
}

/**
 * Log a warning with context.
 * @param context - Identifier for where the warning occurred
 * @param message - The warning message
 */
export function logWarning(context: string, message: string): void {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] [${context}] ${message}`);
}

/**
 * Log an info message with context.
 * @param context - Identifier for where the log occurred
 * @param message - The info message
 */
export function logInfo(context: string, message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${context}] ${message}`);
}
