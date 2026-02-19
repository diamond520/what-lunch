# Coding Conventions

**Analysis Date:** 2026-02-19

## Naming Patterns

**Files:**
- Components: kebab-case (e.g., `theme-toggle.tsx`, `use-slot-animation.ts`)
- Pages: kebab-case with folder structure (e.g., `src/app/page.tsx`, `src/app/weekend/page.tsx`)
- Utilities/libraries: kebab-case (e.g., `history.ts`, `recommend.ts`)
- UI components: kebab-case (e.g., `button.tsx`, `navigation-menu.tsx`)

**Functions:**
- camelCase for all function declarations and exports
- Public functions: descriptive names (e.g., `generateWeeklyPlan`, `rerollSlot`, `useSlotAnimation`)
- Private/internal functions: camelCase with underscore prefix discouraged; instead use lowercase with implied privacy (e.g., `hasCuisineViolation`, `cheapestPrice`, `pickForSlot`)
- React hooks: `use` prefix (e.g., `useSlotAnimation`, `useRestaurants`, `useHistory`)
- Event handlers: `handle` prefix (e.g., `handleGenerate`, `handleReroll`, `handleCopy`)

**Variables:**
- camelCase for all variables and constants
- Local constants: UPPERCASE with CONST_NAME pattern (e.g., `DEFAULT_BUDGET`, `MAX_HISTORY`, `DAYS`)
- Module-level constants: UPPERCASE (e.g., `CUISINE_META`, `HISTORY_STORAGE_KEY`, `DAY_LABELS`)
- State variables: descriptive camelCase (e.g., `displayNames`, `animatingSlots`, `selectedCuisines`)
- Refs: suffix with `Ref` (e.g., `genIntervalRef`, `timeoutRef`, `prevFinalRef`)

**Types:**
- Interfaces: PascalCase (e.g., `Restaurant`, `WeeklyPlan`, `UseSlotAnimationOptions`)
- Type unions and aliases: PascalCase (e.g., `FilterMode`, `CuisineType`, `LunchHistoryEntry`)
- Generic type parameters: single uppercase letter or PascalCase (e.g., `T extends { id: string }`)

## Code Style

**Formatting:**
- Tool: Prettier 3.8.1
- Settings:
  - `semi: false` - no semicolons
  - `singleQuote: true` - single quotes for strings
  - `trailingComma: 'all'` - trailing commas in multi-line objects/arrays
  - `printWidth: 100` - line wrapping at 100 characters
  - `tabWidth: 2` - 2-space indentation

**Linting:**
- Tool: ESLint 9 with flat config (eslint.config.mjs)
- Rules: Extends `eslint-config-next` core-web-vitals and TypeScript configs
- Additional plugins:
  - `eslint-plugin-better-tailwindcss` - Tailwind CSS class warnings
  - `eslint-plugin-prettier` - enforces Prettier formatting (warn level)
- Disabled rules for this codebase:
  - `better-tailwindcss/enforce-consistent-line-wrapping` (off)
  - `better-tailwindcss/enforce-consistent-class-order` (off)

**Run Prettier:**
```bash
npm run format              # Format all src/ and __tests__/ files
npm run format:check       # Check formatting without writing
```

**Run ESLint:**
```bash
npm run lint               # Run ESLint (exact command varies based on eslint v9 config)
```

## Import Organization

**Order:**
1. React and Next.js imports (e.g., `import { useState } from 'react'`, `import Link from 'next/link'`)
2. Third-party library imports (e.g., `import { cva } from 'class-variance-authority'`, `import { toast } from 'sonner'`)
3. Local imports from `@/` paths (organized by type: contexts, hooks, lib functions, components, UI)
4. Type-only imports (if any, grouped with local imports using `import type`)

**Path Aliases:**
- `@/*` → `./src/*` (defined in `tsconfig.json`)
- Always use `@/` for imports from src directory (never relative paths like `../../`)

**Examples:**
```typescript
// Order in page.tsx
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRestaurants } from '@/lib/restaurant-context'
import { useHistory } from '@/lib/history-context'
import { generateWeeklyPlan, rerollSlot, applyFilter, type FilterMode, type WeeklyPlan } from '@/lib/recommend'
import { getRecentlyVisitedIds, splitPoolByHistory, type LunchHistoryEntry } from '@/lib/history'
import { CUISINE_META, type CuisineType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { RefreshCw, Copy } from 'lucide-react'
import { toast } from 'sonner'
```

## Error Handling

**Pattern:**
- Use explicit `throw new Error(message)` for invariant violations
- Errors are thrown in:
  - Context hooks when used outside provider: `useRestaurants`, `useHistory` (`src/lib/restaurant-context.tsx:114`, `src/lib/history-context.tsx:89`)
  - Pure functions with preconditions: `generateWeeklyPlan`, `pickRandomRestaurant` (`src/lib/recommend.ts`)
- Error messages are descriptive and human-readable

**Examples from codebase:**
```typescript
// src/lib/recommend.ts
export function generateWeeklyPlan(pool: Restaurant[], weeklyBudget: number, ...): WeeklyPlan {
  if (pool.length === 0) {
    throw new Error('Restaurant pool cannot be empty')
  }
  // ... implementation
}

// src/lib/restaurant-context.tsx
export function useRestaurants(): RestaurantContextType {
  const ctx = useContext(RestaurantContext)
  if (!ctx) throw new Error('useRestaurants must be used within RestaurantProvider')
  return ctx
}
```

**Error recovery:**
- localStorage read errors: wrapped in try-catch, returns default value on failure (`src/lib/history.ts:18-26`, `src/app/page.tsx:31-40`)
- clipboard copy errors: caught and user receives toast error (`src/app/page.tsx:205-217`)
- localStorage write errors: ignored silently in useEffect (`src/app/page.tsx:83-93`)

## Logging

**Framework:** console (no structured logging library)

**Patterns:**
- No console.log in production code observed
- `toast` from sonner package used for user-facing notifications:
  - Success: `toast('message')` or `toast.success('message')`
  - Error: `toast.error('message')`
- Logging decisions left to developer; no explicit logging pattern enforced

## Comments

**When to Comment:**
- Architecture decisions and non-obvious algorithms documented with JSDoc/block comments
- Complex business logic (e.g., cuisine diversity checking, budget planning fallbacks)
- State management patterns explained (e.g., animation vs plan state separation)

**JSDoc/TSDoc:**
- Used selectively on exported functions and types
- Type definitions often include inline comments explaining purpose and constraints

**Examples from codebase:**
```typescript
// src/lib/types.ts - inline comments explain pattern rationale
// Pattern: as const satisfies Record<> derives union type from object keys
// while validating each entry's shape at compile time.
export const CUISINE_META = { ... }

// src/lib/history.ts - comments explain non-obvious behavior
// Compute a cutoff date that is lookbackDays business days before today (local date).
// Business days = Mon–Fri; Sat(6) and Sun(0) are skipped when counting backwards.
export function getRecentlyVisitedIds(...): Set<string> { ... }

// src/app/page.tsx - comments explain state design decisions
// Animation state — separate from plan (never mutate plan for animation display)
const [displayNames, setDisplayNames] = useState<(string | null)[]>(Array(5).fill(null))
```

## Function Design

**Size:** Functions kept focused and testable
- Pure functions dominate in lib modules (recommend.ts, history.ts)
- React components encapsulate state and side effects
- Helper functions extracted when logic exceeds ~30 lines

**Parameters:**
- Prefer explicit parameters over options objects for simple cases
- Use options object `{ }` for functions with multiple optional parameters:
  ```typescript
  export function generateWeeklyPlan(
    pool: Restaurant[],
    weeklyBudget: number,
    options?: { relaxDiversity?: boolean },
  ): WeeklyPlan
  ```
- Type parameters documented in JSDoc comments

**Return Values:**
- Explicit return types on all exported functions
- Internal functions may use implicit return type inference
- Prefer returning new objects over mutation; immutability favored in pure functions

**Example pure function pattern (src/lib/recommend.ts):**
```typescript
export function rerollSlot(
  plan: WeeklyPlan,
  slotIndex: number,
  pool: Restaurant[],
  options?: { relaxDiversity?: boolean },
): WeeklyPlan {
  // ... compute updates
  const newDays = [...plan.days]
  newDays[slotIndex] = pick
  return { ...plan, days: newDays, totalCost: ... }  // new object, no mutation
}
```

## Module Design

**Exports:**
- Named exports for all public functions and types (never default exports except page components)
- Type exports marked with `export type` or `import type` for tree-shaking
- Barrel files not used; import directly from source files

**Examples:**
```typescript
// src/lib/recommend.ts
export type FilterMode = 'exclude' | 'lock'
export function applyFilter(...): Restaurant[] { ... }
export interface WeeklyPlan { ... }
export function generateWeeklyPlan(...): WeeklyPlan { ... }
```

**Module separation:**
- Pure functions in lib/ modules (`recommend.ts`, `history.ts`)
- Context providers as React components (`restaurant-context.tsx`, `history-context.tsx`)
- UI components in components/ (`button.tsx`, `header.tsx`)
- Pages in app/ (Next.js App Router convention)

---

*Convention analysis: 2026-02-19*
