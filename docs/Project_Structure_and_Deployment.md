# Project Structure & Deployment Guide
## FinTrack — Personal Expense Tracker (V1 / MVP)

**Document Version:** 1.0
**Extracted from:** FinTrack SRS v1 (Sections 7–10) — this is the final, authoritative version.

---

## 1. Project Folder Structure (Monorepo, Layered Architecture)

### 1.1 Layering Convention (Java → Python equivalence)

FastAPI has no annotation-enforced layers like Spring (`@Controller`/`@Service`/`@Repository`/`@Entity`); the discipline is enforced purely by folder structure and import direction (`api` → `services` → `repositories` → `models`, never backwards).

| Java (Spring Boot) | Python (FastAPI) — folder | Responsibility |
|---|---|---|
| Controller | `app/api/v1/*.py` | HTTP routing, request/response only — no business logic |
| DTO | `app/schemas/*.py` (Pydantic) | Request/response validation shape, decoupled from DB model |
| Service | `app/services/*.py` | Business logic (budget thresholds, reassign-on-delete, etc.) |
| Repository | `app/repositories/*.py` | DB queries only, no business logic |
| Entity | `app/models/*.py` (SQLAlchemy) | ORM classes mapped to DB tables |
| `@Autowired` (DI) | `Depends()` (FastAPI DI) | Injects DB session / services into routes |
| `application.properties` | `app/core/config.py` (Pydantic Settings) | Env-driven configuration |

### 1.2 Backend — `backend/`

```
backend/
├── .env.example
├── .gitignore
├── Dockerfile
├── pyproject.toml                    # dependencies (Poetry)
├── alembic.ini
│
├── app/
│   ├── main.py                       # FastAPI app instance, mounts routers, CORS, startup/shutdown
│   │
│   ├── core/                         # framework-level plumbing
│   │   ├── config.py                 # Pydantic Settings — reads .env
│   │   ├── database.py               # async engine + session factory + get_db() dependency
│   │   └── exceptions.py             # custom exceptions + global handlers
│   │
│   ├── models/                       # ── ENTITY layer (SQLAlchemy ORM) ──
│   │   ├── base.py                   # DeclarativeBase + id/created_at/updated_at mixin
│   │   ├── category.py
│   │   ├── expense.py
│   │   └── budget.py
│   │
│   ├── schemas/                      # ── DTO layer (Pydantic) ──
│   │   ├── category.py               # CategoryCreate / Update / Response
│   │   ├── expense.py                # ExpenseCreate / Update / Response / ListResponse
│   │   ├── budget.py                 # BudgetCreate / Update / Response (with status field)
│   │   └── common.py                 # PaginationParams, ErrorResponse
│   │
│   ├── repositories/                 # ── REPOSITORY layer ──
│   │   ├── category_repository.py
│   │   ├── expense_repository.py     # get_paginated with filters/search/sort
│   │   └── budget_repository.py
│   │
│   ├── services/                     # ── SERVICE layer (business logic) ──
│   │   ├── category_service.py       # delete-with-reassign-to-Uncategorized logic
│   │   ├── expense_service.py
│   │   ├── budget_service.py         # spent/remaining/status (80% threshold) calculation
│   │   └── dashboard_service.py      # summary/trend/comparison/top-categories aggregation
│   │
│   ├── api/                          # ── CONTROLLER layer (routers) ──
│   │   └── v1/
│   │       ├── router.py             # combines all sub-routers
│   │       ├── health.py
│   │       ├── categories.py
│   │       ├── expenses.py
│   │       ├── budgets.py
│   │       └── dashboard.py
│   │
│   └── utils/
│       └── date_utils.py             # month boundaries, trend-chart period bucketing
│
├── alembic/
│   └── versions/
│       ├── 0001_initial_schema.py
│       └── 0002_seed_categories.py   # seeds Uncategorized + starter categories
│
└── tests/
    ├── conftest.py
    ├── unit/                         # service-layer logic in isolation
    │   ├── test_budget_service.py
    │   └── test_category_service.py
    └── integration/                  # full request → DB round trip
        ├── test_categories_api.py
        ├── test_expenses_api.py
        ├── test_budgets_api.py
        └── test_dashboard_api.py
```

### 1.3 Frontend — `frontend/`

```
frontend/
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
│
├── public/
│
└── src/
    ├── app/                           # Next.js App Router — pages + layouts
    │   ├── layout.tsx                 # root layout (fonts, providers, hamburger nav shell)
    │   ├── page.tsx                   # redirects to /dashboard
    │   ├── globals.css
    │   ├── dashboard/
    │   │   └── page.tsx
    │   └── expenses/
    │       ├── page.tsx               # list + search/filter/sort
    │       ├── new/page.tsx
    │       └── [id]/edit/page.tsx
    │
    ├── components/
    │   ├── ui/                        # Button, Input, Modal, ConfirmDialog, Toast, EmptyState, HamburgerNav
    │   ├── expenses/                  # ExpenseForm, ExpenseList, ExpenseCard, ExpenseTable, ExpenseFilters
    │   ├── categories/                # CategoryManager, CategorySelect, CategoryDeleteDialog
    │   ├── budget/                    # BudgetCard, BudgetForm, BudgetEmptyState
    │   └── charts/                    # CategoryPieChart, SpendTrendChart
    │
    ├── lib/
    │   ├── api-client.ts              # fetch wrapper, base URL from env, error handling
    │   ├── api/                       # one file per backend resource — mirrors backend/app/api/v1/*
    │   │   ├── expenses.ts
    │   │   ├── categories.ts
    │   │   ├── budgets.ts
    │   │   └── dashboard.ts
    │   └── utils.ts                   # currency formatting (₹, 2dp), date helpers
    │
    ├── schemas/                       # Zod — mirrors backend Pydantic DTOs
    │   ├── expense.schema.ts
    │   ├── category.schema.ts
    │   └── budget.schema.ts
    │
    ├── hooks/                         # useExpenses, useCategories, useBudget (incl. FR-27 live re-fetch), useDashboard
    │
    └── types/
        └── index.ts                   # shared TS types, mirrors backend schemas
```

### 1.4 Root

```
fintrack/
├── .gitignore                        # root-level: OS/editor noise only
├── README.md
├── docker-compose.prod.yml           # backend + Postgres, for production-parity local testing
├── frontend/                         # see §1.3
└── backend/                          # see §1.2
```

---

## 2. Environment Configuration (Env-Driven, No Hardcoding)

### 2.1 `backend/.env.example`
```
# Database (Supabase connection string in prod, local Postgres in dev)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/fintrack

# App
APP_ENV=development
API_V1_PREFIX=/api/v1
CORS_ORIGINS=http://localhost:3000

# Server
PORT=8000
```

### 2.2 `frontend/.env.example`
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_ENV=development
```

> All secrets/config are read via `pydantic-settings` (backend) and `process.env` (frontend, `NEXT_PUBLIC_` prefix for client-exposed vars only). Never committed — `.env` is gitignored, `.env.example` is committed as the template.

---

## 3. Run & Test Workflow

### 3.1 Phase A — Local Development (No Docker)

**Backend:**
```bash
cd backend
poetry install                       # or: pip install -r requirements.txt
cp .env.example .env                 # fill in local DATABASE_URL
alembic upgrade head                 # run migrations + seed
uvicorn app.main:app --reload --port 8000
pytest                               # run tests
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
pnpm install
pnpm dev                             # runs on localhost:3000
pnpm test
```

**Local Postgres:** either install Postgres natively, or (optional, still "no Docker for the app") point `DATABASE_URL` directly at a free Supabase dev project — this is the recommended shortcut since Supabase is the target DB anyway.

### 3.2 Phase B — Dockerized (Production-style)

- **`backend/Dockerfile`** — multi-stage build (deps → app), runs via `uvicorn`/`gunicorn`, reads `DATABASE_URL` from env at runtime (Render injects this).
- **`frontend/Dockerfile`** — multi-stage Next.js build (`next build` → standalone output), included for portability/self-hosting even though Vercel builds natively without it.
- **`docker-compose.prod.yml`** (root) — for local production-parity testing only: spins up `backend` + `postgres` (frontend typically excluded since it targets Vercel, but can be added if needed).

```bash
docker compose -f docker-compose.prod.yml up --build
```

### 3.3 Deployment
| Component | Platform | Trigger |
|---|---|---|
| Frontend | Vercel | Git push to `main` → auto-build from `frontend/` (root directory setting) |
| Backend | Render | Git push to `main` → Docker build from `backend/Dockerfile` |
| Database | Supabase | Managed — migrations run manually/via CI against `DATABASE_URL` before backend deploy |

**Deploy order:** run Alembic migrations against Supabase → deploy backend (Render) → deploy frontend (Vercel), pointing `NEXT_PUBLIC_API_BASE_URL` at the Render backend URL.

---

## 4. .gitignore Strategy (3 files)

- **`/fintrack/.gitignore`** — OS/editor noise (`.DS_Store`, `.vscode/`, `.idea/`), and anything that could accidentally live at root.
- **`/fintrack/frontend/.gitignore`** — `node_modules/`, `.next/`, `.env`, `.env.local`, `out/`, `*.tsbuildinfo`.
- **`/fintrack/backend/.gitignore`** — `__pycache__/`, `*.pyc`, `.venv/`, `.env`, `.pytest_cache/`, `alembic/versions/__pycache__/`.
