# What Lunch

## What This Is

A lunch randomizer app for office workers who can't decide what to eat. Users browse a default restaurant list, filter by cuisine type, set budget constraints, and get random lunch recommendations. Internal tool for a small team of coworkers.

## Core Value

Quickly answer "what should we eat for lunch?" with a random, budget-aware recommendation from nearby restaurants.

## Requirements

### Validated

- ✓ Browse default restaurant list with cuisine types and prices — existing
- ✓ Filter restaurants by cuisine type (Chinese, Japanese, Korean, Taiwanese, Western) — existing
- ✓ Random lunch recommendation with budget control — existing
- ✓ Add and remove restaurants from the list — existing
- ✓ Weekly meal plan generation with budget constraints — existing

### Active

- [ ] Rewrite entire app from Vue 2 to Next.js (React)
- [ ] Brand new UI design (not replicating old Element UI look)
- [ ] Deploy to Vercel
- [ ] Maintain all existing features in new stack
- [ ] Restaurant data as hardcoded defaults (no database)

### Out of Scope

- User authentication — internal tool, no need for accounts
- Database / backend storage — data stays hardcoded in code
- Mobile native app — web-only
- Multi-user collaboration — no shared state needed
- Restaurant API integrations (Google Maps, Yelp) — keep it simple

## Context

- Existing Vue 2 + Vuex + Element UI codebase with known tech debt (broken algorithm logic, duplicated type constants, weak UUID generation)
- Codebase mapped in `.planning/codebase/` — 7 documents covering stack, architecture, concerns
- Team uses this daily for lunch decisions
- Current app works but framework (Vue 2) is EOL and dependencies are outdated
- Deployment target is Vercel (Next.js native support, free tier)

## Constraints

- **Tech stack**: Next.js (React) — user decision, leverages Vercel deployment
- **Data**: No database — restaurant list hardcoded as default data in code
- **Scope**: Feature parity first — replicate existing functionality before any new features
- **Budget**: Free tier deployment (Vercel)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js over Vue 3 | User preference, better Vercel integration | — Pending |
| No database | Keep it simple, data is static defaults | — Pending |
| Full rewrite over migration | Old codebase has significant tech debt, clean start is faster | — Pending |
| New UI design | Old Element UI look is dated, fresh start | — Pending |

---
*Last updated: 2026-02-18 after initialization*
