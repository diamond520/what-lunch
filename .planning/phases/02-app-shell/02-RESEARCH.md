# Phase 2: App Shell - Research

**Researched:** 2026-02-18
**Domain:** Next.js 16 App Router layout/navigation, shadcn/ui v3 with Tailwind v4, CSS theming
**Confidence:** HIGH

## Summary

This phase builds the navigable app skeleton over the Phase 1 scaffold (Next.js 16, Tailwind v4, shadcn/ui v3, `src/` layout already initialised). The primary task is: (1) add the `/restaurants` route, (2) wire a persistent top navigation bar into `src/app/layout.tsx`, and (3) use shadcn/ui's `NavigationMenu` with active-state highlighting driven by `usePathname`.

The stack is already locked: Next.js 16 App Router with TypeScript strict, Tailwind v4 CSS-first (no `tailwind.config.js`), shadcn/ui v3 new-york style. No libraries need to be installed as external runtime deps — shadcn CLI copies component source into `src/components/ui/`. The only CLI commands needed are `npx shadcn add navigation-menu` (and optionally `button`, `card` for future phases). Theme customisation is done entirely in `globals.css` via `@theme inline`.

**Primary recommendation:** Put a `<Header>` Server Component in `src/app/layout.tsx`, extract a `<NavLinks>` Client Component (needs `usePathname`), add `src/app/restaurants/page.tsx`, and install `navigation-menu` via the shadcn CLI. No third-party navigation library is needed.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | Framework, file-system routing, layouts | App Router is the canonical pattern for persistent layouts with partial rendering |
| tailwindcss | 4.1.18 | Utility CSS, CSS-first config via `@theme` | Already configured; no config file needed |
| shadcn (CLI) | 3.8.5 | Copies component source into project | Installed as devDep; components live in `src/components/ui/` |
| radix-ui | ^1.4.3 | Accessible primitives behind shadcn components | Already in `package.json` as single unified package |
| lucide-react | ^0.574.0 | Icon set used by shadcn new-york style | Canonical icon library for this shadcn style |
| clsx + tailwind-merge | already installed | Conditional classes and merge conflicts | Used by `src/lib/utils.ts` `cn()` helper |

### Components to Add via shadcn CLI

| Component | Install Command | Purpose |
|-----------|----------------|---------|
| navigation-menu | `npx shadcn add navigation-menu` | Horizontal nav bar with keyboard nav and accessibility |
| button | `npx shadcn add button` | May be needed for CTA elements on pages |

No new `npm install` dependencies are required for this phase. All component source is copied by the CLI.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| NavigationMenu | Plain `<nav>` with `<Link>` | NavigationMenu provides Radix accessibility primitives (keyboard nav, ARIA) at no extra cost |
| NavigationMenu | Menubar | Menubar is for desktop application menus (File/Edit/View). NavigationMenu is for site navigation links |
| CSS variables in globals.css | Custom Tailwind plugin | CSS-first is the Tailwind v4 standard; plugin approach is v3 legacy |

**Installation for phase 2:**
```bash
npx shadcn add navigation-menu
```

---

## Architecture Patterns

### Recommended Project Structure After Phase 2

```
src/
├── app/
│   ├── globals.css          # Tailwind v4 @theme, shadcn CSS vars (already exists)
│   ├── layout.tsx           # Root layout — MODIFY: add <Header> import
│   ├── page.tsx             # / route — recommendation page (placeholder for now)
│   └── restaurants/
│       └── page.tsx         # /restaurants route — management page (NEW)
├── components/
│   ├── ui/
│   │   └── navigation-menu.tsx  # shadcn CLI output (NEW)
│   └── layout/
│       ├── header.tsx           # Server Component: wraps NavLinks (NEW)
│       └── nav-links.tsx        # Client Component: usePathname active state (NEW)
└── lib/
    ├── types.ts             # Already exists
    ├── restaurants.ts       # Already exists
    └── utils.ts             # Already exists (cn helper)
```

### Pattern 1: Root Layout with Persistent Header

**What:** The root layout is a Server Component. It imports `<Header>` which is also a Server Component. The interactive part (`usePathname` for active state) is isolated in a `<NavLinks>` Client Component at the leaf.

**When to use:** Always — this is the canonical App Router pattern for shared chrome. Layouts do NOT rerender on navigation; only the `{children}` slot updates.

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/getting-started/server-and-client-components
// src/app/layout.tsx (Server Component, no "use client")
import Header from '@/components/layout/header'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}
```

### Pattern 2: Splitting Server / Client in Navigation

**What:** Keep `<Header>` as a Server Component (no `"use client"`). Extract only the part that needs `usePathname` into a `<NavLinks>` Client Component. Import `<NavLinks>` inside `<Header>`. This minimises the client bundle.

**When to use:** Whenever a layout element needs browser state (pathname, scroll, etc.) but the wrapper is static.

**Example:**
```typescript
// src/components/layout/nav-links.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/',            label: '今日推薦' },
  { href: '/restaurants', label: '餐廳管理' },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {NAV_ITEMS.map(({ href, label }) => (
          <NavigationMenuItem key={href}>
            <NavigationMenuLink asChild className={cn(
              navigationMenuTriggerStyle(),
              pathname === href && 'bg-accent text-accent-foreground'
            )}>
              <Link href={href}>{label}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
```

```typescript
// src/components/layout/header.tsx  (Server Component)
import { NavLinks } from './nav-links'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
        <span className="mr-6 font-semibold">What Lunch?</span>
        <NavLinks />
      </div>
    </header>
  )
}
```

### Pattern 3: Tailwind v4 CSS-First Theme Customisation

**What:** All theme tokens live in `globals.css`. Use `@theme inline` to map CSS variables to Tailwind utility classes. Existing `globals.css` already has this pattern from shadcn init.

**When to use:** Any time you add a custom colour or override a design token — never touch a `tailwind.config.js` (it doesn't exist in v4).

**Example:**
```css
/* Source: https://tailwindcss.com/blog/tailwindcss-v4 */
/* globals.css — to add a custom brand colour: */
:root {
  --brand: oklch(0.65 0.18 250);   /* blue-ish */
}
@theme inline {
  --color-brand: var(--brand);      /* now bg-brand / text-brand works */
}
```

### Pattern 4: Route for Second Page

**What:** Create `src/app/restaurants/page.tsx` as a Server Component placeholder. The root layout's header will be shared automatically.

```typescript
// src/app/restaurants/page.tsx
export default function RestaurantsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">餐廳管理</h1>
      <p className="text-muted-foreground mt-2">餐廳管理功能即將推出。</p>
    </main>
  )
}
```

### Anti-Patterns to Avoid

- **Making the root layout a Client Component:** Adding `"use client"` to `layout.tsx` just to use `usePathname` forces the entire layout tree into the client bundle. Extract only `<NavLinks>` as Client.
- **Using `useRouter().pathname`:** `useRouter` no longer exposes `pathname` in App Router. Use `usePathname` from `next/navigation` instead.
- **Putting navigation in `page.tsx`:** Navigation belongs in `layout.tsx` so it persists across routes without re-mounting.
- **Using `legacyBehavior passHref` pattern for NavigationMenuLink:** The current shadcn v3 docs show `asChild` on `NavigationMenuLink` directly wrapping `<Link>`. The old `legacyBehavior passHref` approach on an outer `<Link>` wrapping `NavigationMenuLink` is a deprecated pattern from Radix v1 era. Use `asChild` on the link itself.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Navigation accessibility | Custom `<nav>` with manual ARIA | `NavigationMenu` from shadcn | Keyboard navigation, focus trapping, ARIA roles handled by Radix |
| Active link detection | Manual `window.location` parsing | `usePathname()` from `next/navigation` | SSR-safe, works with App Router's partial rendering |
| Conditional class merging | String interpolation with ternary | `cn()` from `@/lib/utils` | `tailwind-merge` prevents class conflicts (e.g., duplicate bg-* values) |
| Theme colour tokens | Inline hex values in components | CSS variables in `globals.css` + `@theme inline` | Enables dark mode, consistent theming, and no duplication |
| Component styling | Custom CSS modules for nav styles | Tailwind utilities + `navigationMenuTriggerStyle()` | shadcn's trigger style function ensures correct hover/focus state |

**Key insight:** shadcn/ui components handle the 90% case of accessible navigation out of the box. The only customisation needed is active-state styling via `cn()` + `usePathname`.

---

## Common Pitfalls

### Pitfall 1: "use client" Bubbling Up the Tree

**What goes wrong:** Developer adds `usePathname` to `header.tsx` and adds `"use client"` to that file. This converts the entire header subtree (including any future server-only data fetching) to client rendering.
**Why it happens:** It looks simpler to just add `"use client"` to the component that needs it.
**How to avoid:** Create a separate `nav-links.tsx` with `"use client"`. Import it from `header.tsx` which stays as a Server Component.
**Warning signs:** `layout.tsx` or `header.tsx` has `"use client"` at the top.

### Pitfall 2: `usePathname` Returns Null in Pages Router Context

**What goes wrong:** If `usePathname` is somehow used in a context that hasn't initialised the App Router (e.g., testing setup), it may return null.
**Why it happens:** The hook is App Router-only.
**How to avoid:** This project is App Router only — not an issue here. Add a null guard if being defensive: `const pathname = usePathname() ?? '/'`.
**Warning signs:** Hydration errors or null pathname at runtime.

### Pitfall 3: Tailwind v4 @theme inline Not Used

**What goes wrong:** Developer adds CSS variables to `:root` but doesn't map them with `@theme inline`. The Tailwind utility class (e.g., `bg-brand`) doesn't exist.
**Why it happens:** v3 required `tailwind.config.js`; v4 requires the CSS-side mapping.
**How to avoid:** Always pair `:root { --foo: ... }` with `@theme inline { --color-foo: var(--foo); }`.
**Warning signs:** Tailwind class exists in markup but produces no style output.

### Pitfall 4: NavigationMenuLink with legacyBehavior

**What goes wrong:** Using the old pattern `<Link href="..." legacyBehavior passHref><NavigationMenuLink>...</NavigationMenuLink></Link>` may cause double-rendering or styling issues with current shadcn v3 + Next.js 16.
**Why it happens:** Old blog posts and StackOverflow answers reference pre-v13 Next.js Link API.
**How to avoid:** Use `<NavigationMenuLink asChild><Link href="...">...</Link></NavigationMenuLink>` as shown in current shadcn v3 docs.
**Warning signs:** Nav links appear unstyled or trigger console warnings about `legacyBehavior`.

### Pitfall 5: Missing `container` Constraint for 1280px+ Desktop

**What goes wrong:** Content stretches full-width on large monitors; no maximum width constraint applied.
**Why it happens:** Tailwind's `container` class alone doesn't center without `mx-auto`.
**How to avoid:** Use `className="container mx-auto px-4"` on the layout wrapper, or set `max-w-screen-xl mx-auto` directly.
**Warning signs:** Content is not visually contained at 1280px+ viewports.

---

## Code Examples

Verified patterns from official sources:

### usePathname for Active Nav Link

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/use-pathname
'use client'

import { usePathname } from 'next/navigation'

export function NavLinks() {
  const pathname = usePathname()
  // pathname === '/' on home, '/restaurants' on management page
}
```

### NavigationMenuLink with asChild (shadcn v3 pattern)

```typescript
// Source: https://ui.shadcn.com/docs/components/radix/navigation-menu (v3)
import {
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import Link from 'next/link'

// Current recommended pattern (not legacyBehavior):
<NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
  <Link href="/docs">Documentation</Link>
</NavigationMenuLink>
```

### Adding shadcn Component via CLI

```bash
# Source: shadcn CLI --help (verified locally, shadcn 3.8.5)
npx shadcn add navigation-menu
# Writes to src/components/ui/navigation-menu.tsx
# No additional npm packages needed (radix-ui already in package.json)
```

### Tailwind v4 Custom Color Token

```css
/* Source: https://tailwindcss.com/blog/tailwindcss-v4 */
/* In src/app/globals.css */
:root {
  --brand-primary: oklch(0.60 0.20 250);
}
@theme inline {
  --color-brand: var(--brand-primary);
}
/* Usage in components: className="bg-brand text-white" */
```

### Root Layout Integration

```typescript
// Source: https://nextjs.org/docs/app/getting-started/layouts-and-pages (v16.1.6)
// src/app/layout.tsx — layout does NOT rerender on route change
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        <Header />           {/* Server Component, persists across routes */}
        <main>{children}</main>  {/* Only this updates on navigation */}
      </body>
    </html>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useRouter().pathname` | `usePathname()` from `next/navigation` | Next.js 13 (App Router) | `useRouter` no longer has `.pathname` in App Router |
| `tailwind.config.js` for theme | `@theme` directive in CSS | Tailwind v4 (2025) | No config file; CSS is the source of truth |
| `@radix-ui/react-*` packages | Single `radix-ui` package | shadcn new-york v3 (2025) | Cleaner `package.json`; already present |
| `tailwindcss-animate` | `tw-animate-css` | shadcn v3 | Already in project's `package.json` |
| `toast` component | `sonner` component | shadcn v3 | `toast` deprecated; use `sonner` for notifications |
| `legacyBehavior passHref` on Link | `asChild` on NavigationMenuLink | Radix/Next.js update | Simpler composition pattern |
| `default` shadcn style | `new-york` style | shadcn v3 | `default` deprecated; project already uses `new-york` |

**Deprecated/outdated:**
- `tailwindcss-animate`: replaced by `tw-animate-css` (already correct in this project)
- `@radix-ui/react-navigation-menu` direct import: replaced by `radix-ui` unified package (handled by shadcn CLI automatically)

---

## Open Questions

1. **Dark mode toggle**
   - What we know: `globals.css` has `.dark` class with OKLCH variables; `@custom-variant dark (&:is(.dark *))` is configured
   - What's unclear: Does the user want a dark/light toggle button in the header for Phase 2, or just the design system in place?
   - Recommendation: Skip toggle for Phase 2 (not in requirements UI-01, UI-02, UI-03). Light mode only.

2. **Exact route for recommendation page**
   - What we know: Current `src/app/page.tsx` is `/` and shows restaurant count placeholder
   - What's unclear: The requirements say "recommendation page" — Phase 3 will fill this in. Phase 2 just needs a navigable skeleton.
   - Recommendation: Keep `/` as the recommendation page route and `/restaurants` as the management page route. Both are placeholders at end of Phase 2.

3. **shadcn NavigationMenu mobile behaviour**
   - What we know: Requirement UI-03 is "desktop use (1280px+)"; NavigationMenu is horizontal by default
   - What's unclear: Whether a hamburger menu for smaller viewports is needed
   - Recommendation: Desktop-only nav is sufficient for Phase 2. No mobile breakpoint handling needed.

---

## Sources

### Primary (HIGH confidence)

- https://nextjs.org/docs/app/getting-started/layouts-and-pages (v16.1.6, fetched 2026-02-18) — Layout pattern, partial rendering, `{children}` slot
- https://nextjs.org/docs/app/api-reference/functions/use-pathname (v16.1.6, fetched 2026-02-18) — `usePathname` API, Client Component requirement
- https://nextjs.org/docs/app/getting-started/server-and-client-components (v16.1.6, fetched 2026-02-18) — Server/Client component composition pattern
- https://ui.shadcn.com/docs/components/radix/navigation-menu (shadcn v3, fetched 2026-02-18) — `NavigationMenuLink asChild` pattern, install command
- https://ui.shadcn.com/docs/tailwind-v4 (fetched 2026-02-18) — Tailwind v4 changes, `@theme inline`, OKLCH colors

### Secondary (MEDIUM confidence)

- https://tailwindcss.com/blog/tailwindcss-v4 (official Tailwind blog) — CSS-first config, `@theme` directive syntax verified via WebSearch
- shadcn CLI verified locally: `npx shadcn@latest --version` → 3.8.5; `npx shadcn add navigation-menu` confirmed as correct install command

### Tertiary (LOW confidence)

- WebSearch results on NavBar Server/Client component architecture (multiple Medium/blog posts agree on the `"use client"` leaf pattern — consistent with official Next.js docs)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified from installed `package.json` and official docs
- Architecture: HIGH — patterns verified from official Next.js 16.1.6 docs (2026-02-16 date stamp)
- shadcn NavigationMenu API: HIGH — fetched from official v3 shadcn docs
- Pitfalls: MEDIUM — derived from official docs + community patterns that agree with official guidance
- Tailwind v4 CSS theming: HIGH — verified from official Tailwind blog + current `globals.css` structure matches documented pattern

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable libraries; shadcn/Tailwind v4 ecosystem moves fast but core APIs are stable)
