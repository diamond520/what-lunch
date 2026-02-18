# Coding Conventions

**Analysis Date:** 2026-02-18

## Naming Patterns

**Files:**
- Vue Single File Components: PascalCase (e.g., `Home.vue`, `Dishes.vue`, `HelloWorld.vue`)
- JavaScript modules: camelCase (e.g., `utils.js`, `index.js`)
- Data files: lowercase with hyphens (e.g., `dishes.json`)

**Functions:**
- camelCase for all function names (e.g., `openAddDishDrawer`, `recommendSingle`, `handleChange`)
- Methods in components follow camelCase convention
- Vuex action/mutation names: camelCase (e.g., `setDishes`, `addDish`, `deleteDish`)

**Variables:**
- camelCase for all variable names (e.g., `price`, `recommends`, `leftDishes`, `drawer`)
- State properties: camelCase (e.g., `types`, `dishes`, `recommends`, `leftDishes`)

**Types:**
- Component names: PascalCase (e.g., `Home`, `Dishes`, `HelloWorld`)
- Vuex store modules: camelCase filename mapping

## Code Style

**Formatting:**
- No explicit formatter configured (relies on ESLint defaults)
- Indentation: 2 spaces (Vue CLI default)
- No semicolons at end of statements (modern Vue convention)
- Template tags use double quotes for attributes

**Linting:**
- ESLint v6.7.2 with vue-eslint-plugin v6.1.2
- Config file: `.eslintrc.js`
- Rules enforced: `plugin:vue/essential` + `eslint:recommended`
- Console statements: allowed in development, error in production
- Debugger statements: allowed in development, error in production

**Key ESLint Settings:**
```javascript
// From .eslintrc.js
'extends': [
  'plugin:vue/essential',
  'eslint:recommended'
],
'rules': {
  'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
}
```

## Import Organization

**Order:**
1. Vue framework imports (e.g., `import Vue from 'vue'`)
2. Third-party libraries (e.g., `import VueRouter from 'vue-router'`)
3. Local module imports (e.g., `import Home from '../views/Home.vue'`)
4. Relative imports from project (e.g., `import { uuid } from './utils'`)

**Path Aliases:**
- Use `@/` prefix for imports from src root: `import Home from '@/components/HelloWorld.vue'`
- Relative paths with `../` are used throughout (e.g., `import Home from '../views/Home.vue'`)

**Example Import Pattern:**
```javascript
import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import { mapGetters } from 'vuex'
import { uuid } from './utils'
```

## Error Handling

**Patterns:**
- Vue message API: `this.$message()` for user-facing errors (see `Home.vue:84-87`)
- Form validation: ElementUI's form validator with rules object (see `Dishes.vue:104-117`)
- Console logging for debug errors: `console.log('error submit!!')` (see `Dishes.vue:146`)
- Conditional returns on validation failure: `return false` after invalid form submission (see `Dishes.vue:147`)

**Example Error Handling:**
```javascript
// User-facing message
this.$message({
  message: '找不到符合條件的餐廳',
  type: 'warning'
})

// Form validation
this.$refs['form'].validate((valid) => {
  if (valid) {
    // process
  } else {
    console.log('error submit!!')
    return false
  }
})
```

## Logging

**Framework:** Native `console` object

**Patterns:**
- Debug logs commented out: `// console.log(index, this.recommends)` (see `Home.vue:73`)
- Error logs use plain console.log: `console.log('error submit!!')` (see `Dishes.vue:146`)
- No structured logging framework in use
- Console statements are linted (off in dev, error in production)

## Comments

**When to Comment:**
- Route-level code-splitting comments: explaining webpack behavior (see `router/index.js:16-18`)
- TODO implicit in commented-out code (see `Home.vue:42`)

**JSDoc/TSDoc:**
- Not used throughout the codebase

## Function Design

**Size:** Functions range from single-line filters to 30+ line methods with complex logic
  - Example single-line: `uuid()` in `store/utils.js`
  - Example complex: `checkTotalPrice()` in `Home.vue` with nested recursion and array manipulations

**Parameters:**
- Methods accept parameters directly (e.g., `recommendSingle(index)`)
- Vuex actions use destructuring: `({ commit }, { data })` pattern
- Filter functions accept single value parameter: `function(value) { ... }`

**Return Values:**
- Void methods used for mutations (no explicit return)
- Value-returning methods return computed results (e.g., `dishesArraySum()` returns `{sum, kind}`)
- Getters return transformed state: `dishes: state => state.dishes.sort(...)`
- Early returns on validation failure: `if(targetIndex < 0) { ... return }`

## Module Design

**Exports:**
- Vue: Export default component object (all .vue files)
- JavaScript: Export named functions (e.g., `export const uuid = function() { ... }`)
- Store: Export default Vuex Store instance
- Router: Export default Vue Router instance

**Barrel Files:**
- Not used in this codebase
- Each module exports directly

## Vue-Specific Conventions

**Component Structure:**
```vue
<template>
  <!-- HTML template -->
</template>

<script>
export default {
  name: 'ComponentName',
  components: { ... },
  data() { return { ... } },
  computed: { ... },
  methods: { ... }
}
</script>

<style lang="scss" scoped>
/* Scoped styles */
</style>
```

**Data Flow:**
- Template → computed properties (mapGetters) → methods → Vuex dispatch
- Mutations directly mutate state: `state.dishes.push()`, `state.dishes.splice()`
- Actions dispatch mutations via commit: `commit('setDishes', data)`

**Filter Registration:**
- Global filters registered in `main.js`
- Filters follow pattern: `Vue.filter("filterName", function(value) { ... })`
- Example: `typeColor` filter maps dish types to hex colors
- Example: `typeText` filter maps dish codes to Chinese text

---

*Convention analysis: 2026-02-18*
