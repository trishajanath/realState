# Agent Trust Log

Records confidence levels, review requirements, and assumptions for every change. Governed by [.skills/audit.md](../.skills/audit.md).

Format: Confidence 1 (no confidence) → 10 (fully certain).

---

## [Change #1] — 2026-06-13: Resolve Frontend Blank Screen Crash

| Field | Value |
|---|---|
| **Confidence before implementation** | 9/10 |
| **Confidence after implementation** | 10/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes |
| **Assumptions made** | QueryClientProvider must wrap the entire component tree — standard React Query requirement |
| **Uncertainty remaining** | None |

---

## [Change #2] — 2026-06-13: Premium Authentication Pages

| Field | Value |
|---|---|
| **Confidence before implementation** | 8/10 |
| **Confidence after implementation** | 9/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes |
| **Assumptions made** | Auth pages use mock form submission only — no real backend validation yet. Password strength meter is client-side only. |
| **Uncertainty remaining** | Form validation behavior under edge-case inputs (empty fields, special characters) not exhaustively tested |

---

## [Change #3] — 2026-06-13: End-to-End Google OAuth 2.0 Integration

| Field | Value |
|---|---|
| **Confidence before implementation** | 7/10 |
| **Confidence after implementation** | 8/10 |
| **Human review required?** | **Yes** — Authentication change |
| **Safe to merge automatically?** | **No** — OAuth redirect flows require validation in a real Google Cloud environment with correct authorized redirect URIs configured |
| **Assumptions made** | `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` will be added to `.env` before testing. Callback route `/auth/google/callback` is accessible from the OAuth redirect URI allowlist in Google Cloud Console. |
| **Uncertainty remaining** | Token exchange and session persistence not fully implemented — the OAuth callback returns user info but does not issue a persistent JWT or session cookie yet |

---

## [Change #4] — 2026-06-13: Atlas MongoDB Integration

| Field | Value |
|---|---|
| **Confidence before implementation** | 8/10 |
| **Confidence after implementation** | 9/10 |
| **Human review required?** | **Yes** — database connection change; Atlas network allow-list must be configured |
| **Safe to merge automatically?** | **No** — requires Atlas IP allow-list to include the deployment server's IP |
| **Assumptions made** | Atlas cluster is in the same region as the deployment target; `MONGODB_URL` in `.env` contains a valid Atlas SRV connection string with credentials |
| **Uncertainty remaining** | Connection pool behavior under high concurrency not validated; Atlas free-tier connection limits not checked |

---

## [Change #5] — 2026-06-13: Interactive Property Intelligence Map and Telemetry

| Field | Value |
|---|---|
| **Confidence before implementation** | 8/10 |
| **Confidence after implementation** | 9/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes |
| **Assumptions made** | `VITE_GOOGLE_MAPS_API_KEY` is loaded from `/api/v1/auth/google/config` at runtime, not hardcoded in the bundle. Metrics endpoint is append-only and does not expose sensitive data. |
| **Uncertainty remaining** | Prometheus scrape interval alignment with the client metrics receiver not validated end-to-end |

---

## [Change #6] — 2026-06-13: Router Protection and Maps Graceful Fallback

| Field | Value |
|---|---|
| **Confidence before implementation** | 8/10 |
| **Confidence after implementation** | 9/10 |
| **Human review required?** | **Yes** — route protection is an auth/authorization change |
| **Safe to merge automatically?** | **No** — if token validation logic has a bug, all authenticated users could be incorrectly redirected to `/login` (lockout risk) |
| **Assumptions made** | Auth token presence in localStorage/session is sufficient for route guard check; full JWT signature validation occurs on the backend per API call |
| **Uncertainty remaining** | Token expiry handling not implemented — an expired token will still pass the client-side route guard |

---

## [Change #7] — 2026-06-13: Fix Maps Fallback Race and Chart Dimension Warnings

| Field | Value |
|---|---|
| **Confidence before implementation** | 9/10 |
| **Confidence after implementation** | 10/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes |
| **Assumptions made** | Moving `gm_authFailure` handler to Zustand store global scope (instead of per-component `useEffect`) correctly resolves the race condition for all mounted instances |
| **Uncertainty remaining** | None |

---

## [Change #8] — 2026-06-13: Google Maps Advanced APIs Integration

| Field | Value |
|---|---|
| **Confidence before implementation** | 7/10 |
| **Confidence after implementation** | 8/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes (with API key restrictions configured) |
| **Assumptions made** | Google Maps API key has Geocoding, Directions, Places, and Street View Static APIs enabled in Google Cloud Console. All advanced API calls are client-side and have mock fallbacks. |
| **Uncertainty remaining** | API rate limits and quota caps not verified. Street View Static API generates signed URL requests from frontend — key must be restricted by HTTP referrer, not IP |

---

## [Change #9] — 2026-06-13: Property-First Map Filter Panel Controls

| Field | Value |
|---|---|
| **Confidence before implementation** | 9/10 |
| **Confidence after implementation** | 10/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes |
| **Assumptions made** | Filter state is co-located in Zustand `useMapFilterStore`; no server-side filtering needed for the current mock data set |
| **Uncertainty remaining** | None |

---

## [Change #10] — 2026-06-13: Fix Map Search Filter and Select Styling

| Field | Value |
|---|---|
| **Confidence before implementation** | 9/10 |
| **Confidence after implementation** | 10/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes |
| **Assumptions made** | Extending search to match `description` field is safe — all properties in the mock dataset have a `description` string |
| **Uncertainty remaining** | None |

---

## [Change #11] — 2026-06-13: Natural Language Search Query Parser

| Field | Value |
|---|---|
| **Confidence before implementation** | 8/10 |
| **Confidence after implementation** | 9/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes |
| **Assumptions made** | NLP parser uses regex keyword extraction — no external NLP model required. Parser correctly handles the documented query patterns ("X BHK in Y", "rent in Y", etc.). |
| **Uncertainty remaining** | Parser does not handle complex queries with multiple localities or contradictory filters; ambiguous queries fall back to substring match |

---

## [Change #12] — 2026-06-14: Create .env with Local MongoDB URL

| Field | Value |
|---|---|
| **Confidence before implementation** | 10/10 |
| **Confidence after implementation** | 10/10 |
| **Human review required?** | **Yes** — `.env` file contains API keys and DB credentials |
| **Safe to merge automatically?** | **No** — `.env` must NEVER be committed to git; must be in `.gitignore` |
| **Assumptions made** | MongoDB is running locally on the default port 27017. `.gitignore` already lists `.env`. |
| **Uncertainty remaining** | None — this is a local dev fix only; production uses Atlas SRV connection string |

---

## [Change #13] — 2026-06-14: Fix useApi.ts Amenity Endpoint

| Field | Value |
|---|---|
| **Confidence before implementation** | 10/10 |
| **Confidence after implementation** | 10/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes |
| **Assumptions made** | Amenity service `/amenities` endpoint parameters are fixed (category/source/search/limit/offset) per its `main.py` FastAPI route definition |
| **Uncertainty remaining** | Without locality filtering at the API level, the amenity hook returns all amenities globally; proper locality-based filtering would require the nearby endpoint `/amenities/nearby` with lat/lng coordinates |

---

## [Change #14] — 2026-06-14: MapView.tsx Dark Theme Redesign

| Field | Value |
|---|---|
| **Confidence before implementation** | 9/10 |
| **Confidence after implementation** | 10/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes |
| **Assumptions made** | Xverta Enterprise Design System v2 palette is the authoritative source of truth for all colors: `#000000`, `#0A0A0A`, `#111111`, `#1C1C1C`, `#2A2A2A` backgrounds; `#FFFFFF`, `#A1A1AA`, `#71717A`, `#52525B`, `#3F3F46` text |
| **Uncertainty remaining** | None |

---

## [Change #15] — 2026-06-14: Fix useMapFilterStore.ts TypeScript Interface

| Field | Value |
|---|---|
| **Confidence before implementation** | 10/10 |
| **Confidence after implementation** | 10/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes |
| **Assumptions made** | `newProjectsAge` should be typed as `string` (not a union) to accommodate future filter values beyond `'all'` |
| **Uncertainty remaining** | None |

---

## [Change #16] — 2026-06-14: Multi-Provider Scraper Expansion & Frontend Dynamic Map Binding

| Field | Value |
|---|---|
| **Confidence before implementation** | 9/10 |
| **Confidence after implementation** | 9/10 |
| **Human review required?** | Yes |
| **Safe to merge automatically?** | Yes (after verifying remote MongoDB instance connection and scraper logs) |
| **Assumptions made** | The simulated listings schema maps seamlessly to existing search logic, and index changes are non-breaking. |
| **Uncertainty remaining** | Long-term rate limits on housing providers or external network blocks during real scraper execution. |

---

## [Change #17] — 2026-06-16: Fix Map Loading — Property Shape Mismatch, Script Race, Backend Seeding

| Field | Value |
|---|---|
| **Confidence before implementation** | 9/10 |
| **Confidence after implementation** | 9/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes |
| **Assumptions made** | MongoDB Atlas is reachable on startup; upserts are safe to run on every restart. `useProperties({ limit: 100 })` is sufficient for current dataset; pagination would be needed beyond ~100 listings. |
| **Uncertainty remaining** | If the Google Maps API key is invalid, the map falls back to SVG canvas — this is expected behavior. |

---

## [Change #18] — 2026-06-16: Map UX — Show All Modal + Coimbatore Centering

| Field | Value |
|---|---|
| **Confidence before implementation** | 10/10 |
| **Confidence after implementation** | 10/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes |
| **Assumptions made** | (11.04, 76.99) zoom 11 is a good default for Coimbatore city; modal 860px wide fits on 1024px+ screens |
| **Uncertainty remaining** | None |

---

## [Change #19] — 2026-06-16: Map Sidebar Light Theme Conversion

| Field | Value |
|---|---|
| **Confidence before implementation** | 10/10 |
| **Confidence after implementation** | 10/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes |
| **Assumptions made** | XVERTA light theme palette (`#FFFFFF` bg, `#000000` text, `#F9FAFB` inputs, `#E5E7EB` borders, `#6B7280`/`#9CA3AF` muted text) is the correct target for the sidebar |
| **Uncertainty remaining** | None |

---

## [Change #20] — 2026-06-16: UI Data Density Overhaul — Home, Locality, Analytics Pages

| Field | Value |
|---|---|
| **Confidence before implementation** | 8/10 |
| **Confidence after implementation** | 9/10 |
| **Human review required?** | No |
| **Safe to merge automatically?** | Yes |
| **Assumptions made** | `LocalityMetrics` fields (density per km², transit distances, proximity scores) are populated by the backend seed; mock fallback (`mockMetrics[localityId]`) is used when API data is unavailable. Score bars use fixed thresholds (green ≥80, blue ≥65, amber <65). Analytics Rankings adds `lifestyle_score` and `rental_yield_estimate` from mockScores/mockMetrics since no dedicated API endpoint exists for these at the aggregate level. |
| **Uncertainty remaining** | If the backend does not return all `LocalityMetrics` fields (e.g. `schools_per_sq_km`, `nearest_railway_station`), the UI silently falls back to mock values — real data quality not verified end-to-end. |

---

## [Change #21] — 2026-06-16: Real Data Refactor — Overpass Amenities, RSS News, Expanded Projects

| Field | Value |
|---|---|
| **Confidence before implementation** | 8/10 |
| **Confidence after implementation** | 9/10 |
| **Human review required?** | **Yes** — new external API dependencies (`overpass-api.de`, The Hindu RSS) and a new MongoDB collection; deployment environment must have outbound HTTP access |
| **Safe to merge automatically?** | **No** — verify outbound connectivity to Overpass and The Hindu RSS from the deployment host before merging; test that `asyncio.Semaphore(3)` rate-limiting is sufficient under real Overpass API load |
| **Assumptions made** | (1) Overpass API is reachable from the backend host at startup — if not, the 15-entry static `SEED_AMENITIES` serve as fallback and the app is functional. (2) The Hindu Coimbatore RSS URL (`https://www.thehindu.com/news/cities/Coimbatore/feeder/default.rss`) remains stable and returns infrastructure-relevant items. (3) `uuid.uuid5(NAMESPACE_URL, link or title)` provides sufficient deduplication for RSS items. (4) Real property developer names (Casagrand, KG Foundation, etc.) and project details are accurate as of research at implementation time. |
| **Uncertainty remaining** | Overpass POI quality depends on OSM contributor coverage of each Coimbatore locality — low-coverage areas may return fewer than expected amenities. The Hindu RSS filtering (keyword-based) may miss some infra news or include off-topic articles. Real Overpass latency per locality is unknown; the `asyncio.Semaphore(3)` batch size may need tuning. |
