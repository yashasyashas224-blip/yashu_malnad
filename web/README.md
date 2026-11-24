# MCE Smart Campus Navigator

A mobile-first campus map for **Malnad College of Engineering, Hassan**. Visitors can
search verified campus places, see them on a map embedded in the page, ask a
grounded campus assistant, scan a campus QR code and hand walking directions to Google Maps.

It also offers campus walking routes (with a step-free filter), a classroom finder,
accessibility details, facility status, campus events, installable offline support and
an English/Kannada interface with optional voice guidance. All seven extras read from
`src/data/*.ts` and refuse to state anything that has not been surveyed — see
“Features added in v0.2” below.

This folder is a Vite + React + TypeScript app.
It is the replacement front end for the deployed experience at
`https://yashu-malnad-xi.vercel.app/`, keeping the navy-and-gold MCE identity and
the original Explore / Assistant / QR / SOS navigation on small screens.

## What works

- **Embedded campus map** (Leaflet, no API key): all verified places pinned and
  labelled, category colours, campus boundary, zoom, “show all landmarks”
  recenter, street/satellite switch, and a “show my location” control that asks
  for permission only when pressed. Nothing redirects to Google Maps just to see
  the campus.
- **Synchronised results list** next to the map on desktop and in an Explore
  sheet on mobile, so every pin is reachable without tapping the map.
- **Smart search** with autocomplete, aliases (`CSE`, `main gate`, `food`,
  `hostel`), typo tolerance, category filters, keyboard support and clear
  empty/loading states.
- **Campus assistant** that answers only from the verified location dataset.
  It refuses to invent buildings, hours, accessibility details or indoor
  routes, and points to the official MCE site when it cannot verify something.
- **QR scanner** that requests the camera only after a button press, decodes
  with ZXing, stops the stream on success/close, and only accepts known
  location IDs or validated campus URLs.
- **Directions** with a consent-based “my location” option, a verified campus
  start point, or a plain Google Maps handoff. No indoor turn-by-turn claims.
- **Accessibility**: keyboard combobox and list, visible focus rings,
  descriptive labels, 44 px touch targets, a high-contrast toggle, and
  reduced-motion support.
- **Pins stay put**: search and category filters dim non-matching pins instead
  of removing them, so the whole campus stays oriented on the map.

## Features added in v0.2

Every one of these is wired into the existing map, search, place card, assistant
and QR flow rather than living on its own page.

- **Campus walking routes** (`src/components/RoutePlanner.tsx`,
  `src/lib/routing.ts`, `src/data/routes.ts`). Dijkstra over a small walking
  network, distance and walking time, compass-bearing steps, “my location” as a
  start point and a Google Maps handoff. Segments are currently
  `survey: 'provisional'`, so every route is drawn dashed and labelled
  **“Indicative — not surveyed”**. Replace a segment's survey fields with real
  surveyed geometry to make it a solid, confident route.
- **Step-free routing.** The step-free toggle only routes over segments marked
  `stepFree: 'confirmed'`. While no such segment exists the planner refuses and
  says so instead of guessing.
- **Classroom finder** (`src/components/ClassroomFinder.tsx`,
  `src/data/classrooms.ts`). Search by room, department or building and jump to
  the building pin. The dataset ships empty; there are no invented room numbers
  or course-to-room assignments.
- **Accessibility details** (`src/components/AccessibilitySheet.tsx`,
  `src/data/accessibility.ts`). Lists surveyed entrances, ramps, lifts,
  washrooms and parking, and can highlight the related places on the map.
- **Facility hours and status** (`src/data/facilities.ts`). Opening hours,
  “status unconfirmed” / “temporarily closed” badges and a saved-snapshot note
  so static hours are never presented as live.
- **Campus events** (`src/components/EventsSheet.tsx`, `src/data/events.ts`).
  Upcoming and past listings, computed expiry, and a link to the place where an
  event is held. The dataset ships empty until MCE publishes confirmed events.
- **Offline / installable** (`public/sw.js`, `public/manifest.webmanifest`,
  `src/lib/offline.ts`). A hand-written service worker caches the app shell,
  hashed assets and fonts, shows an offline banner and keeps an offline map
  notice on the map. **Map tiles are deliberately never cached** — that would
  break the OSM and Esri tile usage policies — so the pins, list, routes and
  cards work offline while basemap imagery needs a connection.
- **English + Kannada, with voice** (`src/lib/i18n.tsx`,
  `src/lib/speech.ts`). A typed dictionary pair keeps the two locales in sync
  (TypeScript fails the build if a key is missing), the choice is remembered in
  `localStorage`, and Speech Synthesis reads route steps and place cards aloud.
  If the device has no Kannada voice the app says it is falling back to English.

No new npm dependencies were added for any of this: the router, i18n, speech,
service worker and PNG app icon are all plain TypeScript and browser APIs.

### Campus data still needed

These features are honest but thin because the underlying facts are not
published. Fill them in as MCE supplies them; each file's header documents the
schema.

| File | Needs |
| --- | --- |
| `src/data/routes.ts` | Surveyed centre-line geometry and step-free/step classification per segment |
| `src/data/accessibility.ts` | Accessibility survey: entrances, ramps, lifts, washrooms, parking |
| `src/data/classrooms.ts` | Room inventory and the department/building each room belongs to |
| `src/data/facilities.ts` | Official opening hours and time-limited status changes |
| `src/data/events.ts` | Confirmed events, dates, venues and organiser links |

## Run the site

```bash
cd web
npm install
```

No API key or environment file is needed; the map ships with the app and loads
public tiles. The offline cache needs HTTPS (or localhost), which Vercel
provides.

Then:

```bash
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build into web/dist
npm run preview  # serve the production build
```

From the repository root you can also use `npm run dev:web` and
`npm run build:web`.

## Map, tiles and landmarks

The map is rendered **inside the site** with Leaflet, which is bundled with the
app, so viewing the campus never sends you to Google Maps and no API key or
account is involved:

- **Street map:** OpenStreetMap standard tiles, © OpenStreetMap contributors (ODbL).
- **Satellite:** Esri World Imagery, © Esri, Maxar, Earthstar Geographics.
- **Campus outline:** OpenStreetMap way
  [288781302](https://www.openstreetmap.org/way/288781302).

All eight verified landmarks are pinned with permanent labels. The list beside
the map (desktop) and the Explore sheet (mobile) reach the same places without
tapping the map, and “Show all landmarks” recenters on the campus outline.
Attribution stays visible on the map.

If the site grows well beyond this campus, review the
[OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/)
or point `STREET_TILES` / `SATELLITE_TILES` in
`src/components/MapPanel.tsx` at your own tile provider. For Vercel, deploy
with the project root set to `web/`; no environment variables are required.

## Verified location data

All places live in one maintainable file:
[`src/data/locations.ts`](src/data/locations.ts). Each entry has a name,
category, coordinates, description, aliases, optional accessibility notes,
Google place ID, source URL and the date the listing was checked.

A place is only added when its **name and position** can be verified. Current
verified pins (checked 23 November 2026):

| Place | Category | Position source |
| --- | --- | --- |
| Main Gate | Entrance | Google Maps listing |
| Main Academic Block | Academic | Google Maps listing (“Mechanical Seminar Hall”, MCE Main Block) |
| CS&E Department | Academic | Google Maps listing |
| Central Library | Library | Google Maps listing |
| Canteen | Food | Google Maps listing (listed temporarily closed in Oct 2026) |
| Boys Hostel | Hostel | Google Maps listing |
| Play Ground | Sports | Google Maps listing |
| Divya Chaitanya | Landmark | Named OpenStreetMap feature + official MCE page |

The campus outline comes from OpenStreetMap way
[288781302](https://www.openstreetmap.org/way/288781302) and is shown with
ODbL attribution (`© OpenStreetMap contributors`).

### Deliberately left off the map

These are named on official MCE pages but have **no verified position**, so the
interface does not pin them:

- Administrative office / Principal’s office
- Examination section and Training & Placement office
- Auditorium, seminar halls beyond the main-block listing
- Health centre, security office, parking areas, bus stop
- Girls hostel (outside the main campus)
- Other departments (Civil, Mechanical, EEE, ECE, EIE, ISE, AI&ML, CSBS)
- Indoor rooms, corridors, lifts and floor plans

To add any of them, survey the position, then add an entry in `locations.ts`
with a source URL and `verification.checkedOn`. The map, search, assistant and
results list all use the same file automatically.

## QR code format

Campus QR codes are accepted in two forms:

1. A known location ID, for example `central-library` or `cse-department`.
2. A campus URL, for example
   `https://yashu-malnad-xi.vercel.app/?place=central-library`
   (also `/place/central-library` and `#place=central-library`).

The resolver allows only `yashu-malnad-xi.vercel.app`, the current host, and the
`mcehassan.ac.in` domains. Unknown IDs, non-campus hosts and non-web schemes are
rejected with an explanation and a manual-search fallback; scanned URLs are
never opened automatically. Generate codes with any QR generator using the
formats above.

## Privacy

- The assistant is rule-based and runs in the browser. Messages are held in
  component state only; nothing is stored or sent to a third-party AI service.
- Location access is requested only after a user action, is used for the map dot
  and Google Maps directions, and is not stored.
- QR camera video stays in the browser and stops when the scanner closes or a
  code is read.
- The site has no accounts, analytics or tracking scripts.

## Checks

Run in `web/`:

```bash
npm run typecheck   # passed
npm run build       # passed (tsc --noEmit + vite build)
```

Checked in a browser at `http://127.0.0.1:5173/`: route planning
(Main Gate → Canteen, 140 m / 2 min, dashed “Indicative — not surveyed”
line), the step-free refusal, Kannada switching, facility and accessibility
blocks on a place card, the offline banners, and the service worker,
manifest and icon responses.


The map, geolocation prompt and camera flow need a real browser; the build check
only covers types and bundling. The embedded map needs no credential, so it
renders tiles and pins as soon as the page loads.
