# Software Requirements Specification (SRS)
## FinTrack — Personal Expense Tracker (V1 / MVP)

**Document Version:** 1.0
**Based on:** FinTrack PRD (Final)
**Status:** Draft for Review

> This is the master SRS document. Detailed specifications live in companion documents (all extracted from the original combined SRS v1 — nothing new added):
> - **[Database_Design.md](./Database_Design.md)** — schema, tables, constraints, migrations
> - **[API_Specification.md](./API_Specification.md)** — full endpoint contract
> - **[UI_UX_Specification.md](./UI_UX_Specification.md)** — validation, states, animations, responsiveness
> - **[Project_Structure_and_Deployment.md](./Project_Structure_and_Deployment.md)** — folder structure, env config, run/test/deploy workflow

---

## 1. Introduction

### 1.1 Purpose
This SRS translates the FinTrack PRD (V1/MVP scope) into a concrete technical specification: architecture, tech stack, database schema, API contract, frontend requirements, project structure, environment configuration, and the development-to-deployment workflow.

### 1.2 Scope
Covers V1 only, as defined in the PRD (Section 6). No authentication, single fixed currency (INR), single-user, local/private deployment target with a clear path to cloud deployment (Vercel + Render + Supabase).

### 1.3 Intended Audience
Development team, QA, and anyone onboarding onto the FinTrack codebase.

---

## 2. System Overview

### 2.1 Architecture

```
┌─────────────────┐         HTTPS/JSON          ┌──────────────────┐
│   Next.js App    │ ───────────────────────────▶│   FastAPI App     │
│  (Frontend, SSR/  │◀─────────────────────────── │  (Backend, REST)  │
│   CSR hybrid)     │                              │                   │
└─────────────────┘                              └─────────┬─────────┘
     Deployed on                                            │ asyncpg
       Vercel                                                ▼
                                                    ┌──────────────────┐
                                                    │   PostgreSQL      │
                                                    │  (Supabase-hosted)│
                                                    └──────────────────┘
                                                       Deployed on Render
                                                       (backend) + Supabase
                                                       (managed DB)
```

- **Frontend:** Next.js (App Router, TypeScript) — deployed on **Vercel**
- **Backend:** FastAPI (Python, async) — deployed on **Render**
- **Database:** PostgreSQL — hosted on **Supabase** (used strictly as managed Postgres; no Supabase Auth/Storage/SDK in V1 — backend connects via standard connection string using SQLAlchemy)
- **No authentication layer in V1** (per PRD Section 9 & 11 — local/private deployment assumption; if deployed publicly, it is understood to be single-user with no login gate, per explicit PRD scope)

### 2.2 ⚠️ Open Risk — Deployment Target vs. PRD Assumption (flagging, not resolving)

The PRD (Sections 9 & 11) explicitly assumes **"local or private deployment — no public internet exposure planned for V1, since there is no login/auth layer yet."**

However, the requested stack — **Vercel + Render + Supabase** — deploys the app to **publicly reachable URLs by default**. There is no auth layer in V1, so as specified, anyone with the Render backend URL could hit every endpoint (read/write/delete all expenses and budgets) and anyone with the Supabase connection string could query the DB directly.

This is a direct conflict between two of your own inputs (PRD's "no public exposure" assumption vs. the cloud-hosting combo), not something I should silently pick a side on. Options, if you want this stack **and** to honor the "no public exposure" intent:
1. **Do nothing** — accept the risk for V1, since it's personal financial data but not shared with anyone; add real auth in Phase 2 as planned. (Simplest, matches PRD's phased roadmap.)
2. **Vercel Deployment Protection** (password/SSO gate in front of the frontend) + keep the Render backend URL unlisted — cheap partial mitigation, not real security.
3. **Add a single shared-secret API key** (one static key in an env var, checked via a FastAPI dependency on every route) — a few hours of work, meaningfully closes the gap without building full auth/login now.

Not deciding this for you — flagging it so it's a conscious choice, not an oversight.

### 2.3 Design Principles (from PRD Section 9.1)
- **No hardcoded/dummy data anywhere** — including "starter categories" (FR-10), which will be inserted via a **database seed migration**, not hardcoded in frontend/backend code. This satisfies both FR-10 and the no-dummy-data principle simultaneously.
- Every module independently testable (Run → Test → Deploy per phase/feature).
- Environment-driven configuration — zero hardcoded secrets, URLs, or config values.

---

## 3. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend Framework | Next.js 14+ (App Router, TypeScript) | Chosen for scalability into later phases (auth, SSR needs) |
| Styling | Tailwind CSS | Utility-first, fast to build responsive UI |
| Animation | Framer Motion | Micro-interactions, page/element transitions |
| Charts | Recharts | Pie/donut + bar/line charts (FR-19, FR-20) |
| Frontend Validation | Zod + React Hook Form | Schema validation mirrored from backend |
| Backend Framework | FastAPI (Python 3.11+) | Async, auto-generated OpenAPI docs |
| ORM | SQLAlchemy 2.0 (async) | Type-safe DB access |
| Migrations | Alembic | Schema + seed migrations |
| Backend Validation | Pydantic v2 | Request/response schemas |
| Database | PostgreSQL 15+ | Hosted on Supabase |
| DB Driver | asyncpg | Async Postgres driver for SQLAlchemy |
| Package Mgmt (BE) | Poetry or pip + requirements.txt | Poetry recommended |
| Package Mgmt (FE) | npm / pnpm | pnpm recommended for speed |
| Containerization | Docker (production only) | Separate Dockerfiles for frontend & backend |
| Hosting — Frontend | Vercel | Native Next.js support |
| Hosting — Backend | Render | Dockerized FastAPI service |
| Hosting — Database | Supabase | Managed Postgres only |
| Testing (BE) | Pytest + httpx (async test client) | Unit + integration tests |
| Testing (FE) | Vitest / Jest + React Testing Library | Component + integration tests |

---

## 4. Database Design
See **[Database_Design.md](./Database_Design.md)** for the full entity-relationship overview, table definitions (`categories`, `expenses`, `budgets`), constraints, indexes, and the migration/seed strategy.

---

## 5. API Specification
See **[API_Specification.md](./API_Specification.md)** for the full endpoint contract — Health, Categories, Expenses, Dashboard/Reports, Budgets, and the error response convention. Every endpoint is traced back to its PRD functional requirement (FR-1 through FR-30).

---

## 6. UI/UX Specification
See **[UI_UX_Specification.md](./UI_UX_Specification.md)** for frontend validation rules, live budget update behavior (FR-27), empty/loading/error states, Framer Motion micro-interactions, and responsiveness rules.

---

## 7. Project Structure & Deployment
See **[Project_Structure_and_Deployment.md](./Project_Structure_and_Deployment.md)** for the full monorepo folder structure (backend layered as Controller/DTO/Service/Repository/Entity, frontend as Next.js App Router), the Java↔Python layering equivalence table, `.env.example` files, the no-Docker-dev → Docker-production workflow, and the Vercel/Render/Supabase deployment steps.

---

## 8. Non-Functional Requirements (carried from PRD, made concrete)

| PRD Requirement | Technical Implementation |
|---|---|
| Performance — real DB data always | No mock data anywhere; seed migration is the only pre-populated data, and it's real DB rows |
| Scalability | Layered backend (api/services/repositories), monorepo with clean frontend/backend boundary — ready for Phase 2 auth without rearchitecting |
| Testability | Pytest (backend) + Vitest (frontend), each module independently runnable |
| Reliability | Alembic migrations are the single source of schema truth; CI runs tests before deploy (recommended, see §9) |

---

## 9. Recommended Additions (Industry Standard, Not in Original Ask)

- **CI Pipeline (GitHub Actions):** lint + test on every PR for both `frontend/` and `backend/`, run before merge to `main`. Not required for V1 to function, but strongly recommended given "Reliability" and "Testability" NFRs in the PRD.
- **API documentation:** FastAPI auto-generates OpenAPI/Swagger at `/docs` — no extra work, but worth listing as a deliverable.
- **Structured logging:** basic request logging in FastAPI (method, path, status, latency) for debugging in Render logs.
- **Database backup:** Supabase provides automatic backups on paid tiers — worth confirming plan tier before relying on this for a financial-data app.
- **Rate limiting:** not critical for V1 (no public auth), but worth a placeholder middleware slot for Phase 2 when the app goes multi-user.

---

## 10. Traceability Note

Every FR-1 through FR-30 from the PRD maps to either an API endpoint (see API_Specification.md) or a frontend behavior (see UI_UX_Specification.md). Out-of-scope PRD items (login, recurring expenses, multi-currency, bank sync, notifications, export, native mobile) are intentionally **not** reflected in this schema/API — they are Phase 2+ per PRD Section 13, and this architecture (monorepo, layered backend, env-driven config) is chosen specifically so those phases don't require a rebuild.
