# CarePath / دليلتي الصحية — Claude project context

**Read `docs/ARCHITECTURE.md` before making architectural changes.** It is the full technical handoff: product scope, routes, data model, algorithms, GIS, offline behavior, build pipeline, and known gaps.

## What this is

Arabic-only, RTL, offline-first health-navigation PWA for Fayoum, Egypt. Static Next.js export; no backend, accounts, analytics, or push. Four-question triage → care level → ranked facilities → map/details/emergency.

## Stack

- Next.js `^16.4.5` App Router, static export
- React `^19.3.1`
- Leaflet `^1.9.4` (dynamic import; no react-leaflet)
- Plain CSS in `app/globals.css` and `app/map.css`
- Self-hosted Cairo WOFF2; no Google Fonts at build/runtime
- Node `>=20.9`

## Commands

```bash
npm run dev
npm run sync:data    # master dataset -> data/ + public/data/
npm run build:geo    # needs network; boundary + coordinator validation
npm run build        # next build + service worker
npm run preview      # npx serve out
```

## Critical invariants

1. No backend, API routes, database, auth, analytics, or push.
2. Keep `output: "export"` and `trailingSlash: true`.
3. Keep facilities and decision tree bundled at build time.
4. Keep core flow offline after first visit; rebuild `sw.js` after route/data/asset changes.
5. Arabic-only RTL. Do not add an English UI without a product decision.
6. Danger sign must immediately route to emergency.
7. Pregnancy/women’s options stay hidden for infant/child.
8. Outside Fayoum must warn; never imply Fayoum facilities are nearby.
9. Emergency number is `123`.
10. Keep primary touch targets >= 48px.
11. Map tiles are online-only; vectors and facility data must work offline.
12. Keep unverified-data warnings visible.

## Key files

- `lib/decision.js` — gating, pruning, first-match routing rules
- `lib/facilities.js` — type filters, keyword scoring, distance ranking, limits
- `lib/geofence.js` — point-in-polygon, 10km near buffer, accuracy thresholds
- `lib/useLocation.js` — GPS + 6-hour localStorage cache
- `lib/useArea.js` — coords + boundary → area status
- `components/QuestionFlow.js` — four-question state machine
- `components/MapCanvas.js` — shared Leaflet map
- `components/MapScreen.js` — dedicated map tab
- `data/facilities.json` — 140 bundled records
- `data/decision-tree.json` — runtime source of truth
- `scripts/sync-facilities.mjs`, `scripts/build-geo.mjs`, `scripts/generate-sw.js`

## Current data facts

- 140 facilities; 37 hospitals; 13 emergency-capable
- 138 with coordinates; 139 with phone; all 140 unverified
- Missing coords: `FAY-0004`, `FAY-0140`; missing phone: `FAY-0004`
- Outside-boundary coords: `FAY-0017`, `FAY-0103`, `FAY-0111`
- Boundary: 8 Fayoum features, ~20 KB
- Build: 10 HTML pages, 84 files in `out/`, 83 precached URLs

## Known traps

- `ResultView` trusts `level`/`specialty` URL params; direct URLs are not revalidated against age gating. Normal guide flow is safe.
- Guide answers are not persisted; returning to `/guide/` starts over.
- `public/data/decision-tree.json` is stale (missing gating) but unused at runtime. Keep in sync or remove.
- Map tiles and Google directions need network; the result map fits facilities only, so a far-away user dot may be off-screen.
- No automated tests/CI yet.
- `AGENTS.md` warns that Next.js 16 has breaking changes; read bundled Next docs before framework changes.
