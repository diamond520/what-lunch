# Phase 10: Share Plan - Research

**Researched:** 2026-02-19
**Domain:** Clipboard API, toast/notification UI, formatted text generation, Next.js App Router client components
**Confidence:** HIGH

## Summary

Phase 10 adds one-click copy-to-clipboard for the weekly lunch plan and the weekend single pick. The implementation is a pure UI addition — no new business logic, no new routes, no new context. The entire feature lives in two existing client component page files (`src/app/page.tsx` and `src/app/weekend/page.tsx`) plus a new shadcn toast provider.

The canonical clipboard approach in 2026 is `navigator.clipboard.writeText()` — a Promise-based API available in all modern browsers. It requires a secure context (HTTPS or localhost) and user gesture (button click). Both requirements are already satisfied by this app's deployment target (Vercel HTTPS) and the fact that copying is triggered by a button click.

For the toast notification, the shadcn/ui ecosystem standard is **Sonner** via `npx shadcn@latest add sonner`. Sonner is the shadcn-recommended replacement for the older `@radix-ui/react-toast`. It is not currently installed in this project. The install adds `sonner` as a runtime dependency and drops `src/components/ui/sonner.tsx`. A `<Toaster />` component must be added once to the root layout; then any client component can call `toast('message')` directly.

The formatted text for clipboard needs to be readable in LINE, Slack, and similar messaging apps. These apps render plain text — no HTML or markdown tables. Plain text with emoji line separators and consistent spacing is the best format. The weekly plan format should be 5 lines (Mon–Fri), each with day label, restaurant name, cuisine label, and price. The weekend format is a single line or short block.

**Primary recommendation:** Install Sonner, add `<Toaster />` to root layout, add a `handleCopy` function and "複製計畫" button to `src/app/page.tsx`, add a `handleCopyWeekend` function and copy button to `src/app/weekend/page.tsx`. Zero new routes, zero new context changes, zero new lib files.

## Standard Stack

### Core (new to install)
| Library | Install | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sonner | `npx shadcn@latest add sonner` | Toast notifications | shadcn/ui official recommendation since 2024; replaces `@radix-ui/react-toast`; built-in dark mode support via next-themes; minimal bundle |

### Already Available
| API / Library | Source | Purpose |
|---------------|--------|---------|
| `navigator.clipboard.writeText()` | Browser built-in | Copy text to clipboard |
| `lucide-react` | Already installed (`^0.574.0`) | Copy icon (`Copy`, `Check`) |
| `Button` (shadcn) | Already installed | "複製計畫" button |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sonner | `@radix-ui/react-toast` (shadcn Toast) | Toast is the older shadcn component; requires more boilerplate (useToast hook, ToastProvider, etc.); Sonner is simpler and recommended |
| Sonner | Manual `useState` + CSS timeout for in-page feedback | Works but inferior UX; no stack management; fades out in isolation from app; misses accessibility |
| `navigator.clipboard.writeText()` | `document.execCommand('copy')` | `execCommand` is deprecated since 2020; not available in all secure contexts; avoid |
| `navigator.clipboard.writeText()` | `copy-to-clipboard` npm package | Unnecessary dependency; browser API is sufficient and already handles fallbacks in modern environments |

**Installation:**
```bash
npx shadcn@latest add sonner
```
This adds `sonner` to `dependencies` in `package.json` and creates `src/components/ui/sonner.tsx`.

## Architecture Patterns

### Recommended Changes (no new files needed beyond sonner.tsx)

```
src/
├── app/
│   ├── layout.tsx                  # ADD: <Toaster /> from sonner component
│   ├── page.tsx                    # ADD: handleCopy(), "複製計畫" Button
│   └── weekend/
│       └── page.tsx                # ADD: handleCopyWeekend(), copy Button
└── components/
    └── ui/
        └── sonner.tsx              # NEW: added by `npx shadcn@latest add sonner`
```

No changes to `src/lib/`, no new context, no new routes, no new algorithm.

### Pattern 1: Sonner Setup in Root Layout

**What:** Add `<Toaster />` once in `layout.tsx`. All client components can then call `toast()` from `sonner` directly without any hook or context wiring.

**When to use:** Once at the root, as the last child inside `<body>` (or inside `ThemeProvider` to pick up dark mode).

**Example:**
```typescript
// src/app/layout.tsx
import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Header />
          <RestaurantProvider>
            <main className="min-h-screen">{children}</main>
          </RestaurantProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

Note: Place `<Toaster />` INSIDE `<ThemeProvider>` so it inherits the dark mode theme. Sonner's shadcn wrapper passes `theme` from next-themes automatically.

### Pattern 2: Clipboard Copy with Toast Confirmation

**What:** An async `handleCopy` function that builds the formatted text string, calls `navigator.clipboard.writeText()`, and on success calls `toast()`. On failure (clipboard permission denied), calls `toast.error()`.

**When to use:** In any client component triggered by user gesture (button onClick).

**Example:**
```typescript
// src/app/page.tsx — inside HomePage component
import { toast } from 'sonner'
import { Copy } from 'lucide-react'

async function handleCopy() {
  if (!plan) return
  const text = formatWeeklyPlan(plan)
  try {
    await navigator.clipboard.writeText(text)
    toast('已複製到剪貼簿 ✓')
  } catch {
    toast.error('複製失敗，請手動複製')
  }
}
```

```tsx
{plan !== null && (
  <>
    {/* existing plan cards */}
    <Button variant="outline" onClick={handleCopy} className="mt-4">
      <Copy className="size-4 mr-2" />
      複製計畫
    </Button>
  </>
)}
```

### Pattern 3: formatWeeklyPlan Pure Function (inline, not in lib/)

**What:** A module-scoped helper function in `page.tsx` that builds the clipboard text from a `WeeklyPlan`. Kept in the page file (not `src/lib/`) because it is presentation logic specific to this one page's copy output — not shared business logic.

**When to use:** Called only from `handleCopy` in `page.tsx`.

**Format design for LINE/Slack readability:**
```
本週午餐計畫 🍱
星期一｜明星咖啡 西式 NT$180
星期二｜添好運 中式 NT$150
星期三｜松屋牛丼 日式 NT$120
星期四｜豆腐鍋 韓式 NT$160
星期五｜泰味館 泰式 NT$140
總花費：NT$750
```

Key decisions:
- Full-width `｜` separator (U+FF5C) reads well in messaging apps; avoids pipe character ambiguity
- Cuisine label from `CUISINE_META[r.type].label` — already localized in Chinese
- NT$ prefix consistent with existing app UI
- No markdown (asterisks, backticks) — plain text only; LINE renders Markdown inconsistently
- Trailing summary line with total cost mirrors what the UI already shows

**Example implementation:**
```typescript
// Module-scoped in src/app/page.tsx
function formatWeeklyPlan(plan: WeeklyPlan): string {
  const lines = plan.days.map(
    (r, i) => `${DAY_LABELS[i]}｜${r.name} ${CUISINE_META[r.type].label} NT$${r.price}`
  )
  return ['本週午餐計畫 🍱', ...lines, `總花費：NT$${plan.totalCost}`].join('\n')
}
```

### Pattern 4: Weekend Copy Button

**What:** Same pattern on `src/app/weekend/page.tsx` for the single selected restaurant.

**Format:**
```
假日推薦 🍽️
鼎泰豐(信義店) 中式 NT$600
距離：3000m｜評分：4.7
```

**Example:**
```typescript
// src/app/weekend/page.tsx — inside WeekendPage component
async function handleCopyWeekend() {
  if (!current) return
  const text = [
    '假日推薦 🍽️',
    `${current.name} ${CUISINE_META[current.type].label} NT$${current.price}`,
    `距離：${current.distance}m｜評分：${current.rating}`,
  ].join('\n')
  try {
    await navigator.clipboard.writeText(text)
    toast('已複製到剪貼簿 ✓')
  } catch {
    toast.error('複製失敗，請手動複製')
  }
}
```

The weekend format is simple enough that an inline string template is fine — no separate helper needed.

### Pattern 5: Copy Button Placement and Icon

**What:** A secondary action button placed after the primary "產生本週午餐計畫" button row or directly under the plan cards. Uses `variant="outline"` (consistent with the 重抽 buttons) and a `Copy` icon from lucide-react.

**Exact button position on page.tsx:**
- Place the "複製計畫" button in the action row next to "產生本週午餐計畫" if a plan exists, OR
- Place it below the plan grid alongside the "本週總花費" summary text

The second option (below the cards) is better because: the button is only meaningful once a plan exists, and placing it near the budget summary keeps actions close to their related data.

**Example:**
```tsx
{plan !== null && (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
      {/* ...day cards... */}
    </div>
    <div className="mt-4 flex items-center gap-4">
      <p className="text-sm text-muted-foreground">
        本週總花費：NT$ {plan.totalCost}　剩餘預算：NT$ {plan.weeklyBudget - plan.totalCost}
      </p>
      <Button variant="outline" size="sm" onClick={handleCopy}>
        <Copy className="size-4 mr-1" />
        複製計畫
      </Button>
    </div>
  </>
)}
```

**Weekend button placement:**
- Place directly below the result card, same row as "換一間" button

```tsx
{current !== null && (
  <div className="rounded-lg border bg-card p-6 shadow-sm max-w-sm">
    {/* ...card content... */}
    <div className="mt-4 flex gap-2">
      <Button variant="outline" onClick={handleReroll}>換一間</Button>
      <Button variant="outline" onClick={handleCopyWeekend}>
        <Copy className="size-4 mr-1" />
        複製
      </Button>
    </div>
  </div>
)}
```

### Anti-Patterns to Avoid

- **Separate `formatWeeklyPlan` in `src/lib/`:** This is presentation/copy text logic, not a reusable algorithm. Keep it in the page file next to its only user.
- **Syncing copy state via useState (isCopied toggle):** A brief `isCopied` button-label swap was common before Sonner; now Sonner toast is better UX, less code, and accessible.
- **Using `document.execCommand('copy')`:** Deprecated, removed from many contexts. Use `navigator.clipboard.writeText()` only.
- **Wrapping toast in useCallback or useEffect:** `toast()` is a fire-and-forget side effect inside a user event handler. No memoization or effect needed.
- **Adding `<Toaster />` outside `<ThemeProvider>`:** It will render in light mode even when dark mode is active. Always place inside `ThemeProvider`.
- **Putting the copy button in the header or nav:** Keep it contextual — next to the plan content, not in global navigation.
- **Markdown formatting in clipboard text:** LINE does not render markdown. `**bold**` will appear as literal asterisks. Plain text only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notification | Custom fade-in/out div + useState timer | Sonner via `npx shadcn@latest add sonner` | Handles z-index stacking, animations, dark mode, accessibility (aria-live), swipe-to-dismiss, and multiple toasts simultaneously |
| Clipboard write | execCommand / custom polyfill | `navigator.clipboard.writeText()` | Modern API, Promise-based, works in all supported browsers (Chrome 66+, Firefox 63+, Safari 13.1+) |
| Icon animation (copy → checkmark) | useState + timeout + icon swap | Sonner toast with `toast('已複製 ✓')` | Simpler; toast IS the feedback; no local state needed |

## Common Pitfalls

### Pitfall 1: Clipboard API unavailable (non-secure context)

**What goes wrong:** `navigator.clipboard.writeText()` throws `NotAllowedError` or `TypeError` if called in a non-HTTPS context (e.g., plain `http://` in production, or certain browser extension environments).

**Why it happens:** The Clipboard API requires a secure context. `localhost` is considered secure, but the Vercel deployment must be HTTPS (which it is by default).

**How to avoid:** Wrap in try/catch (already in Pattern 2). The catch arm calls `toast.error()` with a graceful message. This is sufficient — the deployment target (Vercel) is always HTTPS.

**Warning signs:** `toast.error('複製失敗')` fires consistently in production. Check that the deployment URL starts with `https://`.

### Pitfall 2: `toast` imported at module level breaks SSR

**What goes wrong:** If `toast` from `sonner` is imported and called during module initialization (outside a function), it may error during server-side rendering.

**Why it happens:** `sonner` accesses DOM APIs at import time in some configurations.

**How to avoid:** Only call `toast()` inside event handler functions (onClick callbacks). Never call it at the top level of a component or during render. The `import { toast } from 'sonner'` import itself is fine — only the call must be deferred.

**Warning signs:** Build errors or SSR crash mentioning Sonner or toast during static generation.

### Pitfall 3: `<Toaster />` placed outside `<ThemeProvider>`

**What goes wrong:** Toast notifications always appear in light mode, even when the app is in dark mode.

**Why it happens:** Sonner's shadcn wrapper reads theme from next-themes. If `<Toaster />` is outside `<ThemeProvider>`, `useTheme()` inside it fails or returns undefined.

**How to avoid:** Place `<Toaster />` as a sibling of `<Header />` and `<RestaurantProvider>`, all inside `<ThemeProvider>`.

**Warning signs:** Toast appears light-colored when app is in dark mode.

### Pitfall 4: `plan` state is in history array — copy must target currently viewed plan

**What goes wrong:** The page component derives `plan` as `history[selectedIndex]`. If `handleCopy` captures a stale closure of `plan`, it might copy a previous plan.

**Why it happens:** Stale closure in event handlers if `plan` is not correctly derived from state.

**How to avoid:** The existing code already derives `const plan = history.length > 0 ? history[selectedIndex] : null` correctly. The `handleCopy` function defined in the same scope reads `plan` from that derived value. No additional care needed as long as `handleCopy` is defined inside the component body (not hoisted out), which is the existing pattern.

**Warning signs:** User clicks "複製計畫" and copies a different plan than the one displayed.

### Pitfall 5: emoji in copied text rendering in LINE

**What goes wrong:** Some emoji render as boxes (tofu) in older Android LINE versions if the emoji is outside the basic emoji range.

**Why it happens:** Font/emoji support varies by device/OS.

**How to avoid:** Use widely-supported emoji: `🍱` (bento box, U+1F371) and `🍽️` (fork and plate, U+1F37D U+FE0F) are in EmojiOne/Android 5+ and supported in LINE and Slack on modern phones. Accept that very old devices may show boxes — this is an acceptable tradeoff.

**Warning signs:** Reports from users on old Android devices that the emoji appears as squares.

### Pitfall 6: Weekend page has no `plan` — it has `current` (Restaurant | null)

**What goes wrong:** Treating the weekend page identically to the weekday page and trying to pass a `WeeklyPlan` to the copy formatter.

**Why it happens:** The weekend page state is `current: Restaurant | null`, not a `WeeklyPlan`. The copy format and null-check are different.

**How to avoid:** The weekend copy function guards on `if (!current) return` and builds text from `current.name`, `current.type`, `current.price`, `current.distance`, `current.rating` directly (all fields present on `Restaurant`).

**Warning signs:** TypeScript error trying to call `formatWeeklyPlan(current)` on `src/app/weekend/page.tsx`.

## Code Examples

### Sonner Installation and Setup

```bash
npx shadcn@latest add sonner
```

This creates `src/components/ui/sonner.tsx`:
```typescript
// src/components/ui/sonner.tsx (auto-generated by shadcn)
'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      {...props}
    />
  )
}

export { Toaster }
```

### Root Layout with Toaster

```typescript
// src/app/layout.tsx — ADD Toaster import and element
import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Header />
          <RestaurantProvider>
            <main className="min-h-screen">{children}</main>
          </RestaurantProvider>
          <Toaster />          {/* ADD THIS */}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Weekly Plan Copy (page.tsx additions)

```typescript
// ADD imports to src/app/page.tsx
import { toast } from 'sonner'
import { Copy } from 'lucide-react'

// ADD module-scoped helper (above component, below constants)
function formatWeeklyPlan(plan: WeeklyPlan): string {
  const lines = plan.days.map(
    (r, i) => `${DAY_LABELS[i]}｜${r.name} ${CUISINE_META[r.type].label} NT$${r.price}`,
  )
  return ['本週午餐計畫 🍱', ...lines, `總花費：NT$${plan.totalCost}`].join('\n')
}

// ADD inside HomePage component body
async function handleCopy() {
  if (!plan) return
  try {
    await navigator.clipboard.writeText(formatWeeklyPlan(plan))
    toast('已複製到剪貼簿 ✓')
  } catch {
    toast.error('複製失敗，請手動複製')
  }
}

// MODIFY the plan display section — replace the existing <p> with:
{plan !== null && (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
      {/* ...unchanged day cards... */}
    </div>
    <div className="mt-4 flex items-center gap-4">
      <p className="text-sm text-muted-foreground">
        本週總花費：NT$ {plan.totalCost}　剩餘預算：NT$ {plan.weeklyBudget - plan.totalCost}
      </p>
      <Button variant="outline" size="sm" onClick={handleCopy}>
        <Copy className="size-4 mr-1" />
        複製計畫
      </Button>
    </div>
  </>
)}
```

### Weekend Copy (weekend/page.tsx additions)

```typescript
// ADD imports to src/app/weekend/page.tsx
import { toast } from 'sonner'
import { Copy } from 'lucide-react'

// ADD inside WeekendPage component body
async function handleCopyWeekend() {
  if (!current) return
  const text = [
    '假日推薦 🍽️',
    `${current.name} ${CUISINE_META[current.type].label} NT$${current.price}`,
    `距離：${current.distance}m｜評分：${current.rating}`,
  ].join('\n')
  try {
    await navigator.clipboard.writeText(text)
    toast('已複製到剪貼簿 ✓')
  } catch {
    toast.error('複製失敗，請手動複製')
  }
}

// MODIFY the result card section — add copy button alongside 換一間:
<div className="flex gap-2 mt-4">
  <Button variant="outline" onClick={handleReroll}>換一間</Button>
  <Button variant="outline" onClick={handleCopyWeekend}>
    <Copy className="size-4 mr-1" />
    複製
  </Button>
</div>
```

### Sonner Toast API (key calls)

```typescript
import { toast } from 'sonner'

toast('已複製到剪貼簿 ✓')          // success message
toast.error('複製失敗，請手動複製')  // error message
toast('message', { duration: 2000 }) // custom duration (default: 4000ms)
```

### Clipboard API

```typescript
// MDN: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
// Requires: secure context (HTTPS or localhost), user gesture
// Returns: Promise<void>
// Throws: DOMException (NotAllowedError) if permission denied

await navigator.clipboard.writeText(textString)
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | execCommand deprecated since 2020; async API is standard |
| `@radix-ui/react-toast` (shadcn Toast) | Sonner | shadcn switched official recommendation to Sonner in 2024; simpler API, built-in dark mode |
| `useToast()` hook + ToastProvider | `toast()` direct function call | Sonner removes the need for hooks/providers in consuming components |
| isCopied state toggle (button text swap) | Sonner toast notification | Toast is better UX: non-blocking, auto-dismissing, stackable |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Do not use. Removed from W3C spec.
- shadcn `Toast` component (`npx shadcn@latest add toast`): Still available but Sonner is now the shadcn-recommended pattern. Do not install the old Toast for this phase.

## Open Questions

1. **Plan history — which plan does "複製計畫" copy?**
   - What we know: The home page shows a history of up to 5 plans, with `selectedIndex` tracking which one is displayed. The derived `plan` variable is always `history[selectedIndex]`.
   - What's unclear: Nothing — `handleCopy` reads `plan` which is already the currently displayed plan. The button only appears when `plan !== null`. No ambiguity.
   - Recommendation: No special handling needed. The existing derivation is correct.

2. **Should the copy button have a brief "copied" state (icon swap or text change)?**
   - What we know: Sonner toast is the confirmation. No additional state is needed.
   - What's unclear: Whether the button should briefly show a checkmark icon (Copy → Check) as additional visual feedback alongside the toast.
   - Recommendation: Toast alone is sufficient. Adding `useState(isCopied)` + `setTimeout` for the icon swap adds 10 lines for marginal UX improvement. Skip it — keep the implementation minimal.

3. **Does the "複製計畫" button conflict with Phase 8 (Cuisine Filter)?**
   - What we know: Phase 8 adds cuisine filter UI to the picker page header area. Phase 10 adds a copy button near the plan cards/summary.
   - What's unclear: The exact final layout of the picker page after Phase 8.
   - Recommendation: Phase 10 adds the copy button below the plan cards (near the budget summary line). This is below the cuisine filter controls (which will be above the generate button). No conflict. The copy button placement is spatially separate.

4. **What if `navigator.clipboard` is undefined (very old browser or WebView)?**
   - What we know: `navigator.clipboard` is undefined in non-secure contexts and in some older Android WebViews.
   - What's unclear: Whether the app will ever be used in a WebView (e.g., opened inside LINE browser).
   - Recommendation: Add an additional guard: `if (!navigator.clipboard)` → `toast.error(...)`. This is a one-line addition to make the error path cleaner.

## Plan Breakdown Recommendation

This phase is small enough for **one plan**:

**Plan 10-01:** Install Sonner, wire Toaster to layout, add copy button + handleCopy to home page, add copy button + handleCopyWeekend to weekend page.

Estimated implementation time: ~15-20 minutes (4 files modified, 1 file added by CLI).

No tests are needed beyond manual verification: clipboard copy is a browser side-effect that is not testable in Vitest/jsdom without mocking, and the success criteria are human-verifiable (paste into LINE/Slack and confirm readability).

## Sources

### Primary (HIGH confidence)
- `https://sonner.emilkowal.ski/` — Sonner official docs: `toast()` API, `<Toaster />` setup, dark mode via next-themes
- `https://ui.shadcn.com/docs/components/sonner` — shadcn Sonner page: install command, layout wiring pattern
- `https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText` — Clipboard API: Promise<void>, secure context requirement, browser support table
- Direct codebase reads: `src/app/page.tsx`, `src/app/weekend/page.tsx`, `src/app/layout.tsx`, `src/lib/types.ts`, `src/lib/recommend.ts`, `package.json`

### Secondary (MEDIUM confidence)
- `https://caniuse.com/async-clipboard` — Clipboard API browser support: Chrome 66+, Firefox 63+, Safari 13.1+ (all modern targets)
- LINE/Slack plain text rendering: known behavior from general knowledge — these apps render plain text without markdown transformation by default

### Tertiary (LOW confidence)
- Emoji compatibility on Android LINE: general knowledge about emoji support range

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Sonner is confirmed shadcn recommendation via official docs; Clipboard API is a stable W3C standard
- Architecture: HIGH — all integration points are in existing files that were directly read; no new routes or context changes required
- Clipboard pitfalls: HIGH — MDN and browser compatibility tables confirm secure context requirement
- Toast pitfalls: HIGH — ThemeProvider placement confirmed by reading layout.tsx structure
- Formatted text design: MEDIUM — plain text format for LINE/Slack is best practice; emoji support on old devices is LOW confidence
- Plan breakdown: HIGH — scope is small and well-contained

**Research date:** 2026-02-19
**Valid until:** 2026-03-21 (Sonner and Clipboard API are stable; shadcn/ui recommendation unlikely to change)
