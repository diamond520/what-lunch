# Technology Stack

**Analysis Date:** 2026-02-18

## Languages

**Primary:**
- JavaScript (ES6+) - All source code in `src/` directory
- HTML - Templates in Vue single-file components (.vue files)
- SCSS - Styling in Vue components with `lang="scss"` attribute
- JSON - Configuration and data files

## Runtime

**Environment:**
- Node.js (no specific version pinned; uses .browserslistrc for browser targeting)

**Package Manager:**
- Yarn (lockfile present at `yarn.lock`)

## Frameworks

**Core:**
- Vue 2.6.11 - Frontend UI framework
- Vue Router 3.1.5 - Client-side routing (`src/router/index.js`)
- Vuex 3.1.2 - State management (`src/store/index.js`)

**UI Component Library:**
- Element UI 2.13.0 - Reusable UI components (buttons, cards, containers, dividers, tags, dialogs, input controls)

**CSS Utilities:**
- normalize.css 8.0.1 - CSS normalization across browsers

**Testing:**
- Not detected

**Build/Dev:**
- Vue CLI 4.2.0 (@vue/cli-service, @vue/cli-plugin-babel, @vue/cli-plugin-eslint)
- Webpack (implicit, managed by Vue CLI)
- Babel 10.0.3 (babel-eslint) - JavaScript transpilation

## Key Dependencies

**Critical:**
- vue@2.6.11 - Core framework for building UI
- vuex@3.1.2 - Centralized state management for dishes, recommendations, and filtering
- vue-router@3.1.5 - Routing between Home and Dishes views

**Infrastructure:**
- core-js@3.6.4 - JavaScript standard library polyfills
- element-ui@2.13.0 - Component library reducing custom CSS needs
- node-sass@4.12.0 - SASS preprocessing for scoped component styles
- sass-loader@8.0.2 - Webpack loader for SASS compilation
- vue-template-compiler@2.6.11 - Compiles Vue templates

## Configuration

**Environment:**
- Babel configuration: `babel.config.js` - Uses Vue CLI preset
- ESLint configuration: `.eslintrc.js` - Rules for Vue essential, ES6 recommended
- Browser targeting: `.browserslistrc` - Targets browsers with >1% usage and last 2 versions
- Git ignore: `.gitignore` - Ignores node_modules, /dist, .env.local, IDE files

**Build:**
- Vue CLI service commands in `package.json`:
  - `serve` - Development server
  - `build` - Production build output to `dist/`
  - `lint` - ESLint checking

**App Configuration:**
- `src/main.js` - Application entry point with Vue instance initialization
- Registers Element UI globally
- Defines Vue filters for restaurant type colors and translations
- `src/store/index.js` - Vuex store configuration with state, mutations, actions, getters
- `src/router/index.js` - Vue Router configuration with history mode

## Platform Requirements

**Development:**
- Node.js and Yarn package manager
- No database required
- No external API dependencies

**Production:**
- Static file hosting (HTML/CSS/JS output from build)
- Browser with ES6 support (via Babel transpilation)
- No server-side runtime required

---

*Stack analysis: 2026-02-18*
