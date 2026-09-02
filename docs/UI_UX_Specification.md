# UI/UX Specification
## FinTrack — Personal Expense Tracker

**Document Version:** 2.0  
**Based on:** FinTrack SRS v2.0 — this is the final, authoritative version.

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

---

## 6. Authentication Pages & Flows *(NEW)*

### 6.1 Route Groups & Layouts
- **Auth pages** (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`) use a **standalone centered layout** — no sidebar, no navigation. Minimal branding (FinTrack logo + tagline) centered above the form.
- **Protected pages** (`/dashboard`, `/expenses`, `/budgets`, `/categories`) use the existing **AppLayout** with sidebar navigation. Wrapped in an `AuthGuard` component.
- The root path `/` redirects to `/dashboard` if authenticated, or `/login` if not.

### 6.2 Login Page (`/login`)
- **Form fields:** Email (email type, required), Password (password type, required, show/hide toggle).
- **Validation (Zod):** Email must be valid format. Password required (no min length check on login — that's registration-only).
- **"Remember me" checkbox:** Not needed — refresh token handles session persistence via HttpOnly cookie.
- **Links:** "Don't have an account? Register" → `/register`. "Forgot your password?" → `/forgot-password`.
- **Google Sign-In button:** Prominent, below the email/password form, separated by an "or" divider. Uses `@react-oauth/google` `GoogleLogin` component.
- **Loading state:** Button shows spinner during API call. Inputs disabled during submission.
- **Error state:** Inline error message below the form on invalid credentials (generic "Invalid email or password" — no enumeration).
- **Rate limit feedback:** Show "Too many login attempts. Please try again later." on 429 response.
- **Success:** Store access token in memory (React state/context), redirect to the originally intended page (or `/dashboard`).

### 6.3 Register Page (`/register`)
- **Form fields:** Display Name (text, required, max 100 chars), Email (email type, required), Password (password type, required, min 8 chars, show/hide toggle), Confirm Password (must match).
- **Smart Password Suggester:** 1-Click "Suggest Strong Password ✨" button generating a 16-character secure password, auto-populating both password & confirm inputs and copying to clipboard with toast feedback.
- **Real-Time Password Strength Meter:** 5 animated criteria checklist pills (`8+ chars`, `Uppercase`, `Lowercase`, `Number`, `Special char`) turning emerald green live as the user types, with a 5-segment color-graded strength bar.
- **Validation (Zod):** Display name required (max 100). Email valid format. Password min 8 characters. Confirm password matches password.
- **Links:** "Already have an account? Log in" → `/login`.
- **Google Sign-In button:** Same as login page — creates account if new, logs in if existing.
- **Interactive 6-Digit OTP Verification View:**
  - Upon submission, form transitions to a 6-box numeric OTP screen with auto-focus, paste distribution, backspace navigation, and auto-submit on 6th digit.
  - 60-second cooldown timer for resend requests.
  - Dual delivery: Big 6-digit OTP code in email + 1-click verification link backup.
  - **Success & Auto-Login:** Verifying the 6-digit OTP immediately activates the account, issues access & refresh tokens, and automatically redirects the user to `/dashboard` with a welcome toast.

### 6.4 Forgot Password Page (`/forgot-password`)
- **Form fields:** Email (email type, required).
- **Validation (Zod):** Valid email format.
- **Submit behavior:** Always show success message ("If an account with this email exists, we've sent a reset link.") — never reveal whether the email is registered.
- **Rate limit feedback:** Show friendly message on 429.
- **Link:** "Back to login" → `/login`.

### 6.5 Reset Password Page (`/reset-password?token=...`)
- **Entry point:** User clicks the link in the reset email, which navigates to this page with a `token` query parameter.
- **Form fields:** New Password (min 8 chars, show/hide toggle), Confirm New Password (must match).
- **Validation (Zod):** Password min 8. Confirm matches.
- **Error states:** "Invalid or expired reset link" if the token is invalid/expired/already used.
- **Success:** Redirect to `/login` with a success toast: "Password reset successfully. Please log in."

### 6.6 Email Verification Page (`/verify-email?token=...`)
- **Entry point:** User clicks the verification link in the email.
- **Behavior:** Automatically sends the token to `POST /auth/verify-email` on page load.
- **Success state:** "Email verified successfully!" with a "Go to Dashboard" button.
- **Error state:** "Invalid or expired verification link. Please request a new one." with a resend option (future enhancement).

### 6.7 Change Password (In-App)
- Accessible from a user settings dropdown/modal (not a standalone page).
- **Form fields:** Current Password, New Password (min 8 chars), Confirm New Password.
- **Error state:** "Current password is incorrect" if verification fails.
- **Success:** Toast notification: "Password changed successfully."

---

## 7. Protected Route Behavior *(NEW)*

### 7.1 AuthGuard Component
- Wraps all protected route layouts.
- On mount, checks for a valid access token in memory.
- If no token, attempts a silent refresh (`POST /auth/refresh`) using the HttpOnly cookie.
- If refresh succeeds → user is authenticated, render the protected content.
- If refresh fails (no cookie, expired, revoked) → redirect to `/login` with the current path saved as a `redirect` query parameter (e.g., `/login?redirect=/expenses/new`).

### 7.2 Automatic Token Refresh (FR-44)
- The API client (`api-client.ts`) intercepts `401` responses.
- On first `401`, it pauses the failed request, calls `POST /auth/refresh`, and retries the original request with the new access token.
- Concurrent requests that fail with `401` during a refresh are **queued** (not individually refreshed) and retried once the single refresh completes.
- If the refresh itself returns `401` (refresh token expired/revoked), clear auth state and redirect to `/login`.

### 7.3 Session Expiry UX
- When the refresh token is expired or revoked (i.e., the user's session has fully ended), show a toast: "Your session has expired. Please log in again." and redirect to `/login`.
- Do not show an error modal — use a non-intrusive toast + redirect.

---

## 8. User Menu *(NEW)*

### 8.1 Sidebar User Section
- At the bottom of the desktop sidebar (and top of the mobile drawer), display a **user menu**:
  - User's display name (truncated if long)
  - User's email (truncated if long)
  - Avatar: User's initials in a colored circle (letter-based deterministic color)
- Clicking/tapping opens a dropdown with:
  - **Change Password** (opens modal — see §6.7)
  - **Logout** (`POST /auth/logout`, clear auth state, redirect to `/login`)
  - **Logout from all devices** (`POST /auth/logout-all`, clear auth state, redirect to `/login`, toast: "Logged out from all devices.")

### 8.2 Auth Provider Awareness
- If the user signed in via Google (no local password), the **Change Password** option is hidden (since they have no password to change).
- The user profile section may show a small Google icon badge next to the avatar to indicate the auth provider.
