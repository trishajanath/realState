# Deployment Risk Log

Records risks for changes affecting infrastructure, database, authentication, environment variables, CI/CD, monitoring, or secrets. Governed by [.skills/audit.md](../.skills/audit.md).

Any change to auth, database schema, or secrets **requires human sign-off in [agent_trust_log.md](agent_trust_log.md) before production deploy**.

---

## Risk #1 — Google OAuth 2.0 Integration (Change #3)

| Field | Detail |
|---|---|
| **Change** | Added `/auth/google/callback` backend endpoint; frontend redirects to Google consent page |
| **Risk level** | HIGH |
| **Blast radius** | All users attempting login via Google — if OAuth redirect URI is misconfigured, login fails entirely |
| **Rollback complexity** | Low — revert `backend/api/endpoints/auth.py` and remove the Google button from Login/Signup pages |
| **Downtime potential** | None for email/password login; Google OAuth flow is additive |
| **User impact** | If misconfigured, "Continue with Google" silently fails or returns an OAuth error page |
| **Pre-deploy checklist** | ☐ `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set in production secrets manager (not `.env`) · ☐ Production callback URI registered in Google Cloud Console OAuth 2.0 client · ☐ `http://localhost:5173` removed from authorized origins in production · ☐ OAuth token exchange and JWT issuance implemented (currently missing — see [agent_shortcuts.md](agent_shortcuts.md) Shortcut #4) |

---

## Risk #2 — Atlas MongoDB Connection (Change #4)

| Field | Detail |
|---|---|
| **Change** | `MONGODB_URL` in `.env` updated to Atlas SRV connection string |
| **Risk level** | MEDIUM |
| **Blast radius** | All backend reads/writes of property and user data; backend fails to start if Atlas is unreachable |
| **Rollback complexity** | Low — revert `MONGODB_URL` in `.env` to `mongodb://localhost:27017` or Docker hostname |
| **Downtime potential** | Full backend outage if Atlas cluster is unavailable or IP allow-list is not configured |
| **User impact** | All API calls to `/api/v1/properties`, `/api/v1/auth/*` return 500 if MongoDB connection fails |
| **Pre-deploy checklist** | ☐ Production server IP added to Atlas Network Access allow-list · ☐ Atlas user has read/write permissions on `realstate_mongo` database · ☐ Connection pool size validated for expected concurrency · ☐ Atlas backup enabled on the cluster |

---

## Risk #3 — Route Protection / Auth Guard (Change #6)

| Field | Detail |
|---|---|
| **Change** | All dashboard routes wrapped in auth guard; unauthenticated users redirected to `/login` |
| **Risk level** | MEDIUM |
| **Blast radius** | All authenticated users — a bug in the token check logic locks all users out of the dashboard |
| **Rollback complexity** | Low — revert `frontend/src/App.tsx` to remove the `ProtectedRoute` wrapper |
| **Downtime potential** | No server downtime; frontend-only change. Broken auth guard causes instant user-facing lockout. |
| **User impact** | If token expiry is not handled (see Shortcut #3), users with expired tokens see the dashboard briefly then get redirected to login on every API call failure |
| **Pre-deploy checklist** | ☐ Token expiry check implemented client-side · ☐ Refresh token flow implemented or users redirected gracefully on 401 responses · ☐ Route guard tested with: valid token, expired token, missing token, malformed token |

---

## Risk #4 — Google Maps API Key in .env (Changes #5, #8)

| Field | Detail |
|---|---|
| **Change** | `GOOGLE_MAPS_API_KEY` added to `.env`; key fetched at runtime from `/api/v1/auth/google/config` |
| **Risk level** | MEDIUM |
| **Blast radius** | Maps feature — if key is revoked or quota is exhausted, all map views degrade to SVG fallback |
| **Rollback complexity** | Very low — remove key from `.env`; maps gracefully fall back to SVG automatically |
| **Downtime potential** | None — SVG fallback is always available |
| **User impact** | Map shows interactive SVG instead of Google Maps if key fails; no data loss |
| **Pre-deploy checklist** | ☐ API key restricted by HTTP referrer (production domain only) in Google Cloud Console · ☐ Geocoding, Directions, Places, and Street View Static APIs enabled on the key · ☐ Billing alerts configured for Maps API quota · ☐ Key is NOT embedded in the frontend bundle (confirmed: loaded via backend API call at runtime) |

---

## Risk #5 — .env Creation with DB Credentials and API Keys (Change #12)

| Field | Detail |
|---|---|
| **Change** | `.env` file created at project root with MongoDB URL, PostgreSQL credentials, and Gemini API key |
| **Risk level** | HIGH (if committed to git); LOW (if gitignored correctly) |
| **Blast radius** | If `.env` is committed, all credentials are exposed in git history permanently |
| **Rollback complexity** | If committed accidentally: requires `git filter-branch` or `git-filter-repo` to purge from history, plus credential rotation for all exposed secrets |
| **Downtime potential** | None — file creation doesn't affect running services |
| **User impact** | Credential exposure could lead to unauthorized database access or API quota abuse |
| **Pre-deploy checklist** | ☐ Confirm `.env` is listed in `.gitignore` · ☐ Run `git status` to verify `.env` is NOT tracked · ☐ Production uses secrets manager (AWS Secrets Manager / GCP Secret Manager / HashiCorp Vault) — not `.env` file · ☐ Rotate `GEMINI_API_KEY` if it was ever exposed in a commit or log |

---

## Risk #6 — CORS Wildcard in Backend (Pre-existing, flagged in xverta_research.md)

| Field | Detail |
|---|---|
| **Change** | Pre-existing — `allow_origins=["*"]` in `backend/main.py` |
| **Risk level** | HIGH for production |
| **Blast radius** | Any web origin can make authenticated API calls to the backend |
| **Rollback complexity** | Low — replace wildcard with explicit domain list |
| **Downtime potential** | None — restricting CORS is additive |
| **User impact** | None for legitimate users; eliminates cross-origin attack vector |
| **Pre-deploy checklist** | ☐ Replace `allow_origins=["*"]` with `["https://yourdomain.com", "https://www.yourdomain.com"]` · ☐ Add `CORS_ORIGINS` as a configurable environment variable in `config.py` · ☐ Test that frontend on the production domain can still reach the backend API |

---

## Risk #7 — Mixed Dark/Light Theme After XVERTA Rebrand (Change #16)

| Field | Detail |
|---|---|
| **Change** | Global CSS switched to light theme; Home, Login, Signup, and AppLayout migrated; inner pages (Compare, Analytics, Property, Map, Locality) still carry dark inline styles |
| **Risk level** | LOW |
| **Blast radius** | Cosmetic only — inner dashboard pages render dark content on a white-inherited shell. No data, auth, or functionality is affected. |
| **Rollback complexity** | Very low — `git checkout HEAD` on the 5 changed files fully reverts to dark theme |
| **Downtime potential** | None |
| **User impact** | Authenticated users navigating to Compare, Analytics, Property, Map, or Locality pages will see those pages still in the dark theme while the sidebar/header/home are light. Jarring but non-blocking. |
| **Pre-deploy checklist** | ☐ Migrate remaining inner pages to light theme before a public-facing release · ☐ Validate ForgotPassword and VerifyEmail pages render correctly in light theme (no explicit inline overrides — rely on global CSS) · ☐ Confirm `color-scheme: light` in `index.css` does not cause browser-native dark-mode UI elements (scrollbars, inputs) to render incorrectly on dark-mode OS settings |

---

## Risk #8 — API_BASE Env Var and Signup Endpoint Change (Change #17)

| Field | Detail |
|---|---|
| **Change** | `API_BASE` in `useApi.ts` now reads `VITE_API_BASE_URL` env var (falls back to `localhost:8000`); Signup endpoint changed from `/auth/login` to `/auth/register` |
| **Risk level** | MEDIUM |
| **Blast radius** | If `VITE_API_BASE_URL` is not set in a production Vite build, all API calls in Login, Signup, and every `useApi` hook will target `localhost:8000` — which does not exist in production. Signup will also fail with 404 if the backend `/auth/register` route is absent. |
| **Rollback complexity** | Low — set `VITE_API_BASE_URL` in the build environment, or revert `useApi.ts` to the hardcoded constant |
| **Downtime potential** | None for existing authenticated users (token already stored). New registrations fail until backend route is confirmed. |
| **User impact** | New users cannot create accounts if `/auth/register` is missing. All users lose API access in production if `VITE_API_BASE_URL` is unset. |
| **Pre-deploy checklist** | ☐ Confirm backend exposes `POST /api/v1/auth/register` accepting `{ name, email, password }` and returning `{ access_token, user }` · ☐ Set `VITE_API_BASE_URL=https://your-api-domain.com/api/v1` in production build environment or CI secrets · ☐ Verify Signup response shape: if `/auth/register` returns a different payload than `/auth/login`, update `access_token` extraction in `Signup/index.tsx` · ☐ Do not set `VITE_API_BASE_URL` in `.env` committed to git |
