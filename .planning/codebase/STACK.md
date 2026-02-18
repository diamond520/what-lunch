# Technology Stack

**Analysis Date:** 2026-02-18

## Languages

**Primary:**
- TypeScript 5 - All source files (`.ts`, `.tsx`)

**Secondary:**
- JavaScript - Configuration files (`.mjs`, `.mts`)

## Runtime

**Environment:**
- Node.js - Version not explicitly pinned (inferred from Next.js 16.1.6 requirements, typically 18.x or higher)

**Package Manager:**
- npm - Version from `package-lock.json`
- Lockfile: Present

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with App Router
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering

**UI Components:**
- shadcn 3.8.5 - Headless component library (New York style)
- Radix UI 1.4.3 - Primitives for accessible components
- Lucide React 0.574.0 - Icon library

**Styling:**
- Tailwind CSS 4 - Utility-first CSS framework
- @tailwindcss/postcss 4 - PostCSS plugin for Tailwind

**Testing:**
- Vitest 4.0.18 - Unit test runner
- Vite-tsconfig-paths 6.1.1 - TypeScript path resolution for Vitest

**Build/Dev:**
- PostCSS 4 - CSS transformation (via `@tailwindcss/postcss`)
- ESLint 9 - Linting with Next.js config
- eslint-config-next 16.1.6 - Next.js ESLint rules

## Key Dependencies

**Critical:**
- class-variance-authority 0.7.1 - Utility for component variant management (used with shadcn components)
- clsx 2.1.1 - Class name utility for conditional styling
- tailwind-merge 3.4.1 - Merge Tailwind CSS classes without conflicts

**Development:**
- @types/node 20 - Node.js type definitions
- @types/react 19 - React type definitions
- @types/react-dom 19 - React DOM type definitions
- tw-animate-css 1.4.0 - Animation utilities for Tailwind

## Configuration

**Environment:**
- No `.env.local` or `.env.example` files detected
- Application uses static data only (no external service configuration)
- Can be deployed without environment variables

**Build:**
- TypeScript compilation via `next build`
- ESLint configuration: `eslint.config.mjs` (ESLint 9 flat config)
- PostCSS configuration: `postcss.config.mjs`
- Tailwind configuration: Managed by `@tailwindcss/postcss` v4 (CSS-first approach, no JS config file)
- Next.js configuration: `next.config.ts` (minimal, no custom config)

**TypeScript:**
- Config file: `tsconfig.json`
- Target: ES2017
- Strict mode enabled
- Path aliases: `@/*` → `./src/*`
- JSX mode: react-jsx (new transform)

## Platform Requirements

**Development:**
- Node.js 18+ (estimated, Next.js 16 requirement)
- npm 10+ (recommended for npm workspaces support)
- No database required
- No API keys or secrets needed

**Production:**
- Vercel (mentioned in README as recommended deployment target)
- Can deploy to any Node.js hosting (AWS, Digital Ocean, etc.)
- Static generation compatible (no dynamic backend required for core features)
- Uses Next.js App Router (required Node.js 18+)

## Package Management

**Dependencies:** 7 packages
- React ecosystem: react, react-dom, next
- UI/styling: radix-ui, lucide-react, class-variance-authority, clsx, tailwind-merge

**DevDependencies:** 10 packages
- Tooling: @tailwindcss/postcss, tailwindcss, eslint, typescript
- Testing: vitest, vite-tsconfig-paths
- Type definitions: @types/node, @types/react, @types/react-dom
- Component library: shadcn

**Total:** 17 dependencies + 3 type definition packages = 20 total packages

---

*Stack analysis: 2026-02-18*
