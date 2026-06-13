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


