# Architecture

**Analysis Date:** 2026-02-18

## Pattern Overview

**Overall:** Next.js 16 full-stack application with client-side state management using React Context API.

**Key Characteristics:**
- Next.js App Router with server-side rendered layouts and client-side interactive pages
- React Context API for global restaurant state management (no external state library)
- Separation of concerns: algorithms isolated in pure functions, UI components consume contexts and compose through props
- Strong type safety via TypeScript with inferred union types from constant definitions
- Fallback-oriented error handling: graceful degradation rather than throwing errors

## Layers

**Presentation Layer (UI Components):**
- Purpose: Render user interface and handle user interactions
- Location: `src/components/`
- Contains: Shadcn UI primitive components (`ui/`), layout components (`layout/`)
- Depends on: Radix UI, Lucide React icons, Tailwind CSS, context hooks from `@/lib`
- Used by: Page components in `src/app/`

**Page Layer (Route Handlers):**
- Purpose: Top-level page components that coordinate between context and UI components
- Location: `src/app/page.tsx`, `src/app/restaurants/page.tsx`
- Contains: Client components marked with `'use client'` directive
- Depends on: Context hooks (`useRestaurants()`), business logic functions (`generateWeeklyPlan`, `rerollSlot`), UI components
- Used by: Next.js routing system

**State Management Layer (Context):**
- Purpose: Provide global restaurant data and mutation functions
- Location: `src/lib/restaurant-context.tsx`
- Contains: `RestaurantContext` definition, `RestaurantProvider` component, `useRestaurants()` hook
- Depends on: `Restaurant` type from `@/lib/types`
- Used by: All client components needing restaurant data

**Business Logic Layer:**
- Purpose: Pure functions for algorithm implementation (recommendation generation, validation)
- Location: `src/lib/recommend.ts`
- Contains: `generateWeeklyPlan()`, `rerollSlot()`, helper functions for budget calculation and cuisine validation
- Depends on: `Restaurant` type, no external dependencies
- Used by: Page components (`page.tsx`)

**Data Definition Layer:**
- Purpose: Type definitions and constant metadata for the domain
- Location: `src/lib/types.ts`, `src/lib/restaurants.ts`
- Contains: `CUISINE_META` constant (cuisine metadata), `CuisineType` union type, `Restaurant` interface, `DEFAULT_RESTAURANTS` seed data
- Depends on: None
- Used by: All other layers

**Root Layout:**
- Purpose: HTML structure, font configuration, provider wrapping
- Location: `src/app/layout.tsx`
- Contains: `RootLayout` component, `Header` component instantiation, `RestaurantProvider` wrapping
- Depends on: `@/lib/restaurant-context`, `@/components/layout/header`
- Used by: Next.js as page wrapper

## Data Flow

**Plan Generation Flow:**

1. User opens home page (`src/app/page.tsx`)
2. Page component calls `useRestaurants()` hook to access global restaurant state
3. User adjusts budget input and clicks "產生本週午餐計畫"
4. Page calls `generateWeeklyPlan(restaurants, budget)` with current state
5. Algorithm returns `WeeklyPlan` object with 5 days of recommendations
6. Page renders weekly plan cards with reroll buttons

**Reroll Flow:**

1. User clicks reroll button on a day card
2. Page calls `rerollSlot(currentPlan, slotIndex, restaurants)`
3. Algorithm calculates remaining budget for that slot
4. Algorithm selects new restaurant respecting budget and cuisine constraints
5. Returns updated `WeeklyPlan` with only that slot changed
6. Page re-renders with new selection

**Restaurant Management Flow:**

1. User navigates to `/restaurants` page
2. Page displays current restaurants from `useRestaurants()` context
3. User fills form (name, cuisine type, price, distance, rating)
4. Form validation on each field change
5. User submits → page calls `addRestaurant(newRestaurant)`
6. Context updates global state, all pages re-render
7. User can delete restaurant by calling `removeRestaurant(id)`

**State Management:**

- `Restaurant[]` state stored in `RestaurantProvider` via `useState()`
- Initialized with `DEFAULT_RESTAURANTS` from `src/lib/restaurants.ts`
- Provider exported as `RestaurantProvider` component, wrapped in `RootLayout`
- Accessed via `useRestaurants()` hook in client components
- Mutations: `addRestaurant()`, `removeRestaurant()` update internal state directly

## Key Abstractions

**WeeklyPlan:**
- Purpose: Encapsulates a 5-day lunch recommendation plan
- Examples: `src/lib/recommend.ts` defines interface, returned by `generateWeeklyPlan()`
- Pattern: Data transfer object (DTO) containing immutable days array, cost info, budget reference

**Restaurant:**
- Purpose: Core domain model for a restaurant entry
- Examples: `src/lib/types.ts` line 20-27
- Pattern: Strongly typed with compile-time validation of cuisine type through union type

**CuisineType:**
- Purpose: Exhaustive union type for valid cuisine categories
- Examples: `'chi' | 'jp' | 'kr' | 'tai' | 'west'`
- Pattern: Derived from `CUISINE_META` keys using `keyof typeof` to ensure type and constants stay in sync

**CUISINE_META:**
- Purpose: Single source of truth for cuisine metadata (labels, colors)
- Examples: `src/lib/types.ts` line 6-12
- Pattern: `as const satisfies Record<>` validates shape at compile time while deriving union type

## Entry Points

**Root Entry Point:**
- Location: `src/app/layout.tsx`
- Triggers: Every page navigation
- Responsibilities: Configure fonts, wrap with `RestaurantProvider`, render `Header`

**Home Page:**
- Location: `src/app/page.tsx`
- Triggers: User navigates to `/` or app loads
- Responsibilities: Render plan generation UI, display weekly recommendations, handle reroll interactions

**Restaurant Management Page:**
- Location: `src/app/restaurants/page.tsx`
- Triggers: User navigates to `/restaurants`
- Responsibilities: Display restaurant table, handle add/delete forms with validation

**Header Navigation:**
- Location: `src/components/layout/header.tsx` + `src/components/layout/nav-links.tsx`
- Triggers: Rendered on every page
- Responsibilities: Display app title, navigation links with active state highlighting

## Error Handling

**Strategy:** Graceful degradation with fallback selection rather than throwing.

**Patterns:**

1. **Empty Restaurant Pool:** `generateWeeklyPlan()` throws explicitly when pool is empty (line 143-145 in `recommend.ts`), preventing downstream errors

2. **Impossible Budgets:** Algorithm implements cascading fallbacks instead of throwing:
   - Fallback 1 (line 64-68): Relax cuisine constraint, maintain budget reserve
   - Fallback 2 (line 70-75): Relax cuisine + use full remaining budget
   - Fallback 3 (line 77-78): Use globally cheapest restaurant to minimize overage

3. **Budget Constraint During Reroll:** `pickForSlotReroll()` applies same fallback chain (lines 81-106)

4. **Form Validation:** Input change handlers validate on each keystroke, displaying error messages without throwing (lines 32-63 in `restaurants/page.tsx`)

5. **Context Hook Safety:** `useRestaurants()` throws explicit error if called outside provider (line 35 in `restaurant-context.tsx`)

## Cross-Cutting Concerns

**Logging:** Not implemented. Debug via console during development; consider adding structured logging for errors/analytics in production.

**Validation:**
- Type-level: TypeScript ensures `Restaurant` shape via interface and `CuisineType` via union type
- Runtime: Algorithm fallbacks handle invalid states gracefully
- Form-level: User input validated on change with error messages in UI (form validation in `restaurants/page.tsx` lines 32-93)

**Authentication:** Not implemented. App assumes single-user, in-browser state only.

**Styling:** Tailwind CSS utility classes with shadcn component library for consistent design system.

---

*Architecture analysis: 2026-02-18*
