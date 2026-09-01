# API Specification
## FinTrack — Personal Expense Tracker

**Document Version:** 2.0  
**Based on:** FinTrack SRS v2.0 — this is the final, authoritative version.

**Base URL (dev):** `http://localhost:8000/api/v1`  
**Format:** JSON  
**Auth:** JWT Bearer Token (except where noted as Public or Cookie-only)

> **Auth Level Legend:**
> - ❌ **Public** — No authentication required.
> - 🍪 **Cookie** — No Bearer token required; the `HttpOnly` refresh token cookie is sent automatically by the browser.
> - 🔒 **Bearer** — Requires `Authorization: Bearer <access_token>` header. All resource queries are implicitly scoped to the authenticated user (`WHERE user_id = <jwt.sub>`).

---

## 1. Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | ❌ Public | Returns `{ "status": "ok", "db": "connected" }` — checks DB connectivity |

---

## 2. Auth

### 2.1 Registration & Login

| Method | Endpoint | Auth | Description | Maps to |
|---|---|---|---|---|
| POST | `/auth/register` | ❌ Public | Create account. Body: `{ "email", "password", "display_name" }`. Hashes password (BCrypt), creates user, seeds starter categories (FR-10), sends verification email. Returns access token (body) + sets refresh token (cookie). | FR-31 |
| POST | `/auth/login` | ❌ Public | Email + password login. Body: `{ "email", "password" }`. Returns access token (body) + sets refresh token (cookie). Rate-limited: **5/min per IP**. | FR-32 |
| POST | `/auth/google` | ❌ Public | Google Sign-In. Body: `{ "id_token" }`. Backend validates the Google ID token, finds or creates user (with account linking), seeds starter categories on new account, issues JWT pair. | FR-33 |

**Login / Register / Google response shape:**
```json
{
  "access_token": "<jwt>",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "Gaurav",
    "email_verified": true,
    "auth_provider": "local"
  }
}
```
> The `refresh_token` is **not** in the response body — it is set as a `Set-Cookie` header: `refresh_token=<token>; HttpOnly; Secure; SameSite=None; Path=/api/v1/auth; Max-Age=2592000`.

### 2.2 Token Lifecycle

| Method | Endpoint | Auth | Description | Maps to |
|---|---|---|---|---|
| POST | `/auth/refresh` | 🍪 Cookie | Rotate refresh token. Reads the `refresh_token` cookie, validates the hash against the DB, revokes the old token, issues a new access token (body) + new refresh token (cookie). Detects token reuse → revokes entire token family. | FR-41, FR-44 |
| POST | `/auth/logout` | 🍪 Cookie | Revoke current refresh token. Clears the `refresh_token` cookie. | FR-34 |
| POST | `/auth/logout-all` | 🔒 Bearer | Revoke **all** refresh tokens for the authenticated user (all devices/sessions). Clears the current cookie. | FR-35 |

### 2.3 Password Management

| Method | Endpoint | Auth | Description | Maps to |
|---|---|---|---|---|
| POST | `/auth/forgot-password` | ❌ Public | Send password reset email. Body: `{ "email" }`. Always returns `200` regardless of email existence (prevents enumeration). Token expires in 1 hour. Rate-limited: **3/min per IP**. | FR-36 |
| POST | `/auth/reset-password` | ❌ Public | Reset password via token. Body: `{ "token", "new_password" }`. Token is single-use (invalidated after use). | FR-37 |
| PUT | `/auth/change-password` | 🔒 Bearer | Change password. Body: `{ "current_password", "new_password" }`. Verifies current password before updating. | FR-38 |

### 2.4 User Profile & Verification

| Method | Endpoint | Auth | Description | Maps to |
|---|---|---|---|---|
| GET | `/auth/me` | 🔒 Bearer | Get current user profile. Returns `{ id, email, display_name, email_verified, auth_provider, created_at }`. | FR-43 |
| POST | `/auth/verify-email` | ❌ Public | Verify email address. Body: `{ "token" }`. Sets `email_verified = true` on the user record. | FR-39 |

---

## 3. Categories

> **All endpoints require 🔒 Bearer authentication.** Queries are scoped to the authenticated user's categories only (FR-42).

| Method | Endpoint | Description | Maps to |
|---|---|---|---|
| GET | `/categories` | List all of the authenticated user's categories with `expense_count` per category | FR-9 |
| POST | `/categories` | Create category `{ name }` for the authenticated user | FR-6 |
| PATCH | `/categories/{id}` | Rename category (blocked if `is_system=true`). Returns `404` if category does not belong to the authenticated user. | FR-7 |
| DELETE | `/categories/{id}` | Delete category → reassigns linked expenses to user's `Uncategorized` (blocked if `is_system=true`). Returns `404` if not owned. | FR-8 |
| GET | `/categories/{id}/expense-count` | Count of authenticated user's expenses using this category (for confirmation dialog preview). Returns `404` if not owned. | supports FR-8 UX |

---

## 4. Expenses

> **All endpoints require 🔒 Bearer authentication.** Queries are scoped to the authenticated user's expenses only (FR-42).

| Method | Endpoint | Description | Maps to |
|---|---|---|---|
| GET | `/expenses` | Paginated list of the authenticated user's expenses. Query params: `page`, `limit`, `search`, `category_id`, `date_from`, `date_to`, `amount_min`, `amount_max`, `payment_mode`, `sort_by` (`amount`\|`date`\|`category`), `sort_order` (`asc`\|`desc`). **`search` matches `title` OR `notes`, case-insensitive (`ILIKE`)** — per FR-11 | FR-3, FR-11–16 |
| POST | `/expenses` | Create expense for the authenticated user | FR-2 |
| GET | `/expenses/{id}` | Get single expense. Returns `404` if expense does not belong to the authenticated user. | FR-3 |
| PUT | `/expenses/{id}` | Update expense (full update). Returns `404` if not owned. | FR-4 |
| DELETE | `/expenses/{id}` | Delete expense (confirmation handled client-side). Returns `404` if not owned. | FR-5 |

**List response shape (unchanged):**
```json
{
  "items": [ { "id": "...", "title": "...", "amount": 450.00, "..." : "..." } ],
  "page": 1,
  "limit": 20,
  "total_count": 134,
  "total_pages": 7
}
```

---

## 5. Dashboard / Reports

> **All endpoints require 🔒 Bearer authentication.** Aggregations are computed only from the authenticated user's data (FR-42).

| Method | Endpoint | Description | Maps to |
|---|---|---|---|
| GET | `/dashboard/summary?month=YYYY-MM` (defaults to current month) | Total spent, recent expenses (last 5), category breakdown (pie), budget snapshot — for the authenticated user in the given month | FR-17–19, FR-21 |
| GET | `/dashboard/trend?granularity=daily\|weekly\|monthly&month=YYYY-MM` | Spend-over-time data for the bar/line chart, bucketed by the given granularity, for the authenticated user | FR-20, FR-22 |
| GET | `/dashboard/comparison?month=YYYY-MM` | Current vs previous month total + % change for the authenticated user | FR-23 |
| GET | `/dashboard/top-categories?month=YYYY-MM&limit=5` | Top N categories ranked by spend for the authenticated user | FR-24 |
| GET | `/dashboard/average-spend?period=daily\|weekly` | Average spend (normalized) for the authenticated user | FR-25 |

> **Note:** An earlier draft had a single `/dashboard/summary?period=daily|weekly|monthly&date=...` endpoint, which was ambiguous — unclear whether "daily" meant "totals for one specific day" or "bucket the trend chart by day." This was split into `summary` (current-month totals + snapshot) and `trend` (time-series bucketing) to remove the ambiguity.

---

## 6. Budgets

> **All endpoints require 🔒 Bearer authentication.** Queries are scoped to the authenticated user's budgets only (FR-42).

| Method | Endpoint | Description | Maps to |
|---|---|---|---|
| GET | `/budgets?month=YYYY-MM` | Get overall + all per-category budgets for the month, each with `spent`, `remaining`, `status` (`on_track`\|`near_limit`\|`over_budget`), for the authenticated user | FR-21, FR-26, FR-27 |
| POST | `/budgets` | Create/set a budget `{ category_id (nullable), period_month, limit_amount }` for the authenticated user | FR-26 |
| PUT | `/budgets/{id}` | Update a budget limit. Returns `404` if not owned. | FR-26 |
| DELETE | `/budgets/{id}` | Remove a budget goal. Returns `404` if not owned. | FR-26 |

**Status thresholds (business rule, computed server-side — unchanged):**
- `on_track`: spent < 80% of limit
- `near_limit`: spent 80%–99.99% of limit
- `over_budget`: spent ≥ 100% of limit

---

## 7. Error Response Convention

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Amount must be positive", "field": "amount" } }
```

**HTTP status codes:**

| Status | Code | When |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request body fails validation (Pydantic / business rule) |
| `401` | `UNAUTHORIZED` | Missing, expired, invalid, or tampered access token / refresh token |
| `403` | `FORBIDDEN` | Valid token but action not permitted (e.g., Google-only account trying to change password) |
| `404` | `NOT_FOUND` | Resource not found **or** resource belongs to a different user (prevents enumeration) |
| `409` | `CONFLICT` | Duplicate (e.g., duplicate category name, duplicate email on registration, deleting a system category) |
| `429` | `RATE_LIMITED` | Too many attempts on rate-limited endpoint (login, forgot password) |
| `500` | `INTERNAL_ERROR` | Unexpected server error |
