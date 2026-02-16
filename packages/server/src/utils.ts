/**
 * Shared utility functions for route handlers.
 */

/**
 * Parse a string query parameter as an integer, clamped to [min, max].
 * Returns the fallback if the value is missing or not a valid integer.
 */
export function clampInt(
  value: string | undefined,
  min: number,
  max: number,
  fallback: number
): number {
  const parsed = parseInt(value || '', 10);
  return Math.min(Math.max(Number.isNaN(parsed) ? fallback : parsed, min), max);
}
