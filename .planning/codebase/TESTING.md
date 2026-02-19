# Testing Patterns

**Analysis Date:** 2026-02-19

## Test Framework

**Runner:**
- Vitest 4.0.18
- Config: `vitest.config.mts`
- Environment: jsdom (browser environment simulation)

**Assertion Library:**
- Vitest built-in expect() API

**Run Commands:**
```bash
npm test                   # Run all tests
npm test -- --watch       # Watch mode (continuous testing on file changes)
npm test -- --coverage    # Coverage report
```

**Setup Files:**
- `vitest.setup.ts` - runs before all tests, imports `@testing-library/jest-dom/vitest` and sets up `cleanup()` after each test

## Test File Organization

**Location:**
- Separate directory: `__tests__/` at project root (co-located by feature, not by file)
- Tests are isolated from source code

**Naming:**
- Pattern: `[feature].test.ts`
- Examples: `recommend.test.ts`, `history.test.ts`, `use-slot-animation.test.ts`, `weekend.test.ts`

**Structure:**
```
__tests__/
├── recommend.test.ts           # Tests for src/lib/recommend.ts
├── history.test.ts             # Tests for src/lib/history.ts
├── use-slot-animation.test.ts  # Tests for src/hooks/use-slot-animation.ts
└── weekend.test.ts             # Tests for src/app/weekend/page.tsx
```

## Test Structure

**Suite Organization:**
```typescript
// Pattern from __tests__/recommend.test.ts
import { describe, test, expect } from 'vitest'
import { generateWeeklyPlan, rerollSlot, applyFilter } from '@/lib/recommend'
import { DEFAULT_RESTAURANTS } from '@/lib/restaurants'

describe('generateWeeklyPlan', () => {
  test('returns 5 days', () => {
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
    expect(plan.days).toHaveLength(5)
  })

  test('total cost does not exceed weekly budget', () => {
    const budget = 750
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, budget)
    expect(plan.totalCost).toBeLessThanOrEqual(budget)
  })
})

describe('rerollSlot', () => {
  test('only changes the target slot (middle)', () => {
    const original = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
    const updated = rerollSlot(original, 2, DEFAULT_RESTAURANTS)
    expect(updated.days[0]).toBe(original.days[0])
    // ... assertions
  })
})

describe('applyFilter', () => {
  const testPool: Restaurant[] = [ ... ]

  test("exclude mode removes Japanese restaurants", () => {
    const result = applyFilter(testPool, 'exclude', ['jp'])
    expect(result).toHaveLength(4)
  })
})
```

**Patterns:**
- `describe()` groups tests by function/feature
- `test()` or `it()` for individual test cases
- Test names are declarative descriptions of behavior (not "test that..." but "returns...", "does not throw...")
- Setup shared test data at describe block scope (e.g., `const testPool = [...]`)
- `afterEach()` cleanup for timers and DOM state

## Mocking

**Framework:** Vitest built-in mocking via `vi` module

**Patterns:**

**1. Fake timers (for animation/async tests):**
```typescript
// From __tests__/use-slot-animation.test.ts
import { describe, test, expect, vi, afterEach } from 'vitest'

describe('useSlotAnimation', () => {
  afterEach(() => {
    vi.useRealTimers()  // Reset to real timers after each test
  })

  test('settles after duration', () => {
    vi.useFakeTimers()  // Enable fake timers
    const { result, rerender } = renderHook(
      ({ finalValue }) => useSlotAnimation({ candidates: ['A', 'B', 'C'], finalValue }),
      { initialProps: { finalValue: null as string | null } },
    )

    rerender({ finalValue: 'B' })
    expect(result.current.isAnimating).toBe(true)

    act(() => {
      vi.advanceTimersByTime(2500)  // Jump time forward
    })

    expect(result.current.displayValue).toBe('B')
  })
})
```

**2. Hook testing with renderHook:**
```typescript
// From __tests__/use-slot-animation.test.ts
import { renderHook, act } from '@testing-library/react'

test('skip stops animation and shows finalValue', () => {
  vi.useFakeTimers()
  const { result, rerender } = renderHook(
    ({ finalValue }) => useSlotAnimation({ ... finalValue }),
    { initialProps: { finalValue: null as string | null } }
  )

  rerender({ finalValue: 'C' })
  act(() => {
    result.current.skip()
  })

  expect(result.current.isAnimating).toBe(false)
  expect(result.current.displayValue).toBe('C')
})
```

**3. System time mocking (for date-based logic):**
```typescript
// From __tests__/history.test.ts
test('entry with today date is included', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-02-19'))  // Lock time for reproducibility
  const entries = [makeEntry('2026-02-19', 'r1')]
  const result = getRecentlyVisitedIds(entries, 5)
  expect(result.has('r1')).toBe(true)
})
```

**What to Mock:**
- Timers (setInterval, setTimeout) in animation/state tests
- System time for date-dependent logic
- localStorage (via try-catch graceful degradation, no mocking needed — functions handle missing API)

**What NOT to Mock:**
- Pure functions: test real behavior (e.g., `generateWeeklyPlan`, `applyFilter`)
- Context providers: test real provider setup with components
- Actual restaurant data: use `DEFAULT_RESTAURANTS` fixture

## Fixtures and Factories

**Test Data:**

**Factory function pattern (from __tests__/history.test.ts):**
```typescript
function makeEntry(date: string, restaurantId: string, restaurantName = 'Test'): LunchHistoryEntry {
  return { id: crypto.randomUUID(), date, restaurantId, restaurantName }
}
```

**Inline fixture (from __tests__/recommend.test.ts):**
```typescript
const testPool: Restaurant[] = [
  { id: 'chi1', name: 'CHI1', type: 'chi', price: 80, distance: 100, rating: 4.0 },
  { id: 'jp1', name: 'JP1', type: 'jp', price: 90, distance: 200, rating: 4.2 },
  { id: 'kr1', name: 'KR1', type: 'kr', price: 75, distance: 150, rating: 4.1 },
  // ... more entries
]
```

**Module-level fixture (from __tests__/recommend.test.ts):**
```typescript
import { DEFAULT_RESTAURANTS } from '@/lib/restaurants'  // Shared test data in src/

// Then used across multiple tests
const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
```

**Location:**
- Fixtures defined inline in test files or imported from `src/lib/` (e.g., `DEFAULT_RESTAURANTS`)
- No separate fixture/factory files; keeps tests self-contained

## Coverage

**Requirements:** No explicit coverage target enforced

**View Coverage:**
```bash
npm test -- --coverage
```

**Observable coverage** (from test files):
- `recommend.ts`: Comprehensive coverage of plan generation, rerolling, filtering
- `history.ts`: Complete coverage of date logic, Set operations
- `use-slot-animation.ts`: Full coverage of animation lifecycle with fake timers
- Page components: Minimal test coverage (no page tests in __tests__/)

## Test Types

**Unit Tests:**
- Scope: Individual functions in lib/ modules (recommend.ts, history.ts)
- Approach: Pure function testing with real data and expected outputs
- No mocking of dependencies; test real behavior

**Examples:**
```typescript
// __tests__/recommend.test.ts - unit test
test('no more than 2 consecutive same cuisine type', () => {
  const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
  for (let i = 2; i < plan.days.length; i++) {
    const threeConsecutive =
      plan.days[i].type === plan.days[i - 1].type && plan.days[i].type === plan.days[i - 2].type
    expect(threeConsecutive, `3 consecutive ${plan.days[i].type} at index ${i}`).toBe(false)
  }
})

// __tests__/history.test.ts - unit test with date logic
test('weekends are skipped when counting back from Monday', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-02-16'))  // Monday
  const fridayEntry = [makeEntry('2026-02-13', 'r4')]  // Friday 1 business day back
  const result = getRecentlyVisitedIds(fridayEntry, 1)
  expect(result.has('r4')).toBe(true)
})
```

**Hook Tests:**
- Scope: React hooks (`useSlotAnimation`)
- Approach: `renderHook` from `@testing-library/react` with fake timers for async behavior
- Lifecycle testing: initial state, updates, cleanup

**Examples:**
```typescript
// __tests__/use-slot-animation.test.ts - hook test
test('settles after duration: isAnimating is false and displayValue equals finalValue', () => {
  vi.useFakeTimers()
  const { result, rerender } = renderHook(
    ({ finalValue }) => useSlotAnimation({ candidates: ['A', 'B', 'C'], finalValue }),
    { initialProps: { finalValue: null as string | null } }
  )

  rerender({ finalValue: 'B' })
  expect(result.current.isAnimating).toBe(true)

  act(() => {
    vi.advanceTimersByTime(2500)
  })

  expect(result.current.isAnimating).toBe(false)
  expect(result.current.displayValue).toBe('B')
})
```

**Integration Tests (implicit):**
- Not isolated in separate suite; mixed with unit tests
- Test multiple functions together (e.g., `generateWeeklyPlan` + `rerollSlot` state flow)

**E2E Tests:**
- Not used (component tests would be next level; currently no page component tests)

## Common Patterns

**Async Testing:**

```typescript
// Pattern from __tests__/use-slot-animation.test.ts using act()
test('starts animating when finalValue changes from null to a string', () => {
  vi.useFakeTimers()
  const { result, rerender } = renderHook(...)

  rerender({ finalValue: 'B' })  // Trigger effect
  expect(result.current.isAnimating).toBe(true)
})

test('settles after duration', () => {
  vi.useFakeTimers()
  const { result, rerender } = renderHook(...)

  rerender({ finalValue: 'B' })

  act(() => {
    vi.advanceTimersByTime(2500)  // Simulate passage of time
  })

  expect(result.current.isAnimating).toBe(false)
})
```

**Edge Case Testing:**

```typescript
// From __tests__/recommend.test.ts - exhaustive edge case coverage
test('handles generous budget (2000)', () => { ... })
test('handles minimum satisfiable budget (225 = 5 x 45)', () => { ... })
test('does NOT throw on impossible budget (50) — returns graceful fallback', () => {
  expect(() => generateWeeklyPlan(DEFAULT_RESTAURANTS, 50)).not.toThrow()
  const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 50)
  expect(plan.days).toHaveLength(5)
})
test('handles single restaurant in pool', () => { ... })
test('handles pool with all same cuisine type', () => { ... })
test('throws on empty pool', () => {
  expect(() => generateWeeklyPlan([], 750)).toThrow()
})
```

**Statistical/Randomness Testing:**

```typescript
// From __tests__/recommend.test.ts and __tests__/history.test.ts
test('budget constraint holds over 100 iterations', () => {
  const budget = 600
  for (let i = 0; i < 100; i++) {
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, budget)
    expect(plan.totalCost).toBeLessThanOrEqual(budget)
  }
})

test('produces varied results (not deterministic)', () => {
  const plans = Array.from({ length: 20 }, () => generateWeeklyPlan(DEFAULT_RESTAURANTS, 750))
  const uniqueFirstPicks = new Set(plans.map((p) => p.days[0].id))
  expect(uniqueFirstPicks.size).toBeGreaterThan(1)
})
```

**Error Testing:**

```typescript
// From __tests__/recommend.test.ts
test('throws on empty pool', () => {
  expect(() => generateWeeklyPlan([], 750)).toThrow()
})

// From __tests__/use-slot-animation.test.ts
test('empty candidates — no animation, displayValue equals finalValue immediately', () => {
  vi.useFakeTimers()
  const { result, rerender } = renderHook(
    ({ finalValue }) => useSlotAnimation({ candidates: [], finalValue }),
    { initialProps: { finalValue: null as string | null } }
  )

  rerender({ finalValue: 'X' })
  expect(result.current.isAnimating).toBe(false)
  expect(result.current.displayValue).toBe('X')
})
```

---

*Testing analysis: 2026-02-19*
