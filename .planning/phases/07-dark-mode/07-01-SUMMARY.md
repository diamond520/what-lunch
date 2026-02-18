---
phase: 07-dark-mode
plan: 01
subsystem: ui
tags: [next-themes, dark-mode, tailwind-v4, shadcn-ui, theme-toggle, css-variables]

# Dependency graph
requires:
  - phase: 02-app-shell
    provides: Header component and layout.tsx structure this wires into
  - phase: 01-foundation
    provides: globals.css with .dark {} CSS variables and @custom-variant dark already defined
provides:
  - ThemeProvider client wrapper component (next-themes)
  - ThemeToggle Sun/Moon button with mounted hydration guard
  - Full light/dark theme switching with system preference detection and localStorage persistence
affects:
  - 08-cuisine-filter
  - 09-lunch-history
  - 10-share-plan

# Tech tracking
tech-stack:
  added:
    - next-themes@0.4.6
  patterns:
    - "'use client' wrapper pattern for NextThemesProvider in App Router (server component cannot directly import client-only providers)"
    - "mounted state guard pattern for useTheme() to prevent SSR hydration mismatch"
    - "suppressHydrationWarning on <html> element when next-themes modifies class attribute client-side"
    - "dark:hidden/dark:block CSS-only icon switching (no JS flicker)"

key-files:
  created:
    - src/components/theme-provider.tsx
    - src/components/layout/theme-toggle.tsx
  modified:
    - src/app/layout.tsx
    - src/components/layout/header.tsx

key-decisions:
  - "ThemeProvider wraps both <Header /> and <RestaurantProvider>/<main> — required because ThemeToggle inside Header calls useTheme() which needs the provider above it"
  - "attribute='class' aligns with existing globals.css @custom-variant dark (&:is(.dark *)) — no CSS changes needed"
  - "defaultTheme='system' respects OS preference on first load; next-themes persists to localStorage automatically"
  - "Single quotes used in new files to match project prettier config"

patterns-established:
  - "ThemeProvider client wrapper: always create 'use client' wrapper before importing client-only library providers into Server Component layouts"
  - "Mounted guard: any component reading useTheme() must gate on a mounted useState/useEffect to prevent hydration mismatch"

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 7 Plan 1: Dark Mode Summary

**Dark mode via next-themes@0.4.6 with ThemeProvider client wrapper, Sun/Moon toggle in header, system preference detection, and localStorage persistence — zero CSS changes needed**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-18T16:29:11Z
- **Completed:** 2026-02-18T16:31:01Z
- **Tasks:** 2 of 2 auto tasks complete (Task 3 is human-verify checkpoint)
- **Files modified:** 4

## Accomplishments
- Installed next-themes@0.4.6 (React 19 compatible)
- Created ThemeProvider client wrapper for App Router compatibility
- Created ThemeToggle with mounted guard preventing hydration mismatch
- Wired ThemeProvider into layout.tsx wrapping all content including Header
- Added ThemeToggle to header at right end via ml-auto
- npm run build passes cleanly, all 53 tests pass, no lint errors on new files

## Task Commits

Each task was committed atomically:

1. **Task 1: Install next-themes and create ThemeProvider + ThemeToggle** - `d2358e9` (feat)
2. **Task 2: Wire ThemeProvider into layout.tsx and ThemeToggle into header.tsx** - `8d7d40b` (feat)
3. **Style fix: Quote style and formatting in new theme files** - `450598e` (style)

## Files Created/Modified
- `src/components/theme-provider.tsx` - Client wrapper for NextThemesProvider (required for App Router)
- `src/components/layout/theme-toggle.tsx` - Sun/Moon toggle button with mounted hydration guard
- `src/app/layout.tsx` - Added ThemeProvider wrapper + suppressHydrationWarning on html element
- `src/components/layout/header.tsx` - Added ThemeToggle import and ml-auto div at right end of nav

## Decisions Made
- ThemeProvider wraps both Header and RestaurantProvider/main to ensure ThemeToggle has provider access
- `attribute="class"` aligns with existing `@custom-variant dark (&:is(.dark *));` in globals.css — no CSS changes needed
- `defaultTheme="system"` respects OS preference on first load
- `disableTransitionOnChange` prevents jarring CSS cascade on theme switch
- Single quotes used in new files to match project prettier config

## Deviations from Plan

None — plan executed exactly as written. One style-only follow-up commit was added to align quote style with the project's prettier config (double-to-single quotes in new files), which resolved lint warnings.

## Issues Encountered

An existing Next.js dev server was already running on port 3000 during execution — not an issue, verification can use that instance directly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Dark mode infrastructure complete and verified building
- Phase 8 (Cuisine Filter) can proceed — all UI components use shadcn/ui CSS variables which already have dark variants
- Cuisine badge inline hex colors will remain fixed (light-mode-designed) but are visually acceptable on dark backgrounds per research analysis
