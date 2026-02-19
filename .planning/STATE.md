# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Quickly answer "what should we eat for lunch?" with a random, budget-aware recommendation from nearby restaurants
**Current focus:** Phase 11 - Wheel Animation (complete, 2 of 2 plans done)

## Current Position

Phase: 11 of 11 (Wheel Animation)
Plan: 2 of 2 in phase 11-wheel-animation
Status: Complete — all 11 phases done, 20 of 20 plans complete
Last activity: 2026-02-19 — Completed 11-02-PLAN.md (weekday multi-slot animation)

Progress: [████████████] 100% (20 plans complete of 20 planned)

## Performance Metrics

**Velocity:**
- Total plans completed: 20 fully
- Average duration: ~2 min
- Total execution time: ~34 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2 completed | 6 min | 3 min |
| 02-app-shell | 2 completed | ~3 min | ~1.5 min |
| 03-recommendation-algorithm | 3 of 3 completed | ~6 min | ~2 min |
| 04-restaurant-management | 2 of 2 completed | ~3.5 min | ~1.75 min |
| 05-picker-page-and-deployment | 1 of 2 completed | ~1 min | ~1 min |
| 06-weekend-recommendation | 3 of 3 completed | ~5 min | ~1.7 min |
| 07-dark-mode | 1 completed | ~2 min | ~2 min |
| 08-cuisine-filter | 2 of 2 completed | 28 min | 14 min |
| 09-lunch-history | 3 of 3 completed | 5 min | ~1.7 min |
| 10-share-plan | 1 of 1 completed | 2 min | 2 min |
| 11-wheel-animation | 2 of 2 completed | 6 min | 3 min |

**Recent Trend:**
- Last 5 plans: ~2 min (09-02), ~2 min (09-03), ~2 min (10-01), ~3 min (11-01), ~3 min (11-02)
- Trend: Stable and fast

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Next.js over Vue 3: User preference, better Vercel integration
- No database: Keep it simple, data is static defaults
- Full rewrite over migration: Old codebase has tech debt, clean start is faster
- New UI design: Old Element UI look is dated, fresh start
- App Router (not Pages Router): Used create-next-app --app flag per plan
- src/app/ layout: create-next-app places App Router files under src/app/ by default
- shadcn/ui new-york style: Selected via --defaults flag
- Tailwind v4 + shadcn/ui v3: Verified compatible — shadcn init auto-detects Tailwind v4
- `as const satisfies Record<>` for CUISINE_META: derives CuisineType union from keys while validating entry shape
- `satisfies Restaurant[]` not `: Restaurant[]`: preserves literal type narrowing
- Cuisine labels/colors defined once only in CUISINE_META: no other file repeats them
- Header is Server Component, NavLinks is Client Component: minimises client bundle
- `usePathname() ?? '/'` fallback: prevents null reference during SSR hydration edge cases
- layout.tsx stays Server Component: importing Header (also server) requires no client directive
- vitest.config.mts (not .ts): avoids ts-node/esm loader edge cases with Vitest
- environment: node for tests: recommendation algorithm is pure logic, no DOM needed
- vite-tsconfig-paths plugin: reads existing tsconfig.json paths, no duplication
- Future-slot budget reservation: each slot reserves cheapestPrice * futureSlots to prevent greedy overrun
- hasCuisineViolation checks backward/forward/bridge: forward/bridge checks are no-ops during generateWeeklyPlan (next slots undefined), zero risk to existing behavior
- pickForSlotReroll is separate from pickForSlot: reroll only needs remaining budget (no future-slot reserve)
- rerollSlot remaining = weeklyBudget - othersCost: guarantees totalCost <= weeklyBudget after reroll
- React 19 context: <Context value={...}> not <Context.Provider value={...}>
- RestaurantProvider wraps <main> only, Header stays outside (has no restaurant data needs)
- layout.tsx remains Server Component — importing Client Component provider is valid in App Router
- value={price ?? ''} pattern: avoids React uncontrolled->controlled warning when numeric state resets to null after form clear
- Cuisine badge uses inline style={{ backgroundColor }} from CUISINE_META: Tailwind cannot generate dynamic class names from runtime values
- Object.entries(CUISINE_META) cast to [CuisineType, ...][] needed because Object.entries returns string keys
- Clear plan on budget change (setPlan(null) in onChange): prevents stale plan showing with new budget
- Guard handlers against empty pool, NaN budget, and null plan before calling algorithm
- key={i} for 5-day fixed-length non-reorderable list: no stable ID needed
- wknd- prefix IDs for weekend restaurants: prevents collision with weekday IDs
- Separate WEEKEND_STORAGE_KEY ('what-lunch-weekend-restaurants'): fully independent persistence from weekday list
- readStoredRestaurantsFromKey generic helper: parameterizes key+defaults, eliminates duplication for multi-list localStorage
- pickRandomRestaurant throws on empty pool: fail-fast caller safety
- RestaurantListPanel defined in same file as RestaurantsPage: simpler, only used in one place
- showSaveToConfig prop gates save-to-config UI in shared panel: weekend tab always gets false
- defaultNames computed from defaultRestaurants prop (not hardcoded): both panels detect defaults correctly
- Re-roll logic lives in /weekend page component, not pickRandomRestaurant: keeps algorithm pure
- vitest.config.mts environment: jsdom globally — no file-level @vitest-environment comment needed in .tsx test files
- CuisineType uses 'tai' not 'thai' — caught by tsc --noEmit in test data
- ThemeProvider wraps both Header and RestaurantProvider/main: ThemeToggle inside Header calls useTheme() which needs provider above it
- attribute='class' in ThemeProvider: aligns with existing @custom-variant dark (&:is(.dark *)) — no CSS changes needed
- mounted guard in ThemeToggle: useTheme() returns undefined on server; guard prevents hydration mismatch
- suppressHydrationWarning on html element: next-themes modifies class attribute client-side
- relaxDiversity uses early-return in hasCuisineViolation (if relaxDiversity return false) rather than conditional branches throughout
- generateWeeklyPlan/rerollSlot accept options object ({ relaxDiversity?: boolean }) for forward-compatible extensibility
- applyFilter with empty selected array returns pool unchanged in both modes — no-op semantics match UI use case where unselected means "all allowed"
- Cuisine filter selections preserved when switching 排除/鎖定 mode — user may want to compare behavior without re-selecting
- Plan auto-clears on any filter change — consistent with existing budget-change behavior (setHistory([]))
- Generate button disabled when filteredPool.length === 0 (in addition to restaurants.length === 0)
- relaxDiversity only true in lock mode with exactly 1 cuisine type selected — single-cuisine lock makes diversity constraint impossible to satisfy
- readStoredFilter() called only in useState lazy initializer — avoids repeated localStorage reads on re-render
- getRecentlyVisitedIds uses new Date().toLocaleDateString('sv') for YYYY-MM-DD local date — avoids UTC offset issues
- Business day lookback walks backwards day-by-day skipping Sat(6)/Sun(0) — simple correct algorithm
- splitPoolByHistory fallback is always full pool — callers decide when primary is empty
- addEntries accepts array (not single): enables bulk add when confirming 5-day weekly plan
- setLookbackDays clamps to min 1 in HistoryProvider — prevents degenerate 0-day lookback
- lookbackDays persisted as String(n) in localStorage (not JSON) — simpler for single integer
- Weekend entries within date range ARE counted as recent visits — cutoff is date-based via >= comparison, not business-day-based for entry filtering
- HistoryProvider wraps RestaurantProvider (outside) — both picker and history pages need history, no dependency on RestaurantProvider
- Renamed local history/setHistory to planHistory/setPlanHistory in picker page — avoids shadowing persistent lunch history entries
- effectivePool = primary.length > 0 ? primary : fallback — falls back to full filtered pool when all recently visited
- handleConfirmPlan uses crypto.randomUUID() and new Date().toLocaleDateString('sv') for consistent YYYY-MM-DD date format
- History page groups entries by date descending using Map<string, entries[]>
- Toaster placed as last child inside ThemeProvider: inherits active theme for dark-mode-aware toasts
- Full-width vertical bar (U+FF5C) separators in copied plan text: readable in LINE/Slack without markdown artifacts
- navigator.clipboard guard before writeText: handles insecure contexts gracefully with toast.error fallback
- useRef for intervalRef/timeoutRef/prevFinalRef in useSlotAnimation: avoids stale closure bugs with clearInterval/clearTimeout
- stopAnimation accepts optional settledValue parameter: single helper for both cleanup-only and settle-with-value cases
- fireEvent instead of userEvent in animation tests: userEvent with fake timers causes timeout hangs due to internal pointer event delays
- useEffect deps [finalValue] only with eslint-disable: candidates/options are stable parent refs, not re-animation triggers
- Inline timer state (not useSlotAnimation hook) for weekday page: hooks cannot be called in a loop per Rules of Hooks
- fireEvent instead of userEvent in integration tests: userEvent with fake timers causes timeout hangs (same finding as 11-01)
- HistoryProvider wraps RestaurantProvider in renderHomePage(): matches layout.tsx nesting order

### Roadmap Evolution

- Phase 6 added: Weekend Recommendation — independent weekend restaurant list, random pick page, tab switching in restaurant management
- Phase 7 added: Dark Mode — theme toggle with system preference detection
- Phase 8 added: Cuisine Filter — exclude or lock cuisine types when generating plans
- Phase 9 added: Lunch History — track picks, avoid recent repeats
- Phase 10 added: Share Plan — copy formatted plan text to clipboard
- Phase 11 added: Wheel Animation — spinning wheel for restaurant picks

### Pending Todos

None.

### Blockers/Concerns

None.

### Backlog

- Phase 5 Plan 02: Vercel deployment — `npx vercel login` then `npx vercel --prod`, or connect repo in Vercel dashboard

## Session Continuity

Last session: 2026-02-19T02:22:03Z
Stopped at: Completed 11-02-PLAN.md (weekday multi-slot animation) — ALL PHASES COMPLETE
Resume file: None
