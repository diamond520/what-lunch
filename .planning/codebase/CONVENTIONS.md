# Coding Conventions

**Analysis Date:** 2026-02-18

## Naming Patterns

**Files:**
- Components: PascalCase, no suffix - `Header.tsx`, `Button.tsx`
- UI components: `src/components/ui/` directory, lowercase kebab-case - `button.tsx`, `input.tsx`, `table.tsx`
- Layout/feature components: `src/components/layout/` - `header.tsx`, `nav-links.tsx`
- Pages: `src/app/` or `src/app/[route]/page.tsx` following Next.js convention - `page.tsx`, `restaurants/page.tsx`
- Utilities/libraries: lowercase with hyphens - `restaurant-context.tsx`, `utils.ts`, `recommend.ts`
- Type/data files: lowercase - `types.ts`, `restaurants.ts`

**Functions:**
- camelCase for all functions - `generateWeeklyPlan()`, `hasCuisineViolation()`, `handleGenerate()`, `handleReroll()`
- Event handlers: `handle{Event}` pattern - `handleSubmit()`, `handleReroll()`, `handlePriceChange()`
- Hook functions: `use{Purpose}` pattern - `useRestaurants()` (custom hook)
- Internal helper functions: descriptive camelCase - `pickForSlot()`, `cheapestPrice()`, `hasConsecutiveCuisineViolation()`

**Variables:**
- camelCase for all variables and constants - `budget`, `restaurants`, `cuisineType`, `remainingBudget`
- State setters follow React pattern - `setBudget()`, `setPlan()`, `setName()`
- Constants in all caps with underscores - `DEFAULT_BUDGET`, `BUDGET_MIN`, `BUDGET_MAX`, `BUDGET_STEP`, `DAY_LABELS`, `MAX_ATTEMPTS`, `DAYS`, `CUISINE_META`
- Props/destructured params: camelCase - `slotIndex`, `slotsRemaining`, `weeklyBudget`

**Types:**
- Interfaces: PascalCase with `Interface` suffix pattern or descriptive name - `Restaurant`, `RestaurantContextValue`, `WeeklyPlan`
- Union types: PascalCase - `CuisineType` (derived from `keyof typeof CUISINE_META`)
- Generic constraint interfaces: `Record<string, { label: string; color: string }>`

## Code Style

**Formatting:**
- No explicit Prettier config found, but code follows consistent formatting
- Indentation: 2 spaces (inferred from file contents)
- Line length: No strict limit observed, but generally reasonable (~80-100 chars)
- Trailing commas: Used in multiline structures

**Linting:**
- Tool: ESLint v9 with Next.js config
- Config file: `eslint.config.mjs`
- Extends: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Key rules: Next.js web vitals and TypeScript best practices
- Run command: `npm run lint`
- Ignored: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

## Import Organization

**Order:**
1. React and third-party library imports - `import { createContext, useContext, useState } from 'react'`
2. Type imports - `import type { Restaurant } from './types'`, `import type { CuisineType } from '@/lib/types'`
3. Local module imports - `import { DEFAULT_RESTAURANTS } from './restaurants'`, `import { Button } from '@/components/ui/button'`
4. Utility imports - `import { cn } from '@/lib/utils'`
5. Icon imports - `import { RefreshCw, Trash2 } from 'lucide-react'`

**Path Aliases:**
- Primary alias: `@/*` → `src/*` (defined in `tsconfig.json`)
- Usage: `@/lib/types`, `@/components/ui/button`, `@/lib/restaurant-context`

**Type imports:**
- Explicitly use `import type { ... }` for TypeScript types to avoid circular dependencies
- Example: `import type { Restaurant } from './types'`

## Error Handling

**Patterns:**
- Throw on preconditions: `if (pool.length === 0) { throw new Error('Restaurant pool cannot be empty') }`
- Graceful fallbacks: Logic includes multiple fallback levels for budget/constraint violations
- Try-catch: Not explicitly used; relies on function return validation
- Context error: Custom hooks throw if used outside provider - `if (!ctx) throw new Error('useRestaurants must be used within RestaurantProvider')`

**Validation:**
- Input validation in event handlers before state updates
- Budget validation: checks `isNaN(budget)` before proceeding
- Form validation: checks for empty strings with `.trim()`, validates numeric inputs individually
- Destructuring with non-null assertions: `price!`, `distance!`, `rating!` after validation passes

## Logging

**Framework:** console (no explicit logging library)

**Patterns:**
- Comments preferred over logging for code documentation
- No `console.log()` or `console.error()` found in source code
- Heavy use of JSDoc/inline comments for algorithm explanation

## Comments

**When to Comment:**
- Algorithm explanation: Heavy comments in complex logic files like `recommend.ts`
- Pattern documentation: Top-of-file comments explaining design patterns
- Inline comments: Within algorithm blocks to explain edge cases and fallbacks

**JSDoc/TSDoc:**
- Minimal JSDoc usage
- File-level comments with explanatory text: `// lib/types.ts` followed by explanation of the pattern
- Comments explain "why" not "what": `// Reserve budget for future slots (each future slot needs at least cheapest price)`
- Constraint descriptions: Comments document business logic like cuisine violation rules

**Examples from codebase:**
```typescript
// lib/types.ts
// Single source of truth for all type definitions and cuisine constants.
// Pattern: as const satisfies Record<> derives union type from object keys
// while validating each entry's shape at compile time.

// Backward: would this be 3rd consecutive (prev2, prev1, candidate)?
if (prev1 && prev2 && prev1.type === candidate.type && prev2.type === candidate.type) {
  return true
}
```

## Function Design

**Size:**
- Range: 5-50 lines typical for helpers, up to 100 lines for complex functions
- Examples: `pickForSlot()` (38 lines), `generatePlanAttempt()` (20 lines)
- Longer functions (100+) decompose logic into helper functions

**Parameters:**
- Positional parameters ordered by logical sequence, not alphabetically
- Example: `pickForSlot(pool, remainingBudget, planSoFar, slotIndex, slotsRemaining)`
- Type annotations always included: `plan: Restaurant[]`, `budget: number`

**Return Values:**
- Single value or object return
- Named return type: `Restaurant` or `WeeklyPlan` interfaces
- No void functions except event handlers and state setters

**React Patterns:**
- Component names: PascalCase, default export - `export default function HomePage() { ... }`
- Hook rules followed: `'use client'` at file top for client components
- Event handlers: inline arrow functions in JSX or named functions in scope
- State management: `useState()` for local state, Context API for shared state

## Module Design

**Exports:**
- Named exports for utilities and functions: `export function generateWeeklyPlan() { ... }`
- Type exports: `export type CuisineType = keyof typeof CUISINE_META`
- Default exports for React components: `export default function Header() { ... }`
- Named exports from utility modules for tree-shaking

**Barrel Files:**
- Not used in this codebase
- Each module exported individually where needed

**Library Boundaries:**
- `src/lib/`: Core business logic (recommend, types, restaurants, context)
- `src/components/ui/`: Reusable UI components (button, input, table, etc.)
- `src/components/layout/`: Layout/page-specific components (header, nav-links)
- `src/app/`: Next.js App Router pages and root layout

## Specific Patterns

**Const satisfies pattern:**
```typescript
// Validates shape at compile time while deriving union type from keys
export const CUISINE_META = {
  chi:  { label: '中式', color: '#67C23A' },
  jp:   { label: '日式', color: '#E6A23C' },
  // ...
} as const satisfies Record<string, { label: string; color: string }>
```

**Filter + random selection pattern:**
```typescript
// Used for picking random eligible options from a filtered set
const eligible = pool.filter((r) => r.price <= spendableNow && !hasCuisineViolation(...))
if (eligible.length > 0) {
  return eligible[Math.floor(Math.random() * eligible.length)]
}
```

**Multi-level fallback pattern:**
```typescript
// Try strict constraints first, relax progressively if needed
// 1. Budget + cuisine constraints
// 2. Budget only
// 3. Cheap option
// 4. Globally cheapest
```

**React destructuring in function signatures:**
```typescript
export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  // Type inline in params
}
```

**Template literal in style attributes:**
```typescript
style={{ backgroundColor: CUISINE_META[r.type].color }}
```

---

*Convention analysis: 2026-02-18*
