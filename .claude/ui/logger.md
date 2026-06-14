# Agent Logging Rule

For **every non-trivial change**, log it to **both** of the following locations before marking the task complete:

## 1. `.skills/audit_log.md`

Use the established change entry format:

```
## [Change #N] - YYYY-MM-DD: <Title>

### 1. Why the change is required
### 2. What files are affected
### 3. Potential side effects
### 4. Estimated blast radius
### 5. Rollback strategy
### 6. How correctness is verified
### 7. Why existing tests are insufficient
```

## 2. `/docs/` Log Files

Update all applicable files per [.skills/audit.md](../../.skills/audit.md):

| File | When to update |
|---|---|
| `docs/agent_change_log.md` | Every change |
| `docs/agent_trust_log.md` | Every change |
| `docs/agent_shortcuts.md` | When shortcuts, mocks, or hardcoded values are introduced |
| `docs/deployment_risks.md` | When `.env`, auth, DB, secrets, or infra is touched |
| `docs/production_incidents.md` | When a build fails, API errors occur, or runtime issues are found |
| `docs/xverta_research.md` | For significant or risky changes — answer all 8 governance questions |

> A task is **not complete** until both `audit_log.md` and the relevant `/docs/` files are updated.
