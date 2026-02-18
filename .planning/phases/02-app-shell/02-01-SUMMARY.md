---
phase: 02-app-shell
plan: "01"
subsystem: navigation
tags: [shadcn, navigation-menu, header, next.js, app-router]

dependency-graph:
  requires: [01-foundation]
  provides:
    - shadcn NavigationMenu component at @/components/ui/navigation-menu
    - Header Server Component at src/components/layout/header.tsx
    - NavLinks Client Component with active-state highlighting at src/components/layout/nav-links.tsx
    - /restaurants route placeholder
  affects: [02-02, 02-03, future phases using Header]

tech-stack:
  added:
    - "@radix-ui/react-navigation-menu (via shadcn navigation-menu)"
  patterns:
    - "Server/Client Component split: Header is server, NavLinks is client (usePathname)"
    - "Active route detection via usePathname() with fallback to '/'"
    - "navigationMenuTriggerStyle() + cn() for conditional active class"

key-files:
  created:
    - src/components/ui/navigation-menu.tsx
    - src/components/layout/nav-links.tsx
    - src/components/layout/header.tsx
    - src/app/restaurants/page.tsx
  modified: []

decisions:
  - "Header is a Server Component (no 'use client') — NavLinks handles all client interactivity"
  - "usePathname() ?? '/' fallback prevents null during SSR hydration"
  - "NAV_ITEMS defined as const tuple for exhaustive type checking"

metrics:
  duration: "49 seconds"
  completed: "2026-02-18"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 02 Plan 01: Install NavigationMenu, create Header/NavLinks, /restaurants placeholder — Summary

**One-liner:** shadcn NavigationMenu installed, Header server component + NavLinks client component with pathname-based active highlighting created, /restaurants placeholder route added.

## What Was Done

Installed the shadcn `navigation-menu` component via CLI, then built two layout components:

1. `NavLinks` (Client Component) — uses `usePathname()` to apply `bg-accent text-accent-foreground` to the active nav item. Renders links for `'/'` (今日推薦) and `'/restaurants'` (餐廳管理).
2. `Header` (Server Component) — sticky top bar with app name "What Lunch?" and `<NavLinks />`. No `'use client'` directive; only the nav-links child opts into the client bundle.

A `/restaurants` page placeholder was also created, showing a localized "coming in Phase 4" message.

## Files Created

| File | Description |
|------|-------------|
| `src/components/ui/navigation-menu.tsx` | shadcn NavigationMenu primitive (168 lines) |
| `src/components/layout/nav-links.tsx` | NavLinks client component with active-state |
| `src/components/layout/header.tsx` | Header server component |
| `src/app/restaurants/page.tsx` | /restaurants placeholder page |

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 - Install navigation-menu | `0c7f777` | feat(02-01): install shadcn navigation-menu component |
| 2 - Create NavLinks | `90ef819` | feat(02-01): create NavLinks client component with active-state highlighting |
| 3 - Create Header + restaurants page | `d84997e` | feat(02-01): create Header server component and /restaurants placeholder |

## Verification Results

- `npx tsc --noEmit` — passed (no TypeScript errors)
- `grep "'use client'" header.tsx` — PASS: no use client in header.tsx (confirmed server component)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Header is Server Component, NavLinks is Client Component | Minimises client bundle; only usePathname() needs browser runtime |
| `usePathname() ?? '/'` fallback | Prevents null reference during SSR hydration edge cases |
| `NAV_ITEMS as const` | Tuple type ensures href values are string literals, enabling exact pathname comparison |

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

- Header component is ready to be imported into `src/app/layout.tsx` (Phase 02-02 or 02-03)
- NavLinks will automatically highlight active routes once integrated
- /restaurants route exists and will receive full CRUD UI in Phase 4
