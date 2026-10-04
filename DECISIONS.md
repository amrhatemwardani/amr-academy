# Amr Academy — Engineering Decisions Log

Each entry documents a non-obvious engineering choice, the alternatives considered, and the reasoning.

---

## D1 — True/False question storage
**Decision**: Store True/False questions as `question_type = 'true_false'` with exactly two auto-generated options ("True" and "False") inserted into `question_options`. The correct option is marked in `option_keys` the same way as MCQ.
**Why**: Sharing the MCQ grading path in `submit_attempt` avoids branching logic. The `question_type` enum value distinguishes T/F in the UI so the editor can restrict option editing.

## D2 — Arabic font
**Decision**: Use **Cairo** (Google Fonts) as the Arabic display font.
**Why**: Cairo is an Egyptian/Arabic geometric sans-serif with excellent digital readability, high Unicode coverage for Egyptian Arabic text, and Latinized numerals that match Inter's weight. Appropriate for Egyptian educational context.

## D3 — Theme system
**Decision**: `next-themes` with `strategy: 'class'` on `<html>`. CSS custom properties defined in `globals.css` following the shadcn/ui convention.
**Why**: Zero-flash theme loading (theme class set before paint via script); CSS variables enable runtime switching without full rerender; shadcn/ui components use the same var names out of the box.

## D4 — Student synthetic email format
**Decision**: Student accounts authenticate with synthetic email `{student_code}@students.local` (e.g. `S1001@students.local`). The student_code and/or phone are the login identifiers in the UI; the server maps them to this email before calling `supabase.auth.signInWithPassword`.
**Why**: Supabase Auth requires a unique email for every user. This pattern satisfies that without requiring real email addresses, while keeping student_code and phone as the human-visible identifiers.

## D5 — Middleware role lookup strategy
**Decision**: Read `profiles.role` from the database on every protected request (cached in a short-lived server-side call, not in the JWT). JWT `user_metadata.role` is never trusted.
**Why**: Roles must not be spoofable by a user crafting their own JWT payload. RLS is the security wall; middleware is a UX convenience that should be accurate without trusting client-controlled data.

## D6 — Password for first-time student accounts
**Decision**: The teacher's "Add Student" action generates a 10-character alphanumeric temporary password, shown once in a dialog. A `must_change_password` boolean flag (stored in `profiles`) forces the student to set a new password at first login.
**Why**: Students may not have email for password reset. Teacher has full control. The temporary password is never stored in plaintext in the database (Supabase Auth handles hashing).

## D7 — Connection pooling
**Decision**: All server-side Supabase clients use the **direct connection** string for local dev and will switch to the **pooler (transaction mode)** connection string for Vercel deployment.
**Why**: Serverless functions work best with transaction-mode pooling (PgBouncer). Local dev with `supabase start` provides direct access which is fine for a single developer.

## D8 — Attendance percentage formula
**Decision**: `attendance_pct = (present + late) / (total_sessions - excused_sessions) * 100`
A student with zero non-excused sessions returns NULL (not 0%) to avoid misleading 0% for students who joined recently.
**Why**: Per spec A8. Excused sessions should not penalise students. NULL is handled in the UI as "N/A".

## D9 — Charges unique constraint
**Decision**: Use a partial unique index: `UNIQUE (student_id, class_id, period, kind) WHERE kind = 'monthly' AND voided_at IS NULL`. Course and other charges allow multiples.
**Why**: Per spec A5. Monthly charges must be idempotent (cron can safely run multiple times). Voided charges are excluded so a new charge can replace a voided one for the same period.

## D10 — Exam answer auto-save strategy
**Decision**: Auto-save uses a 800ms debounce on change + a 15s heartbeat interval. Calls `save_answers` RPC which does a bulk upsert. Additionally answers are mirrored to IndexedDB so a page reload can restore unsaved state locally before the next server sync.
**Why**: Per spec Section 6. Prevents data loss without hammering the DB on every keystroke.

## D11 — Client-side image resizing
**Decision**: Use the browser's Canvas API (via a utility function) to resize avatar images to ≤400×400 WebP before upload. No server-side image processing required.
**Why**: Reduces storage costs and bandwidth. Canvas API is universally available. WebP is supported by all modern browsers.

## D12 — Locale routing
**Decision**: Use `next-intl` with `[locale]` segment in the App Router path (e.g. `/en/dashboard`, `/ar/dashboard`). Default locale is `en`. No locale prefix removal to keep URLs predictable.
**Why**: Explicit locale in the URL makes links shareable and avoids detection ambiguity. next-intl handles RTL direction in the `<html lang dir>` attributes.
