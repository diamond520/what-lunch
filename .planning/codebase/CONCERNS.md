# Codebase Concerns

**Analysis Date:** 2026-02-19

## Tech Debt

**File System API Route for Restaurant Config:**
- Issue: `src/app/api/restaurants/route.ts` writes directly to TypeScript source files using string manipulation and regex. This is fragile and non-idiomatic.
- Files: `src/app/api/restaurants/route.ts` (lines 5–43)
- Impact:
  - String-based file manipulation can break with formatting changes
  - Regex pattern `/\n\] satisfies Restaurant\[\]/` assumes specific source code format
  - Manual ID number tracking (maxId + 1) can fail if IDs are edited directly in the file
  - No validation that the final file is valid TypeScript
- Fix approach: Migrate to JSON-based persistence (e.g., `.data/restaurants.json`) or a proper database. Store restaurant config separately from source code. If source code generation is needed, use an AST parser (e.g., TypeScript compiler API) instead of regex.

**Silent Error Swallowing:**
- Issue: Multiple catch blocks silently ignore all errors without logging or distinguishing between expected and unexpected failures.
- Files:
  - `src/app/page.tsx` (lines 37–39, 90–92, 214–216): localStorage reads/writes, clipboard operations
  - `src/lib/history.ts` (lines 23–25, 35–37): localStorage reads
  - `src/lib/restaurant-context.tsx` (lines 29–31, 54–57, 64–67): localStorage operations
  - `src/lib/history-context.tsx` (lines 39–42, 49–52): localStorage operations
  - `src/app/restaurants/page.tsx` (lines 159–161): API call errors
- Impact:
  - Data loss goes unnoticed (e.g., localStorage quota exceeded)
  - API failures show generic user message instead of actionable feedback
  - Debugging production issues becomes difficult
  - Users don't know if data was actually persisted
- Fix approach:
  - Log errors with context (dev console at minimum)
  - Distinguish between expected errors (quota exceeded, no clipboard API) and unexpected ones (JSON parse errors)
  - Show more specific toasts for critical failures
  - Consider adding error boundary or analytics for quota exceeded events

**Animation State Cleanup:**
- Issue: `src/app/page.tsx` (lines 148–161, 173–190) manually manages two separate interval/timeout refs (`genIntervalRef`, `rerollIntervalRef`) with manual cleanup in `stopGenAnimation()` and `stopRerollAnimation()`.
- Files: `src/app/page.tsx`
- Impact:
  - Duplicate cleanup logic — maintainer must update both functions if cleanup strategy changes
  - Potential memory leak if animation stops unexpectedly
  - Hard to add new timer-based animations without repeating pattern
  - `useSlotAnimation` hook exists but not used in the main page
- Fix approach: Use `useSlotAnimation` hook for main page animations instead of manual interval management. This consolidates cleanup logic and follows single responsibility principle.

**Hardcoded Constants Scattered:**
- Issue: Magic numbers and strings are defined at page level rather than in a central config.
- Files: `src/app/page.tsx` (lines 17–24): `DAY_LABELS`, `DEFAULT_BUDGET`, `BUDGET_MIN/MAX/STEP`, `MAX_HISTORY`, `FILTER_STORAGE_KEY`, `POOL_WARNING_THRESHOLD`
- Impact:
  - Changing budget constraints requires finding 10+ locations
  - No single source of truth for validation ranges
  - Hard to test different configurations
- Fix approach: Move all constants to `src/lib/config.ts` and import. Use Zod schemas for budget/history constraints.

**DateString Parsing Fragility:**
- Issue: `src/lib/history.ts` (lines 40–62) uses 'sv' locale for ISO date strings and manual date arithmetic with `cursor.setDate()`. Timezone-aware operations are manual and error-prone.
- Files: `src/lib/history.ts`
- Impact:
  - Daylight saving time transitions could cause off-by-one errors
  - Implicit assumption that `new Date(dateStr)` parses in local timezone
  - No validation that date strings are valid YYYY-MM-DD format
  - Comment acknowledges UTC offset issues but doesn't prevent them
- Fix approach: Use a date library (date-fns, Day.js) with explicit timezone handling. Add date validation with Zod.

## Known Bugs

**Weekly Budget Overspend in Edge Cases:**
- Symptoms: Total cost can slightly exceed weekly budget due to rounding or fallback logic
- Files: `src/lib/recommend.ts` (lines 128–151, 153–178)
- Trigger: When budget is very tight and few affordable restaurants exist, fallback logic (lines 81–92) may pick restaurants that don't fit the spendable budget
- Workaround: User can manually reroll slots to find cheaper combinations. Budget min/max limits (100–2000 TWD) reduce likelihood
- Root cause: `pickForSlot` function's fallback (lines 81–82) uses `affordable` with budget constraint, but `generatePlanAttempt` doesn't validate final total matches constraint. Function returns plan even if fallback was used.
- Fix approach: Validate total cost in `generatePlanAttempt` before returning. If it exceeds budget, retry with relaxed cuisine rules or return error to caller.

**Potential State Hydration Mismatch:**
- Symptoms: On rare occasions, page might show stale data during initial render before hydration completes
- Files: `src/app/page.tsx` (line 79), `src/app/restaurants/page.tsx` (line 493), `src/app/weekend/page.tsx` (line 40), `src/app/history/page.tsx` (line 12)
- Trigger: Pages use `isHydrated` flag from context to conditionally render. Timing window between server render and client hydration could show loader when data should be visible.
- Workaround: All pages properly use `if (!isHydrated) return <loader>` so incorrect render is prevented
- Root cause: `useSyncExternalStore` pattern (used in contexts) has inherent timing issues in some React versions
- Fix approach: Verify React 19.2.3 hydration consistency. Add integration tests that verify hydration doesn't cause layout shift.

**useSlotAnimation Dependency Warning:**
- Symptoms: `useSlotAnimation` hook (line 69) has ESLint disable comment: `react-hooks/exhaustive-deps`
- Files: `src/hooks/use-slot-animation.ts` (line 69)
- Trigger: `stopAnimation` is listed as dependency but it's defined inside the effect. Removing it causes infinite loops. Including it requires complex memoization.
- Impact: Hook is correct despite warning, but signals code smell. Future changes to `stopAnimation` could be missed.
- Fix approach: Refactor to avoid re-creating `stopAnimation` on every render, or use a ref-based approach. See: https://github.com/facebook/react/issues/18786

## Security Considerations

**API Route Dev-Only Check is Insufficient:**
- Risk: `src/app/api/restaurants/route.ts` (line 8) checks `process.env.NODE_ENV !== 'development'` to prevent production access
- Files: `src/app/api/restaurants/route.ts`
- Current mitigation: Node env check prevents deployment, but it's not cryptographically secure
- Recommendations:
  - This should never be deployed to production. Add deployment checklist to verify API is never exported.
  - If this pattern is needed in production, switch to authenticated API (e.g., OAuth, API keys)
  - Consider removing this entire API endpoint if it's dev-only and use git diff/manual updates instead

**No Input Validation on API Payload:**
- Risk: API expects `restaurant.name`, `restaurant.type`, `restaurant.price` but only checks existence, not format
- Files: `src/app/api/restaurants/route.ts` (lines 12–15)
- Current mitigation: Minimal type checking prevents obvious errors
- Recommendations:
  - Validate with Zod schema (same as restaurant form validation in `src/app/restaurants/page.tsx`)
  - Reject missing `distance` and `rating` fields
  - Validate numeric ranges (price > 0, rating 1–5)

**Duplicate Name String Matching is Fragile:**
- Risk: Line 20 uses `content.includes(\`name: '${restaurant.name}'\`)` to detect duplicates
- Files: `src/app/api/restaurants/route.ts` (line 20)
- Current mitigation: String contains check prevents exact duplicates
- Recommendations:
  - This can have false positives (e.g., restaurant named "name: 'Bob'" would match any restaurant with "Bob")
  - Use AST parsing or JSON-based storage to avoid string matching

**No CORS/CSRF Protection:**
- Risk: API endpoint accepts POST with no CSRF token or origin validation
- Files: `src/app/api/restaurants/route.ts`
- Current mitigation: Only enabled in development
- Recommendations:
  - If deployed, add CSRF token validation
  - Restrict origin header
  - Use SameSite cookie attribute

## Performance Bottlenecks

**Recommendation Algorithm Retry Loop:**
- Problem: `generateWeeklyPlan` (lines 153–178) retries up to 10 times to find a cuisine-diverse plan
- Files: `src/lib/recommend.ts` (lines 153–178)
- Cause: No constraint satisfaction algorithm — uses random sampling with retry
- Current capacity: ~10ms per generation on modern hardware; retries add 0.1–1s for tight budgets
- Limit: O(n) for each retry; inefficient with large restaurant pools
- Scaling path:
  - Pre-compute cuisine distribution and use smarter selection heuristic
  - Use backtracking or constraint solver for optimal picks
  - Cache eligible sets per cuisine type
- Test coverage: Good (100+ iterations tested in `__tests__/recommend.test.ts`)

**Slot Animation Calculations:**
- Problem: Main page animation recalculates `allRestaurantNames` every render; cycles through all names during animation
- Files: `src/app/page.tsx` (lines 77, 150–154)
- Cause: `useMemo` for restaurant names, but still iterates full list on every animation frame
- Current capacity: Acceptable for < 100 restaurants
- Limit: Becomes visible lag with 500+ restaurants
- Scaling path:
  - Randomly sample N animation candidates instead of full pool
  - Use requestAnimationFrame instead of setInterval (80ms) for smoother motion

**LocalStorage Serialization on Every History Change:**
- Problem: `src/lib/history-context.tsx` (lines 34–42) serializes entire history array to JSON every time an entry is added
- Files: `src/lib/history-context.tsx`, `src/app/page.tsx`
- Cause: No batch operations; every `addEntries` call triggers serialization + disk write
- Current capacity: < 100 entries (5 per week × 20 weeks)
- Limit: Noticeable slowdown when history exceeds 500+ entries
- Scaling path:
  - Implement pagination/archiving (oldest entries)
  - Use IndexedDB instead of localStorage for large datasets
  - Batch writes with debouncing

**No Memoization in RestaurantListPanel:**
- Problem: `RestaurantListPanel` component in `src/app/restaurants/page.tsx` (lines 140–144) re-filters restaurants on every render
- Files: `src/app/restaurants/page.tsx` (lines 119–478)
- Cause: Filter calculation is not memoized
- Current capacity: 100–200 restaurants, 60fps
- Limit: Stuttering with 1000+ restaurants and frequent table updates
- Scaling path:
  - Wrap filter calculation in useMemo
  - Virtualize table rows (react-window or similar)
  - Use React.memo on RestaurantListPanel

## Fragile Areas

**Restaurant API File Generation:**
- Files: `src/app/api/restaurants/route.ts`
- Why fragile:
  - String manipulation assumes specific formatting (`\n\] satisfies Restaurant\[\]`)
  - ID generation is manual and order-dependent
  - No atomic writes — file corruption if process crashes mid-write
  - No rollback on failure
- Safe modification:
  - Add comprehensive tests for the regex pattern
  - Add file backup before writing
  - Validate output file is valid TypeScript before committing
  - Consider switching to JSON-based storage entirely
- Test coverage: None (no tests for route.ts)

**useSlotAnimation Hook Timing:**
- Files: `src/hooks/use-slot-animation.ts`
- Why fragile:
  - Complex timing logic with interval + timeout + state updates
  - Closure over `candidates` array — mutations break animation
  - cleanup callback (`return () => stopAnimation()`) can conflict with manual `skip()` call
  - ESLint exhaustive deps warning suggests incomplete dependency tracking
- Safe modification:
  - Add tests for edge cases: skip before animation ends, rapid animations, empty candidates
  - Document interval/timeout lifecycle clearly
  - Consider using AbortController pattern for cleaner cancellation
- Test coverage: 121 lines in `__tests__/use-slot-animation.test.ts` (good)

**Filter State Persistence:**
- Files: `src/app/page.tsx` (lines 31–40, 83–93)
- Why fragile:
  - Filter mode and cuisines stored in component state AND localStorage
  - Sync happens in useEffect after render; potential stale render
  - JSON.parse on arbitrary object could deserialize invalid cuisine types
  - No schema validation on read
- Safe modification:
  - Use Zod to validate stored filter shape
  - Move all filter logic to context (RestaurantContext) instead of page-level state
  - Add migration if filter schema ever changes
- Test coverage: Partial (not explicitly tested)

**History Date Parsing and Business Day Logic:**
- Files: `src/lib/history.ts` (lines 40–73)
- Why fragile:
  - Cursor arithmetic assumes `setDate()` handles month boundaries correctly
  - No DST handling
  - Comment acknowledges UTC offset issues but doesn't prevent them
  - Date comparison uses string `>=` (works for ISO 8601 but fragile)
- Safe modification:
  - Add unit tests for dates around month/year boundaries
  - Add tests for DST transitions (March/November in many locales)
  - Use date-fns or Day.js for robust date arithmetic
  - Document assumption that all dates are local and YYYY-MM-DD format
- Test coverage: 153 lines in `__tests__/history.test.ts` (good, but no DST/boundary tests)

## Scaling Limits

**Restaurant Pool Size:**
- Current capacity: 50–100 restaurants (comfortable)
- Limit: Algorithm O(n²) in worst case due to cuisine conflict checking
- Scaling path:
  - Pre-compute valid combinations
  - Index by cuisine type
  - Use smarter heuristic instead of random retry

**Plan History Stack:**
- Current capacity: Last 5 plans kept in memory (MAX_HISTORY)
- Limit: Each plan is immutable; no pruning by age
- Scaling path:
  - Prune plans older than 30 days
  - Move older plans to IndexedDB/localStorage
  - Implement infinite scroll with pagination

**localStorage Quota:**
- Current capacity: Typical quota 5–50 MB; codebase uses ~50 KB with default data
- Limit: Will fail silently when quota exceeded (errors swallowed)
- Scaling path:
  - Implement quota monitoring
  - Add user warning when >80% full
  - Implement data compression or archiving
  - Consider IndexedDB for history + restaurants

## Dependencies at Risk

**No External Data Persistence:**
- Risk: All data (restaurants, history, filters) lives in localStorage only. No cloud sync or backup.
- Impact: User data is lost if browser cache clears or they switch devices
- Migration plan: Add optional JSON export/import feature. Consider cloud storage integration (Firebase, Supabase) for future versions.

**No Error Reporting:**
- Risk: Bugs only reported via user complaints; no error tracking
- Impact: Production errors go unnoticed; pattern of silent failures makes debugging hard
- Migration plan: Add Sentry or similar error tracking. Prioritize logging over silent catches.

**No Type Validation at Runtime:**
- Risk: Zod is not used (except in tests). localStorage reads could deserialize invalid shapes.
- Impact: If schema changes, old data becomes invalid
- Migration plan: Validate all localStorage reads with Zod schemas. Add migration functions for schema upgrades.

## Missing Critical Features

**No Data Export/Import:**
- Problem: Users cannot backup or migrate their restaurant/history data
- Blocks: Multi-device sync, data portability
- Fix approach: Add JSON export (downloads file) and import (accepts file upload with validation)

**No Undo/Redo:**
- Problem: Deleting a restaurant or history entry is permanent and irreversible
- Blocks: Recovery from accidental deletion
- Fix approach: Implement soft deletes or simple undo stack (keep last 10 deletions)

**No Conflict Resolution for Weekend/Weekday Overlap:**
- Problem: User can add same restaurant to both weekend and weekday pools; no indication of inconsistency
- Blocks: Scenario planning for restaurants with limited hours
- Fix approach: Show warning if adding to one pool when already in the other

## Test Coverage Gaps

**API Route Not Tested:**
- What's not tested: `src/app/api/restaurants/route.ts` endpoint logic
- Files: `src/app/api/restaurants/route.ts`
- Risk: Regex patterns, file writing, ID generation, duplicate detection — all untested
- Priority: **High** (this code is fragile and write-to-disk)

**Error Handling in Components:**
- What's not tested: Error paths for localStorage quota exceeded, missing clipboard API, API call failures
- Files: `src/app/page.tsx`, `src/app/weekend/page.tsx`, `src/app/restaurants/page.tsx`
- Risk: User-facing errors are silent; can't verify error messages work
- Priority: **Medium** (low frequency, but important when they happen)

**Hydration Edge Cases:**
- What's not tested: Race conditions between server render and client hydration
- Files: `src/app/layout.tsx`, all pages using `isHydrated`
- Risk: Rare but possible mismatch causing layout shift or stale data
- Priority: **Low** (React 19.2 is mature; unlikely but good to verify)

**Date Boundary Conditions:**
- What's not tested: Month/year boundaries, DST transitions, leap years
- Files: `src/lib/history.ts`
- Risk: `setDate()` arithmetic could fail on boundary dates
- Priority: **Low** (unlikely, but test is easy to add)

**Restaurant Filter Validation:**
- What's not tested: Stored filter with invalid cuisine types, corrupt JSON in localStorage
- Files: `src/app/page.tsx`, `src/lib/restaurant-context.tsx`
- Risk: Invalid filters silently fall back to defaults (current behavior is safe but untested)
- Priority: **Low** (fallback is safe)

---

*Concerns audit: 2026-02-19*
