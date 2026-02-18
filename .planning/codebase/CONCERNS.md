# Codebase Concerns

**Analysis Date:** 2026-02-18

## Tech Debt

**Weak UUID Generation:**
- Issue: Uses weak client-side UUID via `Math.random().toString(36)` instead of proper UUID library
- Files: `src/store/utils.js`
- Impact: UUIDs may collide in rare cases; not cryptographically secure; doesn't follow UUID spec standards
- Fix approach: Replace with `uuid` npm package or similar standard implementation. Current implementation: `'_' + Math.random().toString(36).substr(2, 9)` generates only 9-char random strings

**Inconsistent Vuex Action Dispatch:**
- Issue: Action `getDishes` in store commits undefined mutation `setStation` instead of `setDishes`
- Files: `src/store/index.js` (line 40)
- Impact: getDishes action will fail silently without error. Feature is likely unused but creates brittle codebase.
- Fix approach: Either fix the action to commit correct mutation `setDishes`, or remove unused action entirely

**Type Constants Duplicated:**
- Issue: Cuisine type mappings (chi, jp, kr, tai, west) defined in three separate locations
- Files: `src/main.js` (lines 13-36), `src/store/index.js` (lines 9-15)
- Impact: Difficult to maintain; changes require updates in multiple places; risk of inconsistency
- Fix approach: Move type definitions to centralized config file (e.g., `src/config/types.js`) and import everywhere

**Unused Component:**
- Issue: HelloWorld component imported but never used
- Files: `src/views/Home.vue` (line 49, commented out line 55)
- Impact: Dead code creates confusion; slightly inflates bundle
- Fix approach: Remove import statement and any related code

**Hardcoded CSS and Colors:**
- Issue: Colors for cuisine types hardcoded in Vue filter function
- Files: `src/main.js` (lines 13-36)
- Impact: Difficult to theme or customize appearance; scattered across multiple files
- Fix approach: Extract to centralized theme/config file with type-to-color mapping

## Known Bugs

**Algorithm Logic Bug in Recommend Function:**
- Symptoms: The validation loop in `recommend()` method never executes correctly due to wrong condition
- Files: `src/views/Home.vue` (lines 114-121)
- Trigger: Call the recommend function to generate weekly lunch recommendations
- Issue: Condition `while(kind >= 2 && i >= 4)` is never true initially (kind starts at 0, i starts at 0). Loop never executes.
- Impact: Budget validation is skipped; recommendations may exceed budget constraints
- Workaround: Recommendation algorithm still works via fallback logic in `checkTotalPrice()` recursive algorithm
- Fix approach: Review intended validation logic and fix loop condition or remove dead code

**Incorrect Assignment Operator:**
- Symptoms: Variable assignment uses `=+` instead of `+=` in loop
- Files: `src/views/Home.vue` (line 120)
- Trigger: Loop iteration in recommend function
- Current code: `i =+ 1` (assigns positive 1 to i, always)
- Should be: `i += 1` (increments i)
- Impact: Loop counter not incrementing properly; validation logic may behave unexpectedly
- Fix approach: Change `i =+ 1` to `i += 1`

**Drawer Close Not Properly Implemented:**
- Symptoms: Cancel button in add restaurant form doesn't close drawer
- Files: `src/views/Dishes.vue` (line 84, method handleClose line 135-137)
- Issue: handleClose method receives done callback but doesn't call it when Cancel button clicked. Form also doesn't reset on cancel.
- Impact: User must submit or reload to close add restaurant drawer after clicking Cancel
- Workaround: Close by clicking outside drawer or submitting form
- Fix approach: Add @click handler to Cancel button that calls appropriate close method, or implement v-on:close properly

## Security Considerations

**No Input Validation on Numeric Fields:**
- Risk: Form inputs for price and distance accept string input without type coercion. Vuex state stores these as strings instead of numbers.
- Files: `src/views/Dishes.vue` (lines 73, 78), `src/store/index.js` (mutations)
- Current mitigation: Element-UI form validation requires fields but doesn't validate numeric type. String values are stored and compared as-is.
- Recommendations:
  - Add type coercion in form submit handler: convert price and distance to numbers before dispatch
  - Add min/max validation rules to form definition
  - Validate in Vuex mutations to ensure numbers are stored, not strings

**No CSRF Protection:**
- Risk: Application uses local state mutations without any request validation or tokens
- Files: All Vuex mutations (`src/store/index.js`)
- Current mitigation: Client-side only application with no backend API means CSRF not applicable currently
- Recommendations: When adding backend API, implement CSRF token validation

**Filter XSS Risk:**
- Risk: Vue filters output raw HTML strings without sanitization
- Files: `src/main.js` (lines 38-46) - typeText filter returns unsanitized strings
- Current mitigation: Filter returns static strings from types object, not user input
- Recommendations: If filters ever process user input, sanitize with DOMPurify or similar library

## Performance Bottlenecks

**Inefficient Recommendation Algorithm:**
- Problem: `nonRepeatSort()` uses recursive sorting with random shuffling until constraint met. No upper iteration limit.
- Files: `src/views/Home.vue` (lines 135-141)
- Cause: Algorithm can loop indefinitely if constraint cannot be met; uses `Math.random() - 0.5` for shuffle which is not proper Fisher-Yates
- Impact: UI can freeze if cannot find valid 5-restaurant selection without 3+ consecutive same-type restaurants
- Improvement path:
  - Add iteration counter limit (max 100 iterations) before falling back to greedy algorithm
  - Replace random shuffle with proper Fisher-Yates algorithm
  - Consider deterministic algorithm instead of random retry approach

**Recursive checkTotalPrice Without Depth Limit:**
- Problem: `checkTotalPrice()` recursively rebuilds recommendation array until price constraint met. No iteration limit.
- Files: `src/views/Home.vue` (lines 158-172)
- Cause: If valid combination doesn't exist, recursion continues until stack overflow
- Impact: May crash app if insufficient restaurants exist to meet budget
- Improvement path:
  - Add max recursion depth check with meaningful error message
  - Return early if `recommendDishes.length === 0` (no more options)
  - Pre-validate that sufficient restaurants exist before starting algorithm

**Unsorted Array Search:**
- Problem: `findIndex()` on array that should be sorted for binary search
- Files: `src/views/Home.vue` (line 90)
- Current approach: Linear search through `leftDishes` array, which is shuffled
- Improvement path: If leftDishes is frequently large, consider maintaining sorted index or using binary search

**Full Array Copy on Every Recommendation:**
- Problem: Multiple `.slice(0)` calls create unnecessary array copies in recommendation algorithm
- Files: `src/views/Home.vue` (lines 74-75, 126-127)
- Impact: Memory overhead for large dish lists
- Improvement path: Use references where mutation is handled, only copy when necessary

## Fragile Areas

**Recommendation Algorithm:**
- Files: `src/views/Home.vue` (lines 108-186)
- Why fragile:
  - Multiple interdependent validation constraints (price, type diversity, 5 restaurants)
  - Complex recursive logic with side effects
  - No clear contract on what constitutes valid recommendation
  - Loop conditions have bugs (lines 114, 120)
  - Algorithm can fail silently or hang indefinitely
- Safe modification:
  - Add unit tests for each validation constraint separately
  - Create pure helper functions for constraint checking
  - Add comprehensive inline comments explaining algorithm flow
  - Test with edge cases: budget too low, insufficient restaurants, all same type
- Test coverage: No test files found; recommendation algorithm is completely untested

**Vuex Store Structure:**
- Files: `src/store/index.js`
- Why fragile:
  - Bidirectional mutation between recommends and leftDishes maintained manually
  - No validation of mutation arguments; can corrupt state
  - Action `getDishes` commits undefined mutation
  - State structure tightly coupled to component logic
- Safe modification:
  - Add state validation in mutations (check types, required fields)
  - Create computed getters that derive leftDishes from dishes instead of maintaining separate state
  - Write tests for state mutations to prevent regressions
- Test coverage: No tests exist for Vuex store

**Type System and Data Integrity:**
- Files: `src/store/index.js`, `src/main.js`, throughout codebase
- Why fragile:
  - No TypeScript or prop validation; all data types are assumptions
  - type codes (chi, jp, kr, etc.) used as magic strings throughout codebase
  - Form inputs produce strings but algorithm expects numbers
  - No validation when dishes added to ensure all required fields present
- Safe modification:
  - Migrate to TypeScript for type safety
  - Create enum or constants file for type codes
  - Add runtime validation in Vuex mutations
  - Add JSDoc type annotations at minimum
- Test coverage: No validation tests

## Scaling Limits

**In-Memory Dish Storage:**
- Current capacity: Loads entire dishes.json (~20 restaurants shown in sample) into Vuex state
- Limit: As dish list grows to hundreds or thousands, recommendation algorithm O(n²) complexity becomes slow
- Files: `src/store/index.js` (line 16), `src/views/Home.vue` (recommendation algorithm)
- Scaling path:
  - Move to backend API with pagination/filtering
  - Implement server-side recommendation algorithm
  - Cache filtered results client-side with invalidation strategy
  - Consider database-backed filtering (e.g., by budget, type, distance)

**Recommendation Algorithm Complexity:**
- Current capacity: Works with 5-restaurant selections from ~20 total restaurants
- Limit: Algorithm performance degrades exponentially with larger pools due to random retry approach
- Scaling path:
  - Replace random retry with deterministic constraint satisfaction solver
  - Implement greedy algorithm with quality trade-off options
  - Add parameters to control algorithm complexity (e.g., time limit, quality threshold)

## Dependencies at Risk

**Vue 2 End of Life:**
- Risk: Vue 2 reached end of life in September 2023. No security updates. All major projects have migrated to Vue 3.
- Current version: `vue@^2.6.11`
- Files: `package.json`, entire codebase
- Impact: Security vulnerabilities in Vue core or dependencies won't be patched. New dependencies may drop Vue 2 support.
- Migration plan:
  - Upgrade to Vue 3 (breaking changes, requires significant refactoring)
  - OR stay on Vue 2 with understanding of security risks
  - Prioritize if security is concern or if adding dependencies
  - Consider alternative: migrate to modern framework (React, Svelte, etc.)

**Element UI Deprecated:**
- Risk: Element UI is largely deprecated in favor of Element Plus (Vue 3 version) and other modern UI libraries
- Current version: `element-ui@^2.13.0`
- Impact: No active maintenance; new issues won't be fixed; components may have accessibility issues
- Migration plan:
  - If staying on Vue 2: consider switching to Element Plus Fork or similar maintained component library
  - If migrating to Vue 3: migrate to Element Plus directly
  - Build custom components as alternative

**Outdated Node Ecosystem:**
- Risk: Dependencies use very old babel and webpack versions from 2020
- Examples: `node-sass@^4.12.0` (deprecated), `babel-eslint` (deprecated in favor of `@babel/eslint-parser`)
- Impact: Security vulnerabilities in build tools; poor performance; missing modern features
- Migration plan:
  - Upgrade build pipeline to modern versions
  - Use `vue-cli@^5.0` or Vite instead of Vue CLI 4.2
  - Replace `node-sass` with `sass` npm package
  - Update all babel dependencies

**No Lockfile Commitment:**
- Risk: `yarn.lock` exists but may be outdated; no guarantee reproducible builds
- Current mitigation: Lockfile committed to git
- Recommendations:
  - Use `yarn install --frozen-lockfile` in CI to ensure reproducibility
  - Regularly audit and update dependencies with `yarn audit fix`
  - Consider using renovate or dependabot for automated updates (already has dependabot PRs in git history)

## Test Coverage Gaps

**Entire Application Untested:**
- What's not tested: No test files found in codebase
- Impact: Cannot catch regressions; algorithms cannot be verified; refactoring is high-risk
- Priority: HIGH - at minimum, critical recommendation algorithm needs unit tests

**Recommendation Algorithm No Tests:**
- What's not tested: Core business logic in `recommend()`, `nonRepeatSort()`, `checkTotalPrice()`, `findMaxRepeat()`, `dishesArraySum()`
- Files: `src/views/Home.vue` (lines 108-186)
- Risk: Algorithm bugs not caught (bugs #1, #2 above exist because untested). Refactoring impossible. Edge cases unknown.
- Recommended test cases:
  - Valid case: budget met, diverse types
  - Budget too low: no valid recommendation possible
  - Insufficient restaurants: cannot fill 5 slots
  - All same type: budget met but type constraint fails
  - Empty dish list: graceful error handling
  - Boundary: budget exactly equals minimum cost

**Vuex Store No Tests:**
- What's not tested: State mutations, actions, getters
- Files: `src/store/index.js`
- Risk: Cannot verify state remains consistent. Mutations with side effects untested. Can break silently.
- Recommended test cases:
  - addDish creates new dish with UUID and all fields
  - deleteDish removes correct dish by ID
  - setRecommend replaces recommendations
  - setLeftDishes replaces left dishes
  - getDishes action works or fails appropriately

**Component Rendering No Tests:**
- What's not tested: Vue component lifecycle, event handlers, form validation
- Files: `src/views/Home.vue`, `src/views/Dishes.vue`
- Risk: UI changes can break without detection. Form validation ineffective. Event handlers may fail.
- Coverage needed: At least smoke tests for form submission, recommendation button clicks, table operations

**Type Conversion No Tests:**
- What's not tested: Numeric form inputs and type coercion
- Risk: Bugs in type handling won't be caught. Security issue (input validation) untested.
- Priority: MEDIUM - should add tests when form validation improvements made

---

*Concerns audit: 2026-02-18*
