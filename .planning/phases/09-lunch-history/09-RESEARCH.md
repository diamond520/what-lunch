# Phase 9: Lunch History - Research

**Researched:** 2026-02-19
**Domain:** localStorage persistence, recommendation algorithm scoring, React context patterns, Next.js App Router page
**Confidence:** HIGH — all findings drawn directly from the existing codebase

---

## Summary

Phase 9 adds persistent lunch history that tracks confirmed weekly plans and uses that history to deprioritize recently visited restaurants in future recommendations. The work falls into four areas: (1) a new `LunchHistory` data model and localStorage persistence layer, (2) a new `/history` page showing past picks with dates and individual-entry deletion, (3) a modified recommendation algorithm in `recommend.ts` that down-weights recently visited restaurants, and (4) wiring the "confirm plan" action on `src/app/page.tsx` to write picks to history.

The codebase has clean, well-established patterns for all four areas. The localStorage read/write pattern from `restaurant-context.tsx` is the template for the history persistence layer. The `generateWeeklyPlan` and `rerollSlot` functions in `recommend.ts` are pure functions that accept a pool — the history-based deprioritization extends this pattern by reordering or filtering the pool before calling those functions. The new `/history` page follows the same App Router file structure as `/weekend/page.tsx`. No new npm packages are needed.

The most nuanced decision is how to implement deprioritization. The success criteria says "deprioritize" (not "exclude") — so recently visited restaurants should still appear if the pool is otherwise exhausted, but should be disfavored. The cleanest approach is to sort recently visited restaurants to the back of the pool before the algorithm runs. Since the algorithm picks randomly from the eligible set, sorting is not sufficient — instead, a weighted approach (filter recently visited out of the primary pool, keep them as fallback) matches the existing multi-level fallback architecture in `recommend.ts`.

**Primary recommendation:** Create `src/lib/history.ts` for all history logic (types, localStorage read/write, business day calculation), add a `HistoryContext` or extend `RestaurantContext` with history operations, add a "確認計畫" button on `src/app/page.tsx` that writes confirmed plans to history, create `src/app/history/page.tsx` for the history view, and pass a `recentlyVisited` set to a modified `generateWeeklyPlan` that excludes recently visited restaurants from the primary pool while retaining them as the last fallback.

---

## Standard Stack

### Core (no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React useState / useContext | 19.2.3 (in project) | History state management | Already used throughout the app |
| localStorage | Native browser API | History persistence | Same pattern as restaurant storage in `restaurant-context.tsx` |
| Date (native) | Built-in | Business day calculation, date formatting | No library needed for the simple N-business-day lookback |
| lucide-react | ^0.574.0 (in project) | Trash2 icon for delete, Clock/History icon for nav | Already installed |
| shadcn/ui Table | In project (`src/components/ui/table.tsx`) | History list display | Already used in restaurants page |
| shadcn/ui Button | In project (`src/components/ui/button.tsx`) | Clear history, delete entry | Already used everywhere |

**No new packages required.** All needed primitives are already installed.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native Date for business days | date-fns | date-fns is not installed; the N-business-day calculation is ~15 lines of code; no library justified |
| Separate HistoryContext | Extend RestaurantContext | Separate context is cleaner — history is a different concern than the restaurant list; avoids bloating RestaurantContext further |
| Deprioritize by scoring | Deprioritize by pool split | Pool split (recent = fallback only) is architecturally cleaner and tests more naturally against the existing algorithm structure |

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── page.tsx              # Modify: add "確認計畫" button, import history context
│   └── history/
│       └── page.tsx          # New: history page showing past picks, clear/delete
├── lib/
│   ├── history.ts            # New: LunchHistoryEntry type, localStorage read/write, business day logic
│   ├── history-context.tsx   # New: HistoryContext, HistoryProvider, useHistory hook
│   └── recommend.ts          # Modify: generateWeeklyPlan accepts recentlyVisited set
└── app/
    └── layout.tsx            # Modify: wrap with HistoryProvider
__tests__/
├── history.test.ts           # New: unit tests for business day logic, history filtering
└── integration.test.tsx      # Optionally extend: test confirm plan button
```

### Pattern 1: History Data Model

The history entry records which restaurant was visited on which date. Recording individual restaurant IDs (not the whole weekly plan object) allows the algorithm to check "has restaurant X been visited in the last N business days?" efficiently.

```typescript
// Source: modeled after WeeklyPlan in src/lib/recommend.ts and Restaurant in src/lib/types.ts

// src/lib/history.ts
export interface LunchHistoryEntry {
  id: string           // crypto.randomUUID() — same pattern as WeeklyPlan.id
  date: string         // ISO date string (YYYY-MM-DD) — day confirmed, not time
  restaurantId: string // Restaurant.id — link back to the restaurant pool
  restaurantName: string  // Denormalized: restaurant may be removed from pool later
}
```

Rationale for denormalizing `restaurantName`: if a restaurant is later deleted from the pool, the history entry should still show a human-readable name. This is the same problem solved by every history/audit log system.

### Pattern 2: LocalStorage Persistence (mirrors restaurant-context.tsx exactly)

```typescript
// Source: src/lib/restaurant-context.tsx lines 24-32 (readStoredRestaurantsFromKey pattern)
// src/lib/history.ts

const HISTORY_STORAGE_KEY = 'what-lunch-history'
const MAX_HISTORY_ENTRIES = 100  // prevent unbounded growth

export function readHistory(): LunchHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
    return stored ? (JSON.parse(stored) as LunchHistoryEntry[]) : []
  } catch {
    return []
  }
}

export function writeHistory(entries: LunchHistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}
```

### Pattern 3: HistoryContext (mirrors RestaurantContext structure)

```typescript
// Source: src/lib/restaurant-context.tsx (structural template)
// src/lib/history-context.tsx
'use client'

import { createContext, useContext, useState, useEffect, useSyncExternalStore } from 'react'
import type { LunchHistoryEntry } from './history'
import { readHistory, writeHistory } from './history'

interface HistoryContextValue {
  entries: LunchHistoryEntry[]
  isHydrated: boolean
  addEntries: (newEntries: LunchHistoryEntry[]) => void
  removeEntry: (id: string) => void
  clearHistory: () => void
}

export const HistoryContext = createContext<HistoryContextValue | null>(null)

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<LunchHistoryEntry[]>(readHistory)
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  useEffect(() => {
    if (!isHydrated) return
    writeHistory(entries)
  }, [entries, isHydrated])

  function addEntries(newEntries: LunchHistoryEntry[]) {
    setEntries((prev) => [...newEntries, ...prev].slice(0, MAX_HISTORY_ENTRIES))
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function clearHistory() {
    setEntries([])
  }

  return (
    <HistoryContext value={{ entries, isHydrated, addEntries, removeEntry, clearHistory }}>
      {children}
    </HistoryContext>
  )
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext)
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider')
  return ctx
}
```

Note: React 19 context uses `<HistoryContext value={...}>` not `<HistoryContext.Provider value={...}>` — this is already established in RestaurantContext.

### Pattern 4: Business Day Calculation

"N business days ago" means skip Saturdays and Sundays when counting backwards. The success criteria says "configurable, default 5 business days."

```typescript
// src/lib/history.ts

export const DEFAULT_LOOKBACK_DAYS = 5  // business days

export function businessDaysAgo(n: number, from: Date = new Date()): Date {
  // Returns the calendar date that is n business days before `from`
  const result = new Date(from)
  result.setHours(0, 0, 0, 0)
  let remaining = n
  while (remaining > 0) {
    result.setDate(result.getDate() - 1)
    const day = result.getDay()
    if (day !== 0 && day !== 6) {
      remaining--
    }
  }
  return result
}

export function getRecentlyVisitedIds(
  entries: LunchHistoryEntry[],
  lookbackDays: number = DEFAULT_LOOKBACK_DAYS,
): Set<string> {
  const cutoff = businessDaysAgo(lookbackDays)
  const cutoffStr = cutoff.toISOString().slice(0, 10)  // YYYY-MM-DD
  return new Set(
    entries
      .filter((e) => e.date >= cutoffStr)
      .map((e) => e.restaurantId),
  )
}
```

Storing dates as YYYY-MM-DD strings allows lexicographic comparison (`>=`) without parsing — clean and fast.

### Pattern 5: Algorithm Deprioritization (pool-split approach)

The requirement says "deprioritize" not "exclude." The cleanest mechanism is to split the pool into two tiers: (1) not recently visited (primary pool), (2) recently visited (fallback). Pass the primary pool to `generateWeeklyPlan`. If the primary pool is empty, pass the full pool (graceful degradation).

The existing algorithm already has a multi-level fallback structure in `pickForSlot`. The pool-split happens at the call site in `page.tsx`, not inside `recommend.ts` — keeping the algorithm unaware of history concerns.

```typescript
// src/app/page.tsx — handleGenerate modification
function getEffectivePool(
  restaurants: Restaurant[],
  recentlyVisited: Set<string>,
): Restaurant[] {
  // Primary pool: not recently visited
  const fresh = restaurants.filter((r) => !recentlyVisited.has(r.id))
  // If filter would empty the pool, fall back to full list (always generate a plan)
  return fresh.length > 0 ? fresh : restaurants
}

// In handleGenerate:
const recentIds = getRecentlyVisitedIds(entries, lookbackDays)
const effectivePool = getEffectivePool(restaurants, recentIds)
const newPlan = generateWeeklyPlan(effectivePool, budget)
```

**Note on Phase 8 interaction:** After Phase 8 lands, `generateWeeklyPlan` will accept a `relaxDiversity` option and the call site will use `applyFilter` before calling it. Phase 9 adds history-based pool splitting as another pre-processing step, applied after `applyFilter`:

```typescript
// Phase 8 + Phase 9 combined call site
const cuisineFiltered = applyFilter(restaurants, filterMode, [...selectedCuisines])
const recentIds = getRecentlyVisitedIds(entries, lookbackDays)
const effectivePool = getEffectivePool(cuisineFiltered, recentIds)
const newPlan = generateWeeklyPlan(effectivePool, budget, { relaxDiversity })
```

### Pattern 6: Confirming a Plan (writing to history)

The "confirm plan" action needs a button on the picker page. When clicked, all 5 days of the current plan become history entries with today's date mapped to each corresponding weekday.

Two date assignment approaches:
- **Option A (recommended):** Assign the actual calendar dates for the upcoming Mon-Fri based on today.
- **Option B (simpler):** Record a single "week of" date for all 5 entries using today's date.

Option A is more correct for the "N business days lookback" calculation. Option B is simpler to implement. **Recommend Option A** since it makes the history meaningful for the user and the lookback calculation accurate.

```typescript
// src/lib/history.ts — helper for generating entries from a plan

export function planToHistoryEntries(plan: WeeklyPlan): LunchHistoryEntry[] {
  // Find the next Monday (or today if already Monday)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayOfWeek = today.getDay()  // 0=Sun, 1=Mon, ..., 6=Sat
  const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + daysToMonday)

  return plan.days.map((r, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)  // Mon, Tue, Wed, Thu, Fri
    return {
      id: crypto.randomUUID(),
      date: date.toISOString().slice(0, 10),  // YYYY-MM-DD
      restaurantId: r.id,
      restaurantName: r.name,
    }
  })
}
```

**Alternative simpler approach:** If assigning future dates feels wrong (plan not confirmed yet = future dates), use the current date for all 5 entries. The lookback will still be correct; the history display will just show all 5 as the same date. Document this as a known simplification.

**Recommendation:** Use today's date for all 5 entries (Option B) — simpler, avoids the "are we confirming a future week or current week?" ambiguity, and the lookback still works correctly. The history page shows "confirmed on [date]" not "eaten on [date]."

### Pattern 7: History Page Structure

Follows `/weekend/page.tsx` exactly — same file structure, same hydration guard, same container layout.

```typescript
// src/app/history/page.tsx
'use client'

import { useHistory } from '@/lib/history-context'
import { useRestaurants } from '@/lib/restaurant-context'
import { CUISINE_META } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export default function HistoryPage() {
  const { entries, isHydrated, removeEntry, clearHistory } = useHistory()

  if (!isHydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">午餐歷史</h1>
      </div>
    )
  }

  // render entries grouped by confirmation date or listed chronologically
}
```

### Pattern 8: Nav Link Addition

Following the existing pattern in `src/components/layout/nav-links.tsx`:

```typescript
// Source: src/components/layout/nav-links.tsx (established pattern)
const NAV_ITEMS = [
  { href: '/', label: '今日推薦' },
  { href: '/restaurants', label: '餐廳管理' },
  { href: '/weekend', label: '假日推薦' },
  { href: '/history', label: '午餐歷史' },  // ADD THIS
] as const
```

### Pattern 9: Configurable Lookback Days

The success criteria says "configurable, default 5 business days." Configurable via UI on the history page (not stored in localStorage necessarily — user preference). A simple number input or select on the history page, or a dedicated setting on the picker page. Given the app's simplicity, store in localStorage for persistence across reloads.

```typescript
// In history.ts or a new settings module
const LOOKBACK_STORAGE_KEY = 'what-lunch-history-lookback'
const DEFAULT_LOOKBACK_DAYS = 5

export function readLookbackDays(): number {
  if (typeof window === 'undefined') return DEFAULT_LOOKBACK_DAYS
  try {
    const stored = localStorage.getItem(LOOKBACK_STORAGE_KEY)
    const n = stored ? parseInt(stored, 10) : DEFAULT_LOOKBACK_DAYS
    return isNaN(n) || n < 1 ? DEFAULT_LOOKBACK_DAYS : n
  } catch {
    return DEFAULT_LOOKBACK_DAYS
  }
}
```

### Anti-Patterns to Avoid

- **Storing full Restaurant objects in history:** Restaurant details may change. Store `restaurantId` + `restaurantName` only; look up current details from the pool when needed.
- **Using Date.toLocaleDateString() for storage:** Locale-dependent, non-sortable. Always store as YYYY-MM-DD ISO strings for storage; format for display in the UI.
- **Mutating history in recommend.ts:** The algorithm should remain pure. All history concerns stay in the call site (page.tsx) and the new history module.
- **Running the business-day lookback on every render:** Compute `recentlyVisitedIds` once when needed (in handleGenerate), not in every render cycle.
- **Not handling the empty-pool case:** If ALL restaurants were visited recently and the cuisine filter also applies, `getEffectivePool` must still return a non-empty pool.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting for display | Custom format function | `new Date(str).toLocaleDateString('zh-TW')` | Native Intl handles TW locale correctly |
| History list UI | Custom table | shadcn/ui Table (already in project) | Consistent with restaurants page |
| History entry deletion | Custom confirmation dialog | Inline button with direct delete | App has no confirmation dialogs anywhere; consistency |
| Generating IDs for history entries | Custom ID scheme | `crypto.randomUUID()` | Same as WeeklyPlan.id; already used |

---

## Common Pitfalls

### Pitfall 1: Restaurant Deleted from Pool After History Entry
**What goes wrong:** History entry references a `restaurantId` that no longer exists in the restaurant pool. Algorithm tries to look up the restaurant and finds nothing.
**Why it happens:** History entries persist; pool entries are deletable.
**How to avoid:** Denormalize `restaurantName` in the history entry. For the deprioritization set, a missing `restaurantId` in the pool is harmless — it just won't match anything in the `filter` call.
**Warning signs:** History page shows blank restaurant names.

### Pitfall 2: Date Comparison Subtleties (Timezone)
**What goes wrong:** A restaurant visited "today" at 11pm appears not recently visited on the next calendar day because `new Date().toISOString()` returns UTC time, which may be the previous day in UTC+8.
**Why it happens:** ISO strings from `new Date().toISOString()` are UTC; Taiwan is UTC+8.
**How to avoid:** Use a local date string for storage: `new Date().toLocaleDateString('en-CA')` returns YYYY-MM-DD in local timezone, or compute manually:
```typescript
const now = new Date()
const localDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
```
This is the correct approach for a Taiwan-based app.
**Warning signs:** Restaurants visited today are not being deprioritized tomorrow morning.

### Pitfall 3: History Grows Without Bound
**What goes wrong:** After months of use, history array in localStorage grows to thousands of entries.
**Why it happens:** No pruning logic.
**How to avoid:** Cap at `MAX_HISTORY_ENTRIES = 100` on `addEntries`. Alternatively, prune entries older than 30 days on read. Both approaches are simple.
**Warning signs:** localStorage quota exceeded errors; JSON parse becomes slow.

### Pitfall 4: useSyncExternalStore Hydration — Same as Existing Pattern
**What goes wrong:** Reading localStorage during SSR causes hydration mismatch.
**Why it happens:** `window` is undefined during SSR.
**How to avoid:** Use lazy initializer for `useState`: `useState<LunchHistoryEntry[]>(readHistory)`. `readHistory()` guards `typeof window === 'undefined'`. This exact pattern is established in `restaurant-context.tsx`.
**Warning signs:** Hydration mismatch errors in browser console on first load.

### Pitfall 5: Confirm Button Writes History for the Wrong Plan
**What goes wrong:** User generates a plan, rerolls several days, then hits "確認". History should record the final (post-reroll) plan, not the original.
**Why it happens:** If `handleConfirm` reads from a stale closure over the original plan.
**How to avoid:** `handleConfirm` should read from the current `plan` variable in state (already the updated post-reroll plan). This is naturally correct if the confirm button calls `addEntries(planToHistoryEntries(plan))`.
**Warning signs:** History shows different restaurants than what the user actually confirmed.

### Pitfall 6: Phase 8 Interaction — Empty Pool After Both Filters Applied
**What goes wrong:** User has cuisine filter active (e.g., lock mode: only Japanese) and all Japanese restaurants were visited recently. After both filters apply, effective pool is empty.
**Why it happens:** Cuisine filter narrows pool, then history filter removes remaining entries.
**How to avoid:** In `getEffectivePool`, fall back to the cuisine-filtered pool (not the full pool) when the history-filtered pool is empty. The cuisine filter (Phase 8) takes precedence; history deprioritization is a softer constraint.
**Warning signs:** `generateWeeklyPlan` throws "Restaurant pool cannot be empty."

### Pitfall 7: Lookback Config Shown in Wrong Place
**What goes wrong:** The "configurable N days" setting is buried and users can't find it.
**Why it happens:** No obvious home for settings in this app.
**How to avoid:** Put the lookback configuration on the history page itself, near the clear button. The history page is where the user thinks about history settings.
**Warning signs:** User doesn't know the lookback window can be changed.

---

## Code Examples

### Business Day Lookback (correct timezone handling)

```typescript
// src/lib/history.ts
function todayLocalDate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function businessDaysAgo(n: number): string {
  // Returns YYYY-MM-DD string that is n business days before today (local time)
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  let remaining = n
  while (remaining > 0) {
    date.setDate(date.getDate() - 1)
    const day = date.getDay()
    if (day !== 0 && day !== 6) remaining--  // skip Sun=0, Sat=6
  }
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d2 = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d2}`
}

export function getRecentlyVisitedIds(
  entries: LunchHistoryEntry[],
  lookbackDays: number = DEFAULT_LOOKBACK_DAYS,
): Set<string> {
  const cutoffDate = businessDaysAgo(lookbackDays)  // YYYY-MM-DD, lexicographically comparable
  return new Set(
    entries
      .filter((e) => e.date >= cutoffDate)
      .map((e) => e.restaurantId),
  )
}
```

### Pool Split for Deprioritization

```typescript
// src/app/page.tsx or src/lib/history.ts (pure function, testable)
export function splitPoolByHistory(
  pool: Restaurant[],
  recentlyVisited: Set<string>,
): { primary: Restaurant[]; fallback: Restaurant[] } {
  const primary = pool.filter((r) => !recentlyVisited.has(r.id))
  const fallback = pool.filter((r) => recentlyVisited.has(r.id))
  return { primary, fallback }
}

// In handleGenerate (page.tsx):
function handleGenerate() {
  if (restaurants.length === 0 || isNaN(budget)) return
  // Phase 8: apply cuisine filter
  const cuisineFiltered = applyFilter(restaurants, filterMode, [...selectedCuisines])
  // Phase 9: deprioritize recently visited
  const recentIds = getRecentlyVisitedIds(entries, lookbackDays)
  const { primary } = splitPoolByHistory(cuisineFiltered, recentIds)
  const effectivePool = primary.length > 0 ? primary : cuisineFiltered  // fallback to cuisine-filtered
  if (effectivePool.length === 0) return
  const relaxDiversity = filterMode === 'lock' && selectedCuisines.size === 1
  const newPlan = generateWeeklyPlan(effectivePool, budget, { relaxDiversity })
  setHistory((prev) => [newPlan, ...prev].slice(0, MAX_HISTORY))
  setSelectedIndex(0)
}
```

### Confirm Plan Button Action

```typescript
// In src/app/page.tsx
function handleConfirm() {
  if (!plan) return
  const today = todayLocalDate()
  const newEntries: LunchHistoryEntry[] = plan.days.map((r) => ({
    id: crypto.randomUUID(),
    date: today,
    restaurantId: r.id,
    restaurantName: r.name,
  }))
  addEntries(newEntries)
}

// In JSX (next to the plan display):
{plan !== null && (
  <Button onClick={handleConfirm} variant="default" className="mt-4">
    確認本週計畫
  </Button>
)}
```

### History Page Display (grouped by date)

```typescript
// src/app/history/page.tsx — group entries by date for readability
const grouped = entries.reduce<Record<string, LunchHistoryEntry[]>>((acc, e) => {
  if (!acc[e.date]) acc[e.date] = []
  acc[e.date].push(e)
  return acc
}, {})

const sortedDates = Object.keys(grouped).sort().reverse()  // most recent first

// Render:
{sortedDates.map((date) => (
  <div key={date} className="mb-6">
    <h2 className="text-base font-medium text-muted-foreground mb-2">
      {new Date(date + 'T00:00:00').toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    </h2>
    {grouped[date].map((entry) => (
      <div key={entry.id} className="flex items-center justify-between py-2 border-b">
        <span>{entry.restaurantName}</span>
        <Button variant="ghost" size="icon" onClick={() => removeEntry(entry.id)}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    ))}
  </div>
))}
```

Note: `new Date(date + 'T00:00:00')` — append local time to avoid UTC parsing shifting the date by one day.

### localStorage Key Constants

```typescript
// src/lib/history.ts
export const HISTORY_STORAGE_KEY = 'what-lunch-history'
export const LOOKBACK_STORAGE_KEY = 'what-lunch-history-lookback'
export const MAX_HISTORY_ENTRIES = 100
export const DEFAULT_LOOKBACK_DAYS = 5
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| `Context.Provider` (React <19) | `<Context value={...}>` (React 19) | Project already uses React 19 pattern — new HistoryContext must use same syntax |
| `useState(initialValue)` for localStorage | `useState(() => readHistory())` lazy initializer | Lazy initializer prevents SSR issues — use this pattern |
| `date.toISOString().slice(0,10)` for local date | Explicit local date construction | `toISOString()` is UTC; Taiwan is UTC+8, causes off-by-one errors at day boundaries |

---

## Open Questions

1. **Date of history entry: "confirmed today" vs "assigned to Mon-Fri of the week"**
   - What we know: The picker generates a weekly plan for Mon-Fri. When a user "confirms" it, they may be looking at next week's plan.
   - What's unclear: Should each history entry carry the date the plan was confirmed, or the projected lunch date?
   - Recommendation: Use today's date for all 5 entries (simpler, unambiguous). The history page label is "確認於 [date]" not "用餐於 [date]". The lookback calculation still works correctly because confirmed-today = visited-today for deprioritization purposes.

2. **Where should the lookback days config live?**
   - What we know: The history page is the natural home. The picker page is where the deprioritization effect is felt.
   - What's unclear: Should the input be on the history page or the picker page?
   - Recommendation: History page, near the top with a label like "避免近期 [N] 個工作日內推薦". This keeps the picker page clean.

3. **Should "重抽" (reroll) also respect history?**
   - What we know: Phase 8 established that reroll respects the cuisine filter. Consistency suggests reroll should also respect history.
   - What's unclear: Is this scope for Phase 9 or a later phase?
   - Recommendation: Yes, include in Phase 9. The implementation is trivial — `handleReroll` already calls `rerollSlot(plan, index, pool)`. Change `pool` to `effectivePool` (same as handleGenerate). Consistent behavior is important.

4. **Maximum history entries and pruning strategy**
   - What we know: Unbounded growth is a problem. 100 entries = ~20 weeks of 5 entries each.
   - What's unclear: Is 100 enough? Is date-based pruning (older than 30 days) better?
   - Recommendation: Cap at 100 entries (FIFO, oldest first discarded). The lookback window is max 5 business days ≈ 1 week, so keeping 4+ weeks of history provides ample data. A hard cap is simpler than date-based pruning.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase reading: `src/lib/restaurant-context.tsx` — localStorage read/write pattern, useSyncExternalStore hydration guard, React 19 context syntax
- Direct codebase reading: `src/lib/recommend.ts` — WeeklyPlan interface, generateWeeklyPlan/rerollSlot signatures, pool-based algorithm
- Direct codebase reading: `src/app/page.tsx` — picker page structure, history array pattern (lines 17-32), handleGenerate/handleReroll structure
- Direct codebase reading: `src/app/weekend/page.tsx` — page template for new /history page (hydration guard, container layout)
- Direct codebase reading: `src/components/layout/nav-links.tsx` — NAV_ITEMS pattern for adding /history nav link
- Direct codebase reading: `src/lib/types.ts` — Restaurant interface, CUISINE_META
- Direct codebase reading: `__tests__/recommend.test.ts` — test patterns for pure functions
- Direct codebase reading: `__tests__/integration.test.tsx` — localStorage mock pattern, renderHomePage helper
- Direct codebase reading: `package.json` — confirmed no new dependencies needed
- Direct codebase reading: `.planning/phases/08-cuisine-filter/08-RESEARCH.md` — Phase 8 patterns that Phase 9 builds on (applyFilter, relaxDiversity)
- Direct codebase reading: `.planning/STATE.md` — accumulated decisions, existing localStorage keys

### Secondary (MEDIUM confidence)

None needed — all findings are from the codebase itself.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json and component files; no new dependencies needed
- Architecture: HIGH — all patterns are derived directly from existing codebase conventions
- Business day logic: HIGH — straightforward date arithmetic, no library dependencies
- Phase 8 interaction: HIGH — Phase 8 research is available; integration is additive (sequential pool transforms)
- Pitfalls: HIGH — each pitfall traces to a specific file or known JavaScript/date behavior

**Research date:** 2026-02-19
**Valid until:** Changes if `recommend.ts`, `page.tsx`, `restaurant-context.tsx`, or Phase 8 plans are significantly modified before planning
