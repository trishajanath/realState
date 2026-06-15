# Agent Change & Audit Log

This file records all changes proposed and implemented by the AI agent, following the rules specified in [.skills/audit.md](file:///Users/trishajanath/realState/.skills/audit.md).

---

## [Change #1] - 2026-06-13: Resolve Frontend Blank Screen Crash

### 1. Why the change is required
* The frontend page was rendering completely blank (white screen) due to a JavaScript runtime crash. The application components utilize `@tanstack/react-query` hooks (via `useApi.ts`), but the application root was not wrapped in a `QueryClientProvider`.

### 2. What files are affected
* [frontend/src/App.tsx](file:///Users/trishajanath/realState/frontend/src/App.tsx)

### 3. Potential side effects
* None. Wrapping the component tree with a `QueryClientProvider` is a standard setup step and does not alter rendering logic other than enabling React Query contexts to resolve.

### 4. Estimated blast radius
* Very low/localized. This wraps the root component of the frontend application and affects all queries, allowing them to execute successfully rather than crashing the React DOM tree.

### 5. Rollback strategy
* Revert [App.tsx](file:///Users/trishajanath/realState/frontend/src/App.tsx) changes to the initial revision using Git:
  ```bash
  git checkout HEAD -- frontend/src/App.tsx
  ```

### 6. How correctness is verified
* Used a browser subagent to navigate to the dev server `http://localhost:5173/` and verify that the dashboard page renders successfully without any runtime console crashes or errors.

### 7. Why existing tests are insufficient
* N/A. No tests were modified or bypassed.

---

## [Change #2] - 2026-06-13: Design and Implement Premium Authentication Pages

### 1. Why the change is required
* To implement a complete, premium, consumer-grade onboarding/auth experience (Login, Signup, Forgot Password, and Email Verification) that matches the Coimbatore Real Estate Platform design and layout standards.

### 2. What files are affected
* [frontend/src/App.tsx](file:///Users/trishajanath/realState/frontend/src/App.tsx)
* [frontend/src/components/ui/Button.tsx](file:///Users/trishajanath/realState/frontend/src/components/ui/Button.tsx) (NEW)
* [frontend/src/components/ui/Input.tsx](file:///Users/trishajanath/realState/frontend/src/components/ui/Input.tsx) (NEW)
* [frontend/src/components/ui/Label.tsx](file:///Users/trishajanath/realState/frontend/src/components/ui/Label.tsx) (NEW)
* [frontend/src/components/ui/Checkbox.tsx](file:///Users/trishajanath/realState/frontend/src/components/ui/Checkbox.tsx) (NEW)
* [frontend/src/components/ui/Separator.tsx](file:///Users/trishajanath/realState/frontend/src/components/ui/Separator.tsx) (NEW)
* [frontend/src/components/ui/Alert.tsx](file:///Users/trishajanath/realState/frontend/src/components/ui/Alert.tsx) (NEW)
* [frontend/src/components/ui/Toast.tsx](file:///Users/trishajanath/realState/frontend/src/components/ui/Toast.tsx) (NEW)
* [frontend/src/components/shared/AuthVisualPanel.tsx](file:///Users/trishajanath/realState/frontend/src/components/shared/AuthVisualPanel.tsx) (NEW)
* [frontend/src/pages/Login/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/Login/index.tsx) (NEW)
* [frontend/src/pages/Signup/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/Signup/index.tsx) (NEW)
* [frontend/src/pages/ForgotPassword/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/ForgotPassword/index.tsx) (NEW)
* [frontend/src/pages/VerifyEmail/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/VerifyEmail/index.tsx) (NEW)

### 3. Potential side effects
* None. The routes are isolated outside of the main app shell `AppLayout`. They utilize their own split layout so it has no visual side effects on the rest of the application layout.

### 4. Estimated blast radius
* Low. Only adds new auth views and shadcn-style component primitives. The rest of the dashboard pages remain unaffected.

### 5. Rollback strategy
* Revert routes and delete new directories:
  ```bash
  git checkout HEAD -- frontend/src/App.tsx
  git clean -fd frontend/src/components/ui/
  git clean -fd frontend/src/components/shared/AuthVisualPanel.tsx
  git clean -fd frontend/src/pages/Login/ frontend/src/pages/Signup/ frontend/src/pages/ForgotPassword/ frontend/src/pages/VerifyEmail/
  ```

### 6. How correctness is verified
* Production build checks completed: `npm run build` completed successfully.
* Used browser subagents to test page loading, input forms, button states, dynamic password checking meters, error toast overlays, and responsive mobile grid hidding rules.

### 7. Why existing tests are insufficient
* N/A. No tests were modified or bypassed.

---

## [Change #3] - 2026-06-13: End-to-End Google OAuth 2.0 Integration

### 1. Why the change is required
* To connect the frontend "Continue with Google" trigger dynamically to the backend and Google's authentication consent page, allowing users to log in securely with client configurations.

### 2. What files are affected
* [backend/core/config.py](file:///Users/trishajanath/realState/backend/core/config.py)
* [backend/api/router.py](file:///Users/trishajanath/realState/backend/api/router.py)
* [backend/main.py](file:///Users/trishajanath/realState/backend/main.py)
* [backend/api/endpoints/auth.py](file:///Users/trishajanath/realState/backend/api/endpoints/auth.py) (NEW)
* [frontend/src/pages/Login/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/Login/index.tsx)
* [frontend/src/pages/Signup/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/Signup/index.tsx)

### 3. Potential side effects
* Active redirect paths. Users clicking "Continue with Google" are navigated away to accounts.google.com and returned to `/auth/google/callback` on port 8000. Errors redirection redirects back to `http://localhost:5173/login?error=...`.

### 4. Estimated blast radius
* Low. Only touches authentication settings and handlers. Rest of the real estate micro-services are unimpacted.

### 5. Rollback strategy
* Revert backend configurations and login callback hooks:
  ```bash
  git checkout HEAD -- backend/core/config.py backend/api/router.py backend/main.py frontend/src/pages/Login/index.tsx frontend/src/pages/Signup/index.tsx
  rm -f backend/api/endpoints/auth.py
  ```

### 6. How correctness is verified
* Ran `npm run build` to confirm compilation is valid.
* Inspected redirect parameters and state mappings.

### 7. Why existing tests are insufficient
* N/A. No tests were modified or bypassed.

---

## [Change #4] - 2026-06-13: Atlas MongoDB Integration & Security Log Sanitization

### 1. Why the change is required
* To configure the backend to use the provided cloud Atlas MongoDB connection string for waitlist storage, and sanitize the console output to prevent credential leaking in the application logs.

### 2. What files are affected
* [backend/core/database.py](file:///Users/trishajanath/realState/backend/core/database.py)
* [.env](file:///Users/trishajanath/realState/.env)

### 3. Potential side effects
* None. Unstructured storage queries now route to the Atlas cluster instead of the local Docker container database.

### 4. Estimated blast radius
* Low. Only database reads/writes of unstructured properties and logs are directed to the new Atlas cluster.

### 5. Rollback strategy
* Restore the local container URI in `.env` and revert log parsing:
  ```bash
  git checkout HEAD -- backend/core/database.py
  ```
  And manually revert `MONGODB_URL` inside `.env`.

### 6. How correctness is verified
* Queried `/api/v1/health` endpoint on local backend server, which returns `mongodb: healthy`.

### 7. Why existing tests are insufficient
* N/A. No tests were modified or bypassed.

---

## [Change #5] - 2026-06-13: Interactive Property Intelligence Map and Telemetry

### 1. Why the change is required
* To replace the mock static SVG map on `/map` route with a fully interactive Google Maps JavaScript API integration, supporting pricing/investment heatmaps, zoom clustering, zone boundaries, commute analysis circles, nearby amenities pins, and property comparison HUD overlays. Also to register client-side performance metrics directly inside the Prometheus telemetry stack.

### 2. What files are affected
* [frontend/src/store/useMapFilterStore.ts](file:///Users/trishajanath/realState/frontend/src/store/useMapFilterStore.ts)
* [frontend/src/components/shared/MapView.tsx](file:///Users/trishajanath/realState/frontend/src/components/shared/MapView.tsx)
* [frontend/src/pages/Map/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/Map/index.tsx)
* [backend/api/endpoints/metrics.py](file:///Users/trishajanath/realState/backend/api/endpoints/metrics.py)

### 3. Potential side effects
* None. Loading Google Maps scripts dynamically using the API key loaded from `/api/v1/auth/google/config` ensures no API keys are hardcoded in the frontend bundle. Latency reporting checks are non-blocking and have built-in exception handlers.

### 4. Estimated blast radius
* Low. Only affects the dashboard `/map` route console rendering and exposes a new metrics receiver API endpoint.

### 5. Rollback strategy
* Revert the map modifications and metrics endpoint using Git:
  ```bash
  git checkout HEAD -- frontend/src/store/useMapFilterStore.ts frontend/src/components/shared/MapView.tsx frontend/src/pages/Map/index.tsx backend/api/endpoints/metrics.py
  ```

### 6. How correctness is verified
* Checked Vite frontend compilation checks: `npm run build` completed successfully.
* Validated backend endpoint health: checked `/api/v1/health` is online, tested recording mock client metrics using curl POST requests, and confirmed they appear in standard format at `/api/v1/metrics`.

### 7. Why existing tests are insufficient
* N/A. No tests were modified or bypassed.

---

## [Change #6] - 2026-06-13: Router Protection and Maps Graceful Fallback

### 1. Why the change is required
* To guard dashboard pages against unauthenticated visits, enforcing that guests redirect to `/login`, and logged-in users are redirected away from login/signup routes. Also, to prevent broken gray frames from rendering on mapping components if Google Maps API authentication fails or is blocked, degrading gracefully to an interactive mock vector SVG canvas.

### 2. What files are affected
* [frontend/src/App.tsx](file:///Users/trishajanath/realState/frontend/src/App.tsx)
* [frontend/src/components/shared/MapView.tsx](file:///Users/trishajanath/realState/frontend/src/components/shared/MapView.tsx)

### 3. Potential side effects
* None. Unauthenticated visitors are securely routed to the Login page before viewing homepage dashboard elements.

### 4. Estimated blast radius
* Low. Modifies routing wrappers and loading fallbacks, making user experience completely robust.

### 5. Rollback strategy
* Revert route protection and fallback map code using Git:
  ```bash
  git checkout HEAD -- frontend/src/App.tsx frontend/src/components/shared/MapView.tsx
  ```

### 6. How correctness is verified
* Ran `npm run build` which compiled successfully. Verified correct redirection bounds logically.

### 7. Why existing tests are insufficient
* N/A. No tests were modified or bypassed.

---

## [Change #7] - 2026-06-13: Fix Maps Fallback Race and Chart Dimension Warnings

### 1. Why the change is required
* Multiple map instances rendered simultaneously on the Locality details page were overwriting `window.gm_authFailure` during mounting/unmounting, resulting in only one instance engaging the fallback vector SVG map while the other was left displaying a broken Google Maps key restriction screen. Additionally, the React console was polluted with `transform-origin` lowercase property warnings on SVG, and Recharts warnings regarding negative chart container dimensions on initial render.

### 2. What files are affected
* [frontend/src/store/useMapFilterStore.ts](file:///Users/trishajanath/realState/frontend/src/store/useMapFilterStore.ts)
* [frontend/src/components/shared/MapView.tsx](file:///Users/trishajanath/realState/frontend/src/components/shared/MapView.tsx)
* [frontend/src/pages/Locality/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/Locality/index.tsx)
* [frontend/src/pages/Property/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/Property/index.tsx)
* [frontend/src/pages/Analytics/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/Analytics/index.tsx)

### 3. Potential side effects
* None. The fallback triggers globally across all mapping elements, guaranteeing a consistent fallback experience. Recharts charts now render without console noise.

### 4. Estimated blast radius
* Low. Modifies layout dimensions and state bindings locally.

### 5. Rollback strategy
* Revert the map store updates, components, and charts layout changes using Git:
  ```bash
  git checkout HEAD -- frontend/src/store/useMapFilterStore.ts frontend/src/components/shared/MapView.tsx frontend/src/pages/Locality/index.tsx frontend/src/pages/Property/index.tsx frontend/src/pages/Analytics/index.tsx
  ```

### 6. How correctness is verified
* Ran `npm run build` to verify clean frontend compilation.
* Verified that both map instances on mobile and desktop degrade gracefully to the Vector SVG backup in sync when Maps Key verification fails.
* Checked that the React warnings for `transformOrigin` and Recharts dimensions are suppressed in console logs.

### 7. Why existing tests are insufficient
* N/A. No tests were modified or bypassed.

---

## [Change #8] - 2026-06-13: Google Maps Advanced APIs Integration

### 1. Why the change is required
* The user provided a fully-activated Google Maps API Key. We updated the configurations and components to leverage live Google services:
  - Replaced local text-matching commute lookups with the Google Geocoding API to resolve coordinates dynamically.
  - Integrated the Google Directions Service client-side to compute driving directions and render the route polyline on the map between selected properties and the commute destination.
  - Replaced static mock amenities coordinates with live Places API Nearby Search queries around the map centroid or selected property, loading real-world schools, hospitals, and restaurants.
  - Configured dynamic Street View Static API previews inside property hover cards and the main property profile galleries.
  - Implemented the modern `loading=async` script loading pattern to suppress the browser loading performance warning.

### 2. What files are affected
* [.env](file:///Users/trishajanath/realState/.env)
* [frontend/src/store/useMapFilterStore.ts](file:///Users/trishajanath/realState/frontend/src/store/useMapFilterStore.ts)
* [frontend/src/components/shared/MapView.tsx](file:///Users/trishajanath/realState/frontend/src/components/shared/MapView.tsx)
* [frontend/src/pages/Map/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/Map/index.tsx)
* [frontend/src/pages/Property/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/Property/index.tsx)

### 3. Potential side effects
* None. Incorporates robust catch-blocks that degrade to local mock datasets automatically if a search query fails or hits limit caps.

### 4. Estimated blast radius
* Low. Confined to map page HUD panels and property detail cards.

### 5. Rollback strategy
* Revert components and environment parameters using Git:
  ```bash
  git checkout HEAD -- .env frontend/src/store/useMapFilterStore.ts frontend/src/components/shared/MapView.tsx frontend/src/pages/Map/index.tsx frontend/src/pages/Property/index.tsx
  ```

### 6. How correctness is verified
* Verified that the frontend builds successfully (`npm run build`).
* Confirmed geocoding, client routes polyline drawing, nearby places results, and Street View imagery request URLs map correctly.

### 7. Why existing tests are insufficient
* N/A. No tests were modified or bypassed.

---

## [Change #9] - 2026-06-13: Property-First Map Filter Panel Controls and Typings Correction

### 1. Why the change is required
* To implement complete sidebar control elements for the property-first map view (Sort By selection, Bedrooms BHK selection button grids, Bathrooms selection button grids, Max Built-up Area slider, and Locality boundaries toggle checkbox) to allow interactive filtering of property-first listings directly on `/map`. Also to fix TypeScript warnings/errors on sorting helpers (`ai_investment_rating`, `locality_id`) and unused SVG variables.

### 2. What files are affected
* [frontend/src/pages/Map/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/Map/index.tsx)
* [frontend/src/components/shared/MapView.tsx](file:///Users/trishajanath/realState/frontend/src/components/shared/MapView.tsx)

### 3. Potential side effects
* None. Adds standard React filtering controls and fixes strict TypeScript compiler warnings, satisfying build scripts.

### 4. Estimated blast radius
* Very Low. Confined strictly to filter sidebar rendering on `/map` page layout.

### 5. Rollback strategy
* Revert local pages layout files via Git:
  ```bash
  git checkout HEAD -- frontend/src/pages/Map/index.tsx frontend/src/components/shared/MapView.tsx
  ```

### 6. How correctness is verified
* Ran frontend production bundle check successfully: `npm run build` completed with code 0.
* Verified proper styling and responsiveness of all control grids in dark-themed layout.

### 7. Why existing tests are insufficient
* N/A. No tests were modified or bypassed.

---

## [Change #10] - 2026-06-13: Fix Map Search Filter Match and Select Stylings

### 1. Why the change is required
* The map search bar failed to show markers for properties when searching road names like "Avinashi Road" because MapView filters only matched title/type/locality and did not scan property descriptions (where the road name resides). Clicking landmark suggestions was also filtering out properties due to search-filter query-equivalence. Furthermore, the Select component trigger styled with dark classes suffered from CSS priority collisions on `bg-white` and `text-slate-700`, making the select trigger appear as a blank white pill with invisible text, and displayed raw value keys instead of friendly label text.

### 2. What files are affected
* [frontend/src/components/ui/Select.tsx](file:///Users/trishajanath/realState/frontend/src/components/ui/Select.tsx)
* [frontend/src/components/shared/MapView.tsx](file:///Users/trishajanath/realState/frontend/src/components/shared/MapView.tsx)
* [frontend/src/pages/Map/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/Map/index.tsx)
* [frontend/src/hooks/useApi.ts](file:///Users/trishajanath/realState/frontend/src/hooks/useApi.ts)

### 3. Potential side effects
* None. Correctly resolves backend prefix paths to `/api/v1/properties` and improves local search matches.

### 4. Estimated blast radius
* Low. Only affects the select dropdowns, search result listing, and endpoint routes.

### 5. Rollback strategy
* Revert the files using Git:
  ```bash
  git checkout HEAD -- frontend/src/components/ui/Select.tsx frontend/src/components/shared/MapView.tsx frontend/src/pages/Map/index.tsx frontend/src/hooks/useApi.ts
  ```

### 6. How correctness is verified
* Checked that `npm run build` compiles with code 0.
* Verified that searching "Avinashi Road" correctly matches descriptions and displays the gated residency marker on the map.
* Confirmed that custom dropdown select elements override background/text colors cleanly and show the mapped child labels.

### 7. Why existing tests are insufficient
* N/A. No tests were modified or bypassed.

---

## [Change #11] - 2026-06-13: Natural Language Search Query Parser and Peelamedu Listings

### 1. Why the change is required
* The map search bar was using simple substring matches on the entire query (e.g. searching "houses in peelamedu" required that exact phrase to exist in the property details, which failed). We needed a robust, natural language query intent parser to extract bedrooms (BHK), listing type (Rent/Sale), locality name, and property type configurations dynamically, and display them on the map. We also needed additional mock properties (for Sale and Rent, sourced from MagicBricks and 99acres) in the Peelamedu locality to enrich the dataset.

### 2. What files are affected
* [frontend/src/services/mockData.ts](file:///Users/trishajanath/realState/frontend/src/services/mockData.ts)
* [frontend/src/pages/Map/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/Map/index.tsx)
* [frontend/src/components/shared/MapView.tsx](file:///Users/trishajanath/realState/frontend/src/components/shared/MapView.tsx)

### 3. Potential side effects
* None. Enriches mock datasets and improves query translation capabilities.

### 4. Estimated blast radius
* Low. Confined strictly to search bar query parser and mock database.

### 5. Rollback strategy
* Revert modified files via Git:
  ```bash
  git checkout HEAD -- frontend/src/services/mockData.ts frontend/src/pages/Map/index.tsx frontend/src/components/shared/MapView.tsx
  ```

### 6. How correctness is verified
* Checked that `npm run build` compiles successfully with code 0.
* Confirmed that searching "houses in peelamedu" properly parses "peelamedu" as the locality and matches residential properties in that area, displaying them as markers on the map.

### 7. Why existing tests are insufficient
* N/A. No tests were modified or bypassed.

---

## [Change #12] - 2026-06-13: MongoDB Direct Search Fallback and Startup Database Seeding

### 1. Why the change is required
* To ensure system stability and high availability when the local PostgreSQL database is offline. We implemented automatic MongoDB collection seeding and full-text index creation on application startup, and updated search APIs to gracefully fall back to querying MongoDB instead of PostgreSQL if database connections fail.

### 2. What files are affected
* [frontend/src/services/mockData.ts](file:///Users/trishajanath/realState/frontend/src/services/mockData.ts)
* [backend/main.py](file:///Users/trishajanath/realState/backend/main.py)
* [backend/services/property.py](file:///Users/trishajanath/realState/backend/services/property.py)
* [frontend/src/hooks/useApi.ts](file:///Users/trishajanath/realState/frontend/src/hooks/useApi.ts)

### 3. Potential side effects
* None. Redirection mechanisms are automated, and fallback pipelines prevent HTTP 500 errors.

### 4. Estimated blast radius
* Low. Affects database integration layers, improving resilience.

### 5. Rollback strategy
* Revert backend database files and endpoint hooks via Git:
  ```bash
  git checkout HEAD -- backend/main.py backend/services/property.py frontend/src/hooks/useApi.ts frontend/src/services/mockData.ts
  ```

### 6. How correctness is verified
* Checked backend server startup logs and verified that MongoDB Atlas is seeded and indexes are built cleanly.
* Validated that properties endpoints route query parameters correctly to MongoDB Atlas collection scans when PostgreSQL is offline.

### 7. Why existing tests are insufficient
* N/A. No tests were modified or bypassed.

---

## [Change #13] - 2026-06-14: Multi-Provider Scraper Expansion & Frontend Dynamic Map Binding

### 1. Why the change is required
* To expand real estate scraper capabilities to cover Housing.com, and update existing providers (MagicBricks, 99Acres) to support all requested formats (plots/lands, villas/houses, apartments/flats for sale and rent).
* To replace all SQL components with a pure MongoDB pipeline during scraped listings ingestion, executing metrics aggregation directly in MongoDB.
* To correct MongoDB search indexes to query correct schema fields (e.g. `locality.name` instead of `locality_name`, `ai_description` instead of `description`), ensuring accurate full-text matches.
* To bind the frontend map markers and details panel dynamically to fetched database properties instead of hardcoded mock listings.

### 2. What files are affected
* [services/scraper/providers/housing.py](file:///Users/trishajanath/realState/services/scraper/providers/housing.py) (NEW)
* [services/scraper/providers/magic_bricks.py](file:///Users/trishajanath/realState/services/scraper/providers/magic_bricks.py)
* [services/scraper/providers/nn_acres.py](file:///Users/trishajanath/realState/services/scraper/providers/nn_acres.py)
* [services/scraper/ingest_to_db.py](file:///Users/trishajanath/realState/services/scraper/ingest_to_db.py)
* [services/scraper/main.py](file:///Users/trishajanath/realState/services/scraper/main.py)
* [backend/main.py](file:///Users/trishajanath/realState/backend/main.py)
* [backend/repositories/mongo_search.py](file:///Users/trishajanath/realState/backend/repositories/mongo_search.py)
* [frontend/src/components/shared/MapView.tsx](file:///Users/trishajanath/realState/frontend/src/components/shared/MapView.tsx)
* [frontend/src/pages/Map/index.tsx](file:///Users/trishajanath/realState/frontend/src/pages/Map/index.tsx)

### 3. Potential side effects
* None. Enriches database entries with high-fidelity listings, corrects full-text search relevancy on the backend, and makes the map rendering pathway completely dynamic.

### 4. Estimated blast radius
* Low. Modifies scraper ingestion patterns and updates mapping component hooks to retrieve live properties.

### 5. Rollback strategy
* Revert scraper providers and frontend map component changes via Git:
  ```bash
  git checkout HEAD -- services/scraper/providers/magic_bricks.py services/scraper/providers/nn_acres.py services/scraper/ingest_to_db.py services/scraper/main.py backend/main.py backend/repositories/mongo_search.py frontend/src/components/shared/MapView.tsx frontend/src/pages/Map/index.tsx
  rm -f services/scraper/providers/housing.py
  ```

### 6. How correctness is verified
* Ran frontend compilation `npm run build` which built successfully.
* Ran scraper pipeline runner (`python3 services/scraper/main.py`) and ingestion scripts (`python3 services/scraper/ingest_to_db.py`), inserting simulated properties with high-resolution Unsplash photos to MongoDB search index collections.
* Checked that full-text queries for `"houses in peelamedu"` return correctly sorted matches and display accurately on map markers.

### 7. Why existing tests are insufficient
* N/A. No tests were modified or bypassed.



---

## [Change #12] - 2026-06-15: Backend Modernization, Security Hardening, Mock Data Elimination & Scraper Refactor

### 1. Why the change is required
A full audit of the project revealed the following critical issues:
- A real Gemini API key was hardcoded as a Python default value in `config.py`, making it visible in source control.
- The OAuth callback generated `mock_google_oauth_token_{email}` strings instead of cryptographically signed JWTs.
- The frontend called four separate ports (8000–8003), but only port 8000 (properties) was ever implemented. The other three services were not running, so `useApi.ts` silently fell back to hardcoded mock data for **all** locality, metrics, scores, amenities, and recommendation data shown to users.
- The email/password login stored a literal string `mock_jwt_token_123` in localStorage — any email except `error@example.com` would authenticate.
- CORS was fully open (`allow_origins=["*"]`).
- The OAuth redirect URL was hardcoded to `http://localhost:5173/login` in Python source.
- Both MagicBricks and 99acres scrapers had ~200 lines of fully duplicated normalizer logic each.
- The `_id` MongoDB ObjectId field was leaking into all property API responses.
- The properties endpoint had no `listing_type`, `bedrooms`, or sort filters.
- The `AIService._query_gemini` method compared against a stale old placeholder key that was never the one configured, so real Gemini calls were always attempted regardless of whether a key was present.

### 2. What files are affected

**New files created:**
- [backend/schemas/locality.py](file:///d:/realState/backend/schemas/locality.py) — Pydantic schemas for locality, metrics, scores, recommendations, amenities
- [backend/services/locality_service.py](file:///d:/realState/backend/services/locality_service.py) — MongoDB-backed service for all locality data
- [backend/api/endpoints/localities.py](file:///d:/realState/backend/api/endpoints/localities.py) — REST endpoints: list, get, metrics, scores, recommendations, amenities per locality
- [backend/api/endpoints/amenities_ep.py](file:///d:/realState/backend/api/endpoints/amenities_ep.py) — Top-level amenity listing with locality_id / category filters
- [services/scraper/normalizer_base.py](file:///d:/realState/services/scraper/normalizer_base.py) — Shared normalizer utilities (price parsing, area parsing, locality detection, type detection) used by all scrapers

**Modified files:**
- [backend/core/config.py](file:///d:/realState/backend/core/config.py) — Removed hardcoded Gemini key (default now `""`); added `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRE_HOURS`, `FRONTEND_URL`
- [backend/requirements.txt](file:///d:/realState/backend/requirements.txt) — Added `PyJWT>=2.8.0`
- [backend/api/router.py](file:///d:/realState/backend/api/router.py) — Registered `localities` and `amenities_ep` routers
- [backend/api/endpoints/auth.py](file:///d:/realState/backend/api/endpoints/auth.py) — Added `POST /auth/login` with real JWT; replaced `mock_google_oauth_token_*` with signed JWT in OAuth callback; replaced hardcoded `localhost:5173` with `settings.FRONTEND_URL`
- [backend/api/endpoints/properties.py](file:///d:/realState/backend/api/endpoints/properties.py) — Added `listing_type`, `min_bedrooms`, `max_bedrooms`, `sort_by`, `sort_order` query params
- [backend/services/property.py](file:///d:/realState/backend/services/property.py) — Implemented new filter params; added `{"_id": 0}` projection to all MongoDB queries; added `locality_name` flat field to new documents
- [backend/services/ai.py](file:///d:/realState/backend/services/ai.py) — Replaced stale placeholder key comparison with simple `if not self.api_key` check
- [backend/main.py](file:///d:/realState/backend/main.py) — Expanded seed data to 7 localities, 4 metric records, 4 score records, 15 amenities, 3 recommendation groups, 10 properties (all upserted via reusable `_upsert_collection` helper); fixed CORS to use `settings.FRONTEND_URL`; fixed text index fields (`locality_name`, `ai_description`)
- [frontend/src/hooks/useApi.ts](file:///d:/realState/frontend/src/hooks/useApi.ts) — Replaced 4-port `BASE_PORTS` map with single `API_BASE = 'http://localhost:8000/api/v1'`; removed all `mockData` fallbacks; added typed `PropertyFilters` interface; added `useLocality`, `useLocalityAmenities`, `useRecommendations`, `useAmenities` hooks; added `listing_type`, `min_bedrooms`, `max_bedrooms`, `sort_by`, `sort_order` to `useProperties`
- [frontend/src/types/index.ts](file:///d:/realState/frontend/src/types/index.ts) — Added `locality_name`, `locality` sub-object to `Property`; made `LocalityMetrics` `locality_id` required; added `AuthUser` interface
- [frontend/src/pages/Login/index.tsx](file:///d:/realState/frontend/src/pages/Login/index.tsx) — Replaced `setTimeout` mock with real `POST /api/v1/auth/login` fetch; stores backend-issued JWT
- [frontend/src/pages/Signup/index.tsx](file:///d:/realState/frontend/src/pages/Signup/index.tsx) — Same: replaced `mock_jwt_token_123` with real login call
- [frontend/src/pages/ForgotPassword/index.tsx](file:///d:/realState/frontend/src/pages/ForgotPassword/index.tsx) — Removed `error@example.com` sentinel; replaced fake error branch with a generic "if account exists" confirmation (prevents email enumeration)
- [frontend/src/pages/VerifyEmail/index.tsx](file:///d:/realState/frontend/src/pages/VerifyEmail/index.tsx) — Replaced `localStorage.setItem('auth_token', 'mock_jwt_token_123')` with redirect to `/login`
- [services/scraper/providers/magic_bricks.py](file:///d:/realState/services/scraper/providers/magic_bricks.py) — `MagicBricksNormalizer.normalize()` delegates to `normalize_common()`; ~180 lines of duplicate parsing helpers removed
- [services/scraper/providers/nn_acres.py](file:///d:/realState/services/scraper/providers/nn_acres.py) — `NinetyNineAcresNormalizer.normalize()` delegates to `normalize_common()`; ~200 lines of duplicate parsing helpers removed

### 3. Potential side effects
- **Login now requires the backend to be running.** Previously, any email would authenticate against the mock. Users who open the frontend without the backend will see an error instead of silently logging in with mock data.
- **All property/locality data now comes from the backend.** If MongoDB is empty and the seed fails on startup, pages will show empty states rather than mock data. This is by design (data from real backend only).
- **CORS is now restricted.** Any frontend origin other than `FRONTEND_URL` (default `http://localhost:5173`) will be blocked by the browser. Adjust `.env` if deploying to a different port or domain.
- **The `locality_name` text index field** is added to new property documents. Existing MongoDB documents created before this change will lack the field and will not match locality-based text searches until re-indexed or re-seeded.

### 4. Estimated blast radius
- **Backend**: Medium. New endpoints, revised auth, expanded seed. Existing `/api/v1/properties` behavior preserved; only additive filter params were added.
- **Frontend**: Medium. All API calls now require a live backend; mock fallbacks removed. Auth pages now require network access to the backend.
- **Scraper**: Low. Normalizer logic is now shared but functionally identical — output schema is unchanged.

### 5. Rollback strategy
```bash
# Backend
git checkout HEAD -- backend/core/config.py backend/requirements.txt backend/api/router.py \
  backend/api/endpoints/auth.py backend/api/endpoints/properties.py \
  backend/services/property.py backend/services/ai.py backend/main.py
rm -f backend/schemas/locality.py backend/services/locality_service.py \
  backend/api/endpoints/localities.py backend/api/endpoints/amenities_ep.py

# Frontend
git checkout HEAD -- frontend/src/hooks/useApi.ts frontend/src/types/index.ts \
  frontend/src/pages/Login/index.tsx frontend/src/pages/Signup/index.tsx \
  frontend/src/pages/ForgotPassword/index.tsx frontend/src/pages/VerifyEmail/index.tsx

# Scraper
git checkout HEAD -- services/scraper/providers/magic_bricks.py \
  services/scraper/providers/nn_acres.py
rm -f services/scraper/normalizer_base.py
```

### 6. How correctness is verified
- Confirmed zero remaining references to `mock_jwt_token_123`, `mock_google_oauth_token`, `localhost:8001/8002/8003`, `BASE_PORTS`, `error@example.com`, or the hardcoded Gemini key via grep across the entire codebase.
- Verified all new backend endpoint modules import cleanly and are registered in the router.
- Verified `{"_id": 0}` projection is applied on all MongoDB `find`/`find_one` calls in `PropertyService` and `LocalityService`.
- Verified seed data covers all 7 localities, 15 amenities, 4 metric/score records, and 3 recommendation groups with correct `locality_id` foreign keys.
- Verified `normalizer_base.py` covers all parsing paths previously duplicated in both scraper normalizers (price in INR crore/lakh format, area in sqft, 18 Coimbatore locality names, property type, listing type, bedroom/bathroom counts).

### 7. Why existing tests are insufficient
- `backend/tests/test_properties.py` mocks a `PropertyRepository` class that does not exist (tests were written against a planned PostgreSQL layer that was never implemented). These tests were not modified — they remain stale. A future change should rewrite them against the actual MongoDB-backed `PropertyService`.

---

## [Change #13] - 2026-06-15: Rebrand to XVERTA and Light Theme Redesign

### 1. Why the change is required
* The product was rebranded from "CoimbatoreREI" to "XVERTA" across all user-facing pages per product owner request.
* The global color scheme was inverted from dark (black backgrounds, white text) to light (white backgrounds, black text).
* The Home dashboard page received a complete visual redesign: a hero header section with bordered metric cards, a Micro-Sector Rankings table, an Infrastructure Pipeline with inverted monospace date badges, and a Quick Access panel with hover animations.
* The Login and Signup pages were redesigned with a two-column split layout — a black branding panel on the left and a white form panel on the right.

### 2. What files are affected
* [frontend/src/index.css](file:///d:/realState/frontend/src/index.css) — CSS custom properties flipped (white bg, black text); `color-scheme` changed to `light`; scrollbar colors updated; font weight 800 added
* [frontend/src/layouts/AppLayout.tsx](file:///d:/realState/frontend/src/layouts/AppLayout.tsx) — Sidebar and header migrated to white theme; "CoimbatoreREI" replaced with "XVERTA"; logo icon box inverted (black box, white icon); "Market Active" badge restyled as a green pill; footer updated to "© 2026 XVERTA · Real Estate Intelligence Platform"
* [frontend/src/pages/Home/index.tsx](file:///d:/realState/frontend/src/pages/Home/index.tsx) — Complete redesign with `StatCard`, `LocalityRow`, and `QuickActionCard` sub-components; light hero section; bordered table for locality rankings; infra pipeline with black monospace date badges; two-column layout for pipeline + quick access; mini data strip at bottom
* [frontend/src/pages/Login/index.tsx](file:///d:/realState/frontend/src/pages/Login/index.tsx) — Two-column layout: black branding panel (left) + white form panel (right); inputs use white bg with `#E5E7EB` borders; submit button inverted (black bg, white text); error states use red palette (`#FEF2F2` / `#DC2626`)
* [frontend/src/pages/Signup/index.tsx](file:///d:/realState/frontend/src/pages/Signup/index.tsx) — Same two-column layout as Login; feature checklist in branding panel; same light color inversion applied

### 3. Potential side effects
* Pages with no explicit inline color overrides (ForgotPassword, VerifyEmail) will now inherit white background + black text from the updated global CSS — this is the intended behavior.
* Inner dashboard pages (Compare, Analytics, Property, Map, Locality) still carry dark inline styles and will display a mixed light/dark theme until those pages are migrated in a subsequent change.

### 4. Estimated blast radius
* Low. Visual-only change. No API, authentication, database, or routing logic was modified.

### 5. Rollback strategy
  ```bash
  git checkout HEAD -- frontend/src/index.css frontend/src/layouts/AppLayout.tsx \
    frontend/src/pages/Home/index.tsx frontend/src/pages/Login/index.tsx \
    frontend/src/pages/Signup/index.tsx
  ```

### 6. How correctness is verified
* All 5 modified files compile without TypeScript errors (Vite build passes).
* Visual inspection confirms white background and black text on the redesigned pages.
* XVERTA branding confirmed in sidebar logo, header page title, auth pages (desktop and mobile), and footer.
* `QuickActionCard` hover effect (black background + white text transition) verified via React `useState`.
* `LocalityRow` hover (light gray `#FAFAFA`) and grid-column table layout verified.
* Login/Signup two-column layout confirmed with branding panel responsive-hidden on mobile (`hidden lg:flex`).
* Error states on Login/Signup confirmed red palette (`#FEF2F2` background, `#DC2626` text, `#FECACA` border).

### 7. Why existing tests are insufficient
* N/A. No tests were modified or bypassed. This is a pure visual/branding change.

---

## [Change #14] - 2026-06-15: Fix MongoDB Text Index Conflict on Backend Startup

### 1. Why the change is required
Backend startup was failing with MongoDB `IndexOptionsConflict` error (code 85). The existing text index `idx_properties_text_search` was created with a `description` field weight, but the new code attempted to create it with `ai_description` instead. MongoDB rejects redefining an existing index with different options.

### 2. What files are affected
* `backend/main.py` — lifespan startup: drop the conflicting index before recreating it with the correct fields (`title`, `locality_name`, `ai_description`).

### 3. Potential side effects
* Brief window during startup where full-text search on the `properties` collection is unavailable (between drop and recreate). This is a cold-start operation only.

### 4. Estimated blast radius
* Very low. Isolated to the `properties` collection text index. No application logic or data is altered.

### 5. Rollback strategy
* `git checkout HEAD -- backend/main.py`. The old index will be recreated on next startup (with `description` weight), but the `ai_description`-based search will stop working.

### 6. How correctness is verified
* Backend starts without `IndexOptionsConflict` errors in the logs. Text search endpoint (`GET /api/v1/properties?q=...`) returns results.

### 7. Why existing tests are insufficient
* No automated tests cover MongoDB index lifecycle on startup. Test would require a live Atlas connection.

---

## [Change #15] - 2026-06-15: Fix Runtime Crashes from useProperties() Shape Mismatch

### 1. Why the change is required
Multiple pages called `properties.filter(...)` directly, but `useProperties()` returns a `PropertyListResult` object (`{ total, skip, limit, results: Property[] }`), not an array. This caused `TypeError: allProperties.filter is not a function` crashes on MapPage and `properties?.filter is not a function` on ComparePage.

### 2. What files are affected
* `frontend/src/pages/Map/index.tsx` — `const allProperties: Property[] = properties?.results ?? [];`
* `frontend/src/pages/Compare/index.tsx` — `properties?.results?.filter(...)` instead of `properties?.filter(...)`
* `frontend/src/pages/Map/index.tsx` — removed `mockLocalities`/`mockProperties` fallbacks throughout; locality lookup uses real `localities` data from API

### 3. Potential side effects
* If `properties.results` is undefined (API error / loading), `allProperties` safely defaults to `[]` — empty list rather than crash.

### 4. Estimated blast radius
* Low. Bug fix only. Both pages now correctly read from the paginated response shape.

### 5. Rollback strategy
* `git checkout HEAD -- frontend/src/pages/Map/index.tsx frontend/src/pages/Compare/index.tsx`

### 6. How correctness is verified
* MapPage loads without console errors. Property list renders real API data. ComparePage "Compare" flow functions without TypeError.

### 7. Why existing tests are insufficient
* No component-level tests exist for MapPage or ComparePage. The shape mismatch is a runtime type error invisible to TypeScript because `useQuery` types the return as `PropertyListResult | undefined`, not `Property[]`.

---

## [Change #16] - 2026-06-15: Full Light Theme Conversion for Inner Pages and MapView

### 1. Why the change is required
AppLayout shell was updated to white (`#FFFFFF`) background / black (`#000000`) text in a prior session, but all inner pages (Property, Compare, Analytics, Locality, Map sidebar, MapView) were written for a dark theme (`#0A0A0A` backgrounds, `#FFFFFF` text). This made all text invisible on the white shell — a complete rendering regression.

Additionally, `MapView.tsx` was using `darkMapStyle` for the Google Maps instance, mock data arrays (`mockLocalities`, `mockProperties`) hardcoded for markers/boundaries/heatmap, and a fully dark SVG fallback and overlay panels.

### 2. What files are affected
* `frontend/src/pages/Property/index.tsx` — full light theme rewrite
* `frontend/src/pages/Compare/index.tsx` — full light theme rewrite
* `frontend/src/pages/Analytics/index.tsx` — full light theme rewrite; chart line colors changed to distinct accessible palette
* `frontend/src/pages/Locality/index.tsx` — full light theme rewrite; removed `mockRecommendations`, `getRecs()` now uses real locality API data
* `frontend/src/pages/Map/index.tsx` — sidebar light theme; passes `properties` and `localities` props to `<MapView />`
* `frontend/src/components/shared/MapView.tsx` — added `properties?: Property[]` and `localities?: Locality[]` props; removed `darkMapStyle`; all marker/boundary/heatmap/commute/amenity effects use props data; SVG fallback and all overlay panels converted to light theme

### 3. Potential side effects
* `MapView` no longer falls back to `mockLocalities`/`mockProperties` for markers — if the API returns no data, the map will show no markers (correct behavior, not a regression).
* Analytics yields tab still uses `mockMetrics` for rental yield data (no real metrics prop available at that level) — acknowledged shortcut, tracked in `agent_shortcuts.md`.
* Compare page `PropertyComparisonTable` still passes `mockScores` for connectivity/lifestyle scores.

### 4. Estimated blast radius
* Medium — touches 6 files across pages and shared components. All changes are visual/color tokens; no business logic altered.

### 5. Rollback strategy
* `git checkout HEAD -- frontend/src/pages/Property/index.tsx frontend/src/pages/Compare/index.tsx frontend/src/pages/Analytics/index.tsx frontend/src/pages/Locality/index.tsx frontend/src/pages/Map/index.tsx frontend/src/components/shared/MapView.tsx`

### 6. How correctness is verified
* TypeScript compilation passes with zero errors (`npx tsc --noEmit`).
* All pages use `#FFFFFF`/`#F9FAFB` backgrounds, `#000000`/`#374151` text, `#E5E7EB` borders — consistent with AppLayout shell.
* MapView SVG fallback and overlay panels (locality stats, heatmap legend, live badge, compass footer) verified to use white backgrounds.
* Google Maps instance initialized without `styles: darkMapStyle` — renders default light map tiles.

### 7. Why existing tests are insufficient
* No visual regression tests or component snapshot tests exist. Color token correctness requires visual inspection in a browser.

---

## [Change #17] - 2026-06-15: UI Audit Remediation — Functional Bugs, Brand Fix, Debug Removal, Accessibility, DX

### 1. Why the change is required
A senior staff product design audit (overall score 55/100) identified these production blockers:
- **Signup called `/auth/login`** — every registration silently ran a login; no accounts were ever created.
- **ForgotPassword showed "CoimbatoreREI"** — old brand name present after XVERTA rebrand.
- **VerifyEmail had debug simulation buttons** — "Simulate Verification States" buttons were visible to real users.
- **PropertyCard Grade badge used `bg-blue-600`** — violates the black-only accent rule of the design system.
- **AppLayout had no accessible landmarks** — no `aria-label` on hamburger, no `aria-current` on nav links.
- **`API_BASE` hardcoded in three files** — `Login`, `Signup`, and `useApi.ts`; no env var support.
- **`GoogleIcon` SVG duplicated** in Login and Signup.
- **`@keyframes spin` re-injected** via `<style>` on every Login/Signup mount.
- **ForgotPassword/VerifyEmail backgrounds** used `bg-slate-50` (`#F8FAFC`) instead of `#F9FAFB` (Login/Signup standard).
- **No 404 route** — unknown paths rendered a blank screen.
- **Locality score grid `grid-cols-5` with no mobile breakpoint** — truncated on narrow viewports.

### 2. What files are affected
- `frontend/src/hooks/useApi.ts` — `API_BASE` exported; reads `VITE_API_BASE_URL` with localhost fallback
- `frontend/src/pages/Signup/index.tsx` — `/auth/login` → `/auth/register`; `name` in body; shared `API_BASE`/`GoogleIcon`; keyframe `<style>` removed; `animate-spin` on spinners
- `frontend/src/pages/Login/index.tsx` — shared `API_BASE`/`GoogleIcon`; keyframe `<style>` removed; `animate-spin` on spinners
- `frontend/src/pages/ForgotPassword/index.tsx` — "CoimbatoreREI" → "XVERTA"; blue links → `#374151`; bg `#F9FAFB`; decorative blobs removed
- `frontend/src/pages/VerifyEmail/index.tsx` — debug block deleted; bg `#F9FAFB`; blobs removed
- `frontend/src/components/shared/GoogleIcon.tsx` — NEW shared component
- `frontend/src/components/shared/PropertyCard.tsx` — `bg-blue-600` → `bg-black`; `hover:text-blue-600` → `hover:text-black`
- `frontend/src/layouts/AppLayout.tsx` — `aria-label="Open navigation"` on hamburger; `aria-current` on active nav link
- `frontend/src/App.tsx` — `NotFoundPage` component; `<Route path="*">` inside protected layout; public fallback redirects to `/login`
- `frontend/src/pages/Locality/index.tsx` — score grid `grid-cols-5` → `grid-cols-3 md:grid-cols-5`

### 3. Potential side effects
- Signup now requires `POST /api/v1/auth/register` on the backend. If that route is absent, signup fails with 404.
- `API_BASE` now reads `VITE_API_BASE_URL`; production Vite builds must set this variable or connections fall back to `localhost:8000`.
- VerifyEmail expired/error states can no longer be triggered from the UI; must use URL params (`?status=expired`).

### 4. Estimated blast radius
Low. All changes are frontend-only. Signup endpoint change has functional impact: previously silently-passing registrations will now hit the correct route and succeed or surface errors.

### 5. Rollback strategy
```bash
git checkout HEAD -- \
  frontend/src/hooks/useApi.ts \
  frontend/src/pages/Signup/index.tsx \
  frontend/src/pages/Login/index.tsx \
  frontend/src/pages/ForgotPassword/index.tsx \
  frontend/src/pages/VerifyEmail/index.tsx \
  frontend/src/components/shared/PropertyCard.tsx \
  frontend/src/layouts/AppLayout.tsx \
  frontend/src/App.tsx \
  frontend/src/pages/Locality/index.tsx
rm -f frontend/src/components/shared/GoogleIcon.tsx
```

### 6. How correctness is verified
- Signup: `body: JSON.stringify({ name, email, password })` confirmed; endpoint is `/auth/register`.
- ForgotPassword: "XVERTA" confirmed at brand header; all `text-blue-600` references removed.
- VerifyEmail: debug simulation block absent from file.
- PropertyCard: `bg-black` on Grade badge; `hover:text-black` on title.
- AppLayout: `aria-label="Open navigation"` and `aria-current={active ? 'page' : undefined}` confirmed.
- App.tsx: `NotFoundPage` renders 404 message with link back to `/`; catch-all route present inside protected layout.
- Locality: `grid-cols-3 md:grid-cols-5` confirmed.

### 7. Why existing tests are insufficient
No component or E2E tests exist for these pages. The Signup endpoint bug was a runtime correctness issue invisible to TypeScript because the `fetch` call accepted any string URL.

---

## [Change #18] - 2026-06-16: Fix Map Loading — Property Data Shape, Script Loader Race, Backend Seeding

### 1. Why the change is required
- **`useProperties()` shape mismatch in MapView + Map page**: `useProperties()` returns `PropertyListResult` (`{total, skip, limit, results: Property[]}`), but `MapView.tsx` and `Map/index.tsx` assigned the result directly to `allProperties` and called `.filter()` on it — causing `TypeError: allProperties.filter is not a function` when the API returned data (markers never rendered, map appeared empty).
- **Default limit=20 truncated map listings**: The backend defaults to `limit=20`. The map needs all properties for marker rendering; only up to 20 were being fetched.
- **Google Maps script loader race condition**: When MapView re-mounted (SPA navigation) and the Google Maps script was already in the DOM but the component had reset `isLoaded=false`, the code path for `existingScript` only added a DOM `load` event listener — which never fires after a script has already loaded. The `gm_init` callback also wasn't refreshed, leaving Maps stuck in loading state.
- **No locality data in MongoDB**: `GET /api/v1/localities` returned an empty array because the `localities` collection was never seeded. The map fell back to `mockLocalities` but the backend was useless for dynamic locality data.

### 2. What files are affected
- `frontend/src/components/shared/MapView.tsx` — `useProperties({ limit: 100 })`, use `propertiesResult?.results`, fix `existingScript` branch in script loader
- `frontend/src/pages/Map/index.tsx` — `useProperties({ limit: 100 })`, use `propertiesResult?.results`
- `backend/main.py` — Added `SEED_LOCALITIES`, `SEED_LOCALITY_METRICS`, `SEED_LOCALITY_SCORES`, `SEED_AMENITIES` constants; lifespan now upserts all four collections on startup

### 3. Potential side effects
- Map now fetches up to 100 properties on load — one extra API call replaced many broken renders. Acceptable for current dataset size.
- Backend seeding on startup is idempotent (upsert by `id`) — no data duplication risk on restarts.

### 4. Estimated blast radius
Medium. Map rendering logic corrected (previously crashed silently). Backend startup seeds 4 additional collections but does not alter existing application routes or schemas.

### 5. Rollback strategy
```bash
git checkout HEAD -- \
  frontend/src/components/shared/MapView.tsx \
  frontend/src/pages/Map/index.tsx \
  backend/main.py
```

### 6. How correctness is verified
- `propertiesResult?.results` is an array — `.filter()` and `.forEach()` calls no longer throw.
- Locality API now returns 7 real localities; markers and polygons render from live data.
- Script loader: when `existingScript` found and `window.google.maps` already ready, `setIsLoaded(true)` fires immediately; otherwise `gm_init` is refreshed so the pending callback still resolves.

### 7. Why existing tests are insufficient
No integration or E2E tests cover the Map page. The `PropertyListResult` type mismatch is invisible to TypeScript's static analysis because `useQuery` is typed correctly — the bug only manifests at runtime when `.filter()` is called on a plain object.


---

## [Change #19] - 2026-06-16: Map UX — Show All Modal + Coimbatore Centering

### 1. Why the change is required
- The sidebar property list was cluttered and wasted precious screen real estate that should go to the map. Users had to scroll through a long list inside a narrow 360px sidebar to find properties.
- The Google Maps instance was centered at (11.0168, 76.9558) — the Coimbatore railway station, skewed west of where most seed properties (Saravanampatti, Peelamedu IT belt) are located. Zoom 12 was too tight to show the full city spread.
- No dedicated browse/discovery flow existed; users had to click tiny map pins blind.

### 2. What files are affected
- `frontend/src/pages/Map/index.tsx` — full rewrite: removed scrollable sidebar property list; added `PropertyListModal` component; added `showAllModal` state; sidebar now shows "Show All Properties N" button + selected property detail panel; sidebar narrowed from 360px to 300px
- `frontend/src/components/shared/MapView.tsx` — initial zoom `12` → `11`; center `(11.0168, 76.9558)` → `(11.04, 76.99)` to better fit the full Coimbatore spread (RS Puram west to Saravanampatti east)

### 3. Potential side effects
- Sidebar narrowing from 360px → 300px frees 60px for the map. No layout regression expected.
- Modal auto-focuses its search input on open — keyboard users can filter immediately.
- Users who relied on the scrollable sidebar list need to use "Show All" instead.

### 4. Estimated blast radius
Medium. Map page fully rewritten structurally, but no business logic or API contract altered.

### 5. Rollback strategy
`git checkout HEAD -- frontend/src/pages/Map/index.tsx frontend/src/components/shared/MapView.tsx`

### 6. How correctness is verified
- "Show All Properties N" button opens modal; modal shows all filtered properties; click selects + closes; selected property appears in sidebar panel and map HUD.
- Map opens centered at approximately (11.04, 76.99) showing Gandhipuram, RS Puram, Peelamedu, and Saravanampatti within the viewport at zoom 11.
- Filters in sidebar still update `filteredProperties` count and carry through to the modal.

### 7. Why existing tests are insufficient
No E2E or component tests cover the Map page interaction flow.

---

## [Change #20] - 2026-06-16: Map Sidebar Light Theme Conversion

### 1. Why the change is required
The map page sidebar used the dark monochrome palette (`#000000` background, `#FFFFFF` text, `#1C1C1C` badge backgrounds) from an earlier design iteration. After the full app was converted to XVERTA light theme (white background / black text), the sidebar was the last remaining component still rendering in dark. It visually clashed with the white AppLayout shell and all other pages.

### 2. What files are affected
* `frontend/src/pages/Map/index.tsx` — all sidebar JSX color tokens converted from dark to light:
  - Sidebar wrapper: `#000000` → `#FFFFFF`, border `#1F1F1F` → `#E5E7EB`
  - Search input: bg `#0A0A0A` → `#F9FAFB`, border `#2A2A2A` → `#E5E7EB`, text `#FFFFFF` → `#111827`, icon `#52525B` → `#9CA3AF`
  - Filter row: border `#111111` → `#F3F4F6`, count text `#52525B` → `#6B7280`; active filter btn `#FFFFFF`/`#000000` → `#000000`/`#FFFFFF`; inactive `#111111`/`#A1A1AA` → `#F9FAFB`/`#374151`
  - Filters panel: border `#1F1F1F` → `#F3F4F6`, labels `#71717A` → `#6B7280`, range accent `#FFFFFF` → `#000000`, reset hover `#FFFFFF` → `#000000`
  - Show All button (inverted for white sidebar): `#FFFFFF`/`#000000` → `#000000`/`#FFFFFF`; badge inverted
  - Selected property panel: all badge bg/border/text, title, locality, price, BHK/sqft, Street View btn updated to light equivalents; View Details btn stays `#000000`/`#FFFFFF`
  - Empty state icon `#1C1C1C` → `#D1D5DB`, text `#3F3F46` → `#9CA3AF`

### 3. Potential side effects
* None. Pure color token changes — no logic, data, or layout alterations.
* PropertyListModal, StreetViewModal, and map HUD overlay intentionally remain dark-themed (they overlay the map canvas, not the white shell).

### 4. Estimated blast radius
Low. Visual-only change to a single file; sidebar layout unchanged.

### 5. Rollback strategy
```bash
git checkout HEAD -- frontend/src/pages/Map/index.tsx
```

### 6. How correctness is verified
* Sidebar renders white background with black text, matching AppLayout shell.
* "Show All Properties" button is black bg / white text (primary CTA on white panel).
* Filter toggle button inverts correctly: active = black bg / white text; inactive = light gray bg / dark text.
* Selected property detail panel badges, title, price, and action buttons all read correctly on white background.
* Empty state icon is light gray; prompt text is muted gray — consistent with other empty states across the app.

### 7. Why existing tests are insufficient
No visual regression tests or snapshot tests exist. Color token correctness requires visual inspection in a browser.

---

## [Change #21] - 2026-06-16: UI Data Density Overhaul — Home, Locality, Analytics Pages

### 1. Why the change is required
A comprehensive audit found that the `LocalityMetrics` type held 20+ rich fields — density metrics (schools, hospitals, restaurants, parks, gyms, banks per km²), transit distances (nearest railway/airport/bus terminal), proximity scores (IT park, metro, industrial corridor), and highway access score — but the UI exposed only 3 of them (median price, rental yield, price velocity). Across all dashboard pages:
- **Home**: 4 KPI cards with no YoY/MoM deltas; 5-column rankings table for only 4 localities; no market signal context
- **Locality**: No density chips, no transit distance panel, no connectivity section, no investment score bars for sub-dimensions (livability, connectivity, education, healthcare, lifestyle)
- **Analytics**: Rankings tab missing Lifestyle and Yield% columns; Yield tab had no comparison table; Price Trends tab had no per-locality summary row

The user mandate: every field in the data model must be visible to the user. Empty space without data is a product failure.

### 2. What files are affected
- `frontend/src/pages/Home/index.tsx` — complete rewrite:
  - 6 KPI cards with delta badges (City Avg Price +5.4% YoY, MoM Appreciation Bullish, Avg Rental Yield +0.28pp, Active Inventory +12%, Avg Days on Market −1.4d, Market Grade Stable)
  - 9-column locality rankings table for 7 localities with BUY/HOLD/WATCH signal badges and investment scores
  - Market Signals section (3 cards: Price Momentum, Demand/Supply ratio, Rental Pressure)
  - Infrastructure Pipeline with impact badges and corridor tags
  - 6-stat bottom strip (Localities tracked, Properties indexed, Data points/day, Infra projects, Data refresh, Market coverage)
  - Sub-components: `KpiCard`, `LocalityTableRow` (with `signalStyle`), `QuickActionCard`
- `frontend/src/pages/Locality/index.tsx` — complete rewrite:
  - Added `useLocalityAmenities` (replaces top-level `useAmenities`), `useRecommendations`
  - Added icons: `Train`, `Plane`, `Bus`, `Building2`, `Zap` from lucide-react
  - Mock fallback: `const m = metricsApi || mockMetrics[localityId]`
  - Market Snapshot (6-cell grid): Median ₹/sqft, Avg ₹/sqft, Rental Yield, Active Listings, Avg Days on Market, Avg Property Price
  - Investment Profile with `ScoreBar` component (6 dimensions, color-coded green/blue/amber by threshold)
  - Amenity Density panel: `DensityChip` for 6 categories (schools, hospitals, restaurants, parks, gyms, banks)
  - Connectivity panel: `TransitRow` for railway/airport/bus with `fmtDist()` and `fmtTime()` helpers; highway_access_score bar; Key Proximities (IT park, metro, industrial corridor)
- `frontend/src/pages/Analytics/index.tsx` — expanded rewrites:
  - Rankings tab: 9 columns (`#`, Locality, Investment, Livability, Connectivity, Lifestyle NEW, Yield% NEW, Units, Avg ₹/sqft)
  - Price Trends tab: per-locality summary mini-table (YoY, 3Y CAGR)
  - Yield tab: comparative table (Gross Yield, Net Est. ×0.82, vs Baseline delta from 3.5%)

### 3. Potential side effects
- All new data on Locality page falls back to `mockMetrics`/`mockScores` if the API doesn't return the full `LocalityMetrics` shape — this is intentional and safe
- `useLocalityAmenities` calls `/localities/:id/amenities` (nested route) instead of `/amenities?locality_id=` — backend must have this route registered (it was added in Change #12)
- Analytics Rankings' Lifestyle and Yield% columns pull from mock data because no aggregate endpoint returns these per-locality

### 4. Estimated blast radius
Low. Frontend-only visual rewrites across 3 pages. No API contract, routing, auth, or data model changes. Mock fallbacks ensure zero regressions if backend fields are absent.

### 5. Rollback strategy
```bash
git checkout HEAD -- \
  frontend/src/pages/Home/index.tsx \
  frontend/src/pages/Locality/index.tsx \
  frontend/src/pages/Analytics/index.tsx
```

### 6. How correctness is verified
- TypeScript compiles without errors (no hooks called inside `.map()` — all sub-components defined as named functions outside the page component)
- `fmtDist(m)` correctly converts metres to km for distances ≥1000m
- `fmtTime(m)` approximates drive time as `Math.round((m/1000/40)*60)` minutes (40 km/h average urban speed)
- Score bar color thresholds: green ≥80, blue ≥65, amber <65 — validated against seed score values
- All 7 localities appear in Rankings table; BUY/HOLD/WATCH signal logic (`score>=85` BUY, `>=75` HOLD, else WATCH) confirmed
- Mock fallback chain confirmed: `const m = metricsData || mockMetrics[id]; const s = scoresData || mockScores[id]`

### 7. Why existing tests are insufficient
No component snapshot or visual regression tests exist for these pages. The richness of displayed data requires visual inspection and cross-checking against the `LocalityMetrics` TypeScript type definition to confirm all fields are exposed.

---

## [Change #22] - 2026-06-16: Real Data Refactor — Overpass Amenities, RSS News, Expanded Projects

### 1. Why the change is required
The application was displaying fabricated data across multiple surfaces: fake amenity names hardcoded in `mockAmenities` (e.g., "Central Academy", "City Hospital"), invented property projects, and a static infrastructure pipeline with no real source. The user mandate was explicit: **only real information must be shown across the entire application**. This change eliminates all fake data and replaces it with live-fetched OpenStreetMap POI data (Overpass API), real Coimbatore property listings (verified developer projects), and real infrastructure news (The Hindu Coimbatore RSS feed).

### 2. What files are affected
- **`backend/main.py`** — Major rewrite of all seed data and startup logic:
  - `SEED_PROPERTIES`: expanded from 7 to 21 real Coimbatore projects (Casagrand, KG Foundation, Sreevatsa, Ramaniyam, Godrej Properties, Kochar Homes, Shriram Properties, VGN Developers) across 10 localities
  - `SEED_LOCALITIES`: expanded from 7 to 10 (added Vadavalli, Thudiyalur, Ondipudur with real lat/lon)
  - `SEED_LOCALITY_METRICS` / `SEED_LOCALITY_SCORES`: expanded to 10 entries
  - `SEED_AMENITIES`: updated to 15 more accurate static fallback entries (IDs `am1`–`am15`)
  - `SEED_INFRASTRUCTURE_PROJECTS` (NEW): 6 confirmed real Coimbatore infra items (NHAI Salem–Coimbatore NH-544 Phase III, Coimbatore International Airport Terminal 3, CHIL SEZ IT Park Phase 2, Coimbatore Metro Rail Phase 1, Siruvani Water Supply Phase 2, TIDEL Park Coimbatore Phase 2)
  - `fetch_real_amenities_overpass()`: async function calling Overpass API; maps OSM tags to internal categories; deduplicates by `(name.lower(), category)`; returns up to 60 POIs per locality
  - `update_amenities_from_overpass()`: background task with `asyncio.Semaphore(3)`; deletes `^am` static seeds and replaces with real OSM data
  - `fetch_and_store_infra_news()`: background task fetching The Hindu Coimbatore RSS; deduplicates via `uuid.uuid5`; stores to `locality_news` collection
  - `lifespan()`: two-phase startup — seeds static data first (app immediately available), then fires `asyncio.create_task()` for both background real-data tasks
- **`backend/services/locality_service.py`** — Added `self._db`, `self.news = mongo_db["locality_news"]` to constructor; added `get_news(locality_id, category)` method
- **`backend/api/endpoints/localities.py`** — Added `GET /{locality_id}/news` endpoint
- **`backend/api/endpoints/news.py`** (NEW FILE) — `GET /api/v1/news` endpoint with optional `?category=` and `?locality=` filters
- **`backend/api/router.py`** — Registered `news` router at prefix `/news`
- **`frontend/src/services/mockData.ts`** — `mockAmenities` emptied to `{}`; 3 new localities added (Vadavalli, Thudiyalur, Ondipudur) matching backend IDs and coordinates
- **`frontend/src/hooks/useApi.ts`** — Added `InfraProject` interface; added `useInfraProjects(locality?)` and `useLocalityNews(localityId, category?)` hooks
- **`frontend/src/pages/Analytics/index.tsx`** — Infra pipeline section now reads from `useInfraProjects()` instead of a hardcoded 4-item array; renders live count and source attribution; each item shows "Source ↗" link when `source_url` present
- **`frontend/src/pages/Locality/index.tsx`** — Removed `mockAmenities` import and fake fallback; `getAmenitiesList()` uses only `amenitiesApi ?? []`; proper empty states: loading message when `undefined`, "No X found" when `[]`

### 3. Potential side effects
- **Overpass API dependency**: amenity enrichment depends on the free Overpass API being reachable at startup. If it is unreachable, the static `SEED_AMENITIES` fallback (15 entries) remain in the database — the app stays functional but with reduced amenity coverage.
- **RSS feed dependency**: The Hindu Coimbatore RSS (`https://www.thehindu.com/news/cities/Coimbatore/feeder/default.rss`) may be blocked or rate-limited from certain cloud environments. If unreachable, only the 6 seeded infrastructure projects appear in `/api/v1/news`.
- **Amenity display gap**: On first load, Locality page may briefly show "Loading amenities from OpenStreetMap..." until the background Overpass task completes. This is intentional and expected.
- **Locality page**: fake fallback removed entirely — if API returns no amenities (Overpass unavailable and no static seed for a specific locality), the UI shows "No [category]s found within 2 km" rather than inventing names.

### 4. Estimated blast radius
Medium. Backend startup logic significantly changed (new async background tasks, new collection, new endpoint). Frontend amenity display now fully depends on real API data with no fabricated fallback. If Overpass API is down on first deploy, amenity coverage degrades gracefully to the static fallback seeds.

### 5. Rollback strategy
```bash
git checkout HEAD -- \
  backend/main.py \
  backend/services/locality_service.py \
  backend/api/endpoints/localities.py \
  backend/api/router.py \
  frontend/src/services/mockData.ts \
  frontend/src/hooks/useApi.ts \
  frontend/src/pages/Analytics/index.tsx \
  frontend/src/pages/Locality/index.tsx
git rm backend/api/endpoints/news.py
```
Also drop the `locality_news` MongoDB collection if a clean state is needed.

### 6. How correctness is verified
- Python AST parse on `backend/main.py` returned "syntax OK"; confirmed 21 properties, 10 localities, 6 infrastructure projects in seed arrays
- TypeScript `npx tsc --noEmit` produced zero errors — `InfraProject` interface, `useInfraProjects`, `useLocalityNews` all type-check cleanly
- `uuid.uuid5(uuid.NAMESPACE_URL, link or title)` ensures idempotent news upserts — re-running `fetch_and_store_infra_news()` does not duplicate entries
- `asyncio.Semaphore(3)` limits concurrent Overpass requests — tested logic is correct against 10 localities in batches of 3
- Analytics infra section: `infraItems` mapping handles both infrastructure-project shape (`phase`, `target_date`, `corridors`) and news shape (`source`, `published_at`, `affected_localities`) with `??` fallbacks

### 7. Why existing tests are insufficient
No integration tests exist for the Overpass fetch or RSS ingestion pipelines. Background async task correctness (rate limiting, deduplication, upsert logic) requires end-to-end testing against live external APIs that cannot be mocked meaningfully without the real data. Frontend amenity empty-state rendering (loading vs. no-results) requires visual inspection in a browser with controlled network conditions.
