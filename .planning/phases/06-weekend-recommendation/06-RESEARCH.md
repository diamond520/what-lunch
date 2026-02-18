# Phase 6: Weekend Recommendation - Research

**Researched:** 2026-02-18
**Domain:** React Context extension, shadcn/ui Tabs, Next.js App Router page creation, Vitest/RTL testing
**Confidence:** HIGH

## Summary

Phase 6 adds a weekend restaurant feature parallel to the existing weekday system. The implementation is entirely additive — no existing code is deleted, only extended. The primary technical domains are: (1) extending `RestaurantContext` to carry a second independent list with its own localStorage key, (2) installing and using the shadcn/ui `Tabs` component (not yet in the project) for tab switching on `/restaurants`, and (3) creating a new `/weekend` page with a simple random-pick function.

The existing codebase patterns are mature and consistent: React 19 context with `<Context value={...}>` syntax, `useSyncExternalStore` for hydration guard, `satisfies` for typed data arrays, and a Context7-verified shadcn Tabs API. The user's implementation plan maps cleanly onto the codebase — no architectural conflicts were found. The only new external concern is the `shadcn add tabs` CLI step, which is a one-command install that drops a single file into `src/components/ui/tabs.tsx`.

**Primary recommendation:** Follow the user's plan exactly. Extend `RestaurantContext` first (unlocks all downstream work), then add Tabs to `/restaurants`, then create the `/weekend` page with `pickRandomRestaurant()`, then add the nav link, then write tests.

## Standard Stack

No new libraries are needed beyond adding the shadcn Tabs component.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router, pages, routing | Already in use |
| react | 19.2.3 | UI, state, context | Already in use |
| shadcn/ui | v3 (CLI 3.8.5) | Component library | Project standard |
| tailwindcss | v4 | Styling | Project standard |
| radix-ui | ^1.4.3 | Headless primitives under shadcn | Already in use |
| vitest | ^4.0.18 | Testing | Already in use |
| @testing-library/react | ^16.3.2 | Component testing | Already in use |

### New Component to Add
| Component | Install Command | Purpose |
|-----------|----------------|---------|
| shadcn Tabs | `npx shadcn@latest add tabs` | Tab switching on `/restaurants` page |

**Installation:**
```bash
npx shadcn@latest add tabs
```
This adds `src/components/ui/tabs.tsx` only. No other dependencies needed — Radix UI tabs primitive is already satisfied by `radix-ui` ^1.4.3 which is installed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Tabs | Custom button toggle | More work, inconsistent with project's shadcn-first approach |
| shadcn Tabs | URL-based routing (/restaurants/weekend) | Heavier, overkill for simple two-tab switch |

## Architecture Patterns

### Recommended Project Structure Changes
```
src/
├── lib/
│   ├── restaurant-context.tsx   # EXTEND: add weekendRestaurants state + CRUD
│   ├── restaurants.ts           # EXTEND: add DEFAULT_WEEKEND_RESTAURANTS
│   ├── recommend.ts             # EXTEND: add pickRandomRestaurant(pool)
│   └── types.ts                 # NO CHANGE needed
├── components/
│   ├── layout/
│   │   └── nav-links.tsx        # EXTEND: add { href: '/weekend', label: '假日推薦' }
│   └── ui/
│       └── tabs.tsx             # NEW: added via `npx shadcn@latest add tabs`
└── app/
    ├── restaurants/
    │   └── page.tsx             # MODIFY: add Tabs wrapper for weekday/weekend
    └── weekend/
        └── page.tsx             # NEW: random picker page
__tests__/
    ├── weekend.test.ts          # NEW: tests for pickRandomRestaurant
    └── weekend-page.test.tsx    # NEW: tests for WeekendPage component
```

### Pattern 1: Extending RestaurantContext with Parallel Weekend State

**What:** Add a second independent `useState` for `weekendRestaurants` within the same provider, mirroring all existing patterns exactly (separate STORAGE_KEY, same CRUD shape, same hydration guard).

**When to use:** When two data collections share the same lifecycle (both localStorage-persisted, both React-managed) but must remain strictly independent.

**Example:**
```typescript
// Source: mirrors existing restaurant-context.tsx pattern
const STORAGE_KEY = 'what-lunch-restaurants'
const WEEKEND_STORAGE_KEY = 'what-lunch-weekend-restaurants'

// Extended context value interface
interface RestaurantContextValue {
  restaurants: Restaurant[]
  weekendRestaurants: Restaurant[]
  isHydrated: boolean
  addRestaurant: (r: Restaurant) => void
  removeRestaurant: (id: string) => void
  updateRestaurant: (r: Restaurant) => void
  addWeekendRestaurant: (r: Restaurant) => void
  removeWeekendRestaurant: (id: string) => void
  updateWeekendRestaurant: (r: Restaurant) => void
}

// Inside provider: second useState mirrors the first
const [weekendRestaurants, setWeekendRestaurants] = useState<Restaurant[]>(
  readStoredRestaurantsFromKey(WEEKEND_STORAGE_KEY, DEFAULT_WEEKEND_RESTAURANTS)
)

// Persist weekend list on changes (same useEffect pattern)
useEffect(() => {
  if (!isHydrated) return
  try {
    localStorage.setItem(WEEKEND_STORAGE_KEY, JSON.stringify(weekendRestaurants))
  } catch {
    // Ignore storage errors
  }
}, [weekendRestaurants, isHydrated])
```

**Key detail:** Extract `readStoredRestaurants` into a generic `readStoredRestaurantsFromKey(key, defaults)` helper to avoid duplication.

### Pattern 2: shadcn Tabs for Weekday/Weekend List Switching

**What:** Wrap the existing restaurant table and add form in `Tabs`, with one tab for weekday and one for weekend. The weekend tab renders the same table/form UI but bound to `weekendRestaurants` and weekend CRUD methods.

**When to use:** When the same UI structure manages two independent data sets that the user switches between.

**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// In RestaurantsPage:
<Tabs defaultValue="weekday">
  <TabsList>
    <TabsTrigger value="weekday">平日餐廳</TabsTrigger>
    <TabsTrigger value="weekend">假日餐廳</TabsTrigger>
  </TabsList>
  <TabsContent value="weekday">
    {/* existing table + form bound to restaurants + addRestaurant etc. */}
  </TabsContent>
  <TabsContent value="weekend">
    {/* same table + form bound to weekendRestaurants + addWeekendRestaurant etc. */}
  </TabsContent>
</Tabs>
```

**Key detail:** The two tab content panels use identical JSX structure but receive different props. Extract the table+form into a shared `RestaurantListPanel` component to avoid duplication.

### Pattern 3: pickRandomRestaurant Pure Function

**What:** A simple pure function in `recommend.ts` that picks one random element from a pool. No budget logic, no cuisine diversity — this is deliberately simpler than `generateWeeklyPlan`.

**When to use:** Weekend pick doesn't need weekday constraints; simplicity is correct.

**Example:**
```typescript
// Source: pattern consistent with existing recommend.ts
export function pickRandomRestaurant(pool: Restaurant[]): Restaurant {
  if (pool.length === 0) throw new Error('Restaurant pool cannot be empty')
  return pool[Math.floor(Math.random() * pool.length)]
}
```

**Note on re-roll:** The `/weekend` page needs to pick a *different* restaurant on re-roll. Handle this in the page component by tracking the current pick and filtering it out of the pool before the next pick (if pool.length > 1). Do not put re-roll exclusion logic into `pickRandomRestaurant` — keep the function pure and simple.

```typescript
// Re-roll logic in WeekendPage (page component state):
function handleReroll() {
  if (weekendRestaurants.length === 0) return
  const pool = weekendRestaurants.length > 1
    ? weekendRestaurants.filter(r => r.id !== current?.id)
    : weekendRestaurants
  setCurrent(pickRandomRestaurant(pool))
}
```

### Pattern 4: WeekendPage Structure

**What:** New Next.js App Router page at `src/app/weekend/page.tsx`. Client component (needs `useState` and context). Matches existing page patterns: hydration guard, container layout, shadcn Button.

**Structure:**
```
- Hydration guard (same pattern as restaurants/page.tsx)
- Empty state: if weekendRestaurants.length === 0, show message + Link to /restaurants
- Roll button: picks random restaurant from weekendRestaurants
- Result card: shows restaurant name, cuisine badge (inline style), price, distance, rating
- Re-roll button: appears after first pick, picks a different restaurant
```

### Pattern 5: Adding Nav Item

**What:** Append one entry to `NAV_ITEMS` in `nav-links.tsx`. No structural changes needed.

```typescript
// Source: nav-links.tsx existing pattern
const NAV_ITEMS = [
  { href: '/', label: '今日推薦' },
  { href: '/restaurants', label: '餐廳管理' },
  { href: '/weekend', label: '假日推薦' },  // ADD THIS
] as const
```

### Anti-Patterns to Avoid

- **Shared weekend/weekday CRUD methods:** Do NOT create a generic `addRestaurant(list, r)` that accepts a list name parameter. Keep weekday and weekend CRUD methods separate in the context — the explicitness is intentional and matches the existing codebase style.
- **Storing tab state in URL:** Do NOT use URL query params or separate routes for the weekday/weekend tab switch. Client-side `Tabs defaultValue` is sufficient.
- **Putting re-roll exclusion in `pickRandomRestaurant`:** Keep the function a pure random picker. The "different from current" logic belongs in the page component.
- **New context provider:** Do NOT create a `WeekendRestaurantProvider`. Extend the existing `RestaurantContext` — both lists share the same hydration lifecycle.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab switching UI | Custom button group with active state management | shadcn Tabs (`npx shadcn@latest add tabs`) | Radix accessibility (ARIA roles, keyboard nav), consistent styling |
| Cuisine badge on weekend result card | New badge component | Same `inline style={{ backgroundColor: CUISINE_META[r.type].color }}` pattern from page.tsx | Already established project pattern |

**Key insight:** The only genuinely new concern in this phase is adding the shadcn Tabs component. Everything else is a direct extension of established patterns already in the codebase.

## Common Pitfalls

### Pitfall 1: Weekend tab adds to weekday list

**What goes wrong:** If `RestaurantsPage` doesn't use the active tab value to route `addRestaurant` calls to the correct list, adding under the weekend tab silently adds to the weekday list.

**Why it happens:** The form submit handler calls `addRestaurant` which is always the weekday method unless the tab value is threaded through.

**How to avoid:** Extract a `RestaurantListPanel` component that receives the list, CRUD methods, and default restaurants as props. The weekday tab passes weekday props; the weekend tab passes weekend props. The form submit handler always calls the locally-scoped `add` prop.

**Warning signs:** Integration test fails — adding a restaurant under the weekend tab appears in both lists, or only in the weekday list.

### Pitfall 2: useSyncExternalStore hydration guard pattern missed for weekend list

**What goes wrong:** The hydration guard (`isHydrated`) is shared across both lists — one `useSyncExternalStore` call covers both. This is correct. The pitfall is forgetting to guard the weekend localStorage writes with `if (!isHydrated) return` in the weekend `useEffect`.

**Why it happens:** Developer adds the weekend `useEffect` but forgets the guard, causing a server-side crash or SSR mismatch.

**How to avoid:** Copy the existing `useEffect` pattern for `restaurants` exactly when adding the `weekendRestaurants` effect. The `isHydrated` dependency is shared.

**Warning signs:** Hydration error in Next.js dev console; localStorage writes happening before client mounts.

### Pitfall 3: DEFAULT_WEEKEND_RESTAURANTS ID collision

**What goes wrong:** Weekend default restaurants use IDs that collide with weekday restaurant IDs (e.g., both have `'id-1'`).

**Why it happens:** Copying the weekday defaults without changing IDs.

**How to avoid:** Use a distinct ID prefix for weekend defaults, e.g., `'wknd-1'`, `'wknd-2'`, etc.

**Warning signs:** Removing a weekday restaurant by ID accidentally removes a weekend restaurant with the same ID (won't happen in UI since CRUD is separate, but will cause test confusion).

### Pitfall 4: re-roll with single-restaurant pool infinite exclusion

**What goes wrong:** If weekendRestaurants has only 1 entry, filtering out `current` gives an empty pool, causing `pickRandomRestaurant` to throw.

**Why it happens:** Re-roll logic always tries to exclude the current pick.

**How to avoid:** Guard with `pool.length > 1` before filtering. If `pool.length === 1`, re-roll from the full pool (same result, but no error).

**Warning signs:** Error thrown when clicking re-roll button with only 1 weekend restaurant.

### Pitfall 5: Tabs component not installed — import error at build time

**What goes wrong:** `import { Tabs, TabsList, ... } from '@/components/ui/tabs'` fails because `tabs.tsx` doesn't exist yet.

**Why it happens:** The tabs component is NOT currently in the project (confirmed: `ls src/components/ui/` shows 7 files, no `tabs.tsx`).

**How to avoid:** Run `npx shadcn@latest add tabs` as the FIRST step before modifying `restaurants/page.tsx`.

**Warning signs:** Build fails with module-not-found error on the tabs import.

### Pitfall 6: Context type mismatch in existing tests

**What goes wrong:** `restaurants.test.tsx` and `integration.test.tsx` provide a mock context value. After extending `RestaurantContextValue` with weekend fields, the mock object will be missing `weekendRestaurants`, `addWeekendRestaurant`, etc., causing TypeScript errors in existing tests.

**Why it happens:** The `renderWithContext` helper in tests hardcodes the context value shape.

**How to avoid:** Update both test files' mock context objects to include the new weekend fields when extending `RestaurantContextValue`. The mock values can be empty arrays and `vi.fn()` stubs.

**Warning signs:** TypeScript errors in existing test files after context type change. `tsc` catches this before runtime.

## Code Examples

Verified patterns from official sources:

### shadcn Tabs Usage (from official docs)
```typescript
// Source: https://ui.shadcn.com/docs/components/tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

<Tabs defaultValue="weekday">
  <TabsList>
    <TabsTrigger value="weekday">平日餐廳</TabsTrigger>
    <TabsTrigger value="weekend">假日餐廳</TabsTrigger>
  </TabsList>
  <TabsContent value="weekday">
    {/* weekday content */}
  </TabsContent>
  <TabsContent value="weekend">
    {/* weekend content */}
  </TabsContent>
</Tabs>
```

### Radix Tabs Root Props (from official docs)
```typescript
// Source: https://www.radix-ui.com/primitives/docs/components/tabs
// defaultValue: uncontrolled initial tab (use this — no need for controlled value)
// value + onValueChange: controlled mode (not needed here)
// orientation: 'horizontal' (default) | 'vertical'
<Tabs defaultValue="weekday">
```

### Extending readStoredRestaurants to Accept a Key
```typescript
// Source: adapted from existing restaurant-context.tsx
function readStoredRestaurantsFromKey(key: string, defaults: Restaurant[]): Restaurant[] {
  if (typeof window === 'undefined') return defaults
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaults
  } catch {
    return defaults
  }
}
```

### pickRandomRestaurant Pure Function
```typescript
// Source: consistent with existing recommend.ts style
export function pickRandomRestaurant(pool: Restaurant[]): Restaurant {
  if (pool.length === 0) throw new Error('Restaurant pool cannot be empty')
  return pool[Math.floor(Math.random() * pool.length)]
}
```

### Testing pickRandomRestaurant (Vitest pattern)
```typescript
// Source: consistent with recommend.test.ts patterns
import { describe, test, expect } from 'vitest'
import { pickRandomRestaurant } from '@/lib/recommend'
import type { Restaurant } from '@/lib/types'

const pool: Restaurant[] = [
  { id: 'w1', name: '假日餐廳A', type: 'west', price: 400, distance: 1000, rating: 4.5 },
  { id: 'w2', name: '假日餐廳B', type: 'jp',   price: 350, distance: 800,  rating: 4.3 },
]

describe('pickRandomRestaurant', () => {
  test('returns a restaurant from the pool', () => {
    const result = pickRandomRestaurant(pool)
    expect(pool).toContainEqual(result)
  })

  test('throws on empty pool', () => {
    expect(() => pickRandomRestaurant([])).toThrow()
  })

  test('returns the only item when pool has one entry', () => {
    expect(pickRandomRestaurant([pool[0]])).toBe(pool[0])
  })

  test('produces varied results over many calls', () => {
    const bigPool = Array.from({ length: 5 }, (_, i) => ({ ...pool[0], id: `w${i}` }))
    const results = new Set(Array.from({ length: 50 }, () => pickRandomRestaurant(bigPool).id))
    expect(results.size).toBeGreaterThan(1)
  })
})
```

### Testing WeekendPage with Mock Context (RTL pattern)
```typescript
// Source: consistent with restaurants.test.tsx renderWithContext pattern
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RestaurantContext } from '@/lib/restaurant-context'
import WeekendPage from '@/app/weekend/page'
import type { Restaurant } from '@/lib/types'

const mockWeekendRestaurants: Restaurant[] = [
  { id: 'wknd-1', name: '假日燒肉', type: 'jp', price: 500, distance: 1200, rating: 4.5 },
  { id: 'wknd-2', name: '假日火鍋', type: 'chi', price: 350, distance: 900, rating: 4.2 },
]

function renderWeekendPage(weekendRestaurants: Restaurant[] = mockWeekendRestaurants) {
  return render(
    <RestaurantContext
      value={{
        restaurants: [],
        weekendRestaurants,
        isHydrated: true,
        addRestaurant: vi.fn(),
        removeRestaurant: vi.fn(),
        updateRestaurant: vi.fn(),
        addWeekendRestaurant: vi.fn(),
        removeWeekendRestaurant: vi.fn(),
        updateWeekendRestaurant: vi.fn(),
      }}
    >
      <WeekendPage />
    </RestaurantContext>,
  )
}
```

### DEFAULT_WEEKEND_RESTAURANTS Pattern (restaurants.ts)
```typescript
// Source: consistent with existing DEFAULT_RESTAURANTS satisfies pattern
export const DEFAULT_WEEKEND_RESTAURANTS = [
  { id: 'wknd-1', name: '鼎泰豐(信義店)', type: 'chi', price: 600, distance: 3000, rating: 4.7 },
  { id: 'wknd-2', name: '老乾杯(信義店)', type: 'jp',  price: 1500, distance: 2800, rating: 4.6 },
  { id: 'wknd-3', name: '鬍鬚張魯肉飯',   type: 'chi', price: 120,  distance: 500,  rating: 4.1 },
  { id: 'wknd-4', name: '欣葉台菜(中山店)', type: 'chi', price: 500, distance: 1500, rating: 4.4 },
  { id: 'wknd-5', name: '饗食天堂(台北館)', type: 'west', price: 800, distance: 2000, rating: 4.3 },
] satisfies Restaurant[]
```

Note: These are illustrative. The actual restaurant names should be real Taipei restaurants within reasonable weekend travel distance (broader than 1km weekday limit is appropriate since weekends allow more time).

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Context.Provider syntax | `<Context value={...}>` (React 19) | Already used in this project — maintain |
| Separate providers per data type | One provider, multiple state slices | Simpler, already established pattern here |

**Deprecated/outdated:**
- `<RestaurantContext.Provider value={...}>` syntax: replaced by `<RestaurantContext value={...}>` in React 19 — the project already uses the new form, do not revert.

## Open Questions

1. **Shared RestaurantListPanel component vs. duplicated JSX in Tabs**
   - What we know: The weekday and weekend tabs on `/restaurants` need identical table + form UI.
   - What's unclear: Whether to extract a shared `RestaurantListPanel` component or inline duplicate JSX in each `TabsContent`. The current `restaurants/page.tsx` is already 470 lines.
   - Recommendation: Extract `RestaurantListPanel` component to avoid ~350 lines of duplication. Accept that this is a larger refactor of `restaurants/page.tsx` but it's the right call for maintainability.

2. **Save-to-config button for weekend restaurants**
   - What we know: The weekday list has a "Save to config" button (calls `/api/restaurants` to persist to `restaurants.ts`). The weekday button uses `savedIds` to track already-saved items.
   - What's unclear: Should the weekend tab also have a save-to-config button? The success criteria only mention localStorage persistence. The API route only writes to `restaurants.ts`, not a separate `weekend-restaurants.ts`.
   - Recommendation: Skip the save-to-config button for the weekend tab in Phase 6 (out of scope per success criteria). Document as a deferred idea.

3. **Empty state link behavior**
   - What we know: When weekend pool is empty, show a prompt with a link to `/restaurants`.
   - What's unclear: Should the link go to `/restaurants` (weekday tab by default) or `/restaurants?tab=weekend`? The Tabs component uses `defaultValue`, not URL state.
   - Recommendation: Link to `/restaurants` without query params, and add UI text instructing the user to switch to the "假日餐廳" tab. Alternatively, the restaurants page could read a URL param to set the initial tab — but this adds complexity. Keep it simple: just link to `/restaurants`.

## Sources

### Primary (HIGH confidence)
- https://ui.shadcn.com/docs/components/tabs — Tabs component API, install command, usage example
- https://www.radix-ui.com/primitives/docs/components/tabs — Radix Tabs root props (defaultValue, value, onValueChange)
- Codebase direct read: `src/lib/restaurant-context.tsx`, `src/app/restaurants/page.tsx`, `src/components/layout/nav-links.tsx`, `src/lib/recommend.ts`, `src/lib/types.ts`, `src/lib/restaurants.ts`, `__tests__/restaurants.test.tsx`, `__tests__/recommend.test.ts`, `__tests__/integration.test.tsx`

### Secondary (MEDIUM confidence)
- `ls src/components/ui/` — confirmed tabs.tsx does NOT exist yet, install required

### Tertiary (LOW confidence)
- None — all claims verified via official docs or direct codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed via package.json; tabs install via official shadcn CLI
- Architecture: HIGH — patterns read directly from existing codebase files
- Pitfalls: HIGH — derived from direct code inspection (type interface extension, localStorage guard patterns, ID collision risk)
- Code examples: HIGH — all examples adapted directly from existing codebase patterns or official docs

**Research date:** 2026-02-18
**Valid until:** 2026-03-20 (shadcn/radix APIs are stable; codebase patterns won't change between phases)
