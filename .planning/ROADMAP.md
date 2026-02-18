# Roadmap: What Lunch

## Overview

A Vue 2 to Next.js rewrite of a daily-use lunch randomizer for a small office team. The build follows the dependency graph: typed data model and algorithm first, then app shell and navigation, then the two interactive feature pages, then deployment. All existing features are preserved with known bugs fixed. The rewrite completes when a working, deployed app fully replaces the old one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Data model, type constants, restaurant data, and Next.js project scaffold
- [x] **Phase 2: App Shell** - Navigation, layouts, global design system, and static page shells
- [x] **Phase 3: Recommendation Algorithm** - Pure-function algorithm with budget enforcement and cuisine diversity
- [ ] **Phase 4: Restaurant Management** - Restaurant list view, add form, remove, and cuisine type tags
- [ ] **Phase 5: Picker Page and Deployment** - Weekly plan UI, per-slot re-roll cards, and Vercel deployment

## Phase Details

### Phase 1: Foundation
**Goal**: The project builds, types are correct, and restaurant data is a single typed source of truth
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04
**Success Criteria** (what must be TRUE):
  1. `npm run build` completes with no TypeScript errors
  2. `Restaurant` interface and `CuisineType` union exist in a single file and are importable by any component
  3. Cuisine type labels and colors are defined once and only once — no duplicate string literals across files
  4. All 19 default restaurants are available as a typed constant importable from `lib/restaurants.ts`
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js 16 project with TypeScript strict mode and shadcn/ui (new-york)
- [x] 01-02-PLAN.md — Create lib/types.ts and lib/restaurants.ts as the single typed source of truth

---

### Phase 2: App Shell
**Goal**: A navigable app skeleton is deployed and the design system is established
**Depends on**: Phase 1
**Requirements**: UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. User can navigate between the recommendation page and the restaurant management page without a full page reload
  2. The app renders correctly on a standard desktop viewport (1280px+)
  3. The visual design is distinct from Element UI — uses shadcn/ui components styled with Tailwind
  4. The deployed Vercel URL serves the app shell with correct routing (verified locally: npm run build + npm run dev)
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Install NavigationMenu, create Header/NavLinks components and /restaurants placeholder page
- [x] 02-02-PLAN.md — Wire Header into root layout, verify build, visual navigation checkpoint

---

### Phase 3: Recommendation Algorithm
**Goal**: The recommendation logic is correct, tested, and safe from infinite loops
**Depends on**: Phase 1
**Requirements**: RECO-01, RECO-02, RECO-03, RECO-04, RECO-05, RECO-07
**Success Criteria** (what must be TRUE):
  1. A weekly plan of 5 restaurants can be generated in a single function call with a budget input
  2. Every generated plan costs no more than the specified weekly budget
  3. No two generated plans contain more than 2 consecutive restaurants of the same cuisine type
  4. A single day's pick can be swapped without changing any other day's pick
  5. The algorithm terminates in all cases — including when the budget cannot be satisfied — and returns a graceful fallback rather than freezing
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Install Vitest and configure test runner with path alias support
- [x] 03-02-PLAN.md — TDD generateWeeklyPlan: budget-aware slot-by-slot greedy algorithm
- [x] 03-03-PLAN.md — TDD rerollSlot: per-slot swap with bidirectional cuisine constraint checking

---

### Phase 4: Restaurant Management
**Goal**: Users can view, add, and remove restaurants from the list
**Depends on**: Phase 1, Phase 2
**Requirements**: REST-01, REST-02, REST-03, REST-04, REST-05
**Success Criteria** (what must be TRUE):
  1. User can see all restaurants displayed in a table with name, cuisine type, price, and distance columns
  2. User can add a new restaurant by filling in a form and submitting — the new entry appears in the table immediately
  3. Submitting the add form with non-numeric values for price or distance is rejected with a visible validation error
  4. User can remove any restaurant from the list and it disappears immediately
  5. Each restaurant entry shows a color-coded cuisine type tag matching the type (e.g., Chinese = one color, Japanese = another)
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Install shadcn UI components and create RestaurantContext provider shared via root layout
- [ ] 04-02-PLAN.md — Build restaurant management page with table, add form, validation, remove, and cuisine tags

---

### Phase 5: Picker Page and Deployment
**Goal**: Users can generate a weekly lunch plan with a budget and the app is live on Vercel
**Depends on**: Phase 2, Phase 3, Phase 4
**Requirements**: RECO-06, DEPLOY-01, DEPLOY-02
**Success Criteria** (what must be TRUE):
  1. User can click one button and see a 5-day (Mon-Fri) weekly lunch plan
  2. Each day in the plan shows a recommendation card with restaurant name, cuisine type tag, price, and distance
  3. User can adjust the weekly budget input and regenerate a plan that respects the new budget
  4. User can click a re-roll button on any single day to swap that day's pick without affecting the other four days
  5. The production Vercel deployment builds without errors or warnings and serves all features correctly
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-02-18 |
| 2. App Shell | 2/2 | Complete | 2026-02-18 |
| 3. Recommendation Algorithm | 3/3 | Complete | 2026-02-18 |
| 4. Restaurant Management | 0/2 | Not started | - |
| 5. Picker Page and Deployment | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-18*
*Last updated: 2026-02-18 after Phase 4 planned*
