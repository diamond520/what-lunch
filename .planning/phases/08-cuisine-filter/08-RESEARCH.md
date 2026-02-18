# Phase 8: Cuisine Filter - Research

**Researched:** 2026-02-19
**Domain:** React state management, localStorage persistence, algorithm filter injection, shadcn/ui Tabs
**Confidence:** HIGH — all findings drawn directly from the existing codebase

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Filter UI presentation
- Colored chips/badges matching each cuisine's existing color from CUISINE_META
- Tap/click a chip to toggle it on/off
- No label/header text above the filter section — chips are self-explanatory
- A small "重置" reset button/link next to the filter area to clear all selections

#### Mode switching UX
- Segmented control (two-segment toggle) above the chips for switching between 排除 and 鎖定 modes
- Labels in Chinese: 排除 / 鎖定
- Default mode on first visit: 排除 (exclude mode)
- Exclude = selected cuisines are removed from the pool
- Lock = only selected cuisines remain in the pool

#### Warning & edge cases
- Inline warning text (yellow/orange) appears below the chips when filtering is too restrictive
- In lock mode with only 1 cuisine type locked: relax the diversity constraint (no-3-consecutive rule) — user explicitly wants that cuisine
- Diversity constraint still applies in exclude mode and when multiple cuisine types are locked

#### Filter behavior & persistence
- Filter mode + selected cuisines persist in localStorage across page reloads
- Changing any filter selection auto-clears the current plan (consistent with existing budget change behavior)
- Filters apply to re-rolls — re-rolling a single day respects the current exclude/lock filter
- Reset button clears all selections and returns to default state (exclude mode, no chips selected)

### Claude's Discretion
- Exact placement of filter section on picker page (above or below budget input)
- Visual treatment for active vs inactive chips (filled/outlined, opacity, etc.)
- Behavior when switching between exclude/lock modes (clear selections or keep them)
- Whether to show live restaurant count as chips change, or only warn on generate
- How to handle partial plan fills when algorithm can't fill all 5 days with current filters

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 8 adds cuisine type filtering to `src/app/page.tsx`. The work falls into three distinct areas: (1) new UI components on the picker page (segmented mode toggle + cuisine chips + reset button + optional warning), (2) localStorage persistence for filter state, and (3) algorithm changes to `generateWeeklyPlan` and `rerollSlot` in `src/lib/recommend.ts` to accept and apply a filter.

The codebase is clean and well-structured. `CUISINE_META` in `src/lib/types.ts` is the single source of truth for cuisine keys, labels, and colors — chips must be derived from it via `Object.entries(CUISINE_META) as [CuisineType, ...][]`. The `Tabs` component (already in the project via radix-ui) is the correct primitive for the segmented 排除/鎖定 toggle. The cuisine badge rendering pattern already exists on both the picker page and the restaurants page using `style={{ backgroundColor: CUISINE_META[r.type].color }}` — the new filter chips follow that same pattern.

The algorithm change is a straightforward pool pre-filter. Both `generateWeeklyPlan` and `rerollSlot` are pure functions that accept a `pool: Restaurant[]` — the caller simply narrows the pool before calling them. The special case for lock mode + single cuisine type (relax diversity constraint) requires a small additional flag passed through to `hasCuisineViolation`. LocalStorage persistence should follow the existing `readStoredRestaurantsFromKey` pattern already established in `restaurant-context.tsx`.

**Primary recommendation:** Derive filter state as two pieces of React state (`filterMode: 'exclude' | 'lock'` and `selectedCuisines: Set<CuisineType>`), persist both in localStorage using a new storage key, compute `filteredPool` inline before calling the algorithm, and pass a `relaxDiversity` flag when lock mode + single cuisine.

---

## Standard Stack

### Core (no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React useState | 19.2.3 (in project) | Filter state management | Already used throughout the app |
| localStorage | Native browser API | Filter persistence | Same pattern as restaurant storage in restaurant-context.tsx |
| radix-ui Tabs | ^1.4.3 (in project) | Segmented mode toggle (排除/鎖定) | Already installed; TabsList+TabsTrigger renders as segmented control |
| Tailwind v4 | ^4 (in project) | Chip visual treatment (active/inactive states) | Already in project |
| shadcn/ui Badge | In project (src/components/ui/badge.tsx) | Base for cuisine chips | Existing component, but inline style needed for dynamic color |

**No new packages required.** All needed primitives are already installed.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tabs as segmented toggle | Custom div+button segmented control | Tabs already exists and has correct `data-[state=active]` styling; no need to hand-roll |
| Inline Set for selectedCuisines | Array | Set gives O(1) has/add/delete; 5 elements makes this trivial, but Set is semantically correct |
| Inline pool filter on page | New algorithm function `applyFilter(pool, mode, selected)` | Inline is simpler for 3 lines; extracting aids testability — recommend extract for testability |

---

## Architecture Patterns

### Recommended Project Structure

No new files strictly required. Additions are:

```
src/
├── app/
│   └── page.tsx              # Add: filter state, localStorage hooks, filteredPool computation, filter UI
└── lib/
    └── recommend.ts          # Modify: generateWeeklyPlan + rerollSlot accept optional relaxDiversity flag
                              # OR: add applyFilter helper (pure function, easily testable)
```

Optionally extract cuisine chip section into a component if the page gets long, but the decisions doc says no new pages, and the existing page is only 131 lines — inline is fine for planning.

### Pattern 1: Tabs as Segmented Control

The existing `Tabs` component (from `src/components/ui/tabs.tsx`) renders a two-segment toggle correctly. The `value` / `onValueChange` props on `TabsPrimitive.Root` make it controlled state.

```typescript
// Source: src/components/ui/tabs.tsx + src/app/restaurants/page.tsx (existing usage)
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Segmented control for 排除 / 鎖定
<Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
  <TabsList>
    <TabsTrigger value="exclude">排除</TabsTrigger>
    <TabsTrigger value="lock">鎖定</TabsTrigger>
  </TabsList>
</Tabs>
```

Note: `TabsContent` is not needed here — the chips always show, the mode toggle only changes semantics. No content panels.

### Pattern 2: Cuisine Chip (toggle button styled as colored badge)

The existing cuisine badge uses `style={{ backgroundColor }}` because Tailwind cannot generate dynamic class names from runtime values. The filter chips must do the same. Active/inactive distinction is done by changing opacity or adding a visual indicator (ring, reduced opacity, line-through — Claude's discretion).

```typescript
// Source: src/app/page.tsx line 81 (existing badge), adapted for toggle chip
{(Object.entries(CUISINE_META) as [CuisineType, { label: string; color: string }][]).map(
  ([key, meta]) => (
    <button
      key={key}
      onClick={() => toggleCuisine(key)}
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white transition-opacity',
        selectedCuisines.has(key) ? 'opacity-100 ring-2 ring-offset-1 ring-current' : 'opacity-40',
      )}
      style={{ backgroundColor: meta.color }}
      aria-pressed={selectedCuisines.has(key)}
    >
      {meta.label}
    </button>
  ),
)}
```

The `aria-pressed` attribute is important for accessibility on toggle buttons.

### Pattern 3: LocalStorage Persistence for Filter State

Follows the exact same pattern as `restaurant-context.tsx`. Two storage keys (or one JSON object). Read on mount, write on change.

```typescript
// Source: src/lib/restaurant-context.tsx lines 24-32 (pattern)
const FILTER_STORAGE_KEY = 'what-lunch-cuisine-filter'

interface StoredFilter {
  mode: FilterMode
  selected: CuisineType[]  // Set serializes to Array for JSON
}

function readStoredFilter(): StoredFilter {
  if (typeof window === 'undefined') return { mode: 'exclude', selected: [] }
  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY)
    return stored ? JSON.parse(stored) : { mode: 'exclude', selected: [] }
  } catch {
    return { mode: 'exclude', selected: [] }
  }
}
```

Critically: `useSyncExternalStore` for hydration guard is already handled by `isHydrated` from `useRestaurants()`. Filter state can use the same `isHydrated` flag — no need for a second `useSyncExternalStore` call. Only read/write localStorage when `isHydrated` is true.

### Pattern 4: Pool Filtering (Algorithm Integration)

The cleanest approach is to extract a pure `applyFilter` helper in `recommend.ts` and call it at the start of both `generateWeeklyPlan` and `rerollSlot`. This keeps the page component clean and makes the logic unit-testable.

```typescript
// New helper in src/lib/recommend.ts
export type FilterMode = 'exclude' | 'lock'

export function applyFilter(
  pool: Restaurant[],
  mode: FilterMode,
  selected: CuisineType[],
): Restaurant[] {
  if (selected.length === 0) return pool
  if (mode === 'exclude') {
    return pool.filter((r) => !selected.includes(r.type))
  }
  // lock mode: only selected cuisines remain
  return pool.filter((r) => selected.includes(r.type))
}
```

The page then calls:
```typescript
function handleGenerate() {
  if (restaurants.length === 0 || isNaN(budget)) return
  const pool = applyFilter(restaurants, filterMode, [...selectedCuisines])
  if (pool.length === 0) return  // warning already shown
  const newPlan = generateWeeklyPlan(pool, budget, { relaxDiversity: shouldRelaxDiversity })
  // ...
}

function handleReroll(index: number) {
  if (!plan) return
  const pool = applyFilter(restaurants, filterMode, [...selectedCuisines])
  const updated = rerollSlot(plan, index, pool)
  // ...
}
```

### Pattern 5: Diversity Relaxation for Single-Cuisine Lock Mode

When lock mode has exactly 1 cuisine type selected, `hasCuisineViolation` would block all placements (all restaurants are the same type). The fix: add a `relaxDiversity` option to `generateWeeklyPlan` and `pickForSlot`/`pickForSlotReroll`.

```typescript
// Modification to recommend.ts
function pickForSlot(
  pool: Restaurant[],
  remainingBudget: number,
  planSoFar: Restaurant[],
  slotIndex: number,
  slotsRemaining: number,
  relaxDiversity = false,   // new parameter
): Restaurant {
  const eligible = pool.filter(
    (r) =>
      r.price <= spendableNow &&
      (relaxDiversity || !hasCuisineViolation(planSoFar, slotIndex, r)),
  )
  // ...
}
```

The `relaxDiversity` flag is `true` when: `filterMode === 'lock' && selectedCuisines.size === 1`.

### Pattern 6: Plan Auto-Clear on Filter Change

Existing precedent: budget change calls `setPlan(null)` — but the current page uses `history` not `plan`. Looking at the actual page.tsx code: it uses `history` array and `selectedIndex`. "Auto-clear plan" means `setHistory([])` and `setSelectedIndex(0)`.

```typescript
// In page.tsx — consistent with budget onChange pattern (line 58-61)
function handleFilterChange(newMode: FilterMode, newSelected: Set<CuisineType>) {
  setFilterMode(newMode)
  setSelectedCuisines(newSelected)
  setHistory([])     // clear plan consistent with budget change behavior
  setSelectedIndex(0)
}
```

### Pattern 7: Warning Computation

Warning is shown when the filtered pool has too few restaurants to reliably fill 5 days.

```typescript
// Computed inline (no state needed — derived value)
const filteredPool = applyFilter(restaurants, filterMode, [...selectedCuisines])
const poolIsEmpty = filteredPool.length === 0
const poolIsThin = filteredPool.length > 0 && filteredPool.length < 3  // or some threshold
const showWarning = poolIsEmpty || poolIsThin
```

Whether to compute this live (as chips change) or only on generate is Claude's discretion. Computing live provides immediate feedback with no extra cost — recommended.

### Anti-Patterns to Avoid

- **Using CSS class names for dynamic cuisine colors:** Tailwind cannot purge/generate dynamic color classes. Always use `style={{ backgroundColor: meta.color }}`. This is already established in the codebase.
- **Storing `Set<CuisineType>` directly in localStorage:** `JSON.stringify(new Set())` returns `'{}'`. Convert to array before storing.
- **Re-reading localStorage on every render:** Read once in state initializer function (`useState(() => readStoredFilter())`), write in `useEffect` triggered by state change — same as restaurant-context.tsx.
- **Calling algorithm with empty pool:** `generateWeeklyPlan` throws on empty pool (line 134 in recommend.ts). Always guard: `if (pool.length === 0) return` before calling.
- **Forgetting to pass filtered pool to rerollSlot:** If `handleReroll` uses the original `restaurants` pool instead of filtered pool, re-rolls will ignore the current filter — a subtle bug.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Segmented mode toggle | Custom CSS toggle component | Tabs (already in project) | Tabs has correct active state styling, keyboard navigation, ARIA attributes built in |
| Cuisine color on chip | Tailwind dynamic class | `style={{ backgroundColor }}` | Tailwind cannot generate classes from runtime values — this pattern is already established in the codebase |
| localStorage JSON parse safety | try/catch inline everywhere | Extract `readStoredFilter()` helper | Mirrors existing `readStoredRestaurantsFromKey` pattern; centralized error handling |

---

## Common Pitfalls

### Pitfall 1: Set Serialization to localStorage
**What goes wrong:** `JSON.stringify(new Set(['chi', 'jp']))` produces `'{}'` — the Set is empty when read back.
**Why it happens:** `JSON.stringify` does not handle Set natively.
**How to avoid:** Store as array: `JSON.stringify({ mode, selected: [...selectedCuisines] })`. Reconstruct as Set on read: `new Set(stored.selected)`.
**Warning signs:** Filter chips appear deselected after reload even though localStorage shows data.

### Pitfall 2: Forgetting to Pass Filtered Pool to rerollSlot
**What goes wrong:** Re-rolling a day can produce a restaurant of an excluded/locked-out cuisine type.
**Why it happens:** `handleReroll` receives `restaurants` from context (full list) and is easy to forget updating.
**How to avoid:** Compute `filteredPool` once above both handlers. Use `filteredPool` consistently in both `handleGenerate` and `handleReroll`.
**Warning signs:** After excluding Japanese cuisine, re-rolling a slot sometimes returns a Japanese restaurant.

### Pitfall 3: Algorithm Throws on Empty Pool
**What goes wrong:** If all cuisines are excluded (or locked to a non-existent cuisine), `applyFilter` returns `[]`. Calling `generateWeeklyPlan([])` throws `'Restaurant pool cannot be empty'`.
**Why it happens:** The guard in `generateWeeklyPlan` throws on empty input (line 134 of recommend.ts).
**How to avoid:** Before calling generate/reroll, check `if (filteredPool.length === 0) return`. The warning UI should have already communicated this state to the user.
**Warning signs:** Uncaught error in console when clicking "產生本週午餐計畫" with all cuisines excluded.

### Pitfall 4: useSyncExternalStore Hydration and localStorage
**What goes wrong:** Reading localStorage during SSR causes hydration mismatch (server has no localStorage).
**Why it happens:** Next.js renders server-side; `window` is undefined.
**How to avoid:** Use `isHydrated` from `useRestaurants()` before writing to localStorage. Use lazy initializer for `useState` that guards against SSR: `if (typeof window === 'undefined') return defaultValue`. This exact pattern exists in `restaurant-context.tsx` lines 24-31.
**Warning signs:** Hydration mismatch errors in console on first load.

### Pitfall 5: Mode Switch Does Not Clear History (plan auto-clear)
**What goes wrong:** User switches from exclude to lock mode — the existing plan was generated under different filter semantics and shows stale/incorrect data.
**Why it happens:** Mode change does not trigger the same "filter changed" path as chip toggle.
**How to avoid:** Both mode changes and chip toggles should call the same `handleFilterChange` function that resets history.
**Warning signs:** Plan shows restaurants that do not match the current filter mode.

### Pitfall 6: Diversity Relaxation Applied in Wrong Cases
**What goes wrong:** Relaxing diversity in exclude mode (where multiple cuisines still exist) allows 3+ consecutive same-cuisine days unintentionally.
**Why it happens:** Passing `relaxDiversity=true` too broadly.
**How to avoid:** Only set `relaxDiversity = filterMode === 'lock' && selectedCuisines.size === 1`. This matches the user decision exactly.
**Warning signs:** Exclude mode with one cuisine excluded produces plans with 3 identical consecutive days.

---

## Code Examples

### Reading Filter State from localStorage (initializer pattern)

```typescript
// Source: mirrors restaurant-context.tsx readStoredRestaurantsFromKey (line 24-32)
const FILTER_STORAGE_KEY = 'what-lunch-cuisine-filter'

type FilterMode = 'exclude' | 'lock'

interface StoredFilter {
  mode: FilterMode
  selected: CuisineType[]
}

function readStoredFilter(): StoredFilter {
  if (typeof window === 'undefined') return { mode: 'exclude', selected: [] }
  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY)
    if (!stored) return { mode: 'exclude', selected: [] }
    const parsed = JSON.parse(stored) as StoredFilter
    return parsed
  } catch {
    return { mode: 'exclude', selected: [] }
  }
}
```

### Writing Filter State to localStorage (effect pattern)

```typescript
// Source: mirrors restaurant-context.tsx useEffect (lines 49-57)
useEffect(() => {
  if (!isHydrated) return
  try {
    localStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify({ mode: filterMode, selected: [...selectedCuisines] }),
    )
  } catch {
    // Ignore storage errors
  }
}, [filterMode, selectedCuisines, isHydrated])
```

### State Initialization with lazy initializer

```typescript
// Lazy initializer reads localStorage once on mount
const [filterMode, setFilterMode] = useState<FilterMode>(() => readStoredFilter().mode)
const [selectedCuisines, setSelectedCuisines] = useState<Set<CuisineType>>(
  () => new Set(readStoredFilter().selected),
)
```

### Warning Logic (derived, no state)

```typescript
// Derived value — no useState needed
const filteredPool = useMemo(
  () => applyFilter(restaurants, filterMode, [...selectedCuisines]),
  [restaurants, filterMode, selectedCuisines],
)
const showWarning = isHydrated && filteredPool.length < 5  // fewer than 5 days needed

// Or inline (simpler, given this app has no complex memoization):
const filteredPool = applyFilter(restaurants, filterMode, [...selectedCuisines])
const showWarning = isHydrated && filteredPool.length < 5
```

### Object.entries(CUISINE_META) cast (established pattern)

```typescript
// Source: src/app/restaurants/page.tsx lines 217-219 (existing pattern)
(Object.entries(CUISINE_META) as [CuisineType, { label: string; color: string }][]).map(
  ([key, meta]) => ( /* render chip */ )
)
```

---

## Algorithm Change Details

### Current signatures

```typescript
// src/lib/recommend.ts (current)
export function generateWeeklyPlan(pool: Restaurant[], weeklyBudget: number): WeeklyPlan
export function rerollSlot(plan: WeeklyPlan, slotIndex: number, pool: Restaurant[]): WeeklyPlan
```

### Required changes

Two approaches:

**Option A (recommended): Filter at call site, pass flag for diversity**

```typescript
// recommend.ts — add relaxDiversity option
export function generateWeeklyPlan(
  pool: Restaurant[],
  weeklyBudget: number,
  options?: { relaxDiversity?: boolean },
): WeeklyPlan

// page.tsx — caller filters pool and computes flag
const relaxDiversity = filterMode === 'lock' && selectedCuisines.size === 1
const pool = applyFilter(restaurants, filterMode, [...selectedCuisines])
const newPlan = generateWeeklyPlan(pool, budget, { relaxDiversity })
```

**Option B: Pass filter params directly to algorithm**

```typescript
export function generateWeeklyPlan(
  pool: Restaurant[],
  weeklyBudget: number,
  filter?: { mode: FilterMode; selected: CuisineType[] },
): WeeklyPlan
```

Option A is preferred because it keeps `generateWeeklyPlan` unaware of filter semantics — the pool arrives pre-filtered, and `relaxDiversity` is a simple boolean. The algorithm does not need to know about FilterMode.

### hasCuisineViolation modification

```typescript
// Current (recommend.ts line 11)
function hasCuisineViolation(plan, slotIndex, candidate): boolean

// Modified — add relaxDiversity parameter
function hasCuisineViolation(
  plan: Restaurant[],
  slotIndex: number,
  candidate: Restaurant,
  relaxDiversity = false,
): boolean {
  if (relaxDiversity) return false  // single-cuisine lock: no diversity constraint
  // existing logic unchanged
}
```

---

## Claude's Discretion Recommendations

These are open questions the user explicitly left to Claude. Recommendations based on codebase patterns and UX reasoning:

### Filter placement: above or below budget input?
**Recommendation: Below the budget input row, above the generate button's row — or in a second row below the budget row.**
The budget input and generate button are already in a `flex items-center gap-4 mb-6` row. Adding the filter section as a new `div` below this row (before the plan grid) keeps the page flow: configure budget → configure filter → generate.

### Visual treatment for active vs inactive chips
**Recommendation: Active = full opacity + ring; Inactive = 40% opacity, no ring.**
```
active:   opacity-100, ring-2 ring-offset-1, ring color matches chip color
inactive: opacity-40
```
This is cheap (Tailwind only), works in both light/dark mode, and is consistent with disabled states used elsewhere in the project (`disabled:opacity-50`).

### Mode switch: clear selections or keep them?
**Recommendation: Keep selections when switching modes.**
The user may be exploring "what if I lock these vs exclude these" with the same set — retaining selections lets them compare. Also, clearing on mode switch would make the reset button less useful.

### Live restaurant count vs warn on generate only?
**Recommendation: Live warning, not just on generate.**
Computing `filteredPool.length` is O(n) on 13 restaurants — essentially free. Showing a live warning when `filteredPool.length < 5` gives immediate feedback and prevents confusion when the user hits generate on an infeasible filter set.

### How to handle partial plan fills (fewer than 5 available)?
**Recommendation: Show warning text "目前篩選條件下只有 N 家餐廳，可能無法填滿 5 天" when filteredPool.length < 5. Allow generate anyway (graceful fallback in algorithm handles it by repeating restaurants). Do not block generation.**
The existing algorithm already handles thin pools gracefully via fallback chains (lines 64-76 in recommend.ts). The warning informs without blocking.

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Context.Provider syntax (React <19) | `<Context value={...}>` (React 19) | Project already uses React 19 pattern — maintain consistency |
| `useState(initialValue)` for localStorage | `useState(() => readFromStorage())` lazy initializer | Lazy initializer prevents SSR issues — use this pattern |

---

## Open Questions

1. **Warning threshold: < 5 restaurants or < some other threshold?**
   - What we know: The algorithm needs exactly 5 picks, so technically < 5 restaurants guarantees repeats, but the algorithm handles repeats gracefully.
   - What's unclear: Should the warning trigger at < 5 (guarantees repeat), < 3 (very thin), or < 1 (truly empty)?
   - Recommendation: Warn at < 5 (guarantees restaurant repeats if cuisine constraint is also active) — user decision was "if filtering leaves too few restaurants to fill 5 days, a clear warning is shown." < 5 is the clearest threshold for "can't fill 5 days without repeats."

2. **Should the filter section be extracted to its own component?**
   - What we know: `page.tsx` is 131 lines; after filter UI is added it could reach ~200 lines.
   - What's unclear: How much UI is involved (mode toggle + 5 chips + reset + warning = ~30 lines of JSX).
   - Recommendation: Keep inline in page.tsx — 200 lines is not excessive, and the filter state is tightly coupled to the page's generate/reroll handlers. Extract only if it grows beyond ~250 lines.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase reading: `src/lib/recommend.ts` — algorithm structure, function signatures, hasCuisineViolation, fallback chains
- Direct codebase reading: `src/app/page.tsx` — existing picker page structure, state management, budget clear pattern
- Direct codebase reading: `src/lib/restaurant-context.tsx` — localStorage read/write pattern, isHydrated via useSyncExternalStore
- Direct codebase reading: `src/lib/types.ts` — CUISINE_META, CuisineType, Object.entries cast pattern
- Direct codebase reading: `src/components/ui/tabs.tsx` — Tabs API, controlled value/onValueChange
- Direct codebase reading: `src/components/ui/badge.tsx` — Badge component API
- Direct codebase reading: `src/components/ui/button.tsx` — Button variants (ghost, link for reset button)
- Direct codebase reading: `__tests__/recommend.test.ts` — existing test patterns for algorithm unit tests
- Direct codebase reading: `__tests__/integration.test.tsx` — integration test patterns (localStorage mock, renderHomePage helper)
- Direct codebase reading: `package.json` — confirmed no new dependencies needed (Tabs, Badge, Button, Tailwind all present)

### Secondary (MEDIUM confidence)
None needed — all findings are from the codebase itself.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json and component files
- Architecture: HIGH — derived directly from existing patterns in the codebase
- Pitfalls: HIGH — each pitfall traces to a specific file and line in the codebase
- Algorithm changes: HIGH — recommend.ts is fully read and understood

**Research date:** 2026-02-19
**Valid until:** Changes if recommend.ts, page.tsx, or restaurant-context.tsx are modified before planning
