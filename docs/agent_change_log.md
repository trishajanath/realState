# Agent Change Log

Records every non-trivial change implemented by AI agents. Governed by [.skills/audit.md](../.skills/audit.md).

---

## [Change #1] — 2026-06-13: Resolve Frontend Blank Screen Crash

| Field | Detail |
|---|---|
| **Task** | Fix blank white-screen crash on frontend load |
| **Why required** | App used `@tanstack/react-query` hooks without wrapping the component tree in `QueryClientProvider` — React threw a runtime context error, crashing the DOM entirely |
| **Files modified** | `frontend/src/App.tsx` |
| **Blast radius** | Very low — wrapping root in `QueryClientProvider` is a non-breaking setup requirement |
| **Rollback** | `git checkout HEAD -- frontend/src/App.tsx` |
| **Verification** | Browser subagent confirmed dashboard loads at `http://localhost:5173/` with no console errors |
| **Side effects** | None |
| **Deployment impact** | None — client-side only, no server or build pipeline changes |

---

## [Change #2] — 2026-06-13: Design and Implement Premium Authentication Pages

| Field | Detail |
|---|---|
| **Task** | Build Login, Signup, ForgotPassword, and VerifyEmail pages matching the platform design system |
| **Why required** | No auth UI existed — users had no way to log in or register |
| **Files modified** | `frontend/src/App.tsx`, `frontend/src/components/ui/Button.tsx` (NEW), `frontend/src/components/ui/Input.tsx` (NEW), `frontend/src/components/ui/Label.tsx` (NEW), `frontend/src/components/ui/Checkbox.tsx` (NEW), `frontend/src/components/ui/Separator.tsx` (NEW), `frontend/src/components/ui/Alert.tsx` (NEW), `frontend/src/components/ui/Toast.tsx` (NEW), `frontend/src/components/shared/AuthVisualPanel.tsx` (NEW), `frontend/src/pages/Login/index.tsx` (NEW), `frontend/src/pages/Signup/index.tsx` (NEW), `frontend/src/pages/ForgotPassword/index.tsx` (NEW), `frontend/src/pages/VerifyEmail/index.tsx` (NEW) |
| **Blast radius** | Low — new isolated routes, no changes to existing dashboard pages |
| **Rollback** | `git checkout HEAD -- frontend/src/App.tsx` then `git clean -fd` on new component/page directories |
| **Verification** | `npm run build` passed; browser subagent verified all 4 pages load, forms interactive, toast overlays work |
| **Side effects** | None |
| **Deployment impact** | None — frontend-only, no API surface changes |

---

## [Change #3] — 2026-06-13: End-to-End Google OAuth 2.0 Integration

| Field | Detail |
|---|---|
| **Task** | Connect frontend "Continue with Google" flow to backend OAuth redirect handler |
| **Why required** | Login and Signup pages had non-functional Google auth buttons |
| **Files modified** | `backend/core/config.py`, `backend/api/router.py`, `backend/main.py`, `backend/api/endpoints/auth.py` (NEW), `frontend/src/pages/Login/index.tsx`, `frontend/src/pages/Signup/index.tsx` |
| **Blast radius** | Low — confined to auth settings and handlers; microservices unaffected |
| **Rollback** | `git checkout HEAD -- backend/core/config.py backend/api/router.py backend/main.py frontend/src/pages/Login/index.tsx frontend/src/pages/Signup/index.tsx` then `rm -f backend/api/endpoints/auth.py` |
| **Verification** | `npm run build` passed; redirect parameters and state mappings inspected |
| **Side effects** | Users clicking "Continue with Google" are redirected to `accounts.google.com`, return to `/auth/google/callback` on port 8000, errors redirect to `/login?error=...` |
| **Deployment impact** | **HIGH** — authentication change. Requires Google OAuth client credentials in `.env`. Human review required before production deploy. See [deployment_risks.md](deployment_risks.md). |

---

## [Change #4] — 2026-06-13: Atlas MongoDB Integration and Security Log Sanitization

| Field | Detail |
|---|---|
| **Task** | Configure backend to use Atlas MongoDB cluster; sanitize credential logging |
| **Why required** | Backend was using local Docker MongoDB; needed cloud Atlas for persistent data |
| **Files modified** | `backend/core/database.py`, `.env` |
| **Blast radius** | Low — only DB reads/writes of unstructured properties redirect to Atlas cluster |
| **Rollback** | `git checkout HEAD -- backend/core/database.py` then manually revert `MONGODB_URL` in `.env` |
| **Verification** | `/api/v1/health` returned `mongodb: healthy` |
| **Side effects** | None |
| **Deployment impact** | **MEDIUM** — `.env` change, database URL change. Requires Atlas network allow-list configuration. See [deployment_risks.md](deployment_risks.md). |

---

## [Change #5] — 2026-06-13: Interactive Property Intelligence Map and Telemetry

| Field | Detail |
|---|---|
| **Task** | Replace static SVG mock map with full Google Maps JavaScript API integration; register client metrics to Prometheus |
| **Why required** | `/map` route showed a static non-interactive placeholder |
| **Files modified** | `frontend/src/store/useMapFilterStore.ts`, `frontend/src/components/shared/MapView.tsx`, `frontend/src/pages/Map/index.tsx`, `backend/api/endpoints/metrics.py` |
| **Blast radius** | Low — only `/map` route and new `/api/v1/metrics` receiver endpoint |
| **Rollback** | `git checkout HEAD -- frontend/src/store/useMapFilterStore.ts frontend/src/components/shared/MapView.tsx frontend/src/pages/Map/index.tsx backend/api/endpoints/metrics.py` |
| **Verification** | `npm run build` passed; `/api/v1/health` online; mock client metrics confirmed via curl POST to `/api/v1/metrics` |
| **Side effects** | None |
| **Deployment impact** | Low — new backend endpoint, Google Maps API key required in `.env` |

---

## [Change #6] — 2026-06-13: Router Protection and Maps Graceful Fallback

| Field | Detail |
|---|---|
| **Task** | Guard dashboard routes against unauthenticated access; add SVG fallback for failed Google Maps auth |
| **Why required** | Dashboard pages were accessible without authentication; broken gray Google Maps frames appeared when API key was restricted |
| **Files modified** | `frontend/src/App.tsx`, `frontend/src/components/shared/MapView.tsx` |
| **Blast radius** | Low — modifies route wrappers and loading fallback logic |
| **Rollback** | `git checkout HEAD -- frontend/src/App.tsx frontend/src/components/shared/MapView.tsx` |
| **Verification** | `npm run build` passed; verified redirect logic |
| **Side effects** | Unauthenticated visitors are redirected to `/login` before accessing any dashboard route |
| **Deployment impact** | **MEDIUM** — auth route protection change. If session token system breaks, all users are locked out. Human review recommended. |

---

## [Change #7] — 2026-06-13: Fix Maps Fallback Race and Chart Dimension Warnings

| Field | Detail |
|---|---|
| **Task** | Fix `window.gm_authFailure` overwrite race when multiple MapView instances mount simultaneously; fix Recharts negative-dimension warnings |
| **Why required** | Multiple map instances on Locality page overwrote each other's `gm_authFailure` — only one engaged the SVG fallback. Console was polluted with SVG `transform-origin` and Recharts dimension warnings |
| **Files modified** | `frontend/src/store/useMapFilterStore.ts`, `frontend/src/components/shared/MapView.tsx`, `frontend/src/pages/Locality/index.tsx`, `frontend/src/pages/Property/index.tsx`, `frontend/src/pages/Analytics/index.tsx` |
| **Blast radius** | Low — layout dimension fixes and state binding updates |
| **Rollback** | `git checkout HEAD -- frontend/src/store/useMapFilterStore.ts frontend/src/components/shared/MapView.tsx frontend/src/pages/Locality/index.tsx frontend/src/pages/Property/index.tsx frontend/src/pages/Analytics/index.tsx` |
| **Verification** | `npm run build` passed; verified both map instances degrade to SVG fallback in sync; console warnings suppressed |
| **Side effects** | None |
| **Deployment impact** | None |

---

## [Change #8] — 2026-06-13: Google Maps Advanced APIs Integration

| Field | Detail |
|---|---|
| **Task** | Wire live Geocoding, Directions, Places Nearby Search, and Street View Static APIs |
| **Why required** | User provided a fully-activated Google Maps API key; replaced text-matching commute lookups, static mock amenity pins, and placeholder property gallery images with live Google data |
| **Files modified** | `.env`, `frontend/src/store/useMapFilterStore.ts`, `frontend/src/components/shared/MapView.tsx`, `frontend/src/pages/Map/index.tsx`, `frontend/src/pages/Property/index.tsx` |
| **Blast radius** | Low — confined to map HUD panels and property detail cards; all calls have mock fallbacks |
| **Rollback** | `git checkout HEAD -- .env frontend/src/store/useMapFilterStore.ts frontend/src/components/shared/MapView.tsx frontend/src/pages/Map/index.tsx frontend/src/pages/Property/index.tsx` |
| **Verification** | `npm run build` passed; geocoding, route polyline, nearby places, and Street View URL patterns verified |
| **Side effects** | None — all API calls have catch-block fallbacks to mock data |
| **Deployment impact** | **MEDIUM** — `.env` updated with Maps API key. API key must be scope-restricted in Google Cloud Console before production. |

---

## [Change #9] — 2026-06-13: Property-First Map Filter Panel Controls and TypeScript Fixes

| Field | Detail |
|---|---|
| **Task** | Implement Sort By, Bedrooms, Bathrooms, Area slider, Locality boundaries toggle controls; fix TypeScript errors on sorting helpers and unused SVG variables |
| **Why required** | `/map` sidebar filter controls were stubs; TypeScript compiler reported errors on `ai_investment_rating`, `locality_id`, and unused SVG variables |
| **Files modified** | `frontend/src/pages/Map/index.tsx`, `frontend/src/components/shared/MapView.tsx` |
| **Blast radius** | Very low — confined to `/map` page filter sidebar rendering |
| **Rollback** | `git checkout HEAD -- frontend/src/pages/Map/index.tsx frontend/src/components/shared/MapView.tsx` |
| **Verification** | `npm run build` passed with code 0 |
| **Side effects** | None |
| **Deployment impact** | None |

---

## [Change #10] — 2026-06-13: Fix Map Search Filter Match and Select Styling

| Field | Detail |
|---|---|
| **Task** | Extend search to scan property descriptions; fix Select component rendering blank white pills |
| **Why required** | Searching "Avinashi Road" found no results because MapView only matched title/type/locality, not descriptions. Select dropdowns appeared as blank white pills due to `bg-white text-slate-700` CSS collisions with the dark theme |
| **Files modified** | `frontend/src/components/ui/Select.tsx`, `frontend/src/components/shared/MapView.tsx`, `frontend/src/pages/Map/index.tsx`, `frontend/src/hooks/useApi.ts` |
| **Blast radius** | Low — affects select dropdowns, search result listings, and endpoint routes |
| **Rollback** | `git checkout HEAD -- frontend/src/components/ui/Select.tsx frontend/src/components/shared/MapView.tsx frontend/src/pages/Map/index.tsx frontend/src/hooks/useApi.ts` |
| **Verification** | `npm run build` passed; "Avinashi Road" search correctly matches property descriptions; dropdowns render correctly |
| **Side effects** | None |
| **Deployment impact** | None |

---

## [Change #11] — 2026-06-13: Natural Language Search Query Parser and Peelamedu Listings

| Field | Detail |
|---|---|
| **Task** | Build NLP intent parser for map search bar; add Peelamedu mock property listings |
| **Why required** | "houses in peelamedu" failed because the substring matcher required the entire phrase to exist verbatim in property data |
| **Files modified** | `frontend/src/services/mockData.ts`, `frontend/src/pages/Map/index.tsx`, `frontend/src/components/shared/MapView.tsx` |
| **Blast radius** | Low — search parser and mock dataset only |
| **Rollback** | `git checkout HEAD -- frontend/src/services/mockData.ts frontend/src/pages/Map/index.tsx frontend/src/components/shared/MapView.tsx` |
| **Verification** | `npm run build` passed; "houses in peelamedu" correctly displays residential markers for Peelamedu locality |
| **Side effects** | None |
| **Deployment impact** | None |

---

## [Change #12] — 2026-06-14: Create .env with Local MongoDB URL

| Field | Detail |
|---|---|
| **Task** | Create `.env` at project root with `MONGODB_URL=mongodb://localhost:27017` so backend can connect to a locally-running MongoDB instance |
| **Why required** | Backend `config.py` defaulted to `MONGODB_URL=mongodb://mongodb:27017` (Docker internal hostname). Without `.env`, backend failed to connect to MongoDB with "No servers found yet, Timeout: 5.0s" on local dev |
| **Files modified** | `.env` (CREATED) |
| **Blast radius** | Low — only changes the MongoDB connection hostname for local development |
| **Rollback** | Delete `.env` or revert `MONGODB_URL` to `mongodb://mongodb:27017` |
| **Verification** | Backend `/api/v1/health` returns `mongodb: healthy` when MongoDB is running locally |
| **Side effects** | Also updated `POSTGRES_HOST=localhost` so microservices can connect to local PostgreSQL without Docker networking |
| **Deployment impact** | **MEDIUM** — environment variable file created with DB credentials and API keys. Must NOT be committed to git. Confirmed in `.gitignore`. See [deployment_risks.md](deployment_risks.md). |

---

## [Change #13] — 2026-06-14: Fix useApi.ts Amenity Endpoint Query Parameter

| Field | Detail |
|---|---|
| **Task** | Remove unsupported `locality_id` query parameter from amenity service fetch call |
| **Why required** | `useAmenities()` was calling `/amenities?locality_id=${localityId}` but the amenity service only accepts `category`, `source`, `search`, `limit`, `offset`. The 422 Unprocessable Entity response caused the hook to fall back to mock data with an incorrect warning |
| **Files modified** | `frontend/src/hooks/useApi.ts` |
| **Blast radius** | Very low — amenity data now returns all amenities (no locality filtering at API level); frontend already filters client-side and falls back to mock |
| **Rollback** | `git checkout HEAD -- frontend/src/hooks/useApi.ts` |
| **Verification** | `npm run build` passed; amenity service no longer receives unsupported query params |
| **Side effects** | Without locality filtering at API level, all amenities are returned; frontend mock fallback handles locality-specific display correctly |
| **Deployment impact** | None |

---

## [Change #14] — 2026-06-14: MapView.tsx Complete Dark Theme Redesign

| Field | Detail |
|---|---|
| **Task** | Replace all light/slate/colored UI elements in MapView.tsx with the Xverta Enterprise monochrome design system palette |
| **Why required** | Map component used `silverMapStyle` (light geometry `#f5f5f5`, white roads) and Tailwind slate/emerald/blue/amber classes, visually clashing with the `#000000`–`#1F1F1F` monochrome enterprise design |
| **Files modified** | `frontend/src/components/shared/MapView.tsx` |
| **Blast radius** | Low — visual-only changes, no logic or data flow alterations |
| **Rollback** | `git checkout HEAD -- frontend/src/components/shared/MapView.tsx` |
| **Verification** | `npm run build` passed in 1.80s with zero TypeScript errors |
| **Side effects** | None — all 4 HUD overlays, Google Maps style array, SVG fallback, loading skeleton, and fallback banner now use inline dark styles |
| **Deployment impact** | None |

---

## [Change #15] — 2026-06-14: Fix useMapFilterStore.ts TypeScript Interface Gap

| Field | Detail |
|---|---|
| **Task** | Add missing `newProjectsAge: string` to `MapFilterState` TypeScript interface |
| **Why required** | `newProjectsAge: 'all'` was in the initial state object but absent from the `MapFilterState` interface, causing TypeScript to treat it as an excess property on `setFilters` calls |
| **Files modified** | `frontend/src/store/useMapFilterStore.ts` |
| **Blast radius** | Very low — TypeScript interface alignment only; no runtime behavior change |
| **Rollback** | Remove the added line from `MapFilterState` interface |
| **Verification** | `npm run build` passed with zero TypeScript errors |
| **Side effects** | None |
| **Deployment impact** | None |

---

## [Change #16] — 2026-06-14: Multi-Provider Scraper Expansion & Frontend Dynamic Map Binding

| Field | Detail |
|---|---|
| **Task** | Expand real estate scraper coverage to Housing.com, support all formats (plots, villas, apartments for rent and sale) across 99acres and MagicBricks, implement a pure MongoDB pipeline for scraped listings ingestion and scoring, update search indexes, and bind frontend map markers to dynamic database properties. |
| **Why required** | The scraper coverage was incomplete, relying on mock listings and lacking Housing.com. Search indexes used wrong schema fields (e.g. `locality_name` instead of `locality.name`), and frontend map views were hardcoded to mock listings. |
| **Files modified** | `services/scraper/providers/housing.py` (NEW), `services/scraper/providers/magic_bricks.py`, `services/scraper/providers/nn_acres.py`, `services/scraper/ingest_to_db.py`, `services/scraper/main.py`, `backend/main.py`, `backend/repositories/mongo_search.py`, `frontend/src/components/shared/MapView.tsx`, `frontend/src/pages/Map/index.tsx` |
| **Blast radius** | Low — isolated scraper backend logic, corrected backend search database mapping, and mapped client components. |
| **Rollback** | `git checkout HEAD -- services/scraper/providers/magic_bricks.py services/scraper/providers/nn_acres.py services/scraper/ingest_to_db.py services/scraper/main.py backend/main.py backend/repositories/mongo_search.py frontend/src/components/shared/MapView.tsx frontend/src/pages/Map/index.tsx` then `rm -f services/scraper/providers/housing.py` |
| **Verification** | `npm run build` compiled cleanly. Scraper ingestion ran successfully (`python3 services/scraper/main.py` and `python3 services/scraper/ingest_to_db.py`). Frontend maps verified as rendering dynamic listings with correct coordinates. |
| **Side effects** | None. All operations fall back gracefully if MongoDB Atlas connectivity fails. |
| **Deployment impact** | **MEDIUM** — Database schema indexes updated and new collections populated. |

---

## [Change #17] — 2026-06-16: Fix Map Loading — Property Shape Mismatch, Script Race, Backend Seeding

| Field | Detail |
|---|---|
| **Task** | Fix Google Maps not loading/showing properties; improve backend data availability |
| **Why required** | `useProperties()` returns `PropertyListResult` but `MapView.tsx` and `Map/index.tsx` used the result directly as `Property[]`, crashing with `TypeError: .filter is not a function`. Default limit=20 truncated map data. Script loader race condition left map stuck on SPA re-mount. MongoDB `localities` collection was never seeded so locality API returned empty array. |
| **Files modified** | `frontend/src/components/shared/MapView.tsx`, `frontend/src/pages/Map/index.tsx`, `backend/main.py` |
| **Blast radius** | Medium — map rendering corrected; backend now seeds 4 collections on startup |
| **Rollback** | `git checkout HEAD -- frontend/src/components/shared/MapView.tsx frontend/src/pages/Map/index.tsx backend/main.py` |
| **Verification** | `propertiesResult?.results` is an array; `.filter()` no longer throws. Locality API returns 7 localities. Script loader resolves immediately when Maps SDK already initialized. |
| **Side effects** | Map now requests up to 100 properties on load. Startup seeds are idempotent (upsert by id). |
| **Deployment impact** | **LOW** — Backend seeding is additive and idempotent. Frontend-only runtime fix otherwise. |

---

## [Change #18] — 2026-06-16: Map UX — Show All Modal + Coimbatore Centering

| Field | Detail |
|---|---|
| **Task** | Replace cluttered sidebar property list with a Show All modal; fix map center/zoom |
| **Why required** | Sidebar list wasted map space; map was centered at railway station (skewed west); no browse flow existed |
| **Files modified** | `frontend/src/pages/Map/index.tsx`, `frontend/src/components/shared/MapView.tsx` |
| **Blast radius** | Medium — Map page structurally rewritten; no API or data changes |
| **Rollback** | `git checkout HEAD -- frontend/src/pages/Map/index.tsx frontend/src/components/shared/MapView.tsx` |
| **Verification** | Modal opens with all filtered properties in 2-col grid; click selects + closes; map opens at (11.04, 76.99) zoom 11 |
| **Side effects** | Sidebar narrowed 360→300px; Show All replaces old scroll list |
| **Deployment impact** | None |

---

## [Change #19] — 2026-06-16: Map Sidebar Light Theme Conversion

| Field | Detail |
|---|---|
| **Task** | Convert all sidebar color tokens from dark palette to XVERTA light theme |
| **Why required** | Sidebar was the last component still using dark monochrome (`#000000` bg / `#FFFFFF` text) after the rest of the app was converted to light theme. Visually clashed with white AppLayout shell. |
| **Files modified** | `frontend/src/pages/Map/index.tsx` |
| **Blast radius** | Low — pure visual token changes; no logic, layout, or API changes |
| **Rollback** | `git checkout HEAD -- frontend/src/pages/Map/index.tsx` |
| **Verification** | Sidebar bg is `#FFFFFF`; text, badges, inputs, filter buttons, and empty state all use light-theme tokens; Show All button inverted to black-on-white CTA; PropertyListModal and map HUD stay dark |
| **Side effects** | None — StreetViewModal and map HUD overlay intentionally remain dark |
| **Deployment impact** | None |

---

## [Change #20] — 2026-06-16: UI Data Density Overhaul — Home, Locality, Analytics Pages

| Field | Detail |
|---|---|
| **Task** | Surface all hidden `LocalityMetrics` data; make dashboard pages data-dense and professional |
| **Why required** | UI was showing only 3 of 20+ available `LocalityMetrics` fields. KPI cards had no deltas, rankings table had 5 columns for 4 localities, the Locality page showed no density/transit/proximity data, Analytics rankings omitted lifestyle and yield columns. Design philosophy mandate: specificity over vibes, no empty space without data. |
| **Files modified** | `frontend/src/pages/Home/index.tsx` — 6-KPI grid with delta badges, 9-col 7-locality rankings table, Market Signals section, enriched Infrastructure Pipeline, 6-stat bottom strip; `frontend/src/pages/Locality/index.tsx` — Market Snapshot (6 cells), Investment Profile score bars (6 dimensions), Amenity Density chips (6 categories/km²), Connectivity panel (railway/airport/bus terminal distances + highway score + key proximities), mock fallback for all fields; `frontend/src/pages/Analytics/index.tsx` — Rankings tab expanded to 9 columns (added Lifestyle + Yield%), Yield tab comparative table (gross/net/vs-baseline), Price Trends mini-summary table per locality |
| **Blast radius** | Low — frontend-only visual rewrites; no API, routing, or auth changes. Mock fallbacks ensure pages render even when API fields are absent. |
| **Rollback** | `git checkout HEAD -- frontend/src/pages/Home/index.tsx frontend/src/pages/Locality/index.tsx frontend/src/pages/Analytics/index.tsx` |
| **Verification** | TypeScript compiles without errors. All sub-components (`KpiCard`, `LocalityTableRow`, `ScoreBar`, `DensityChip`, `TransitRow`) defined outside main component to avoid hooks-in-loops violations. Mock fallback chain `metricsApi \|\| mockMetrics[id]` verified. |
| **Side effects** | `useLocalityAmenities` (nested endpoint) replaces top-level `useAmenities` on Locality page — semantically correct. `useRecommendations` hook now consumed (was imported but unused). |
| **Deployment impact** | None |

---

## [Change #21] — 2026-06-16: Real Data Refactor — Overpass Amenities, RSS News, Expanded Projects

| Field | Detail |
|---|---|
| **Task** | Replace all fake/mock data with real scraped data: live OpenStreetMap POIs, real Coimbatore property projects, real infrastructure news from The Hindu RSS |
| **Why required** | User mandate: "only real info must be shown all across — not fake." `mockAmenities` contained invented place names; `SEED_PROPERTIES` had only 7 entries for 7 localities; the Analytics infra pipeline was a hardcoded 4-item array with no source links. |
| **Files modified** | `backend/main.py` (major — expanded seeds to 21 properties/10 localities/6 infra projects; added `fetch_real_amenities_overpass()`, `update_amenities_from_overpass()`, `fetch_and_store_infra_news()` background tasks; two-phase `lifespan()` startup); `backend/services/locality_service.py` (added `self.news`, `get_news()` method); `backend/api/endpoints/localities.py` (added `/news` route); `backend/api/endpoints/news.py` (NEW — `/api/v1/news` endpoint); `backend/api/router.py` (registered news router); `frontend/src/services/mockData.ts` (`mockAmenities` emptied; 3 localities added); `frontend/src/hooks/useApi.ts` (added `InfraProject`, `useInfraProjects`, `useLocalityNews`); `frontend/src/pages/Analytics/index.tsx` (infra section reads from `useInfraProjects()`, not hardcoded); `frontend/src/pages/Locality/index.tsx` (fake amenity fallback fully removed; proper loading/empty states) |
| **Blast radius** | Medium — backend startup logic changed; new MongoDB collection `locality_news`; new `/api/v1/news` endpoint; amenity display now fully API-dependent with graceful static fallback |
| **Rollback** | `git checkout HEAD -- backend/main.py backend/services/locality_service.py backend/api/endpoints/localities.py backend/api/router.py frontend/src/services/mockData.ts frontend/src/hooks/useApi.ts frontend/src/pages/Analytics/index.tsx frontend/src/pages/Locality/index.tsx && git rm backend/api/endpoints/news.py` |
| **Verification** | Python AST parse returned "syntax OK" (21 properties, 10 localities, 6 infra projects confirmed). `npx tsc --noEmit` — zero TypeScript errors. Overpass deduplication via `(name.lower(), category)`. News deduplication via `uuid.uuid5`. Both background tasks fire non-blocking via `asyncio.create_task()`. |
| **Side effects** | Overpass and RSS failures degrade gracefully — static seeds remain as fallback. Locality page shows "Loading amenities from OpenStreetMap…" on first load until background task completes. |
| **Deployment impact** | Requires outbound HTTP access from backend to `overpass-api.de` and `thehindu.com`. First-time startup seeds data within ~10 seconds; real Overpass data loads within 30–60 seconds in background. |
