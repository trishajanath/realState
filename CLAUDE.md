# XVERTA — Agent Instructions

## Governance: Read First

Before starting any work, read `.skills/audit.md` in full. It defines mandatory rules for every change.

## Mandatory Logging (non-negotiable)

Every non-trivial change MUST update these files before the task is considered complete:

| Log | File | When Required |
|-----|------|---------------|
| Change log | `docs/agent_change_log.md` | Every change |
| Trust log | `docs/agent_trust_log.md` | Every change |
| Shortcut log | `docs/agent_shortcuts.md` | Only if shortcuts taken |
| Risk log | `docs/deployment_risks.md` | Auth / DB / infra / CI changes |
| Incident log | `docs/production_incidents.md` | Build / deploy / API failures |
| Research log | `docs/xverta_research.md` | Significant risks or repeat patterns |

A task is **NOT complete** until all required logs are updated. Do not mark a task done, close a todo, or summarize work as finished until every applicable log entry is written.

## Completion Checklist

Before marking ANY task complete, verify:

- [ ] Code implemented
- [ ] Build passes (`npm run build` for frontend, Python syntax check for backend)
- [ ] Agent Change Log updated (`docs/agent_change_log.md`)
- [ ] Agent Trust Log updated (`docs/agent_trust_log.md`)
- [ ] Shortcut Log reviewed — if any shortcuts were taken, log them (`docs/agent_shortcuts.md`)
- [ ] Deployment Risk Log updated if the change touched auth, DB, infra, or CI (`docs/deployment_risks.md`)
- [ ] Incident Log updated if a build, deploy, or API failure occurred (`docs/production_incidents.md`)
- [ ] Xverta Research Log updated for significant issues (`docs/xverta_research.md`)

## Project Context

- Brand: **XVERTA** — Real Estate Intelligence Platform, Coimbatore
- Theme: light (white `#FFFFFF` background / black `#000000` text); black reserved for accent elements only
- Stack: FastAPI backend (port 8000) + React/Vite frontend (port 5173) + MongoDB Atlas
- Single backend at `http://localhost:8000/api/v1` — no multi-port pattern
- Full audit rules: `.skills/audit.md`
- Full change history: `docs/agent_change_log.md`
