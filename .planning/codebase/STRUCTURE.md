# Codebase Structure

**Analysis Date:** 2026-02-19

## Directory Layout

```
what-lunch/
├── src/
│   ├── app/                          # Next.js App Router pages and API routes
│   │   ├── api/
│   │   │   └── restaurants/
│   │   │       └── route.ts          # POST endpoint to persist restaurants to config (dev only)
│   │   ├── history/
│   │   │   └── page.tsx              # History management page
│   │   ├── restaurants/
│   │   │   └── page.tsx              # Restaurant CRUD management page
│   │   ├── weekend/
│   │   │   └── page.tsx              # Weekend single-pick recommendation page
│   │   ├── layout.tsx                # Root layout, providers, header
│   │   ├── page.tsx                  # Home page (weekly planner)
│   │   ├── globals.css               # Global Tailwind CSS imports
│   │   └── favicon.ico
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx            # Top navigation bar
│   │   │   ├── nav-links.tsx         # Navigation link list
│   │   │   └── theme-toggle.tsx      # Dark mode toggle button
│   │   ├── ui/                       # shadcn-ui primitive components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   └── sonner.tsx            # Toast notification wrapper
│   │   └── theme-provider.tsx        # next-themes provider setup
│   ├── hooks/
│   │   └── use-slot-animation.ts     # Reusable animation state machine hook
│   └── lib/
│       ├── recommend.ts              # Recommendation algorithm (generateWeeklyPlan, rerollSlot, applyFilter)
│       ├── history.ts                # History utilities (getRecentlyVisitedIds, splitPoolByHistory)
│       ├── history-context.tsx       # History state provider with localStorage persistence
│       ├── restaurant-context.tsx    # Restaurant state provider with localStorage persistence
│       ├── restaurants.ts            # Default restaurant data (weekday + weekend)
│       ├── types.ts                  # Type definitions (Restaurant, CuisineType, CUISINE_META)
│       └── utils.ts                  # Helper utilities (cn for Tailwind class merging)
├── __tests__/                        # Vitest test files
│   ├── recommend.test.ts
│   ├── history.test.ts
│   ├── restaurants.test.tsx
│   ├── integration.test.tsx
│   ├── weekend-page.test.tsx
│   ├── use-slot-animation.test.ts
│   └── weekend.test.ts
├── public/                           # Static assets
├── .next/                            # Next.js build output (not committed)
├── node_modules/                     # Dependencies (not committed)
├── package.json
├── tsconfig.json
├── next.config.ts
├── vitest.config.mts
└── README.md
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router pages and API routes
- Contains: Page components (page.tsx), route handlers (route.ts), global layout, static assets
- Key files: `page.tsx` (home), `restaurants/page.tsx`, `history/page.tsx`, `weekend/page.tsx`, `layout.tsx`

**`src/components/`:**
- Purpose: Reusable React components and layout structure
- Contains: Layout shell (header, nav), UI primitives from shadcn, providers
- Key files: `layout/header.tsx`, `ui/button.tsx`, `theme-provider.tsx`

**`src/components/layout/`:**
- Purpose: Application chrome and navigation
- Contains: Header bar, navigation links, theme toggle
- Key files: `header.tsx` (sticky top bar), `nav-links.tsx`, `theme-toggle.tsx`

**`src/components/ui/`:**
- Purpose: Unstyled, accessible UI primitives from shadcn-ui library
- Contains: Radix UI-based components with Tailwind CSS styling
- Key files: Input, Button, Table, Tabs, Select, Badge, etc.
- Pattern: Minimal wrapper components; styling via className only

**`src/hooks/`:**
- Purpose: Custom React hooks for component logic
- Contains: Animation state machines, effects management
- Key files: `use-slot-animation.ts` (manages cycling animation + interval cleanup)

**`src/lib/`:**
- Purpose: Shared business logic, state management, type definitions
- Contains: Pure functions, React Context providers, type definitions, constants
- Key files:
  - `recommend.ts`: Core algorithm (generateWeeklyPlan, rerollSlot)
  - `history.ts`: History utility functions (no React imports)
  - `history-context.tsx`: Context provider for history state
  - `restaurant-context.tsx`: Context provider for restaurant state
  - `types.ts`: All TypeScript types and constants
  - `restaurants.ts`: Default data

**`__tests__/`:**
- Purpose: Vitest unit and integration tests
- Contains: Test files matching `*.test.ts` / `*.test.tsx`
- Structure: One test file per source module (recommend.test.ts → recommend.ts, etc.)
- Key files: `recommend.test.ts` (algorithm tests), `integration.test.tsx` (context + component tests)

**`public/`:**
- Purpose: Static assets served directly (favicon, images, etc.)
- Contains: favicon.ico, potentially future icons/images

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Application root, provider setup, metadata
- `src/app/page.tsx`: Home page (weekly lunch planner)
- `src/app/restaurants/page.tsx`: Restaurant management
- `src/app/history/page.tsx`: History viewing
- `src/app/weekend/page.tsx`: Weekend random picker

**Configuration:**
- `package.json`: Dependencies, scripts
- `tsconfig.json`: TypeScript compiler options
- `next.config.ts`: Next.js configuration
- `vitest.config.mts`: Vitest testing configuration
- `src/app/globals.css`: Global Tailwind CSS imports and custom classes

**Core Logic:**
- `src/lib/recommend.ts`: Recommendation algorithm
- `src/lib/history.ts`: History calculation functions
- `src/lib/types.ts`: Type definitions and cuisine constants
- `src/lib/restaurants.ts`: Default restaurant data

**State Management:**
- `src/lib/restaurant-context.tsx`: Restaurant state + persistence
- `src/lib/history-context.tsx`: History state + persistence

**Testing:**
- `__tests__/recommend.test.ts`: Algorithm tests
- `__tests__/history.test.ts`: History utility tests
- `__tests__/restaurants.test.tsx`: Restaurant management component tests
- `__tests__/integration.test.tsx`: End-to-end context + page flows

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js App Router convention)
- API routes: `route.ts` (Next.js App Router convention)
- Components: PascalCase with `.tsx` extension (e.g., `Header.tsx`, `RestaurantListPanel`)
- Utilities/pure functions: camelCase with `.ts` extension (e.g., `recommend.ts`, `history.ts`)
- Contexts: camelCase with `-context.tsx` suffix (e.g., `restaurant-context.tsx`)
- Hooks: camelCase with `use-` prefix, `.ts` extension (e.g., `use-slot-animation.ts`)
- Tests: Same as source + `.test.ts` / `.test.tsx` (e.g., `recommend.test.ts`)

**Directories:**
- Feature pages: kebab-case matching route (e.g., `src/app/restaurants/`, `src/app/weekend/`)
- Component categories: lowercase descriptive names (e.g., `layout/`, `ui/`)
- Exported types/utilities: kebab-case with descriptive names (e.g., `use-slot-animation`)

**Functions:**
- Event handlers: `handle*` prefix (e.g., `handleGenerate`, `handleEditSave`)
- Utility functions: verb-noun (e.g., `applyFilter`, `generateWeeklyPlan`, `getRecentlyVisitedIds`)
- React Context hooks: `use*` prefix (e.g., `useRestaurants`, `useHistory`)
- Custom hooks: `use*` prefix (e.g., `useSlotAnimation`)

**Variables:**
- State: camelCase, descriptive (e.g., `restaurants`, `isHydrated`, `selectedCuisines`)
- Constants: UPPER_SNAKE_CASE, module-level (e.g., `BUDGET_MIN`, `DEFAULT_BUDGET`, `MAX_HISTORY`)
- Local state in components: `[state, setState]` React convention (e.g., `[budget, setBudget]`)

**Types:**
- Interfaces: PascalCase, descriptive (e.g., `Restaurant`, `WeeklyPlan`, `RestaurantContextValue`)
- Unions: PascalCase or descriptive (e.g., `FilterMode`, `CuisineType`)
- Props interfaces: `*Props` suffix (e.g., `RestaurantListPanelProps`)

## Where to Add New Code

**New Feature (e.g., budget tracking over time):**
- Algorithm logic: `src/lib/budget-tracker.ts` (pure functions, no React)
- Context provider: `src/lib/budget-context.tsx` (if global state needed)
- Page: `src/app/budget/page.tsx` (or tab in existing page)
- Tests: `__tests__/budget.test.ts`, `__tests__/budget-context.test.tsx`

**New Component/Module:**
- Layout component: `src/components/layout/[name].tsx`
- UI primitive: `src/components/ui/[name].tsx`
- Feature component: Create in `src/components/[feature]/` or directly in page if not reused
- Always co-locate with feature or category

**New Page:**
- Create `src/app/[route-name]/page.tsx`
- Import context hooks and components
- Follow hydration pattern (check isHydrated before interactive UI)
- Add navigation link in `src/components/layout/nav-links.tsx`

**Utilities:**
- Shared helpers (Tailwind class merging): `src/lib/utils.ts`
- Domain-specific utilities (history, filtering): `src/lib/[domain].ts`
- Pure functions with no side effects (testable, reusable)

**Hooks:**
- Reusable component logic: `src/hooks/use-[feature].ts`
- Encapsulate effect cleanup (intervals, timeouts, event listeners)
- Export custom hook + types in single file

**Tests:**
- Co-locate in `__tests__/` directory with same filename as source
- Unit tests for pure functions (lib/*.ts)
- Integration tests for components with hooks/context
- Use Vitest + React Testing Library for component tests

## Special Directories

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (via `npm run build`)
- Committed: No (in .gitignore)

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in .gitignore)

**`__tests__/`:**
- Purpose: Test files
- Generated: No (manually created)
- Committed: Yes
- Pattern: Mirrors src/ structure conceptually (one test per source module)

**`public/`:**
- Purpose: Static assets served directly by Next.js
- Generated: No
- Committed: Yes
- Usage: Favicon, images, public JSON files

## Import Paths

**Path Aliases (configured in tsconfig.json):**
- `@/components/*` → `src/components/*`
- `@/lib/*` → `src/lib/*`
- `@/hooks/*` → `src/hooks/*`

**Usage Examples:**
```typescript
// Good: Use aliases for clarity and easy refactoring
import { Button } from '@/components/ui/button'
import { useRestaurants } from '@/lib/restaurant-context'
import { useSlotAnimation } from '@/hooks/use-slot-animation'

// Avoid: Relative paths when alias available
import { Button } from '../../../components/ui/button'
```

**Import Order:**
1. External packages (React, Next.js, third-party)
2. Internal alias imports (@/components, @/lib, @/hooks)
3. Type imports (type { ... } from '...')
4. Relative imports only when necessary (sibling files)

---

*Structure analysis: 2026-02-19*
