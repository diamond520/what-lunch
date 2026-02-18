# Project Research Summary

**Project:** what-lunch (Vue 2 to Next.js rewrite)
**Domain:** Internal team lunch randomizer / food picker utility
**Researched:** 2026-02-18
**Confidence:** HIGH

## Executive Summary

This is a rewrite of a known, working app — not a greenfield product. The feature set is fully documented from direct code inspection, the bugs are catalogued, and the scope is intentionally narrow: two pages, no backend, no authentication, no external APIs. The recommended approach is a Next.js 15 App Router app with TypeScript, Tailwind CSS, and shadcn/ui, deployed statically to Vercel. Because the entire app is client-side interactive (randomization, form inputs, state mutations), almost all feature code will be Client Components; Server Components handle only the static HTML shell. State management requires no library — React's built-in `useState`/`useReducer` is appropriate for an app with ~20 restaurants and 5 weekly recommendations.

The central challenge is not the rewrite itself but the existing algorithm bugs. The recommendation algorithm has two confirmed dead-code bugs that silently disable budget validation, and two unbounded recursive functions that risk freezing the browser tab. The rewrite is the opportunity to fix all of them. The correct approach is to extract the algorithm into a pure-functions module (`lib/algorithm.ts`), write unit tests that document the intended constraints (budget, cuisine diversity), and then implement to those tests. Porting the Vue code mechanically will carry the bugs into the new codebase.

The secondary risk is the Vue-to-React mental model shift, particularly around App Router's Server/Client Component boundary. Developers from Vue SPAs expect all components to be client-rendered. Next.js defaults to Server Components, which causes runtime errors when `useState` or event handlers are added without `'use client'`. The mitigation is to establish a clear rule early: the static shell (layout, nav) stays as Server Components, and the two interactive page components (`PickerPage`, `RestaurantsPage`) are Client Components. Everything below them inherits the client boundary.

## Key Findings

### Recommended Stack

The stack is Next.js 15 + React 19 (App Router, TypeScript) with Tailwind CSS 4.x for styling and shadcn/ui (built on Radix UI) for accessible components. This replaces Vue 2 + Vuex + Element UI. Forms use React Hook Form + Zod, which directly fixes the type-coercion bugs in the existing Element UI form. No state management library is needed — the app's two isolated pages each manage their own small state with `useState`. Data lives in a typed TypeScript constants file (`lib/restaurants.ts`), replacing the untyped `dishes.json` + Vuex store combination.

**Core technologies:**
- **Next.js 15 (App Router):** Framework — mandated by project, native Vercel SSG, current paradigm
- **React 19 + TypeScript 5:** UI + type safety — catches the type-coercion and string/number bugs that exist in the old codebase
- **Tailwind CSS 4.x:** Styling — replaces SCSS, utility-first, zero runtime overhead; note v4 has breaking changes from v3, verify migration docs
- **shadcn/ui + Radix UI:** Components — replaces Element UI, Tailwind-native, accessible, zero lock-in (components live in your repo)
- **React Hook Form + Zod:** Form validation — fixes existing type-coercion bug; `price: number` and `distance: number` enforced at schema level
- **`crypto.randomUUID()`:** UUID generation — replaces weak `Math.random().toString(36)` in existing code; zero dependency

### Expected Features

This rewrite targets full feature parity with the existing app, with all known bugs fixed. No new features are in scope for the initial rewrite.

**Must have (table stakes):**
- One-click weekly plan recommendation (5 days, Mon–Fri)
- Per-slot re-roll (swap one day without regenerating the full week)
- Weekly budget input and budget-aware recommendation (NT$100–2000)
- Restaurant list view (name, type, price, distance columns)
- Add restaurant (form with name, cuisine type, price, distance)
- Remove restaurant
- Cuisine type color-coded labels (chi, jp, kr, tai, west)
- Result cards showing restaurant name, type tag, price, and distance
- Input validation that enforces numeric types for price and distance

**Should have (differentiators already in app):**
- Cuisine diversity enforcement — no more than 2 consecutive same-type days
- Budget-aware weekly planning (total budget across 5 days, not per-meal cap)
- Sensible hardcoded defaults (19 real Taipei restaurants)
- Cuisine type color coding for at-a-glance weekly variety check

**Defer to post-MVP:**
- Distance-based filtering (distance is informational today — keep it that way)
- Cuisine type filter on restaurant list (19 restaurants is scannable without a filter)
- Persistent state across reloads via `localStorage` (in-memory is acceptable; add if team requests)
- Edit restaurant (add/delete covers current workflow)

### Architecture Approach

The app is a fully static, client-interactive SSG deployment. No server, no database, no runtime data fetching. Two routes: `/` (recommendation picker) and `/restaurants` (restaurant management). Server Components render the static HTML shell; Client Components handle all interaction. The recommendation algorithm is extracted from the component into a pure-functions module (`lib/algorithm.ts`) — this is the critical architectural change that makes the buggy algorithm testable and fixable.

**Major components:**
1. `lib/restaurants.ts` — single source of truth for the `Restaurant` type, `CuisineType` union, labels, colors, and `DEFAULT_RESTAURANTS` array
2. `lib/algorithm.ts` — pure functions: `recommend()`, `swapOne()`, `checkBudget()`, `checkTypeVariety()` — imported only by Client Components
3. `hooks/useRestaurants.ts` — encapsulates restaurant list state (add, delete); the `useReducer` here handles `weekPlan` + `remaining` as atomic state to prevent stale-closure bugs
4. `components/picker/PickerPage.tsx` — Client Component; budget input, trigger recommendation, display weekly plan cards
5. `components/restaurants/RestaurantsPage.tsx` — Client Component; restaurant table, add/delete form

### Critical Pitfalls

1. **Porting the algorithm bugs instead of fixing them** — the `while(kind >= 2 && i >= 4)` budget validation loop never executes and `i =+ 1` is broken. Write the algorithm from a specification, not from the existing code. Add unit tests before implementation.
2. **Unbounded recursive algorithm causing browser freeze** — `nonRepeatSort()` and `checkTotalPrice()` can loop forever if constraints cannot be satisfied. Add `maxIterations` guard (100 attempts), pre-validate that budget can cover the cheapest 5 restaurants, and use Fisher-Yates shuffle.
3. **Dual-state sync bug (recommends + leftDishes)** — updating two separate `useState` calls for related state causes stale closures on rapid re-roll clicks. Use a single `useReducer` that updates `weekPlan` and `remaining` atomically in one dispatch.
4. **Server/Client boundary errors** — `useState`, event handlers, and `crypto.randomUUID()` cannot be used in Server Components. Mark page-level interactive components with `'use client'`. Keep `app/layout.tsx` and `app/page.tsx` as Server Components.
5. **Cuisine type constant duplication** — Vue 2 codebase had type mappings in 3 files. On day one, create `lib/restaurants.ts` as the single source of truth. Never hardcode `'chi'`, `'jp'`, `'kr'`, `'tai'`, or `'west'` strings in components.

## Implications for Roadmap

Based on research, the build order maps directly to the dependency graph: data before algorithm, algorithm before UI, foundational UI before feature pages. The architecture's explicit component dependency chain suggests 5 phases.

### Phase 1: Foundation — Data Model and Algorithm

**Rationale:** Everything else depends on `lib/restaurants.ts` (types, constants, data) and `lib/algorithm.ts` (pure functions). These have no dependencies and can be built and fully tested before any UI exists. Building them first forces a clean specification of algorithm behavior and prevents the bug-porting pitfall.

**Delivers:** Typed `Restaurant` interface, `CuisineType` union, `CUISINE_LABELS`, `CUISINE_COLORS`, `DEFAULT_RESTAURANTS` array, and tested pure algorithm functions (`recommend`, `swapOne`, `checkBudget`, `checkTypeVariety`).

**Addresses:** Data model feature (restaurant type, price, distance), cuisine type constants, recommendation algorithm specification.

**Avoids:** Pitfall 1 (porting algorithm bugs), Pitfall 4 (unbounded recursion), Pitfall 6 (cuisine type constant duplication).

### Phase 2: App Shell and Navigation

**Rationale:** The static shell (layout, nav, page routes) is a Server Component concern with no dependencies on business logic. Building it second gives a deployable skeleton and validates the Next.js App Router setup before interactive features are added.

**Delivers:** Root layout, nav links between `/` and `/restaurants`, basic page shells, global CSS, shadcn/ui initialization.

**Uses:** Next.js App Router, Tailwind CSS, shadcn/ui, `CuisineTag` shared display primitive.

**Avoids:** Pitfall 2 (server/client boundary), Pitfall 7 (over-broad `'use client'`), Pitfall 9 (file-system routing confusion).

### Phase 3: Restaurant State Hook

**Rationale:** The `useRestaurants` hook is consumed by both feature pages. Building it as a standalone unit before either page component allows it to be tested and validated in isolation. This is where the atomic `useReducer` for `weekPlan + remaining` state is implemented.

**Delivers:** `useRestaurants` hook with `restaurants`, `add()`, `delete()`, initialized from `DEFAULT_RESTAURANTS`.

**Implements:** Data flow for restaurant management, atomic state updates for recommendation swaps.

**Avoids:** Pitfall 3 (dual-state sync bug), Pitfall 5 (over-heavy state management with a library).

### Phase 4: Restaurant Management Page

**Rationale:** The restaurant management page (`/restaurants`) has fewer dependencies than the picker and is simpler to build — it's CRUD without the algorithm. Building it before the picker validates the form, type coercion, and hook integration before tackling the more complex recommendation flow.

**Delivers:** Restaurant table with name/type/price/distance columns, add restaurant form with Zod validation, delete restaurant, cuisine type color tags.

**Uses:** `useRestaurants` hook, React Hook Form + Zod, shadcn/ui Table/Dialog/Input/Select components, `crypto.randomUUID()` in Client Component.

**Avoids:** Pitfall 8 (form type coercion bug — enforced via `price: z.number()` in Zod schema), Pitfall 11 (UUID server-side error).

### Phase 5: Recommendation Picker Page

**Rationale:** The picker page has the most dependencies — it requires the algorithm, the restaurant hook, the weekly plan state, and the per-slot swap logic. Building it last means all its dependencies are tested and stable.

**Delivers:** Budget input (NT$100–2000), "Recommend" button, 5-day weekly plan display, per-slot re-roll button, recommendation cards showing name/type/price/distance.

**Uses:** `lib/algorithm.ts` (recommend, swapOne), `useRestaurants`, `BudgetInput`, `WeeklyPlanCard` components.

**Avoids:** Pitfall 1 (algorithm bugs fixed in Phase 1), Pitfall 3 (atomic state from Phase 3 hook), Pitfall 10 (Math.random SSR mismatch — algorithm runs in Client Component only).

### Phase Ordering Rationale

- Data and algorithm come first because every other component is a consumer of them; building UI first and backfilling data models creates rework.
- The app shell is pure Server Component work — it's unblocked and can be committed as a baseline deployment.
- The restaurant hook bridges data and UI; building it as a standalone unit before either page prevents tight coupling between pages.
- Restaurant management is simpler than the picker (no algorithm) — building it first validates the form/validation/hook stack before the picker adds algorithm complexity.
- This order directly mirrors the "Suggested Build Order" in ARCHITECTURE.md and is reinforced by the pitfall phase warnings in PITFALLS.md.

### Research Flags

Phases with standard, well-documented patterns (skip `/gsd:research-phase`):
- **Phase 2 (App Shell):** Standard Next.js App Router patterns, well-documented, no novel integrations.
- **Phase 4 (Restaurant Management):** CRUD with React Hook Form + Zod is thoroughly documented and a standard pattern.

Phases that may benefit from targeted research during planning:
- **Phase 1 (Algorithm):** The recommendation constraints (budget, diversity, swap logic) need a precise specification written before implementation. Not a research problem per se, but a design problem — write the spec and test cases before coding.
- **Phase 5 (Picker Page):** Tailwind CSS v4 has breaking changes from v3 (config moved to CSS file, new utility names). If Tailwind v4 is chosen, verify migration docs before implementing the component-heavy picker UI.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core framework choices (Next.js 15, React 19, TypeScript) verified. Tailwind v4 API changes are a MEDIUM risk — verify migration docs before starting. |
| Features | HIGH | Derived from direct code inspection of existing working app. Bug list was pre-audited in CONCERNS.md. |
| Architecture | HIGH | Based on official Next.js docs (v16.1.6, updated 2026-02-16) and validated app requirements. Directory layout is convention-based (MEDIUM) but component boundary rules are HIGH confidence. |
| Pitfalls | HIGH | Critical pitfalls 1, 3, 4, 8 derived from first-hand code inspection of confirmed bugs. Pitfalls 2, 7, 9, 10 derived from official Next.js docs. |

**Overall confidence:** HIGH

### Gaps to Address

- **Tailwind CSS v4 specifics:** Version was released January 2025. Config format changed significantly from v3 (CSS-native config, no `tailwind.config.js`). Verify current v4 docs and `create-next-app` scaffolding output before starting Phase 2. If v4 is unstable or poorly supported by shadcn/ui at implementation time, fall back to v3.
- **Algorithm specification:** The intended algorithm behavior is documented from comments and naming in the Vue 2 source, but the exact edge cases (minimum viable restaurant pool size, behavior when budget is impossible, tie-breaking in diversity enforcement) need to be written out as test cases before implementation. This is the one area where research won't substitute for a design decision.
- **shadcn/ui + Tailwind v4 compatibility:** shadcn/ui's Tailwind v4 support should be verified at project init time. If incompatible, use CSS Modules for component styling as the built-in fallback.

## Sources

### Primary (HIGH confidence)
- `src/views/Home.vue`, `src/views/Dishes.vue`, `src/store/index.js`, `src/store/dishes.json` — direct source code inspection
- `.planning/codebase/CONCERNS.md` — pre-audited bug and tech debt list
- `.planning/PROJECT.md` — validated requirements and out-of-scope decisions
- Next.js official docs v16.1.6 (updated 2026-02-16) — App Router, Server/Client Components, file conventions
- React official docs — Thinking in React, useState, useReducer

### Secondary (MEDIUM confidence)
- Training knowledge (cutoff August 2025) — Next.js 15 + React 19 release (Oct 2024), Tailwind v4 release (Jan 2025), shadcn/ui ecosystem position
- Community consensus — React Hook Form + Zod as standard form stack, shadcn/ui as dominant Next.js component pattern (2024–2025)

### Tertiary (LOW confidence / needs verification)
- Tailwind CSS v4 API specifics — significant breaking changes from v3; verify with official v4 docs before starting
- `create-next-app` CLI flag syntax — accurate as of August 2025 but may have minor updates; run `--help` to verify

---
*Research completed: 2026-02-18*
*Ready for roadmap: yes*
