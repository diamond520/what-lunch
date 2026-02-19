---
phase: 09-lunch-history
plan: "02"
subsystem: ui
tags: [react, localStorage, history, pool-split, navigation, client-component]

# Dependency graph
requires:
  - phase: 09-lunch-history
    provides: history.ts types/functions and HistoryContext/useHistory hook
  - phase: 02-app-shell
    provides: layout.tsx provider nesting pattern, nav-links.tsx NAV_ITEMS pattern
  - phase: 08-cuisine-filter
    provides: filteredPool, applyFilter, relaxDiversity in picker page
provides:
  - HistoryProvider wired into layout.tsx wrapping RestaurantProvider
  - /history nav link in nav-links.tsx
  - /history page with entries list, remove/clear controls, lookback setting
  - Confirm plan button on picker page saving 5 LunchHistoryEntry records
  - History-aware pool split (effectivePool) in picker page generate and reroll
affects: [09-03-PLAN.md]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - effectivePool pattern: filteredPool -> splitPoolByHistory -> primary/fallback
    - Dual hydration guard: ready = isHydrated && historyHydrated
    - handleConfirmPlan bulk entry creation with crypto.randomUUID()

key-files:
  created:
    - src/app/history/page.tsx
  modified:
    - src/app/layout.tsx
    - src/components/layout/nav-links.tsx
    - src/app/page.tsx

key-decisions:
  - "HistoryProvider wraps RestaurantProvider (outside) — both picker and history pages need history, no dependency on RestaurantProvider"
  - "Renamed local history/setHistory to planHistory/setPlanHistory — avoids shadowing with persistent lunch history entries"
  - "effectivePool = primary.length > 0 ? primary : fallback — falls back to full filtered pool when all restaurants recently visited"
  - "handleConfirmPlan uses new Date().toLocaleDateString('sv') for YYYY-MM-DD — consistent with history.ts pattern"
  - "History page groups entries by date descending — better readability than flat list"
  - "Lookback input clamps NaN to 1 — prevents invalid state"

patterns-established:
  - "Dual provider hydration: when page depends on two context providers, combine isHydrated flags"
  - "Entries grouped by date with Map<string, entries[]> for chronological display"

requirements-completed: [HIST-01, HIST-02, HIST-03, HIST-04]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 9 Plan 02: Wire History into App Summary

**HistoryProvider in layout, confirm-plan button saving 5-day picks to localStorage, history-aware pool split deprioritizing recent restaurants, and /history management page with remove/clear/lookback controls**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T02:01:25Z
- **Completed:** 2026-02-19T02:03:47Z
- **Tasks:** 2 auto + 1 checkpoint (auto-approved)
- **Files modified:** 4

## Accomplishments
- HistoryProvider wraps RestaurantProvider in layout.tsx, making useHistory() available to all pages
- /history page shows entries grouped by date with remove/clear controls and lookback days setting
- Picker page confirm button saves 5 LunchHistoryEntry records to localStorage via addEntries
- Generate and reroll both use effectivePool (history-aware filtered pool with fallback)
- Nav bar shows '午餐歷史' link navigating to /history
- Full build passes cleanly with zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire HistoryProvider into layout and add /history nav link** - `7b6d8ec` (feat)
2. **Task 2: Wire confirm button and history-aware pool split into picker page** - `b50f68d` (feat)
3. **Task 3: Checkpoint human-verify** - auto-approved

## Files Created/Modified
- `src/app/layout.tsx` - Added HistoryProvider import and wrapping around RestaurantProvider
- `src/components/layout/nav-links.tsx` - Added /history nav item with label '午餐歷史'
- `src/app/history/page.tsx` - New client component: history page with entries list, remove/clear, lookback setting
- `src/app/page.tsx` - Added useHistory hook, effectivePool computation, handleConfirmPlan, renamed planHistory

## Decisions Made
- HistoryProvider placed outside RestaurantProvider in layout.tsx — both picker and history pages need history, and HistoryProvider has no dependency on RestaurantProvider
- Renamed local `history`/`setHistory` to `planHistory`/`setPlanHistory` in picker page to avoid shadowing the persistent lunch history `entries` from useHistory()
- `effectivePool` computed as `primary.length > 0 ? primary : fallback` — gracefully falls back to full filtered pool when all restaurants were recently visited
- History page groups entries by date (descending) using a Map for better readability
- Confirm button placed below the 5-day grid with helper text explaining its effect
- Lookback input uses `isNaN(v) ? 1 : v` to clamp invalid input

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- History system fully wired and functional end-to-end
- Ready for 09-03 (unit tests for history functions)
- All history CRUD operations working via UI: confirm plan, view entries, remove individual, clear all, adjust lookback

## Self-Check: PASSED

- FOUND: src/app/history/page.tsx (created)
- FOUND: src/app/layout.tsx (modified)
- FOUND: src/components/layout/nav-links.tsx (modified)
- FOUND: src/app/page.tsx (modified)
- FOUND: commit 7b6d8ec (Task 1)
- FOUND: commit b50f68d (Task 2)
- BUILD: npm run build passed with zero errors

---
*Phase: 09-lunch-history*
*Completed: 2026-02-19*
