# External Integrations

**Analysis Date:** 2026-02-19

## APIs & External Services

**None detected.**

The application does not integrate with external APIs or third-party services. All functionality is self-contained and locally stored.

## Data Storage

**Databases:**
- None. Application uses browser localStorage exclusively.
  - Weekday restaurants: `localStorage['what-lunch-restaurants']` (`STORAGE_KEY` in `src/lib/restaurant-context.tsx`)
  - Weekend restaurants: `localStorage['what-lunch-weekend-restaurants']` (`WEEKEND_STORAGE_KEY` in `src/lib/restaurant-context.tsx`)
  - Lunch history: `localStorage['what-lunch-history']` (`HISTORY_STORAGE_KEY` in `src/lib/history.ts`)
  - Lookback days setting: `localStorage['what-lunch-lookback-days']` (`LOOKBACK_STORAGE_KEY` in `src/lib/history.ts`)
  - Cuisine filter preference: `localStorage['what-lunch-cuisine-filter']` (`FILTER_STORAGE_KEY` in `src/app/page.tsx`)

**Storage pattern:** JSON serialization with fallback defaults (see `readStoredRestaurants()` in `src/lib/restaurant-context.tsx`, `readStoredHistory()` in `src/lib/history.ts`)

**File Storage:**
- Development mode only: POST `/api/restaurants` endpoint can persist new restaurants to `src/lib/restaurants.ts` (file system write)
  - Gated by `process.env.NODE_ENV !== 'development'` check in `src/app/api/restaurants/route.ts`
  - Uses Node.js `fs/promises` API to read/write TypeScript source file
  - Not available in production

**Caching:**
- None configured. Uses localStorage for user state persistence.

## Authentication & Identity

**Auth Provider:**
- None. No authentication system implemented.

**Current approach:**
- No login/user management
- No session tracking
- Client-side data storage (localStorage) — single-user per browser

## Monitoring & Observability

**Error Tracking:**
- None detected. No Sentry, LogRocket, or equivalent service.

**Logs:**
- Browser console via `toast()` notifications from sonner
  - Copy feedback: `toast('已複製到剪貼簿 ✓')` in `src/app/page.tsx`
  - Copy failures: `toast.error('複製失敗，請手動複製')`
  - API errors: `alert()` fallback in `src/app/restaurants/page.tsx`
- No server-side logging infrastructure

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from README.md "Deploy on Vercel" section and Next.js framework choice)

**CI Pipeline:**
- None detected. No GitHub Actions, GitLab CI, or equivalent configured.

## Environment Configuration

**Required env vars:**
- None. Application does not require environment variables for core functionality.

**Development-only:**
- `NODE_ENV` - Read by `src/app/api/restaurants/route.ts` to gate file write API

**Secrets location:**
- Not applicable. No secrets stored (no API keys, database credentials, etc.).
- No `.env` files referenced in codebase

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Data Flow & Integration Points

**Client-side only:**
- All restaurant data originates from hardcoded defaults in `src/lib/restaurants.ts`
- User modifications stored in browser localStorage
- No backend persistence except dev-mode file writes

**API endpoints:**
- `POST /api/restaurants` - Development-only endpoint to save new restaurants to `src/lib/restaurants.ts`
  - Requires `NODE_ENV === 'development'`
  - Returns 403 Forbidden in production
  - Used by `src/app/restaurants/page.tsx` "Save to config" button

**Browser APIs used:**
- `localStorage` - Full persistent state management
- `crypto.randomUUID()` - Generate unique IDs for history entries (native Web Crypto API)
- `navigator.clipboard.writeText()` - Copy weekly plan to clipboard
- `Date.toLocaleDateString('sv')` - Format dates as YYYY-MM-DD

---

*Integration audit: 2026-02-19*
