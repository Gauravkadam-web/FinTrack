
# Database Design
## FinTrack — Personal Expense Tracker (V1 / MVP)

**Document Version:** 1.0
**Extracted from:** FinTrack SRS v1 (Section 4) — this is the final, authoritative version.

---

## 1. Entity Relationship Overview

```
categories (1) ──────< (many) expenses
categories (1) ──────< (0..1) budgets [category-scoped]
budgets (overall, no category_id) — one per month
```

---

## 2. Tables

### `categories`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default `gen_random_uuid()` |
| name | VARCHAR(50) | UNIQUE, NOT NULL *(PRD doesn't specify a max length — assumed 50 to match the expense title limit; confirm)* |
| is_system | BOOLEAN | default `false` — `true` only for the protected `Uncategorized` row |
| expense_count | — | *(computed, not stored — via query/aggregation, per FR-9)* |
| created_at | TIMESTAMPTZ | default `now()` |
| updated_at | TIMESTAMPTZ | default `now()`, auto-updated |

> **`Uncategorized` category:** seeded via migration with `is_system = true`. Cannot be renamed or deleted (enforced at API layer). All other starter categories (Food, Transport, Rent, etc. — FR-10) seeded with `is_system = false` (user can rename/delete them like any category).

### `expenses`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default `gen_random_uuid()` |
| title | VARCHAR(50) | NOT NULL |
| category_id | UUID | FK → `categories.id`, `ON DELETE RESTRICT`, NOT NULL |
| amount | NUMERIC(10,2) | NOT NULL, CHECK (`amount > 0`) |
| expense_date | DATE | NOT NULL, CHECK (`expense_date <= CURRENT_DATE`) |
| notes | TEXT | NULLABLE |
| payment_mode | VARCHAR(20) | NULLABLE, CHECK IN (`cash`, `card`, `upi`, `other`) *(PRD only lists Cash/Card/UPI as examples — `other` added as an assumption so the field isn't a dead end; confirm or drop)* |
| created_at | TIMESTAMPTZ | default `now()` |
| updated_at | TIMESTAMPTZ | default `now()`, auto-updated |

> Indexes: `idx_expenses_category_id`, `idx_expenses_expense_date`, `idx_expenses_title` (for search), composite index on `(expense_date, category_id)` for common dashboard queries.

> **Note on category delete (FR-8):** DB-level `ON DELETE RESTRICT` is intentional — the actual reassignment-to-`Uncategorized` is handled at the **API/service layer** (explicit transaction: update all linked expenses' `category_id` to Uncategorized's id, *then* delete the category), not via DB cascade. This keeps the confirmation-dialog step meaningful and auditable.

### `budgets`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default `gen_random_uuid()` |
| category_id | UUID | FK → `categories.id`, `ON DELETE CASCADE`, NULLABLE (`NULL` = overall budget) |
| period_month | DATE | NOT NULL — stored as first-of-month, e.g. `2026-08-01` |
| limit_amount | NUMERIC(10,2) | NOT NULL, CHECK (`limit_amount > 0`) |
| created_at | TIMESTAMPTZ | default `now()` |
| updated_at | TIMESTAMPTZ | default `now()`, auto-updated |

> Unique constraint: `(category_id, period_month)` — prevents duplicate budgets for the same category+month (and `(NULL, period_month)` for overall budget, one per month).
> **Fixed bug in earlier draft:** `category_id` FK needs `ON DELETE CASCADE` here (unlike `expenses`, which uses `RESTRICT`). When a category is deleted, its per-category budget becomes meaningless (all its expenses have already been reassigned to `Uncategorized` by the service layer) — so the orphaned budget row should auto-delete rather than block or dangle.

---

## 3. Migrations & Seed Strategy
- **Alembic** manages all schema migrations (`alembic revision --autogenerate`).
- A dedicated **seed migration** (data migration, not schema) inserts:
  - `Uncategorized` (`is_system = true`)
  - Starter categories per FR-10: `Food`, `Transport`, `Rent`, `Utilities`, `Entertainment`, `Shopping`, `Healthcare`, `Other`
- Seed migration is idempotent (checks existence before insert) so it's safe to re-run.
