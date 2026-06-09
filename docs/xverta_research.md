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
