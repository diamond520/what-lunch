# Requirements: What Lunch

**Defined:** 2026-02-18
**Core Value:** Quickly answer "what should we eat for lunch?" with a random, budget-aware recommendation

## v1 Requirements

Requirements for the Next.js rewrite. Feature parity with existing app, all known bugs fixed.

### Foundation

- [x] **FOUND-01**: Restaurant data model with TypeScript types (Restaurant interface, CuisineType union)
- [x] **FOUND-02**: Cuisine type constants centralized in single file (labels, colors for chi/jp/kr/tai/west)
- [x] **FOUND-03**: Default restaurant list (19 hardcoded Taipei restaurants) as typed constant
- [x] **FOUND-04**: Next.js 16 App Router project with TypeScript, Tailwind CSS, shadcn/ui

### Recommendation

- [ ] **RECO-01**: One-click weekly lunch plan generation (5 days, Mon-Fri)
- [ ] **RECO-02**: Budget input control (NT$100-2000, step 10) constraining weekly recommendations
- [ ] **RECO-03**: Budget-aware algorithm that distributes weekly budget across 5 days
- [ ] **RECO-04**: Cuisine diversity enforcement — no more than 2 consecutive same-type restaurants
- [ ] **RECO-05**: Per-slot re-roll — swap one day's pick without regenerating the full week
- [ ] **RECO-06**: Recommendation cards showing restaurant name, cuisine type tag, price, distance
- [ ] **RECO-07**: Algorithm with bounded iteration (no infinite recursion) and graceful fallback

### Restaurant Management

- [ ] **REST-01**: Restaurant list view with name, cuisine type, price, distance columns
- [ ] **REST-02**: Add restaurant form with name, cuisine type, price, distance fields
- [ ] **REST-03**: Form validation enforcing numeric types for price and distance (fix type coercion bug)
- [ ] **REST-04**: Remove restaurant from list
- [ ] **REST-05**: Cuisine type color-coded tags on restaurant entries

### UI/UX

- [x] **UI-01**: Brand new UI design (not replicating Element UI look)
- [x] **UI-02**: Navigation between recommendation page and restaurant management page
- [x] **UI-03**: Responsive layout for desktop use

### Deployment

- [ ] **DEPLOY-01**: Static export / SSG deployment to Vercel
- [ ] **DEPLOY-02**: Production build with no errors or warnings

## v2 Requirements

Deferred to future release. Not in current roadmap.

### Persistence

- **PERSIST-01**: Runtime-added restaurants persist across page reloads (localStorage)
- **PERSIST-02**: Save/load weekly plan to localStorage

### Enhanced Features

- **ENH-01**: Edit existing restaurant details
- **ENH-02**: Cuisine type filter on restaurant list view
- **ENH-03**: Distance-based sorting or filtering
- **ENH-04**: Configurable day count (not fixed to 5 days)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User authentication / accounts | Internal tool for known small team, zero benefit from auth |
| Database / backend persistence | No server needed, data is team-curated and hardcoded |
| External API integration (Yelp, Google Maps) | Team knows local restaurants better than an API |
| Per-user favorites or personal lists | Requires backend, team decides together |
| Restaurant ratings or reviews | Deletion is the rating mechanism |
| Notifications / reminders | Overkill for a lunch picker |
| Animated spin wheel | Speed over spectacle |
| Mobile native app | Web-only, responsive is sufficient |
| Undo/redo history | Re-roll button handles correction |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| UI-01 | Phase 2 | Complete |
| UI-02 | Phase 2 | Complete |
| UI-03 | Phase 2 | Complete |
| RECO-01 | Phase 3 | Pending |
| RECO-02 | Phase 3 | Pending |
| RECO-03 | Phase 3 | Pending |
| RECO-04 | Phase 3 | Pending |
| RECO-05 | Phase 3 | Pending |
| RECO-07 | Phase 3 | Pending |
| REST-01 | Phase 4 | Pending |
| REST-02 | Phase 4 | Pending |
| REST-03 | Phase 4 | Pending |
| REST-04 | Phase 4 | Pending |
| REST-05 | Phase 4 | Pending |
| RECO-06 | Phase 5 | Pending |
| DEPLOY-01 | Phase 5 | Pending |
| DEPLOY-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-18 after Phase 2 complete*
