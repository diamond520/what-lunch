# Technology Stack

**Analysis Date:** 2026-02-19

## Languages

**Primary:**
- TypeScript 5.x - All source code (`src/**/*.ts`, `src/**/*.tsx`)
- JSX/TSX - React component syntax in `src/components` and `src/app`

**Secondary:**
- JavaScript - Configuration files (ESLint, PostCSS, Next.js)

## Runtime

**Environment:**
- Node.js (version not specified in `.nvmrc`, inferred from Next.js 16.1.6 support)

**Package Manager:**
- npm
- Lockfile: Present (`package-lock.json`)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack framework (`src/app` App Router)
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering

**UI & Styling:**
- TailwindCSS 4 - Utility-first CSS framework (`src/app/globals.css`)
- shadcn/ui (via `shadcn` package 3.8.5) - Pre-built component library
- Radix UI 1.4.3 - Headless UI primitives (imported in UI components)
- Lucide React 0.574.0 - Icon library (`<RefreshCw />`, `<Copy />`, `<Trash2 />`)
- class-variance-authority 0.7.1 - Component variant utility
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.4.1 - Merge conflicting Tailwind classes

**Theme Management:**
- next-themes 0.4.6 - Dark mode provider (`src/components/theme-provider.tsx`)

**Notifications:**
- sonner 2.0.7 - Toast notifications (`src/components/ui/sonner.tsx`)

**Testing:**
- Vitest 4.0.18 - Test runner (`vitest.config.mts`)
- @testing-library/react 16.3.2 - React component testing
- @testing-library/jest-dom 6.9.1 - DOM matchers
- @testing-library/user-event 14.6.1 - User interaction simulation
- jsdom 28.1.0 - DOM implementation for Node.js

**Build/Dev:**
- @tailwindcss/postcss 4 - PostCSS plugin for Tailwind
- PostCSS (implicit dependency via TailwindCSS)
- ESLint 9 - Linting
- Prettier 3.8.1 - Code formatting
- TypeScript 5 - Type checking

**ESLint Plugins:**
- eslint-config-next 16.1.6 - Next.js ESLint configuration
- eslint-config-prettier 10.1.8 - Disable conflicting ESLint rules
- eslint-plugin-prettier 5.5.5 - Run Prettier as ESLint rule
- eslint-plugin-better-tailwindcss 4.3.0 - Tailwind class ordering

**Dev Tools:**
- vite-tsconfig-paths 6.1.1 - Resolve TypeScript path aliases in Vitest
- tw-animate-css 1.4.0 - Additional Tailwind animations

**Type Definitions:**
- @types/node 20 - Node.js types
- @types/react 19 - React types
- @types/react-dom 19 - React DOM types

## Key Dependencies

**Critical:**
- Next.js 16.1.6 - Framework backbone; enables App Router, API routes, SSR/SSG
- React 19.2.3 - Core framework for UI components
- TailwindCSS 4 - Primary styling approach; configured via PostCSS
- Radix UI 1.4.3 - Provides accessible headless components (buttons, tabs, inputs, selects, labels, navigation-menu)

**UI & UX:**
- shadcn/ui - Pre-built, customizable components built on Radix UI; source in `src/components/ui/`
- Lucide React - Icon rendering for actions (refresh, copy, trash, pencil, check, x icons)
- sonner - Toast notifications for user feedback (copy success, errors)
- next-themes - Dark mode support with system preference detection

**Utilities:**
- clsx, class-variance-authority, tailwind-merge - CSS class utilities for dynamic styling
- crypto.randomUUID() - Used for generating UUIDs (browser native API, no package needed)

**Testing:**
- Vitest with jsdom - Isolated component testing in jsdom environment
- @testing-library/* - Testing DOM behavior and user interactions

## Configuration

**Environment:**
- No `.env.*` files detected; no external API keys or credentials required
- Development mode check: `process.env.NODE_ENV !== 'development'` in `/src/app/api/restaurants/route.ts`

**Build:**
- `next.config.ts` - Next.js configuration (currently empty)
- `tsconfig.json` - TypeScript compiler options:
  - Target: ES2017
  - Strict mode enabled
  - Module resolution: bundler
  - JSX: react-jsx (React 17+ syntax)
  - Path aliases: `@/*` → `./src/*`
- `vitest.config.mts` - Vitest configuration with jsdom environment
- `vitest.setup.ts` - Test setup (imports `@testing-library/jest-dom`, runs `cleanup()` after each test)
- `postcss.config.mjs` - PostCSS config with `@tailwindcss/postcss` plugin
- `eslint.config.mjs` - Flat config with Next.js core-web-vitals, TypeScript, Prettier, and Tailwind plugins
- `.prettierrc` - Code formatting rules:
  - No semicolons, single quotes, trailing commas, 100 char line width, 2-space indent
- `components.json` - shadcn/ui configuration (style: new-york, aliases for path resolution)

## Platform Requirements

**Development:**
- Node.js compatible with Next.js 16.1.6 (likely 18.x or 20.x)
- npm for package management
- TypeScript 5 support
- Terminal access (for `npm run dev`, `npm run build`, `npm test`)

**Production:**
- Deployment target: Vercel (inferred from Next.js project structure and README)
- Can run on any Node.js runtime supporting Next.js 16.1.6
- Static export possible (App Router with no dynamic features creates standalone pages)

---

*Stack analysis: 2026-02-19*
