---
phase: 06-weekend-recommendation
plan: 01
subsystem: ui
tags: [react, context, localstorage, shadcn, typescript, vitest]

# Dependency graph
requires:
  - phase: 04-restaurant-management
    provides: RestaurantContext, useRestaurants hook, Restaurant type
  - phase: 03-recommendation-algorithm
    provides: recommend.ts with generateWeeklyPlan and rerollSlot
provides:
  - DEFAULT_WEEKEND_RESTAURANTS (5 entries, wknd- prefix IDs) in restaurants.ts
  - Extended RestaurantContextValue with weekendRestaurants state and 3 weekend CRUD methods
  - Independent localStorage persistence under 'what-lunch-weekend-restaurants'
  - pickRandomRestaurant pure function exported from recommend.ts
  - shadcn Tabs component at src/components/ui/tabs.tsx
affects:
  - 06-weekend-recommendation (plans 02+: tab UI, weekend picker page)

# Tech tracking
tech-stack:
  added: ["@radix-ui/react-tabs (via shadcn Tabs)"]
  patterns:
    - "readStoredRestaurantsFromKey generic helper: parameterizes key+defaults for multi-list localStorage"
    - "Parallel useState + useEffect with same hydration guard for independent persistent lists"
    - "pickRandomRestaurant: pure function with empty-pool guard, no coupling to weekly planner"

key-files:
  created:
    - src/components/ui/tabs.tsx
  modified:
    - src/lib/restaurants.ts
    - src/lib/restaurant-context.tsx
    - src/lib/recommend.ts
    - __tests__/restaurants.test.tsx

key-decisions:
  - "wknd- prefix IDs for weekend restaurants to prevent collision with weekday IDs"
  - "Separate WEEKEND_STORAGE_KEY ('what-lunch-weekend-restaurants') for fully independent persistence"
  - "readStoredRestaurantsFromKey refactor: enables both weekday and weekend lists to share read logic"
  - "pickRandomRestaurant throws on empty pool (not returns undefined): fail-fast for caller safety"

patterns-established:
  - "Generic readStoredRestaurantsFromKey(key, defaults): reusable for any future persistent list"
  - "Weekend CRUD mirrors weekday CRUD exactly: addWeekendRestaurant, removeWeekendRestaurant, updateWeekendRestaurant"

# Metrics
duration: 2min
completed: 2026-02-18
---

# Phase 6 Plan 1: Weekend Foundation Summary

**Extended RestaurantContext with independent weekend restaurant list (localStorage), 5 wknd- prefix defaults, shadcn Tabs component, and pickRandomRestaurant pure function**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T15:51:52Z
- **Completed:** 2026-02-18T15:53:44Z
- **Tasks:** 2
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments
- Installed shadcn Tabs component, ready for tab switching UI in plans 02+
- Added 5 DEFAULT_WEEKEND_RESTAURANTS with wknd- prefix IDs to prevent ID collision with weekday list
- Extended RestaurantContext with parallel weekendRestaurants state, independent localStorage key, hydration guard, and 3 CRUD methods
- Added pickRandomRestaurant pure function that throws on empty pool
- Fixed restaurants.test.tsx mock context to include all new weekend fields — all 44 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Tabs, add weekend defaults, extend RestaurantContext** - `6cb21dd` (feat)
2. **Task 2: Add pickRandomRestaurant, fix test mocks** - `284f5ee` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/ui/tabs.tsx` - shadcn Tabs component (Radix UI), installed via `npx shadcn@latest add tabs`
- `src/lib/restaurants.ts` - Added DEFAULT_WEEKEND_RESTAURANTS (5 weekend Taipei restaurants, wknd- IDs)
- `src/lib/restaurant-context.tsx` - Extended with weekendRestaurants state, WEEKEND_STORAGE_KEY, generic readStoredRestaurantsFromKey, 3 weekend CRUD functions
- `src/lib/recommend.ts` - Added pickRandomRestaurant(pool) exported function
- `__tests__/restaurants.test.tsx` - Updated mock context to include all 4 weekend fields

## Decisions Made
- `wknd-` prefix IDs: ensures zero collision risk if both lists are ever merged or compared
- Separate localStorage key (`what-lunch-weekend-restaurants`): fully independent persistence from weekday list, no coupling
- `readStoredRestaurantsFromKey(key, defaults)` refactor: eliminates duplication, one function serves both lists
- `pickRandomRestaurant` throws on empty pool: fail-fast is safer than returning `undefined`, callers must guard before calling

## Deviations from Plan

None - plan executed exactly as written. The TypeScript error in restaurants.test.tsx after Task 1 was expected and explicitly described in Task 2 as the fix target.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Weekend data foundation is complete: context, defaults, localStorage persistence, CRUD, pickRandomRestaurant
- shadcn Tabs component is ready to use
- All existing tests pass — no regressions
- Plans 02+ can build the tab-switching restaurant management UI and weekend picker page

---
*Phase: 06-weekend-recommendation*
*Completed: 2026-02-18*
