# External Integrations

**Analysis Date:** 2026-02-18

## APIs & External Services

**Not detected.**

The application does not integrate with external APIs or services. All operations are client-side with local data processing.

## Data Storage

**Databases:**
- Not used - No database integration detected

**File Storage:**
- Local JSON file only: `src/store/dishes.json`
- Data is loaded into Vuex store at application initialization
- All modifications are in-memory (not persisted to disk)

**Caching:**
- Not used - No caching layer detected

## Authentication & Identity

**Auth Provider:**
- Not used - No authentication system implemented

**Current Implementation:**
- Application requires no user login or authentication
- All users access the same restaurant data

## Monitoring & Observability

**Error Tracking:**
- Not detected - No error tracking service integrated

**Logs:**
- Browser console only via `console.log()` (development mode)
- Production config disables console warnings per `.eslintrc.js` rules

## CI/CD & Deployment

**Hosting:**
- Not detected - No hosting platform configured
- Built artifacts should be deployed to static file hosting

**CI Pipeline:**
- Not detected - No CI/CD configuration present

**Build Output:**
- Static site output to `dist/` directory via `vue-cli-service build`

## Environment Configuration

**Required env vars:**
- None detected - Application is fully static with no environment-specific configuration

**Optional env vars:**
- `NODE_ENV` - Checked in `.eslintrc.js` to control console/debugger warnings (development vs. production)
- `BASE_URL` - Implicit Vue CLI variable used in `src/router/index.js` and `public/index.html` for routing base path

**Secrets location:**
- Not applicable - No API keys, tokens, or secrets required

## Webhooks & Callbacks

**Incoming:**
- Not applicable - No webhook endpoints

**Outgoing:**
- Not applicable - No external service callbacks

## Data Flow

**Application Data Source:**
1. Static JSON file: `src/store/dishes.json`
2. Loaded into Vuex store on application startup via `src/store/index.js`
3. Modified in-memory through Vuex mutations (addDish, deleteDish, setDishes)
4. Displayed in components using Vuex getters
5. Data is lost on page refresh (no persistence)

**Recommendation Algorithm:**
- Runs client-side using `Home.vue` methods
- Filters restaurant list based on budget constraint
- Selects random restaurants with no API calls
- State managed in Vuex store: `recommends` and `leftDishes`

---

*Integration audit: 2026-02-18*
