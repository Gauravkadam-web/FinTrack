# API Specification
## FinTrack — Personal Expense Tracker (V1 / MVP)

**Document Version:** 1.0
**Extracted from:** FinTrack SRS v1 (Section 5) — this is the final, authoritative version.

**Base URL (dev):** `http://localhost:8000/api/v1`
**Format:** JSON | **Auth:** None (V1)

---

## 1. Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Returns `{ "status": "ok", "db": "connected" }` — checks DB connectivity too |

---

## 2. Categories
| Method | Endpoint | Description | Maps to |
|---|---|---|---|
| GET | `/categories` | List all categories with `expense_count` per category | FR-9 |
| POST | `/categories` | Create category `{ name }` | FR-6 |
| PATCH | `/categories/{id}` | Rename category (blocked if `is_system=true`) | FR-7 |
| DELETE | `/categories/{id}` | Delete category → reassigns linked expenses to `Uncategorized` (blocked if `is_system=true` or if it *is* Uncategorized) | FR-8 |
| GET | `/categories/{id}/expense-count` | Count of expenses using this category (for confirmation dialog preview) | supports FR-8 UX |

---

## 3. Expenses
| Method | Endpoint | Description | Maps to |
|---|---|---|---|
| GET | `/expenses` | Paginated list. Query params: `page`, `limit`, `search`, `category_id`, `date_from`, `date_to`, `amount_min`, `amount_max`, `payment_mode`, `sort_by` (`amount`\|`date`\|`category`), `sort_order` (`asc`\|`desc`). **`search` matches `title` OR `notes`, case-insensitive (`ILIKE`)** — per FR-11 | FR-3, FR-11–16 |
| POST | `/expenses` | Create expense | FR-2 |
| GET | `/expenses/{id}` | Get single expense | FR-3 |
| PUT | `/expenses/{id}` | Update expense (full update) | FR-4 |
| DELETE | `/expenses/{id}` | Delete expense (confirmation handled client-side) | FR-5 |

**List response shape:**
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

## 4. Dashboard / Reports
| Method | Endpoint | Description | Maps to |
|---|---|---|---|
| GET | `/dashboard/summary?month=YYYY-MM` (defaults to current month) | Total spent, recent expenses (last 5), category breakdown (pie), budget snapshot — for the given month | FR-17–19, FR-21 |
| GET | `/dashboard/trend?granularity=daily\|weekly\|monthly&month=YYYY-MM` | Spend-over-time data for the bar/line chart, bucketed by the given granularity (e.g. daily → last 30 days, weekly → last ~12 weeks, monthly → last 12 months) | FR-20, FR-22 |
| GET | `/dashboard/comparison?month=YYYY-MM` | Current vs previous month total + % change | FR-23 |
| GET | `/dashboard/top-categories?month=YYYY-MM&limit=5` | Top N categories ranked by spend | FR-24 |
| GET | `/dashboard/average-spend?period=daily\|weekly` | Average spend, normalized | FR-25 |

> **Note:** an earlier draft had a single `/dashboard/summary?period=daily|weekly|monthly&date=...` endpoint, which was ambiguous — unclear whether "daily" meant "totals for one specific day" or "bucket the trend chart by day." This was split into `summary` (current-month totals + snapshot) and `trend` (time-series bucketing) to remove the ambiguity — reflected in the table above.

---

## 5. Budgets
| Method | Endpoint | Description | Maps to |
|---|---|---|---|
| GET | `/budgets?month=YYYY-MM` | Get overall + all per-category budgets for the month, each with `spent`, `remaining`, `status` (`on_track`\|`near_limit`\|`over_budget`) | FR-21, FR-26, FR-27 |
| POST | `/budgets` | Create/set a budget `{ category_id (nullable), period_month, limit_amount }` | FR-26 |
| PUT | `/budgets/{id}` | Update a budget limit | FR-26 |
| DELETE | `/budgets/{id}` | Remove a budget goal | FR-26 |

**Status thresholds (business rule, computed server-side):**
- `on_track`: spent < 80% of limit
- `near_limit`: spent 80%–99.99% of limit
- `over_budget`: spent ≥ 100% of limit

---

## 6. Error Response Convention
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Amount must be positive", "field": "amount" } }
```
Standard HTTP status codes: `400` validation, `404` not found, `409` conflict (e.g. duplicate category name, deleting a system category), `500` server error.
