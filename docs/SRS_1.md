# Software Requirements Specification (SRS)
## FinTrack — Personal Expense Tracker

**Document Version:** 2.0  
**Based on:** FinTrack PRD (Final) + Authentication Layer Requirements  
**Status:** Draft for Review

> This is the master SRS document. Detailed specifications live in companion documents:
> - **[Database_Design.md](./Database_Design.md)** — schema, tables, constraints, migrations
> - **[API_Specification.md](./API_Specification.md)** — full endpoint contract (including auth endpoints)
> - **[UI_UX_Specification.md](./UI_UX_Specification.md)** — validation, states, animations, responsiveness, auth pages
> - **[Project_Structure_and_Deployment.md](./Project_Structure_and_Deployment.md)** — folder structure, env config, run/test/deploy workflow

---

## 1. Introduction

### 1.1 Purpose
This SRS translates the FinTrack PRD (V1/MVP scope) and the authentication layer requirements into a concrete technical specification: architecture, tech stack, authentication & authorization, database schema, API contract, frontend requirements, project structure, environment configuration, and the development-to-deployment workflow.

### 1.2 Scope
Covers V1 features (FR-1 through FR-30) plus the authentication & authorization layer (FR-31 through FR-44). Single fixed currency (INR). Multi-user with strict data isolation — each authenticated user can access only their own data. Deployed on Vercel (frontend) + Railway (backend, Docker) + Supabase (managed PostgreSQL).

### 1.3 Intended Audience
Development team, QA, and anyone onboarding onto the FinTrack codebase.

---

## 2. System Overview

### 2.1 Architecture

```
┌─────────────────┐                                  ┌──────────────────────┐
│   Next.js App    │         HTTPS / JSON              │     FastAPI App       │
│  (Frontend, SSR/ │ ─── Authorization: Bearer ──────▶│    (Backend, REST)    │
│   CSR hybrid)    │◀── + Set-Cookie: HttpOnly ─────── │                      │
└─────────────────┘                                  └──────────┬───────────┘
     Deployed on                                                 │
       Vercel                                                    │ Auth Middleware
                                                                 │ (JWT validation,
                                                                 │  user extraction,
                                                                 │  rate limiting)
                                                                 │
                                                                 │ asyncpg
                                                                 ▼
                                                        ┌──────────────────┐
                                                        │   PostgreSQL      │
                                                        │  (Supabase-hosted)│
                                                        └──────────────────┘
                                                          Railway (backend)
                                                          + Supabase (DB)
```

- **Frontend:** Next.js (App Router, TypeScript) — deployed on **Vercel**
- **Backend:** FastAPI (Python, async) — deployed on **Railway** (Docker)
- **Database:** PostgreSQL — hosted on **Supabase** (used strictly as managed Postgres; no Supabase Auth/Storage/SDK — backend connects via standard connection string using SQLAlchemy)
- **Authentication:** JWT-based (access token in `Authorization: Bearer` header, refresh token in `Secure, HttpOnly` cookie). Google OAuth 2.0/OIDC supported.

**Authentication Flow:**
1. User authenticates via email/password or Google Sign-In.
2. Backend validates credentials and issues:
   - **Access Token** (short-lived, ~15 min) — returned in response body, held in frontend memory only.
   - **Refresh Token** (long-lived, ~30 days) — set as a `Secure; HttpOnly; SameSite` cookie; stored as a SHA-256 hash in the database.
3. Frontend sends the Access Token via `Authorization: Bearer <token>` header on every API request.
4. Backend auth middleware validates the JWT signature, expiration, and required claims, then extracts the authenticated `user_id`.
5. Every resource query is scoped to `WHERE user_id = <authenticated_user_id>`.
6. On Access Token expiry (401 response), frontend silently calls `POST /auth/refresh` (cookie sent automatically) to obtain a new token pair — **refresh token rotation** (old token revoked, new token issued).
7. On logout, backend revokes the refresh token and clears the cookie.

### 2.2 ✅ Resolved Risk — Deployment Target vs. PRD Assumption

> **Previously flagged as open risk (SRS v1.0 §2.2 / TD-04):** PRD assumed no public internet exposure for V1 (no auth), but the Vercel + Railway + Supabase stack deploys to publicly reachable URLs.

**Resolution:** The authentication layer now protects all resource endpoints. Unauthenticated requests to protected endpoints receive `401 Unauthorized`. This resolves **TD-04** from the technical debt registry.

- Public endpoints are limited to: health check, registration, login, Google sign-in, forgot/reset password, email verification, and token refresh (cookie-only).
- All expense, category, budget, and dashboard endpoints require a valid Access Token.
- User data isolation (FR-42) ensures no cross-user data access even with a valid token.

### 2.3 Design Principles (from PRD Section 9.1 + Auth Layer)
- **No hardcoded/dummy data anywhere** — starter categories (FR-10) are seeded per user on registration via the auth service, not hardcoded in frontend/backend code.
- **User identity derived from JWT only** — every resource operation extracts the authenticated `user_id` from the validated JWT. Never trust a `user_id` sent by the frontend in request bodies, query params, or URL paths.
- **Defense in depth** — server-side validation is the source of truth; frontend validation is for UX speed only.
- Every module independently testable (Run → Test → Deploy per phase/feature).
- Environment-driven configuration — zero hardcoded secrets, URLs, or config values.

---

## 3. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend Framework | Next.js 14+ (App Router, TypeScript) | SSR, auth route groups, protected layouts |
| Styling | Tailwind CSS | Utility-first, fast to build responsive UI |
| Animation | Framer Motion | Micro-interactions, page/element transitions |
| Charts | Recharts | Pie/donut + bar/line charts (FR-19, FR-20) |
| Frontend Validation | Zod + React Hook Form | Schema validation mirrored from backend |
| Frontend Google Sign-In | `@react-oauth/google` | Google Sign-In button, ID token retrieval |
| Backend Framework | FastAPI (Python 3.11+) | Async, auto-generated OpenAPI docs |
| ORM | SQLAlchemy 2.0 (async) | Type-safe DB access |
| Migrations | Alembic | Schema + seed migrations |
| Backend Validation | Pydantic v2 | Request/response schemas |
| JWT | `python-jose[cryptography]` | JWT encoding/decoding (HS256) |
| Password Hashing | `passlib[bcrypt]` | BCrypt password hashing (min 12 rounds) |
| Google ID Token Verification | `google-auth` | Verify Google ID tokens on backend |
| Rate Limiting | `slowapi` | Rate limiting for login/reset endpoints |
| Email | Configurable SMTP transport | Password reset & email verification emails |
| Database | PostgreSQL 15+ | Hosted on Supabase |
| DB Driver | asyncpg | Async Postgres driver for SQLAlchemy |
| Package Mgmt (BE) | Poetry or pip + requirements.txt | Poetry recommended |
| Package Mgmt (FE) | npm / pnpm | pnpm recommended for speed |
| Containerization | Docker (production only) | Separate Dockerfiles for frontend & backend |
| Hosting — Frontend | Vercel | Native Next.js support |
| Hosting — Backend | Railway | Dockerized FastAPI service |
| Hosting — Database | Supabase | Managed Postgres only |
| Testing (BE) | Pytest + httpx (async test client) | Unit + integration tests (including auth) |
| Testing (FE) | Vitest / Jest + React Testing Library | Component + integration tests |

---

## 4. Authentication & Authorization Requirements

### 4.1 Functional Requirements (FR-31 to FR-44)

#### User Account Management

| FR | Requirement | Description |
|---|---|---|
| **FR-31** | User Registration | Create account with email, password, and display name. Password hashed with BCrypt. Starter categories (FR-10: `Uncategorized` + 8 starters) seeded for the new user on registration. |
| **FR-32** | User Login | Authenticate with email + password. Returns access token in response body + sets refresh token as HttpOnly cookie. |
| **FR-33** | Google Sign-In | OAuth 2.0/OIDC flow. Frontend obtains Google ID token via `@react-oauth/google`, sends it to `POST /auth/google`. Backend validates the ID token using Google's public keys, finds or creates the user, and issues the same JWT pair as regular login. Safe account linking by verified email. |
| **FR-34** | Logout | Revoke the current session's refresh token in the database, clear the HttpOnly cookie. |
| **FR-35** | Logout All Devices | Revoke **all** refresh tokens for the authenticated user across all sessions and devices. |
| **FR-36** | Forgot Password | Accept an email address, send a password reset email containing a time-limited token (1 hour expiry). Rate-limited (3/min per IP). Always return success (do not reveal whether the email exists). |
| **FR-37** | Reset Password | Validate the reset token, set the new password. Token is single-use (invalidated after use). |
| **FR-38** | Change Password | Authenticated user provides current password + new password. Backend verifies the current password before updating. |
| **FR-39** | Email Verification | Send a verification email on registration containing a time-limited token. User clicks the link to verify. Verified status stored as `email_verified` boolean on the user record. |
| **FR-43** | User Profile | `GET /auth/me` returns the authenticated user's profile: `id`, `email`, `display_name`, `email_verified`, `auth_provider` (local / google). |

#### Token Lifecycle

| FR | Requirement | Description |
|---|---|---|
| **FR-40** | Access Token | Short-lived JWT (~15 min). Payload contains `sub` (user_id as string), `exp`, `iat`. No PII, passwords, or secrets in the payload. Sent by the frontend via `Authorization: Bearer <token>` header. |
| **FR-41** | Refresh Token | Long-lived opaque token (~30 days). Stored in the database as a SHA-256 hash (never plaintext). **Rotation on every use:** when a refresh token is used, the old token is revoked and a new token is issued. Supports server-side revocation. Token reuse after rotation is detected and triggers revocation of the entire token family (security measure against token theft). |
| **FR-44** | Automatic Token Refresh | Frontend intercepts 401 responses and transparently calls `POST /auth/refresh` (HttpOnly cookie sent automatically by the browser). Concurrent requests during refresh are queued and retried with the new access token. On refresh failure (e.g., revoked or expired refresh token), redirect to login page. |

#### Data Isolation

| FR | Requirement | Description |
|---|---|---|
| **FR-42** | User Data Isolation | Every resource query (expenses, categories, budgets, dashboard aggregations) is scoped to `WHERE user_id = <authenticated_user_id>`. The `user_id` is derived from the validated JWT via a FastAPI dependency — never from the client. A user cannot access, modify, or delete another user's data. Attempting to access another user's resource by ID returns `404 Not Found` (not `403`, to prevent resource ID enumeration). |

### 4.2 Security Requirements

| Requirement | Implementation |
|---|---|
| Password Storage | BCrypt hash via `passlib`. Never store or log plaintext passwords. Minimum 12 rounds. |
| Refresh Token Storage | SHA-256 hash in `refresh_tokens` table. Never store the raw token in the database. |
| JWT Signing Secret | Stored in environment variable `JWT_SECRET_KEY`. Never hardcoded, committed to Git, or exposed to the frontend. |
| HTTPS | Required in production. Enforced by Vercel and Railway by default. |
| CORS | Restrict `allow_origins` to known frontend domain(s) in production. No wildcard `*` origin. Credentials allowed (`allow_credentials=True`). |
| Cookie Security | Refresh token cookie: `Secure` (HTTPS only in production), `HttpOnly` (no JS access), `SameSite=None` (required for cross-domain Vercel↔Railway), `Path=/api/v1/auth`. |
| CSRF Mitigation | Cookie `Path` restricted to `/api/v1/auth` (only sent to auth endpoints). Refresh endpoint is `POST`-only. Strict CORS origin validation. |
| Rate Limiting | Login: 5 attempts/minute per IP. Forgot password: 3 attempts/minute per IP. Applied via `slowapi` middleware. |
| Token Validation | Verify JWT signature, expiration (`exp`), and required claims (`sub`). Reject tampered, expired, or malformed tokens with `401`. |
| No Sensitive Data in Tokens | JWT payload contains only `sub` (user_id), `exp`, `iat`. No passwords, emails, or PII. |
| No Secrets to Frontend | `JWT_SECRET_KEY`, `GOOGLE_CLIENT_SECRET`, `SMTP_PASSWORD` are backend-only env vars. Never exposed via `NEXT_PUBLIC_*`. |
| Token Theft Detection | Refresh token reuse after rotation triggers revocation of the entire token family for the session. |

### 4.3 Google Sign-In Flow (Detail)

1. Frontend renders a Google Sign-In button using `@react-oauth/google` with `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
2. User authenticates with Google in a popup → frontend receives a Google **ID token** (not an access token).
3. Frontend sends the ID token to `POST /api/v1/auth/google` in the request body.
4. Backend validates the ID token using `google-auth` library:
   - Verifies signature against Google's public keys
   - Verifies `aud` matches `GOOGLE_CLIENT_ID`
   - Verifies `iss` is `accounts.google.com` or `https://accounts.google.com`
   - Verifies `exp` is not past
5. Backend extracts `sub` (Google user ID), `email`, `name`, `email_verified` from the validated token payload.
6. Backend user resolution:
   - If a user with this `google_id` exists → log them in.
   - Else if a user with this `email` exists **and** `email_verified = true` on the Google token → link the `google_id` to the existing account, log them in.
   - Else → create a new user with `google_id` set, `password_hash = NULL`, `email_verified = true`, seed starter categories (FR-10), log them in.
7. Backend issues the same access token (body) + refresh token (HttpOnly cookie) pair as regular login.

---

## 5. Database Design
See **[Database_Design.md](./Database_Design.md)** for the full entity-relationship overview, table definitions (`users`, `refresh_tokens`, `categories`, `expenses`, `budgets`), constraints, indexes, user-scoped uniqueness, and the migration/seed strategy.

---

## 6. API Specification
See **[API_Specification.md](./API_Specification.md)** for the full endpoint contract — Health, Auth, Categories, Expenses, Dashboard/Reports, Budgets — and the error response convention. Every endpoint is annotated with its authentication level (public, cookie-only, or bearer token required). All resource endpoints enforce user data isolation (FR-42).

---

## 7. UI/UX Specification
See **[UI_UX_Specification.md](./UI_UX_Specification.md)** for frontend validation rules, auth page designs, protected route behavior, token refresh UX, live budget update behavior (FR-27), empty/loading/error states, Framer Motion micro-interactions, and responsiveness rules.

---

## 8. Project Structure & Deployment
See **[Project_Structure_and_Deployment.md](./Project_Structure_and_Deployment.md)** for the full monorepo folder structure (backend layered as Controller/DTO/Service/Repository/Entity with auth layers, frontend as Next.js App Router with auth and protected route groups), the `.env.example` files (including JWT, Google OAuth, SMTP, cookie configuration), and the deployment steps.

---

## 9. Non-Functional Requirements (carried from PRD + Auth Layer)

| Requirement Category | Technical Implementation |
|---|---|
| Performance — real DB data always | No mock data anywhere; seed migration and per-user registration seeding are the only pre-populated data, and they are real DB rows. |
| Scalability | Layered backend (api/services/repositories), monorepo with clean frontend/backend boundary. Multi-user from day one. |
| Testability | Pytest (backend) + Vitest (frontend), each module independently runnable. Auth flows tested end-to-end including token lifecycle. |
| Reliability | Alembic migrations are the single source of schema truth. CI runs tests before deploy. |
| Authentication | JWT-based with BCrypt password hashing, refresh token rotation, server-side revocation, Google OAuth support. |
| Authorization (Data Isolation) | Every resource query scoped to `user_id` derived from validated JWT. No cross-user access possible. |
| Security — Secrets | All secrets env-driven (`JWT_SECRET_KEY`, `GOOGLE_CLIENT_SECRET`, `SMTP_PASSWORD`). Never hardcoded, logged, or exposed to frontend. |
| Security — Transport | HTTPS in production (Vercel + Railway enforce TLS by default). |
| Security — Rate Limiting | Auth endpoints (login: 5/min, forgot password: 3/min) rate-limited via `slowapi` to prevent brute-force attacks. |
| Security — Cookie | Refresh token in `Secure; HttpOnly; SameSite` cookie. `Path` restricted to `/api/v1/auth`. |
| Security — Token Lifecycle | Access tokens expire in ~15 min. Refresh tokens rotated on every use, revocable server-side, stored as SHA-256 hash. Reuse detection triggers family revocation. |

---

## 10. Recommended Additions (Industry Standard)

- **CI Pipeline (GitHub Actions):** Lint + test on every PR for both `frontend/` and `backend/`, including auth test coverage. Run before merge to `main`.
- **API documentation:** FastAPI auto-generates OpenAPI/Swagger at `/docs` — auth endpoints included with `Bearer` security scheme annotation.
- **Structured logging:** Request logging in FastAPI (method, path, status, latency, user_id where authenticated). **Never log passwords, tokens, or secrets.**
- **Database backup:** Supabase provides automatic backups on paid tiers — critical now that user credentials are stored.
- **Refresh token cleanup:** Periodic job or cron to purge expired and revoked refresh tokens from the `refresh_tokens` table.

---

## 11. Traceability Note

Every FR-1 through FR-30 from the PRD maps to an API endpoint (see API_Specification.md) or a frontend behavior (see UI_UX_Specification.md). All existing resource endpoints now require authentication and enforce user data isolation (FR-42).

Authentication & authorization requirements (FR-31 through FR-44) map to:
- Auth API endpoints (see API_Specification.md §2)
- Database schema (`users`, `refresh_tokens` tables + `user_id` FK on all resource tables — see Database_Design.md)
- Frontend auth pages and components (see UI_UX_Specification.md §6, Project_Structure_and_Deployment.md)

Out-of-scope items (recurring expenses, multi-currency, bank sync, notifications, export, native mobile) are intentionally **not** reflected in this schema/API — they remain Phase 2+ per PRD Section 13.
