# Architecture Patterns

**Domain:** Lunch randomizer / food picker web app
**Researched:** 2026-02-18
**Sources:** Next.js official docs (v16.1.6, updated 2026-02-16), existing Vue 2 codebase analysis

---

## Recommended Architecture

This is a **fully static, client-interactive app** deployed as SSG on Vercel. There is no backend, no database, no authentication, and no server-side data fetching at runtime. All restaurant data is hardcoded in the codebase.

The architecture is deliberately simple:

- **Static shell** (Server Components): layout, navigation, page structure — rendered at build time
- **Interactive islands** (Client Components): anything with user interaction, state, or the recommendation algorithm
- **Data layer**: a single TypeScript constants file, imported directly into Client Components

Because the entire app is interactive (budget inputs, random picks, add/remove restaurants), almost all feature code will be Client Components. Server Components handle only the structural shell (root layout, page wrappers).

```
Browser
  └── Next.js App Router (SSG, deployed to Vercel)
        ├── app/layout.tsx          ← Server Component: HTML shell, nav
        ├── app/page.tsx            ← Server Component: renders <PickerPage />
        ├── app/restaurants/page.tsx ← Server Component: renders <RestaurantsPage />
        └── lib/
              ├── restaurants.ts    ← Hardcoded restaurant data + types
              └── algorithm.ts      ← Pure recommendation algorithm functions
```

---

## Component Boundaries

| Component | Type | Responsibility | Communicates With |
|-----------|------|---------------|-------------------|
| `app/layout.tsx` | Server | HTML root, nav links, font/metadata | All pages via `children` |
| `app/page.tsx` | Server | Route entry for `/` | Renders `<PickerPage />` |
| `app/restaurants/page.tsx` | Server | Route entry for `/restaurants` | Renders `<RestaurantsPage />` |
| `components/picker/PickerPage.tsx` | Client (`'use client'`) | Budget input, trigger recommendation, display weekly plan | `useRestaurants` hook, algorithm lib |
| `components/picker/WeeklyPlanCard.tsx` | Client | Display one day's restaurant, handle single-swap | Props from PickerPage |
| `components/picker/BudgetInput.tsx` | Client | Controlled number input for weekly budget | Props + onChange |
| `components/restaurants/RestaurantsPage.tsx` | Client (`'use client'`) | Table of restaurants, add/delete | `useRestaurants` hook |
| `components/restaurants/RestaurantTable.tsx` | Client | Sortable/filterable table display | Props from RestaurantsPage |
| `components/restaurants/AddRestaurantForm.tsx` | Client | Form to add a new restaurant | Props: onAdd callback |
| `components/ui/CuisineTag.tsx` | Client or Server | Render colored cuisine badge | Props: cuisine type |
| `lib/restaurants.ts` | Data module | Hardcoded restaurant list, cuisine type constants | Imported by hooks |
| `lib/algorithm.ts` | Pure functions | Recommendation, validation, sorting logic | Imported by hooks |
| `hooks/useRestaurants.ts` | Client hook | Manage restaurant list state (add/delete/filter) | `useState`, `lib/restaurants.ts` |

---

## Data Flow

### Application Initialization

```
Next.js build
  → Static HTML generated (layouts + page shells)
  → Client JS bundle includes hardcoded restaurant data
  → Browser loads static HTML instantly
  → React hydrates Client Components
  → useRestaurants hook initializes state from hardcoded data
```

### Recommendation Flow

```
User sets weekly budget (BudgetInput)
  → state: budget (number) in PickerPage

User clicks "Recommend"
  → PickerPage calls algorithm.recommend(restaurants, budget)
  → algorithm runs: shuffle → select 5 → validate budget → validate type diversity
  → returns: { weekPlan: Restaurant[], remaining: Restaurant[] }
  → PickerPage stores weekPlan + remaining in local state
  → WeeklyPlanCard components render with new data
```

### Single-Day Swap Flow

```
User clicks refresh on WeeklyPlanCard[i]
  → WeeklyPlanCard calls onSwap(index)
  → PickerPage calls algorithm.swapOne(weekPlan, remaining, index, budget)
  → algorithm finds next valid restaurant from remaining pool
  → returns updated weekPlan + remaining
  → PickerPage updates local state → re-render
```

### Restaurant Management Flow

```
User navigates to /restaurants
  → RestaurantsPage renders (Client Component)
  → useRestaurants provides: restaurants list, add(), delete()

User adds restaurant:
  → AddRestaurantForm validates input
  → calls useRestaurants.add({ name, type, price, distance })
  → hook adds with crypto.randomUUID() as ID
  → restaurant list re-renders

User deletes restaurant:
  → calls useRestaurants.delete(id)
  → list re-renders

User filters by cuisine type:
  → useRestaurants.filter(type) or local filter state
  → filtered list passed to RestaurantTable
```

### State Management

No global state manager (Vuex equivalent) is needed. State is local to each page:

```
PickerPage (useState)
  ├── budget: number
  ├── weekPlan: Restaurant[]
  └── remaining: Restaurant[]

RestaurantsPage (via useRestaurants hook)
  ├── restaurants: Restaurant[] (starts from hardcoded defaults)
  ├── activeFilter: CuisineType | 'all'
  └── add / delete operations
```

State does NOT persist between sessions. This matches the existing Vue app behavior (Vuex state was in-memory only, no localStorage). If persistence is desired later, localStorage can be added to the `useRestaurants` hook without changing component interfaces.

---

## Data Model

The central data type everything depends on:

```typescript
// lib/restaurants.ts

export type CuisineType = 'chi' | 'jp' | 'kr' | 'tai' | 'west'

export interface Restaurant {
  id: string
  name: string
  type: CuisineType
  price: number      // average meal price in TWD
  distance: number   // meters from office
}

export const CUISINE_LABELS: Record<CuisineType, string> = {
  chi: '中式',
  jp: '日式',
  kr: '韓式',
  tai: '泰式',
  west: '西式',
}

export const CUISINE_COLORS: Record<CuisineType, string> = {
  // defined once, imported everywhere — fixes Vue 2 duplication bug
}

export const DEFAULT_RESTAURANTS: Restaurant[] = [
  // 19 restaurants from existing dishes.json
]
```

This single file replaces the three-location duplication that existed in the Vue 2 codebase (filters in main.js, types in store/index.js).

---

## Algorithm Module

The recommendation logic must be extracted from the component (it was embedded in Home.vue in Vue 2) and moved to a pure functions module.

```typescript
// lib/algorithm.ts

export function recommend(
  restaurants: Restaurant[],
  budget: number,
  count: number = 5
): { weekPlan: Restaurant[]; remaining: Restaurant[] }

export function swapOne(
  weekPlan: Restaurant[],
  remaining: Restaurant[],
  index: number,
  budget: number
): { weekPlan: Restaurant[]; remaining: Restaurant[] }

// Internal helpers — exported for testing
export function checkBudget(selected: Restaurant[], budget: number): boolean
export function checkTypeVariety(selected: Restaurant[], minTypes: number): boolean
export function sortNoExcessiveRepeat(selected: Restaurant[], maxConsecutive: number): Restaurant[]
export function sumPrices(restaurants: Restaurant[]): number
export function countTypes(restaurants: Restaurant[]): number
```

All functions are pure (no side effects, no component state). This makes them independently testable — something impossible in the Vue 2 codebase where the algorithm was tangled with `this.$store` calls.

---

## Directory Layout

```
what-lunch/                         ← Next.js project root
├── app/
│   ├── layout.tsx                  ← Root layout: HTML, nav, fonts
│   ├── page.tsx                    ← Route: / (picker)
│   ├── restaurants/
│   │   └── page.tsx                ← Route: /restaurants (management)
│   └── globals.css
├── components/
│   ├── picker/
│   │   ├── PickerPage.tsx          ← 'use client' — full picker logic
│   │   ├── WeeklyPlanCard.tsx      ← 'use client' — one day card + swap
│   │   └── BudgetInput.tsx         ← 'use client' — budget number input
│   ├── restaurants/
│   │   ├── RestaurantsPage.tsx     ← 'use client' — restaurant management
│   │   ├── RestaurantTable.tsx     ← table with sort/filter
│   │   └── AddRestaurantForm.tsx   ← add new restaurant form
│   └── ui/
│       ├── CuisineTag.tsx          ← colored cuisine badge
│       └── Nav.tsx                 ← navigation links (can be Server)
├── hooks/
│   └── useRestaurants.ts           ← 'use client' — restaurant list state
├── lib/
│   ├── restaurants.ts              ← data: types, constants, DEFAULT_RESTAURANTS
│   └── algorithm.ts                ← pure functions: recommend, swap, validate
├── public/
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Patterns to Follow

### Pattern 1: Push 'use client' Down to Leaves

Server Components render the route shell; Client Components handle interaction. The `app/page.tsx` file stays a Server Component (no `'use client'`) and simply renders `<PickerPage />`. This lets Next.js optimize the static shell separately.

```typescript
// app/page.tsx — Server Component
import PickerPage from '@/components/picker/PickerPage'

export default function Page() {
  return <PickerPage />
}
```

```typescript
// components/picker/PickerPage.tsx — Client Component
'use client'
import { useState } from 'react'
// ...
```

### Pattern 2: Algorithm as Pure Functions, Not Component Methods

In Vue 2, the algorithm lived in `Home.vue`'s `methods` object, making it impossible to test independently. In Next.js, extract it to `lib/algorithm.ts` as pure functions. Components call functions and manage state; they don't contain algorithm logic.

```typescript
// lib/algorithm.ts
export function recommend(restaurants, budget) {
  // pure: takes input, returns output, no side effects
}

// components/picker/PickerPage.tsx
import { recommend } from '@/lib/algorithm'
const { weekPlan, remaining } = recommend(restaurants, budget)
```

### Pattern 3: Single Constants File for Cuisine Types

The Vue 2 codebase defined cuisine type mappings in three separate files. Define them once in `lib/restaurants.ts` and import everywhere.

### Pattern 4: useRestaurants Hook for List State

Encapsulate all restaurant list mutations (add, delete, filter) in a custom hook. Components call `const { restaurants, add, delete, filter } = useRestaurants()`. This makes the state logic reusable and independently testable.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Global State Manager (Zustand/Jotai) for This App

**What:** Adding a global state manager (Zustand, Jotai, Redux) to mirror Vuex.
**Why bad:** This app's state does not need to be shared across unrelated pages. The picker's weekly plan is only relevant to the picker page. The restaurant list is only relevant to the restaurants page. Global state adds indirection without benefit.
**Instead:** Use `useState` in page-level Client Components. If data needs to cross page boundaries later, add it then.

### Anti-Pattern 2: Server Actions for Restaurant Mutations

**What:** Using Next.js Server Actions to handle add/delete restaurant operations.
**Why bad:** There is no backend. Server Actions are for mutating persistent server-side data. Using them for in-memory client state creates confusion and complexity for no benefit.
**Instead:** Simple event handlers in Client Components updating `useState`.

### Anti-Pattern 3: Keeping Algorithm Inside Component

**What:** Putting `recommend()` logic inside a component's event handler (as it was in Vue 2's Home.vue).
**Why bad:** Impossible to unit test. Business logic is coupled to React rendering. The Vue 2 codebase had untested, buggy algorithm code precisely because of this pattern.
**Instead:** `lib/algorithm.ts` with pure functions. Components are thin wrappers that call library functions and display results.

### Anti-Pattern 4: Duplicating Type Constants

**What:** Defining cuisine types in multiple files (as happened in Vue 2 main.js + store/index.js).
**Why bad:** Maintenance burden, risk of inconsistency.
**Instead:** One canonical `lib/restaurants.ts` file. All components import from there.

### Anti-Pattern 5: Math.random() Without Iteration Limit

**What:** Recursive shuffle until constraint satisfied, with no loop cap.
**Why bad:** The Vue 2 `nonRepeatSort()` and `checkTotalPrice()` functions could loop indefinitely if no valid combination existed, freezing the UI.
**Instead:** Add a `maxIterations` parameter. Fall back to best-effort result if limit exceeded.

---

## Suggested Build Order

Components have explicit dependencies. Build in this order to avoid blocked work:

**Step 1: Foundation — Data and Algorithm**
- `lib/restaurants.ts` — types, constants, default data
- `lib/algorithm.ts` — pure recommendation functions (testable immediately)

These have no dependencies. Everything else depends on them.

**Step 2: App Shell**
- `app/layout.tsx` — root layout, navigation
- `app/page.tsx` — route shell for picker
- `app/restaurants/page.tsx` — route shell for management
- `components/ui/CuisineTag.tsx` — shared display primitive

Shell is static, renders immediately, does not depend on hooks or algorithm.

**Step 3: Restaurant List State**
- `hooks/useRestaurants.ts` — encapsulates list mutations

Depends on: `lib/restaurants.ts` (types, defaults)

**Step 4: Restaurant Management Page**
- `components/restaurants/RestaurantTable.tsx`
- `components/restaurants/AddRestaurantForm.tsx`
- `components/restaurants/RestaurantsPage.tsx`

Depends on: `useRestaurants` hook, `lib/restaurants.ts` types

**Step 5: Picker / Recommendation Page**
- `components/picker/BudgetInput.tsx`
- `components/picker/WeeklyPlanCard.tsx`
- `components/picker/PickerPage.tsx`

Depends on: `lib/algorithm.ts`, `useRestaurants` hook, `lib/restaurants.ts` types

---

## Scalability Considerations

| Concern | At 19 restaurants (now) | At 100+ restaurants | Notes |
|---------|------------------------|--------------------|----|
| Data storage | Hardcoded array in lib | Same, just larger file | No DB needed until team size grows |
| Algorithm performance | Trivial | Still fine for random selection | O(n) with iteration cap is safe |
| State management | Local useState | Still fine | Add localStorage for persistence |
| Bundle size | Tiny | Minimal growth | Data is plain JSON, no bloat |
| Persistence | In-memory only | Could add localStorage | Zero changes to component interfaces |

---

## Confidence Assessment

| Area | Confidence | Source |
|------|------------|--------|
| Next.js App Router project structure | HIGH | Official Next.js docs v16.1.6 (2026-02-16) |
| Server vs Client Component split | HIGH | Official Next.js docs, verified with docs.nextjs.org |
| No global state needed | HIGH | App requirements — all state is page-local |
| Algorithm extraction as pure functions | HIGH | Standard practice, addresses documented Vue 2 bug |
| Directory layout recommendation | MEDIUM | Convention-based; team may prefer alternatives |
| useRestaurants hook pattern | MEDIUM | Standard React pattern; verified against Next.js context docs |

---

*Architecture research: 2026-02-18*
