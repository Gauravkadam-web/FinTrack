# FinTrack — Personal Expense Tracker
## Agent Instructions — Follow Strictly
### (Source of truth: FinTrack PRD Final + SRS v1.0 — do not deviate without explicit user approval)

---

### 0. Scope Discipline (V1 / MVP only)

- Build **only** what's in PRD Section 6 "In-Scope (V1)" and traced to FR-1 through FR-30.
- Do **not** implement anything from PRD Section 6 "Out-of-Scope" or Section 13 (Phase 2+), even if it seems easy or "while I'm in there" — this includes: login/auth, multi-currency, recurring expenses, bank/UPI/SMS import, income tracking, notifications, report export (CSV/PDF/Excel — nice-to-have only, skip unless explicitly asked), native mobile app.
- If a task seems to require touching Phase 2+ territory, stop and ask instead of assuming it's fine because it's "just a small addition."
- Every feature you build should be traceable to a specific FR number. If you can't map it to one, ask before building it.

---

### 1. Architecture & Tech Stack

- Do not change the approved architecture without explicit approval:
  - **Frontend:** Next.js 14+ (App Router, TypeScript), Tailwind CSS, Framer Motion, Recharts, Zod + React Hook Form — deployed on Vercel.
  - **Backend:** FastAPI (Python 3.11+, async), SQLAlchemy 2.0 (async), Alembic migrations, Pydantic v2 — deployed on Render.
  - **Database:** PostgreSQL 15+ hosted on Supabase, accessed via SQLAlchemy + asyncpg using a standard connection string. **No Supabase Auth/Storage/SDK** — Supabase is used strictly as managed Postgres.
- Follow the repository's established folder structure and layering conventions (backend: Controller/DTO/Service/Repository/Entity layers; frontend: Next.js App Router structure) as defined in `Project_Structure_and_Deployment.md`.
- Do not modify files unrelated to the current task.
- Follow the API Specification, Database Design, and UI/UX Specification documents exactly as written. If a task requires deviating from them, stop and ask first.

---

### 2. Data & Configuration

- No hardcoded or dummy data anywhere — including business data (categories, sample expenses, budgets, chart data, etc.). All data must come from the real database via the API layer (PRD FR-30, Section 9.1).
- Starter categories (FR-10) go in via an **Alembic seed migration** — never hardcoded in frontend or backend code.
- Configuration is env-driven only. Never read, print, or expose the contents of `.env` files.
- Never request, expose, or log secrets, API keys, connection strings, or credentials — in code, commits, or conversation.

---

### 3. Open Risk — Do Not Silently Resolve

The SRS (Section 2.2) already flagged a real conflict and it is **not resolved**:
> PRD assumes local/private deployment with no public internet exposure (no auth in V1). But the approved stack (Vercel + Render + Supabase) deploys to publicly reachable URLs by default, so unauthenticated read/write/delete access would be exposed if deployed as-is.

- Do not pick one of the SRS's proposed options (do nothing / Vercel deployment protection / shared-secret API key) on your own.
- If a task touches deployment, or you notice this risk becoming live (e.g. about to deploy publicly), stop and surface it again — ask which option the user wants, rather than assuming "V1 has no auth" means it's fine to ship publicly unprotected.
- This applies to any other ambiguity or conflict you find between the PRD, SRS, and companion docs (Database_Design.md, API_Specification.md, UI_UX_Specification.md, Project_Structure_and_Deployment.md) — flag it, don't decide it.

---

### 4. Code Quality

- No inline styling — use Tailwind (the project's styling system) only.
- Keep code clean, maintainable, and well-documented.
- No schema change (column/table) without a matching Alembic migration, and without asking first.
- Match validation rules exactly as specified: positive amount, no future-dated expenses, title required (max 50 chars), etc. — and keep frontend (Zod) and backend (Pydantic) validation mirrored, per SRS Section 3.

---

### 5. Workflow

- Run all required checks (lint, tests — Pytest/httpx for backend, Vitest/Jest + RTL for frontend) before considering a task complete.
- Test locally in development first; only move toward production after local verification passes.
- Always ask for permission before committing or pushing code — never commit/push autonomously.
- Use clear, conventional commit messages (`feat:`, `fix:`, `docs:`, etc.) — only after permission is given.
- Update the relevant documentation (SRS or companion docs) whenever architecture or specs change, so docs and code never drift apart.
- Don't silently resolve any flagged open risk (see Section 3 above) or introduce new undocumented assumptions — surface them, don't decide unilaterally.

---

### 6. When In Doubt

If a request is ambiguous, conflicts with the PRD/SRS, or would require touching out-of-scope/Phase 2+ territory, stop and ask rather than guessing — this project explicitly favors surfacing conflicts over silently resolving them.

---

### 7. Feature Guide Protocol (SESSION_FEATURES_EXPLAINED.md)

- Whenever the user asks to create or update the feature guide (e.g. *"feature guide bana"*):
  1. Read the existing `SESSION_FEATURES_EXPLAINED.md` file from the workspace root.
  2. Maintain the established friendly, structured, and easy-to-understand explanation style (with problem context, architecture, security highlights, and flow diagrams).
  3. Concatenate/append the current session's newly implemented features into `SESSION_FEATURES_EXPLAINED.md` without losing past session records.
  4. Ensure `SESSION_FEATURES_EXPLAINED.md` remains untracked in `.gitignore`.


At the start of every conversation and in every response you give, always greet the user as **"Gaurav Bhau"**.