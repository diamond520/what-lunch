# Phase 11: Wheel Animation - Research

**Researched:** 2026-02-19
**Domain:** React animation without external libraries — CSS keyframes, `useEffect` interval, Tailwind v4, `@keyframes`, skip-by-interaction
**Confidence:** HIGH

## Summary

Phase 11 adds a slot-machine / cycling animation before revealing a restaurant pick. The core technical challenge is NOT "how to animate" (the project already has `tw-animate-css` and Tailwind's `animate-*` utilities) — it is "how to structure the animation state machine in React so it is correct, skippable, and testable without a timer library."

The animation requirement is a **slot-machine** metaphor: restaurant names cycle rapidly, then slow down and land on the final result. This is implemented as a React `useEffect` that runs a `setInterval`, cycling through a shuffled list of restaurant names at a fast rate, then using `setTimeout` to stop the cycling after 2–3 seconds and reveal the pre-computed final result. No external animation library is needed. `tw-animate-css` (already installed) provides CSS fade/slide utilities for the "settling" moment.

The two pages that need animation are structurally different:
- `src/app/weekend/page.tsx` — single pick, `handleRoll` and `handleReroll` are already discrete handler functions. Animation state is local to the component.
- `src/app/page.tsx` — five-slot weekly plan with individual per-slot reroll. The "generate full plan" button should animate all five slots concurrently. The per-slot reroll button should animate only that slot. This multi-slot case is the harder engineering problem.

**Primary recommendation:** Build a shared `useSlotAnimation` hook that encapsulates the timer state machine. The hook accepts the final value and a list of display candidates, returns `{ displayValue, isAnimating }`, and handles skip-by-click and skip-by-keypress internally. Wire the hook into both pages without changing the algorithm functions — `generateWeeklyPlan`, `rerollSlot`, and `pickRandomRestaurant` all remain pure and unchanged.

## Standard Stack

### Core (already installed — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.3 | `useState`, `useEffect`, `useRef` for timer control | Already in use |
| tw-animate-css | 1.4.0 | `animate-in`, `fade-in`, `duration-*` CSS utilities for settle effect | Already installed via `@import "tw-animate-css"` in `globals.css` |
| tailwindcss | v4 | `@keyframes` in `globals.css` for custom spin animation | Already in use |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom `useEffect` + `setInterval` | `framer-motion` | framer-motion is 90KB gzipped, adds significant bundle size. The requirement is a simple 2-3s timer — overkill. Do not add. |
| Custom `useEffect` + `setInterval` | `react-spring` | Same issue: heavy library for a trivial timer. Reject. |
| `setInterval` for cycling | CSS `animation: spin 0.1s infinite` on a list | CSS-only scroll animation is hard to "stop at a specific value" cleanly and has no JS control point for skip. Use JS interval instead. |
| `clearInterval` in effect cleanup | `useRef` for interval ID | **Must** use `useRef` to store the interval ID across renders. `clearInterval` on a stale ID from `useState` is a common bug. |

**Key conclusion:** No new packages needed. The entire implementation uses React hooks + `setInterval`/`setTimeout` + Tailwind CSS classes already present in the project.

## Architecture Patterns

### Recommended Project Structure Changes

```
src/
├── hooks/
│   └── use-slot-animation.ts     # NEW: shared animation state machine hook
├── app/
│   ├── page.tsx                  # MODIFY: wire hook for full plan + per-slot reroll
│   └── weekend/
│       └── page.tsx              # MODIFY: wire hook for single pick + reroll
```

The `src/hooks/` directory does not currently exist. Creating it is consistent with the project's `src/lib/` pattern for non-component modules. One alternative is co-locating the hook file in `src/lib/` (e.g., `src/lib/use-slot-animation.ts`), which also works since the codebase puts custom hooks in `lib/` (e.g., `useRestaurants` is in `src/lib/restaurant-context.tsx`). Either location is valid; `src/hooks/` is slightly cleaner for a hook that is not tied to a specific data domain.

### Pattern 1: `useSlotAnimation` Hook — State Machine

**What:** A React hook that, given a final restaurant name and a list of candidate names to cycle through, manages the cycling interval, deceleration, and the ability to skip by returning `{ displayValue: string, isAnimating: boolean, skip: () => void }`.

**When to use:** Any picker button action where the result should animate before settling.

**State machine:**

```
IDLE → (trigger) → ANIMATING → (timer fires OR skip) → SETTLED
SETTLED → (trigger again) → ANIMATING → ...
```

**Example — minimal implementation:**

```typescript
// src/hooks/use-slot-animation.ts
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseSlotAnimationOptions {
  candidates: string[]   // names to cycle through (e.g. all restaurant names in pool)
  finalValue: string | null  // the pre-computed final pick; null = not yet picked
  durationMs?: number    // total animation time (default 2500)
  intervalMs?: number    // cycling speed (default 80ms = ~12 names/sec)
}

interface UseSlotAnimationResult {
  displayValue: string | null   // what to render in the slot
  isAnimating: boolean
  skip: () => void              // call this to stop immediately and show finalValue
}

export function useSlotAnimation({
  candidates,
  finalValue,
  durationMs = 2500,
  intervalMs = 80,
}: UseSlotAnimationOptions): UseSlotAnimationResult {
  const [displayValue, setDisplayValue] = useState<string | null>(finalValue)
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevFinalRef = useRef<string | null>(null)

  // Cleanup helper
  const stopAnimation = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    intervalRef.current = null
    timeoutRef.current = null
  }, [])

  // Skip: stop immediately and show final value
  const skip = useCallback(() => {
    if (!isAnimating) return
    stopAnimation()
    setDisplayValue(finalValue)
    setIsAnimating(false)
  }, [isAnimating, stopAnimation, finalValue])

  // When finalValue changes to a new non-null value, start the animation
  useEffect(() => {
    if (finalValue === null) return
    if (finalValue === prevFinalRef.current) return  // same pick, no re-animation
    prevFinalRef.current = finalValue

    if (candidates.length === 0) {
      setDisplayValue(finalValue)
      return
    }

    // Start cycling
    setIsAnimating(true)
    let idx = 0
    intervalRef.current = setInterval(() => {
      idx = (idx + 1) % candidates.length
      setDisplayValue(candidates[idx])
    }, intervalMs)

    // Stop after durationMs
    timeoutRef.current = setTimeout(() => {
      stopAnimation()
      setDisplayValue(finalValue)
      setIsAnimating(false)
    }, durationMs)

    return () => stopAnimation()
  }, [finalValue]) // eslint-disable-line react-hooks/exhaustive-deps
  // Note: intentionally only react to finalValue changes

  return { displayValue, isAnimating, skip }
}
```

**Key nuances:**
- The `prevFinalRef` guard prevents re-triggering the animation if the component re-renders with the same `finalValue`. Without it, any parent state change would restart the animation.
- `intervalRef` and `timeoutRef` must be `useRef`, not `useState`. Storing mutable timer IDs in `useState` would cause unnecessary re-renders and potential stale closure bugs.
- The cleanup `return () => stopAnimation()` in the `useEffect` handles component unmount mid-animation.
- `candidates` should be passed as a stable reference (e.g., computed once with `useMemo` from the restaurant names array) to avoid triggering the effect. The effect's dependency array only includes `finalValue`.

### Pattern 2: Weekend Page Integration (single slot)

**What:** The weekend page has one slot. When `handleRoll` or `handleReroll` is called, the final pick is computed immediately (via `pickRandomRestaurant`), then passed to the hook as `finalValue`. The hook starts cycling; the card shows `displayValue` instead of `current.name`.

**Current weekend page flow:**
```
handleRoll() → pickRandomRestaurant(weekendRestaurants) → setCurrent(result)
```

**New flow with animation:**
```
handleRoll() → pickRandomRestaurant(weekendRestaurants) → setFinalPick(result) → hook starts animating → hook settles on result → UI shows result card
```

**Example integration sketch:**

```typescript
// In WeekendPage (src/app/weekend/page.tsx)
const [finalPick, setFinalPick] = useState<Restaurant | null>(null)

const candidateNames = useMemo(
  () => weekendRestaurants.map(r => r.name),
  [weekendRestaurants]
)

const { displayValue, isAnimating, skip } = useSlotAnimation({
  candidates: candidateNames,
  finalValue: finalPick?.name ?? null,
})

// The card: render when finalPick is set (even during animation, show skeleton)
// The animated name: show displayValue instead of finalPick.name
// The skip interaction: onClick on the animating area OR keydown handler calls skip()
```

**Skip interactions — two required mechanisms:**

1. **Click to skip:** Add `onClick={skip}` to the animating slot area (or a "跳過" button shown only when `isAnimating`).
2. **Keypress to skip:** Add a `useEffect` with a `keydown` event listener on `document` that calls `skip()`. Must remove the listener in cleanup. Only active when `isAnimating` is true.

```typescript
useEffect(() => {
  if (!isAnimating) return
  const handler = (e: KeyboardEvent) => {
    // Any key skips, or limit to Space/Enter/Escape
    if (['Space', 'Enter', 'Escape'].includes(e.code)) {
      e.preventDefault()
      skip()
    }
  }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}, [isAnimating, skip])
```

### Pattern 3: Weekday Page Integration (multi-slot)

**What:** The weekday page has five slots. Both "generate plan" (all 5 animate) and "per-slot reroll" (1 slot animates) need animation. The challenge is tracking animation state per slot.

**Approach:** Store `animatingSlots: Set<number>` in state, or use 5 independent slot states. The simplest correct approach is to store an `animatingSlot: number | null` for the reroll case (one slot at a time), and an `isGenerating: boolean` for the "generate all" case (all 5 slots animate).

**Full plan animation:** When all 5 slots animate, a single "plan-level" animation state works. All 5 slot cards show the same cycling display while animating, then simultaneously reveal their final values.

**Per-slot reroll animation:** When only one slot rerolls, that slot shows the animation; the other 4 remain showing their final values.

**Implementation approach — separate state per concern:**

```typescript
// In HomePage (src/app/page.tsx)
const [plan, setPlan] = useState<WeeklyPlan | null>(null)
const [animatingSlotIndex, setAnimatingSlotIndex] = useState<number | null>(null)
const [isGenerating, setIsGenerating] = useState(false)

// For the full-plan animation, use a single hook-level cycling display
// For per-slot reroll, pass the specific slot's final value to the hook

// Simpler alternative: inline the animation logic at the page level
// rather than using the hook for the multi-slot case.
```

**Simpler multi-slot alternative:** Instead of 5 separate hook instances (which would require either an array of hooks — not allowed by rules of hooks — or a single hook with slot-index tracking), implement the multi-slot cycling as a page-level `useEffect`:

```typescript
// Page-level animation for "generate" (all 5 slots)
const [displayNames, setDisplayNames] = useState<string[] | null>(null)
// displayNames[i] is what to render in slot i during animation
// When null, show the real plan.days[i].name

function handleGenerate() {
  const newPlan = generateWeeklyPlan(restaurants, budget)
  const allNames = restaurants.map(r => r.name)
  setDisplayNames(allNames.slice(0, 5))  // placeholder — will cycle
  setIsGenerating(true)

  let idx = 0
  const interval = setInterval(() => {
    idx++
    setDisplayNames(
      Array.from({ length: 5 }, (_, i) => allNames[(idx + i) % allNames.length])
    )
  }, 80)

  setTimeout(() => {
    clearInterval(interval)
    setPlan(newPlan)
    setDisplayNames(null)
    setIsGenerating(false)
  }, 2500)
}
```

For per-slot reroll, the same pattern applies but only `displayNames[slotIndex]` cycles while others are `null` (or just their final values from the plan).

**Recommended approach for the planner to decide:**

Option A: One `useSlotAnimation` hook instance, used only for the **weekend page** (single slot). For the weekday page, inline the animation logic directly (simpler, avoids rules-of-hooks array problem).

Option B: One `useSlotAnimation` hook instance per slot in the weekday page by lifting all 5 into a single component that manages 5 hook calls — only possible if 5 slots are always rendered (not conditionally). This is technically feasible since the 5 slots are always present once a plan exists.

**Verdict:** Option A is the lowest-risk, most consistent approach. The hook handles the weekend page cleanly. The weekday page gets its own inline animation state. Code duplication is minimal (the timer pattern is 15 lines).

### Pattern 4: Visual Design — What the Animation Shows

**Success criterion 2:** "The animation shows restaurant names cycling through before landing on the pick."

The current card UI renders `r.name` as a `<p className="font-semibold">`. During animation, replace this with `displayValue` — which cycles through restaurant names from the pool. The rest of the card (cuisine badge, price, distance) can either:

- **Option A: Hidden during animation** — show a skeleton/placeholder for non-name fields. Simpler visual.
- **Option B: Shown with the final values immediately** — reveal price/distance/cuisine of the final pick while only the name cycles. More informative but slightly "spoils" the pick.

**Recommendation:** Option A (hide during animation). Show a pulsing skeleton for the card content during animation, reveal fully when settled. This matches the slot-machine metaphor better.

**CSS for the settle moment:** When the animation ends and `displayValue` becomes the final value, add a brief `animate-in fade-in zoom-in-95 duration-300` on the revealed content. `tw-animate-css` (already in `globals.css` via `@import "tw-animate-css"`) provides these utilities. Apply them by toggling a class when `isAnimating` transitions from `true` to `false`.

```tsx
// During animation
<div className="h-6 bg-muted animate-pulse rounded" />

// Settled — final value revealed with tw-animate-css classes
<p className={`font-semibold ${justSettled ? 'animate-in fade-in zoom-in-95 duration-300' : ''}`}>
  {displayValue}
</p>
```

The `justSettled` boolean is a transient state: set to `true` when `isAnimating` goes `false`, then cleared after `duration-300` (300ms) via a `setTimeout`. Or simply always apply the animate-in class when the card mounts/updates — `tw-animate-css` animate-in only plays once per mount.

### Pattern 5: Button State During Animation

**Current buttons:**
- Weekend: "隨機推薦" and "換一間"
- Weekday: "產生本週午餐計畫" and per-slot "重抽"

**During animation, buttons should:**
1. Be disabled (to prevent triggering a new pick mid-animation) — add `disabled={isAnimating}` to the trigger button.
2. OR the skip mechanism handles double-click: first click skips, second click generates new pick.

**Recommended:** Disable the main action button during animation (`disabled={isAnimating}`). Show a "跳過" (skip) label or allow clicking the animating card area itself to skip. This prevents the user from accidentally double-triggering.

### Anti-Patterns to Avoid

- **Storing interval ID in `useState`:** Causes stale closure bugs where `clearInterval` is called with a stale ID. Always use `useRef` for mutable values that must persist across renders but do not need to trigger re-renders.
- **Using `useEffect` dependency array with `candidates`:** If `candidates` is a new array reference every render (e.g., `restaurants.map(r => r.name)` inline), the effect fires on every render. Wrap with `useMemo` or compute outside the component.
- **Calling animation hooks conditionally or in a loop:** Rules of hooks prohibit conditional hook calls. For the 5-slot weekday case, do NOT try to call `useSlotAnimation` inside a `.map()`. Use inline state instead.
- **Mutating the `plan` state to show animated values:** Do not set `plan.days[i].name` to a cycling value. Keep the real `plan` immutable (as per existing convention). Use a separate `displayNames` state that overlays the real plan during animation.
- **Forgetting cleanup on unmount:** If the user navigates away mid-animation, `clearInterval` and `clearTimeout` must run. The `useEffect` cleanup return handles this.
- **Timer drift:** `setInterval` can drift under heavy load. For a 2-3 second animation this is acceptable (human perception threshold is ~50ms). Do not use `requestAnimationFrame` for this use case — it is overkill and adds complexity.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Entry animation on settled card | Custom CSS keyframe from scratch | `animate-in fade-in zoom-in-95 duration-300` from `tw-animate-css` | Already installed, zero new code |
| Deceleration effect (names slow down) | Complex easing with multiple intervals | Skip — just use a constant fast interval. The 2-3 second duration is enough to feel like a spin without deceleration. | Deceleration requires progressively longer interval delays (e.g., 80ms → 120ms → 200ms). This adds significant complexity for minimal perceived difference. |
| Animated spinning wheel SVG | SVG + canvas animation | Text cycling in a fixed-height box | The success criteria say "spinning wheel/slot-machine animation" but a text cycling slot is sufficient and matches the "restaurant names cycling through" criterion. A literal spinning wheel SVG is not required and would be much harder to implement correctly. |

## Common Pitfalls

### Pitfall 1: Interval Leaks on Fast Re-clicks

**What goes wrong:** User clicks "隨機推薦" rapidly. A new interval starts on each click. Old intervals keep running. The slot displays multiple racing intervals producing a chaotic cycling effect and eventually incorrect final values.

**Why it happens:** `handleRoll` creates a new interval each time. Without canceling the previous interval, multiple intervals stack.

**How to avoid:** In `handleRoll` (or inside `useSlotAnimation`), always call `clearInterval(intervalRef.current)` and `clearTimeout(timeoutRef.current)` before starting new timers. The hook handles this if the implementation uses `stopAnimation()` at the start of the effect.

**Warning signs:** Restaurant names cycle faster and faster with repeated clicks. Final value shown is wrong.

### Pitfall 2: `useEffect` Firing Unnecessarily Due to Unstable `candidates` Reference

**What goes wrong:** The hook re-triggers the animation on every render because `candidates` is a new array reference each time.

**Why it happens:** `const candidates = restaurants.map(r => r.name)` inside the component body creates a new array on every render. If `candidates` is in the effect's dependency array, the effect runs on every render.

**How to avoid:** Memoize candidates: `const candidateNames = useMemo(() => restaurants.map(r => r.name), [restaurants])`. The hook's effect dependency array should only include `finalValue`, not `candidates`.

**Warning signs:** Animation restarts unexpectedly mid-flight; console shows many rapid effect firings.

### Pitfall 3: Skip-Key Handler Not Removed on Cleanup

**What goes wrong:** After the animation ends, pressing any key still triggers `skip()` — even on the `/restaurants` page after navigation.

**Why it happens:** The `keydown` event listener on `document` was added but the cleanup return in `useEffect` was missing `document.removeEventListener`.

**How to avoid:** Always pair `addEventListener` with `removeEventListener` in the `useEffect` cleanup. Only add the listener when `isAnimating` is `true` (guard the effect with `if (!isAnimating) return`).

**Warning signs:** Skip behavior triggers on subsequent pages; console logs show `skip` called with `isAnimating: false`.

### Pitfall 4: Displaying Animation on Page with Empty Restaurant Pool

**What goes wrong:** If the restaurant pool is empty, `candidates` is `[]`, and the cycling produces an empty display — a blank slot during animation.

**Why it happens:** `candidates[idx % candidates.length]` with length 0 produces `candidates[NaN]` = `undefined`.

**How to avoid:** Guard in the hook: `if (candidates.length === 0) { setDisplayValue(finalValue); return; }` — skip the animation entirely when there is nothing to cycle through.

**Warning signs:** Empty slot during animation when pool is minimal or user has deleted all restaurants.

### Pitfall 5: `isAnimating` Flag Out of Sync with Actual Timer State

**What goes wrong:** `isAnimating` shows `true` but the interval has already been cleared (e.g., after timeout fires but before state update propagates). Brief flash where UI shows stale "animating" state.

**Why it happens:** `setIsAnimating(false)` in the timeout callback is asynchronous — there is one render cycle between `clearInterval` and `isAnimating` becoming `false` in the component.

**How to avoid:** This is an inherent React batching behavior and is acceptable. The one-render-cycle gap (~16ms) is imperceptible. Do not try to synchronize these with `flushSync` — that is over-engineering.

### Pitfall 6: Weekday Multi-Slot Animation Conflicts with History State

**What goes wrong:** The weekday page has plan history (`history: WeeklyPlan[]`). Clicking "產生本週午餐計畫" adds a new plan to history AND starts the animation. If the user clicks a history entry mid-animation, the plan switches but the animation is still running — the animation settles on the old plan's values.

**Why it happens:** Animation state (`displayNames`, `isGenerating`) is not connected to which history entry is selected. The timeout callback references the wrong `plan` via stale closure.

**How to avoid:** The timeout callback should call `setHistory` and `setSelectedIndex` (not a separate `setPlan`). The animating `displayNames` state is unaffected by history selection (it is local and clears when the timer fires). This is safe because:
- History navigation only changes `selectedIndex` (which `plan` to display).
- The animation only touches `displayNames` (the overlay).
- When the animation settles, it clears `displayNames` and the real `plan.days[i].name` shows through.

If the user clicks a history entry during animation, they see the old plan's real values (because `displayNames` is still non-null). This is acceptable UX. Alternatively, clicking a history entry can also call `stopAnimation()` / clear `displayNames` if the plan is being interrupted.

### Pitfall 7: Testing Animations — Vitest Timer Mocking

**What goes wrong:** Integration tests for the animated pages hang or time out because `setInterval` / `setTimeout` use real timers. A 2500ms animation makes tests run for 2.5 seconds each.

**Why it happens:** The test environment runs real timers by default.

**How to avoid:** Use Vitest's fake timer API:
```typescript
import { vi } from 'vitest'
vi.useFakeTimers()
// ... interact with component to start animation ...
vi.runAllTimers()  // or vi.advanceTimersByTime(2500)
// ... assert settled state ...
vi.useRealTimers()
```

Fake timers must be used in any test that clicks the recommendation button after this phase. The existing `integration.test.tsx` tests will continue to pass only if the animation state is either (a) guarded against `candidates.length === 0` so no timers fire with an empty pool, or (b) tests use `vi.useFakeTimers()`.

**Warning signs:** Tests pass individually but time out in CI; `--testTimeout` errors in Vitest output.

## Code Examples

### Minimal `useSlotAnimation` Hook

```typescript
// src/hooks/use-slot-animation.ts
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

interface UseSlotAnimationOptions {
  candidates: string[]
  finalValue: string | null
  durationMs?: number
  intervalMs?: number
}

export function useSlotAnimation({
  candidates,
  finalValue,
  durationMs = 2500,
  intervalMs = 80,
}: UseSlotAnimationOptions) {
  const [displayValue, setDisplayValue] = useState<string | null>(finalValue)
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevFinalRef = useRef<string | null>(null)

  const stopAnimation = useCallback(
    (settledValue: string | null = null) => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      intervalRef.current = null
      timeoutRef.current = null
      if (settledValue !== null) {
        setDisplayValue(settledValue)
        setIsAnimating(false)
      }
    },
    [],
  )

  const skip = useCallback(() => {
    stopAnimation(finalValue)
  }, [stopAnimation, finalValue])

  useEffect(() => {
    if (finalValue === null) return
    if (finalValue === prevFinalRef.current) return
    prevFinalRef.current = finalValue

    if (candidates.length === 0) {
      setDisplayValue(finalValue)
      return
    }

    stopAnimation()
    setIsAnimating(true)

    let idx = 0
    intervalRef.current = setInterval(() => {
      idx = (idx + 1) % candidates.length
      setDisplayValue(candidates[idx])
    }, intervalMs)

    timeoutRef.current = setTimeout(() => {
      stopAnimation(finalValue)
    }, durationMs)

    return () => stopAnimation()
  }, [finalValue]) // eslint-disable-line react-hooks/exhaustive-deps

  return { displayValue, isAnimating, skip }
}
```

### Weekend Page Skip-by-Keypress

```typescript
// Inside WeekendPage component
useEffect(() => {
  if (!isAnimating) return
  const handler = (e: KeyboardEvent) => {
    if (['Space', 'Enter', 'Escape'].includes(e.code)) {
      e.preventDefault()
      skip()
    }
  }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}, [isAnimating, skip])
```

### Animating Name Display — Weekend Card

```tsx
{/* During animation: cycling name display */}
<div
  className="cursor-pointer min-h-[2rem] flex items-center"
  onClick={isAnimating ? skip : undefined}
>
  <h2 className="text-xl font-semibold">
    {isAnimating ? displayValue : finalPick?.name}
  </h2>
</div>
{isAnimating && (
  <p className="text-xs text-muted-foreground mt-1">按任意鍵或點擊跳過</p>
)}
```

### Weekday Page — Inline Multi-Slot Animation State

```typescript
// In HomePage — inline approach (avoids hook-in-loop problem)
const [displayNames, setDisplayNames] = useState<(string | null)[]>(
  Array(5).fill(null)
)
const [animatingSlots, setAnimatingSlots] = useState<Set<number>>(new Set())
const genIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
const genTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

function startPlanAnimation(newPlan: WeeklyPlan, allNames: string[]) {
  if (genIntervalRef.current) clearInterval(genIntervalRef.current)
  if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current)

  setAnimatingSlots(new Set([0, 1, 2, 3, 4]))
  let idx = 0
  genIntervalRef.current = setInterval(() => {
    idx++
    setDisplayNames(
      Array.from({ length: 5 }, (_, i) => allNames[(idx + i * 3) % allNames.length])
    )
  }, 80)

  genTimeoutRef.current = setTimeout(() => {
    clearInterval(genIntervalRef.current!)
    setDisplayNames(Array(5).fill(null))
    setAnimatingSlots(new Set())
    genIntervalRef.current = null
    genTimeoutRef.current = null
  }, 2500)
}
```

### Vitest Test with Fake Timers

```typescript
import { vi, describe, test, expect, afterEach } from 'vitest'

describe('HomePage with animation', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('generates a plan after animation settles', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderHomePage()

    await user.click(screen.getByRole('button', { name: '產生本週午餐計畫' }))

    // Animation is running — day cards may show cycling names
    // Advance timers past animation duration
    vi.advanceTimersByTime(3000)

    // After animation: day labels should be visible
    expect(screen.getByText('星期一')).toBeInTheDocument()
    expect(screen.getByText(/本週總花費/)).toBeInTheDocument()
  })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External animation libraries (framer-motion, react-spring) | CSS keyframes + JS intervals | React 18+ (2022+) | React 19's concurrent rendering makes external animation libraries less necessary for simple timer-based animations |
| CSS `animation` property directly on elements | `tw-animate-css` utility classes (`animate-in`, `fade-in`, etc.) | Tailwind v4 (2025) | CSS utility classes for animation are now the standard; no need for custom keyframe declarations |
| `tailwindcss-animate` | `tw-animate-css` (Tailwind v4 compatible fork) | Tailwind v4 (Jan 2025) | `tailwindcss-animate` uses JS config and is incompatible with Tailwind v4's CSS-first approach |

**Already in the project and usable immediately:**
- `tw-animate-css` is installed and imported in `globals.css` via `@import "tw-animate-css"`. This gives access to `animate-in`, `fade-in`, `zoom-in-*`, `duration-*` utility classes.
- `@keyframes spin` is available via Tailwind's default animation utilities (`animate-spin`). This rotates an element; can be applied to a spinner indicator during animation.

## Open Questions

1. **Deceleration effect: yes or no?**
   - What we know: The spec says "2-3 seconds before settling." The simplest implementation uses a constant fast interval (80ms). This looks like a mechanical slot machine, not a spinning wheel that slows down.
   - What's unclear: Does the product want a genuine deceleration (names slow down before settling), or is constant-speed cycling acceptable?
   - Recommendation: Implement constant-speed first (simpler). If deceleration is desired, it can be added by running multiple timeout stages: fast interval for 1.5s, then slower interval for 0.5s, then settle. But start without deceleration — constant speed reads well for 2.5 seconds.

2. **Weekday "generate all 5" vs. per-slot reroll — same animation or different?**
   - What we know: Both are covered by success criteria 1-4. "Generate all" could show 5 slots all cycling simultaneously. "Reroll one slot" could show just that slot cycling.
   - What's unclear: Should the 5 slots cycle in sync (same name at same time in all slots) or independently (each slot shows a different random name at each interval tick)?
   - Recommendation: Independent per-slot cycling (each slot has an offset index: `allNames[(idx + i*3) % allNames.length]`). This looks like a real slot machine and is visually more interesting.

3. **What to show in the non-name card fields during animation?**
   - What we know: The weekday cards show name, cuisine badge (colored), price, distance, rating, and a reroll button.
   - What's unclear: During animation, should the badge/price/distance show the final values immediately (revealing the pick before the name settles), or show placeholder skeletons?
   - Recommendation: Show skeleton placeholders for badge and price/distance during animation. Reveal all simultaneously when the animation settles. This preserves the "reveal" moment.

4. **Skip affordance visibility**
   - What we know: Success criterion 5 says users can skip by "clicking again or pressing a key." The key press is clear. "Clicking again" is ambiguous — click the button again? Click the card? Click anywhere?
   - Recommendation: Clicking the animating card area (the slot itself) triggers skip. The generate/reroll button is disabled during animation. Show a small "點擊跳過" hint on the animating card.

5. **Effect on existing integration tests**
   - What we know: `integration.test.tsx` tests click the generate button and assert on plan output synchronously. After this phase, the button click starts an animation. Tests will break unless fake timers are used.
   - What's unclear: Whether the plan tests should advance timers to skip the animation, or the animation should be opt-out for tests via a prop or environment variable.
   - Recommendation: Use `vi.useFakeTimers()` in the affected tests and `vi.advanceTimersByTime(3000)` before making assertions. This is the standard Vitest approach. Do not add test-only props to production components.

## Plan Breakdown Recommendation

Given the complexity, Phase 11 should be broken into **2 plans**:

**Plan 11-01:** Implement and test `useSlotAnimation` hook + integrate into weekend page only (single slot, simpler). Write hook unit tests and updated weekend page component tests with fake timers.

**Plan 11-02:** Integrate animation into weekday page (inline multi-slot approach) — both "generate plan" and "per-slot reroll" cases. Update `integration.test.tsx` to use fake timers. Human verification checkpoint.

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `src/app/page.tsx`, `src/app/weekend/page.tsx`, `src/lib/recommend.ts`, `package.json`, `src/app/globals.css` — confirmed no external animation library exists; `tw-animate-css` is installed and active
- Direct read: `node_modules/tw-animate-css/dist/tw-animate.css` — confirmed `animate-in`, `fade-in`, `zoom-in-*`, `duration-*` utilities are available
- Direct read: `__tests__/integration.test.tsx`, `__tests__/weekend-page.test.tsx` — confirmed test patterns, mock context shape, and that fake timer adoption is required
- React documentation (hooks rules, `useRef` vs `useState` for mutable values, `useEffect` cleanup)
- Vitest documentation: `vi.useFakeTimers()`, `vi.advanceTimersByTime()`, `userEvent.setup({ advanceTimers })` pattern

### Secondary (MEDIUM confidence)
- `tw-animate-css` README (via package.json homepage) — confirmed it is the Tailwind v4 compatible replacement for `tailwindcss-animate`
- General knowledge of `setInterval`/`clearInterval` patterns in React hooks — well-established, no library needed

### Tertiary (LOW confidence)
- Product UX decisions (deceleration, what to show during animation, skip affordance) — recommendations are based on common slot-machine UX conventions, not user research

## Metadata

**Confidence breakdown:**
- No external library needed: HIGH — confirmed via `package.json` (tw-animate-css already there) and analysis of requirement complexity
- Hook pattern (`useRef` for interval): HIGH — standard React pattern documented extensively
- Multi-slot weekday complexity: HIGH — confirmed via code read of `page.tsx` (5-slot structure with history)
- Testing with fake timers: HIGH — Vitest documentation confirms `vi.useFakeTimers()` pattern
- UX/product decisions (deceleration, skip affordance): MEDIUM — reasonable defaults, should be validated with user

**Research date:** 2026-02-19
**Valid until:** 2026-03-21 (React 19 stable, tw-animate-css stable, Vitest stable)
