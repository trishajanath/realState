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
