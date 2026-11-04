# CarePath / دليلتي الصحية

Offline-first Arabic (RTL) health-navigation PWA for families in Fayoum Governorate, Egypt.

The app asks at most four tap-only questions, detects danger signs, determines a care level, and shows the nearest suitable health facilities. No accounts, no backend, no database — everything runs from static files in the browser.

## Stack

- **Next.js 16** (App Router, static export)
- **React 19**
- **Leaflet + OpenStreetMap** (map tiles need internet; the rest works offline)
- **Custom service worker** generated after each build
- Plain CSS design system (no UI framework)

## Quick start

```bash
cd CarePath
npm install
npm run dev          # http://localhost:3000
```

Production build (static export + generated service worker):

```bash
npm run build        # writes out/
npm run preview      # serves out/ locally
```

Deploy the `out/` directory to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages). No server runtime is required.

## Routes

| Route | Screen |
|---|---|
| `/` | Home — start guidance, browse, emergency |
| `/guide/` | Four-question guided flow (tap + swipe) |
| `/result/?level=…&specialty=…` | Care level + nearest facilities, with a results map |
| `/facilities/` | All 140 facilities with type/emergency filters |
| `/map/` | Dedicated GIS map: markaz boundaries, all facility markers, user location |
| `/facility/?id=FAY-0002` | Facility details, call, map, directions |
| `/emergency/` | Danger signs, call 123, nearest emergency hospitals |
| `/about/` | About, privacy, data sources, disclaimer |

## Decision flow

`data/decision-tree.json` defines:

- **Questions** — age, main complaint, danger signs, specialty (max 4)
- **Care levels** — `emergency`, `urgent`, `specialty`, `primary`, each with a message, colour, facility filter and result limit
- **Routing rules** — first matching rule wins; any danger sign jumps straight to emergency
- **Specialties** — service keywords used to rank specialty results

The result screen filters facilities, ranks specialty matches, applies distance sorting when geolocation is allowed, and shows the top 6. If location is denied, results stay filtered but distance is hidden.

## Data

The app ships two JSON files:

| File | Purpose |
|---|---|
| `data/facilities.json` | 140 Fayoum facilities, bundled into the app |
| `data/decision-tree.json` | Questions, care levels, routing rules |
| `public/data/*` | Mirror used by the service worker cache |

Facility shape:

```json
{
  "id": "FAY-0002",
  "name_ar": "مستشفى الفيوم العام",
  "type": "مستشفى عام",
  "address": "…",
  "landmark": "…",
  "phone": "084 6333113",
  "opening_hours": "…",
  "services": ["طوارئ 24/7", "عيادات خارجية"],
  "emergency": true,
  "required_documents": ["بطاقة الرقم القومي"],
  "lat": 29.3163216,
  "lon": 30.8499723,
  "verified": false,
  "last_update": "2026-11-03"
}
```

To regenerate client data after updating the master dataset:

```bash
npm run sync:data
```

This reads `../data/fayoum_health_facilities.json` (the CarePath dataset project) and rewrites both `data/facilities.json` and `public/data/facilities.json`.

## Geofencing & maps

`public/data/geo/fayoum-markaz.geojson` bundles the Fayoum governorate and markaz polygons (16 KB) from geoBoundaries `gbOpen/EGY/ADM2` (OCHA ROMENA / CAPMAS, CC BY 3.0 IGO). Regenerate it with:

```bash
npm run build:geo
```

The script downloads the pinned source, keeps the Fayoum features, rounds coordinates, and reports any facility that falls outside the boundary (currently `FAY-0017`, `FAY-0103`, `FAY-0111` need coordinate checks).

`lib/geofence.js` runs point-in-polygon and distance-to-boundary checks in the browser. The app distinguishes:

- **inside** — distances and nearest-first ranking work normally
- **near** — within 10 km of the governorate edge, with a precision warning
- **outside** — the user is told they are outside Fayoum; distances stay relative to their location, and the emergency screen adds a "hospital near me" action
- **unknown** — permission denied or GPS accuracy worse than 20 km

A GPS accuracy worse than 2 km marks distances as approximate. All boundary data is precached, so the vector map (boundary + facility dots) works offline; only OSM basemap tiles need internet.

> All 140 records are currently `verified: false`. The UI labels them accordingly and advises calling before travelling. After field verification, update `verified`, `verified_by`, `verified_date` and `last_update` in the master dataset, run `npm run sync:data`, then `npm run build`.

## Offline behaviour

`npm run build` runs `scripts/generate-sw.js`, which scans `out/` and writes `out/sw.js` with a precache list of every generated file:

- app-shell HTML for all routes
- JS/CSS/font chunks
- facility and decision-tree JSON
- the Fayoum boundary GeoJSON (`/data/geo/fayoum-markaz.geojson`)
- RSC payloads used by Next client navigation
- PWA icons and manifest

The service worker uses stale-while-revalidate for same-origin GET requests and ignores query strings when matching, so cached route shells work for URLs like `/result/?level=…` and `/facility/?id=…`.

Works offline after the first load:

- all questions and care-level routing
- facility list, filters and details
- emergency screen and `tel:` links
- calling facilities

Does **not** work offline:

- live OpenStreetMap tiles (the map shows a clear offline placeholder)
- real-time geolocation (the last location is reused for up to 6 hours)

If a new build is deployed, the service worker cache name changes and the old cache is removed on activation.

## Project structure

```text
CarePath/
├── app/                      # routes, layout, global CSS
├── components/               # UI: flow, cards, map, location, details
├── data/                     # bundled JSON
├── lib/                      # distance, filtering, decision logic, geolocation
├── public/                   # manifest, icons, mirrored data, boundary GeoJSON
├── scripts/
│   ├── build-geo.mjs         # geoBoundaries → Fayoum boundary layers
│   ├── generate-sw.js        # post-build service worker generator
│   └── sync-facilities.mjs   # master CSV/JSON → client JSON
├── next.config.mjs           # output: "export", trailingSlash: true
└── package.json
```

## UI / accessibility notes

- Arabic-first, `dir="rtl"`, Cairo font self-hosted as WOFF2 subsets in `public/fonts` (no build-time font download)
- Touch targets are at least 48 px
- High-contrast care-level colours: red emergency, amber urgent, blue specialty, teal primary
- No text inputs anywhere
- One question per screen, tap to auto-advance, swipe right to go back
- Skip link, visible focus styles, `aria-live` result banner, labelled map

## Disclaimer

This app is a navigation aid, not a diagnosis or treatment service. It does not replace medical advice. In an emergency call **123** (Egyptian ambulance) immediately.

Facility data was compiled from public sources (Ministry of Health 100 Million Seha, local hospital directories, OpenStreetMap, Healthsites.io) and has **not** been field-verified.
