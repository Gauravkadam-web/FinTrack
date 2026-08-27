# FinTrack — Personal Expense Tracker

[![V1 MVP](https://img.shields.io/badge/version-1.0.0-blue.svg)](./docs/SRS_1.md)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg?logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1.svg?logo=postgresql)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)

**FinTrack** is a modern, responsive personal expense tracker designed for seamless day-to-day financial logging, live budget monitoring, and visual analytics.

---

## 🏗️ Architecture & Tech Stack

```
┌───────────────────────────┐         HTTPS / JSON         ┌──────────────────────────┐
│   Next.js 14+ (App Router)│ ───────────────────────────▶ │   FastAPI (Python 3.12)  │
│   Tailwind CSS + Recharts │ ◀─────────────────────────── │   SQLAlchemy 2.0 (async) │
└───────────────────────────┘                              └─────────────┬────────────┘
         Deployed on                                                     │ asyncpg
           Vercel                                                        ▼
                                                           ┌──────────────────────────┐
                                                           │   PostgreSQL 15+         │
                                                           │   (Supabase-hosted DB)   │
                                                           └──────────────────────────┘
                                                                Deployed on Render
```

- **Frontend:** Next.js 14 (App Router, TypeScript), Tailwind CSS, Framer Motion, Recharts, Zod + React Hook Form.
- **Backend:** FastAPI (Python 3.12, async), SQLAlchemy 2.0 (async), Alembic migrations, Pydantic v2.
- **Database:** PostgreSQL 15+ hosted on Supabase (Session Pooler enabled with `prepared_statement_cache_size=0`).
- **Layered Backend Architecture:**
  - `api/v1/` — HTTP routing & controllers
  - `schemas/` — Pydantic DTOs & request/response validation
  - `services/` — Business logic (budget thresholds, category reassignments, aggregations)
  - `repositories/` — Async database queries (SQLAlchemy)
  - `models/` — ORM entities

---

## 🚀 Quick Start — Local Development (Phase A)

### 1. Prerequisites
- **Node.js:** 18+ and `pnpm` (or `npm`)
- **Python:** 3.11+ / 3.12+
- **PostgreSQL:** Local PostgreSQL or Supabase project

---

### 2. Backend Setup
```powershell
# Navigate to backend
cd backend

# Create & activate virtual environment (optional if using global Python)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL

# Apply database migrations and seeds
alembic upgrade head

# Start FastAPI dev server
uvicorn app.main:app --reload --port 8000
```
Backend Swagger documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### 3. Frontend Setup
```powershell
# Navigate to frontend
cd ../frontend

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local

# Start Next.js dev server
pnpm dev
```
Frontend web application will be available at [http://localhost:3000](http://localhost:3000).

---

## 🐳 Dockerized Production Parity (Phase B)

To run the complete production-parity container stack locally (Postgres + FastAPI + Next.js):

```bash
docker compose -f docker-compose.prod.yml up --build
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000/api/v1](http://localhost:8000/api/v1)
- **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🌐 Supabase & Production Deployment

### 1. Database Configuration (Supabase)
1. Create a Supabase project at [https://supabase.com](https://supabase.com).
2. Go to **Project Settings** → **Database** → **Connection string** → **URI**.
3. Select **Session Pooler** (Port `5432` or `6543`).
4. Set the connection URL format:
   ```
   postgresql+asyncpg://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres
   ```
5. Apply migrations to Supabase:
   ```bash
   cd backend
   alembic upgrade head
   ```

### 2. Backend Deployment (Render)
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Configure build settings:
   - **Root Directory:** `backend`
   - **Environment:** `Docker` (Render automatically uses `backend/Dockerfile`)
4. Add Environment Variables:
   - `DATABASE_URL`: `postgresql+asyncpg://postgres.<ref>:<pass>@...pooler.supabase.com:5432/postgres`
   - `APP_ENV`: `production`
   - `CORS_ORIGINS`: `https://<your-vercel-app>.vercel.app`
   - `API_V1_PREFIX`: `/api/v1`

### 3. Frontend Deployment (Vercel)
1. Import project into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add Environment Variables:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://<your-render-backend>.onrender.com/api/v1`
   - `NEXT_PUBLIC_APP_ENV`: `production`
4. Deploy!

---

## 🧪 Testing & Quality Assurance

### Run Backend Unit & Integration Tests
```powershell
cd backend
python -m pytest
```

### Run Frontend Unit Tests
```powershell
cd frontend
pnpm test --run
```

### Run Frontend Production Build
```powershell
cd frontend
pnpm build
```

---

## 📁 Repository Structure

```
fintrack/
├── backend/                         # FastAPI backend application
│   ├── app/                         # Layered architecture (api, core, models, schemas, repositories, services)
│   ├── alembic/                     # Database migrations & starter seeds
│   ├── tests/                       # Unit & integration test suite
│   ├── Dockerfile                   # Multi-stage production container
│   ├── requirements.txt             # Python dependencies
│   └── .env.example                 # Backend environment template
│
├── frontend/                        # Next.js 14 frontend application
│   ├── src/
│   │   ├── app/                     # App router pages (dashboard, expenses)
│   │   ├── components/              # UI, expense, category, budget, and chart components
│   │   ├── lib/                     # API client and currency/date utilities
│   │   ├── schemas/                 # Zod validation schemas
│   │   └── types/                   # TypeScript interfaces
│   ├── Dockerfile                   # Multi-stage standalone container
│   └── package.json                 # Node.js dependencies
│
├── docs/                            # Specifications & Design Documentation
│   ├── FinTrack_PRD_Final.md        # Product Requirements Document
│   ├── SRS_1.md                     # Software Requirements Specification
│   ├── Database_Design.md           # Database tables, keys, & indexes
│   ├── API_Specification.md         # 20 REST endpoint contracts
│   ├── UI_UX_Specification.md       # Design system, micro-interactions, & responsiveness
│   └── Project_Structure_and_Deployment.md # Deployment & layering architecture
│
└── docker-compose.prod.yml          # Local production-parity compose orchestration
```

---

## 📄 License
This project is for personal financial management and private tracking under the MIT License.
