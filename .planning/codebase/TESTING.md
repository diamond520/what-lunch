# Testing Patterns

**Analysis Date:** 2026-02-18

## Test Framework

**Runner:**
- Vitest v4.0.18
- Config: `vitest.config.mts`
- Environment: Node (not browser, despite being a React app)

**Assertion Library:**
- Vitest's built-in `expect()` (compatible with Jest API)

**Run Commands:**
```bash
npm test              # Run all tests
npm test -- --watch  # Watch mode
npm test -- --coverage  # Coverage report (inferred from standard setup)
```

## Test File Organization

**Location:**
- `__tests__/` directory at project root, separate from source
- Test file: `__tests__/recommend.test.ts`
- Pattern: Separate directory mirrors typical project structure

**Naming:**
- Pattern: `{module}.test.ts`
- Full path: `/Users/diamond.hung/ailabs/code/what-lunch/__tests__/recommend.test.ts`

**Structure:**
```
__tests__/
└── recommend.test.ts          # Tests for src/lib/recommend.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, test, expect } from 'vitest'
import { generateWeeklyPlan, rerollSlot, type WeeklyPlan } from '@/lib/recommend'
import { DEFAULT_RESTAURANTS } from '@/lib/restaurants'
import type { Restaurant } from '@/lib/types'

describe('generateWeeklyPlan', () => {
  test('returns 5 days', () => {
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
    expect(plan.days).toHaveLength(5)
  })

  // more tests...
})

describe('rerollSlot', () => {
  // tests...
})
```

**Patterns:**
- One `describe()` block per exported function/feature
- One `test()` per behavior or constraint being verified
- Direct imports of functions under test with full path alias (`@/lib/recommend`)
- Type imports: `import type { WeeklyPlan }` for test setup

**Setup Pattern:**
- Generate test data using actual production functions when possible
- Example: `const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)` instead of mocking
- Manual test objects when specific constraints needed: `const jp1: Restaurant = { ... }`

**Teardown Pattern:**
- Not applicable (no shared state between tests)
- Each test is isolated and independent

## Assertion Pattern

**Common Assertions Used:**
```typescript
expect(plan.days).toHaveLength(5)                    // Array length
expect(plan.totalCost).toBeLessThanOrEqual(budget)   // Numeric comparison
expect(threeConsecutive).toBe(false)                 // Boolean equality
expect(plan.weeklyBudget).toBe(600)                  // Strict equality
expect(() => fn()).not.toThrow()                     // Error handling
expect(updated.days[0]).toBe(original.days[0])       // Reference equality
expect(uniqueFirstPicks.size).toBeGreaterThan(1)     // Set size
expect(plan.days.every(d => d.id === 'only')).toBe(true)  // Predicate
```

**Error Messages:**
- Custom messages in second parameter: `expect(threeConsecutive, 'message').toBe(false)`
- Used to clarify what constraint failed in complex tests

## Mocking

**Framework:** None - Tests use real implementations

**Patterns:**
- Tests directly call functions under test without mocking
- Dependencies are real data: `DEFAULT_RESTAURANTS` used in all tests
- When specific conditions needed: Create minimal test objects
  ```typescript
  const single: Restaurant[] = [
    { id: 'only', name: 'Only', type: 'chi', price: 100, distance: 50, rating: 4.0 },
  ]
  ```

**What to Mock:**
- Not applied in this codebase - No mocking framework present
- Pure functions don't require mocks (no I/O, no side effects)

**What NOT to Mock:**
- Core business logic: `generateWeeklyPlan()`, `rerollSlot()`
- Data objects: Use real `DEFAULT_RESTAURANTS` or minimal test objects
- Type system: No type mocking needed

## Fixtures and Factories

**Test Data:**
- Production data: `DEFAULT_RESTAURANTS` imported from `src/lib/restaurants.ts`
- Inline creation for edge cases:
  ```typescript
  const jp1: Restaurant = { id: 'jp1', name: 'JP1', type: 'jp', price: 80, distance: 100, rating: 4.0 }
  const plan: WeeklyPlan = {
    days: [jp1, jp2, chi1, chi1, chi1],
    totalCost: 380,
    weeklyBudget: 1000,
  }
  ```

**Location:**
- Test-specific data: Defined inline in test functions
- Shared test data: `DEFAULT_RESTAURANTS` imported from production code
- No separate fixtures directory

## Coverage

**Requirements:** Not explicitly enforced (no coverage config found)

**View Coverage:**
- Setup available but not configured: `npm test -- --coverage` would require coverage config
- Current status: Coverage tracking not enabled

**Current Test Coverage:**
- `src/lib/recommend.ts`: Fully tested (27 tests covering all functions)
- Other modules: No test files found

## Test Types

**Unit Tests:**
- Scope: Individual functions in isolation
- Approach: Test single behavior per test, no external dependencies
- Examples: `test('returns 5 days', ...)`, `test('total cost does not exceed weekly budget', ...)`
- All tests in `__tests__/recommend.test.ts` are unit tests

**Integration Tests:**
- Not present in current test suite
- Would be needed for: React component rendering, Context API interactions

**E2E Tests:**
- Not present: No Playwright, Cypress, or other E2E framework installed
- Component UI testing: Not implemented

## Test Categories

**Constraint Validation Tests:**
```typescript
test('total cost does not exceed weekly budget', () => {
  const budget = 750
  const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, budget)
  expect(plan.totalCost).toBeLessThanOrEqual(budget)
})

test('no more than 2 consecutive same cuisine type', () => {
  const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
  for (let i = 2; i < plan.days.length; i++) {
    const threeConsecutive = /* check logic */
    expect(threeConsecutive).toBe(false)
  }
})
```

**Edge Case Tests:**
```typescript
test('handles single restaurant in pool', () => {
  const single: Restaurant[] = [{ /* ... */ }]
  const plan = generateWeeklyPlan(single, 1000)
  expect(plan.days).toHaveLength(5)
  expect(plan.days.every(d => d.id === 'only')).toBe(true)
})

test('throws on empty pool', () => {
  expect(() => generateWeeklyPlan([], 750)).toThrow()
})

test('does NOT throw on impossible budget (50)', () => {
  expect(() => generateWeeklyPlan(DEFAULT_RESTAURANTS, 50)).not.toThrow()
})
```

**Statistical/Robustness Tests:**
```typescript
test('budget constraint holds over 100 iterations', () => {
  const budget = 600
  for (let i = 0; i < 100; i++) {
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, budget)
    expect(plan.totalCost).toBeLessThanOrEqual(budget)
  }
})

test('produces varied results (not deterministic)', () => {
  const plans = Array.from({ length: 20 }, () =>
    generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
  )
  const uniqueFirstPicks = new Set(plans.map(p => p.days[0].id))
  expect(uniqueFirstPicks.size).toBeGreaterThan(1)
})
```

**Behavior-specific Tests:**
```typescript
test('only changes the target slot (middle)', () => {
  const original = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
  const updated = rerollSlot(original, 2, DEFAULT_RESTAURANTS)
  expect(updated.days[0]).toBe(original.days[0])
  expect(updated.days[1]).toBe(original.days[1])
  // days[2] may or may not change (random)
  expect(updated.days[3]).toBe(original.days[3])
  expect(updated.days[4]).toBe(original.days[4])
})
```

## Common Patterns

**Async Testing:**
- Not applicable (no async functions in tested code)
- All functions are synchronous

**Error Testing:**
```typescript
test('throws on empty pool', () => {
  expect(() => generateWeeklyPlan([], 750)).toThrow()
})

test('does NOT throw on impossible budget (50)', () => {
  expect(() => generateWeeklyPlan(DEFAULT_RESTAURANTS, 50)).not.toThrow()
})
```

**Loop-based Iteration Testing:**
```typescript
// Check internal state at each step
for (let i = 2; i < plan.days.length; i++) {
  const threeConsecutive =
    plan.days[i].type === plan.days[i - 1].type &&
    plan.days[i].type === plan.days[i - 2].type
  expect(threeConsecutive).toBe(false)
}

// Statistical testing with repeated calls
for (let i = 0; i < 100; i++) {
  const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, budget)
  expect(plan.totalCost).toBeLessThanOrEqual(budget)
}
```

**Reference Equality for Immutability:**
```typescript
// Verify that reroll only changes target slot
expect(updated.days[0]).toBe(original.days[0])  // Same reference
expect(updated.days[3]).toBe(original.days[3])  // Same reference
// (slot 2 may be different)
```

## Test Organization Principles

**Per Test Suite (`__tests__/recommend.test.ts`):**
1. Generate production plan with `generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)`
2. Create edge-case test objects manually when specific conditions needed
3. Run 50-100 iterations for statistical validation of random algorithms
4. Verify constraints are maintained across all variants
5. Comment with specific constraint names for clarity

**Avoiding Test Brittleness:**
- Tests don't assert on exact values (random algorithm)
- Instead assert on constraints: `expect(...).toBeLessThanOrEqual(budget)`
- Use `expect(...).toBeGreaterThan(1)` for variance checks instead of exact counts

## Test Coverage Gaps

**Untested Modules:**
- `src/lib/types.ts` - Type definitions only, no logic to test
- `src/lib/restaurants.ts` - Data constants only
- `src/lib/utils.ts` - Single utility function `cn()` used for className merging
- `src/components/**` - No React component tests
- `src/app/**` - No page component tests
- `src/lib/restaurant-context.tsx` - React Context provider/hook untested

**Component Testing Needs:**
- Would require: Vitest + React Testing Library or similar
- Gap: No integration tests for context consumption
- Gap: No UI interaction tests (button clicks, form submissions)

**Why Components Untested:**
- Test environment set to `node` in `vitest.config.mts` (not `jsdom` or `happy-dom`)
- No React Testing Library or similar UI testing library installed
- Would require separate test setup for component testing

---

*Testing analysis: 2026-02-18*
