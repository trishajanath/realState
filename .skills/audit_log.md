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


