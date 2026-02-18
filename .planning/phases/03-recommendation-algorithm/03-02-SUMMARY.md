---
phase: "03"
plan: "02"
subsystem: recommendation-algorithm
tags: [vitest, tdd, algorithm, budget, cuisine-diversity]

dependency-graph:
  requires:
    - "03-01: Vitest installed with path alias support"
    - "01-02: Restaurant types and DEFAULT_RESTAURANTS defined"
  provides:
    - "generateWeeklyPlan function in src/lib/recommend.ts"
    - "WeeklyPlan interface"
    - "14 passing tests covering budget, cuisine diversity, edge cases"
  affects:
    - "03-03: UI integration will consume generateWeeklyPlan and WeeklyPlan"

tech-stack:
  added: []
  patterns:
    - "TDD Red-Green cycle"
    - "Tiered fallback strategy for constraint satisfaction"
    - "Future-slot budget reservation to prevent greedy overrun"

key-files:
  created:
    - "__tests__/recommend.test.ts"
    - "src/lib/recommend.ts"
  modified: []

decisions:
  - id: "future-slot-reserve"
    choice: "Reserve cheapestPrice * futureSlots from remainingBudget before picking"
    rationale: "Greedy selection without reservation paints later slots into corners where no affordable restaurant exists, causing total cost to exceed weekly budget"
    alternatives: ["Backtracking search", "Pre-compute valid sequences", "Accept budget violations as graceful fallback"]

metrics:
  duration: "~2 minutes"
  completed: "2026-02-18"
---

# Phase 3 Plan 02: TDD generateWeeklyPlan Summary

**One-liner:** Weekly plan generator with future-slot budget reservation and 4-tier cuisine/budget fallback, fully TDD'd with 14 tests across budget, diversity, and edge cases.

## What Was Done

Implemented `generateWeeklyPlan` in `src/lib/recommend.ts` using a TDD Red-Green cycle:

1. **RED** — Created `__tests__/recommend.test.ts` with 14 test cases and a stub that always throws. 13 tests failed (1 passed: `throws on empty pool`).

2. **GREEN (first attempt)** — Implemented the algorithm with a simple 3-tier fallback. 2 tests failed: the budget constraint was violated when the greedy picker didn't reserve budget for future slots.

3. **Bug fix (Rule 1)** — The original implementation selected any affordable restaurant per slot, but didn't account for the fact that later slots also need affordable options. Fixed by computing `spendableNow = remainingBudget - (futureSlots * cheapestPrice)` before each pick, and upgrading to a 4-tier fallback:
   - **Tier 1 (eligible):** fits `spendableNow` AND no cuisine violation
   - **Tier 2 (affordable):** fits `spendableNow`, cuisine constraint relaxed
   - **Tier 3 (fits budget):** fits raw `remainingBudget` (impossible total budget scenario)
   - **Tier 4 (global cheapest):** truly impossible — minimise damage

4. **All 14 tests pass.** Build exits 0.

## Test Coverage

| Category | Tests |
|---|---|
| Basic contract | returns 5 days, records weeklyBudget |
| Budget constraint | single run, 100-iteration statistical |
| Cuisine diversity | single run, 100-iteration statistical |
| Edge cases | generous budget 2000, minimum 325, impossible 50, below-min 100 |
| Pool edge cases | single restaurant, all same cuisine, empty pool |
| Non-determinism | 20 runs produce >1 unique first pick |

## Commits

| Hash | Message |
|---|---|
| `de0ac9a` | test(03-02): RED — add generateWeeklyPlan tests (all failing) |
| `fa856d3` | feat(03-02): GREEN — implement generateWeeklyPlan with budget + cuisine constraints |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Budget constraint violated by greedy slot selection without future reservation**

- **Found during:** GREEN phase — 2 of 14 tests failing (`handles minimum satisfiable budget (325)` and `budget constraint holds over 100 iterations`)
- **Issue:** The original `pickForSlot` used `remainingBudget` directly as the affordability cap. When slot 1 picked a 120 TWD restaurant leaving only 205 for 4 remaining slots, but a later slot had no cuisine-eligible option under 65 TWD, Fallback 2 selected globally cheapest regardless of budget. This caused `totalCost > weeklyBudget`.
- **Fix:** Introduced `spendableNow = remainingBudget - (futureSlots * cheapestPrice(pool))`. Each slot only spends what can be afforded while still leaving enough for all remaining slots at minimum price.
- **Files modified:** `src/lib/recommend.ts`
- **Commit:** `fa856d3` (incorporated into GREEN commit)

## Next Phase Readiness

- `generateWeeklyPlan` and `WeeklyPlan` are exported and ready for UI consumption in 03-03
- No blockers
