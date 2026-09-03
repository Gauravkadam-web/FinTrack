
# Database Design
## FinTrack — Personal Expense Tracker

**Document Version:** 2.0  
**Based on:** FinTrack SRS v2.0 — this is the final, authoritative version.

---

## 1. Entity Relationship Overview

```
users (1) ──────< (many) categories
users (1) ──────< (many) expenses
users (1) ──────< (many) budgets
users (1) ──────< (many) refresh_tokens

categories (1) ──────< (many) expenses
categories (1) ──────< (0..1) budgets   [category-scoped, per user per month]
budgets (overall, no category_id) ——— one per user per month
```

> All resource tables (`categories`, `expenses`, `budgets`) have a `user_id` FK to `users.id`. Every query is scoped to the authenticated user (FR-42).

---

## 2. Tables

### `users` *(NEW)*
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default `gen_random_uuid()` |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NULLABLE — `NULL` for Google-only accounts (no local password set) |
| display_name | VARCHAR(100) | NOT NULL |
| google_id | VARCHAR(255) | UNIQUE, NULLABLE — set when user authenticates via Google |
| phone_number | VARCHAR(20) | UNIQUE, NULLABLE, INDEXED — user mobile number for SMS OTP |
| phone_verified | BOOLEAN | default `false` — set to `true` after phone SMS OTP verification |
| email_verified | BOOLEAN | default `false` — set to `true` after email verification or Google sign-in |
| is_active | BOOLEAN | default `true` — reserved for future account suspension |
| created_at | TIMESTAMPTZ | default `now()` |
| updated_at | TIMESTAMPTZ | default `now()`, auto-updated |

> Indexes: `idx_users_email` (covered by UNIQUE), `idx_users_google_id` (covered by UNIQUE), `ix_users_phone_number` (UNIQUE).

### `refresh_tokens` *(NEW)*
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default `gen_random_uuid()` |
| user_id | UUID | FK → `users.id`, ON DELETE CASCADE, NOT NULL |
| token_hash | VARCHAR(255) | NOT NULL — SHA-256 hash of the raw refresh token |
| device_info | VARCHAR(255) | NULLABLE — User-Agent string or device label for session identification |
| expires_at | TIMESTAMPTZ | NOT NULL |
| revoked_at | TIMESTAMPTZ | NULLABLE — set on logout or token rotation |
| replaced_by | UUID | NULLABLE, FK → `refresh_tokens.id` — points to the new token in the rotation chain |
| created_at | TIMESTAMPTZ | default `now()` |

> Indexes: `idx_refresh_tokens_user_id`, `idx_refresh_tokens_token_hash`.
>
> **Cleanup:** Expired and revoked tokens should be periodically purged (background task or cron). Tokens older than `expires_at + 7 days` are safe to delete.
>
> **Token reuse detection:** If a refresh token that has already been rotated (i.e., `revoked_at IS NOT NULL` and `replaced_by IS NOT NULL`) is presented again, it indicates potential token theft. The backend should revoke the **entire token family** (all tokens linked via `replaced_by` chain) for security.

### `categories`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default `gen_random_uuid()` |
| **user_id** | **UUID** | **FK → `users.id`, ON DELETE CASCADE, NOT NULL** |
| name | VARCHAR(50) | NOT NULL |
| is_system | BOOLEAN | default `false` — `true` only for the protected `Uncategorized` row (one per user) |
| expense_count | — | *(computed, not stored — via query/aggregation, per FR-9)* |
| created_at | TIMESTAMPTZ | default `now()` |
| updated_at | TIMESTAMPTZ | default `now()`, auto-updated |

> **Uniqueness:** `UNIQUE(user_id, name)` — each user can have their own set of category names. Two different users can both have a "Food" category.
>
> **`Uncategorized` category:** Seeded per user on registration with `is_system = true`. Cannot be renamed or deleted (enforced at API layer). All other starter categories (Food, Transport, Rent, etc. — FR-10) seeded per user with `is_system = false` (user can rename/delete them like any custom category).

### `expenses`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default `gen_random_uuid()` |
| **user_id** | **UUID** | **FK → `users.id`, ON DELETE CASCADE, NOT NULL** |
| title | VARCHAR(50) | NOT NULL |
| category_id | UUID | FK → `categories.id`, `ON DELETE RESTRICT`, NOT NULL |
| amount | NUMERIC(10,2) | NOT NULL, CHECK (`amount > 0`) |
| expense_date | DATE | NOT NULL, CHECK (`expense_date <= CURRENT_DATE`) |
| notes | TEXT | NULLABLE |
| payment_mode | VARCHAR(20) | NULLABLE, CHECK IN (`cash`, `card`, `upi`, `other`) |
| created_at | TIMESTAMPTZ | default `now()` |
| updated_at | TIMESTAMPTZ | default `now()`, auto-updated |

> Indexes: `idx_expenses_user_id`, `idx_expenses_category_id`, `idx_expenses_expense_date`, `idx_expenses_title` (for search), composite index on `(user_id, expense_date, category_id)` for dashboard queries scoped to a user.
>
> **Note on category delete (FR-8):** DB-level `ON DELETE RESTRICT` is intentional — the actual reassignment-to-`Uncategorized` is handled at the **API/service layer** (explicit transaction: update all linked expenses' `category_id` to the user's Uncategorized id, *then* delete the category), not via DB cascade. This keeps the confirmation-dialog step meaningful and auditable.

### `budgets`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default `gen_random_uuid()` |
| **user_id** | **UUID** | **FK → `users.id`, ON DELETE CASCADE, NOT NULL** |
| category_id | UUID | FK → `categories.id`, `ON DELETE CASCADE`, NULLABLE (`NULL` = overall budget) |
| period_month | DATE | NOT NULL — stored as first-of-month, e.g. `2026-08-01` |
| limit_amount | NUMERIC(10,2) | NOT NULL, CHECK (`limit_amount > 0`) |
| created_at | TIMESTAMPTZ | default `now()` |
| updated_at | TIMESTAMPTZ | default `now()`, auto-updated |

> **Uniqueness:** `UNIQUE(user_id, category_id, period_month)` — prevents duplicate budgets for the same user + category + month. The overall budget is represented by `category_id = NULL`, unique per user per month.
>
> **Category FK:** `ON DELETE CASCADE` here (unlike `expenses`, which uses `RESTRICT`). When a category is deleted, its per-category budget becomes meaningless (all its expenses have already been reassigned to `Uncategorized` by the service layer) — so the orphaned budget row auto-deletes.

---

## 3. Migrations & Seed Strategy

### 3.1 Schema Migrations (Alembic)
- **Alembic** manages all schema migrations (`alembic revision --autogenerate`).
- Each migration is reversible where possible (includes `downgrade()`).

### 3.2 Auth Migration (Data Migration)
The auth migration adds the `users` and `refresh_tokens` tables, and the `user_id` column to all existing resource tables. The migration is structured as follows:

1. **Create `users` table** with all columns and constraints.
2. **Create `refresh_tokens` table** with all columns, constraints, and indexes.
3. **Add `user_id` column** to `categories`, `expenses`, and `budgets` as **NULLABLE** (temporary).
4. **Backfill existing data:** Create a migration-owner user (using a configurable email from the `MIGRATION_OWNER_EMAIL` environment variable, or a default like `owner@fintrack.local`) and assign all existing rows to this user.
5. **Alter `user_id` to NOT NULL** on all three tables.
6. **Add FK constraints and indexes** for `user_id`.
7. **Update uniqueness constraints:**
   - `categories`: Drop `UNIQUE(name)`, add `UNIQUE(user_id, name)`.
   - `budgets`: Drop `UNIQUE(category_id, period_month)`, add `UNIQUE(user_id, category_id, period_month)`.

### 3.3 Starter Category Seeding
- The existing global seed migration (v1) remains for backward compatibility.
- Going forward, starter categories (`Uncategorized` with `is_system=true`, plus `Food`, `Transport`, `Rent`, `Utilities`, `Entertainment`, `Shopping`, `Healthcare`, `Other` with `is_system=false`) are seeded **per user on registration** by the auth service (FR-31).
- The seeding logic is idempotent (checks existence before insert) so it is safe to re-run.
