# Architecture

**Analysis Date:** 2026-02-19

## Pattern Overview

**Overall:** Client-centric React application with Next.js App Router and Context-based state management for client-side persistence.

**Key Characteristics:**
- Fully client-rendered UI with progressive enhancement (no heavy SSR)
- Separation of business logic (recommendation algorithms) from UI layer
- Context API for global state (restaurants, history) with localStorage hydration
- Pure utility functions for domain logic (filtering, planning, history tracking)
- Component composition via Radix UI + Tailwind CSS
- Client context providers manage application state across page transitions

## Layers

**Presentation (UI Components):**
- Purpose: Render application pages and UI elements using React and Tailwind CSS
- Location: `src/components/`, `src/app/`
- Contains: Page components, layout components, shadcn UI primitive components
- Depends on: Context hooks, utility functions, domain logic libraries
- Used by: Browser rendering layer

**Business Logic (Pure Functions):**
- Purpose: Compute recommendations, filter restaurants, manage lunch history without side effects
- Location: `src/lib/recommend.ts`, `src/lib/history.ts`, `src/lib/restaurants.ts`
- Contains: Algorithm implementations (weekly plan generation, slot rerolling, cuisine diversity checks), history date calculations
- Depends on: Type definitions (`src/lib/types.ts`)
- Used by: Page components and context providers

**State Management (Context + Hooks):**
- Purpose: Provide global state (restaurants, history) with automatic localStorage persistence
- Location: `src/lib/restaurant-context.tsx`, `src/lib/history-context.tsx`
- Contains: React Context providers, hydration logic, state mutation functions
- Depends on: Business logic (history.ts, restaurants.ts), type definitions
- Used by: All pages and components requiring shared state

**Types & Constants:**
- Purpose: Single source of truth for cuisine metadata, restaurant schema, history entry shape
- Location: `src/lib/types.ts`, `src/lib/restaurants.ts`, `src/lib/history.ts`
- Contains: TypeScript interfaces, cuisine color/label mapping, default data
- Depends on: Nothing (zero dependencies)
- Used by: All other layers

**Hooks:**
- Purpose: Encapsulate reusable component logic (animation state machine)
- Location: `src/hooks/use-slot-animation.ts`
- Contains: Animation lifecycle management, interval/timeout cleanup
- Depends on: React hooks only
- Used by: Weekend page, home page slot animation

**API Routes:**
- Purpose: Development-only endpoints for persisting restaurant changes to source code
- Location: `src/app/api/restaurants/route.ts`
- Contains: File system write logic, duplicate detection, ID auto-increment
- Depends on: fs/promises, Next.js Response utilities
- Used by: Restaurants management page (development mode only)

## Data Flow

**Weekly Plan Generation Flow:**

1. User clicks "產生本週午餐計畫" on home page (`src/app/page.tsx`)
2. Handler calls `generateWeeklyPlan(effectivePool, budget)` from `src/lib/recommend.ts`
3. Algorithm:
   - Iterates 5 slots (Monday–Friday)
   - For each slot: calls `pickForSlot()` with cuisine diversity constraints
   - Validates no 3+ consecutive cuisines of same type (unless diversity relaxed)
   - Retries up to 10 times to find valid plan
4. Returns `WeeklyPlan` object with 5 restaurant picks, total cost, ID, timestamp
5. Component displays plan with animated slot reveal
6. User can reroll individual slots (calls `rerollSlot()`)
7. User confirms plan → calls `addEntries()` on HistoryContext
8. History context persists to localStorage under `what-lunch-history`

**Restaurant Filtering Flow:**

1. Home page manages filter state: mode ('exclude'/'lock') and selected cuisines
2. Calls `applyFilter(restaurants, mode, selected)` from `src/lib/recommend.ts`
3. Returns filtered pool based on mode:
   - exclude: removes restaurants with selected cuisine types
   - lock: keeps only restaurants with selected cuisine types
4. Calls `splitPoolByHistory(filteredPool, recentIds)` from `src/lib/history.ts`
5. Returns { primary: unvisited recently, fallback: full pool }
6. Uses primary pool if available, falls back to full pool if primary depleted

**History-Aware Recommendation:**

1. HistoryContext provides `entries` and `lookbackDays`
2. Home page calls `getRecentlyVisitedIds(entries, lookbackDays)`
3. Logic counts business days backward (Mon–Fri only)
4. Returns Set of restaurantIds visited within lookback window
5. `splitPoolByHistory()` separates pool into visited/unvisited
6. Planning algorithm prefers unvisited restaurants

**State Management Flow:**

1. Layout wraps app with RestaurantProvider and HistoryProvider
2. Providers use `useSyncExternalStore` for hydration detection
3. On mount: reads localStorage, sets initial state (or defaults if storage fails)
4. On state change: automatically persists to localStorage (guarded by isHydrated)
5. Pages check `isHydrated` before rendering interactive UI
6. Children access state via `useRestaurants()` and `useHistory()` hooks

## Key Abstractions

**Restaurant:**
- Purpose: Core domain entity representing a lunch option
- Examples: `src/lib/types.ts`, `src/lib/restaurants.ts`
- Pattern: Immutable data structure with validation at boundary
- Properties: id, name, type (cuisine), price, distance, rating

**WeeklyPlan:**
- Purpose: Output of recommendation algorithm; represents one complete week of lunch picks
- Examples: `src/lib/recommend.ts`
- Pattern: Immutable snapshot with ID and timestamp for history/comparison
- Contains: 5 restaurants (days), total cost, remaining budget

**LunchHistoryEntry:**
- Purpose: Record of a confirmed lunch recommendation with date
- Examples: `src/lib/history.ts`
- Pattern: Denormalized (includes restaurantName to survive restaurant deletion)
- Fields: id (UUID), date (YYYY-MM-DD local), restaurantId, restaurantName

**FilterMode:**
- Purpose: Encodes two filtering strategies
- Pattern: Union type ('exclude' | 'lock')
- exclude: user specifies cuisines to avoid
- lock: user specifies cuisines to require

**CuisineType:**
- Purpose: Inferred union of valid cuisine keys from CUISINE_META
- Pattern: `type CuisineType = keyof typeof CUISINE_META`
- Benefit: Adding new cuisine auto-expands type; forgetting color/label causes compile error
- Values: 'chi' | 'jp' | 'kr' | 'tai' | 'west'

## Entry Points

**Application Root (`src/app/layout.tsx`):**
- Location: `src/app/layout.tsx`
- Triggers: Browser page load
- Responsibilities:
  - Set up RestaurantProvider and HistoryProvider
  - Render global Header component
  - Mount ThemeProvider for dark mode
  - Mount Sonner toast container
  - Inject fonts and metadata

**Home Page (`src/app/page.tsx`):**
- Location: `src/app/page.tsx`
- Triggers: User navigates to `/`
- Responsibilities:
  - Render weekly planning UI
  - Manage budget input, filter state, animation state
  - Call recommendation algorithm on generate
  - Persist confirmed plans to history

**Restaurants Page (`src/app/restaurants/page.tsx`):**
- Location: `src/app/restaurants/page.tsx`
- Triggers: User navigates to `/restaurants`
- Responsibilities:
  - Display weekday and weekend restaurant lists (tabbed)
  - Handle add/edit/delete restaurant operations
  - Validate form input
  - Call API to persist new restaurants to config (dev only)

**History Page (`src/app/history/page.tsx`):**
- Location: `src/app/history/page.tsx`
- Triggers: User navigates to `/history`
- Responsibilities:
  - Display lunch history grouped by date
  - Allow per-entry removal and bulk clear
  - Control lookback window for deduplication

**Weekend Page (`src/app/weekend/page.tsx`):**
- Location: `src/app/weekend/page.tsx`
- Triggers: User navigates to `/weekend`
- Responsibilities:
  - Render single-pick random selector for weekend
  - Manage animation state via useSlotAnimation hook
  - Display restaurant details

## Error Handling

**Strategy:** Silent degradation with user feedback where critical

**Patterns:**

- localStorage failures: Try-catch blocks silently ignore quota exceeded or missing storage (mobile private mode)
- Empty pools: Validation checks at UI entry points (disable generate button, show warning messages)
- Invalid form input: Client-side validation with error messages in `src/app/restaurants/page.tsx` (validateFields function)
- API failures: Toast notifications on restaurant save API failure (see `handleSaveToConfig`)
- Animation interruption: Cleanup refs on unmount or skip action to prevent memory leaks
- SSR hydration: All contexts detect window === undefined; pages check isHydrated before rendering interactive content

## Cross-Cutting Concerns

**Logging:** Console-only, used for debugging. No structured logging or analytics integrated.

**Validation:**
- Form validation: `src/app/restaurants/page.tsx` (validateFields function)
- Type validation: TypeScript enforces CuisineType as union, Restaurant shape, prices as numbers
- Data validation: Implicit in localStorage error handling (malformed JSON returns defaults)

**Authentication:** Not applicable (single-user, client-only app)

**Persistence:**
- localStorage for restaurants (weekday + weekend), history, filter preferences, lookback days
- SSR-safe reads using `typeof window === 'undefined'` checks
- Hydration flags on all context providers to prevent flash of stale UI

**Theme Management:**
- next-themes wrapper in ThemeProvider component
- ThemeToggle in header
- Dark mode colors via Tailwind CSS dark: variant

---

*Architecture analysis: 2026-02-19*
