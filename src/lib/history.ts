// lib/history.ts
// Pure functions and types for lunch history tracking.
// No React imports — this module is safe to use in any context.

export interface LunchHistoryEntry {
  id: string            // crypto.randomUUID()
  date: string          // YYYY-MM-DD local date (not UTC)
  restaurantId: string
  restaurantName: string  // denormalized — survives restaurant deletion
}

export const HISTORY_STORAGE_KEY = 'what-lunch-history'
export const LOOKBACK_STORAGE_KEY = 'what-lunch-history-lookback'
export const MAX_HISTORY_ENTRIES = 100
export const DEFAULT_LOOKBACK_DAYS = 5

// SSR-safe localStorage read for history entries
export function readStoredHistory(): LunchHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// SSR-safe localStorage read for lookback setting
export function readStoredLookback(): number {
  if (typeof window === 'undefined') return DEFAULT_LOOKBACK_DAYS
  try {
    const stored = localStorage.getItem(LOOKBACK_STORAGE_KEY)
    const n = stored ? parseInt(stored, 10) : NaN
    return isNaN(n) || n < 1 ? DEFAULT_LOOKBACK_DAYS : n
  } catch {
    return DEFAULT_LOOKBACK_DAYS
  }
}

// Compute a cutoff date that is lookbackDays business days before today (local date).
// Business days = Mon–Fri; Sat(6) and Sun(0) are skipped when counting backwards.
// Returns Set<string> of restaurantIds visited on or after the cutoff.
export function getRecentlyVisitedIds(
  entries: LunchHistoryEntry[],
  lookbackDays: number,
): Set<string> {
  // Use 'sv' locale for ISO-8601 date strings (YYYY-MM-DD) without UTC offset issues
  const todayStr = new Date().toLocaleDateString('sv')

  // Walk backwards day by day, counting only business days until we reach lookbackDays
  const cursor = new Date(todayStr)
  let businessDaysCounted = 0

  while (businessDaysCounted < lookbackDays) {
    cursor.setDate(cursor.getDate() - 1)
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) {
      businessDaysCounted++
    }
  }

  const cutoffDate = cursor.toLocaleDateString('sv')

  // Collect restaurantIds from entries on or after the cutoff date
  const recentIds = new Set<string>()
  for (const entry of entries) {
    if (entry.date >= cutoffDate) {
      recentIds.add(entry.restaurantId)
    }
  }

  return recentIds
}

// Split pool into primary (unvisited recently) and fallback (full pool).
// Callers should use fallback when primary is empty.
export function splitPoolByHistory<T extends { id: string }>(
  pool: T[],
  recentIds: Set<string>,
): { primary: T[]; fallback: T[] } {
  const primary = pool.filter((r) => !recentIds.has(r.id))
  return { primary, fallback: pool }
}
