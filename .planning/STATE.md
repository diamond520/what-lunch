# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Quickly answer "what should we eat for lunch?" with a random, budget-aware recommendation from nearby restaurants
**Current focus:** Phase 6 - Weekend Recommendation

## Current Position

Phase: 6 of 6 (Weekend Recommendation)
Plan: 1 of ? in phase 06-weekend-recommendation
Status: In progress
Last activity: 2026-02-18 — Completed 06-01-PLAN.md (weekend data foundation)
Note: Phase 5 Plan 02 (deployment) still blocked on Vercel auth

Progress: [█████████░] ~92%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: ~2 min
- Total execution time: ~16 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2 completed | 6 min | 3 min |
| 02-app-shell | 2 completed | ~3 min | ~1.5 min |
| 03-recommendation-algorithm | 3 of 3 completed | ~6 min | ~2 min |
| 04-restaurant-management | 2 of 2 completed | ~3.5 min | ~1.75 min |
| 05-picker-page-and-deployment | 1 of 2 completed | ~1 min | ~1 min |
| 06-weekend-recommendation | 1 completed | ~2 min | ~2 min |

**Recent Trend:**
- Last 5 plans: ~1.5 min (04-01), ~2 min (04-02), ~1 min (05-01), ~2 min (06-01)
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

### Roadmap Evolution

- Phase 6 added: Weekend Recommendation — independent weekend restaurant list, random pick page, tab switching in restaurant management

### Pending Todos

None.

### Blockers/Concerns

- Vercel CLI not authenticated — run `npx vercel login` then `npx vercel --prod` to deploy
- Alternative: push to GitHub (`git push origin master`) and connect repo in Vercel dashboard

## Session Continuity

Last session: 2026-02-18T15:53:44Z
Stopped at: Completed 06-01-PLAN.md — weekend data foundation (context, defaults, pickRandomRestaurant, Tabs)
Resume file: None
