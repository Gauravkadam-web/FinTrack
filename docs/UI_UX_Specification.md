# UI/UX Specification
## FinTrack — Personal Expense Tracker (V1 / MVP)

**Document Version:** 1.0
**Extracted from:** FinTrack SRS v1 (Section 6) — this is the final, authoritative version.

---

## 1. Validation
- **Zod schemas** mirror backend Pydantic schemas exactly (title ≤50 chars, amount > 0, date ≤ today, etc.) — validated on blur + on submit via React Hook Form.
- Server-side validation is the source of truth; client-side is for UX speed only (never trust client alone).

---

## 2. Live Budget Updates (FR-27)
After any expense create/update/delete, the frontend re-fetches `/budgets?month=...` (or uses optimistic local recalculation, then reconciles) so the remaining-balance and status shown on the dashboard update immediately — without a manual page refresh.

---

## 3. UI/UX & States
- Every screen implements **empty, loading, and error states** explicitly (PRD Section 6).
- Empty states are contextual and actionable (e.g., empty expense list → "No expenses yet — Add your first one"; empty budget → CTA to set one).
- Destructive actions (delete expense, delete category) always show a confirmation modal; category delete confirmation shows the live count of affected expenses (via `/categories/{id}/expense-count`).

---

## 4. Micro-interactions (Framer Motion)
- Page/route transitions (fade/slide)
- List item enter/exit animations (add/delete expense)
- Number count-up animation for totals and budget remaining balance
- Chart entrance animations
- Toast notifications for success/error (create/update/delete actions)
- Hamburger menu open/close transition

---

## 5. Responsiveness
- Mobile-first Tailwind breakpoints (`sm`, `md`, `lg`, `xl`)
- Hamburger nav collapses on mobile, can expand to a persistent sidebar on desktop (≥`lg`)
- Charts resize/reflow for small screens (stacked layout on mobile, side-by-side on desktop)
- Tables (expense list) convert to card-based layout on mobile
