# Agent Audit & Governance Rules

---

## Production Readiness Requirements

Every service and deployment must have the following in place before going to production:

- Structured logging
- Error tracking
- Health checks
- Metrics endpoint
- Audit logs
- Rate limiting
- Role-based access control
- Database migrations
- Backup strategy
- Monitoring dashboards

---

## Agent Verification Rules

Whenever an AI agent proposes a change:

- Explain why the change is required.
- Explain what files are affected.
- Explain potential side effects.
- Estimate blast radius.
- Explain rollback strategy.
- Explain how correctness is verified.
- Explain why existing tests are insufficient if tests are modified.
- Never modify tests solely to make a failing implementation pass.

Any change affecting **authentication**, **authorization**, **payments**, or **database schema** requires:

- Explicit human review before merge.
- A rollback plan documented in `/docs/deployment_risks.md`.
- Confirmation that no secrets or credentials are exposed in logs or diffs.
- Sign-off recorded in `/docs/agent_trust_log.md` (Human review required: Yes).

---

# Mandatory Change Governance & Learning Rules

For EVERY non-trivial change, feature, bug fix, refactor, dependency update, infrastructure change, deployment change, authentication change, database change, CI/CD modification, or security-related modification, the following documentation MUST be updated before the task is considered complete.

Failure to update these logs means the task is incomplete.

---

## 1. Update Agent Change Log

File:

```text
/docs/agent_change_log.md
```

Record:

* Date
* Task
* Why the change was required
* Files modified
* Blast radius
* Rollback strategy
* Verification performed
* Side effects
* Deployment impact

---

## 2. Update Agent Trust Log

File:

```text
/docs/agent_trust_log.md
```

Record:

* Confidence before implementation (1-10)
* Confidence after implementation (1-10)
* Human review required? (Yes/No)
* Would this be safe to merge automatically? (Yes/No)
* Any assumptions made?
* Any uncertainty remaining?

---

## 3. Update Agent Shortcut Log

File:

```text
/docs/agent_shortcuts.md
```

Record if any occurred:

* Hardcoded values
* Test modifications
* Mocked behavior
* Temporary fixes
* Validation bypasses
* Security compromises
* Technical debt introduced

For each shortcut:

* Why it happened
* Risk level
* Recommended fix

---

## 4. Update Deployment Risk Log

File:

```text
/docs/deployment_risks.md
```

For any change affecting:

* Infrastructure
* Database
* Authentication
* Authorization
* CI/CD
* Monitoring
* Secrets
* Environment Variables

Record:

* Risk level
* Blast radius
* Rollback complexity
* Downtime potential
* User impact

---

## 5. Update Production Incident Log

File:

```text
/docs/production_incidents.md
```

Whenever:

* Build fails
* Deployment fails
* Migration fails
* Authentication breaks
* API errors occur
* Monitoring alerts fire
* Runtime errors occur

Record:

* Root cause
* Detection method
* Resolution
* Time to resolution
* Preventative action

---

## 6. Update Xverta Research Log

File:

```text
/docs/xverta_research.md
```

For every significant issue or risky change answer:

1. Could approval have prevented this?
2. Could policy enforcement have prevented this?
3. Could blast-radius analysis have prevented this?
4. Could runtime verification have prevented this?
5. Could a second agent have detected it?
6. Could automated governance have helped?
7. Is this a repeat pattern?

Assign one category:

* Verification Problem
* Governance Problem
* Approval Problem
* Testing Problem
* Deployment Problem
* Security Problem
* Observability Problem

---

## Mandatory Completion Checklist

Before marking ANY task complete:

* [ ] Code implemented
* [ ] Build passes
* [ ] Tests pass
* [ ] Agent Change Log updated
* [ ] Agent Trust Log updated
* [ ] Shortcut Log reviewed
* [ ] Deployment Risk Log updated if applicable
* [ ] Incident Log updated if applicable
* [ ] Xverta Research Log updated
* [ ] Remaining risks documented

A task is NOT complete until all required logs have been updated.
 