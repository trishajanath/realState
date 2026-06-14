# Agent Shortcuts Log

Records every shortcut, hardcoded value, mock, temporary fix, or technical debt introduced by AI agents. Governed by [.skills/audit.md](../.skills/audit.md).

---

## Shortcut #1 — Hardcoded Mock Data as Primary Data Source

**Change reference**: Changes #2, #5, #7, #9, #10, #11

**What happened**:
All backend microservices (locality intelligence on port 8001, amenity intelligence on port 8002, recommendation engine on port 8003) require PostgreSQL + Redis to be running. Since these are not guaranteed to be running in local dev, all `useApi.ts` hooks fall back to data defined in `frontend/src/services/mockData.ts` when any service is offline.

Mock data includes:
- `mockLocalities` — 5 hardcoded Coimbatore localities with fixed coordinates, scores, and metrics
- `mockProperties` — hardcoded property listings with fixed prices, lat/lng, and descriptions
- `mockAmenities` — per-locality hardcoded school, hospital, restaurant entries
- `mockRecommendations` — hardcoded recommendation lists per locality

**Why it happened**: Microservices require full PostgreSQL + Redis setup; enforcing live data would block all frontend development until all services are running.

**Risk level**: Medium
- Data displayed in the UI is always fake unless all 4 microservices are online simultaneously
- Mock prices, scores, and coordinates do not reflect real Coimbatore market data
- Users cannot distinguish mock data from live data at the UI level

**Recommended fix**:
1. Add a visible "DEMO MODE" banner or badge in the UI when `useMockFallback` is true or any service returns a fallback
2. Populate PostgreSQL with seed data and document a `docker-compose up` one-liner for local dev
3. Add a `/status` panel showing which of the 4 services are online vs. using mock data

---

## Shortcut #2 — Hardcoded Design System Colors as Inline Styles

**Change reference**: Changes #2, #5, #6, #7, #8, #9, #10, #11, #14

**What happened**:
The Xverta Enterprise Design System v2 palette is implemented as raw inline `style={{ color: '#52525B' }}` objects throughout all components rather than as CSS custom properties or a typed design token object.

Hex values used across the codebase:
- Backgrounds: `#000000`, `#0A0A0A`, `#111111`, `#161616`, `#1C1C1C`
- Borders: `#1F1F1F`, `#2A2A2A`, `#3F3F46`
- Text: `#FFFFFF`, `#A1A1AA`, `#71717A`, `#52525B`, `#3F3F46`

**Why it happened**: Tailwind CSS classes were used initially but conflicted with the dark design requirements; inline styles provided immediate override control without requiring Tailwind configuration changes.

**Risk level**: Low-Medium
- Design changes require find-replace across many files rather than a single token update
- No single source of truth for the palette in code

**Recommended fix**:
Create `frontend/src/styles/tokens.ts`:
```typescript
export const tokens = {
  bg: { base: '#000000', elevated: '#0A0A0A', surface: '#111111', card: '#1C1C1C' },
  border: { subtle: '#1F1F1F', default: '#2A2A2A', emphasis: '#3F3F46' },
  text: { primary: '#FFFFFF', secondary: '#A1A1AA', tertiary: '#71717A', muted: '#52525B', disabled: '#3F3F46' },
};
```
Then import and use `tokens.text.muted` instead of `'#52525B'` everywhere.

---

## Shortcut #3 — Client-Side Route Guard Without Token Expiry Handling

**Change reference**: Change #6

**What happened**:
Route protection checks only for the presence of an auth token in localStorage/session. It does not validate the token's expiry timestamp or signature on the client side.

**Why it happened**: Full JWT validation requires either decoding the JWT on the client (leaks signature algorithm) or making an API call on every route change (adds latency). The presence check was the simplest immediate fix.

**Risk level**: Medium
- An expired token will still pass the client-side guard and allow dashboard access
- The backend API will reject expired tokens per-request, so no data is leaked — but the user sees the dashboard UI briefly before being kicked out

**Recommended fix**:
1. Decode the JWT expiry claim (`exp`) client-side on route change (no signature verification needed — just expiry check)
2. If `Date.now() / 1000 > exp`, clear the token and redirect to `/login`

---

## Shortcut #4 — Google OAuth Callback Does Not Issue Persistent Session

**Change reference**: Change #3

**What happened**:
The Google OAuth callback (`/auth/google/callback`) exchanges the authorization code for user info and returns it as a JSON response. It does not issue a persistent JWT or session cookie that the frontend can store for subsequent authenticated API calls.

**Why it happened**: JWT signing requires a secret key; implementing a full stateless JWT auth system was deferred to avoid scope creep in the OAuth integration task.

**Risk level**: High (for production use)
- Users who log in via Google have no persistent auth token — they would need to re-authenticate on every page load
- All dashboard route guards that check for a stored token will immediately redirect Google-authed users to `/login`

**Recommended fix**:
In `backend/api/endpoints/auth.py` callback handler:
1. Generate a signed JWT with `python-jose` or `PyJWT` containing `sub` (user ID), `email`, `exp` (24h)
2. Return the JWT in the response body or set it as an `HttpOnly` cookie
3. Frontend stores the JWT in localStorage and includes it as `Authorization: Bearer <token>` on all API calls

---

## Shortcut #5 — Amenity Endpoint Returns All Amenities Without Locality Filtering

**Change reference**: Change #13

**What happened**:
`useAmenities(localityId)` now calls `/amenities` with no query parameters, returning all amenities in the database regardless of locality. The `localityId` parameter is only used for the mock data fallback key lookup.

**Why it happened**: The amenity service `/amenities` endpoint does not accept `locality_id`. The correct locality-aware endpoint is `/amenities/nearby?latitude=X&longitude=Y&radius_meters=Z`, which requires the locality's coordinates — not just its ID.

**Risk level**: Low (while microservices are offline and mock fallback is active); Medium (once amenity service is live)
- When the amenity service comes online, `useAmenities` will return all amenities for all localities, not just the selected one
- Locality page will show irrelevant amenities

**Recommended fix**:
Update `useAmenities` to accept `latitude` and `longitude` parameters and call `/amenities/nearby`:
```typescript
export function useAmenities(latitude: number, longitude: number, radius = 2000) {
  return useQuery<Amenity[]>({
    queryKey: ['amenities', latitude, longitude],
    queryFn: async () => {
      const res = await fetch(getUrl('amenities', `/amenities/nearby?latitude=${latitude}&longitude=${longitude}&radius_meters=${radius}`));
      // ...
    }
  });
}
```

---

## Shortcut #6 — NLP Search Parser Uses Regex, Not a Real NLP Model

**Change reference**: Change #11

**What happened**:
The "natural language" search parser in `Map/index.tsx` uses regex pattern matching and keyword lists (BHK numbers, property type synonyms, locality name matching) rather than a real language model or NLP library.

**Why it happened**: Integrating an NLP model adds a dependency and API call latency; regex parsing covers the documented query patterns sufficiently for the current mock dataset.

**Risk level**: Low
- Ambiguous or complex queries silently fall back to substring match
- Unrecognized query patterns produce no results rather than a helpful error

**Recommended fix**:
For production, integrate the Gemini API (already in `.env` as `GEMINI_API_KEY`) to parse free-text search intents server-side and return structured `{ locality, type, bedrooms, listingType }` JSON.

---

## Shortcut #7 — Google Maps API Key Loaded at Runtime Without Caching

**Change reference**: Changes #5, #8

**What happened**:
The Maps API key is fetched from `/api/v1/auth/google/config` on every MapView component mount. No caching layer (React Query staleTime, localStorage) is in place, so multiple map instances on a page trigger multiple identical API calls.

**Why it happened**: Caching the API key in localStorage would expose it to XSS; a stale time in React Query was the intended fix but was not implemented.

**Risk level**: Low
- Redundant network requests to the backend; not a security risk since the key is already client-side once loaded
- Minor performance overhead on pages with multiple map instances

**Recommended fix**:
Set `staleTime: Infinity` in the React Query config for the API key fetch, or use Zustand to cache the key in `mapsApiKey` after the first successful fetch (already in the store — just needs the caching logic wired up).

---

## Shortcut #8 — Simulated HTTP Responses in Scraper Providers

**Change reference**: Change #16

**What happened**:
Scraper providers for MagicBricks, 99Acres, and Housing.com simulate web page responses and structure parsing instead of executing real raw HTTP fetches, avoiding network blocker filters and captcha mechanisms during development.

**Why it happened**: Real-world scraping of major real estate portals frequently triggers Cloudflare / captcha challenges, which blocks deterministic backend database ingestion and testing.

**Risk level**: Medium
- If the HTML structure of the external portal changes, the simulation remains functional, but the real scraping code (if enabled) would break.
- Relies on synthetic data templates.

**Recommended fix**:
1. Implement a rotating proxy provider service.
2. Build an integration test that checks real DOM selectors on live target pages and alerts developers when selectors break.
