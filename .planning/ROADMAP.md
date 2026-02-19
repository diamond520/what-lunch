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
- [x] **Phase 4: Restaurant Management** - Restaurant list view, add form, remove, and cuisine type tags
- [ ] **Phase 5: Picker Page and Deployment** - Weekly plan UI, per-slot re-roll cards, and Vercel deployment
- [x] **Phase 6: Weekend Recommendation** - Independent weekend restaurant list, random pick page, tab switching in restaurant management
- [x] **Phase 7: Dark Mode** - Tailwind CSS variable theme toggle with system preference detection
- [x] **Phase 8: Cuisine Filter** - Exclude or lock specific cuisine types when generating weekly plans (completed 2026-02-19)
- [x] **Phase 9: Lunch History** - Track daily lunch picks and avoid recommending recently visited restaurants
- [x] **Phase 10: Share Plan** - One-click copy weekly plan as formatted text for LINE/clipboard (completed 2026-02-19)
- [x] **Phase 11: Wheel Animation** - Spinning wheel animation for restaurant picks to add fun

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
- [x] 04-01-PLAN.md — Install shadcn UI components and create RestaurantContext provider shared via root layout
- [x] 04-02-PLAN.md — Build restaurant management page with table, add form, validation, remove, and cuisine tags

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
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — Build weekly lunch picker page with budget input, 5-day cards, and per-card re-roll
- [ ] 05-02-PLAN.md — Deploy to Vercel production and verify all features work on the live URL (backlog: manual deploy when ready)

---

### Phase 6: Weekend Recommendation
**Goal**: Users can maintain a separate weekend restaurant list and randomly pick one for weekend meals
**Depends on**: Phase 4, Phase 5
**Success Criteria** (what must be TRUE):
  1. A separate weekend restaurant list exists with independent CRUD (add/remove/update) and localStorage persistence
  2. The `/restaurants` page has tab switching between weekday and weekend restaurant lists
  3. Adding a restaurant under the weekend tab goes into the weekend list, not the weekday list
  4. The `/weekend` page randomly picks 1 restaurant from the weekend pool on button click
  5. Re-rolling on the weekend page picks a different restaurant
  6. Empty weekend pool shows a prompt to add restaurants with a link to `/restaurants`
  7. Navigation bar includes a "假日推薦" link to `/weekend`
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md — Install shadcn Tabs, add weekend defaults, extend RestaurantContext, add pickRandomRestaurant
- [x] 06-02-PLAN.md — Build tabbed restaurant management page and /weekend random picker page with nav link
- [x] 06-03-PLAN.md — Write unit and component tests for weekend features

---

### Phase 7: Dark Mode
**Goal**: Users can toggle between light and dark themes, with system preference as default
**Depends on**: Phase 2
**Success Criteria** (what must be TRUE):
  1. A theme toggle button exists in the header/nav area
  2. Clicking the toggle switches all pages between light and dark color schemes
  3. The app respects the user's OS-level color scheme preference on first load
  4. The chosen theme persists across page reloads via localStorage
  5. All existing UI components (tables, cards, forms, badges) render correctly in both themes
**Plans**: 1 plan

Plans:
- [x] 07-01-PLAN.md — Install next-themes, create ThemeProvider + ThemeToggle, wire into layout and header

---

### Phase 8: Cuisine Filter
**Goal**: Users can exclude or lock specific cuisine types when generating a weekly plan
**Depends on**: Phase 3, Phase 5
**Success Criteria** (what must be TRUE):
  1. The picker page shows cuisine type checkboxes/toggles before generating a plan
  2. User can exclude one or more cuisine types — excluded types never appear in the generated plan
  3. User can lock one or more cuisine types — only locked types appear in the generated plan
  4. Exclude and lock modes are mutually exclusive (toggle between them)
  5. The algorithm still respects budget and diversity constraints with filtered cuisine types
  6. If filtering leaves too few restaurants to fill 5 days, a clear warning is shown
**Plans**: 2 plans

Plans:
- [x] 08-01-PLAN.md — TDD applyFilter helper and relaxDiversity option in recommend.ts
- [x] 08-02-PLAN.md — Cuisine filter UI on picker page with persistence and human verification

---

### Phase 9: Lunch History
**Goal**: The app tracks which restaurants were picked and avoids recommending recently visited ones
**Depends on**: Phase 5
**Success Criteria** (what must be TRUE):
  1. When a weekly plan is confirmed/used, the picks are saved to a history log in localStorage
  2. A history page or section shows past picks with dates
  3. The recommendation algorithm deprioritizes restaurants visited in the last N days (configurable, default 5 business days)
  4. Users can clear history or remove individual entries
  5. History persists across page reloads
**Plans**: 3 plans

Plans:
- [x] 09-01-PLAN.md — History lib (types, localStorage, business day logic, pool-split) and HistoryContext provider
- [x] 09-02-PLAN.md — History page, confirm plan button, history-aware pool deprioritization, nav link
- [x] 09-03-PLAN.md — TDD unit tests for getRecentlyVisitedIds and splitPoolByHistory

---

### Phase 10: Share Plan
**Goal**: Users can share the weekly lunch plan with teammates in one click
**Depends on**: Phase 5
**Success Criteria** (what must be TRUE):
  1. A "複製計畫" button appears when a weekly plan is generated
  2. Clicking the button copies a formatted text summary to clipboard (Mon-Fri with restaurant name, cuisine, price)
  3. A toast/notification confirms the copy was successful
  4. The copied text is readable in LINE, Slack, or any messaging app
  5. Weekend pick page also has a share/copy button for the single result
**Plans**: 1 plan

Plans:
- [x] 10-01-PLAN.md — Install Sonner, wire Toaster to layout, add copy buttons to weekday and weekend pages

---

### Phase 11: Wheel Animation
**Goal**: Picking a restaurant shows a fun spinning wheel animation before revealing the result
**Depends on**: Phase 5, Phase 6
**Success Criteria** (what must be TRUE):
  1. Clicking the recommendation button triggers a spinning wheel/slot-machine animation
  2. The animation shows restaurant names cycling through before landing on the pick
  3. The animation runs for 2-3 seconds before settling on the final result
  4. The animation works on both the weekday picker and weekend picker pages
  5. Users can skip the animation by clicking again or pressing a key
**Plans**: 2 plans

Plans:
- [x] 11-01-PLAN.md — useSlotAnimation hook + weekend page animation + hook tests + updated weekend tests
- [x] 11-02-PLAN.md — Weekday page multi-slot animation + integration test updates + human verification

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-02-18 |
| 2. App Shell | 2/2 | Complete | 2026-02-18 |
| 3. Recommendation Algorithm | 3/3 | Complete | 2026-02-18 |
| 4. Restaurant Management | 2/2 | Complete | 2026-02-18 |
| 5. Picker Page and Deployment | 1/2 | Backlog (deployment) | - |
| 6. Weekend Recommendation | 3/3 | Complete | 2026-02-18 |
| 7. Dark Mode | 1/1 | Complete | 2026-02-19 |
| 8. Cuisine Filter | 2/2 | Complete   | 2026-02-19 |
| 9. Lunch History | 3/3 | Complete | 2026-02-19 |
| 10. Share Plan | 1/1 | Complete   | 2026-02-19 |
| 11. Wheel Animation | 2/2 | Complete | 2026-02-19 |

---
*Roadmap created: 2026-02-18*
*Last updated: 2026-02-19 after 11-02 complete (Phase 11 complete)*
