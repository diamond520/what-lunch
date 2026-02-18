# Phase 7: Dark Mode - Research

**Researched:** 2026-02-19
**Domain:** Dark mode theming — next-themes + Tailwind v4 + shadcn/ui + Next.js App Router
**Confidence:** HIGH

## Summary

Dark mode in a Next.js 16 App Router project with Tailwind v4 and shadcn/ui is a well-solved problem with a clear standard stack. The canonical solution is `next-themes` v0.4.6 paired with Tailwind v4's `@custom-variant dark` directive and shadcn/ui's CSS variable system. The project's existing `globals.css` already has the correct `@custom-variant dark (&:is(.dark *));` directive and a fully-defined `.dark {}` CSS variable block — meaning the CSS side requires zero changes.

The implementation is constrained to three integration points: (1) install `next-themes`, (2) wrap the root layout with a `ThemeProvider` client component, and (3) add a `ThemeToggle` button to the header. The key technical nuance is that `useTheme()` values are `undefined` on the server, so the toggle button must either gate behind a `mounted` check or use `dynamic` import with `ssr: false` to avoid hydration mismatches.

The cuisine badge inline styles (`style={{ backgroundColor: CUISINE_META[r.type].color }}`) use fixed hex colors (#67C23A, #E6A23C, etc.) that were designed for light mode. These colors remain visible on dark backgrounds but their contrast ratios on shadcn/ui's dark background (`oklch(0.145 0 0)` ≈ `#1C1C1C`) need manual verification — some (the darker teal `#109399`) may fail WCAG AA. This is a known gap; the simplest fix is to accept the colors as-is since they are not pure text-on-dark scenarios but rather colored chip labels.

**Primary recommendation:** Install `next-themes`, create `ThemeProvider` client wrapper, add `suppressHydrationWarning` to `<html>`, wrap root layout body, build a simple `ThemeToggle` button with mounted check. No CSS changes needed.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-themes | 0.4.6 | Theme state management — persists to localStorage, reads system preference, injects `.dark` class on `<html>` | Official shadcn/ui recommendation; handles SSR flicker prevention with injected script; React 19 support added in v0.4.0 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.574.0 (already installed) | Sun/Moon icons for toggle button | Always — already in project, no new install needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-themes | Manual localStorage + useEffect | Hand-rolling misses: SSR flicker, system preference detection, script injection before hydration. Don't hand-roll. |
| next-themes | @radix-ui/react-use-controllable-state + context | Requires building all persistence/system-pref logic manually. next-themes does this better. |

**Installation:**
```bash
npm install next-themes
```

No other new packages needed. `lucide-react` is already in `package.json`.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── layout.tsx              # Add ThemeProvider wrapper + suppressHydrationWarning
├── components/
│   ├── layout/
│   │   ├── header.tsx          # Add ThemeToggle to header (Server Component, import ThemeToggle)
│   │   ├── nav-links.tsx       # Unchanged
│   │   └── theme-toggle.tsx    # NEW: Client Component with mounted check
│   └── theme-provider.tsx      # NEW: Client wrapper for NextThemesProvider
```

### Pattern 1: ThemeProvider Client Wrapper

**What:** A thin `"use client"` wrapper around `NextThemesProvider`. Required because layout.tsx is a Server Component and cannot import Client-only providers directly — but it CAN import a Client Component that wraps them.

**When to use:** Always in Next.js App Router. This is the idiomatic pattern.

**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/dark-mode/next
// src/components/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### Pattern 2: Root Layout Integration

**What:** Wrapping the layout body with ThemeProvider and adding `suppressHydrationWarning` to `<html>`. The `suppressHydrationWarning` prop is mandatory — next-themes modifies the `class` attribute of `<html>` client-side, which differs from what the server rendered.

**When to use:** Root `layout.tsx` only.

**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/dark-mode/next
// src/app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <RestaurantProvider>
            <main className="min-h-screen">{children}</main>
          </RestaurantProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

Note: `Header` can stay a Server Component — it imports `ThemeToggle` which is a Client Component, and that is valid in App Router.

### Pattern 3: ThemeToggle Button with Mounted Guard

**What:** A Client Component that renders the Sun/Moon toggle. Must guard against hydration mismatch because `useTheme()` returns `undefined` on server — the `theme` value is only available after client hydration.

**When to use:** For any component that reads `theme` or `resolvedTheme` from `useTheme()`.

**Example — shadcn/ui official next-template pattern:**
```typescript
// Source: https://github.com/shadcn-ui/next-template/blob/main/components/theme-toggle.tsx
// src/components/layout/theme-toggle.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Render placeholder to avoid layout shift
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] dark:hidden" />
      <Moon className="hidden h-[1.2rem] w-[1.2rem] dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

Note: The official shadcn/ui next-template uses `dark:hidden` / `dark:block` class toggling, not CSS transform animations. Both work; this is simpler.

### Pattern 4: Header Integration

**What:** Add `ThemeToggle` to the header's flex row after the nav links. Header stays a Server Component.

**Example:**
```typescript
// src/components/layout/header.tsx
import { NavLinks } from './nav-links'
import { ThemeToggle } from './theme-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
        <span className="mr-6 font-semibold text-foreground">What Lunch?</span>
        <NavLinks />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
```

### Anti-Patterns to Avoid

- **Reading `theme` without mounted check:** `useTheme()` returns `theme: undefined` on server. Using `theme === "dark"` directly in JSX without a mounted check causes hydration mismatch.
- **Putting ThemeProvider inside a Server Component without a client wrapper:** `NextThemesProvider` is a Client Component. It must be wrapped in a `"use client"` file before being imported into a Server Component layout.
- **Forgetting `suppressHydrationWarning` on `<html>`:** next-themes injects the `.dark` class client-side. Without this prop, React will warn about the mismatch on every page load.
- **Changing `@custom-variant dark` in globals.css:** The existing `@custom-variant dark (&:is(.dark *));` is already correct and aligns with `attribute="class"`. Do not change it.
- **Using `attribute="data-theme"` in ThemeProvider:** Would conflict with the existing `@custom-variant dark (&:is(.dark *));` which listens for the `.dark` class. Keep `attribute="class"`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Flash of unstyled content (FOUC) on theme load | Custom script in `<head>` checking localStorage | next-themes | next-themes automatically injects a blocking script before React hydration to set the correct class immediately, preventing any flash |
| System preference detection | `window.matchMedia('(prefers-color-scheme: dark)')` + listener | next-themes with `enableSystem` | next-themes handles both initial detection and live system preference changes |
| localStorage persistence | Custom `useEffect` + `localStorage.setItem/getItem` | next-themes | Already built-in; next-themes handles storage, SSR safety, and tab synchronization |
| Theme state management | React Context + custom provider | next-themes | Would need to rebuild SSR-safe script injection, localStorage sync, and system preference logic |

**Key insight:** Dark mode in SSR frameworks is deceptively complex. The FOUC problem alone (server renders without knowing user preference) requires a blocking inline script injected before React hydration. next-themes implements this correctly. Custom solutions almost always produce flicker on first load.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch on ThemeToggle

**What goes wrong:** The toggle button renders with the wrong icon on initial load, or React logs a hydration warning about content mismatch.

**Why it happens:** `useTheme()` returns `theme: undefined` during SSR/pre-render because `localStorage` is not accessible server-side. If the component renders based on `theme` before mounting, the server output and client output differ.

**How to avoid:** Use a `mounted` state gated by `useEffect`:
```typescript
const [mounted, setMounted] = React.useState(false)
React.useEffect(() => setMounted(true), [])
if (!mounted) return <placeholder />
```

**Warning signs:** React console warning "Hydration failed because the initial UI does not match"; icon flipping on first load.

### Pitfall 2: Forgetting suppressHydrationWarning

**What goes wrong:** Console fills with "Warning: Prop `className` did not match" on every page load.

**Why it happens:** next-themes adds `class="dark"` (or nothing) to `<html>` client-side. The server renders `<html lang="zh-TW">` without the class; the client modifies it. React notices the mismatch.

**How to avoid:** Add `suppressHydrationWarning` to the `<html>` element in `layout.tsx`.

**Warning signs:** Console warnings about className mismatch on `<html>` element; these appear even when the app works correctly.

### Pitfall 3: CSS Custom-Variant Mismatch

**What goes wrong:** `dark:` Tailwind utilities don't apply when theme is toggled.

**Why it happens:** `next-themes` with `attribute="class"` adds `.dark` to `<html>`, but the project's `@custom-variant dark` directive must be configured to match this selector. The two systems must agree.

**How to avoid:** The existing `globals.css` already has `@custom-variant dark (&:is(.dark *));` which matches the `.dark` class strategy. Use `attribute="class"` in ThemeProvider (not `attribute="data-theme"`). Don't change either.

**Warning signs:** Dark mode button appears to toggle (localStorage updates, class changes on `<html>`) but colors don't change.

### Pitfall 4: Cuisine Badge Contrast in Dark Mode

**What goes wrong:** Cuisine type badges (chi, jp, kr, tai, west) use fixed hex colors designed for a white background. On shadcn/ui's dark background (`#1C1C1C` approximately), some colors may look different but remain legible.

**Why it happens:** `style={{ backgroundColor: CUISINE_META[r.type].color }}` uses hardcoded hex values. These don't adapt to dark mode — they stay the same color regardless of theme. The badge text color (set via Tailwind classes) DOES adapt.

**How to avoid:** Check badge text color. The badge components use `text-white` or `text-foreground`. Verify the combination is readable:
  - `#67C23A` (green) — readable on dark bg
  - `#E6A23C` (amber) — readable on dark bg
  - `#F56C6C` (red) — readable on dark bg
  - `#909399` (gray) — may be low contrast on dark bg; check
  - `#109399` (teal) — readable on dark bg

**Warning signs:** Badges look washed out or text is unreadable in dark mode. Most likely issue: if badge text is `text-white` on the gray (#909399) badge in dark mode.

### Pitfall 5: ThemeProvider Placement

**What goes wrong:** `<Header />` renders outside the theme context, so it doesn't get dark mode styles.

**Why it happens:** If `ThemeProvider` wraps only `children` but not `<Header />` in `layout.tsx`, the header is outside the context.

**How to avoid:** ThemeProvider must wrap BOTH `<Header />` AND the rest of the layout. The `@custom-variant dark (&:is(.dark *));` selector applies to ALL descendants of the element receiving the `.dark` class (which is `<html>`), so even elements outside ThemeProvider's React tree will receive dark mode CSS. However, any component using `useTheme()` hook must be inside the provider.

## Code Examples

Verified patterns from official sources:

### Full ThemeProvider Setup (shadcn/ui official pattern)
```typescript
// Source: https://ui.shadcn.com/docs/dark-mode/next
// src/components/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### ThemeProvider Props (next-themes v0.4.6)
```typescript
// Source: https://github.com/pacocoursey/next-themes
<ThemeProvider
  attribute="class"        // Adds class="dark" to <html> (required to match @custom-variant)
  defaultTheme="system"   // First load: follow OS preference
  enableSystem            // Respect prefers-color-scheme media query
  disableTransitionOnChange // Prevents jarring CSS transition cascade on switch
>
```

### Reading Theme State Safely
```typescript
// Source: https://github.com/pacocoursey/next-themes (README)
"use client"
import { useTheme } from "next-themes"

function Component() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme()
  // theme: 'light' | 'dark' | 'system' | undefined (undefined before mount)
  // resolvedTheme: 'light' | 'dark' (resolves 'system' to actual value)
  // systemTheme: 'light' | 'dark' (OS preference)
}
```

### Existing globals.css — Already Correct (No Changes Needed)
```css
/* Already in src/app/globals.css — DO NOT modify */
@custom-variant dark (&:is(.dark *));  /* Matches next-themes attribute="class" */

.dark {
  --background: oklch(0.145 0 0);     /* Dark backgrounds already defined */
  --foreground: oklch(0.985 0 0);
  /* ... all shadcn/ui dark variables already present */
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `darkMode: 'class'` in `tailwind.config.js` | `@custom-variant dark (&:is(.dark *));` in CSS | Tailwind v4.0 (Jan 2025) | No JS config file; CSS-first configuration |
| `ThemeProvider` imported directly in Server Component layout | `ThemeProvider` wrapped in `"use client"` component, then imported | Next.js App Router (2023+) | Required for RSC compatibility |
| Manual `localStorage` + `prefers-color-scheme` script | next-themes handles all of this | n/a | next-themes is now the standard; don't hand-roll |
| v0.3.x (no React 19 support) | v0.4.x (React 19 peer dep added) | March 2025 | v0.4.6 supports React 19.x without --legacy-peer-deps |

**Deprecated/outdated:**
- `tailwind.config.js` with `darkMode: 'class'`: Replaced by `@custom-variant` in CSS (already done in this project).
- Manual theme toggling scripts in `<head>`: Replaced by next-themes' injected script.

## Open Questions

1. **Cuisine badge text color in dark mode**
   - What we know: Badges use `style={{ backgroundColor: CUISINE_META[r.type].color }}` with fixed hex colors. The badge text class is not visible in the grep results — need to check actual badge rendering.
   - What's unclear: Whether the badge text (label) is set to white, black, or a CSS variable. If it's `text-white`, the gray (#909399) badge may have insufficient contrast on a dark `<html>` background.
   - Recommendation: Inspect `src/components/ui/badge.tsx` and the actual badge usage at `page.tsx:81`, `restaurants/page.tsx:355`, `weekend/page.tsx:67`. If text is white and the background colors are all saturated enough, no change needed. If contrast fails, add `text-gray-900` conditionally or accept as acceptable UX tradeoff for a small colored chip.

2. **`ml-auto` flex positioning for ThemeToggle in header**
   - What we know: The header uses `flex items-center`. NavLinks is after the brand name. ThemeToggle needs to be pushed to the right end.
   - What's unclear: Whether `ml-auto` on a wrapper div or `flex-1` on NavLinks is the right approach for this specific flex layout.
   - Recommendation: Use `<div className="ml-auto"><ThemeToggle /></div>` — standard pattern for pushing items to the right end of a flex row.

## Sources

### Primary (HIGH confidence)
- `https://github.com/pacocoursey/next-themes` - ThemeProvider API, useTheme hook, suppressHydrationWarning, mounted pattern, v0.4.6 release notes
- `https://github.com/pacocoursey/next-themes/releases` - Version history, React 19 support confirmation in v0.4.0
- `https://ui.shadcn.com/docs/dark-mode/next` - ThemeProvider wrapper pattern, layout.tsx integration
- `https://tailwindcss.com/docs/dark-mode` - @custom-variant dark syntax for v4, class vs data-attribute strategies
- `https://github.com/shadcn-ui/next-template/blob/main/components/theme-toggle.tsx` - Official shadcn ThemeToggle implementation
- Existing `/src/app/globals.css` - Confirmed existing `@custom-variant dark (&:is(.dark *));` and complete `.dark {}` CSS variable block

### Secondary (MEDIUM confidence)
- `https://iifx.dev/en/articles/456423217/solved-enabling-class-based-dark-mode-with-next-15-next-themes-and-tailwind-4` - Confirmed @custom-variant dark (&:where(.dark, .dark *)) works; verified existing (&:is(.dark *)) also correct
- `https://www.sujalvanjare.com/blog/dark-mode-nextjs15-tailwind-v4` - Confirmed attribute="class" alignment with CSS custom-variant

### Tertiary (LOW confidence)
- WebSearch results on cuisine badge contrast — no authoritative source; visual inspection recommended

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — next-themes v0.4.6 confirmed via GitHub releases; shadcn/ui official docs confirm it as the recommendation
- Architecture: HIGH — ThemeProvider wrapper pattern confirmed by shadcn/ui official docs; mounted check confirmed by next-themes README
- CSS configuration: HIGH — Existing globals.css already has correct @custom-variant; confirmed via Tailwind v4 official docs
- Pitfalls: HIGH for hydration/suppressHydrationWarning (multiple sources); MEDIUM for badge contrast (requires visual inspection)
- Code examples: HIGH — sourced from official next-template and shadcn/ui docs

**Research date:** 2026-02-19
**Valid until:** 2026-03-21 (30 days — next-themes is stable, Tailwind v4 is stable)
