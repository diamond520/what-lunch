---
phase: 09-lunch-history
plan: "01"
subsystem: data
tags: [localStorage, react-context, typescript, business-day, history]

# Dependency graph
requires:
  - phase: 02-app-shell
    provides: RestaurantContext pattern used for HistoryContext
provides:
  - LunchHistoryEntry type with id, date, restaurantId, restaurantName
  - readStoredHistory and readStoredLookback SSR-safe localStorage helpers
  - getRecentlyVisitedIds: N business day lookback with local date strings
  - splitPoolByHistory generic: primary (unvisited) + fallback (full pool)
  - HistoryContext, HistoryProvider, useHistory hook
affects: [09-02-PLAN.md, 09-03-PLAN.md]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useSyncExternalStore hydration guard (same as RestaurantContext)
    - Lazy initializer for useState with localStorage SSR-safe readers
    - React 19 context syntax without .Provider

key-files:
  created:
    - src/lib/history.ts
    - src/lib/history-context.tsx
  modified: []

key-decisions:
  - "getRecentlyVisitedIds uses new Date().toLocaleDateString('sv') for YYYY-MM-DD local date — avoids UTC offset issues"
  - "Business day calculation walks backwards day-by-day, skipping Sat(6)/Sun(0) — simple and correct"
  - "splitPoolByHistory fallback is always full pool — callers decide when primary is empty"
  - "addEntries accepts array (not single) — enables bulk add when confirming 5-day weekly plan"
  - "setLookbackDays clamps to min 1 in provider — prevents degenerate 0-day lookback"
  - "lookbackDays persisted as String in localStorage (not JSON) — simpler than JSON for a single integer"

patterns-established:
  - "Pure history.ts: no React imports, usable in any context including tests"
  - "history-context.tsx follows RestaurantContext pattern exactly: useSyncExternalStore, lazy initializers, guarded useEffects"

requirements-completed: [HIST-01, HIST-03, HIST-05]

# Metrics
duration: 1min
completed: 2026-02-19
---

# Phase 9 Plan 01: History Lib and Context Summary

**localStorage-backed lunch history data layer with business day lookback, pool-split algorithm, and React 19 context provider following the established RestaurantContext pattern**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-19T01:56:02Z
- **Completed:** 2026-02-19T01:57:22Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Pure `history.ts` module with all types, constants, SSR-safe localStorage helpers, business day calculation, and generic pool-split — zero React imports
- `getRecentlyVisitedIds` correctly skips weekends when walking backwards N business days, using local date strings to avoid UTC offset issues
- `HistoryProvider` with useSyncExternalStore hydration guard, lazy initializers, guarded useEffect persistence, and all CRUD operations
- React 19 context syntax (`<HistoryContext value={...}>`) consistent with existing RestaurantContext

## Task Commits

Each task was committed atomically:

1. **Task 1: Create history.ts types, localStorage, business day logic, pool-split** - `d6f8024` (feat)
2. **Task 2: Create HistoryContext provider and useHistory hook** - `0be5f8b` (feat)

## Files Created/Modified
- `src/lib/history.ts` - Pure functions: LunchHistoryEntry type, constants, readStoredHistory, readStoredLookback, getRecentlyVisitedIds, splitPoolByHistory
- `src/lib/history-context.tsx` - HistoryContext, HistoryProvider, useHistory hook with React 19 syntax and useSyncExternalStore hydration guard

## Decisions Made
- `getRecentlyVisitedIds` uses `new Date().toLocaleDateString('sv')` for YYYY-MM-DD local date strings — avoids UTC offset issues that affect ISO string slicing
- Business day calculation walks backwards day-by-day, skipping Sat(6)/Sun(0) — simple, correct, no edge cases with month/year boundaries
- `splitPoolByHistory` fallback is always the full pool — callers decide whether to use primary or fall back
- `addEntries` accepts an array to enable bulk-adding when confirming a 5-day weekly plan in one action
- `setLookbackDays` clamps to minimum 1 inside the provider — prevents degenerate 0-day lookback
- `lookbackDays` persisted as `String(n)` not `JSON.stringify(n)` — simpler for a single integer value

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `src/lib/history.ts` ready for unit tests in plan 09-03
- `HistoryProvider` ready to be wired into `layout.tsx` in plan 09-02
- `useHistory()` hook ready for consumption in picker page and history page (plans 09-02)

---
*Phase: 09-lunch-history*
*Completed: 2026-02-19*
