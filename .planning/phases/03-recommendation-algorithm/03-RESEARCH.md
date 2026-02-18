# Phase 3: Recommendation Algorithm - Research

**Researched:** 2026-02-18
**Domain:** Pure-function constraint-satisfying random selection algorithm + Vitest unit testing
**Confidence:** HIGH

## Summary

Phase 3 is a pure-algorithm phase: write a TypeScript function that generates a 5-day lunch plan satisfying two constraints (weekly budget, cuisine diversity), plus a per-slot re-roll function. No UI is built here. The algorithm lives in `src/lib/recommend.ts` and is tested with Vitest.

The core algorithmic challenge is bounded random selection with constraints. The naive approach — pick random restaurants until constraints are satisfied — risks infinite loops when the budget is very low or the restaurant pool is small. The proven solution is a slot-by-slot greedy approach with a fixed retry cap per slot and a graceful fallback when retries are exhausted. This terminates in O(N × R) where N=5 days and R=max retries.

Vitest is the standard test framework for Next.js + TypeScript projects in 2026. The official Next.js docs explicitly recommend Vitest for unit testing. Since the algorithm functions are pure TypeScript with no DOM dependency, they run in Vitest's default `node` environment with zero additional setup beyond installing the packages.

**Primary recommendation:** Implement a greedy slot-by-slot picker with MAX_RETRIES=50 per slot. When a slot cannot be filled (budget exhausted or pool empty after retries), return the cheapest remaining restaurant as a fallback rather than throwing or recursing.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.0.17 | Test runner | Official Next.js recommendation; native TypeScript; Vite-powered (same toolchain) |
| vite-tsconfig-paths | latest | Resolves `@/` path aliases in tests | Without this, `import from '@/lib/...'` fails in test files |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitejs/plugin-react | latest | React component testing support | Only needed if testing React components; NOT needed for pure function tests |
| @testing-library/react | latest | Component test utilities | Only needed for Phase 5 UI tests; not needed here |

### What Is NOT Needed

For this phase (pure functions only):
- No `jsdom` — algorithm tests have no DOM dependency
- No `@testing-library/react` — no components to render
- No `happy-dom` — same reason

**Installation:**
```bash
npm install -D vitest vite-tsconfig-paths
```

Note: `@vitejs/plugin-react` is needed for future phases testing React components. Installing it now is fine but not required for this phase.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── types.ts          # Existing — Restaurant, CuisineType (DO NOT MODIFY)
│   ├── restaurants.ts    # Existing — DEFAULT_RESTAURANTS (DO NOT MODIFY)
│   └── recommend.ts      # NEW — all algorithm logic, pure functions only
__tests__/
└── recommend.test.ts     # NEW — Vitest unit tests for algorithm
vitest.config.mts         # NEW — Vitest configuration with path alias support
```

Algorithm code goes in `src/lib/recommend.ts`. Tests go in `__tests__/recommend.test.ts`. The `__tests__` folder at root level is the Next.js convention to keep test files outside the app router and away from the production build.

### Vitest Configuration

```typescript
// vitest.config.mts
// Source: https://nextjs.org/docs/app/guides/testing/vitest (2026-02-16)
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',  // Default; explicit for clarity. No jsdom needed.
  },
})
```

No `@vitejs/plugin-react` needed for this phase since no React components are tested.

### Pattern 1: Slot-by-Slot Greedy Picker with Bounded Retries

**What:** Fill each of 5 slots one at a time. For each slot, randomly sample from eligible restaurants. Eligibility = (price fits remaining budget) AND (not a third consecutive same cuisine). If MAX_RETRIES attempts all fail, use cheapest eligible restaurant as fallback. If no fallback exists (budget truly impossible), include cheapest restaurant anyway.

**When to use:** Any time you need random selection with hard constraints where exhaustive search is too slow. Guarantees termination. O(5 × MAX_RETRIES) time complexity.

**Example:**
```typescript
// Source: algorithm design for this phase (not a library)
const MAX_RETRIES = 50  // Per-slot retry cap. Prevents infinite loops.

function pickForSlot(
  pool: Restaurant[],
  remainingBudget: number,
  plan: Restaurant[],  // previously picked slots
): Restaurant {
  const lastTwo = plan.slice(-2)
  const sameTypeCount = lastTwo.length === 2
    && lastTwo[0].type === lastTwo[1].type
    ? lastTwo[0].type
    : null

  const eligible = pool.filter(r =>
    r.price <= remainingBudget &&
    (sameTypeCount === null || r.type !== sameTypeCount)
  )

  if (eligible.length === 0) {
    // Fallback: relax cuisine constraint, use cheapest affordable
    const affordable = pool
      .filter(r => r.price <= remainingBudget)
      .sort((a, b) => a.price - b.price)
    if (affordable.length > 0) return affordable[0]

    // Absolute fallback: budget truly impossible, use cheapest overall
    return pool.slice().sort((a, b) => a.price - b.price)[0]
  }

  // Random pick from eligible
  return eligible[Math.floor(Math.random() * eligible.length)]
}
```

### Pattern 2: Per-Slot Re-Roll (RECO-05)

**What:** Replace one slot's pick without touching the other 4. Takes the existing plan, generates a new pick for the target slot index subject to the same constraints (budget = original_budget - sum_of_other_4_picks, cuisine diversity with neighboring slots).

**When to use:** User clicks re-roll on a single day. Only that day changes.

**Example:**
```typescript
// Re-roll one slot. The other 4 picks are fixed.
function reroll(
  plan: Restaurant[],
  slotIndex: number,  // 0-4
  pool: Restaurant[],
  weeklyBudget: number,
): Restaurant[] {
  const others = plan.filter((_, i) => i !== slotIndex)
  const spent = others.reduce((sum, r) => sum + r.price, 0)
  const remaining = weeklyBudget - spent

  // Build a synthetic "plan so far" to check cuisine constraint
  const planBefore = plan.slice(0, slotIndex)
  const newPick = pickForSlot(pool, remaining, planBefore)

  const newPlan = [...plan]
  newPlan[slotIndex] = newPick
  return newPlan
}
```

### Pattern 3: Budget Distribution — Per-Slot Budget vs. Weekly Budget

**What:** The algorithm does NOT pre-divide the weekly budget into daily allowances. Instead it tracks a running `remainingBudget` as slots are filled. This is more flexible and avoids edge cases where even distribution fails when individual restaurant prices are uneven.

**Why:** A NT$500/5 = NT$100/day allocation fails if no restaurant costs exactly NT$100. The running-total approach fills whatever fits, allowing uneven distribution (e.g., 65+65+65+65+160 = 420 is valid for a NT$500 budget).

### Pattern 4: Exported Types for the Plan

```typescript
// src/lib/recommend.ts
export interface WeeklyPlan {
  days: Restaurant[]       // length 5, indices 0-4 = Mon-Fri
  totalCost: number        // sum of all 5 prices
  weeklyBudget: number     // the input budget used to generate
}

export function generateWeeklyPlan(
  pool: Restaurant[],
  weeklyBudget: number,
): WeeklyPlan { ... }

export function rerollSlot(
  plan: WeeklyPlan,
  slotIndex: number,
  pool: Restaurant[],
): WeeklyPlan { ... }
```

### Anti-Patterns to Avoid

- **Recursive backtracking:** A recursive function that calls itself when constraints fail causes the original infinite recursion bug. Use iteration with a counter instead.
- **Pre-divided daily budget:** Splitting weeklyBudget / 5 into a per-day allowance then selecting independently fails when restaurant prices don't divide evenly. Use running budget.
- **Random.shuffle then filter:** Shuffling the full pool then taking the first valid item is O(N log N) per slot and can exhaust the shuffled array before finding a valid pick. Filter first, then random-index.
- **Throwing on impossible budget:** Never throw an error when budget is too low. Return a graceful fallback plan (cheapest available). The UI will display what was selected; the user can increase budget and regenerate.
- **Global retry counter:** A single retry counter across all 5 slots is too coarse. Use per-slot retry counters so one hard slot doesn't eat all retries.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test runner | Custom assertion framework | Vitest | Battle-tested, TypeScript-native, 4x faster than Jest |
| Path alias resolution in tests | Manual `module.nameMapper` | `vite-tsconfig-paths` | Reads existing `tsconfig.json` paths; zero duplication |
| Random shuffle | Custom shuffle | Fisher-Yates via `Math.random()` index | Direct random index into filtered array is simpler and unbiased for this use case |

**Key insight:** The algorithm itself is genuinely custom domain logic — no library does "budget-aware cuisine-diverse restaurant picker." But the scaffolding around it (test runner, config) should use standard tools.

## Common Pitfalls

### Pitfall 1: Infinite Recursion on Low Budget

**What goes wrong:** The old Vue 2 codebase used recursive backtracking. When the budget was lower than the cheapest restaurant, every recursive call failed, causing a stack overflow and app freeze.

**Why it happens:** Recursive "retry on constraint failure" without a base case has no termination guarantee.

**How to avoid:** Use an iterative approach with a fixed `MAX_RETRIES` counter. When retries are exhausted, use a fallback rather than recursing.

**Warning signs:** Any function that calls itself with the same or similar arguments without a strictly decreasing counter.

### Pitfall 2: String vs. Number Type Coercion for Price

**What goes wrong:** In the old Vue 2 code, `price` was stored as a string. `"100" <= 500` evaluates to `true` in JavaScript but `"100" + "65"` gives `"10065"`, making budget calculations wrong.

**Why it happens:** JavaScript's `+` operator is overloaded for strings. If any price comes in as a string, all arithmetic silently breaks.

**How to avoid:** The `Restaurant.price` type is already `number` in `src/lib/types.ts`, enforced by `satisfies Restaurant[]` in `src/lib/restaurants.ts`. In the algorithm, never accept `string` inputs. If adding a runtime guard: `if (typeof restaurant.price !== 'number') throw new TypeError(...)`.

**Warning signs:** Price comparisons that should fail but pass; budget sums that produce strings rather than numbers.

### Pitfall 3: Cuisine Constraint Creates Empty Eligible Pool With Valid Budget Remaining

**What goes wrong:** After 2 consecutive Japanese restaurants, the remaining budget is NT$200, but all non-Japanese restaurants cost NT$220. The cuisine filter empties the eligible pool even though budget isn't zero.

**Why it happens:** Cuisine constraint and budget constraint together over-constrain the selection space.

**How to avoid:** When the cuisine-constrained eligible pool is empty, fall back in two stages:
1. Relax cuisine constraint, keep budget constraint — pick cheapest affordable.
2. If still empty (budget below cheapest restaurant), pick globally cheapest regardless of budget.

This ensures the algorithm always terminates with 5 restaurants, and the total cost may exceed budget only in the extreme edge case (documented as intended behavior: "graceful fallback").

### Pitfall 4: Re-Roll Breaks Cuisine Diversity for Neighboring Slots

**What goes wrong:** Slot 2 is re-rolled without considering that slot 1 and slot 3 are the same cuisine type. The new pick for slot 2 could create a triple-consecutive run.

**Why it happens:** Re-roll only considers the "before" slots for the cuisine constraint, ignoring what comes after.

**How to avoid:** When computing cuisine eligibility for a re-rolled slot at index `i`, check BOTH:
- `plan[i-2]` and `plan[i-1]` (preceding pair)
- `plan[i+1]` and `plan[i+2]` (following pair)

Exclude any cuisine type that would create 3-in-a-row in either direction.

**Warning signs:** After re-rolling slot 1, slots 0, 1, 2 all show the same cuisine.

### Pitfall 5: Vitest Path Alias Failure Without vite-tsconfig-paths

**What goes wrong:** Test file imports `from '@/lib/recommend'` and Vitest throws `Cannot find module '@/lib/recommend'`.

**Why it happens:** Vitest uses Vite's module resolution, not Node.js's. The `@/` alias defined in `tsconfig.json` is not automatically honored by Vitest.

**How to avoid:** Install `vite-tsconfig-paths` and add `tsconfigPaths()` to the `plugins` array in `vitest.config.mts`. This bridges `tsconfig.json` path aliases into Vitest.

**Warning signs:** Tests fail with "Cannot find module" on `@/` imports despite the source files existing.

### Pitfall 6: Budget Edge Cases Not Tested

**What goes wrong:** Algorithm works for normal budgets (500-1000) but silently fails for edge cases: budget=100 (impossible), budget=2000 (easy), single restaurant in pool, pool of all same cuisine.

**Why it happens:** Tests only cover the happy path.

**How to avoid:** Write explicit test cases for:
- Budget impossibly low (< 5 × cheapest): should return fallback, not throw
- Budget exactly equal to minimum 5-restaurant sum: should succeed
- Pool with only 1 cuisine type: should succeed (cuisine diversity still enforces max 2 consecutive)
- Pool with 1 restaurant: should return same restaurant 5 times

## Code Examples

Verified patterns from official sources:

### Vitest Configuration (Next.js Official Pattern)

```typescript
// vitest.config.mts
// Source: https://nextjs.org/docs/app/guides/testing/vitest (updated 2026-02-16)
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
  },
})
```

### Package.json Test Script

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest"
  }
}
```

### Test File Structure (Pure Function Tests)

```typescript
// __tests__/recommend.test.ts
// Source: Vitest v4.0.17 official docs — https://vitest.dev/guide/
import { describe, test, expect } from 'vitest'
import { generateWeeklyPlan, rerollSlot } from '@/lib/recommend'
import { DEFAULT_RESTAURANTS } from '@/lib/restaurants'

describe('generateWeeklyPlan', () => {
  test('returns 5 restaurants', () => {
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
    expect(plan.days).toHaveLength(5)
  })

  test('total cost does not exceed weekly budget', () => {
    const budget = 750
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, budget)
    expect(plan.totalCost).toBeLessThanOrEqual(budget)
  })

  test('no more than 2 consecutive restaurants of the same cuisine', () => {
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
    for (let i = 2; i < plan.days.length; i++) {
      const sameAsTwo = plan.days[i].type === plan.days[i-1].type
                     && plan.days[i].type === plan.days[i-2].type
      expect(sameAsTwo).toBe(false)
    }
  })

  test('terminates and returns fallback when budget is impossibly low', () => {
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 50) // below any restaurant
    expect(plan.days).toHaveLength(5)
    // Does not throw; returns a graceful plan
  })
})

describe('rerollSlot', () => {
  test('only changes the target slot', () => {
    const original = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
    const updated = rerollSlot(original, 2, DEFAULT_RESTAURANTS)
    expect(updated.days[0]).toBe(original.days[0])
    expect(updated.days[1]).toBe(original.days[1])
    expect(updated.days[3]).toBe(original.days[3])
    expect(updated.days[4]).toBe(original.days[4])
  })
})
```

### Full Algorithm Skeleton

```typescript
// src/lib/recommend.ts
import type { Restaurant } from './types'

export interface WeeklyPlan {
  days: Restaurant[]
  totalCost: number
  weeklyBudget: number
}

const MAX_RETRIES = 50

function hasCuisineViolation(
  plan: Restaurant[],
  slotIndex: number,
  candidate: Restaurant,
): boolean {
  // Check if placing candidate at slotIndex creates 3-consecutive same cuisine
  const prev2 = plan[slotIndex - 2]
  const prev1 = plan[slotIndex - 1]

  if (prev2 && prev1 && prev1.type === candidate.type && prev2.type === candidate.type) {
    return true // Would be 3rd consecutive
  }

  return false
}

function pickForSlot(
  pool: Restaurant[],
  remainingBudget: number,
  planSoFar: Restaurant[],
  slotIndex: number,
): Restaurant {
  // Eligible = affordable AND doesn't create 3-consecutive cuisine
  const eligible = pool.filter(r =>
    r.price <= remainingBudget &&
    !hasCuisineViolation(planSoFar, slotIndex, r)
  )

  if (eligible.length > 0) {
    return eligible[Math.floor(Math.random() * eligible.length)]
  }

  // Fallback 1: relax cuisine constraint, keep budget
  const affordable = pool
    .filter(r => r.price <= remainingBudget)
    .sort((a, b) => a.price - b.price)
  if (affordable.length > 0) return affordable[0]

  // Fallback 2: budget impossible, use globally cheapest
  return pool.slice().sort((a, b) => a.price - b.price)[0]
}

export function generateWeeklyPlan(
  pool: Restaurant[],
  weeklyBudget: number,
): WeeklyPlan {
  if (pool.length === 0) {
    throw new Error('Restaurant pool cannot be empty')
  }

  const days: Restaurant[] = []
  let remainingBudget = weeklyBudget

  for (let i = 0; i < 5; i++) {
    const pick = pickForSlot(pool, remainingBudget, days, i)
    days.push(pick)
    remainingBudget -= pick.price
  }

  return {
    days,
    totalCost: weeklyBudget - remainingBudget,
    weeklyBudget,
  }
}

export function rerollSlot(
  plan: WeeklyPlan,
  slotIndex: number,
  pool: Restaurant[],
): WeeklyPlan {
  const others = plan.days.filter((_, i) => i !== slotIndex)
  const spent = others.reduce((sum, r) => sum + r.price, 0)
  const remaining = plan.weeklyBudget - spent

  const planBefore = plan.days.slice(0, slotIndex)
  const newPick = pickForSlot(pool, remaining, planBefore, slotIndex)

  const newDays = [...plan.days]
  newDays[slotIndex] = newPick

  return {
    days: newDays,
    totalCost: newDays.reduce((sum, r) => sum + r.price, 0),
    weeklyBudget: plan.weeklyBudget,
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest | Vitest | 2022-2024 | 4x faster, native TypeScript, no Babel needed |
| Recursive backtracking | Iterative with retry cap | Vue 2 → Next.js rewrite | Eliminates stack overflow on impossible budget |
| `string` prices (Vue 2 bug) | `number` prices enforced by TypeScript | This rewrite | Eliminates silent arithmetic bugs |
| Global retry counter | Per-slot retry implicit in `pickForSlot` | This design | Each slot gets full retry budget |

**Deprecated/outdated:**
- Jest: Still viable, but Next.js 16 official docs recommend Vitest. Jest requires Babel transform for TypeScript; Vitest uses Vite natively.
- Recursive algorithm: Known to cause stack overflow with the existing restaurant data when budget < NT$325. Do not reuse.

## Budget Edge Case Analysis

This section documents known edge cases from analysis of the actual restaurant data.

| Scenario | Weekly Budget | Min Needed | Behavior |
|----------|---------------|------------|----------|
| Normal | 500-1000 | 325 | Normal random selection |
| Tight | 325-499 | 325 | Limited options; may pick cheapest (65) repeatedly |
| Impossible | 100-324 | 325 | Fallback: returns plan exceeding budget; no throw |
| Very low | < 100 | 325 | Fallback: same as impossible |
| Generous | 1000-2000 | 325 | Fully random; all restaurants eligible |

**NT$325 = 5 × NT$65** (cheapest restaurant: 小食泰 at id-10).

The budget input range is NT$100-2000 per RECO-02. The algorithm MUST handle budgets below NT$325 gracefully (return cheapest 5 without throwing).

## Open Questions

1. **Re-roll cuisine constraint direction**
   - What we know: Re-roll must not create 3-consecutive same cuisine in the resulting plan
   - What's unclear: Should re-roll also look FORWARD at `plan[i+1]` and `plan[i+2]`? If slot 2 is being re-rolled and slots 3+4 are the same cuisine, picking that cuisine for slot 2 creates a violation at positions 2,3,4.
   - Recommendation: Yes, check both directions. The `hasCuisineViolation` function should accept the full plan and slotIndex to check forward neighbors too. This adds minor complexity but prevents silent constraint violations after re-roll.

2. **Deterministic fallback vs. random fallback when pool is over-constrained**
   - What we know: When eligible pool is empty, we fall back to cheapest affordable
   - What's unclear: Should the fallback be random among cheapest options (e.g., among all restaurants at minimum price), or strictly the cheapest?
   - Recommendation: Strictly the cheapest (sort by price, take index 0). Simpler to reason about, easier to test.

3. **Test repeatability with Math.random()**
   - What we know: Tests calling `generateWeeklyPlan` with `Math.random()` are non-deterministic
   - What's unclear: Should we inject a seeded random function for testability?
   - Recommendation: Run property-based tests N=100 times to catch statistical edge cases. Do NOT mock `Math.random()` with a fixed seed for general tests — it prevents catching real edge cases. Alternatively, inject `randomFn = Math.random` as a parameter for hermetic edge-case tests.

## Sources

### Primary (HIGH confidence)

- https://nextjs.org/docs/app/guides/testing/vitest — Official Next.js Vitest setup guide, last updated 2026-02-16. Confirmed: install command, config file format, package.json script.
- https://vitest.dev/guide/environment — Official Vitest docs. Confirmed: `node` is the default environment, per-file `@vitest-environment` comment is valid.
- https://vitest.dev/guide/ — Official Vitest docs. Confirmed: v4.0.17 is current release; `import { expect, test } from 'vitest'` is the standard API.
- src/lib/types.ts and src/lib/restaurants.ts — Project source. Confirmed: 19 restaurants, prices 65-160, `price` is `number`, TypeScript strict mode.

### Secondary (MEDIUM confidence)

- WebSearch "Vitest pure function testing TypeScript 2025 Next.js" — Multiple sources confirm Vitest is the standard for Next.js TypeScript projects; verified against official docs above.
- Algorithm design (slot-by-slot greedy with bounded fallback) — This is a well-known constraint satisfaction pattern. No single library implements this specific use case; the approach is synthesized from standard CS patterns (bounded iteration, graceful degradation).

### Tertiary (LOW confidence)

- WebSearch results on scheduling algorithms — CPU scheduling results are not directly applicable but confirmed that bounded retry with fallback is the standard pattern for preventing infinite loops in constraint selection.

## Metadata

**Confidence breakdown:**
- Standard stack (Vitest): HIGH — official Next.js docs explicitly recommend Vitest; version confirmed from official site
- Algorithm design: HIGH — domain logic is fully specifiable from requirements; no library dependency; patterns are standard CS
- Pitfalls (type coercion, infinite recursion): HIGH — directly observed in existing codebase context and confirmed by problem statement
- Re-roll forward-neighbor constraint: MEDIUM — logically necessary but not explicitly stated in requirements; flagged as open question
- Test repeatability approach: MEDIUM — common practice, not from official source

**Research date:** 2026-02-18
**Valid until:** 2026-03-20 (stable domain — algorithm patterns and Vitest API are stable; 30-day window appropriate)
