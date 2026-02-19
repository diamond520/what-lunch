---
phase: 09-lunch-history
plan: "03"
subsystem: testing
tags: [vitest, tdd, fake-timers, business-day, history, unit-test]

# Dependency graph
requires:
  - phase: 09-lunch-history
    provides: getRecentlyVisitedIds and splitPoolByHistory pure functions in history.ts
provides:
  - Comprehensive unit tests for getRecentlyVisitedIds (8 tests) covering business day calculation, weekend skipping, boundary conditions
  - Comprehensive unit tests for splitPoolByHistory (5 tests) covering empty, full, partial, non-mutation, duck typing
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - vi.useFakeTimers + vi.setSystemTime for deterministic date testing
    - makeEntry helper factory for LunchHistoryEntry test data

key-files:
  created:
    - __tests__/history.test.ts
  modified: []

key-decisions:
  - "Weekend entries within date range are counted as recent visits -- cutoff is date-based, not business-day-based for entry filtering"
  - "Fixed plan's Saturday entry test expectation: entry on Sat 2026-02-14 IS recent when cutoff is Fri 2026-02-13 (date comparison is >=)"

patterns-established:
  - "Use vi.useFakeTimers/setSystemTime for any test involving Date -- ensures deterministic results regardless of execution day"
  - "makeEntry helper pattern: factory function with sensible defaults for test data creation"

requirements-completed: [HIST-03]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 9 Plan 03: History Unit Tests Summary

**13 unit tests for business day lookback (getRecentlyVisitedIds) and pool-split (splitPoolByHistory) using Vitest fake timers anchored to Thursday 2026-02-19**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T02:01:23Z
- **Completed:** 2026-02-19T02:03:11Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- 8 tests for getRecentlyVisitedIds: empty entries, today inclusion, boundary inclusive (5 business days back), cutoff exclusion, weekend skipping from Monday, multiple entries, deduplication, lookback=1 window
- 5 tests for splitPoolByHistory: empty recentIds returns full pool, all recent returns empty primary, partial filtering, non-mutation guarantee, duck typing with Restaurant-shaped objects
- All 13 tests pass on first run -- implementation from plan 09-01 was correct
- Fixed one test expectation from plan: Saturday entry within date range correctly treated as recent visit (not excluded)

## Task Commits

Each task was committed atomically:

1. **Task 1: RED -- Write tests for getRecentlyVisitedIds and splitPoolByHistory** - `9c04369` (test)

## Files Created/Modified
- `__tests__/history.test.ts` - 13 unit tests covering business day lookback calculation and pool-split filtering

## Decisions Made
- Weekend entries within the date range ARE counted as recent visits: the function computes a cutoff date via business day counting, then uses simple `>=` date comparison. An entry on Saturday after the cutoff is correctly "recent" (you ate there recently, avoid it).
- Adjusted the plan's test expectation for Saturday 2026-02-14 from `false` to `true`: when lookback=1 from Monday 2026-02-16, cutoff is Friday 2026-02-13, and Saturday >= Friday so the entry is recent.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect Saturday entry test expectation**
- **Found during:** Task 1 (writing tests)
- **Issue:** Plan expected `result2.has('r5')` to be `false` for a Saturday 2026-02-14 entry with lookback=1 from Monday 2026-02-16. But the cutoff date is Friday 2026-02-13, and Saturday >= Friday, so the entry IS within the window.
- **Fix:** Changed expectation to `true` and added explanatory comment
- **Files modified:** `__tests__/history.test.ts`
- **Verification:** Test passes, behavior is correct (weekend visits should count as recent)
- **Committed in:** `9c04369`

---

**Total deviations:** 1 auto-fixed (1 bug in test expectation)
**Impact on plan:** Test expectation corrected to match actual correct behavior. No scope creep.

## Issues Encountered

Pre-existing failures in `__tests__/integration.test.tsx` (4 tests) caused by missing HistoryProvider wiring -- this is plan 09-02's scope, not related to this plan's changes.

Pre-existing TypeScript errors in `src/app/page.tsx` for the same reason (useHistory references without HistoryProvider). Not caused by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- History pure functions are now fully tested and regression-protected
- Plan 09-02 (wire HistoryProvider into app) can proceed -- will also fix the pre-existing integration test failures
- Future changes to business day logic or pool-split will be caught by this test suite

## Self-Check: PASSED

- FOUND: `__tests__/history.test.ts`
- FOUND: `.planning/phases/09-lunch-history/09-03-SUMMARY.md`
- FOUND: commit `9c04369`

---
*Phase: 09-lunch-history*
*Completed: 2026-02-19*
