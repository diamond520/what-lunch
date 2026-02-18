# Codebase Structure

**Analysis Date:** 2026-02-18

## Directory Layout

```
what-lunch/
├── public/                 # Static assets served directly
├── src/                    # Application source code
│   ├── App.vue            # Root component
│   ├── main.js            # Application entry point
│   ├── assets/            # Static images and media
│   │   └── logo.png
│   ├── components/        # Reusable Vue components
│   │   └── HelloWorld.vue
│   ├── router/            # Vue Router configuration
│   │   └── index.js
│   ├── store/             # Vuex state management
│   │   ├── index.js       # Store definition
│   │   ├── dishes.json    # Initial restaurant data
│   │   └── utils.js       # Utility functions
│   └── views/             # Page-level components
│       ├── Home.vue       # Main recommendation page
│       ├── Dishes.vue     # Menu management page
│       └── About.vue      # About page (unused)
├── .planning/             # GSD planning documents
├── .eslintrc.js           # ESLint configuration
├── babel.config.js        # Babel transpiler configuration
├── .browserslistrc        # Target browser versions
├── .gitignore            # Git ignore rules
├── package.json          # Project metadata and dependencies
└── yarn.lock             # Dependency lock file
```

## Directory Purposes

**public/:**
- Purpose: Static assets directly served by web server
- Contains: HTML entry point (index.html), favicon, static images
- Key files: public/index.html (not shown but implied)
- Build: Files copied to dist/ during build, no processing

**src/:**
- Purpose: All application source code
- Contains: Vue components, router, store, styles
- Key files: main.js (entry point), App.vue (root), views/ (pages)
- Build: Webpack processes and bundles everything

**src/assets/:**
- Purpose: Static media files bundled with app
- Contains: Images, fonts (referenced in components)
- Key files: `logo.png` (unused currently)
- Build: Webpack imports and hashes for cache busting

**src/components/:**
- Purpose: Reusable Vue components used across multiple views
- Contains: Single File Components (.vue)
- Key files: `HelloWorld.vue` (example/unused)
- Pattern: Components export objects, imported in views

**src/router/:**
- Purpose: Vue Router configuration and route definitions
- Contains: Route table, router instance setup
- Key files: `index.js` (single file, defines all routes)
- Routes defined:
  - `/` → Home.vue (eager load)
  - `/dishes` → Dishes.vue (lazy load with code splitting)

**src/store/:**
- Purpose: Vuex centralized state management
- Contains: Store definition, initial data, helpers
- Key files:
  - `index.js`: Vuex store with state, mutations, actions, getters
  - `dishes.json`: Initial 19 restaurant records
  - `utils.js`: UUID generation helper
- Pattern: Single store (no modules)

**src/views/:**
- Purpose: Page-level components corresponding to routes
- Contains: Full-page Vue components with business logic
- Key files:
  - `Home.vue`: Main interface, recommendation algorithm
  - `Dishes.vue`: Restaurant management (CRUD)
  - `About.vue`: Currently unused
- Pattern: Smart components that interact with store

**.planning/codebase/:**
- Purpose: GSD (Get Stuff Done) codebase documentation
- Contains: Architecture, structure, conventions analysis
- Key files: ARCHITECTURE.md, STRUCTURE.md, etc.
- Committed: Yes (for team reference)

## Key File Locations

**Entry Points:**
- `src/main.js`: Vue application bootstrap and global setup
- `src/App.vue`: Root component providing layout and router-view
- `public/index.html`: HTML container (not shown but implied)

**Configuration:**
- `package.json`: Dependencies, scripts, project metadata
- `.eslintrc.js`: Linting rules (Vue essentials + recommended)
- `babel.config.js`: ES6+ transpilation preset
- `.browserslistrc`: Target browser versions (>1% usage, last 2 versions)

**Core Logic:**
- `src/store/index.js`: Vuex store definition (state, mutations, actions)
- `src/views/Home.vue`: Recommendation algorithm and UI
- `src/views/Dishes.vue`: CRUD operations for restaurants

**State & Data:**
- `src/store/dishes.json`: Initial 19 restaurants
- `src/store/utils.js`: UUID generator

**Routing:**
- `src/router/index.js`: Route table and router setup

**Styling:**
- Scoped styles in each .vue file
- Element UI CSS from `node_modules/element-ui/lib/theme-chalk/index.css`
- Global normalize.css imported in main.js

## Naming Conventions

**Files:**
- Vue components: PascalCase (e.g., `Home.vue`, `Dishes.vue`, `HelloWorld.vue`)
- Utility files: camelCase (e.g., `utils.js`, `index.js`)
- Data files: camelCase (e.g., `dishes.json`)
- Config files: kebab-case with dot prefix (e.g., `.eslintrc.js`, `babel.config.js`)

**Directories:**
- Feature directories: lowercase plural (e.g., `components/`, `views/`, `router/`, `store/`, `assets/`)
- Hidden directories: dot prefix (e.g., `.git/`, `.planning/`)

**Vue Components:**
- Component names: PascalCase in code, kebab-case in templates (Vue convention)
- File names: Match component name (e.g., Home.vue exports component named Home)

**Variables & Functions:**
- camelCase (inferred from codebase style)
- Examples: `price`, `dishes`, `leftDishes`, `recommends`, `typeColor`, `recommend()`

**Constants:**
- Type codes: lowercase abbreviations (chi, jp, kr, tai, west)
- Cuisine labels: Chinese text stored in types object

## Where to Add New Code

**New Feature (e.g., favorite restaurants):**
- Primary code: `src/views/Favorites.vue` (new view)
- Store mutations/actions: Add to `src/store/index.js` (state, mutations, actions, getters)
- Router: Add route to `src/router/index.js`
- Tests: `src/views/Favorites.spec.js` (not yet present in repo)

**New Component (e.g., RestaurantCard):**
- Implementation: `src/components/RestaurantCard.vue`
- Import in view: Use in `src/views/Home.vue` or `src/views/Dishes.vue`
- Styling: Scoped styles in component file using `<style lang="scss" scoped>`

**New Utility (e.g., distance calculation):**
- Shared helpers: `src/store/utils.js` or `src/utils/` (new dir if multiple)
- Export as named function
- Import in store or components as needed

**New Global Filter (e.g., format price):**
- Register in: `src/main.js` via `Vue.filter()`
- Use in templates: `{{ value | filterName }}`

**Store Data (e.g., user preferences):**
- Add to state: `src/store/index.js` state object
- Add mutations: For state modifications
- Add getters: For computed access
- Add actions: For async operations (currently minimal)

## Special Directories

**node_modules/:**
- Purpose: Installed npm/yarn dependencies
- Generated: Yes (not committed, recreated via yarn install)
- Committed: No (.gitignore)

**dist/:**
- Purpose: Production build output
- Generated: Yes (via yarn build)
- Committed: No (.gitignore)

**.git/:**
- Purpose: Git version control metadata
- Generated: Yes
- Committed: N/A (git internal)

**.next/ (if upgraded to Next.js):**
- Purpose: Next.js build cache
- Generated: Yes
- Committed: No (.gitignore implied)

---

*Structure analysis: 2026-02-18*
