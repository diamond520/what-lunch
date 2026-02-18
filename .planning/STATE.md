# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Quickly answer "what should we eat for lunch?" with a random, budget-aware recommendation from nearby restaurants
**Current focus:** Phase 4 - Restaurant Management

## Current Position

Phase: 3 of 5 (Recommendation Algorithm) - COMPLETE
Plan: 3 of 3 in phase 03-recommendation-algorithm (03-01, 03-02, 03-03 all complete)
Status: Phase 3 complete — ready to begin Phase 4
Last activity: 2026-02-18 — Completed 03-03-PLAN.md (rerollSlot TDD, 22 tests passing)

Progress: [███████░░░] ~70%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: ~2 min
- Total execution time: ~12 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2 completed | 6 min | 3 min |
| 02-app-shell | 2 completed | ~3 min | ~1.5 min |
| 03-recommendation-algorithm | 3 of 3 completed | ~6 min | ~2 min |

**Recent Trend:**
- Last 5 plans: <1 min (02-01), ~2 min (02-02), ~2 min (03-01), ~2 min (03-02), ~2 min (03-03)
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

### Pending Todos

None.

### Blockers/Concerns

- GitHub auth not configured — needed for Phase 5 Vercel deployment

## Session Continuity

Last session: 2026-02-18
Stopped at: Completed 03-03-PLAN.md — rerollSlot TDD complete, 22 tests passing, Phase 3 done
Resume file: None
