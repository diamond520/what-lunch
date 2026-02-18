# Feature Landscape

**Domain:** Lunch randomizer / food picker — internal team tool
**Researched:** 2026-02-18
**Confidence:** HIGH (existing codebase is primary source; domain analysis is from direct code inspection + domain reasoning)

---

## Context

This is a rewrite of an existing working app, not a greenfield product. The feature landscape is grounded in:

1. **Existing code** — `src/views/Home.vue`, `src/views/Dishes.vue`, `src/store/index.js`, `src/store/dishes.json`
2. **Known bugs and tech debt** — `.planning/codebase/CONCERNS.md`
3. **Project requirements** — `.planning/PROJECT.md`

The existing app has five pages worth of features across two views: a home/recommendation screen and a restaurant management screen.

---

## Table Stakes

Features users expect. Missing = the app feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| One-click random recommendation | Core value proposition. Without this, there is no app. | Low | Existing: "一鍵推薦" button. Algorithm picks 5 restaurants for Mon–Fri. |
| Weekly plan display (5 days) | Lunch planning is a weekly problem. Daily-only feels underpowered for the office context. | Low | Existing: cards for 星期1–5 (Monday–Friday). |
| Per-slot re-roll | Users accept 4 of 5 picks and want to swap just one. Without this, they re-run the whole plan until they get lucky. | Low | Existing: refresh button on each day card. |
| Budget control | Cost matters. Without budget filtering, recommendations are useless to people with a NT$100 limit. | Med | Existing: weekly budget input (NT$100–2000, step 10). Budget is distributed across all 5 days. |
| Restaurant list view | Users need to see what's in the pool they're picking from. Trust and transparency. | Low | Existing: table in Dishes.vue with name, price, distance, type columns. |
| Add restaurant | The hardcoded defaults are a starting point. Users add their actual nearby spots. | Low | Existing: drawer form with name, type, price, distance fields. |
| Remove restaurant | Users remove closed or disliked spots. | Low | Existing: delete link in table. |
| Cuisine type labels | Helps users understand what they're getting (Chinese, Japanese, Korean, Taiwanese, Western). | Low | Existing: color-coded tags. 5 types: chi, jp, kr, tai, west. |
| Result shows restaurant details | Name alone is insufficient — price and distance shown in recommendation cards. | Low | Existing: name + type tag + price + distance in each day card. |
| Input validation on restaurant form | Without this, garbage data (empty names, non-numeric prices) corrupts the recommendation pool. | Low | Existing: basic required-field validation. Needs improvement (type coercion bug). |

---

## Differentiators

Features that set this product apart. Not expected by default, but add real value for the target users.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Cuisine diversity enforcement | Prevents "Japanese food every day." Constraint: no more than 2 consecutive same-type restaurants per week. | Med | Existing: `nonRepeatSort()` + `findMaxRepeat()`. Algorithm enforces this but has bugs — rewrite opportunity. |
| Budget-aware weekly plan (not just daily) | Weekly budget split across 5 days, not a per-meal cap. Feels more realistic for how teams think about expenses. | Med | Existing: `checkTotalPrice()` recursive algorithm. Needs rewrite with bounded recursion. |
| Restaurant distance field | "Good food far away" vs. "OK food nearby" is a real tradeoff. Including distance in the recommendation lets users weigh it mentally. | Low | Existing: distance in meters shown on each card. Not used in algorithm today. |
| Hardcoded defaults as sensible starting list | New users see real restaurants immediately (Dingтаifung, Ichiran, Sukiya etc.). Zero setup friction. | Low | 19 restaurants pre-seeded. The defaults are the user's actual Taipei office neighborhood. |
| Cuisine type color coding | Quick visual scan of the weekly plan — is it monotone or varied? Color makes it obvious. | Low | Existing: per-type colors in `main.js`. Centralize in new codebase. |

---

## Anti-Features

Things to deliberately NOT build. Common over-engineering mistakes for this domain and context.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User authentication / accounts | Internal tool for a known small team. Auth adds complexity with zero benefit. PROJECT.md explicitly excludes it. | Treat all users as the same trusted team. No login screen. |
| Database / backend persistence | No server needed. Restaurant data is curated by the team and stored in code. Adding a database introduces infra complexity, cost, and failure modes. | Keep data as a hardcoded JSON file (default list). Runtime additions live in component state (reset on reload — acceptable for this use case). |
| Yelp / Google Maps / external API integration | API keys, rate limits, data quality variance, network dependency. The team knows their local restaurants better than an API does. PROJECT.md explicitly excludes this. | Team-curated restaurant list is the product's data source. |
| Per-user favorites or personal lists | Multi-user state sharing requires a backend. No database means no persistence across users. The team decides together, not individually. | One shared restaurant list, agreed on by the team. |
| Restaurant ratings or reviews | Adds friction to the add-restaurant flow. Teams will just remove restaurants they dislike. | Deletion is the "rating" mechanism. |
| Notification / reminder system | Overkill for a lunch picker. The team opens the app when they're hungry. | Stateless web app. No push notifications. |
| Animated spin wheel | Common in food picker apps but adds animation complexity and slows down the "just pick something fast" use case. | Immediate result display. Speed over spectacle. |
| "I'm feeling lucky" single random pick | The existing app always plans a full week. A single-pick mode adds a mode without much added value for this team's workflow. | Keep weekly plan as the primary interaction. Per-slot re-roll covers the "just change one" need. |
| Distance-based filtering / map view | Distance data exists in the model but the team is in one office — they already know what's walkable. Adding a map or distance filter adds UI complexity for marginal benefit. | Show distance as an informational field. Do not filter by it algorithmically. |
| Mobile native app | Web-only is fine for office workers at their desk. PROJECT.md explicitly excludes native. | Responsive web UI is sufficient. |
| Undo/redo history | State is ephemeral (no database). Rerunning the randomizer is the "undo." | Stateless recommendation flow. Re-roll button handles correction. |

---

## Feature Dependencies

```
Budget input
  → Weekly plan generation (budget constrains which restaurants are eligible)
  → Per-slot re-roll (remaining budget for that slot = total budget minus other slots)

Restaurant list (hardcoded defaults + runtime additions)
  → Cuisine type labels (type field required on every restaurant)
  → Budget-aware recommendation (price field required)
  → Distance display (distance field required)
  → Cuisine diversity enforcement (type field required)

Restaurant add form
  → Restaurant list (adds to pool)
  → Input validation (guards pool integrity)
    → Numeric coercion for price and distance fields (existing bug — must fix)

Restaurant delete
  → Restaurant list (removes from pool)
  → Weekly plan generation (must not recommend deleted restaurants)
```

---

## MVP Recommendation

For this rewrite, "MVP" means: **feature parity with the existing app, bugs fixed.**

Prioritize in this order:

1. **Restaurant list with hardcoded defaults** — foundation everything else depends on
2. **Add / remove restaurant** — with proper input validation (fix numeric coercion bug)
3. **Cuisine type labels and color coding** — centralized constants (fix duplication)
4. **Budget input** — weekly budget control with NT$100–2000 range
5. **Weekly plan recommendation** — rewritten algorithm with bounded recursion and correct diversity enforcement (fix all existing algorithm bugs)
6. **Per-slot re-roll** — swap one day without regenerating the whole week

Defer to post-MVP (new features, not blocking parity):

- **Distance-based filtering** — distance is informational today; keep it that way for now
- **Cuisine type filter on restaurant list** — useful for large lists, but 19 restaurants is small enough to scan visually; add if list grows
- **Persistent state across reloads** — runtime-added restaurants disappear on reload; acceptable for now, add `localStorage` later if team complains
- **Edit restaurant** — current app only has add/delete; edit is a quality-of-life improvement, not table stakes

---

## Known Bugs in Existing App to Fix in Rewrite

These are not new features — they are correctness issues in the current implementation that must be resolved in the Next.js rewrite.

| Bug | Location | Impact | Fix |
|-----|----------|--------|-----|
| Budget validation loop never executes | `Home.vue` line 114 (`while(kind >= 2 && i >= 4)`) | Budget check skipped | Rewrite recommendation algorithm cleanly |
| Incorrect loop increment | `Home.vue` line 120 (`i =+ 1` instead of `i += 1`) | Validation loop broken | Fix in rewrite |
| Infinite recursion risk in `nonRepeatSort` | `Home.vue` lines 135–141 | UI freeze on edge cases | Add iteration limit; use deterministic algorithm |
| Infinite recursion risk in `checkTotalPrice` | `Home.vue` lines 158–172 | Stack overflow if budget impossible | Add depth limit + early exit + user-facing error |
| Cancel button doesn't close drawer | `Dishes.vue` line 84 | UX friction | Implement proper close handler |
| Price/distance stored as strings not numbers | `Dishes.vue` form, `store/index.js` | Algorithm comparison errors | Coerce to Number on form submit |
| Type constants defined in 3 places | `main.js`, `store/index.js` | Maintenance burden | Single source of truth in constants file |

---

## Confidence Assessment

| Area | Confidence | Source |
|------|------------|--------|
| Existing features (what to replicate) | HIGH | Direct code inspection of all source files |
| Bug list | HIGH | `.planning/codebase/CONCERNS.md` (already audited) |
| Table stakes categorization | HIGH | Derived from existing working app — these features are already validated by daily team use |
| Differentiators | MEDIUM | Domain reasoning; no external competitive analysis done (web search unavailable) |
| Anti-features | HIGH | Explicitly documented in `PROJECT.md` out-of-scope list + domain reasoning |
| Post-MVP deferral recommendations | MEDIUM | Judgment call based on team size, use case simplicity, and existing scope |

---

## Sources

- `src/views/Home.vue` — recommendation algorithm, budget control, weekly plan display
- `src/views/Dishes.vue` — restaurant CRUD, form validation
- `src/store/index.js` — state shape, cuisine types (chi/jp/kr/tai/west)
- `src/store/dishes.json` — 19 hardcoded default restaurants
- `src/App.vue` — navigation structure (two views: home + dishes)
- `.planning/PROJECT.md` — validated requirements, out-of-scope decisions
- `.planning/codebase/CONCERNS.md` — full bug and tech debt audit
