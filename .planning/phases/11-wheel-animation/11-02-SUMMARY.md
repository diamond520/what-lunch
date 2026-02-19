---
phase: 11-wheel-animation
plan: 02
subsystem: ui
tags: [react, animation, setInterval, setTimeout, fake-timers, vitest, integration-tests]

# Dependency graph
requires:
  - phase: 11-wheel-animation
    provides: Weekend slot animation hook (useSlotAnimation) and pattern for timer-based animation
provides:
  - Weekday page with 5-slot simultaneous animation on generate
  - Single-slot reroll animation on weekday page
  - Integration tests fixed with HistoryProvider wrapper and fake timers
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [inline multi-slot animation with useRef timer IDs, fireEvent + vi.useFakeTimers for integration tests with animations]

key-files:
  created: []
  modified:
    - src/app/page.tsx
    - __tests__/integration.test.tsx

key-decisions:
  - "Inline timer state (not useSlotAnimation hook) for weekday page — hooks cannot be called in a loop per Rules of Hooks"
  - "fireEvent instead of userEvent in integration tests — userEvent with fake timers causes timeout hangs (same finding as 11-01)"
  - "HistoryProvider wraps RestaurantProvider in renderHomePage() — matches layout.tsx nesting order"

patterns-established:
  - "Inline multi-slot animation: useRef for interval/timeout IDs, separate gen/reroll timer pairs, allRestaurantNames memo for cycling display"
  - "Integration test fake timer pattern: vi.useFakeTimers() + fireEvent.click + act(vi.advanceTimersByTime(3000)) + afterEach(vi.useRealTimers)"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 11 Plan 02: Weekday Multi-Slot Animation Summary

**5-slot simultaneous animation on weekday generate, per-slot reroll animation, skip via keypress/click, integration tests fixed with HistoryProvider and fake timers**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T02:18:45Z
- **Completed:** 2026-02-19T02:22:03Z
- **Tasks:** 2 (+ 1 auto-approved checkpoint)
- **Files modified:** 2

## Accomplishments
- Weekday page animates all 5 day slots simultaneously on "generate plan" with independently cycling restaurant names for ~2.5s
- Single-slot reroll animation cycles only the affected slot while others remain settled
- Skip animation via Space/Enter/Escape keypress or clicking the animating card
- All buttons disabled during animation; skeleton placeholders for cuisine/price/distance during cycling
- Fixed all 4 pre-existing integration test failures by adding HistoryProvider wrapper to renderHomePage()
- All 81 tests pass, TypeScript clean, production build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Add inline multi-slot animation to weekday page** - `72e9787` (feat)
2. **Task 2: Update integration tests with fake timers and HistoryProvider** - `16bfb8f` (feat)

## Files Created/Modified
- `src/app/page.tsx` - Weekday page with 5-slot animation on generate, single-slot on reroll, skip interactions, skeleton placeholders, disabled buttons during animation
- `__tests__/integration.test.tsx` - Added HistoryProvider wrapper, fake timers with fireEvent for all 4 HomePage tests, afterEach cleanup

## Decisions Made
- Used inline timer state (useRef for genIntervalRef/genTimeoutRef/rerollIntervalRef/rerollTimeoutRef) instead of the useSlotAnimation hook because hooks cannot be called in a loop (Rules of Hooks constraint with 5 concurrent slots)
- Used fireEvent.click instead of userEvent.setup({ advanceTimers }) in integration tests -- same timeout issue discovered in 11-01 (userEvent's internal pointer event delays conflict with fake timers)
- Added HistoryProvider wrapping RestaurantProvider in renderHomePage() matching the layout.tsx nesting order (HistoryProvider > RestaurantProvider > children)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Changed userEvent to fireEvent in integration tests**
- **Found during:** Task 2 (Update integration tests)
- **Issue:** Plan specified `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` but this pattern was proven to cause timeout hangs in 11-01 (userEvent's internal pointer event delays conflict with fake timers)
- **Fix:** Used synchronous `fireEvent.click()` for all animation-triggering button clicks, which works correctly with fake timers
- **Files modified:** `__tests__/integration.test.tsx`
- **Verification:** All 7 integration tests pass with no timeouts
- **Committed in:** `16bfb8f` (Task 2 commit)

**2. [Rule 1 - Bug] Added HistoryProvider to renderHomePage() wrapper**
- **Found during:** Task 2 (Update integration tests) -- known pre-existing issue
- **Issue:** HomePage calls `useHistory()` which requires HistoryProvider, but renderHomePage() only wrapped with RestaurantProvider. This was introduced when Phase 9 added useHistory to HomePage without updating integration tests.
- **Fix:** Added HistoryProvider wrapping RestaurantProvider in renderHomePage(), matching layout.tsx nesting order
- **Files modified:** `__tests__/integration.test.tsx`
- **Verification:** All 4 previously failing HomePage tests now pass
- **Committed in:** `16bfb8f` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bug fixes)
**Impact on plan:** Both fixes essential for test correctness. No scope creep.

## Issues Encountered
None beyond the documented deviations.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 11 (Wheel Animation) is fully complete
- Both weekend and weekday pages have slot-machine animation
- All 81 tests pass across 7 test files
- Production build succeeds

## Self-Check: PASSED

- FOUND: src/app/page.tsx
- FOUND: __tests__/integration.test.tsx
- FOUND: .planning/phases/11-wheel-animation/11-02-SUMMARY.md
- FOUND: commit 72e9787 (Task 1)
- FOUND: commit 16bfb8f (Task 2)

---
*Phase: 11-wheel-animation*
*Completed: 2026-02-19*
