/**
 * Health Check Utility Functions
 *
 * Pure utility functions for health checks.
 * No dependencies on services or external state.
 */

/**
 * Returns the current client timestamp in ISO 8601 format.
 * Used for health check response timestamps.
 */
export function getClientTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Wraps an async function and returns 'ok' on success or 'error' on failure.
 * Never throws - always returns a safe result.
 *
 * @param fn - Async function to execute
 * @returns 'ok' if fn resolves successfully, 'error' otherwise
 */
export async function safeAsyncCheck<T>(fn: () => Promise<T>): Promise<'ok' | 'error'> {
  try {
    await fn();
    return 'ok';
  } catch {
    return 'error';
  }
}








