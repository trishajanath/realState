# Production Outage Post-Mortem Report

This document audits the historical production incidents recorded in the platform's SRE log systems. For each incident, we analyze the root causes and outline mitigation strategies.

---

## Incident 1: INC-2024-11-03
**Title**: IAM Permission Cascade Blocked Production Auth

### 1. What happened?
An automated IAM credential rotation script was executed in production. Due to a circular dependency in the role delegation configuration, the rotation locked out the primary authorization service account, triggering a cascade authentication outage that blocked login calls to downstream customer billing APIs.

### 2. Could policy have prevented it?
* **Yes.** A policy requiring that SRE credential rotation scripts must use non-destructive rollbacks (maintaining old credentials valid for a 1-hour overlap window) would have prevented the instant authentication failure.

### 3. Could approval have prevented it?
* **Yes.** Standard rotations are executed as low-risk cron actions. Elevating IAM structure modifications to require multi-sig security approval would have forced manual inspection of the credentials graph before running the change.

### 4. Could verification have prevented it?
* **Yes.** Simulating the credential migration in a staging environment and testing authentication flow against the staging API gateway would have exposed the lockout before applying it to production.

### 5. Could another agent have detected it?
* **Yes.** A system dependency analyzer agent could have traced the IAM role chain, detected the circular reference, and flagged it as a blocking risk.

---

## Incident 2: INC-2025-02-17
**Title**: Terraform Networking Change Caused Service Partition

### 1. What happened?
An engineer ran `terraform apply` to adjust subnets and route tables in production. A typo in the CIDR block definition caused the route table to direct traffic to a blackhole, partitioning core backend microservices and severing cross-service communications.

### 2. Could policy have prevented it?
* **Yes.** A policy blocking any direct modification of core VPC route tables during active business hours would have deferred the change to a maintenance window.

### 3. Could approval have prevented it?
* **Yes.** Requiring network architect approval for Terraform plan changes affecting VPC routing or security groups would have caught the mismatched CIDR block during peer review.

### 4. Could verification have prevented it?
* **Yes.** Using `terraform plan` parsers (like OPA or tfsec) to verify that route paths resolved correctly (preventing blackhole routes) would have caught the invalid subnet mapping.

### 5. Could another agent have detected it?
* **Yes.** A network topology simulation agent scanning the generated terraform plan would have flagged that the routing table partition isolated the backend server from the database.

---

## Incident 3: INC-2025-04-09
**Title**: Ingress Update Returned 502 for Checkout

### 1. What happened?
A Kubernetes ingress rule update was rolled out via `kubectl apply`. A mismatch in the path mapping parameters caused the ingress controller to route requests meant for the checkout backend API to a deprecated internal service, returning public HTTP `502 Bad Gateway` errors during checkout attempts.

### 2. Could policy have prevented it?
* **Yes.** A namespace policy checking ingress rules for target-port alignment with active services would have blocked mismatched target references.

### 3. Could approval have prevented it?
* **Yes.** Requiring QA and product approval on updates to critical endpoints (like `/checkout`) would ensure checks are run before deployment.

### 4. Could verification have prevented it?
* **Yes.** A post-deployment automated health smoke test targeting public routes (verifying HTTP 200 responses for mock checkout endpoints) would have immediately flagged the 502 and triggered an automatic rollback.

### 5. Could another agent have detected it?
* **Yes.** A Kubernetes manifest validator agent could scan the ingress YAML and verify that the target service and port actively matched defined backend ports.

---

## Incident 4: INC-2025-06-22
**Title**: Database Schema Rollout Degraded Payment Writes

### 1. What happened?
A database migration altering columns on the core users/payments table was deployed. The migration locked the table during execution, creating database transaction queues and degrading payment write path latencies, resulting in timeout errors.

### 2. Could policy have prevented it?
* **Yes.** A database policy restricting the execution of schema migrations on large tables without standard async indexes or using non-blocking commands (like `ADD COLUMN` with defaults in PostgreSQL) would have prevented the table locking.

### 3. Could approval have prevented it?
* **Yes.** DB Admin review/approval of database schema modifications would have flagged the lock risk on high-volume tables.

### 4. Could verification have prevented it?
* **Yes.** Running the migration script on a staging database populated with synthetic production-scale mock records would have surfaced the transaction lock duration.

### 5. Could another agent have detected it?
* **Yes.** A query performance analyzer agent could inspect the SQL migration and flag execution paths that cause full table locks.

---

## Incident 5: INC-2026-06-14
**Title**: Backend MongoDB Connection Failure in Local Development (Wrong Default Hostname)

### 1. What happened?
The FastAPI backend defaulted `MONGODB_URL` to `mongodb://mongodb:27017` — a Docker internal network hostname. With no `.env` file at the project root, every local backend startup silently failed to connect to MongoDB with the error: `"No servers found yet, Timeout: 5.0s"`. The `/api/v1/health` endpoint returned `mongodb: unhealthy`, blocking all property and auth API responses.

- **Root cause**: `backend/core/config.py` baked a Docker-specific hostname as the default, with no validation on startup, and no `.env` file existed to override it for local development.
- **Detection method**: Manual inspection of backend terminal logs after observing that all frontend API calls were falling back to mock data.
- **Resolution**: Created `.env` at project root with `MONGODB_URL=mongodb://localhost:27017`. Backend `/api/v1/health` returned `mongodb: healthy` immediately after restart.
- **Time to resolution**: ~15 minutes (investigation + fix)
- **Preventative action**:
  1. Add a startup validation in `backend/main.py` that tests the MongoDB connection before accepting traffic and logs a human-readable error if it fails: `"ERROR: Cannot connect to MongoDB at {MONGODB_URL}. Is the database running?"`
  2. Create a `.env.example` file with all required variables and their safe placeholder values, and reference it in the README setup steps
  3. Add `MONGODB_URL` validation to the CI health check step

---

## Incident 6: INC-2026-06-14
**Title**: Amenity Service 422 Errors Due to Unsupported Query Parameter

### 1. What happened?
The `useAmenities()` hook in `frontend/src/hooks/useApi.ts` called the amenity service with `/amenities?locality_id=${localityId}`. The amenity FastAPI service (`services/amenity_intelligence/main.py`) does not define `locality_id` as an accepted query parameter — its `/amenities` endpoint only accepts `category`, `source`, `search`, `limit`, and `offset`. Every call returned HTTP 422 Unprocessable Entity, causing all amenity data to fall back to mock without a meaningful error.

- **Root cause**: The frontend assumed the amenity service accepted `locality_id` filtering; the actual service API contract was not verified against `main.py` before implementing the hook.
- **Detection method**: Code audit comparing `useApi.ts` fetch URLs against each microservice's actual FastAPI route definitions.
- **Resolution**: Removed the unsupported `locality_id` query parameter from the fetch URL. Call now hits `/amenities` without parameters.
- **Time to resolution**: Immediate once audit was performed
- **Preventative action**:
  1. Generate an OpenAPI spec from each microservice and validate `useApi.ts` hook URLs against the spec in CI (using a schema diff tool or contract testing)
  2. Log the actual HTTP status code in the `useApi.ts` catch blocks so 422 errors are distinguishable from network failures in the browser console
