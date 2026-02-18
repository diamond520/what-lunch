# Technology Stack

**Project:** what-lunch (Vue 2 → Next.js rewrite)
**Researched:** 2026-02-18
**Confidence note:** External network tools (WebSearch, WebFetch, npm registry) were unavailable during this research. Version numbers reflect training knowledge (cutoff August 2025). Verify specific versions with `npm view [package] version` before pinning.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x | React framework with routing | Mandated by project constraints; native Vercel integration; App Router is the current paradigm. Pages Router is legacy as of Next.js 13+. |
| React | 19.x | UI library | Ships with Next.js 15; React 19 introduces Server Components as stable; concurrent features are default. |
| TypeScript | 5.x | Type safety | The old codebase had no typing and suffered for it (magic strings, type coercion bugs, no prop validation). TypeScript catches this class of bug at compile time. |

**Confidence:** HIGH (framework choices are well-established; Next.js 15 + React 19 pairing was released Oct 2024)

---

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility-first CSS | Standard in Next.js ecosystem. Zero runtime CSS-in-JS overhead. v4 dropped the config file in favor of CSS-native config — check current migration docs before starting. |
| CSS Modules | built-in | Component-scoped styles (fallback) | Next.js has native CSS Modules support; zero dependency. Use for one-off component styles that resist utility composition. |

**Confidence (Tailwind v4):** MEDIUM — v4 was released in January 2025; API surface changed significantly from v3. Verify current v4 docs before starting.
**What NOT to use:** Styled-components, Emotion, or any CSS-in-JS library. They conflict with React Server Components (RSC) and add unnecessary complexity for a no-backend app.

---

### UI Components

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shadcn/ui | current (copy-paste) | Accessible pre-built components | Not a traditional npm dependency — components are copied into your repo. Built on Radix UI primitives. Tailwind-native. Replaces Element UI in function. Zero lock-in: own the code, customize freely. |
| Radix UI | 2.x | Headless accessible primitives | shadcn/ui depends on it. Dialog, Select, and Toast primitives handle the accessibility patterns the old Element UI dialogs/drawers provided. |

**Confidence:** HIGH — shadcn/ui is the dominant Next.js component pattern as of 2025.
**What NOT to use:** Element Plus (Vue only), Ant Design (heavy, opinionated, hard to theme), MUI (over-engineered for an internal tool). These all have their own theming systems that fight with Tailwind.

---

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React built-ins (useState, useReducer, useContext) | built-in | In-memory app state | This app has no server state, no async data, no database. The restaurant list and recommendation state are small and local. Vuex was overkill in the Vue app; don't replicate that mistake with Zustand or Redux. |

**Confidence:** HIGH — for a no-backend, hardcoded-data app with ~20 restaurants, global state management libraries are architectural overreach. useState/useReducer at the page level is sufficient.

**When to reconsider:** If user-added restaurants need to persist across page reloads (localStorage), or if state needs to be shared across three or more deeply nested components. At that point, add Zustand (lightweight) — not Redux.

**What NOT to use:** Zustand, Jotai, Redux Toolkit — all are valid but none are warranted here. The old app used Vuex for a handful of mutations that affected one page. React hooks do this natively.

---

### Data Persistence

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Hardcoded TypeScript file | — | Restaurant default data | The constraint is no database. Replace `dishes.json` with a typed `data/restaurants.ts` that exports a `Restaurant[]` array. This is simpler than JSON (types inline) and works with Next.js static analysis. |
| localStorage (optional, later) | browser built-in | Persist user-added restaurants | If users add restaurants and expect them to survive refresh, localStorage is the appropriate no-backend solution. Not required for MVP. |

**Confidence:** HIGH — this is a design decision, not a library question.
**What NOT to use:** Any database (Prisma, Drizzle, Supabase, PlanetScale) — explicitly out of scope.

---

### Forms

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React Hook Form | 7.x | Form state and validation | The old app had form handling bugs (cancel button broken, no type coercion). React Hook Form handles all of this correctly with minimal boilerplate. Used natively with TypeScript. |
| Zod | 3.x | Schema validation | Pair with React Hook Form via `@hookform/resolvers`. Define a `restaurantSchema` with Zod — validates string/number types that the old app got wrong. |

**Confidence:** HIGH — React Hook Form + Zod is the standard form validation stack in the Next.js ecosystem.
**What NOT to use:** Formik (heavier, slower, superseded by RHF), manual validation in event handlers (the old approach that caused the type-coercion bugs).

---

### Utilities

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| crypto.randomUUID() | browser/Node built-in | UUID generation | The old app had a weak UUID generator (`Math.random().toString(36)`). `crypto.randomUUID()` is cryptographically secure and built into both the browser and Node.js. Zero dependency. |
| clsx | 2.x | Conditional class names | Pairs with Tailwind; standard pattern for conditional class application in React. |
| tailwind-merge | 2.x | Merge Tailwind classes safely | Prevents Tailwind class conflicts when composing shadcn/ui components. shadcn installs this automatically. |

**Confidence:** HIGH — these are well-established utilities.

---

### Development Tools

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ESLint | 9.x | Linting | Next.js has built-in ESLint config. v9 uses flat config format (breaking from v8). Use `eslint-config-next` which already includes React and Next.js rules. |
| Prettier | 3.x | Formatting | The old app had no formatter (only ESLint). Prettier eliminates all formatting debates. Use `prettier-plugin-tailwindcss` to auto-sort Tailwind classes. |
| TypeScript strict mode | — | Type checking | Enable `"strict": true` in `tsconfig.json`. Catches the type-coercion bugs that existed in the old app. |

**Confidence:** HIGH — standard toolchain for Next.js projects.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15 App Router | Next.js Pages Router | Pages Router is legacy. App Router is the current paradigm and what Vercel optimizes for. New projects should not use Pages Router. |
| Styling | Tailwind CSS | CSS Modules only | CSS Modules work fine but lack utility-first composition speed. For a fresh UI design, Tailwind is faster to iterate. |
| UI components | shadcn/ui | Headless UI | shadcn/ui is more comprehensive and has broader ecosystem support. Headless UI is Tailwind Labs' library but less actively developed. |
| State | React built-ins | Zustand | Zustand is excellent but adds a dependency without benefit for this scope. Can be added later without major refactor. |
| Forms | React Hook Form + Zod | Native HTML5 validation | HTML5 validation is insufficient for the type coercion and custom business rules (cuisine type validation) the app needs. |
| UI components | shadcn/ui | Ant Design | Ant Design has its own design system that conflicts with Tailwind. Heavy bundle for an internal tool. |
| Styling | Tailwind CSS | Styled-components | CSS-in-JS conflicts with React Server Components. Not viable for a modern Next.js app. |

---

## Installation

```bash
# Scaffold Next.js app (select TypeScript, Tailwind, App Router, src/ directory)
npx create-next-app@latest what-lunch --typescript --tailwind --app --src-dir --import-alias "@/*"

# Form handling
npm install react-hook-form @hookform/resolvers zod

# shadcn/ui initialization (interactive, adds components on demand)
npx shadcn@latest init

# Add specific shadcn components as needed
npx shadcn@latest add button card dialog select badge input label table

# Utilities (may already be installed by shadcn)
npm install clsx tailwind-merge
```

**Confidence:** MEDIUM — command syntax is accurate as of August 2025. `create-next-app` flags and `shadcn` CLI syntax may have minor updates. Run with `--help` to verify current flags.

---

## Version Verification

Before starting, confirm current versions:

```bash
npm view next version
npm view react version
npm view tailwindcss version
npm view react-hook-form version
npm view zod version
```

Tailwind v4 in particular had breaking changes from v3 (config moved to CSS, new utility names). Verify the Tailwind v4 migration guide before implementing.

---

## What the Stack Replaces

| Old (Vue 2) | New (Next.js) | Notes |
|-------------|---------------|-------|
| Vue 2 | Next.js 15 + React 19 | Framework |
| Vuex | useState / useReducer | State management (downsized — appropriate) |
| Vue Router | Next.js App Router | File-system routing |
| Element UI | shadcn/ui + Radix UI | Component library |
| SCSS (scoped) | Tailwind CSS | Styling |
| JavaScript | TypeScript | Language |
| node-sass | Not needed | Tailwind replaces SCSS |
| Math.random() UUID | crypto.randomUUID() | UUID generation |
| Vue filters | Utility functions | Data formatting |

---

## Sources

- Training knowledge (cutoff August 2025) — treat versions as approximate
- Next.js 15 + React 19 release: October 2024 (HIGH confidence — predates cutoff)
- Tailwind CSS v4 release: January 2025 (HIGH confidence — predates cutoff)
- shadcn/ui dominance in React ecosystem: observed throughout 2024-2025 (HIGH confidence)
- React Hook Form + Zod: established standard throughout 2023-2025 (HIGH confidence)
- Existing codebase analysis: `.planning/codebase/` files (HIGH confidence — first-party)

**Verify before pinning versions:** npm registry, official changelogs, or `create-next-app` scaffolding output.
