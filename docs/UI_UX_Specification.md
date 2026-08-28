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

## 4. Micro-interactions & Visual Ergonomics (Framer Motion + Design Intelligence)
- Page/route transitions with 3D spatial easing (`SpatialTransition.tsx`)
- Hardware-accelerated 3D Parallax Tilt Cards (`TiltCard.tsx`) with layered Z-depth hierarchy and touch fallback
- Number count-up spring ticker (`NumberTicker.tsx`) for totals, daily limits, and budget remaining balances
- Dual-theme token system (Light ☀️ / Dark 🌙) with 1-click toggle and zero FOUC
- 1-tap quick amount preset chips (`+₹50`, `+₹100`, `+₹500`, `+₹1,000`, `+₹2,000`) and quick date presets (`Today`, `Yesterday`)
- Smart Category Suggester that detects keywords in expense title to recommend matching categories instantly
- Global keyboard navigation shortcuts (`1-4` for tabs, `N` for new expense, `Esc` for modals) with desktop key badges
- Mobile tactile haptic feedback (`triggerHaptic()`) on expense creation, quick adds, and deletion
- Accessible SVG iconography and glassmorphic badges across empty and chart fallback states
- Budget velocity & calendar burn rate indicators in daily tracker

---

## 5. Responsiveness
- Mobile-first Tailwind breakpoints (`sm`, `md`, `lg`, `xl`)
- Hamburger nav collapses on mobile to slide-out drawer, expands to a persistent vertical sidebar on desktop (≥`lg`)
- Charts resize/reflow for small screens (stacked layout on mobile, side-by-side on desktop)
- Tables (expense list) convert to card-based layout on mobile

