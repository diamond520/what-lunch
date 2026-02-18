# Phase 4: Restaurant Management - Research

**Researched:** 2026-02-18
**Domain:** React client-side state management, shadcn/ui Table/Badge/Input/Select, Next.js App Router shared state via Context
**Confidence:** HIGH

## Summary

Phase 4 builds the restaurant management page at `/restaurants`. It requires a client-side-only CRUD-lite implementation: display a table of restaurants, add via form, remove via button. There is no database. State starts from `DEFAULT_RESTAURANTS` and lives in runtime memory only.

The central architectural challenge is state sharing: Phase 5's picker page also needs the restaurant list (so both pages see the same data after add/remove). The correct approach for Next.js App Router is a React Context provider placed in the root layout — the same pattern the official Next.js docs show for theming and user state. The provider holds `useState<Restaurant[]>` initialized from `DEFAULT_RESTAURANTS` and exposes `addRestaurant` / `removeRestaurant` actions.

Form validation for price/distance must enforce `number` types — not just HTML `type="number"`. The old Vue 2 bug stored them as strings; the fix is to use `e.target.valueAsNumber` (available on `<input type="number">`) and validate with `isNaN()` before accepting the value. The shadcn/ui `Table`, `Badge`, `Button`, `Input`, `Select`, and `Label` components handle all UI needs. No react-hook-form or Zod is needed for a form with 4 fields.

**Primary recommendation:** Create a `RestaurantContext` provider in `src/lib/restaurant-context.tsx`, mount it in `src/app/layout.tsx` wrapping `{children}`, and build the `/restaurants` page as a single Client Component that consumes this context. Use shadcn/ui Table for the list, Badge with inline `style` for cuisine color tags (colors come from `CUISINE_META`, not Tailwind classes), and a controlled form with `valueAsNumber` for numeric inputs.

## Standard Stack

### Core (all already installed — no new npm installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.3 | useState, createContext, useContext | All state is client-side; React's built-in primitives are the right tool |
| next | 16.1.6 | App Router, layout.tsx as provider mount point | Layout wraps every page — ideal Provider location |
| shadcn (CLI) | 3.8.5 | Copies Table, Badge, Button, Input, Select, Label source | Components copied to `src/components/ui/` |
| radix-ui | ^1.4.3 | Accessible primitives under shadcn Select | Already installed; Select uses it for keyboard nav and portal |
| lucide-react | ^0.574.0 | Trash2 icon for remove button | Already installed; use `<Trash2 />` from lucide-react |
| tailwind-merge + clsx | already installed | `cn()` helper for conditional classes | Used by all shadcn components |

### shadcn Components to Add via CLI

| Component | Install Command | Purpose |
|-----------|----------------|---------|
| table | `npx shadcn add table` | Restaurant list display with columns |
| badge | `npx shadcn add badge` | Cuisine type color tags |
| button | `npx shadcn add button` | Add button, Remove button (destructive variant) |
| input | `npx shadcn add input` | Name, price, distance form fields |
| select | `npx shadcn add select` | Cuisine type dropdown |
| label | `npx shadcn add label` | Accessible form field labels |

**Installation:**
```bash
npx shadcn add table badge button input select label
```

These can be run as a single command. Each is idempotent — if already installed, it skips.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Context | Zustand | Zustand is better for high-frequency updates or complex state. For a restaurant list updated by explicit user actions, Context overhead is negligible and avoids an extra dependency |
| React Context | URL state (search params) | URL can share route but not mutable list state across add/remove |
| React Context | Lifting state to layout.tsx directly | Not possible — layout.tsx is a Server Component and cannot hold useState |
| shadcn Table | HTML `<table>` | shadcn Table adds accessible markup, consistent Tailwind styling, no extra bundle cost |
| valueAsNumber | parseInt/parseFloat | valueAsNumber is the native browser API for `<input type="number">`, returns NaN for non-numeric input automatically |
| inline style for Badge color | Tailwind arbitrary values | `CUISINE_META` colors are hex values unknown at build time. Tailwind cannot generate classes for runtime values. Use `style={{ backgroundColor: color }}` |

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── types.ts                     # Existing — Restaurant, CuisineType, CUISINE_META (DO NOT MODIFY)
│   ├── restaurants.ts               # Existing — DEFAULT_RESTAURANTS (DO NOT MODIFY)
│   └── restaurant-context.tsx       # NEW — RestaurantContext provider + useRestaurants hook
├── app/
│   ├── layout.tsx                   # MODIFY — wrap children with <RestaurantProvider>
│   └── restaurants/
│       └── page.tsx                 # REPLACE placeholder — full Client Component
├── components/
│   └── ui/
│       ├── table.tsx                # NEW (shadcn add)
│       ├── badge.tsx                # NEW (shadcn add)
│       ├── button.tsx               # NEW (shadcn add) — may already exist from Phase 2
│       ├── input.tsx                # NEW (shadcn add)
│       ├── select.tsx               # NEW (shadcn add)
│       └── label.tsx               # NEW (shadcn add)
```

### Pattern 1: React Context Provider for Shared Restaurant State

**What:** A Client Component context that holds `Restaurant[]` state, initialized from `DEFAULT_RESTAURANTS`. Exported as both a `RestaurantProvider` (to mount in layout) and a `useRestaurants` hook (consumed by both `/restaurants` page and future Phase 5 picker page).

**When to use:** Whenever two or more pages (route segments) need to share mutable state without database persistence. The provider mounts once in `layout.tsx` and persists across navigations.

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/getting-started/server-and-client-components#context-providers
// src/lib/restaurant-context.tsx
'use client'

import { createContext, useContext, useState } from 'react'
import type { Restaurant } from './types'
import { DEFAULT_RESTAURANTS } from './restaurants'

interface RestaurantContextValue {
  restaurants: Restaurant[]
  addRestaurant: (r: Restaurant) => void
  removeRestaurant: (id: string) => void
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null)

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(DEFAULT_RESTAURANTS)

  function addRestaurant(r: Restaurant) {
    setRestaurants(prev => [...prev, r])
  }

  function removeRestaurant(id: string) {
    setRestaurants(prev => prev.filter(r => r.id !== id))
  }

  return (
    <RestaurantContext value={{ restaurants, addRestaurant, removeRestaurant }}>
      {children}
    </RestaurantContext>
  )
}

export function useRestaurants(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext)
  if (!ctx) throw new Error('useRestaurants must be used within RestaurantProvider')
  return ctx
}
```

**Mount in layout (Server Component can import a Client Component provider):**
```typescript
// Source: https://nextjs.org/docs/app/getting-started/server-and-client-components#context-providers
// src/app/layout.tsx — MODIFY to add RestaurantProvider
import { RestaurantProvider } from '@/lib/restaurant-context'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className={...}>
        <Header />
        <RestaurantProvider>
          <main className="min-h-screen">{children}</main>
        </RestaurantProvider>
      </body>
    </html>
  )
}
```

### Pattern 2: Cuisine Type Badge with Dynamic Color

**What:** Display a colored badge for each restaurant's cuisine type using `CUISINE_META[type].color` (a hex value) applied as inline `style`. Tailwind classes cannot be used for runtime hex values.

**When to use:** Whenever a color value is a runtime JavaScript value not known at build time. In Tailwind v4, arbitrary values like `bg-[#67C23A]` ARE supported but require the value to be a static string in JSX — template literals with variables are NOT processed by Tailwind. Use inline style for dynamic hex.

**Example:**
```typescript
// Source: src/lib/types.ts — CUISINE_META is the single source of truth for colors
import { CUISINE_META } from '@/lib/types'

function CuisineTag({ type }: { type: CuisineType }) {
  const { label, color } = CUISINE_META[type]
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  )
}
```

Note: This is a simple `<span>` styled inline rather than the shadcn `<Badge>` component. The shadcn Badge component uses Tailwind variant classes for its colors — it does not accept an arbitrary hex `backgroundColor`. A plain `<span>` with inline style is the correct approach here.

### Pattern 3: Numeric Input Validation with valueAsNumber

**What:** Use `<input type="number">` and read `e.target.valueAsNumber` instead of `e.target.value`. The `valueAsNumber` property returns `NaN` for non-numeric input, enabling clean validation without `parseInt`/`parseFloat`.

**When to use:** Any time a form field requires a numeric value. This is the browser-native approach — no library needed.

**Example:**
```typescript
// Source: MDN Web Docs — HTMLInputElement.valueAsNumber
const [price, setPrice] = useState<number | null>(null)
const [priceError, setPriceError] = useState<string>('')

function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
  const val = e.target.valueAsNumber
  if (isNaN(val)) {
    setPriceError('Price must be a number')
    setPrice(null)
  } else {
    setPriceError('')
    setPrice(val)
  }
}
```

**Form submission guard:**
```typescript
function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (price === null || isNaN(price)) {
    setPriceError('Price is required and must be a number')
    return
  }
  if (distance === null || isNaN(distance)) {
    setDistanceError('Distance is required and must be a number')
    return
  }
  // ... proceed with valid data
}
```

### Pattern 4: ID Generation for New Restaurants

**What:** New restaurants need a unique `id`. Since there is no database, use `crypto.randomUUID()` (available in modern browsers natively, no import needed).

**When to use:** Client-side ID generation without a backend.

**Example:**
```typescript
// Source: MDN Web Docs — crypto.randomUUID()
const newRestaurant: Restaurant = {
  id: crypto.randomUUID(),  // browser-native, no import, generates UUID v4
  name: name.trim(),
  type: selectedType,
  price: price!,
  distance: distance!,
}
addRestaurant(newRestaurant)
```

### Pattern 5: shadcn Table with Dynamic Rows

**What:** The shadcn Table component is a set of semantic wrappers (`Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell`) that render a standard `<table>`. Map the `restaurants` array to `<TableRow>` elements.

**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/table
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>名稱</TableHead>
      <TableHead>料理類型</TableHead>
      <TableHead>價格 (NT$)</TableHead>
      <TableHead>距離 (m)</TableHead>
      <TableHead></TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {restaurants.map(r => (
      <TableRow key={r.id}>
        <TableCell>{r.name}</TableCell>
        <TableCell><CuisineTag type={r.type} /></TableCell>
        <TableCell>{r.price}</TableCell>
        <TableCell>{r.distance}</TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeRestaurant(r.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Pattern 6: shadcn Select for Cuisine Type

**What:** The cuisine type field is a fixed enum (`CuisineType` = `'chi' | 'jp' | 'kr' | 'tai' | 'west'`). Use the shadcn `Select` component with items derived from `Object.entries(CUISINE_META)`.

**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/select
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CUISINE_META } from '@/lib/types'
import type { CuisineType } from '@/lib/types'

const [cuisineType, setCuisineType] = useState<CuisineType>('chi')

<Select value={cuisineType} onValueChange={(v) => setCuisineType(v as CuisineType)}>
  <SelectTrigger>
    <SelectValue placeholder="選擇料理類型" />
  </SelectTrigger>
  <SelectContent>
    {(Object.entries(CUISINE_META) as [CuisineType, { label: string; color: string }][]).map(([key, meta]) => (
      <SelectItem key={key} value={key}>
        {meta.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Anti-Patterns to Avoid

- **Putting RestaurantProvider in each page:** State resets on every navigation. Provider MUST be in layout.tsx to persist across route changes.
- **Using useState directly in RestaurantsPage for the list:** State would be isolated to that page and Phase 5 picker cannot see changes made in Phase 4.
- **Using parseInt/parseFloat for number validation:** Both return `NaN` for non-numeric but also return a number for strings like `"42abc"` → `42`. Use `valueAsNumber` which requires the full input to be valid.
- **Hardcoding cuisine colors in JSX:** Colors are defined in `CUISINE_META`. Hardcoding duplicates them and breaks the single source of truth. Always use `CUISINE_META[type].color`.
- **Using Tailwind arbitrary bg classes for dynamic hex:** `className={`bg-[${color}]`}` does NOT work — Tailwind processes classes at build time. Use `style={{ backgroundColor: color }}`.
- **Forgetting `'use client'` on the page and context files:** Any component using `useState`, `useContext`, or event handlers must be a Client Component.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data table UI | Custom `<table>` with inline styles | shadcn `Table` components | Consistent styling, semantic HTML, accessible markup; already includes responsive overflow |
| Cuisine dropdown | Custom `<select>` or `<ul>` popup | shadcn `Select` | Radix-based: keyboard navigation, ARIA, portal rendering, focus management |
| Form field labels | `<div className="text-sm">` | shadcn `Label` | Associates label with input via `htmlFor`, improves accessibility and click target |
| UUID generation | Timestamp-based ID (`Date.now()`) | `crypto.randomUUID()` | Native browser API since 2021, no collision risk, works in Next.js client components |
| Shared state sync | localStorage polling / URL state | React Context | Simple, synchronous, React-native solution for single-session runtime state |

**Key insight:** This phase is UI-heavy but logic-light. The components have known complex requirements (accessible dropdowns, semantic tables, keyboard nav) — all solved by shadcn/ui. The only custom logic is the Context provider and validation, both of which are trivially simple.

## Common Pitfalls

### Pitfall 1: Context Provider Not Wrapping Phase 5 Components

**What goes wrong:** `RestaurantProvider` is placed inside `src/app/restaurants/page.tsx` instead of `layout.tsx`. Phase 5's picker page at `/` cannot read the restaurant list — `useRestaurants()` throws "must be used within RestaurantProvider".

**Why it happens:** Natural instinct to co-locate provider with the page that "owns" the data.

**How to avoid:** Provider MUST go in `src/app/layout.tsx`, wrapping `{children}` (or at minimum wrapping `<main>`). The provider is in layout so it survives navigation between `/` and `/restaurants`.

**Warning signs:** Phase 5 picker imports `useRestaurants` and gets an error about missing context; adding a restaurant in `/restaurants` doesn't show up in `/`.

### Pitfall 2: Form Accepts String Values for Price/Distance

**What goes wrong:** Using `e.target.value` (a string) for price/distance fields and not converting to number before storing. The `Restaurant` type requires `price: number` — TypeScript strict mode will catch this at compile time. However, if the conversion uses `Number("")` or `parseInt("")`, those return `0`, not `NaN`, accepting empty strings as "0".

**Why it happens:** `e.target.value` always returns a string. Developers forget to convert or use conversion methods that have surprising behavior on empty/invalid strings.

**How to avoid:** Use `e.target.valueAsNumber`. For `<input type="number">`, `valueAsNumber` returns `NaN` when the field is empty or contains non-numeric text. Validate with `isNaN(val)` before accepting.

**Warning signs:** Form submits successfully with empty price/distance fields, or TypeScript error "Type 'string' is not assignable to type 'number'".

### Pitfall 3: Missing `'use client'` Directive

**What goes wrong:** The restaurants page uses `useState` or `useContext` but is treated as a Server Component. Next.js throws: "useState is only available in a Client Component."

**Why it happens:** `src/app/restaurants/page.tsx` is currently a Server Component (no directive). When adding interactivity, the directive must be added.

**How to avoid:** Add `'use client'` as the first line of `src/app/restaurants/page.tsx` AND `src/lib/restaurant-context.tsx`. Both files use React hooks.

**Warning signs:** Build error mentioning "useState", "useContext", or "createContext" in a Server Component.

### Pitfall 4: shadcn Select `onValueChange` Type Mismatch

**What goes wrong:** `shadcn Select`'s `onValueChange` callback provides a `string`, but `CuisineType` is a union type. TypeScript strict mode flags: "Type 'string' is not assignable to type 'CuisineType'".

**Why it happens:** The shadcn Select is typed as `onValueChange: (value: string) => void` — it doesn't know about domain types.

**How to avoid:** Cast in the handler: `onValueChange={(v) => setCuisineType(v as CuisineType)}`. This is safe because `SelectItem` values are set from `Object.keys(CUISINE_META)` which are exactly the `CuisineType` union members.

**Warning signs:** TypeScript error on `onValueChange` prop when assigning to `CuisineType` state.

### Pitfall 5: Remove Button Using Wrong shadcn Button Variant

**What goes wrong:** Using `variant="destructive"` for the remove button renders a red filled button in the table row — visually loud and inconsistent with a data table.

**Why it happens:** "Delete" maps to "destructive" in most mental models.

**How to avoid:** Use `variant="ghost" size="icon"` for inline table actions. Reserve `variant="destructive"` for modal confirmation dialogs. The ghost icon button (Trash2 icon only, no label) is the conventional data table pattern.

**Warning signs:** Table rows look heavy with bright red buttons in every row.

### Pitfall 6: No Empty State for Table

**What goes wrong:** All restaurants are removed; the table renders empty with just headers and no feedback.

**Why it happens:** The `restaurants.map(...)` in TableBody returns an empty array — no visual indication that the list is empty.

**How to avoid:** Add a conditional: when `restaurants.length === 0`, render a `<TableRow>` with a `<TableCell colSpan={5}>` showing "尚無餐廳" (No restaurants). This is a standard data table pattern.

**Warning signs:** Removing all restaurants shows an empty white box with column headers only.

## Code Examples

Verified patterns from official sources:

### Full Restaurant Page Structure

```typescript
// src/app/restaurants/page.tsx
// Source: Next.js official client component pattern
'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRestaurants } from '@/lib/restaurant-context'
import { CUISINE_META } from '@/lib/types'
import type { CuisineType } from '@/lib/types'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

export default function RestaurantsPage() {
  const { restaurants, addRestaurant, removeRestaurant } = useRestaurants()

  const [name, setName] = useState('')
  const [cuisineType, setCuisineType] = useState<CuisineType>('chi')
  const [price, setPrice] = useState<number | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [priceError, setPriceError] = useState('')
  const [distanceError, setDistanceError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let valid = true
    if (!name.trim()) { valid = false }
    if (price === null || isNaN(price)) {
      setPriceError('請輸入有效的數字')
      valid = false
    } else {
      setPriceError('')
    }
    if (distance === null || isNaN(distance)) {
      setDistanceError('請輸入有效的數字')
      valid = false
    } else {
      setDistanceError('')
    }
    if (!valid) return

    addRestaurant({
      id: crypto.randomUUID(),
      name: name.trim(),
      type: cuisineType,
      price: price!,
      distance: distance!,
    })
    // Reset form
    setName('')
    setCuisineType('chi')
    setPrice(null)
    setDistance(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">餐廳管理</h1>
      {/* Table */}
      {/* Add Form */}
    </div>
  )
}
```

### Context Provider Full Implementation

```typescript
// src/lib/restaurant-context.tsx
// Source: https://nextjs.org/docs/app/getting-started/server-and-client-components#context-providers
'use client'

import { createContext, useContext, useState } from 'react'
import type { Restaurant } from './types'
import { DEFAULT_RESTAURANTS } from './restaurants'

interface RestaurantContextValue {
  restaurants: Restaurant[]
  addRestaurant: (r: Restaurant) => void
  removeRestaurant: (id: string) => void
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null)

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(DEFAULT_RESTAURANTS)

  function addRestaurant(r: Restaurant) {
    setRestaurants(prev => [...prev, r])
  }

  function removeRestaurant(id: string) {
    setRestaurants(prev => prev.filter(r => r.id !== id))
  }

  return (
    <RestaurantContext value={{ restaurants, addRestaurant, removeRestaurant }}>
      {children}
    </RestaurantContext>
  )
}

export function useRestaurants(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext)
  if (!ctx) throw new Error('useRestaurants must be used within RestaurantProvider')
  return ctx
}
```

### Cuisine Tag Component (Plain Span, Not shadcn Badge)

```typescript
// Inline style required because CUISINE_META colors are hex values (runtime, not build-time)
// Using shadcn Badge variant would override the background color
function CuisineTag({ type }: { type: CuisineType }) {
  const { label, color } = CUISINE_META[type]
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  )
}
```

### valueAsNumber Validation Pattern

```typescript
// Source: MDN HTMLInputElement.valueAsNumber
// Handles empty inputs and non-numeric text correctly
function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
  const val = e.target.valueAsNumber  // NaN if empty or non-numeric
  setPrice(isNaN(val) ? null : val)
  if (isNaN(val) && e.target.value !== '') {
    setPriceError('價格必須是數字')
  } else {
    setPriceError('')
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redux for shared state | React Context (built-in) | React 16.3+ | No extra dependency for simple runtime state |
| Individual `@radix-ui/react-*` packages | Single `radix-ui` package | shadcn/ui Feb 2026 | Cleaner package.json; project already uses unified package |
| Custom form validation logic | `valueAsNumber` + `isNaN()` | HTML5 standard | Browser handles numeric parsing; no library needed |
| Vue 2 string prices (`"100"`) | TypeScript-enforced `number` | Phase 1 rewrite | Eliminates silent arithmetic bugs; `satisfies Restaurant[]` catches it at compile time |
| jest | vitest | 2022-2024 | Already using Vitest from Phase 3; consistent toolchain |

**Deprecated/outdated:**
- `parseInt(e.target.value)`: Returns a number for `"42abc"` → `42`. Does not detect mixed inputs.
- `Number(e.target.value)`: Returns `0` for empty string `""`. Accepts empty as "zero".
- `e.target.value` for number fields: Always a `string`, requires explicit conversion, loses TypeScript type safety.

## Open Questions

1. **Form layout — inline vs. card section**
   - What we know: The page needs a table AND an add form. No design spec provided.
   - What's unclear: Should the form be above or below the table? Should it be in a Card or a plain section?
   - Recommendation: Place the add form below the table or in a collapsible section. A Card wrapper (`shadcn Card`) is conventional for forms but not required. Leave layout decisions to the implementer — this is Claude's discretion territory.

2. **Form reset after successful submission**
   - What we know: Success criteria says "new entry appears immediately" — implies optimistic add.
   - What's unclear: Should form fields reset to defaults or remain filled (for adding multiple similar restaurants)?
   - Recommendation: Reset to empty/defaults after each successful add. Standard UX expectation for "add to list" forms.

3. **Duplicate restaurant names**
   - What we know: No requirement prohibits duplicate names.
   - What's unclear: Should form validation warn on duplicate names?
   - Recommendation: No duplicate check in v1. Requirements do not mention it. Add only if explicitly requested.

4. **Integer vs. decimal for price/distance**
   - What we know: `Restaurant.price` and `Restaurant.distance` are `number` (integer in practice based on DEFAULT_RESTAURANTS data — all are whole numbers).
   - What's unclear: Should form accept decimals (e.g., price: 99.5)?
   - Recommendation: Use `<input type="number" step="1" min="0">` to suggest integers in the browser UI, but do not enforce at the TypeScript type level — `number` allows decimals. The `valueAsNumber` approach handles both.

## Sources

### Primary (HIGH confidence)

- https://nextjs.org/docs/app/getting-started/server-and-client-components — Official Next.js docs (updated 2026-02-16, version 16.1.6). Confirmed: Context provider pattern for App Router, `'use client'` directive rules, layout mounting pattern.
- https://ui.shadcn.com/docs/components/table — Official shadcn/ui docs. Confirmed: Table component imports (`Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell`), basic usage pattern.
- https://ui.shadcn.com/docs/components/select — Official shadcn/ui docs. Confirmed: Select composition pattern with `value`/`onValueChange`, `SelectItem`, `SelectTrigger`, `SelectValue`.
- https://ui.shadcn.com/docs/components/badge — Official shadcn/ui docs. Confirmed: Badge variants, `className` for custom styling (but NOT for runtime hex colors).
- https://ui.shadcn.com/docs/components/button — Official shadcn/ui docs. Confirmed: `variant="destructive"`, `variant="ghost"`, `size="icon"`.
- https://ui.shadcn.com/docs/components/input — Official shadcn/ui docs. Confirmed: Input imports, `aria-invalid` for error states, controlled state pattern.
- https://ui.shadcn.com/docs/changelog — Official shadcn/ui changelog. Confirmed: No breaking API changes for Table/Badge/Input/Select components; unified `radix-ui` package already in use.
- `src/lib/types.ts` (project source) — CUISINE_META hex colors confirmed: `#67C23A` (chi), `#E6A23C` (jp), `#F56C6C` (kr), `#909399` (tai), `#109399` (west).

### Secondary (MEDIUM confidence)

- WebSearch "Next.js App Router React Context provider shared state client components 2026" — Multiple sources (Vercel KB, Next.js official example) confirm Context provider in layout.tsx is the standard pattern. Verified against official Next.js docs above.
- WebSearch "React useState number input validation NaN parseFloat TypeScript 2025" — Multiple sources confirm `valueAsNumber` is the correct approach. The property is part of the HTML spec; MDN is the authoritative source (not fetched directly but well-established).
- https://ui.shadcn.com/docs/changelog (2026-02-18) — Confirmed radix-ui unified package migration is already done in this project (package.json shows `radix-ui: ^1.4.3`).

### Tertiary (LOW confidence)

- WebSearch "Tailwind v4 inline style dynamic color CSS variable approach best practice 2026" — Confirms that Tailwind cannot generate classes for runtime values. The recommendation to use inline `style` for dynamic hex colors is from multiple community sources; not a single authoritative Tailwind doc page.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries already installed; shadcn components verified via official docs; no new npm dependencies needed.
- Architecture (Context pattern): HIGH — Official Next.js docs explicitly show Context provider in layout.tsx as the recommended pattern for shared client state.
- Cuisine color badge approach (inline style): HIGH — Tailwind's CSS-first architecture is well-documented; the limitation of class-based arbitrary values for runtime variables is confirmed.
- Form validation (valueAsNumber): MEDIUM — Browser API is standard HTML5, well-established; MDN not directly fetched but multiple sources agree.
- Pitfalls: HIGH — Derived from direct project inspection (types.ts, restaurants.ts), official docs, and the explicitly stated "fix type coercion bug" requirement.

**Research date:** 2026-02-18
**Valid until:** 2026-03-20 (stable domain — shadcn/ui, React Context, and HTML5 input APIs are stable; 30-day window appropriate)
