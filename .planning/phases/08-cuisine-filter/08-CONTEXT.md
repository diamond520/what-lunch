# Phase 8: Cuisine Filter - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Add cuisine type filtering to the weekly plan picker page. Users can exclude or lock specific cuisine types when generating plans. The filter integrates with the existing recommendation algorithm and re-roll behavior. No new pages — all changes are on the existing picker page.

</domain>

<decisions>
## Implementation Decisions

### Filter UI presentation
- Colored chips/badges matching each cuisine's existing color from CUISINE_META
- Tap/click a chip to toggle it on/off
- No label/header text above the filter section — chips are self-explanatory
- A small "重置" reset button/link next to the filter area to clear all selections

### Mode switching UX
- Segmented control (two-segment toggle) above the chips for switching between 排除 and 鎖定 modes
- Labels in Chinese: 排除 / 鎖定
- Default mode on first visit: 排除 (exclude mode)
- Exclude = selected cuisines are removed from the pool
- Lock = only selected cuisines remain in the pool

### Warning & edge cases
- Inline warning text (yellow/orange) appears below the chips when filtering is too restrictive
- In lock mode with only 1 cuisine type locked: relax the diversity constraint (no-3-consecutive rule) — user explicitly wants that cuisine
- Diversity constraint still applies in exclude mode and when multiple cuisine types are locked

### Filter behavior & persistence
- Filter mode + selected cuisines persist in localStorage across page reloads
- Changing any filter selection auto-clears the current plan (consistent with existing budget change behavior)
- Filters apply to re-rolls — re-rolling a single day respects the current exclude/lock filter
- Reset button clears all selections and returns to default state (exclude mode, no chips selected)

### Claude's Discretion
- Exact placement of filter section on picker page (above or below budget input)
- Visual treatment for active vs inactive chips (filled/outlined, opacity, etc.)
- Behavior when switching between exclude/lock modes (clear selections or keep them)
- Whether to show live restaurant count as chips change, or only warn on generate
- How to handle partial plan fills when algorithm can't fill all 5 days with current filters

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The filter should feel native to the existing picker page layout and match the app's current shadcn/ui + Tailwind styling.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-cuisine-filter*
*Context gathered: 2026-02-19*
