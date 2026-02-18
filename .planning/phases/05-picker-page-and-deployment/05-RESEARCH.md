# Phase 5: Picker Page and Deployment - Research

**Researched:** 2026-02-18
**Domain:** React Client Component UI, Next.js static deployment, Vercel
**Confidence:** HIGH

## Summary

Phase 5 wires together the algorithm from Phase 3 (`generateWeeklyPlan`, `rerollSlot` in `src/lib/recommend.ts`) and the restaurant context from Phase 4 (`useRestaurants()`) into the main home page (`src/app/page.tsx`). The page is a Client Component with budget input, a generate button, five recommendation cards (Mon-Fri), and per-card re-roll buttons. Deployment to Vercel is standard Next.js Git integration — no `output: 'export'` is needed.

The codebase is already in a clean state: `next build` completes with zero errors or warnings, all 22 Vitest tests pass, and ESLint reports no issues. The build output marks both existing pages as `○ (Static)`, confirming that `'use client'` pages with `useState` are prerendered to static HTML and hydrated client-side — exactly what the new home page will be.

No new npm packages are required. All needed components (`Button`, `Input`, `Label`, `Badge`) and icons (`RefreshCw` from `lucide-react`) are already installed.

**Primary recommendation:** Replace `src/app/page.tsx` with a `'use client'` component that owns all picker state; deploy to Vercel by running `vercel --prod` from the CLI (GitHub integration is the ideal path but Vercel auth is not confirmed configured).

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 | Framework, SSG/Client Component boundary | Already in use |
| React | 19.2.3 | useState for plan/budget state | Already in use |
| `src/lib/recommend.ts` | project | `generateWeeklyPlan`, `rerollSlot` functions | Already built (Phase 3) |
| `src/lib/restaurant-context.tsx` | project | `useRestaurants()` hook for the pool | Already built (Phase 4) |
| `src/lib/types.ts` | project | `Restaurant`, `WeeklyPlan`, `CUISINE_META` types/constants | Already built |
| shadcn/ui | v3 new-york | `Button`, `Input`, `Label`, `Badge` components | Already installed |
| lucide-react | ^0.574.0 | `RefreshCw` icon for re-roll button | Already installed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS v4 | ^4 | Layout, cards, responsive grid | All styling |
| `CUISINE_META[r.type].color` | project | Cuisine tag background color via inline style | On each card's cuisine badge |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<input type="range">` | shadcn Slider | No Slider in the installed component set; native range works and matches existing Input usage pattern |
| `<input type="number">` | shadcn Input | Could combine both — a range slider + a linked number Input for the budget; both are valid |
| Vercel Git integration | `vercel --prod` CLI | Git integration is cleaner (auto-deploys on push) but requires Vercel auth to be set up; CLI is the reliable fallback |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

No new files or folders needed beyond replacing `src/app/page.tsx`. The component can be self-contained.

```
src/
├── app/
│   ├── page.tsx          ← REPLACE with 'use client' picker component
│   ├── layout.tsx        ← unchanged (wraps with RestaurantProvider)
│   └── restaurants/
│       └── page.tsx      ← unchanged
└── lib/
    ├── recommend.ts      ← unchanged (generateWeeklyPlan, rerollSlot)
    ├── restaurant-context.tsx  ← unchanged (useRestaurants)
    └── types.ts          ← unchanged (Restaurant, WeeklyPlan, CUISINE_META)
```

### Pattern 1: Client Component Page with Lifted State

**What:** The home page declares `'use client'` at the top and owns all picker state. `useRestaurants()` provides the restaurant pool. `generateWeeklyPlan` and `rerollSlot` are called from event handlers.

**When to use:** Whenever a page needs `useState` + context hooks. The `RestaurantProvider` in `layout.tsx` makes `useRestaurants()` available to any Client Component in the tree.

**Example:**
```typescript
// src/app/page.tsx
'use client'

import { useState } from 'react'
import { useRestaurants } from '@/lib/restaurant-context'
import { generateWeeklyPlan, rerollSlot, type WeeklyPlan } from '@/lib/recommend'
import { CUISINE_META } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw } from 'lucide-react'

const DAY_LABELS = ['星期一', '星期二', '星期三', '星期四', '星期五']
const DEFAULT_BUDGET = 750
const BUDGET_MIN = 100
const BUDGET_MAX = 2000
const BUDGET_STEP = 10

export default function HomePage() {
  const { restaurants } = useRestaurants()
  const [budget, setBudget] = useState(DEFAULT_BUDGET)
  const [plan, setPlan] = useState<WeeklyPlan | null>(null)

  function handleGenerate() {
    setPlan(generateWeeklyPlan(restaurants, budget))
  }

  function handleReroll(index: number) {
    if (!plan) return
    setPlan(rerollSlot(plan, index, restaurants))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Budget input section */}
      <div className="flex items-center gap-4 mb-6">
        <Label htmlFor="budget">每週預算 NT$</Label>
        <Input
          id="budget"
          type="number"
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={BUDGET_STEP}
          value={budget}
          onChange={e => setBudget(e.target.valueAsNumber)}
          className="w-32"
        />
        <Button onClick={handleGenerate}>產生本週午餐計畫</Button>
      </div>

      {/* Weekly plan grid */}
      {plan && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {plan.days.map((r, i) => (
              <div key={i} className="rounded-lg border bg-card p-4 flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground">{DAY_LABELS[i]}</p>
                <p className="font-semibold">{r.name}</p>
                {/* Cuisine tag — inline style required (not Tailwind class) */}
                <span
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white w-fit"
                  style={{ backgroundColor: CUISINE_META[r.type].color }}
                >
                  {CUISINE_META[r.type].label}
                </span>
                <p className="text-sm">NT$ {r.price}</p>
                <p className="text-sm text-muted-foreground">{r.distance} m</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReroll(i)}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  重抽
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            本週總花費：NT$ {plan.totalCost}　剩餘預算：NT$ {plan.weeklyBudget - plan.totalCost}
          </p>
        </>
      )}
    </div>
  )
}
```

### Pattern 2: Cuisine Tag with Inline Style (not Tailwind class)

**What:** `CUISINE_META` colors (`#67C23A`, `#E6A23C`, etc.) are arbitrary hex values not in the Tailwind palette. They must be applied via `style={{ backgroundColor: CUISINE_META[r.type].color }}`, NOT as Tailwind classes.

**When to use:** Any time a cuisine type badge is rendered. This is the established pattern from `src/app/restaurants/page.tsx`.

**Example:**
```typescript
// Source: src/app/restaurants/page.tsx (existing, verified pattern)
<span
  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
  style={{ backgroundColor: CUISINE_META[r.type].color }}
>
  {CUISINE_META[r.type].label}
</span>
```

### Pattern 3: Standard Vercel Deployment for Next.js

**What:** Vercel natively handles Next.js deployments. Routes prerendered as `○ (Static)` are served from Vercel's CDN. No `output: 'export'` config is needed or recommended.

**When to use:** Deploying any Next.js app to Vercel. The DEPLOY-01 requirement ("Static export / SSG deployment to Vercel") is satisfied by the existing build behavior — all pages are `○ (Static)` in the build output.

**Two deployment paths:**
1. **Vercel Git integration (preferred):** Connect `https://github.com/diamond520/what-lunch.git` in the Vercel dashboard → auto-deploys on every push to `master`.
2. **Vercel CLI (fallback if auth issues):** `npx vercel --prod` from the project root.

**Deployment verification:**
```bash
# Verify production build is clean BEFORE deploying
next build  # must complete with ✓ Compiled successfully and no warnings

# CLI deployment
npx vercel --prod
```

### Anti-Patterns to Avoid

- **Adding `output: 'export'` to next.config.ts unnecessarily:** This disables Image Optimization and adds restrictions with no benefit when deploying to Vercel. The app is already statically rendered without it.
- **Importing a Card component from shadcn:** No Card component is installed (`src/components/ui/` has only: badge, button, input, label, navigation-menu, select, table). Use a plain `<div>` with Tailwind border/rounded/bg-card classes for recommendation cards.
- **Using Tailwind classes for cuisine tag colors:** `CUISINE_META` colors are arbitrary hex values. They must use `style={{ backgroundColor }}` — attempting `bg-[#67C23A]` works in development but is not safe with Tailwind v4's JIT without explicit safelist.
- **Putting `'use client'` on layout.tsx:** The layout is already a Server Component. `RestaurantProvider` is a Client Component that it imports. Adding `'use client'` to the layout would break server component metadata (`export const metadata`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Budget-respecting 5-day plan | Custom scheduling loop | `generateWeeklyPlan(pool, weeklyBudget)` | Already built, tested (22 tests pass) |
| Single-day slot swap | Manual array splicing | `rerollSlot(plan, slotIndex, pool)` | Already built, handles budget recalculation correctly |
| Restaurant pool | Local state initialization | `useRestaurants()` from RestaurantContext | Shared context — changes on /restaurants page are reflected on home page |
| Cuisine type display | Manual lookup | `CUISINE_META[r.type].label` and `.color` | Single source of truth in `src/lib/types.ts` |

**Key insight:** All business logic is done. This phase is purely UI wiring. The risk is over-engineering the page component rather than under-engineering it.

---

## Common Pitfalls

### Pitfall 1: Budget Slider Without Guardrails

**What goes wrong:** If the user clears the budget input, `valueAsNumber` returns `NaN`. Calling `generateWeeklyPlan(pool, NaN)` will still run (the algorithm has fallbacks) but produces confusing results.

**Why it happens:** `<input type="number">` returns `NaN` when empty or invalid.

**How to avoid:** Guard the generate handler:
```typescript
function handleGenerate() {
  if (!budget || isNaN(budget)) return
  setPlan(generateWeeklyPlan(restaurants, budget))
}
```
Or clamp the value in `onChange`: `Math.max(BUDGET_MIN, Math.min(BUDGET_MAX, val))`.

**Warning signs:** TypeScript won't catch this — `valueAsNumber` is typed as `number`, which includes `NaN`.

### Pitfall 2: Empty Restaurant Pool

**What goes wrong:** If `restaurants` is empty (user deleted all restaurants on the management page), `generateWeeklyPlan` throws `'Restaurant pool cannot be empty'`.

**Why it happens:** `generateWeeklyPlan` has an explicit guard at the top that throws on empty pool.

**How to avoid:** Guard the generate handler:
```typescript
function handleGenerate() {
  if (restaurants.length === 0) return  // or show a message
  setPlan(generateWeeklyPlan(restaurants, budget))
}
```

**Warning signs:** Unhandled error boundary crash in production.

### Pitfall 3: Stale Plan After Budget Change

**What goes wrong:** User changes the budget slider, but the displayed plan was generated with the old budget. The `plan.weeklyBudget` field and `totalCost` correctly reflect the OLD budget. Confusing UX.

**Why it happens:** Plan state is not automatically regenerated on budget change.

**How to avoid:** Clear the plan when budget changes, or show a "budget changed — regenerate?" indicator. The simplest approach: `setPlan(null)` in the budget `onChange` handler. Alternatively, keep the plan visible but show a "stale" indicator.

### Pitfall 4: TypeScript Strict `valueAsNumber` Handling

**What goes wrong:** `e.target.valueAsNumber` returns `number` in TypeScript's type system, but is `NaN` at runtime when the field is empty. Strict mode doesn't catch this.

**Why it happens:** TypeScript doesn't model `NaN` as a distinct type.

**How to avoid:** Use `isNaN(val)` checks before using the value, consistent with the existing pattern in `src/app/restaurants/page.tsx` (see `handlePriceChange` and `handleDistanceChange` for the established pattern).

### Pitfall 5: Build Warning from Unused Imports

**What goes wrong:** DEPLOY-02 requires "no errors or warnings." Adding an import then not using it causes an ESLint `no-unused-vars` warning that fails the lint step.

**Why it happens:** Forgetting to use an imported component (e.g., importing `Badge` then using a plain `<span>` instead).

**How to avoid:** Match imports exactly to what's used. Run `npx eslint src/` before committing to confirm zero warnings.

### Pitfall 6: `output: 'export'` Breaking the Build

**What goes wrong:** If `output: 'export'` is added to `next.config.ts` and any unsupported feature is accidentally used (e.g., the default image loader), the build fails.

**Why it happens:** Static export mode is more restrictive than standard Vercel deployment.

**How to avoid:** Do NOT add `output: 'export'`. Standard Next.js on Vercel already produces fully static output for all-static-routes apps. The build output `○ (Static)` for all routes confirms this.

---

## Code Examples

Verified patterns from the existing codebase:

### Budget Input with onChange Pattern
```typescript
// Source: src/app/restaurants/page.tsx (existing, verified pattern)
function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
  const val = e.target.valueAsNumber
  if (isNaN(val) && e.target.value !== '') {
    setPriceError('價格必須是數字')
    setPrice(null)
  } else {
    setPriceError('')
    setPrice(isNaN(val) ? null : val)
  }
}
```

### Calling generateWeeklyPlan
```typescript
// Source: src/lib/recommend.ts — API signature
// generateWeeklyPlan(pool: Restaurant[], weeklyBudget: number): WeeklyPlan
// WeeklyPlan = { days: Restaurant[], totalCost: number, weeklyBudget: number }
const plan = generateWeeklyPlan(restaurants, budget)
// plan.days is an array of exactly 5 Restaurant objects
// plan.totalCost is the sum of all 5 day prices
// plan.weeklyBudget is the input budget (stored for reroll reference)
```

### Calling rerollSlot
```typescript
// Source: src/lib/recommend.ts — API signature
// rerollSlot(plan: WeeklyPlan, slotIndex: number, pool: Restaurant[]): WeeklyPlan
// Returns a NEW WeeklyPlan with slot at slotIndex replaced
// The returned plan.totalCost is recalculated from all 5 days
const newPlan = rerollSlot(plan, dayIndex, restaurants)
setPlan(newPlan)
```

### Clean Build Verification
```bash
# Source: verified against project - current build output
$ npx next build
✓ Compiled successfully in 4.1s
Route (app)
┌ ○ /
├ ○ /_not-found
└ ○ /restaurants
○  (Static)  prerendered as static content
# All routes static — correct for Vercel SSG deployment
```

### Vercel CLI Deployment
```bash
# Source: Vercel docs — verified CLI is v50.18.2 installed globally
npx vercel login           # one-time auth (if not already authenticated)
npx vercel --prod          # deploy to production from project root
# Vercel auto-detects Next.js, runs `next build`, serves static output from CDN
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next export` CLI command | `output: 'export'` in next.config | Next.js 14.0.0 | `next export` is removed; for Vercel, neither is needed |
| Pages Router (`pages/`) | App Router (`app/`) | Next.js 13.4 | This project uses App Router; patterns differ |
| `getStaticProps` for SSG | Server Components + static rendering | Next.js 13+ | App Router pages are static by default unless opting into dynamic |

**Deprecated/outdated:**
- `next export` command: Removed in Next.js 14. Replaced by `output: 'export'` config — but for Vercel deployment, neither is needed.
- `getStaticProps`: Pages Router only. Not applicable in App Router.

---

## Open Questions

1. **Deployment authentication state**
   - What we know: Vercel CLI v50.18.2 is installed; `vercel login` is required and not pre-configured
   - What's unclear: Whether GitHub-Vercel integration is set up for `https://github.com/diamond520/what-lunch.git`
   - Recommendation: Plan for both paths. Primary: `npx vercel --prod` (confirmed CLI path). Secondary: document GitHub integration steps as an alternative.

2. **Budget UX: slider vs. number input vs. both**
   - What we know: No Slider component is installed in shadcn; `<Input type="number">` is available; `<input type="range">` is a native element
   - What's unclear: Whether a range slider is required by the success criteria or if a number input alone is sufficient
   - Recommendation: A number input (`<Input type="number">`) satisfies "User can adjust the weekly budget input." A combined range+number approach is richer UX but doubles implementation complexity. Default to number input only.

3. **"No errors or warnings" scope for DEPLOY-02**
   - What we know: Current `next build` produces zero output beyond success messages; ESLint (`npx eslint src/`) returns no output (clean)
   - What's unclear: Whether "no warnings" applies to browser console warnings (React key warnings, etc.) at runtime
   - Recommendation: Ensure unique `key` props on all list items (plan days mapped by index is acceptable since the list is fixed-length and non-reordered).

---

## Sources

### Primary (HIGH confidence)
- Project source files — direct inspection of `src/lib/recommend.ts`, `src/lib/types.ts`, `src/lib/restaurant-context.tsx`, `src/app/restaurants/page.tsx`, `src/app/layout.tsx`
- `next build` output — verified clean build (`✓ Compiled successfully`, all routes `○ Static`)
- `npx vitest run` output — verified 22 tests pass
- `npx eslint src/` — verified zero lint warnings
- Next.js 16.1.6 official docs (https://nextjs.org/docs/app/building-your-application/deploying/static-exports) — static export documentation, verified `output: 'export'` is optional for Vercel

### Secondary (MEDIUM confidence)
- Vercel docs (https://vercel.com/docs/frameworks/nextjs) — Vercel handles Next.js natively; SSG routes served from CDN; no `output: 'export'` required
- Vercel GitHub integration docs (https://vercel.com/docs/git/vercel-for-github) — auto-deploy on push to `master`

### Tertiary (LOW confidence)
- None — all critical findings verified from official sources or direct project inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified by inspecting package.json, component files, and running build/tests
- Architecture: HIGH — `restaurants/page.tsx` is a working reference implementation of the exact same Client Component + useRestaurants() pattern
- Pitfalls: HIGH — empty pool guard is in recommend.ts source; NaN handling pattern is from existing restaurants/page.tsx; Tailwind inline style pattern is from restaurants/page.tsx

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable — Next.js 16 and Vercel deployment patterns are stable)
