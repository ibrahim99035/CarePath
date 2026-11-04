# CarePath / دليلتي الصحية — Grok project context

**Full technical handoff: `docs/ARCHITECTURE.md`.** Read that file for complete details. This file is a quick orientation.

## Short description

CarePath is an Arabic-only, RTL, offline-first health-navigation PWA for Fayoum, Egypt. It is a static Next.js export with no backend, accounts, analytics, or push. A four-question triage produces one of four care levels (`emergency`, `urgent`, `specialty`, `primary`), then ranks nearby facilities and shows them on a Leaflet map with call/details/emergency actions.

## Stack

- Next.js 16 App Router, `output: "export"`, `trailingSlash: true`
- React 19
- Leaflet 1.9.4, dynamically imported
- Plain CSS, self-hosted Cairo font
- Service worker generated after build for full offline precache

## Main directories

```text
app/          route pages + global styles
components/   client views and shared UI
lib/          pure logic: decision, facilities, geo, geofence, hooks
data/         bundled facilities + decision tree
public/       boundary GeoJSON, fonts, icons, manifest
scripts/      data sync, boundary build, service worker generation
docs/         full architecture handoff
```

## Core flow

`/guide/` → four questions (`age`, `complaint`, `danger`, `specialty`) → `lib/decision.js` evaluates first-match routing rules → `/result/?level=...&specialty=...` → `lib/facilities.js` filters/scores/ranks → `ResultView` shows care level, map, cards.

Danger answer short-circuits directly to emergency. Pregnancy/women’s options are hidden for infant/child. Outside-Fayoum detection uses bundled boundary polygons, point-in-polygon testing, and a 10 km near buffer.

## Commands

```bash
npm run dev
npm run sync:data
npm run build:geo
npm run build
npm run preview
```

## Non-negotiables

- No backend/API/database/auth/analytics/push.
- Keep static export and query-based detail routes.
- Keep core data and vectors offline; only map tiles need internet.
- Keep Arabic RTL and 48px+ primary touch targets.
- Keep danger override, age gating, outside-Fayoum warning, and `123`.
- Keep unverified-facility warnings.

## Important current issues

- 140 facilities, all unverified; 138 with coordinates, 139 with phone.
- Missing coords: `FAY-0004`, `FAY-0140`; missing phone: `FAY-0004`.
- Three coords outside Fayoum: `FAY-0017`, `FAY-0103`, `FAY-0111`.
- Result URL params are not revalidated against age gating.
- Guide answers are not persisted.
- `public/data/decision-tree.json` is stale but unused at runtime.
- No automated tests/CI yet.

See `docs/ARCHITECTURE.md` for algorithms, file-by-file structure, offline/service-worker details, known gaps, and extension guidance.
