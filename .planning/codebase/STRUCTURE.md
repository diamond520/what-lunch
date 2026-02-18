# Codebase Structure

**Analysis Date:** 2026-02-18

## Directory Layout

```
what-lunch/
├── src/                          # Application source code
│   ├── app/                       # Next.js App Router pages and layouts
│   │   ├── layout.tsx             # Root layout wrapping all pages
│   │   ├── page.tsx               # Home page (plan generation)
│   │   ├── restaurants/
│   │   │   └── page.tsx           # Restaurant management page
│   │   ├── globals.css            # Global Tailwind styles
│   │   └── favicon.ico
│   ├── components/                # React components
│   │   ├── layout/                # Layout/structural components
│   │   │   ├── header.tsx         # Top navigation bar
│   │   │   └── nav-links.tsx      # Navigation menu with active state
│   │   └── ui/                    # Shadcn primitive UI components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       ├── badge.tsx
│   │       └── navigation-menu.tsx
│   └── lib/                       # Utilities, types, state, business logic
│       ├── types.ts               # Type definitions and cuisine metadata
│       ├── restaurants.ts         # Default restaurant seed data
│       ├── restaurant-context.tsx # React Context for global state
│       ├── recommend.ts           # Plan generation algorithm
│       └── utils.ts               # Utility functions (cn)
├── __tests__/                     # Test files
│   └── recommend.test.ts          # Tests for plan generation algorithm
├── public/                        # Static assets
├── .planning/                     # GSD planning documents
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── next.config.ts                 # Next.js configuration
├── vitest.config.mts              # Vitest configuration
├── postcss.config.mjs             # PostCSS/Tailwind configuration
└── eslint.config.mjs              # ESLint configuration
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router pages and layouts
- Contains: Page components (`.tsx`), global styles, root layout
- Key files: `page.tsx` (home), `restaurants/page.tsx` (management), `layout.tsx` (root wrapper)

**`src/components/layout/`:**
- Purpose: Structural/layout components used across pages
- Contains: Header, navigation menu
- Key files: `header.tsx`, `nav-links.tsx`

**`src/components/ui/`:**
- Purpose: Shadcn primitive UI components (buttons, inputs, tables, etc.)
- Contains: Imported and customized from shadcn/ui package
- Key files: All files are imported components, used throughout app

**`src/lib/`:**
- Purpose: Core business logic, state management, types, constants
- Contains: Algorithm code, React Context, type definitions, utilities
- Key files: `recommend.ts` (algorithm), `restaurant-context.tsx` (state), `types.ts` (domain models)

**`__tests__/`:**
- Purpose: Unit and integration tests
- Contains: Test files matching `*.test.ts` pattern
- Key files: `recommend.test.ts` (algorithm tests)

## Key File Locations

**Entry Points:**

- `src/app/layout.tsx`: Root layout; applies fonts, wraps with `RestaurantProvider`, renders `Header`
- `src/app/page.tsx`: Home page; plan generation UI
- `src/app/restaurants/page.tsx`: Restaurant management UI

**Configuration:**

- `tsconfig.json`: TypeScript compiler options, path alias `@/*` → `src/*`
- `next.config.ts`: Next.js build configuration
- `vitest.config.mts`: Test runner configuration
- `postcss.config.mjs`: Tailwind CSS build configuration
- `eslint.config.mjs`: Linting rules
- `components.json`: Shadcn component configuration

**Core Logic:**

- `src/lib/recommend.ts`: Plan generation algorithm (generateWeeklyPlan, rerollSlot, validation functions)
- `src/lib/restaurant-context.tsx`: Global state provider and hook
- `src/lib/types.ts`: Type definitions, cuisine metadata constants

**Utilities:**

- `src/lib/utils.ts`: Helper function `cn()` for merging Tailwind class names
- `src/lib/restaurants.ts`: Default restaurant seed data

**Testing:**

- `__tests__/recommend.test.ts`: Comprehensive tests for algorithm behavior, budget constraints, cuisine diversity

## Naming Conventions

**Files:**

- `.tsx` extension for React components (require JSX)
- `.ts` extension for pure logic/utilities (no JSX)
- Page components use `page.tsx` following Next.js convention
- Kebab-case for component file names: `nav-links.tsx`, `restaurant-context.tsx`

**Directories:**

- Kebab-case for feature/layout directories: `components/layout/`, `components/ui/`
- Lowercase plural for grouped files: `components/` (contains multiple components)

**React Components:**

- PascalCase for component names: `Header`, `NavLinks`, `RestaurantProvider`
- `use` prefix for custom hooks: `useRestaurants()`
- `export` at module level for components (not default export for utilities)

**Types:**

- PascalCase for interfaces and types: `Restaurant`, `WeeklyPlan`, `CuisineType`
- `Type` suffix typically omitted for type aliases derived from constants: `CuisineType` (not `CuisineTypeType`)

**Functions:**

- camelCase for all functions: `generateWeeklyPlan()`, `rerollSlot()`, `hasCuisineViolation()`
- Internal helper functions prefixed with lowercase (no special marker): `pickForSlot()`, `cheapestPrice()`

**Variables:**

- camelCase for all variables: `restaurants`, `weeklyBudget`, `remainingBudget`
- UPPER_SNAKE_CASE for compile-time constants: `DEFAULT_BUDGET`, `BUDGET_MAX`, `DAY_LABELS`

## Where to Add New Code

**New Feature:**

- Primary code: Add business logic to `src/lib/` (e.g., new algorithm → `src/lib/newfeature.ts`)
- UI code: Create component in `src/components/` subdirectory (e.g., `src/components/features/newfeature.tsx`)
- Page route: Add page component in `src/app/` directory (e.g., `src/app/newfeature/page.tsx`)
- Tests: Add test file in `__tests__/` matching feature name (e.g., `__tests__/newfeature.test.ts`)

**New Component/Module:**

- Implementation: Place in `src/components/` (layout components) or `src/lib/` (non-UI utilities)
- Example: New form component → `src/components/forms/myform.tsx`
- Example: New algorithm → `src/lib/myalgorithm.ts`

**Utilities:**

- Shared helpers: `src/lib/utils.ts` if simple and general-purpose
- Feature-specific: Create `src/lib/featurename-utils.ts` if multiple related helpers

**Global State:**

- Add to existing `src/lib/restaurant-context.tsx` if restaurant-related
- Create new context file `src/lib/mynewcontext.tsx` if independent domain (e.g., user preferences)

## Special Directories

**`.next/`:**
- Purpose: Build output from Next.js (generated during build)
- Generated: Yes
- Committed: No (in `.gitignore`)
- Note: Contains compiled pages, server-side code, types

**`.planning/`:**
- Purpose: GSD planning documents and analysis
- Generated: No (manually created)
- Committed: Yes
- Note: Consumed by GSD orchestrator for code generation context

**`public/`:**
- Purpose: Static assets (favicon, SVGs)
- Generated: No
- Committed: Yes
- Note: Served directly by Next.js without processing

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (by npm install)
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-02-18*
