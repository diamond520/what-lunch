# Architecture

**Analysis Date:** 2026-02-18

## Pattern Overview

**Overall:** Vue.js Single Page Application (SPA) with Vuex state management

**Key Characteristics:**
- Component-based UI architecture with Vue 2.6
- Centralized state management via Vuex store
- Client-side routing with Vue Router
- Element UI component library for UI elements
- Local data persistence via JSON store file

## Layers

**Presentation Layer:**
- Purpose: Render UI and handle user interactions
- Location: `src/App.vue`, `src/views/`, `src/components/`
- Contains: Vue Single File Components (.vue files)
- Depends on: Vuex store, Vue Router
- Used by: End users via browser

**View Layer:**
- Purpose: Page-level components for specific features
- Location: `src/views/Home.vue`, `src/views/Dishes.vue`
- Contains: Full-page components with business logic
- Depends on: Vuex store via mapGetters/mapActions, Element UI components
- Used by: Router for page navigation

**Component Layer:**
- Purpose: Reusable UI components
- Location: `src/components/HelloWorld.vue`
- Contains: Presentational components (currently minimal)
- Depends on: Vue, Element UI
- Used by: Views and other components

**State Management Layer:**
- Purpose: Centralize application state and mutations
- Location: `src/store/index.js`
- Contains: Vuex store with state, mutations, actions, getters
- Depends on: `src/store/dishes.json`, `src/store/utils.js`
- Used by: All Vue components via this.$store

**Router Layer:**
- Purpose: Client-side navigation and route management
- Location: `src/router/index.js`
- Contains: Route definitions and configuration
- Depends on: Vue Router, view components
- Used by: App.vue root component

**Entry Point:**
- Purpose: Bootstrap the Vue application
- Location: `src/main.js`
- Contains: Vue instance initialization, filters, plugins

## Data Flow

**Application Initialization:**

1. Browser loads index.html
2. `src/main.js` executes, initializes Vue instance
3. Global filters registered (typeColor, typeText)
4. Element UI plugin installed
5. Vuex store and Vue Router configured
6. App.vue root component renders

**User Recommendation Flow:**

1. User on Home.vue enters weekly budget amount
2. User clicks "一鍵推薦" (one-click recommend) button
3. `recommend()` method executes algorithm
4. Algorithm selects 5 random dishes, checks constraints:
   - Total price ≤ budget
   - At least 2 different cuisine types
   - Max consecutive same type ≤ 2 days
5. Results dispatch via `setRecommend` action to Vuex
6. Template re-renders with new recommendations
7. Remaining dishes stored in `leftDishes` for single dish swaps

**Single Dish Swap Flow:**

1. User clicks refresh icon on specific day card
2. `recommendSingle(index)` calculates remaining budget
3. Finds next available dish from `leftDishes`
4. Validates no excessive type repetition via `findMaxRepeat()`
5. Dispatches `setRecommend` and `setLeftDishes` mutations
6. Component template updates

**Menu Management Flow:**

1. User navigates to Dishes.vue
2. Table displays all dishes from store getter `dishes`
3. User clicks "新增餐廳" (add restaurant) button
4. Modal drawer opens with form
5. User completes form validation and submits
6. `addDish` action dispatches `addDish` mutation
7. New dish added with generated UUID
8. Form resets, drawer closes
9. Table re-renders with new dish
10. User can delete via deleteRow → `deleteDish` action

**State Management:**

- Single source of truth: `src/store/index.js` state object
- Initial data: `src/store/dishes.json` loaded on store init
- Mutations modify state synchronously
- Actions commit mutations (some currently unused)
- Getters provide computed access to state (e.g., dishes sorted by price)
- Components subscribe via mapGetters/mapActions or direct dispatch

## Key Abstractions

**Vuex Store State:**
- Purpose: Centralized application data
- Location: `src/store/index.js`
- State properties:
  - `types`: Map of cuisine type codes to Chinese labels
  - `dishes`: Array of all restaurant objects
  - `recommends`: Array of 5 selected dishes for the week
  - `leftDishes`: Array of remaining dishes available for swaps
- Pattern: Single store instance, no modules

**Restaurant/Dish Object:**
- Purpose: Represents a restaurant menu item
- Structure:
  ```javascript
  {
    id: string (UUID)
    name: string
    distance: number (meters)
    type: string (chi, jp, kr, tai, west)
    price: number (dollars)
  }
  ```
- Examples: `src/store/dishes.json` contains 19 example restaurants

**Recommendation Algorithm:**
- Purpose: Select optimal weekly meal plan within budget
- Location: `src/views/Home.vue` methods
- Key methods:
  - `recommend()`: Main algorithm entry point
  - `checkTotalPrice()`: Recursive validation of budget + type diversity
  - `nonRepeatSort()`: Ensures no more than 2 consecutive same cuisine type
  - `findMaxRepeat()`: Calculates max consecutive type count
  - `dishesArraySum()`: Sums price and counts distinct cuisine types
- Pattern: Randomized selection with constraint validation

**Vue Filters:**
- Purpose: Format data for display
- Location: `src/main.js`
- Filters:
  - `typeColor`: Maps cuisine codes to color hex values
  - `typeText`: Maps cuisine codes to Chinese labels
- Usage: In templates with pipe syntax `{{ value | typeColor }}`

## Entry Points

**main.js:**
- Location: `src/main.js`
- Triggers: Application startup
- Responsibilities:
  - Import and register global dependencies (Vue, Vuex, Router, Element UI)
  - Define global filters for cuisine type formatting
  - Create root Vue instance
  - Mount to DOM element #app

**App.vue:**
- Location: `src/App.vue`
- Triggers: After main.js mounts Vue instance
- Responsibilities:
  - Render root layout (header, main container)
  - Provide header navigation links
  - Render router-view for page content

**Router:**
- Location: `src/router/index.js`
- Triggers: Route changes via navigation
- Responsibilities:
  - Define routes (/ → Home, /dishes → Dishes)
  - Lazy-load Dishes.vue component
  - Enable HTML5 history mode navigation

## Error Handling

**Strategy:** Graceful degradation with user feedback via Element UI toast messages

**Patterns:**
- Message boxes for constraint violations (e.g., "找不到符合條件的餐廳" - restaurant not found)
- Console logging for form validation errors in dev
- Silent fallbacks (e.g., recommend() returns without action if conditions unmet)

## Cross-Cutting Concerns

**Logging:** Console logs in Home.vue methods (commented out in production code)

**Validation:**
- Form validation in Dishes.vue via Element UI form rules
- Business logic validation in recommendation algorithm via constraint checks

**Authentication:** Not implemented (client-side app)

**Styling:**
- SCSS via vue-loader (scoped styles per component)
- Element UI CSS imported in main.js
- Normalize.css for cross-browser consistency

---

*Architecture analysis: 2026-02-18*
