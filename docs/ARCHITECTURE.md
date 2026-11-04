# CarePath / دليلتي الصحية — Complete Technical Handoff

This document is a self-contained project context for another AI (Claude/Grok) or a new engineer. It covers the product, architecture, flows, file structure, data model, algorithms, libraries, offline behavior, build pipeline, and known gaps.

---

## 1. What the app is

**CarePath / دليلتي الصحية** is an Arabic-only, RTL, offline-first health-navigation PWA for Fayoum Governorate, Egypt.

It helps a user answer four short questions:

1. Who needs care? — age group
2. What is the main complaint?
3. Are any danger signs present?
4. Which specialty is most appropriate?

It then routes the user to one of four care levels:

- `emergency`
- `urgent`
- `specialty`
- `primary`

and shows the top matching facilities, sorted by service relevance and distance, with a map, phone links, facility details, and an outside-Fayoum warning.

### Hard constraints

- Static client-only PWA. No backend, database, accounts, admin, CMS, analytics, or push notifications.
- Arabic-only UI, `dir="rtl"`.
- Core experience must work offline after first visit.
- Maximum four questions, one question per screen.
- 48px+ touch targets for primary controls.
- Danger-sign answer immediately overrides the flow and routes to emergency.
- Top 5–6 facilities, limit is `6`.
- Pregnancy and women’s-health options are hidden for infant/child age groups.
- If the user is outside Fayoum, the app must warn rather than imply Fayoum facilities are nearby. Fayoum results remain usable.
- Emergency number is `123`.
- Facility data is bundled and marked unverified; UI repeatedly tells users to call before travelling.

---

## 2. Technology stack and libraries

### Runtime dependencies

| Library | Version | Role |
|---|---:|---|
| `next` | `^16.4.5` | App Router, static export, routing, metadata |
| `react` | `^19.3.1` | UI |
| `react-dom` | `^19.3.1` | DOM rendering |
| `leaflet` | `^1.9.4` | GIS map, tiles, polygons, markers |

There is **no** state-management library, UI kit, CSS framework, icon library, map wrapper, or backend SDK. Icons are hand-written inline SVG components.

### Browser/platform APIs

- Geolocation API — one-shot `getCurrentPosition`.
- `localStorage` — last known location, 6-hour TTL.
- Service Worker + Cache API — offline precache.
- `Intl.NumberFormat("ar-EG")` — Arabic-Egypt number/distance formatting.
- `fetch` — boundary GeoJSON.
- `URLSearchParams` — result/facility query parameters.
- `tel:` links — device dialer.
- Google Maps universal URLs — directions and nearby-hospital search.

### External services and data

- **OpenStreetMap tiles** — online-only basemap.
- **Google Maps URLs** — directions and “hospital near me”.
- **geoBoundaries gbOpen EGY ADM2** — Fayoum boundary vectors, OCHA ROMENA/CAPMAS, CC BY 3.0 IGO.
- **Cairo font** — self-hosted WOFF2 subsets, SIL OFL 1.1.

### Build/runtime requirements

- Node.js `>=20.9`.
- Static hosting; Service Worker requires HTTPS except on `localhost`.
- `npm run build:geo` needs network access; normal `npm run build` does not.
- Next.js 16 has breaking changes versus older Next versions; the repo’s `AGENTS.md` warns to read the bundled Next docs before modifying framework-specific code.

---

## 3. High-level architecture

### Build-time vs runtime

```text
MASTER DATA
../data/fayoum_health_facilities.json
        │
        │ npm run sync:data
        ▼
data/facilities.json  ───────────────► imported at build time
public/data/facilities.json              │
                                         ▼
                                  lib/facilities.js
                                         │
                                         ▼
                             Result / Facilities / Map UI

DECISION TREE
data/decision-tree.json ─────► lib/decision.js ─────► QuestionFlow
                                                     │
                                                     ▼
                                      /result/?level=...&specialty=...

GEOLOCATION
navigator.geolocation
        │
        ▼
lib/useLocation.js ──► coords ──► lib/useArea.js ──► lib/geofence.js
                                      │
                                      ├──► AreaNotice
                                      └──► MapCanvas user layer

BUILD
next build ──► out/ ──► scripts/generate-sw.js ──► out/sw.js
```

### Architectural layers

1. **Route pages** — thin server/static wrappers in `app/*/page.js`.
2. **Client views** — most real UI is in `components/*`, marked `"use client"`.
3. **Pure logic** — `lib/decision.js`, `lib/facilities.js`, `lib/geo.js`, `lib/geofence.js`.
4. **Hooks** — `lib/useLocation.js`, `lib/useArea.js`.
5. **Bundled data** — `data/facilities.json`, `data/decision-tree.json`.
6. **Static assets** — `public/` boundary, fonts, icons, manifest.
7. **Build scripts** — data sync, geo boundary generation, service-worker generation.

The app is effectively a **static bundle + client-side query parameters**. There is no API layer.

---

## 4. Routes and navigation

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.js` | Home, quick actions, explanation, disclaimer |
| `/guide/` | `app/guide/page.js` → `QuestionFlow` | Four-question triage |
| `/result/` | `app/result/page.js` → `ResultView` | Care-level result, map, ranked facilities |
| `/facilities/` | `app/facilities/page.js` → `FacilitiesBrowser` | Browse/filter all facilities |
| `/facility/` | `app/facility/page.js` → `FacilityDetails` | Facility detail page |
| `/emergency/` | `app/emergency/page.js` → `EmergencyView` | Emergency screen |
| `/map/` | `app/map/page.js` → `MapScreen` | Dedicated GIS tab |
| `/about/` | `app/about/page.js` | About, privacy, data sources, disclaimer |
| `/404/, /_not-found/` | generated | Not-found page |

### Query parameters

Result page:

```text
/result/?level=emergency|urgent|specialty|primary
        &specialty=family|pediatrics|womens|internal|dental|eye
        &complaint=fever|breathing|chest|diarrhea|injury|pregnancy|dental|skin|chronic|other
        &age=infant|child|adult|elderly
        &danger=<danger-id>|none
```

Actual behavior: `ResultView` only reads `level` and `specialty`. `complaint`, `age`, and `danger` are carried in the URL but are not used for result rendering or filtering. This is a known hardening gap — see §13.

Facility page:

```text
/facility/?id=FAY-0001
```

Because the app is a static export with `trailingSlash: true`, `/facility/?id=...` resolves to the single static `/facility/index.html` shell, and the client reads the `id` query.

### Navigation

Five bottom tabs:

1. الرئيسية — `/`
2. المنشآت — `/facilities/`
3. الخريطة — `/map/`
4. الطوارئ — `/emergency/`
5. عن التطبيق — `/about/`

The bottom nav is hidden on `/guide/*` to keep triage distraction-free.

### Static export behavior

`next.config.mjs`:

```js
output: "export"
trailingSlash: true
images: { unoptimized: true }
reactStrictMode: true
```

The result and facility pages wrap `useSearchParams()` in `<Suspense>` because they are client components inside a static export.

---

## 5. File structure

```text
CarePath/
├── app/
│   ├── layout.js                 # html lang=ar dir=rtl, metadata, CSS imports, nav, SW registration
│   ├── page.js                   # Home
│   ├── about/page.js             # About/privacy/sources
│   ├── emergency/page.js         # Emergency route wrapper
│   ├── facilities/page.js        # Browser route wrapper
│   ├── facility/page.js          # Details route wrapper, Suspense
│   ├── guide/page.js             # Triage route wrapper
│   ├── map/page.js               # Map route wrapper
│   ├── result/page.js            # Result route wrapper, Suspense
│   ├── not-found.js              # Not-found UI
│   ├── fonts.css                 # Self-hosted Cairo @font-face rules
│   ├── globals.css               # Design system + all main UI styles
│   └── map.css                   # Geofence notices, Leaflet, map screen, sheet styles
│
├── components/
│   ├── QuestionFlow.js           # The four-question state machine
│   ├── ResultView.js             # Result screen
│   ├── FacilitiesBrowser.js      # Browse/filter screen
│   ├── FacilityCard.js           # Horizontal result card
│   ├── FacilityRow.js            # List row
│   ├── FacilityDetails.js        # Full detail page
│   ├── EmergencyView.js          # Emergency screen
│   ├── MapScreen.js              # Dedicated map tab
│   ├── MapCanvas.js              # Shared Leaflet map component
│   ├── AreaNotice.js             # Inside/near/outside/accuracy notices
│   ├── LocationPrompt.js         # Permission/status UI
│   ├── BottomNav.js              # Five-tab nav
│   ├── PageHeader.js             # Back/title/subtitle header
│   ├── ServiceWorkerRegister.js  # Registers /sw.js in production only
│   └── Icons.js                  # Inline SVG icon set
│
├── lib/
│   ├── decision.js               # Option gating, answer pruning, rule evaluation
│   ├── facilities.js             # Facility filtering, scoring, ranking, browsing
│   ├── geo.js                    # Haversine distance, formatting, coordinate helpers
│   ├── geofence.js               # Boundary loading, PIP, distance-to-boundary, statuses
│   ├── useLocation.js            # Geolocation + 6-hour localStorage cache
│   └── useArea.js                # Boundary + location → area analysis hook
│
├── data/
│   ├── facilities.json           # 140 bundled facility records
│   └── decision-tree.json        # Questions, care levels, specialties, routing rules
│
├── public/
│   ├── data/
│   │   ├── facilities.json       # Sync copy
│   │   ├── decision-tree.json    # Older copy; not used by runtime
│   │   └── geo/fayoum-markaz.geojson
│   ├── fonts/
│   │   ├── cairo-arabic.woff2
│   │   ├── cairo-latin-ext.woff2
│   │   └── cairo-latin.woff2
│   ├── icons/                    # PWA/favicon/apple/maskable icons
│   └── manifest.json
│
├── scripts/
│   ├── sync-facilities.mjs       # Master dataset → data/ + public/data/
│   ├── build-geo.mjs             # geoBoundaries download/filter/validate
│   ├── generate-sw.js            # out/ → precache service worker
│   └── serve-out.mjs             # zero-dependency production preview server
│
├── next.config.mjs
├── jsconfig.json                 # "@/*" alias
├── package.json
└── AGENTS.md
```

---

## 6. Data model

### 6.1 Facility record

`data/facilities.json` is an array of 140 objects:

```json
{
  "id": "FAY-0001",
  "name_ar": "مستشفى الفيوم الجامعي التخصصي",
  "name_en": "Fayoum University Specialized Hospital",
  "type": "مستشفى عام",
  "address": "حي كيمان فارس ...",
  "landmark": "جامعة الفيوم",
  "phone": "010 0691246",
  "whatsapp": "",
  "opening_hours": "24/7 (الطوارئ)؛ العيادات 8:00-14:00",
  "services": ["طوارئ", "عيادات خارجية", "باطنة", "..."],
  "emergency": true,
  "required_documents": ["بطاقة الرقم القومي"],
  "lat": 29.313,
  "lon": 30.85,
  "verified": false,
  "last_update": "2026-11-03",
  "notes": "...",
  "source": "..."
}
```

Field notes:

- `services` and `required_documents` are arrays after sync.
- `lat`/`lon` are WGS84 decimal degrees or `null`.
- `emergency` and `verified` are booleans after sync.
- All 140 records currently have `verified: false`.

### 6.2 Current facility statistics

| Metric | Value |
|---|---:|
| Total facilities | 140 |
| Hospitals (`type` starts with `مستشفى`) | 37 |
| Emergency-capable | 13 |
| With coordinates | 138 |
| With phone | 139 |
| Missing coordinates | 2: `FAY-0004`, `FAY-0140` |
| Missing phone | 1: `FAY-0004` |
| Unverified | 140 |
| Coordinate outliers outside Fayoum | 3: `FAY-0017`, `FAY-0103`, `FAY-0111` |

Facility type distribution:

| Type | Count |
|---|---:|
| مستشفى عام | 10 |
| مستشفى تأمين صحي | 8 |
| مستشفى أطفال | 1 |
| مستشفى تخصصي | 18 |
| مركز طبي حضري | 1 |
| وحدة رعاية أساسية / طب أسرة | 101 |
| أخرى | 1 |

`TYPE_ORDER` also includes `عيادة خاصة` and `صيدلية`, but the current dataset contains none.

### 6.3 Decision tree model

`data/decision-tree.json` contains:

```json
{
  "version": "1.0.0",
  "updated": "2026-11-03",
  "questions": [],
  "care_levels": {},
  "specialties": {},
  "routing_rules": []
}
```

Each question:

```json
{
  "id": "complaint",
  "title": "ما هي الشكوى الرئيسية؟",
  "subtitle": "اختر ما يصف الحالة أكثر",
  "columns": 2,
  "options": [
    {
      "id": "pregnancy",
      "label": "حمل أو ولادة",
      "icon": "🤰",
      "available_for": { "age": ["adult", "elderly"] }
    }
  ]
}
```

Option fields:

- `id`, `label`, `icon`
- `danger: true` for danger signs
- `available_for` for conditional visibility

Care level fields:

- `title`, `subtitle`, `message`, `color`, `icon`
- `limit`
- `facility_filter.types`
- `facility_filter.emergency_only`
- `match_services` for specialty matching

Specialty fields:

- `label`
- `service_keywords` used for substring scoring

Routing rules are ordered and first-match-wins:

```json
[
  { "when": { "danger": "any" }, "level": "emergency" },
  { "when": { "complaint": ["breathing", "chest"] }, "level": "urgent" },
  {
    "when": {
      "age": ["infant", "elderly"],
      "complaint": ["fever", "diarrhea"]
    },
    "level": "urgent"
  },
  {
    "when": { "complaint": ["pregnancy"] },
    "level": "specialty",
    "specialty": "womens"
  },
  {
    "when": {
      "specialty": ["dental", "eye", "womens", "pediatrics", "internal"]
    },
    "level": "specialty"
  },
  { "default": "primary" }
]
```

---

## 7. End-to-end user flows

### 7.1 Home

`app/page.js` is mostly static:

- Shows total facility count from `facilityCounts()`.
- Primary CTA: “ابدأ التوجيه” → `/guide/`.
- Secondary actions: browse facilities, emergency, interactive map.
- “كيف يعمل؟” explains the three-step concept.
- Disclaimer: guidance only, call `123` in critical cases, facility data still being verified.

### 7.2 Guided triage — `/guide/`

`QuestionFlow.js` is the state machine.

State:

```js
step          // 0..3
answers       // { age, complaint, danger, specialty }
locked        // prevents double taps during 220ms transition
touch         // swipe gesture ref
advanceTimer  // cleanup on unmount
```

Questions are fixed from `decisionTree.questions`:

1. `age`
2. `complaint`
3. `danger`
4. `specialty`

Behavior:

- Renders **one question per screen**.
- Visible options are filtered through `getVisibleOptions(question, answers)`.
- Selecting an option:
  1. merges the answer,
  2. calls `pruneAnswers`,
  3. sets `locked`,
  4. if the selected danger option has `danger: true`, immediately calls `router.push(buildResultHref(...))`,
  5. if it was the last question, routes to result,
  6. otherwise auto-advances after `220ms`.
- “السابق” goes back one step; on step 0 it goes home.
- “التالي” appears only if an option is selected and it is not the danger question.
- Horizontal swipe:
  - right swipe (`dx > 0`) goes back if possible,
  - left swipe (`dx < 0`) goes forward only if the current question is answered,
  - threshold: `|dx| >= 70px` and `|dx| > |dy| * 1.4`.
- Progress bar: `(step + 1) / 4`.
- Bottom nav is hidden on this route.
- No answers are persisted; reloading or returning from result starts a fresh guide.

#### Gating example

- If `age` is `infant` or `child`, the `pregnancy` complaint and `womens` specialty are hidden.
- If the user changes age from `adult` to `child` after previously answering `pregnancy`, the next selection triggers `pruneAnswers`, which deletes the now-invalid `complaint` and `specialty` answers.

### 7.3 Result — `/result/`

`ResultView.js`:

1. Reads `level` and `specialty` from the query.
2. Loads the care-level object via `getCareLevel`; unknown level falls back to `primary`.
3. Renders a colored care-level banner.
4. If `level === "emergency"`, renders a large `tel:123` CTA.
5. Renders `LocationPrompt`.
6. Renders `AreaNotice` using `useArea(coords)`.
7. Renders a `MapCanvas` with the selected facilities.
8. Renders up to six `FacilityCard` components in a horizontal rail.
9. Shows “all facilities” and “restart triage” links.
10. Shows the medical disclaimer.

Routing outcomes:

| Rule | Result |
|---|---|
| Any danger sign | `emergency` |
| Complaint `breathing` or `chest` | `urgent` |
| Infant/elderly + `fever`/`diarrhea` | `urgent` |
| Pregnancy | `specialty` + `womens` |
| Specialty `dental`, `eye`, `womens`, `pediatrics`, `internal` | `specialty` |
| Otherwise | `primary` |

Rule priority matters. For example, pregnancy + chest pain routes to `urgent`, not women’s specialty, because the chest rule appears earlier.

### 7.4 Location permission flow

`useLocation.js`:

- On mount, restores a cached location if it is younger than 6 hours.
- Cached location is presented as `fromCache: true`.
- Clicking “استخدم موقعي” calls `navigator.geolocation.getCurrentPosition`.
- Options:

```js
{
  enableHighAccuracy: false,
  timeout: 12000,
  maximumAge: 5 * 60 * 1000
}
```

- Success stores `{ lat, lon, accuracy, ts }` in `localStorage` under `carepath:last-location`.
- Error code `1` → `denied`; other errors → `error`.
- Missing geolocation API → `unavailable`.
- Status values: `idle | locating | granted | denied | error | unavailable`.
- No continuous `watchPosition`; one-shot requests only.

`LocationPrompt.js` renders the corresponding UI and retry button.

### 7.5 Facilities browser — `/facilities/`

`FacilitiesBrowser.js`:

- Loads location status and area.
- Shows location prompt and area notice.
- Link to `/map/`.
- Type filter chips from `typeOptions()`.
- “طوارئ فقط” toggle.
- “الأقرب أولاً” toggle:
  - if location already granted, toggles sorting;
  - otherwise sets nearest mode and requests location.
- Renders `FacilityRow` list.
- Empty state with “إزالة الفلاتر”.

Sorting:

- If nearest is off: emergency first, then type rank, then Arabic name.
- If nearest is on and coordinates exist: distance first, then emergency/type/name.

### 7.6 Facility details — `/facility/?id=...`

`FacilityDetails.js`:

- Reads `id` from query.
- Looks up facility with `getFacilityById`.
- Missing ID/facility → empty state with link to all facilities.
- Shows:
  - type, emergency badge, verified/unverified badge,
  - Arabic and English names,
  - address,
  - call button,
  - directions button,
  - address/landmark/phone/WhatsApp/hours/emergency/documents info list,
  - service chips,
  - map with the facility,
  - Google Maps directions button,
  - notes, source, last update,
  - verification disclaimer.
- Directions URL:
  - with coordinates: `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lon>`
  - without coordinates: Google Maps search for `<name_ar> الفيوم`.
- WhatsApp number is displayed as text, not deep-linked.
- Missing phone → disabled “لا يوجد رقم” state.

### 7.7 Emergency — `/emergency/`

`EmergencyView.js`:

- Header “الطوارئ”.
- Large `tel:123` ambulance CTA.
- List of all danger signs from the decision tree.
- Top emergency hospitals via `selectFacilities({ level: "emergency", specialty: "family" }, coords)`.
- Location prompt.
- `AreaNotice` with `emergency` prop; if outside Fayoum, it includes a Google Maps “hospital near me” link.
- Safety note: do not drive yourself if severe pain/dizziness; bring ID and medical reports.
- Link to guided triage.

### 7.8 Map tab — `/map/`

`MapScreen.js`:

- Type filter chips.
- Emergency-only toggle.
- “موقعي” button requests location and switches map focus to the user.
- `MapCanvas` with all filtered facilities.
- Legend for facility categories and user location.
- Marker click opens a bottom sheet with:
  - name, type,
  - distance from user,
  - call button,
  - details link.
- Map height is responsive: `clamp(340px, calc(100dvh - 350px), 720px)`.
- If location request is denied/errors while focus is `user`, focus resets to facilities.
- Filters are not URL-addressable.

### 7.9 About and 404

`/about/` covers:

- app purpose,
- geographic scope,
- facility count,
- language,
- version,
- offline support,
- privacy: no server/accounts; location stays on device,
- data sources: Ministry of Health/100 Million Health, local hospital guides, OpenStreetMap, Healthsites.io, official pages,
- geoBoundaries and OSM licensing,
- medical disclaimer.

`not-found.js` provides an Arabic 404 with a home link.

---

## 8. Algorithms in detail

### 8.1 Option gating

`lib/decision.js`:

```js
isOptionAvailable(option, answers)
```

- If no `available_for`, visible.
- Otherwise every condition must match.
- If the answer key is not answered yet, the option is **visible**; the app does not hide prematurely.
- Array condition → `allowed.includes(actual)`.
- Scalar condition → strict equality.

`getVisibleOptions(question, answers)` filters the question’s options through this test.

Current gated options:

- `complaint: pregnancy` → `age` in `["adult", "elderly"]`
- `specialty: womens` → `age` in `["adult", "elderly"]`

### 8.2 Answer pruning

`pruneAnswers(tree, answers)`:

1. Copy answers.
2. Iterate questions in order.
3. For each selected answer, recompute visible options using the current answers.
4. If the selected option is no longer visible, delete that answer.

This handles changing age after answering later questions. Because questions are ordered `age → complaint → danger → specialty`, invalid downstream answers are removed correctly.

### 8.3 Rule evaluation

`evaluateAnswers(tree, answers)`:

1. Prune answers.
2. Iterate `routing_rules` in array order.
3. Skip the default rule during the loop.
4. `matchesRule`:
   - `danger: "any"` uses `isDangerSelected`, which is true for any danger option except `none`.
   - Arrays use `includes`.
   - Scalars use strict equality.
5. Return the first matching rule’s `level` and:
   - `rule.specialty`, else
   - the user’s valid `specialty`, else
   - `"family"`.
6. If nothing matches, use the default rule’s `default` level, or `"primary"`.

`isDangerSelected`:

```js
dangerId && dangerId !== "none" && dangerOptions.some(o => o.id === dangerId)
```

`buildResultHref`:

1. Prune.
2. Evaluate.
3. Create `URLSearchParams` with `level`, `specialty`.
4. Add `complaint`, `age`, `danger` when present.
5. Return `/result/?...`.

### 8.4 Care-level lookup

```js
getCareLevel(tree, level) => tree.care_levels[level] || tree.care_levels.primary
```

Unknown levels do not crash; they fall back to primary.

### 8.5 Facility filtering

`selectFacilities({ level, specialty }, coords, limitOverride)`:

1. Resolve the care level; unknown level → primary.
2. Read `facility_filter`.
3. Build `allowedTypes` set.
4. If `careLevel.match_services` and a specialty exists, load `specialties[specialty].service_keywords`.
5. Filter facilities:
   - type must be in `allowedTypes` if the set is non-empty;
   - if `emergency_only`, facility must have `emergency === true`.
6. Score each remaining facility.

### 8.6 Service-match scoring

```js
haystack = facility.services.join(" | ")
match = keywords.reduce((count, keyword) =>
  haystack.includes(keyword) ? count + 1 : count, 0)
```

Important properties:

- Matching is **substring-based**, not tokenized.
- Duplicate keywords can double-count. For example dental has `"أسنان"` twice, and women’s health has `"نساء وتوليد"` plus `"توليد"`, which can both match the same service string.
- A facility with multiple matching keywords gets a higher score.
- The score is not normalized by number of services.

### 8.7 Choosing the candidate pool

```js
matched = scored.filter(f => f.match > 0)

ranked = matched.length >= 3 ? matched : scored
```

So:

- If at least three facilities match one or more specialty keywords, **only matched facilities are considered**.
- If fewer than three match, the full type-filtered pool is used, with match score still affecting sort order.

This avoids an empty specialty list in thin categories but can produce 3–5 results even when the limit is 6.

### 8.8 Sorting

`addDistance(facility, coords)`:

- No coords or no facility coords → `distance: null`.
- Otherwise Haversine distance in km.

With coordinates, `sortByDistance` orders by:

1. `match` descending — service relevance beats distance.
2. Distance ascending; `null` distances last.
3. Emergency first.
4. `typeRank` ascending.
5. Arabic name via `localeCompare(..., "ar")`.

Without coordinates, `compareNoCoords` orders by:

1. `match` descending.
2. Emergency first.
3. Type rank.
4. Arabic name.

Consequence: a facility with a strong service match 40km away can outrank a closer facility with no keyword match.

### 8.9 Limit and fallback

```js
limit = limitOverride || careLevel.limit || 6
```

If `withDistance.length < Math.min(3, limit)`:

1. Collect already-used IDs.
2. Take all unused facilities.
3. Set their `match` to `0`.
4. Add distance.
5. Sort.
6. Append and slice to `limit`.

So the fallback guarantees at least three results when the filtered pool is very thin, but it does **not** top up a 3–5 result list to six.

### 8.10 Browsing

`browseFacilities({ type, emergencyOnly, coords })`:

- Exact type filter unless `"all"`.
- Optional emergency-only filter.
- Adds distance if coords exist.
- Sorts by distance when coords exist, otherwise by emergency/type/name.
- All `match` values are effectively zero in browse mode.

### 8.11 Haversine distance

`lib/geo.js`:

```js
EARTH_RADIUS_KM = 6371
```

Standard Haversine:

```text
a = sin²(Δlat/2) + cos(lat1) · cos(lat2) · sin²(Δlon/2)
d = 2 · R · asin(√a)
```

`formatDistance(km)`:

- `< 1 km`: rounds to nearest 50m, minimum 50m, displays meters.
- `< 10 km`: one decimal place, km.
- `>= 10 km`: rounded integer km.
- Uses `Intl.NumberFormat("ar-EG")`.

### 8.12 Geofencing

`lib/geofence.js` loads:

```text
/data/geo/fayoum-markaz.geojson
```

The GeoJSON has **8 polygon features**:

- أبشواي (markaz)
- إطسا (markaz)
- مدينة الفيوم (city, `Fayyum`)
- مركز الفيوم (markaz, `Fayyum`)
- مدينة الفيوم (city, `Fayyum City`)
- سنورس (markaz)
- طامية (markaz)
- يوسف الصديق (markaz)

The file is about **20 KB**, simplified and rounded to 5 decimal places.

#### Point-in-polygon

Uses ray casting:

```js
inRing([x, y], ring)
```

- `x` is longitude, `y` is latitude.
- Iterates ring edges.
- Toggles inside state when a horizontal ray crosses an edge.
- `inPolygon` accepts the first ring as the outer boundary and excludes holes.
- Supports `Polygon` and `MultiPolygon`.

#### Distance to boundary

For points outside all polygons:

1. Project lat/lon locally to kilometres:
   - `kmPerLat = 110.574`
   - `kmPerLon = 111.32 * cos(lat)`
2. Compute squared point-to-segment distance for every segment of every outer ring and hole.
3. Take the minimum and square-root it.

#### Status and accuracy

Constants:

```js
NEAR_BUFFER_KM = 10
UNRELIABLE_ACCURACY_M = 20000
APPROXIMATE_ACCURACY_M = 2000
```

`analyzeLocation(geojson, { lat, lon, accuracy })`:

| Condition | Result |
|---|---|
| Invalid lat/lon | `unknown` |
| Accuracy `> 20,000 m` | `unknown`, `approximate: true` |
| Point inside any polygon | `inside`, `distanceKm: 0`, markaz/city name |
| Outside but `distance <= 10 km` | `near` |
| Outside and `distance > 10 km` | `outside` |
| Accuracy `> 2,000 m` | `approximate: true` |

Inside status:

- If the matching feature has `level === "markaz"`, use its Arabic name.
- Otherwise use the feature name (city).
- The function returns on the first matching feature.

`useArea(coords)`:

- No coords → `unknown`.
- Coords → `loading`, then load boundary and analyze.
- Boundary fetch failure → `unknown`.
- Cancels stale updates on coordinate changes.

### 8.13 Area notices

`AreaNotice` logic:

- `loading` / `unknown` → render nothing.
- `inside` + not approximate → render nothing.
- `inside` + approximate → muted low-accuracy notice with ± distance.
- `near` → amber warning with distance to boundary.
- `outside` → red alert with distance, explaining that distances are measured from the user and Fayoum facilities may be far.
- Outside + `emergency` → adds “ابحث عن أقرب مستشفى حولي” Google Maps link.

Because `unknown` renders nothing, a failed boundary fetch or >20km accuracy produces no outside warning.

### 8.14 Map lifecycle

`MapCanvas.js`:

- Props: `facilities`, `user`, `height`, `fit`, `selectedId`, `onSelect`, `labels`, `className`, `ariaLabel`.
- Dynamically imports Leaflet (`await import("leaflet")`) to keep the map JS out of the initial route chunk.
- Creates the map once:
  - center `[29.31, 30.84]`, zoom `9`
  - zoom control on
  - scroll wheel zoom off
  - scale control bottom-left
  - marker layer group
- Loads boundary GeoJSON:
  - teal stroke, translucent teal fill
  - tooltip with Arabic feature name
  - optional markaz labels via `divIcon`
  - if there are no facilities, fits `FAYOUM_BOUNDS`
- Tile layer:
  - OpenStreetMap tiles
  - only added when `navigator.onLine`
  - removed when offline
  - `tileerror` → show offline/fallback note
- Facility markers:
  - Leaflet `circleMarker`
  - color by type
  - selected radius 11
  - emergency radius 8 with dark red border
  - normal radius 7 with white border
  - `bubblingMouseEvents: false`
  - if `onSelect` exists, click selects; otherwise binds a popup with call/details links
  - `fit="facilities"` fits all valid facility coordinates, `maxZoom: 14`
- User layer:
  - accuracy circle if accuracy > 0
  - blue dot with white border
  - tooltip “موقعك”
  - `fit="user"` centers zoom 13
- Selected facility:
  - pans to the selected marker at zoom 14
- Fallback note:
  - offline
  - tiles failed
  - boundary failed

Marker colors:

| Type | Color |
|---|---|
| مستشفى عام | `#dc2626` |
| مستشفى تأمين صحي | `#ea580c` |
| مستشفى أطفال | `#db2777` |
| مستشفى تخصصي | `#7c3aed` |
| مركز طبي حضري | `#2563eb` |
| وحدة رعاية أساسية / طب أسرة | `#0d9488` |
| عيادة خاصة / أخرى | `#64748b` |

No clustering; all valid filtered markers are rendered.

### 8.15 Service worker algorithm

`scripts/generate-sw.js` runs after `next build`:

1. Walk `out/`.
2. Skip `sw.js` and `.map` files.
3. Convert files to route URLs:
   - `index.html` → `/`
   - `foo/index.html` → `/foo/`
   - `404.html` → `/404.html`
   - other files → `/<path>`
4. Generate a cache name from a timestamp: `carepath-<14 digits>`.
5. Write `out/sw.js`.

Install:

- Open the versioned cache.
- `Promise.allSettled` over every precache URL.
- `cache.add(new Request(url, { cache: "reload" }))`.
- Failures are swallowed so one missing file does not break installation.
- `skipWaiting()`.

Activate:

- Delete old `carepath-*` caches.
- `clients.claim()`.

Fetch:

- GET only.
- Same-origin only; third-party tiles are not intercepted.
- Look up cached response with `{ ignoreSearch: true }`.
- If cached:
  - return cached immediately;
  - fire a background fetch to update the cache (stale-while-revalidate).
- If not cached:
  - fetch;
  - cache successful responses;
  - on network failure and navigation request, fall back to `/`, `/index.html`, or `/404.html`;
  - otherwise return an Arabic 503 text response.

`ignoreSearch: true` is critical: `/facility/?id=FAY-0001` and `/result/?level=...` match the cached static shells.

`ServiceWorkerRegister.js`:

- Only registers when `NODE_ENV === "production"`.
- Logs a development-only console note explaining that `npm run dev` has no service worker.
- Checks for service-worker support and a secure context (`localhost` or HTTPS).
- Registers `/sw.js` after `window.load`.
- Logs a clear console warning if registration fails instead of failing silently.

---

## 9. Offline/PWA behavior

### Works offline after first successful load

- App shell, CSS, JS chunks
- Arabic Cairo font files
- Decision tree
- All 140 facility records
- All facility details, via the `/facility/` shell + query parameter
- Fayoum boundary GeoJSON
- Map vector layers and facility markers
- Emergency content
- `tel:` links (device dialer)
- Local storage location cache

### Needs internet

- OpenStreetMap basemap tiles
- Google Maps directions links
- Google Maps “hospital near me” link
- First service-worker installation and first load

### PWA metadata

`public/manifest.json`:

- name: `دليلتي الصحية — CarePath`
- short name: `دليلتي`
- `lang: "ar"`, `dir: "rtl"`
- `display: "standalone"`
- `orientation: "portrait"`
- theme `#0f766e`
- background `#f2f6f5`
- 192/512 any icons and 192/512 maskable icons

`app/layout.js` sets:

- `<html lang="ar" dir="rtl">`
- metadata title template
- manifest
- Apple web-app metadata
- icons
- theme color
- `formatDetection: { telephone: true }`

### Verifying offline mode

Offline support is production-only:

```bash
npm run build
npm run preview   # zero-dependency Node server, no npx/network needed
```

Open `http://localhost:3000`, wait for the first load, then check DevTools:

- **Application → Service Workers**: `sw.js` activated and running.
- **Application → Cache Storage**: `carepath-*` with 83 entries.
- **Network → Offline**: reload `/`, `/facility/?id=FAY-0001`, `/result/?level=primary&specialty=family`, `/map/`, `/emergency/`.

This was verified with a fresh browser context and also with the preview server stopped: the cached app shell and facility details still load, and the boundary/markers render without tiles.

Common false negatives:

- `npm run dev` does not register a service worker.
- `http://192.168.x.x` is not a secure context; use `localhost` or HTTPS.
- The 83-URL precache must finish installing after the first load.
- Service-worker registrations and caches are per origin (host + port).
- Some private/incognito modes disable service workers.
- Subpath deployments need a matching `basePath`; the app currently assumes root-absolute URLs.
- OSM tiles are online-only by design; a blank basemap offline is expected.

### Current build output

- `out/` ≈ 2.1 MB
- 84 files in `out/`
- 83 precached URLs in `sw.js`
- 10 HTML pages
- Service worker cache versioned per build

---

## 10. UI, design system, and accessibility

### Design tokens

`app/globals.css` defines:

- Background: `#f2f6f5`
- Surface: `#ffffff`
- Ink: `#10201d`
- Primary teal: `#0f766e`
- Emergency red: `#c0262d`
- Warning amber: `#a9550a`
- Location blue: `#1e40af`
- Radii: 12/18/24/30px
- Shadows: sm / default / lg
- Bottom nav height: `74px`
- Arabic font stack: `"Cairo", "Segoe UI", Tahoma, Arial, sans-serif`

### Typography

- Cairo variable font, weight range `400 800`.
- Self-hosted as three WOFF2 subsets:
  - Arabic
  - Latin extended
  - Latin
- `font-display: swap`.
- Unicode-range rules route Arabic and Latin glyphs to the right subset.
- Self-hosting removed the build-time dependency on Google Fonts and made the build reproducible offline.

### Layout

- Mobile-first.
- Max content width `700px`.
- Bottom padding accounts for nav + safe area:
  `calc(var(--nav-h) + 34px + env(safe-area-inset-bottom))`.
- Five equal nav columns.
- Cards use rounded corners, subtle borders, and soft shadows.
- Home hero has a teal gradient and white CTA.
- Facility results use a horizontal scroll-snap rail.
- Facility lists use vertical rows.
- Map screen uses a responsive height clamp.

### Touch targets

- Buttons: minimum 48–60px.
- Options: 64px minimum.
- Two-column options: 108px minimum.
- Nav items: 48px minimum.
- Chips/buttons: 48px.
- Leaflet zoom controls are 40px — a minor exception to the 48px rule.

### Responsive behavior

- `max-width: 380px`:
  - two-column options collapse to one column,
  - action grid becomes one column,
  - facility cards become 90% width.
- `min-width: 720px`:
  - more top padding,
  - facility cards 46% width.
- `prefers-reduced-motion: reduce`:
  - animations/transitions reduced to near-zero,
  - smooth scroll disabled.

### RTL and Arabic

- Entire document is RTL.
- `text-align: start` used instead of hardcoded left/right.
- Phone numbers use `dir="ltr"` and `unicode-bidi: isolate`.
- Arabic-Egypt locale used for numbers and distances.
- Page titles, empty states, errors, and service worker fallback are Arabic.

### Accessibility

- Skip link to `#main`.
- `:focus-visible` 3px teal outline.
- Progress bar with `role="progressbar"`, `aria-valuenow/min/max`.
- Option group with `aria-label`.
- Buttons use `aria-pressed` for selected/toggle state.
- Facility cards/rows have full-card overlay links with descriptive `aria-label`.
- Phone buttons have `aria-label="اتصال بـ ..."`.
- Map container has `role="region"`, `aria-label`, and `tabIndex={0}`.
- Map status messages use `role="status"`; outside warning uses `role="alert"`.
- Live result banner uses `aria-live="polite"`.
- Decorative icons are `aria-hidden`.
- `formatDetection: telephone` enables phone number detection.

### Trust/verification UX

- Every facility detail shows “غير موثّق ميدانياً” unless `verified`.
- Home, result, emergency, details, and about screens carry disclaimers.
- Details advise calling before travelling.
- Result explicitly says it is guidance, not diagnosis.
- Emergency screen tells users not to drive themselves if severely unwell.

---

## 11. Build, data pipeline, and deployment

### Commands

```bash
npm run dev          # next dev
npm run sync:data    # master dataset → data/ + public/data/
npm run build:geo    # download/build Fayoum boundary
npm run build        # next build + generate-sw.js
npm run preview      # node scripts/serve-out.mjs (no npx/network needed)
npm start            # same as preview
```

### Data pipeline

#### `scripts/sync-facilities.mjs`

Source:

```text
../data/fayoum_health_facilities.json
```

Transforms:

- `services`: split on Arabic semicolon `؛`
- `required_documents`: split on `+`
- `emergency`: `"yes"` → `true`
- `verified`: `"yes"` → `true`
- `lat`/`lon`: number or `null`

Writes:

- `data/facilities.json`
- `public/data/facilities.json`

It prints total and geocoded counts.

#### `scripts/build-geo.mjs`

- Downloads a **pinned commit** of geoBoundaries `gbOpen/EGY/ADM2` simplified GeoJSON.
- Filters Fayoum shape names.
- Maps English names to Arabic.
- Distinguishes Fayoum markaz from Fayoum city by geometry size (`>5000` JSON chars = markaz).
- Rounds coordinates to 5 decimals.
- Writes `public/data/geo/fayoum-markaz.geojson`.
- Validates all geocoded facilities with point-in-polygon.
- Logs facilities outside the boundary.

`build:geo` requires network access; the app build itself does not.

#### `scripts/generate-sw.js`

- Runs after `next build`.
- Requires `out/`.
- Generates `out/sw.js` with a build-specific cache name and the full precache list.

### Build characteristics

- `output: "export"` means no Node server in production.
- `trailingSlash: true` means directory-style static routes.
- `images.unoptimized: true` avoids the Next image optimizer.
- No environment variables are required.
- The app can be hosted on GitHub Pages, Netlify, Cloudflare Pages, S3, nginx, or any static host.
- Service worker requires HTTPS in production.

### Current repository state

- Repo root: `CarePath/`
- Remote: `https://github.com/ibrahim99035/CarePath.git`
- Branch: `main`
- Last commit: `32c8dc5 Build CarePath offline health navigation PWA with Fayoum GIS map`
- Working tree was clean at the time of this handoff.
- Build verified without network after self-hosting Cairo.
- Browser checks reportedly passed at 320px, 390px, and desktop widths.
- Offline checks passed after service-worker installation.

---

## 12. Key implementation details and invariants

These are the things a future AI should preserve unless explicitly changing the design:

1. **No backend.** Do not add API routes, server actions, databases, auth, analytics, or push.
2. **Static export.** Keep `output: "export"` and `trailingSlash: true`.
3. **Query-based detail routes.** Facility details are one static shell, not 140 generated pages.
4. **Bundled data.** Facilities and decision tree are build-time imports.
5. **Offline-first.** Any new core content must be included in the precache or fetched through a cached same-origin path.
6. **Arabic-only RTL.** Do not add an English UI without a product decision.
7. **Emergency override.** A danger sign must remain an immediate route to emergency.
8. **Gating.** Pregnancy/women’s options must remain hidden for infant/child.
9. **Outside-Fayoum warning.** Do not imply Fayoum facilities are nearby when the user is outside.
10. **Distances.** Use Haversine; label them as measured from the user’s current location.
11. **Data trust.** Keep unverified warnings visible.
12. **Touch targets.** Keep primary controls at least 48px.
13. **Emergency number.** Keep `123`.
14. **Map tiles are online-only.** Do not make the core flow depend on tiles.
15. **Service worker cache.** Rebuild `sw.js` after any route/asset/data change.

---

## 13. Known limitations, data issues, and traps

### Data quality

- All 140 facilities are `verified: false`.
- Two facilities lack coordinates:
  - `FAY-0004` — مستشفى يوسف الصديق المركزي
  - `FAY-0140` — مستشفى النقل البري
- One facility lacks a phone:
  - `FAY-0004`
- Three coordinates fall outside the Fayoum boundary:
  - `FAY-0017` — مستشفى التكامل الصحى - قارون — `29.40816, 30.4129`
  - `FAY-0103` — مركز طب فانوس — `29.570298, 30.9483711`
  - `FAY-0111` — مركز طب قوتة — `29.4417945, 30.3789598`
- `build:geo` prints these outliers; they should be fixed at the master-data level and re-synced.
- Only 13 facilities are emergency-capable.
- Some phone numbers may be incomplete or outdated; the UI advises calling first.

### Result-page URL validation gap

`ResultView` trusts the `level` and `specialty` query parameters. Unknown levels fall back to primary, but there is no re-validation of age/gating combinations. A manually crafted URL such as `?level=specialty&specialty=womens` could show women’s health even with no age or a child age. The normal guided flow prevents this via `pruneAnswers` and routing rules, but direct URLs are not hardened. A robust fix would re-check the URL against the decision tree or use an opaque signed state token.

### Guide state is not persisted

Answers live only in React state. Reloading `/guide/` resets them. The result page’s “تعديل الإجابات” link goes to `/guide/` and starts over rather than restoring previous answers.

### Stale public decision tree

`public/data/decision-tree.json` is an older copy that lacks the `available_for` gating on `pregnancy` and `womens`. The runtime imports `data/decision-tree.json`, so the app behaves correctly, but the public copy is stale and is still precached. Keep the two in sync or remove the public copy if it is not needed.

### Map behavior

- Map tiles require network.
- Google Maps directions require network.
- `MapCanvas` with `fit="facilities"` fits only facility markers, not the user. If the user is far outside Fayoum, the user dot may be off-screen on the result map.
- No marker clustering; 140 markers are acceptable at this scale but could become cluttered.
- Map filters are not URL-addressable.
- Leaflet zoom controls are 40px, below the 48px target guideline.
- If the boundary fetch fails, `useArea` returns `unknown` and area notices are hidden.
- Accuracy >20km produces `unknown` with no explicit low-accuracy warning.

### Location cache

- Cached location can be up to 6 hours old.
- The UI marks cached use, but distances may be stale.
- `enableHighAccuracy: false` may produce coarse results; the accuracy thresholds compensate.

### Testing

- No unit tests, integration tests, Playwright tests, or CI are present.
- The geofence, ranking, pruning, and service-worker behavior are not covered by automated tests.
- Recommended additions:
  - Vitest for `lib/decision.js`, `lib/facilities.js`, `lib/geo.js`, `lib/geofence.js`.
  - Playwright geolocation mocks for: inside Fayoum, 10km border buffer, outside, denied permission, >20km accuracy.
  - Offline test: load, install SW, go offline, reload, open facility details, tap `tel:`.

### Minor implementation notes

- `TYPE_ORDER` includes private clinics and pharmacies, but the dataset has none; chips only show types present.
- `facilityCounts()` reports 37 hospitals, 13 emergency, 139 phones; the About page hardcodes 140 total.
- `public/data/facilities.json` is a duplicate of `data/facilities.json`; runtime imports the `data/` copy.
- `AreaNotice` hides on `unknown`; there is no “could not determine area” message.
- `MapScreen` nearest/filter state is not persisted.
- `useLocation` restores cached coordinates without checking current permission state.

---

## 14. How to extend safely

### Add or fix a facility

1. Edit the master dataset:
   `../data/fayoum_health_facilities.json`
2. Run:
   ```bash
   npm run sync:data
   ```
3. Run `npm run build:geo` to validate coordinates against the boundary.
4. Fix any reported outliers.
5. Run `npm run build`.

### Add a question or option

1. Edit `data/decision-tree.json`.
2. Add `available_for` if the option depends on earlier answers.
3. Add or reorder `routing_rules`; order is first-match-wins.
4. If the question changes the maximum count, update the progress logic and the “max 4” product constraint.
5. Keep `public/data/decision-tree.json` in sync or remove it.
6. Rebuild and test both normal and danger paths.

### Add a care level

1. Add an entry under `care_levels` with:
   - display fields,
   - `limit`,
   - `facility_filter.types`,
   - optional `emergency_only`,
   - optional `match_services`.
2. Add a routing rule that can produce the level.
3. Add CSS styling for `.level--<color>`.
4. Ensure `ResultView` and any emergency-specific logic handle it.

### Add a specialty

1. Add `specialties.<id>` with `label` and `service_keywords`.
2. Add an option under the `specialty` question.
3. Add a routing rule if the specialty should map to `specialty` care level.
4. Ensure keywords match the actual `services` strings in the facility data.
5. Be careful with duplicate/overlapping keywords because scoring is additive.

### Update the boundary

1. Edit the pinned source URL in `scripts/build-geo.mjs` only with a deliberate version change.
2. Run `npm run build:geo`.
3. Review the feature count, KB size, and outside-facility report.
4. Rebuild the app so the new GeoJSON is precached.

### Add tests

Recommended structure:

```text
lib/__tests__/decision.test.js
lib/__tests__/facilities.test.js
lib/__tests__/geo.test.js
lib/__tests__/geofence.test.js
e2e/triage.spec.js
e2e/offline.spec.js
```

High-value cases:

- child age hides pregnancy/womens
- stale pregnancy answer pruned after age change
- danger overrides all other answers
- chest/breathing → urgent
- infant fever → urgent
- pregnancy → womens
- dental specialty → specialty
- fallback primary
- service-match ranking
- distance sorting with null coordinates
- top-up behavior under 3 results
- PIP inside/outside/near/unknown
- 2km and 20km accuracy thresholds
- offline facility details and `tel:` links

---

## 15. Quick reference

### Important functions

| Function | File | Responsibility |
|---|---|---|
| `getVisibleOptions` | `lib/decision.js` | Filter options by `available_for` |
| `pruneAnswers` | `lib/decision.js` | Remove invalid downstream answers |
| `evaluateAnswers` | `lib/decision.js` | First-match routing rules |
| `buildResultHref` | `lib/decision.js` | Build `/result/?...` |
| `getCareLevel` | `lib/decision.js` | Care-level lookup with fallback |
| `selectFacilities` | `lib/facilities.js` | Filter, score, rank, limit |
| `browseFacilities` | `lib/facilities.js` | Browse/filter all facilities |
| `typeOptions` | `lib/facilities.js` | Type chips with counts |
| `facilityCounts` | `lib/facilities.js` | Home/about counts |
| `haversineKm` | `lib/geo.js` | Great-circle distance |
| `addDistance` | `lib/geo.js` | Add `distance` to facility |
| `formatDistance` | `lib/geo.js` | Arabic distance formatting |
| `loadBoundary` | `lib/geofence.js` | Fetch/cache GeoJSON |
| `analyzeLocation` | `lib/geofence.js` | Inside/near/outside/unknown |
| `useLocation` | `lib/useLocation.js` | GPS + 6h cache |
| `useArea` | `lib/useArea.js` | Coords + boundary → area |
| `MapCanvas` | `components/MapCanvas.js` | Shared Leaflet map |
| `MapScreen` | `components/MapScreen.js` | Map tab UI |
| `QuestionFlow` | `components/QuestionFlow.js` | Triage state machine |

### Important constants

| Constant | Value |
|---|---|
| `NEAR_BUFFER_KM` | `10` |
| `UNRELIABLE_ACCURACY_M` | `20000` |
| `APPROXIMATE_ACCURACY_M` | `2000` |
| `FAYOUM_CENTER` | `{ lat: 29.31, lon: 30.84 }` |
| `FAYOUM_BOUNDS` | `[[29.05, 30.3], [29.62, 31.15]]` |
| Facility limit | `6` |
| Location cache TTL | `6 hours` |
| Geolocation timeout | `12 seconds` |
| Map tile max zoom | `19` |
| Emergency number | `123` |

### Build artifacts

| Item | Value |
|---|---|
| Static output | `out/` |
| Size | ≈ 2.1 MB |
| Files | 84 |
| Precached URLs | 83 |
| HTML pages | 10 |
| Facility records | 140 |
| Boundary features | 8 |
| Boundary size | ≈ 20 KB |
| Font files | 3 WOFF2 |

---

## 16. One-paragraph summary for another AI

CarePath is a static-export Next.js 16 / React 19 PWA for Arabic-speaking Fayoum residents. It uses a JSON decision tree with four questions to produce one of four care levels, with danger signs short-circuiting to emergency. Facility data is bundled at build time and ranked by care-level type filters, specialty service-keyword matches, emergency status, and Haversine distance. A Leaflet map renders Fayoum boundary polygons from a bundled GeoJSON file, color-coded facility markers, and the user’s location/accuracy circle; map tiles are online-only while vectors and facility data work offline. A generated service worker precaches every static asset and uses stale-while-revalidate with `ignoreSearch`, so query-based pages like `/facility/?id=...` and `/result/?...` work offline. A geofence module uses ray-casting point-in-polygon and local planar distance-to-boundary to classify the user as inside, near (10km), outside, or unknown, with accuracy thresholds at 2km and 20km. The app has no backend, accounts, analytics, or push; location is cached locally for six hours; all facility records are currently unverified and three coordinates need correction.
