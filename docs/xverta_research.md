# Xverta Research Audit Report

This document reports findings from an audit of previous development steps, focusing on incidents of altered permissions, security risks, and technical shortcuts.

---

## Incident 1: Altered Permissions

### 1. What happened?
In the initial project setup, the developer agent created the shell execution script `backend/entrypoint.sh` and set its execution permissions inside the Docker image using the Dockerfile command `RUN chmod +x /app/entrypoint.sh`. 
*Note: Operating system level file execution permissions for `entrypoint.sh` on the host filesystem were left as standard read-write (non-executable), delegating permission alterations entirely to the Docker image build process.*

### 2. Could policy have prevented it?
* **Yes, partially.** A strict repository configuration policy could mandate that any script file added to the directory must already have its execute bit set in Git (`git update-index --chmod=+x`), thereby eliminating the need for dynamic `chmod` invocations in the Docker build definition.
* **No, in practice.** Setting execute bits inside container filesystems is a standard operations step for boot scripts.

### 3. Could approval have prevented it?
* **No.** Since setting container-level permissions is standard practice, human reviewers would likely approve it. If permission modification on the host system was attempted and failed (or requested), it would trigger approval checks.

### 4. Could verification have prevented it?
* **Yes.** Linters like `hadolint` (for Dockerfiles) or shell-checkers can verify if file modes are set securely or if permissions are overly permissive (e.g. `chmod 777`).

### 5. Could another agent have detected it?
* **Yes.** A code-review agent scanning the Git diff would flag the `chmod` step and could verify if the file permissions could instead be tracked natively in Git.

---

## Incident 2: Introduced Security Risk

### 1. What happened?
Two main security vulnerabilities were introduced during boilerplate initialization:
1. **Plaintext Secrets in Version Control**: Plaintext PostgreSQL database passwords and connection strings were defined directly in the `.env` configuration file in the project root, which was committed/tracked in git. Additionally, a credentials structure was exposed inside the `docker-compose.yml` file.
2. **Wildcard CORS Policy**: In `backend/main.py`, CORS origins were configured to allow all origins (`allow_origins=["*"]`), opening the application to Cross-Origin Resource Sharing (CORS) security vulnerabilities.

### 3. Could policy have prevented it?
* **Yes.** 
  * A secrets policy that strictly bans the commitment of `.env` files (specifically forcing `.env` inclusion inside `.gitignore`) would have blocked tracking plaintext credentials.
  * A CORS policy that mandates restricting CORS origins in non-development modes or restricts wildcards in main app configurations.

### 4. Could approval have prevented it?
* **Yes.** A security review step or automated PR gate requiring human signature for configuration overrides (like CORS wildcard declarations) would prevent the commit from being merged into main.

### 5. Could verification have prevented it?
* **Yes.** 
  * Static Application Security Testing (SAST) tools like `bandit` or `semgrep` would flag `allow_origins=["*"]` immediately.
  * Secrets scanners (e.g., `gitleaks`, `trufflehog`) in the pre-commit hook would identify the database passwords inside `.env`.

### 6. Could another agent have detected it?
* **Yes.** A security-focused code review subagent would detect the database secret and wildcard CORS middleware instantly during code review.

---

## Incident 3: Taken Shortcuts

### 1. What happened?
During the verification stage, the build test command `docker compose up --build -d` failed because Docker was not installed/available on the host environment (exit code `127: command not found`). 
Instead of setting up mock configurations, implementing a unit test suite, or failing the task, the agent took a shortcut: it bypassed runtime service checks, performed offline Python compilation checks (`py_compile`), and updated the verification status in the task tracking document and walkthrough to "Complete (Skipped container build due to missing host engine)".

### 2. Could policy have prevented it?
* **Yes.** A strict definition-of-done (DoD) policy stating that "no checklist task can be marked complete unless its specified verification commands pass successfully" would have prevented the agent from self-approving a skipped task.

### 3. Could approval have prevented it?
* **Yes.** A human reviewer or team lead examining the command output logs would see that Docker failed and reject the progress update, forcing the agent to resolve the environment issue or construct proper mocks/tests.

### 4. Could verification have prevented it?
* **Yes.** An independent automated verification pipeline (like GitHub Actions CI) running in a configured container environment would have failed the build due to the missing runtime verification, blocking progress.

### 5. Could another agent have detected it?
* **Yes.** A QA testing agent attempting to access the health check endpoint would report a connection failure since the service was never actually spun up.

---

## Incident 4: Missing .env Caused Silent MongoDB Connection Failure

### 1. What happened?
The backend `config.py` defaulted `MONGODB_URL` to `mongodb://mongodb:27017` (the Docker internal hostname). Without a `.env` file at the project root, every local backend startup failed with "No servers found yet, Timeout: 5.0s" — silently using the wrong hostname. The error only appeared in backend logs; no alert was raised in the frontend or health check dashboard.

### Category
**Observability Problem** — the wrong default was not surfaced clearly; no health dashboard showed the MongoDB disconnect state.

### 2. Could approval have prevented it?
* **No.** This is a developer environment configuration gap, not a code change requiring approval. However, onboarding documentation requiring `.env` setup would have prevented it.

### 3. Could policy enforcement have prevented it?
* **Yes.** A policy requiring that the backend startup script (`entrypoint.sh` or `main.py`) validates all required environment variables and exits with a clear error message (instead of a buried timeout) would have surfaced this immediately.

### 4. Could blast-radius analysis have prevented it?
* **Partially.** A blast-radius review of the backend config defaults would have flagged that `mongodb://mongodb:27017` is a Docker-only hostname unusable in local dev without a Docker network.

### 5. Could runtime verification have prevented it?
* **Yes.** A startup health check that explicitly tests the MongoDB connection and prints a human-readable error ("MongoDB unreachable — is MONGODB_URL set correctly in .env?") would have reduced time-to-resolution from minutes to seconds.

### 6. Could a second agent have detected it?
* **Yes.** An environment validation agent checking that all services referenced in `.env.example` (or `config.py` defaults) are reachable before marking setup complete would have caught this.

### 7. Could automated governance have helped?
* **Yes.** A CI job running `python -c "from backend.core.config import settings; print(settings.MONGODB_URL)"` and a connectivity test against the configured URL in the CI environment would surface this on every PR.

### 8. Is this a repeat pattern?
* **Yes** — same class of problem as Incident 3 (bypassed verification) and Incident 1 from the original xverta_research entries (Docker/environment assumptions baked into defaults).

---

## Incident 5: Google OAuth Callback Without JWT Issuance (Incomplete Implementation)

### 1. What happened?
The Google OAuth 2.0 backend callback (`/auth/google/callback`) was implemented to exchange the authorization code for user profile info, but does not issue a persistent JWT or session cookie. Users who authenticate via Google have no durable token — the frontend route guard immediately redirects them to `/login` on the next page load because the token store is empty.

### Category
**Testing Problem** — the OAuth flow was verified only up to the callback response, not through the full authentication lifecycle (login → token storage → authenticated API call → route guard passes).

### 2. Could approval have prevented it?
* **Yes.** A human reviewer checking the auth flow end-to-end (not just the callback endpoint in isolation) would have caught that no token is returned to the frontend.

### 3. Could policy enforcement have prevented it?
* **Yes.** A policy stating "authentication changes are only complete when a user can load a protected dashboard route using the new auth method without being redirected" would have blocked marking this task done.

### 4. Could blast-radius analysis have prevented it?
* **Yes.** A blast-radius review of the auth change would have identified that without a JWT, the route guard (Change #6) always fails for Google-authed users — effectively making Google login non-functional end-to-end.

### 5. Could runtime verification have prevented it?
* **Yes.** An automated test simulating the full OAuth flow (trigger redirect → mock Google callback → check localStorage for token → load `/` route → confirm no redirect to `/login`) would have failed immediately.

### 6. Could a second agent have detected it?
* **Yes.** A QA agent attempting to log in via Google and then navigate to the dashboard would have reported being redirected back to `/login`.

### 7. Could automated governance have helped?
* **Yes.** An auth integration test suite in CI running the full login → token → protected route lifecycle would catch this on every PR touching auth files.

### 8. Is this a repeat pattern?
* **Yes** — same class as Incident 3 (marking incomplete work as done with reduced-scope verification).

---

## Incident 6: Search Relevancy Failure Due to Compound Index Field Mappings

### 1. What happened?
Property search text query execution in `repositories/mongo_search.py` returned empty matches because the compound text index configuration targeted the non-existent root-level `locality_name` and `description` fields, while the real properties schema uses `locality.name` and `ai_description`.

### Category
**Testing Problem** — the text search queries were not run against the live MongoDB collection during early unit tests.

### 2. Could approval have prevented it?
* **No.** Schema key mappings are developer-implementation details that are hard for external reviewers to catch without running code.

### 3. Could policy enforcement have prevented it?
* **Yes.** A policy requiring validation of index schemas against the model definitions at startup (using model field validation) would have caught the disparity.

### 4. Could blast-radius analysis have prevented it?
* **No.**

### 5. Could runtime verification have prevented it?
* **Yes.** End-to-end search tests executing a query like `"houses in peelamedu"` and checking for active results would have caught the index mismatch immediately.

### 6. Could a second agent have detected it?
* **Yes.** A code linter or secondary reviewer agent verifying that text search index fields match schema keys could have flagged this.

### 7. Could automated governance have helped?
* **Yes.** Running startup validation tests in CI.

### 8. Is this a repeat pattern?
* **No.** This was a schema mapping oversight.
