-- =====================================================================
-- 0008_rls.sql
-- Row-Level Security policies for all tables.
-- Strategy:
--   • Teacher: full access via is_teacher() helper
--   • Students: narrow read-only on their own rows; writes via RPC only
--   • Some tables: NO student access at all
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- Enable RLS on every table
-- ─────────────────────────────────────────────────────────────────────
alter table profiles              enable row level security;
alter table students              enable row level security;
alter table student_notes         enable row level security;
alter table classes               enable row level security;
alter table enrollments           enable row level security;
alter table attendance            enable row level security;
alter table fee_structures        enable row level security;
alter table charges               enable row level security;
alter table payments              enable row level security;
alter table payment_allocations   enable row level security;
alter table questions             enable row level security;
alter table question_options      enable row level security;
alter table option_keys           enable row level security;
alter table question_keys         enable row level security;
alter table exams                 enable row level security;
alter table exam_questions        enable row level security;
alter table exam_attempts         enable row level security;
alter table student_answers       enable row level security;
alter table exam_results          enable row level security;
alter table notifications         enable row level security;
alter table settings              enable row level security;
alter table audit_log             enable row level security;

-- ─────────────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────────────
-- Teacher: full access
drop policy if exists teacher_all on profiles;
create policy teacher_all on profiles
  for all using (is_teacher()) with check (is_teacher());

-- Student: read own profile only
drop policy if exists student_read_own_profile on profiles;
create policy student_read_own_profile on profiles
  for select using (id = auth.uid());

-- Student: update own profile (name, locale, avatar_url, must_change_password)
drop policy if exists student_update_own_profile on profiles;
create policy student_update_own_profile on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- STUDENTS
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on students;
create policy teacher_all on students
  for all using (is_teacher()) with check (is_teacher());

drop policy if exists student_read_own on students;
create policy student_read_own on students
  for select using (id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- STUDENT_NOTES — teacher only; NO student access
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on student_notes;
create policy teacher_all on student_notes
  for all using (is_teacher()) with check (is_teacher());

-- ─────────────────────────────────────────────────────────────────────
-- CLASSES
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on classes;
create policy teacher_all on classes
  for all using (is_teacher()) with check (is_teacher());

-- Students: read classes they are enrolled in
drop policy if exists student_read_enrolled_classes on classes;
create policy student_read_enrolled_classes on classes
  for select using (
    exists (
      select 1 from enrollments e
      where e.class_id = classes.id
        and e.student_id = auth.uid()
        and e.left_on is null
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- ENROLLMENTS
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on enrollments;
create policy teacher_all on enrollments
  for all using (is_teacher()) with check (is_teacher());

drop policy if exists student_read_own_enrollments on enrollments;
create policy student_read_own_enrollments on enrollments
  for select using (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- ATTENDANCE
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on attendance;
create policy teacher_all on attendance
  for all using (is_teacher()) with check (is_teacher());

drop policy if exists student_read_own_attendance on attendance;
create policy student_read_own_attendance on attendance
  for select using (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- FEE_STRUCTURES — teacher only
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on fee_structures;
create policy teacher_all on fee_structures
  for all using (is_teacher()) with check (is_teacher());

-- ─────────────────────────────────────────────────────────────────────
-- CHARGES
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on charges;
create policy teacher_all on charges
  for all using (is_teacher()) with check (is_teacher());

drop policy if exists student_read_own_charges on charges;
create policy student_read_own_charges on charges
  for select using (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on payments;
create policy teacher_all on payments
  for all using (is_teacher()) with check (is_teacher());

drop policy if exists student_read_own_payments on payments;
create policy student_read_own_payments on payments
  for select using (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- PAYMENT_ALLOCATIONS
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on payment_allocations;
create policy teacher_all on payment_allocations
  for all using (is_teacher()) with check (is_teacher());

drop policy if exists student_read_own_allocations on payment_allocations;
create policy student_read_own_allocations on payment_allocations
  for select using (
    exists (
      select 1 from payments p
      where p.id = payment_allocations.payment_id
        and p.student_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- QUESTIONS — teacher full access; students have NO direct access
-- (Students receive questions only via get_attempt_questions RPC)
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on questions;
create policy teacher_all on questions
  for all using (is_teacher()) with check (is_teacher());

-- ─────────────────────────────────────────────────────────────────────
-- QUESTION_OPTIONS — teacher full access; students NO direct access
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on question_options;
create policy teacher_all on question_options
  for all using (is_teacher()) with check (is_teacher());

-- ─────────────────────────────────────────────────────────────────────
-- OPTION_KEYS — teacher only; ABSOLUTELY NO student access
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on option_keys;
create policy teacher_all on option_keys
  for all using (is_teacher()) with check (is_teacher());

-- ─────────────────────────────────────────────────────────────────────
-- QUESTION_KEYS — teacher only; ABSOLUTELY NO student access
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on question_keys;
create policy teacher_all on question_keys
  for all using (is_teacher()) with check (is_teacher());

-- ─────────────────────────────────────────────────────────────────────
-- EXAMS
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on exams;
create policy teacher_all on exams
  for all using (is_teacher()) with check (is_teacher());

-- Students: read published/closed exams for their enrolled classes only
drop policy if exists student_read_enrolled_exams on exams;
create policy student_read_enrolled_exams on exams
  for select using (
    status in ('published', 'closed') and
    exists (
      select 1 from enrollments e
      where e.class_id = exams.class_id
        and e.student_id = auth.uid()
        and e.left_on is null
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- EXAM_QUESTIONS — teacher only; students NO direct access
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on exam_questions;
create policy teacher_all on exam_questions
  for all using (is_teacher()) with check (is_teacher());

-- ─────────────────────────────────────────────────────────────────────
-- EXAM_ATTEMPTS
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on exam_attempts;
create policy teacher_all on exam_attempts
  for all using (is_teacher()) with check (is_teacher());

-- Students: read their own attempts only (no writes directly)
drop policy if exists student_read_own_attempts on exam_attempts;
create policy student_read_own_attempts on exam_attempts
  for select using (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- STUDENT_ANSWERS — no direct student write; via RPC only
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on student_answers;
create policy teacher_all on student_answers
  for all using (is_teacher()) with check (is_teacher());

-- Students: read only their own answers (after submission is fine for self-review)
drop policy if exists student_read_own_answers on student_answers;
create policy student_read_own_answers on student_answers
  for select using (
    exists (
      select 1 from exam_attempts ea
      where ea.id = student_answers.attempt_id
        and ea.student_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- EXAM_RESULTS
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on exam_results;
create policy teacher_all on exam_results
  for all using (is_teacher()) with check (is_teacher());

-- Students: read own results ONLY when published
drop policy if exists student_read_own_published_results on exam_results;
create policy student_read_own_published_results on exam_results
  for select using (
    student_id = auth.uid() and published_at is not null
  );

-- ─────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on notifications;
create policy teacher_all on notifications
  for all using (is_teacher()) with check (is_teacher());

-- Students: read own notifications
drop policy if exists student_read_own_notifications on notifications;
create policy student_read_own_notifications on notifications
  for select using (user_id = auth.uid());

-- Students: update own notifications (mark as read only)
drop policy if exists student_update_own_notifications on notifications;
create policy student_update_own_notifications on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- SETTINGS — teacher read/write; students read-only (currency, school_name)
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_all on settings;
create policy teacher_all on settings
  for all using (is_teacher()) with check (is_teacher());

-- Students: read settings (non-sensitive config like currency, school name)
drop policy if exists student_read_settings on settings;
create policy student_read_settings on settings
  for select using (true);

-- ─────────────────────────────────────────────────────────────────────
-- AUDIT_LOG — teacher read-only; no student access
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists teacher_read on audit_log;
create policy teacher_read on audit_log
  for select using (is_teacher());

-- Note: No insert policy on audit_log. Inserts happen only inside
-- SECURITY DEFINER functions that run as postgres superuser.
-- This prevents any user from injecting false audit entries.

