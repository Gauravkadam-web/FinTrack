# Project Structure & Deployment Guide
## FinTrack — Personal Expense Tracker

**Document Version:** 2.0  
**Based on:** FinTrack SRS v2.0 — this is the final, authoritative version.

---

## 1. Project Folder Structure (Monorepo, Layered Architecture)

### 1.1 Layering Convention (Java → Python equivalence)

FastAPI has no annotation-enforced layers like Spring (`@Controller`/`@Service`/`@Repository`/`@Entity`); the discipline is enforced purely by folder structure and import direction (`api` → `services` → `repositories` → `models`, never backwards).

| Java (Spring Boot) | Python (FastAPI) — folder | Responsibility |
|---|---|---|
| Controller | `app/api/v1/*.py` | HTTP routing, request/response only — no business logic |
| DTO | `app/schemas/*.py` (Pydantic) | Request/response validation shape, decoupled from DB model |
| Service | `app/services/*.py` | Business logic (budget thresholds, reassign-on-delete, auth flows, etc.) |
| Repository | `app/repositories/*.py` | DB queries only, no business logic |
| Entity | `app/models/*.py` (SQLAlchemy) | ORM classes mapped to DB tables |
| `@Autowired` (DI) | `Depends()` (FastAPI DI) | Injects DB session / services / current user into routes |
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
│   ├── main.py                       # FastAPI app instance, mounts routers, CORS, rate limiter, startup/shutdown
│   │
│   ├── core/                         # framework-level plumbing
│   │   ├── config.py                 # Pydantic Settings — reads .env (incl. JWT, Google, SMTP, cookie config)
│   │   ├── database.py               # async engine + session factory + get_db() dependency
│   │   ├── security.py               # [NEW] JWT encode/decode, password hashing (BCrypt), refresh token hashing (SHA-256)
│   │   ├── dependencies.py           # [NEW] get_current_user() FastAPI dependency — validates JWT, returns user
│   │   └── exceptions.py             # custom exceptions + global handlers (incl. 401, 403, 429)
│   │
│   ├── models/                       # ── ENTITY layer (SQLAlchemy ORM) ──
│   │   ├── base.py                   # DeclarativeBase + id/created_at/updated_at mixin
│   │   ├── user.py                   # [NEW] User model
│   │   ├── refresh_token.py          # [NEW] RefreshToken model
│   │   ├── category.py              # [MODIFIED] + user_id FK
│   │   ├── expense.py               # [MODIFIED] + user_id FK
│   │   └── budget.py                # [MODIFIED] + user_id FK
│   │
│   ├── schemas/                      # ── DTO layer (Pydantic) ──
│   │   ├── auth.py                   # [NEW] RegisterRequest, LoginRequest, GoogleAuthRequest, TokenResponse,
│   │   │                             #        ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest,
│   │   │                             #        VerifyEmailRequest, UserResponse
│   │   ├── category.py               # CategoryCreate / Update / Response
│   │   ├── expense.py                # ExpenseCreate / Update / Response / ListResponse
│   │   ├── budget.py                 # BudgetCreate / Update / Response (with status field)
│   │   └── common.py                 # PaginationParams, ErrorResponse
│   │
│   ├── repositories/                 # ── REPOSITORY layer ──
│   │   ├── user_repository.py        # [NEW] find by email, find by google_id, create, update
│   │   ├── refresh_token_repository.py # [NEW] create, find by hash, revoke, revoke all for user, cleanup expired
│   │   ├── category_repository.py    # [MODIFIED] all queries add user_id filter
│   │   ├── expense_repository.py     # [MODIFIED] all queries add user_id filter
│   │   └── budget_repository.py      # [MODIFIED] all queries add user_id filter
│   │
│   ├── services/                     # ── SERVICE layer (business logic) ──
│   │   ├── auth_service.py           # [NEW] register, login, google_auth, refresh, logout, logout_all,
│   │   │                             #        forgot_password, reset_password, change_password, verify_email,
│   │   │                             #        seed_starter_categories (per-user on registration)
│   │   ├── email_service.py          # [NEW] send_password_reset_email, send_verification_email (SMTP transport)
│   │   ├── category_service.py       # [MODIFIED] all operations require user_id param
│   │   ├── expense_service.py        # [MODIFIED] all operations require user_id param
│   │   ├── budget_service.py         # [MODIFIED] all operations require user_id param
│   │   └── dashboard_service.py      # [MODIFIED] all aggregations scoped to user_id
│   │
│   ├── api/                          # ── CONTROLLER layer (routers) ──
│   │   └── v1/
│   │       ├── router.py             # combines all sub-routers (incl. auth)
│   │       ├── health.py
│   │       ├── auth.py               # [NEW] /auth/* endpoints
│   │       ├── categories.py         # [MODIFIED] injects get_current_user dependency
│   │       ├── expenses.py           # [MODIFIED] injects get_current_user dependency
│   │       ├── budgets.py            # [MODIFIED] injects get_current_user dependency
│   │       └── dashboard.py          # [MODIFIED] injects get_current_user dependency
│   │
│   ├── middleware/                    # [NEW]
│   │   └── rate_limiter.py           # slowapi rate limiting configuration
│   │
│   └── utils/
│       └── date_utils.py             # month boundaries, trend-chart period bucketing
│
├── alembic/
│   └── versions/
│       ├── 0001_initial_schema.py
│       ├── 0002_seed_categories.py   # seeds Uncategorized + starter categories (global, legacy)
│       └── 0003_add_auth_tables.py   # [NEW] users, refresh_tokens, user_id on categories/expenses/budgets
│
└── tests/
    ├── conftest.py                   # [MODIFIED] add auth test fixtures (test user, auth headers)
    ├── unit/
    │   ├── test_budget_service.py
    │   ├── test_category_service.py
    │   └── test_auth_service.py      # [NEW]
    └── integration/
        ├── test_categories_api.py    # [MODIFIED] all tests use authenticated requests
        ├── test_expenses_api.py      # [MODIFIED] all tests use authenticated requests
        ├── test_budgets_api.py       # [MODIFIED] all tests use authenticated requests
        ├── test_dashboard_api.py     # [MODIFIED] all tests use authenticated requests
        └── test_auth_api.py          # [NEW] registration, login, google, refresh, logout, password flows, data isolation
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
    │   ├── layout.tsx                 # [MODIFIED] root layout — wraps with AuthProvider + GoogleOAuthProvider
    │   ├── page.tsx                   # [MODIFIED] redirects to /dashboard (if auth) or /login (if not)
    │   ├── globals.css
    │   │
    │   ├── (auth)/                    # [NEW] Auth route group — standalone centered layout, no sidebar
    │   │   ├── layout.tsx             # Auth-specific layout (centered card, FinTrack branding, no nav)
    │   │   ├── login/page.tsx
    │   │   ├── register/page.tsx
    │   │   ├── forgot-password/page.tsx
    │   │   ├── reset-password/page.tsx
    │   │   └── verify-email/page.tsx
    │   │
    │   ├── (protected)/               # [NEW] Protected route group — sidebar layout + AuthGuard
    │   │   ├── layout.tsx             # Wraps with AuthGuard + AppLayout (sidebar)
    │   │   ├── dashboard/
    │   │   │   └── page.tsx           # [MOVED from app/dashboard/]
    │   │   ├── expenses/
    │   │   │   ├── page.tsx           # [MOVED] list + search/filter/sort
    │   │   │   ├── new/page.tsx       # [MOVED]
    │   │   │   └── [id]/edit/page.tsx # [MOVED]
    │   │   ├── budgets/
    │   │   │   └── page.tsx           # [MOVED from app/budgets/]
    │   │   └── categories/
    │   │       └── page.tsx           # [MOVED from app/categories/]
    │   │
    │   └── (old dashboard/, expenses/, budgets/, categories/ removed — merged into (protected)/)
    │
    ├── components/
    │   ├── auth/                      # [NEW] Auth-specific components
    │   │   ├── LoginForm.tsx          # Email/password form with Zod validation
    │   │   ├── RegisterForm.tsx       # Registration form with password confirmation
    │   │   ├── GoogleSignInButton.tsx  # Wraps @react-oauth/google GoogleLogin component
    │   │   ├── ForgotPasswordForm.tsx # Email input for password reset request
    │   │   ├── ResetPasswordForm.tsx  # New password form for reset flow
    │   │   ├── ChangePasswordModal.tsx # In-app password change modal
    │   │   └── AuthGuard.tsx          # Checks auth state, silent refresh, redirect to /login
    │   │
    │   ├── ui/                        # Button, Input, Modal, ConfirmDialog, Toast, EmptyState, Sidebar, etc.
    │   │   └── Sidebar.tsx            # [MODIFIED] add UserMenu section at bottom
    │   ├── expenses/                  # ExpenseForm, ExpenseList, ExpenseCard, ExpenseTable, ExpenseFilters
    │   ├── categories/                # CategoryManager, CategorySelect, CategoryDeleteDialog
    │   ├── budget/                    # BudgetCard, BudgetForm, BudgetEmptyState
    │   └── charts/                    # CategoryPieChart, SpendTrendChart
    │
    ├── lib/
    │   ├── api-client.ts              # [MODIFIED] add Bearer token injection, 401 interceptor, silent refresh queue
    │   ├── auth-context.tsx           # [NEW] React context — user state, access token, login/logout/refresh methods
    │   ├── api/                       # one file per backend resource — mirrors backend/app/api/v1/*
    │   │   ├── auth.ts                # [NEW] register, login, googleAuth, refresh, logout, logoutAll,
    │   │   │                          #        forgotPassword, resetPassword, changePassword, verifyEmail, getMe
    │   │   ├── expenses.ts
    │   │   ├── categories.ts
    │   │   ├── budgets.ts
    │   │   └── dashboard.ts
    │   └── utils.ts                   # currency formatting (₹, 2dp), date helpers
    │
    ├── schemas/                       # Zod — mirrors backend Pydantic DTOs
    │   ├── auth.schema.ts             # [NEW] loginSchema, registerSchema, forgotPasswordSchema,
    │   │                              #        resetPasswordSchema, changePasswordSchema
    │   ├── expense.schema.ts
    │   ├── category.schema.ts
    │   └── budget.schema.ts
    │
    ├── hooks/
    │   ├── useAuth.ts                 # [NEW] convenience hook wrapping AuthContext
    │   ├── useExpenses.ts
    │   ├── useCategories.ts
    │   ├── useBudget.ts
    │   └── useDashboard.ts
    │
    └── types/
        └── index.ts                   # [MODIFIED] add User, AuthState, TokenResponse types
```

### 1.4 Root

```
fintrack/
├── .gitignore                        # root-level: OS/editor noise only
├── README.md
├── AGENTS.md
├── progress.md
├── technical_debt.md
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

# ── Authentication (NEW) ──

# JWT
JWT_SECRET_KEY=<generate-a-random-256-bit-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# Google OAuth
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>

# ── Email Service (Multi-Provider: Brevo / Resend / SMTP) ──
EMAIL_PROVIDER=auto                   # "auto" | "brevo" | "resend" | "smtp"
BREVO_API_KEY=xkeysib-...             # Brevo REST API v3 key (Port 443, no domain required)
RESEND_API_KEY=re_...                 # Resend API key (Port 443, custom domain)
EMAIL_FROM=gkadam3847@gmail.com
EMAIL_FROM_NAME=FinTrack
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Rate Limiting
RATE_LIMIT_LOGIN=5/minute
RATE_LIMIT_FORGOT_PASSWORD=3/minute
RATE_LIMIT_RESEND_VERIFICATION=2/minute

# Cookie
COOKIE_DOMAIN=                        # blank for localhost; set to your domain in production
COOKIE_SECURE=false                   # set to true in production (HTTPS)

# Data Migration (one-time, for backfilling existing data with a user_id)
MIGRATION_OWNER_EMAIL=owner@fintrack.local
```

### 2.2 `frontend/.env.example`
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_ENV=development

# ── Authentication (NEW) ──
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<same-google-client-id-as-backend>
```

> All secrets/config are read via `pydantic-settings` (backend) and `process.env` (frontend, `NEXT_PUBLIC_` prefix for client-exposed vars only). Never committed — `.env` is gitignored, `.env.example` is committed as the template.
>
> **Security note:** `JWT_SECRET_KEY`, `GOOGLE_CLIENT_SECRET`, `SMTP_PASSWORD`, and `DATABASE_URL` are **backend-only**. They must **never** be prefixed with `NEXT_PUBLIC_` or exposed to the frontend in any way.

---

## 3. Run & Test Workflow

### 3.1 Phase A — Local Development (No Docker)

**Backend:**
```bash
cd backend
poetry install                       # or: pip install -r requirements.txt
cp .env.example .env                 # fill in local DATABASE_URL + JWT_SECRET_KEY + Google OAuth + SMTP
alembic upgrade head                 # run migrations + seed (including auth migration)
uvicorn app.main:app --reload --port 8000
pytest                               # run tests (incl. auth tests)
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local           # fill in NEXT_PUBLIC_API_BASE_URL + NEXT_PUBLIC_GOOGLE_CLIENT_ID
pnpm install
pnpm dev                             # runs on localhost:3000
pnpm test
```

**Local Postgres:** Either install Postgres natively, or point `DATABASE_URL` directly at a free Supabase dev project — this is the recommended shortcut since Supabase is the target DB anyway.

### 3.2 Phase B — Dockerized (Production-style)

- **`backend/Dockerfile`** — multi-stage build (deps → app), runs via `uvicorn`/`gunicorn`, reads all env vars at runtime (Railway injects these).
- **`frontend/Dockerfile`** — multi-stage Next.js build (`next build` → standalone output), included for portability/self-hosting even though Vercel builds natively without it.
- **`docker-compose.prod.yml`** (root) — for local production-parity testing only: spins up `backend` + `postgres` (frontend typically excluded since it targets Vercel, but can be added if needed).

```bash
docker compose -f docker-compose.prod.yml up --build
```

### 3.3 Deployment
| Component | Platform | Trigger |
|---|---|---|
| Frontend | Vercel | Git push to `main` → auto-build from `frontend/` (root directory setting) |
| Backend | Railway | Git push to `main` → Docker build from `backend/Dockerfile` |
| Database | Supabase | Managed — migrations run via startup command or CI against `DATABASE_URL` |

**Deploy order:**
1. Run Alembic migrations against Supabase (including auth migration `0003`).
2. Deploy backend on Railway with all new env vars (`JWT_SECRET_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SMTP_*`, `COOKIE_DOMAIN`, `COOKIE_SECURE=true`).
3. Deploy frontend on Vercel with `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
4. Configure Google Cloud Console: add the Vercel production URL as an authorized JavaScript origin and the Railway backend URL as an authorized redirect URI for the OAuth client.

**CORS Configuration (Production):**
- Backend `CORS_ORIGINS` must include the exact Vercel frontend URL (e.g., `https://fin-track-tawny-eight.vercel.app`).
- `allow_credentials=True` must be set to allow cookies in cross-origin requests.
- No wildcard `*` origins in production.

---

## 4. .gitignore Strategy (3 files)

- **`/fintrack/.gitignore`** — OS/editor noise (`.DS_Store`, `.vscode/`, `.idea/`), and anything that could accidentally live at root.
- **`/fintrack/frontend/.gitignore`** — `node_modules/`, `.next/`, `.env`, `.env.local`, `out/`, `*.tsbuildinfo`.
- **`/fintrack/backend/.gitignore`** — `__pycache__/`, `*.pyc`, `.venv/`, `.env`, `.pytest_cache/`, `alembic/versions/__pycache__/`.
