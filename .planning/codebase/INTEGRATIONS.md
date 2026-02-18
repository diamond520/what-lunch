# External Integrations

**Analysis Date:** 2026-02-18

## APIs & External Services

**None detected** - Application contains no external API integrations

- No HTTP clients (fetch, axios) configured
- No SDK imports for third-party services
- No API endpoints called from source code
- Self-contained restaurant recommendation system

## Data Storage

**Databases:**
- Not applicable - No database required

**In-Memory State Management:**
- React Context API (`RestaurantProvider` in `src/lib/restaurant-context.tsx`)
- Data persists only during browser session
- Default restaurants loaded from `src/lib/restaurants.ts` (hardcoded)
- Client-side state: `useState` hooks in `src/app/page.tsx` and `src/app/restaurants/page.tsx`

**File Storage:**
- Not applicable - No file uploads or storage services

**Caching:**
- Browser cache only (implicit Next.js caching)

**Local Storage:**
- Not utilized - Data is session-only

## Authentication & Identity

**Auth Provider:**
- None - Application is fully public with no authentication

**Implementation:**
- No login/signup functionality
- No API route protection
- All features accessible to all users

## Monitoring & Observability

**Error Tracking:**
- Not configured - No error tracking service (Sentry, LogRocket, etc.)

**Logs:**
- Console logs only (development debugging via `console.*`)
- No centralized logging service

**Performance Monitoring:**
- Not configured - No analytics or RUM service

## CI/CD & Deployment

**Hosting:**
- Vercel recommended in `README.md`
- Compatible with any Node.js hosting platform
- Next.js built-in deployment ready

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or other CI config files
- No automated test runners configured in workflows

**Build Commands:**
- `npm run dev` - Local development
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - ESLint validation
- `npm run test` - Vitest execution

## Environment Configuration

**Required env vars:**
- None - Application runs without environment variables

**Optional env vars:**
- Not applicable

**Secrets location:**
- Not applicable - No secrets used

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Font Services

**Google Fonts:**
- Geist (sans-serif) - Via `next/font/google` in `src/app/layout.tsx`
- Geist Mono (monospace) - Via `next/font/google` in `src/app/layout.tsx`
- Self-hosted optimization (no external requests at runtime after font files are downloaded)

## Component Library (Design System)

**shadcn/ui:**
- Registry: New York style
- Icon library: Lucide React
- Primitives: Radix UI
- CSS-in-JS: Class Variance Authority (CVA)
- Utility: tailwind-merge, clsx
- Configuration: `components.json` at project root
- Component paths: `@/components` alias (maps to `src/components/`)

## Static Resources

**Public Assets:**
- Location: `public/` directory
- Favicon: `public/favicon.ico`
- No external CDN required

## Type Definitions

**DefinitelyTyped:**
- @types/node 20
- @types/react 19
- @types/react-dom 19
- Provided by package dependencies (no separate registry needed)

---

*Integration audit: 2026-02-18*
