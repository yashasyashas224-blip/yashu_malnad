# MCE Smart Campus Navigator
### Malnad College of Engineering (MCE), Hassan, Karnataka, India
**Intelligent Campus Navigation & Spatial Administration Platform**

---

## 1. Official Institution Information

* **Institution:** Malnad College of Engineering (MCE)
* **Address:** No. 21, Salagame Road, Rangoli Halla, Hassan, Karnataka 573202, India
* **Campus Area:** ~41.28 Acres (Institutional ground survey)
* **Official Website:** [https://www.mcehassan.ac.in/](https://www.mcehassan.ac.in/)
* **Coordinates:** Latitude `13.02365° N`, Longitude `76.10354° E`
* **OpenStreetMap Way ID:** `way 288781302` (`amenity=college`)
* **OpenStreetMap Node ID:** `node 2373974941`

---

## 2. Institutional Inspection & Geographical Analysis

### What Map Data Is Available
* **Campus Boundary:** OpenStreetMap `way 288781302` delineates the 41.28-acre polygon perimeter bounded by Salagame Road to the west/northwest and Rangoli Halla neighborhood to the south and east.
* **Campus Center & Elevation:** Center coordinates at `13.02365° N, 76.10354° E` (~940m MSL elevation).
* **Main Access Gate:** Front access along Salagame Road (`13.02380° N, 76.10185° E`) with vehicular barriers and 24/7 security watch.
* **Outdoor Walkway Network:** Paved arterial pathways connecting the front Salagame Road quadrangle to the Administrative Block, Central Library, Academic complex, and eastern hostel zones.

### What Map Data Is Missing
* **Micro-Corridor Interior Blueprints:** OpenStreetMap and public GIS repositories contain external building perimeters, but lack multi-floor room partition details.
* **Indoor GPS Signals:** Concrete multi-story engineering structures attenuate satellite GNSS signals. Satellite GPS cannot provide floor or room-level precision inside academic blocks.
* **Real-Time Pathway Maintenance:** Temporary construction or pipeline closures are not tracked by public map providers.

### Which Buildings Can Be Identified (Verified)
1. **Administrative Block (Main Building - ADMIN):** Principal's Office, Autonomous Examination Section, Registrar, Accounts, and Academic Deans.
2. **Computer Science & Information Science Complex (CS-IS):** Departments of CSE, ISE, and CSE (AI & ML), high-performance computing clusters, and Dr. P. Sandhya's AI & ML Laboratory (CS-204).
3. **Civil Engineering Department (CED):** Foundation block (est. 1960), housing the Concrete & Highway Materials Testing Lab, Geotechnical Lab, and Surveying Centre.
4. **Mechanical Engineering Complex & Workshops (MECH):** Central Machine Shop, Foundry & Forging Bay, CNC Studio, and Thermal/Fluids suites.
5. **Electronics & Communication Engineering Block (ECE):** VLSI Design, DSP, and Embedded Systems laboratories.
6. **Electrical & Electronics Engineering Block (EEE):** Power Systems and Electric Machines bays.
7. **MCE Central Library & Digital Information Centre (LIB):** 94,000+ volumes, IEEE digital access terminals, and 300-seat reading hall.
8. **Training & Placement Centre & MCE Auditorium (T&P):** Pre-placement interview suites and campus briefing auditorium.
9. **ME-RIISE Foundation:** Section 8 Technology Business Incubator (TBI) and AICTE IDEA Lab prototyping suites.
10. **Boys Hostels Complex:** On-campus Hoysala, Hemavathi, and Hasanamba blocks.
11. **Campus Canteen & Cafeteria:** Student dining hub and coffee station.
12. **MCE Sports Complex & Athletic Grounds:** Cricket/football oval and indoor stadium.
13. **Spiritual Enclave:** Shree Ganapathi Temple and Dhyana Mandira (Divya Chaithanya meditation hall).
14. **Campus Health & Medical Centre:** First aid and emergency medical station near the main gate.

### Which Locations Need Physical Verification (`needs_verification`)
* Specific departmental sub-classrooms (e.g. CV-108 CAD annex, ME-012 Fluid Sub-bay).
* Individual room interior offsets and secondary fire escape staircases.
* *Protocol:* The platform explicitly flags these with `verificationStatus: "needs_verification"`, preventing false indoor claims, and provides an administrator visual map editor to calibrate them upon on-site survey.

### How the Real MCE Campus Map Is Integrated
1. **Interactive Vector Canvas:** Renders MapLibre GL with the surveyed MCE Hassan campus boundary polygon (`/api/campus/geojson`).
2. **Graph-Based Routing Engine:** Outdoor and multi-floor indoor nodes and edges with real ground distances (meters) calculated via the Haversine formula along paved walkways.
3. **Dynamic Routing Modes:**
   * **Shortest Route:** A* / Dijkstra path minimizing travel distance.
   * **Easiest Route:** Minimizes stairs, prefers broad paved promenades and elevator ascents.
   * **Accessible Route:** 100% stair-free, routing exclusively through wheelchair ramps and elevator elevators.
   * **Obstacle Detour:** Automatically reroutes around edges marked as blocked by campus administration.
4. **Indoor Positioning via QR Checkpoints:** QR codes mounted at physical entrances and floor landings calibrate the user's indoor position and floor level with zero GPS dependency.

### How MCE-Only Authentication Is Enforced
* **Zero Foreign College Access:** Students from other universities or colleges cannot register or access navigation services.
* **Authoritative Master Roster Check:** Every registration must match an active MCE Student USN (e.g. `4MC22CS045`, `4MC23IS012`) or Staff Employee ID (`MCE-FAC-014`).
* **Two-Factor OTP Verification:** Mandatory phone and email OTP verification with cryptographic random tokens, 5-minute expiration, 60-second cooldown, and attempt limits.
* **Google Sign-In Linkage:** Google OAuth alone is explicitly rejected unless linked to a previously verified MCE institutional record.
* **Role-Based Server Authorization:** Every protected API validates JWT tokens on the server against roles (`student`, `faculty`, `staff`, `campus_admin`, `super_admin`). Inactive or suspended accounts are immediately blocked.

---

## 3. Technology Stack

* **Mobile Client Application:** React 19, TypeScript, Vite, MapLibre GL, Tailwind CSS, Lucide Icons, Web Speech API (Voice Guidance).
* **Administration Dashboard & Map Editor:** React 19, TypeScript, MapLibre GL, Tailwind CSS, Visual Node/Edge Drawer, Verification Desk.
* **Backend API Server:** Node.js, Express.js, TypeScript, TSX, JWT, Bcrypt.js, CORS.
* **Database & Spatial Engine:** PostgreSQL + PostGIS spatial schema (`schema.sql`) with spatial indices (`GIST`) and zero-friction SQLite/JSON persistence layer for offline fallback.
* **AI Campus Assistant:** Grounded semantic RAG engine strictly querying verified MCE records without hallucination.

---

## 4. Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── data/
│   │   │   ├── database.ts             # State store & audit logger
│   │   │   ├── mceCampusData.ts        # Surveyed MCE buildings, nodes & edges
│   │   │   ├── mceRoster.ts            # Authoritative MCE student/staff whitelist
│   │   │   ├── mceScheduleData.ts      # Class schedules & timetable
│   │   │   └── schema.sql              # Production PostgreSQL/PostGIS schema
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts       # MCE verification & admin guards
│   │   ├── models/
│   │   │   └── types.ts                # TypeScript domain models
│   │   ├── routes/
│   │   │   ├── admin.ts                # Map editor, verifications, analytics
│   │   │   ├── ai.ts                   # AI campus assistant API
│   │   │   ├── auth.ts                 # Registration, OTP, login, Google link
│   │   │   ├── campus.ts               # Buildings, departments, geojson
│   │   │   ├── emergency.ts            # SOS and emergency routing
│   │   │   ├── locationshare.ts        # Time-limited peer location sharing
│   │   │   ├── navigation.ts           # Dijkstra/A* routing, QR resolution
│   │   │   ├── search.ts               # Real-time smart search
│   │   │   └── timetable.ts            # Classroom finder
│   │   ├── services/
│   │   │   ├── aiAssistantService.ts   # Grounded conversational assistant
│   │   │   ├── authService.ts          # MCE-only registry verification
│   │   │   └── navigationService.ts    # Graph routing engine
│   │   └── server.ts                   # Express application entrypoint
│   └── package.json
├── client/                             # Mobile navigation web/PWA application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIAssistantModal.tsx
│   │   │   ├── AuthModal.tsx
│   │   │   ├── ClassroomFinderModal.tsx
│   │   │   ├── EmergencyModal.tsx
│   │   │   ├── IndoorQRModal.tsx
│   │   │   ├── LocationShareModal.tsx
│   │   │   ├── MapLibreMap.tsx
│   │   │   ├── NavigationCard.tsx
│   │   │   └── SearchOverlay.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── admin/                              # Responsive MCE administration dashboard
│   ├── src/
│   │   ├── App.tsx                     # Visual Map Editor & Verification Desk
│   │   └── main.tsx
│   └── package.json
├── tests/
│   └── runAllTests.ts                  # Automated test suite (16 tests)
└── README.md
```

---

## 5. Quickstart & Execution

### 1. Run Automated Test Suite
```bash
cd backend
npm test
```
*Executes all 16 integration tests verifying MCE-only registration, non-MCE account rejection, OTP generation & cooldown, Google linkage, Dijkstra/A* routing, accessible routing, blocked pathway detours, indoor QR checkpoint resolution, and AI assistant grounding.*

### 2. Start the Backend API Server
```bash
cd backend
npm run dev
# Running on http://localhost:5001
```

### 3. Start the Client Mobile Application
```bash
cd client
npm run dev
# Running on http://localhost:3000
```

### 4. Start the Admin Dashboard & Visual Map Editor
```bash
cd admin
npm run dev
# Running on http://localhost:3001
```

### 5. Production Build
```bash
# Backend build
cd backend && npm run build

# Client build
cd ../client && npm run build

# Admin build
cd ../admin && npm run build
```

---

## 6. Default Demo Credentials

* **Campus Administrator / Principal:**
  * Email: `principal@mcehassan.ac.in`
  * Password: `MceAdmin@2025`
  * Role: `super_admin`
* **Verified MCE Student (Roster Whitelist):**
  * Full Name: `Yashaswini K S`
  * USN: `4MC22CS045`
  * Official Email: `yashaswini.22cs045@mcehassan.ac.in`
  * Phone: `+91 9448123456`
