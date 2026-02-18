# Domain Pitfalls

**Domain:** Vue 2 to Next.js rewrite — lunch randomizer utility app
**Researched:** 2026-02-18

---

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

---

### Pitfall 1: Porting the Algorithm Bug Instead of Fixing It

**What goes wrong:** The existing `recommend()` algorithm has two confirmed bugs: the `while(kind >= 2 && i >= 4)` loop never executes (both `kind` and `i` start at 0, so the condition is immediately false), and `i =+ 1` (assigns 1, not increments) ensures the loop would never advance even if entered. Developers porting Vue code to React often translate logic mechanically, carrying bugs across without noticing. The rewrite looks clean, tests pass if the bugs are invisible, and then budget validation silently doesn't work.

**Why it happens:** Rewrite pressure creates a bias toward "make it work the same way as before." Bugs in original code are assumed to be features or edge cases.

**Consequences:**
- Budget validation is non-functional in the new app — users can get recommendations that exceed their weekly budget
- The app "works" (produces results) but produces incorrect results silently
- No test coverage on the old code means the bug is invisible until a user notices

**Prevention:**
- Treat the algorithm as a specification problem, not a translation problem
- Write the recommendation algorithm from scratch using the documented intent, not the existing code
- Before writing new code, document what the algorithm is *supposed* to do: select 5 restaurants, total price ≤ budget, at least 2 cuisine types, max 2 consecutive same type
- Add unit tests for each constraint individually before writing the implementation

**Detection:**
- Budget slider at low value (e.g. 200) still produces 5 restaurants — that's the bug firing
- Recommendation total price exceeds the set budget

**Phase to address:** Algorithm implementation phase — establish contract (tests) before writing code.

---

### Pitfall 2: Using Next.js App Router as an SPA but Getting the Server/Client Boundary Wrong

**What goes wrong:** This app is entirely client-side interactive — no database, no server data fetching. A developer new to App Router defaults every component to Server Components (the default) but then adds `useState`, `onClick`, or context that requires client components. The result is runtime errors: "You're importing a component that needs useState. It only works in a Client Component but none of its parents are marked with 'use client'."

The opposite mistake also occurs: slapping `'use client'` on the root layout or every component as a blanket fix. This defeats the purpose of the App Router and puts unnecessary JavaScript in the bundle.

**Why it happens:** App Router's default is Server Components, which is the opposite of what developers expect from a Vue SPA. The mental model shift is not obvious. Vue components are always client-rendered; Next.js App Router components are server-rendered by default.

**Consequences:**
- Runtime crashes at development time (best case) or production (worst case)
- Hydration errors that are hard to debug
- Over-broad `'use client'` placement bloats the JS bundle unnecessarily
- Context providers (equivalent of Vuex store) fail unless wrapped in `'use client'`

**Prevention:**
- For this app: mark the root provider or top-level interactive component with `'use client'` and let the boundary propagate downward
- Decision rule: if a component uses `useState`, `useEffect`, `onClick`, `onChange`, or browser APIs — it must be a Client Component
- Wrap context providers (React state store) in a dedicated `'use client'` file — never put them in Server Components
- Keep `app/layout.tsx` and `app/page.tsx` as Server Components; import a `<ClientProviders>` wrapper inside them

**Detection:**
- "Error: You're importing a component that needs useState" error in dev server
- Hydration mismatch warnings in browser console
- Interactive elements that don't respond to clicks

**Phase to address:** Project setup / architecture phase — establish component boundary rules before writing any components.

---

### Pitfall 3: Carrying Vuex's Dual-State Pattern (recommends + leftDishes) Into React Incorrectly

**What goes wrong:** The existing Vuex store maintains two synchronized arrays: `recommends` (the 5 selected dishes) and `leftDishes` (the pool of remaining dishes available for swap). These are manually kept in sync by dispatching two separate mutations. This is already fragile in Vue. In React, developers often port this as two separate `useState` calls and then encounter state update ordering issues: updating one state triggers a render before the other is updated, causing a flash of inconsistent UI or a stale closure bug in the swap logic.

**Why it happens:** Vue's Vuex encourages stateful mutation patterns. React's `useState` has asynchronous batching semantics. The mental model is different: in React, related state that must stay in sync should be in a single state update or managed by a reducer.

**Consequences:**
- Swap function (`recommendSingle`) reads stale `leftDishes` after updating `recommends`
- Race condition: a rapid double-click on the swap button can cause inconsistent state
- Silently incorrect recommendations (wrong dish appears) with no error thrown

**Prevention:**
- Model `recommends` and `leftDishes` as a single state object: `{ recommends: [], leftDishes: [] }`
- Use `useReducer` instead of two `useState` calls — the reducer handles the atomic swap in one dispatch
- Alternatively, use a single `useState` with an object and update both fields in one `setState` call
- Never derive `leftDishes` from a separate calculation if it depends on the same pool — compute it from the dishes array and recommends together

**Detection:**
- Rapid clicking on swap button produces duplicate dishes in recommendations
- Swap function uses `leftDishes` that doesn't reflect the just-completed recommendation update

**Phase to address:** State management design phase — before writing any store/context code.

---

### Pitfall 4: Infinite Loop Risk from Unbounded Recursive Algorithm

**What goes wrong:** The existing `checkTotalPrice()` and `nonRepeatSort()` are unbounded recursive functions. `nonRepeatSort` reshuffles randomly until the constraint is satisfied — with no iteration limit. If the restaurant list is small or all restaurants are the same cuisine type, these functions loop indefinitely, freezing the browser tab. This is a latent bug in the original. The rewrite is the opportunity to fix it, but if the algorithm is ported as-is, the same crash risk exists in the new Next.js app.

**Why it happens:** The algorithm was written without edge case analysis. The rewrite context creates pressure to "preserve behavior," which preserves the bug.

**Consequences:**
- Browser tab freeze when constraint cannot be satisfied (e.g., all restaurants are Chinese cuisine, no-repeat constraint can never be met for 5 days)
- No user-visible error — just a frozen UI
- React's concurrency model does not protect against synchronous infinite loops

**Prevention:**
- Add a max-iterations guard to `nonRepeatSort`: after N attempts (e.g., 100), return the best available result or throw a handled error
- Add a termination condition to `checkTotalPrice`: if `allDishes` is empty and constraints are still not met, return an error state instead of recursing
- Pre-validate before calling the algorithm: check that the minimum possible cost (cheapest 5 dishes) is ≤ budget; if not, show an error immediately
- Replace `Math.random() - 0.5` shuffle with Fisher-Yates for correctness

**Detection:**
- Test with a restaurant list containing only one cuisine type
- Test with budget set below the cost of the 5 cheapest restaurants
- Browser console will show "Maximum call stack size exceeded" for the recursion case

**Phase to address:** Algorithm implementation phase — fix before porting, not after.

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt.

---

### Pitfall 5: Replacing Vuex with a State Management Library That's Too Heavy

**What goes wrong:** Developers migrating from Vuex reach for Redux or Zustand as the "React equivalent of Vuex." For this app — two pages, in-memory data, no server state — the overhead of Redux (actions, reducers, selectors, middleware) is far more than the problem requires. The rewrite takes longer than the original app warranted, and the result is harder to understand.

**Why it happens:** Framework switching creates uncertainty. Developers over-engineer to feel safe. Vuex is global and explicit; React's built-in tools are underestimated.

**Consequences:**
- 2-3x more boilerplate than necessary
- New contributors struggle to understand why a lunch picker needs Redux middleware
- Library version pinning becomes a maintenance burden

**Prevention:**
- Use React's built-in `useContext` + `useReducer` for this app's scale
- State is small (a list of ~20 restaurants, 5 recommendations, one budget number) — no library is justified
- If state management feels complex, the problem is the data model, not the missing library

**Detection:** Warning sign — if you're writing `createSlice`, `configureStore`, or `createSelector` for a lunch picker, step back and question the complexity.

**Phase to address:** Architecture phase — decide before writing any code.

---

### Pitfall 6: Replicating Vue Filters as Utility Functions in the Wrong Place

**What goes wrong:** Vue 2 global filters (`typeColor`, `typeText`) map cuisine type codes (`chi`, `jp`, `kr`, `tai`, `west`) to display labels and colors. There's no equivalent in React. Developers recreate these as utility functions but scatter them into components. The type constants (already duplicated in 3 places in the old codebase) get duplicated again. Later, adding a cuisine type requires hunting down every copy.

**Why it happens:** Vue filters are "just available" globally. React has no equivalent, so the replacement is unclear. Under rewrite time pressure, the quick fix is to copy the mapping into whatever component needs it.

**Consequences:**
- Cuisine type constants become duplicated again in the new codebase, repeating the old tech debt
- Adding a new cuisine type (e.g., `thai`) requires changes in multiple files
- Hardcoded colors become impossible to theme

**Prevention:**
- Create a single `lib/restaurant-types.ts` (or similar) on day one of the rewrite
- Export all cuisine type constants, labels, and color mappings from this single file
- Import everywhere — never hardcode type strings or colors inline
- Consider making the type data the source of truth for filtering UI as well

**Detection:** Warning sign — if you see `'chi'`, `'jp'`, `'kr'`, `'tai'`, or `'west'` as string literals anywhere outside of `restaurant-types.ts`, that's a duplication starting.

**Phase to address:** Data model phase — establish constants before writing any components.

---

### Pitfall 7: Over-Relying on `'use client'` Everywhere to Avoid Thinking About Boundaries

**What goes wrong:** Faced with App Router's Server/Client distinction, the path of least resistance is to mark every file with `'use client'`. The app "works" but this eliminates the benefits of the App Router: larger JS bundle, no static pre-rendering, slower initial load.

**Why it happens:** `'use client'` is a quick fix for confusing errors. The mental overhead of the server/client boundary is real, especially for a team coming from a purely client-side Vue app.

**Consequences:**
- Unnecessary JavaScript shipped to the browser
- Miss the opportunity for static pre-rendering of non-interactive content
- Harder to identify which components actually need interactivity

**Prevention:**
- For this app, identify exactly which components use state or browser events: the budget input, the recommend button, the restaurant form, the swap button — these are Client Components
- Static shell (layout, nav, page structure) stays as Server Components
- This is a simple app — the boundary is not complicated: interactive UI = Client, everything else = Server

**Detection:** If you have `'use client'` in `app/layout.tsx` or on a component that contains no `useState`, `useEffect`, or event handlers, it's over-applied.

**Phase to address:** Architecture phase, then audited again after first working build.

---

### Pitfall 8: Carrying Over Form Validation Anti-Patterns from Element UI

**What goes wrong:** The existing form (add restaurant) uses Element UI's built-in validation. The form accepts price and distance as strings (HTML inputs return strings) but the algorithm requires numbers. In the old code, type coercion is missing: `state.dishes.push({...data})` stores strings, not numbers, causing silent comparison bugs (`"100" <= 500` is true, `"1000" <= 500` is also true due to string comparison... actually this is numeric comparison since `<=` coerces, but `"1000" + 200 === "1000200"` via string concatenation if the form data flows into the wrong operator).

If this is ported without fixing, the new Next.js app inherits the same class of bugs.

**Why it happens:** UI library form validation handles format but not type coercion. Developers assume "the form validates" means "the data is correct."

**Consequences:**
- Budget arithmetic produces wrong results (string concatenation instead of addition)
- Price comparisons silently work in some cases (due to JS coercion with `<=`) but break in others
- No TypeScript types on the dish object means the bug is invisible at compile time

**Prevention:**
- Define a TypeScript interface for `Restaurant` with `price: number` and `distance: number`
- Parse form values with `parseInt()` or `parseFloat()` in the submit handler before storing
- TypeScript will catch downstream code that receives a string where a number is expected
- Add a unit test: "adding a restaurant via form should store numeric price"

**Detection:** Warning sign — if the form `onChange` stores `e.target.value` directly (a string) into state that feeds the algorithm, the bug exists.

**Phase to address:** Restaurant management feature phase, and TypeScript setup phase.

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

---

### Pitfall 9: File-System Router Confusion — Where Do Pages Go?

**What goes wrong:** Developers coming from Vue Router (explicit route config file) are surprised that Next.js App Router derives routes from the file system. A file placed in `app/dishes/page.tsx` automatically becomes `/dishes`. But placing a component file in `app/dishes/RestaurantCard.tsx` does NOT create a `/dishes/RestaurantCard` route — it's just a file. The confusion appears when developers place component files in the app directory that accidentally get treated as routes, or when they can't figure out why a component doesn't show up.

**Why it happens:** Vue Router requires explicit declaration of every route. Next.js makes routes implicit from directory structure. The mental model is the opposite.

**Prevention:**
- Keep non-page components in `components/` or `lib/` directories outside the `app/` directory
- Only `page.tsx`, `layout.tsx`, `loading.tsx`, and `error.tsx` files are special inside `app/` directories
- Two routes: `app/page.tsx` (recommend page, `/`) and `app/dishes/page.tsx` (restaurant list, `/dishes`)

**Detection:** Error: "Module not found" when importing a component that accidentally got named `page.tsx`, or a 404 for a page that definitely exists.

**Phase to address:** Project setup phase.

---

### Pitfall 10: `Math.random()` Behavior Difference Between Server and Client

**What goes wrong:** The recommendation algorithm uses `Math.random()` extensively for shuffling. If any part of the algorithm runs during server-side rendering (e.g., in a Server Component), the random values are generated on the server and then sent to the client as HTML. When React hydrates, it re-runs the component logic with different random values — causing a hydration mismatch warning. The UI may flash or produce a React error.

**Why it happens:** In Vue SPA, there is no SSR, so randomness is always client-side. In Next.js, Server Components render on the server. If algorithm code runs in a Server Component, randomness mismatches occur.

**Prevention:**
- Keep all recommendation algorithm code inside Client Components
- The entire Home page (budget input, recommend button, results display) should be a Client Component or nested inside one
- Algorithm logic should be in `lib/algorithm.ts` and only called from Client Components

**Detection:** React hydration mismatch error in browser console: "Warning: Text content did not match."

**Phase to address:** Algorithm implementation phase — ensure algorithm is wired to a Client Component.

---

### Pitfall 11: UUID Generation for New Restaurants

**What goes wrong:** The existing code uses `'_' + Math.random().toString(36).substr(2, 9)` — a 9-character random string that is not a UUID. For this app (in-memory, single-user), collisions are rare but possible. In the rewrite, developers sometimes copy this weak implementation or switch to `crypto.randomUUID()` without realizing it is a browser API that errors in Node/server context.

**Prevention:**
- Use `crypto.randomUUID()` from the browser's Web Crypto API — available in all modern browsers
- Call it only in Client Components (where browser APIs are available)
- If TypeScript complains, ensure `lib: ["DOM"]` is in `tsconfig.json`
- Do not call `crypto.randomUUID()` in Server Components or Node.js contexts where it is not available

**Detection:** "TypeError: crypto.randomUUID is not a function" error if called server-side.

**Phase to address:** Restaurant management feature phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Project setup | File-system routing confusion (Pitfall 9) | Establish `app/` vs `components/` directory convention on day one |
| Architecture / state design | Over-heavy state management (Pitfall 5), broad `'use client'` (Pitfall 7) | Decide on `useReducer` + context before writing any components |
| Data model | Cuisine type constant duplication (Pitfall 6) | Create `lib/restaurant-types.ts` before any component touches type data |
| Algorithm port | Porting existing bugs (Pitfall 1), infinite loop (Pitfall 4), SSR randomness mismatch (Pitfall 10) | Write algorithm as pure functions with unit tests before wiring to UI |
| State integration | Dual-state sync issues (Pitfall 3) | Use single `useReducer` for `recommends` + `leftDishes` together |
| Restaurant form | Form type coercion bugs (Pitfall 8), UUID server-side error (Pitfall 11) | TypeScript interface + explicit parsing in submit handler |
| Component build | Server/Client boundary errors (Pitfall 2), over-broad `'use client'` (Pitfall 7) | Audit boundary on every new component |

---

## Sources

- Next.js official docs — Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components (verified 2026-02-16, HIGH confidence)
- Next.js official docs — Migrating from Vite: https://nextjs.org/docs/app/building-your-application/upgrading/from-vite (verified 2026-02-16, HIGH confidence)
- Next.js official docs — page.js file convention: https://nextjs.org/docs/app/api-reference/file-conventions/page (verified 2026-02-16, HIGH confidence)
- React official docs — Thinking in React: https://react.dev/learn/thinking-in-react (HIGH confidence)
- Existing codebase analysis: `.planning/codebase/CONCERNS.md` — confirmed algorithm bugs and data model issues (HIGH confidence, first-hand code review)
- Existing codebase: `src/views/Home.vue`, `src/store/index.js` — direct source code inspection (HIGH confidence)
