# Codebase Concerns

**Analysis Date:** 2026-02-18

## Data Persistence Issues

**No local storage implementation:**
- Issue: Restaurant list and plan history are lost on page refresh. State exists only in memory via React Context.
- Files: `src/lib/restaurant-context.tsx`, `src/app/page.tsx`, `src/app/restaurants/page.tsx`
- Impact: Users cannot save their custom restaurant list or past plans. Each session starts with default restaurants only.
- Fix approach: Implement localStorage persistence in `RestaurantProvider` with hydration checks to avoid hydration mismatches in Next.js. Consider IndexedDB for larger datasets.
- Priority: High - affects core user experience

**No plan history:**
- Issue: Generated weekly plans are not persisted or archived. Only current plan visible, reroll deletes previous state.
- Files: `src/app/page.tsx` (line 21: `plan` state is local only)
- Impact: Users cannot refer back to previous plans or track lunch choices over time.
- Fix approach: Add plan history stack with localStorage, provide UI to view/restore past plans.
- Priority: Medium - nice-to-have feature

## Random Selection Concerns

**Weak randomness for determinism issues:**
- Issue: Uses `Math.floor(Math.random() * array.length)` for restaurant selection in `pickForSlot()` and `pickForSlotReroll()`.
- Files: `src/lib/recommend.ts` (lines 61, 95)
- Current mitigation: Test suite verifies variation over 100 iterations (lines 101-107), so randomness is adequate for user-facing randomization.
- Recommendation: Current approach is acceptable for client-side lunch picker. If this moves to server-side or requires seeded randomness for reproducibility, switch to `crypto.getRandomValues()`.
- Priority: Low - not a bug, just a design note

## State Management Complexity

**High number of useState calls in RestaurantsPage:**
- Issue: 9 separate useState calls for form inputs/errors in `src/app/restaurants/page.tsx` (lines 23-30).
- Files: `src/app/restaurants/page.tsx` (lines 23-30, 32-62)
- Impact: Makes form handling verbose and error-prone. Difficult to add new fields or refactor validation logic.
- Fix approach: Consolidate into single state object or use useReducer hook. Extract validation logic into reusable helper function.
- Priority: Medium - code maintainability issue, not a functional bug

**No form state reset abstraction:**
- Issue: Form reset logic duplicated in `handleSubmit()` (lines 105-112) mirrors initialization (lines 23-27).
- Files: `src/app/restaurants/page.tsx`
- Impact: If validation rules change or fields are added, must update reset logic in two places.
- Fix approach: Extract reset to standalone function `const resetForm = () => { ... }` at module level.
- Priority: Low - minor DRY violation

## Input Validation Gaps

**Inconsistent numeric validation:**
- Issue: Restaurant form validates price, distance, rating with multiple isNaN checks (lines 34, 45, 56, 73, 80, 87) but lacks range validation.
- Files: `src/app/restaurants/page.tsx`
- Current behavior: Accepts negative values, zero distance, rating outside 1-5 range, prices beyond typical range.
- Impact: Invalid data can be added (e.g., -100 price, 0 rating). Budget input in page.tsx has min/max (lines 42-43) but restaurant form doesn't.
- Fix approach: Add explicit range validation in handleXxxChange handlers. For rating: 1-5, for price/distance: > 0.
- Priority: Medium - edge case handling

**No validation for duplicate restaurants:**
- Issue: Users can add identical restaurants (same name, cuisine, price).
- Files: `src/app/restaurants/page.tsx` (line 96)
- Impact: Redundant entries clutter the list and skew algorithm when same restaurant chosen multiple times.
- Fix approach: Check restaurant name uniqueness before addRestaurant, show warning if duplicate detected.
- Priority: Low - user experience issue, not a bug

**Name field accepts only whitespace:**
- Issue: `name.trim()` check on line 69 prevents submission of whitespace-only names, but UI allows user to enter spaces.
- Files: `src/app/restaurants/page.tsx` (line 69)
- Impact: Users can type spaces, see no error, then submit fails silently with no feedback.
- Fix approach: Add real-time validation feedback for name field, disable submit if name is empty/whitespace-only.
- Priority: Low - UX polish

## Algorithm Stability

**MAX_ATTEMPTS hardcoded to 10:**
- Issue: `generatePlanAttempt()` retries up to 10 times to find a plan without cuisine violations (line 148).
- Files: `src/lib/recommend.ts` (line 148)
- Impact: With tight budgets or single-cuisine restaurants, may fail to avoid violations within 10 attempts and return suboptimal plan on line 155.
- Current mitigation: Test suite verifies no violations over 100 iterations (line 89-98) for DEFAULT_RESTAURANTS. This works but is dataset-dependent.
- Fix approach: Make MAX_ATTEMPTS configurable, or increase to 20-50 and measure actual success rate by cuisine pool diversity. Add metric logging.
- Priority: Low - only affects edge cases with homogeneous restaurant pools

**Fallback plan quality not evaluated:**
- Issue: If strict plan generation fails, fallback on line 155 returns `generatePlanAttempt()` result even if it violates cuisine constraints.
- Files: `src/lib/recommend.ts` (lines 147-156)
- Impact: Users see 3+ consecutive same-cuisine days on fallback. This is documented behavior in code but user-visible failure.
- Fix approach: Track if fallback was used, show UI indicator ("⚠ Not all constraints met") to set expectations.
- Priority: Low - acceptable graceful degradation

## Testing Gaps

**No tests for RestaurauntPage component:**
- Issue: Only `recommend.ts` has test coverage. React components are untested.
- Files: `src/app/restaurants/page.tsx`, `src/app/page.tsx`, component UI files
- Impact: Form validation logic, submission, error rendering untested. Regressions would go undetected.
- Fix approach: Add Vitest + Testing Library tests for RestaurantsPage form submission, error states, and HomePage plan rendering.
- Priority: Medium - component behavior not validated

**No type-level tests:**
- Issue: CuisineType union is enforced at compile-time via `as const satisfies`, but no test ensures all CUISINE_META keys are used in actual data.
- Files: `src/lib/types.ts`, `src/lib/restaurants.ts`
- Impact: If new cuisine added to CUISINE_META but not in test data, type system prevents errors but runtime may be incomplete.
- Current mitigation: Compile-time check + manual review. Acceptable.
- Fix approach: Optional - add compile-time assertion that all CuisineType keys appear in DEFAULT_RESTAURANTS.
- Priority: Low - type safety is strong

**No integration tests:**
- Issue: No tests verify full user flow: add restaurant → generate plan → reroll → remove restaurant.
- Files: All of src/
- Impact: Cannot detect regressions in cross-component interactions or context propagation.
- Fix approach: Add integration tests simulating user actions through RestaurantProvider lifecycle.
- Priority: Medium - would catch context/state bugs

## Security Considerations

**Client-side UUID generation:**
- Issue: Uses `crypto.randomUUID()` for restaurant IDs (line 97, RestaurantsPage).
- Files: `src/app/restaurants/page.tsx`
- Current mitigation: IDs are only used in client-side React keys and filtering. No backend API.
- Risk: Negligible for this app. If backend added, UUIDs must be server-generated to prevent collisions/spoofing.
- Recommendation: Acceptable for current scope. Document as "client-side only" if expanding to API.
- Priority: Low - not applicable to current architecture

**No XSS protection in dynamic color strings:**
- Issue: `CUISINE_META` colors are hardcoded hex values (line 11, types.ts) and applied directly to style prop (page.tsx line 69, restaurants page line 144).
- Files: `src/lib/types.ts`, `src/app/page.tsx`, `src/app/restaurants/page.tsx`
- Current mitigation: Colors are hardcoded constants, never user input. React escapes style values.
- Risk: Negligible. If colors become user-configurable, sanitize before applying.
- Priority: Low - architectural constraint prevents issue

## Missing Features (Not Bugs)

**No restaurant search/filter:**
- Current state: Restaurant list shows all entries, no search/filter by name or cuisine.
- Files: `src/app/restaurants/page.tsx`
- Impact: With 20+ restaurants, hard to find specific entry.
- Recommendation: Add search input above table, filter by name substring and cuisine type.
- Priority: Medium - UX improvement

**No edit functionality:**
- Current state: Can only add or delete restaurants, not modify existing entries.
- Files: `src/app/restaurants/page.tsx`
- Impact: If user enters wrong price, must delete and re-add. Loses ID and position in list.
- Recommendation: Add edit mode or inline editing for restaurant fields.
- Priority: Medium - UX improvement

**No budget templates:**
- Current state: Budget is free-form input. No preset options (e.g., "budget: 600", "splurge: 1000").
- Files: `src/app/page.tsx`
- Impact: User must calculate or remember preferred budgets.
- Recommendation: Add preset buttons or dropdown alongside numeric input.
- Priority: Low - nice-to-have

**No cuisine preference settings:**
- Current state: Algorithm enforces hard rule: "no 3+ consecutive same cuisine". Not configurable.
- Files: `src/lib/recommend.ts`
- Impact: Cannot adjust strictness or disable constraint for users who prefer variety.
- Recommendation: Add user preference toggle or slider to control diversity requirement.
- Priority: Low - advanced feature

## Performance Observations

**No performance issues detected:**
- Small dataset (default 13 restaurants): Recommendation algorithm completes instantly.
- No large renders: Restaurant list table is reasonable size.
- No memory leaks apparent: Context uses useState normally.
- Build size not analyzed but likely small (Next.js 16, minimal dependencies).
- Recommendation: Monitor if restaurant pool grows beyond 100 entries. Algorithm scales O(n*attempts) per plan generation.
- Priority: Not a concern - proactive note

## Browser Compatibility

**Uses modern APIs:**
- `crypto.randomUUID()` requires modern browser (Chrome 92+, Firefox 96+, Safari 16+, not IE11).
- Files: `src/app/restaurants/page.tsx`
- Impact: Not compatible with older browsers.
- Current mitigation: README states minimum supported browsers implicitly (Next.js 16 requirement).
- Recommendation: If legacy support needed, use UUID library instead. Otherwise acceptable.
- Priority: Low - noted for deployment documentation

## Build & Deployment

**No environment configuration:**
- Issue: No .env.example or build-time configuration. App is fully client-side.
- Files: None (intentional design)
- Impact: No secrets to configure. Deployment is simple (npm build, deploy dist).
- Current state: Acceptable for static app.
- Priority: Not applicable

**TypeScript strict mode enabled:**
- Current state: tsconfig.json has `"strict": true` (line 7).
- Impact: Good - prevents undefined, any, null coercion issues.
- Recommendation: Keep enabled. Code already complies.
- Priority: Not a concern - positive

---

*Concerns audit: 2026-02-18*
