-- ============================================================
-- full_setup.sql  –  Auto-generated 2026-10-02 17:02
-- Run once in Supabase SQL Editor to set up the entire schema + seed.
-- ============================================================



-- ============================================================
-- supabase\migrations\0001_extensions_enums.sql
-- ============================================================
-- =====================================================================
-- 0001_extensions_enums.sql
-- Extensions and all application enum types
-- =====================================================================

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;           -- fast trigram text search
do $$ begin
  create extension if not exists pg_cron schema cron;
exception when others then
  null; -- skip if pg_cron is managed or not enabled on project
end $$;

-- ---------------------------------------------------------------------
-- Enum types (Idempotent)
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('teacher', 'student');
  end if;
  if not exists (select 1 from pg_type where typname = 'student_status') then
    create type student_status as enum ('active', 'inactive', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type attendance_status as enum ('present', 'absent', 'late', 'excused');
  end if;
  if not exists (select 1 from pg_type where typname = 'pay_method') then
    create type pay_method as enum ('cash', 'bank_transfer', 'mobile_wallet', 'card', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'charge_kind') then
    create type charge_kind as enum ('monthly', 'course', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'question_type') then
    create type question_type as enum ('mcq', 'true_false', 'short_answer', 'essay');
  end if;
  if not exists (select 1 from pg_type where typname = 'exam_status') then
    create type exam_status as enum ('draft', 'published', 'closed');
  end if;
  if not exists (select 1 from pg_type where typname = 'attempt_status') then
    create type attempt_status as enum ('in_progress', 'submitted', 'auto_submitted', 'graded');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_channel') then
    create type notification_channel as enum ('in_app', 'whatsapp', 'email', 'sms');
  end if;
end $$;


-- ============================================================
-- supabase\migrations\0002_identity.sql
-- ============================================================
-- =====================================================================
-- 0002_identity.sql
-- Core identity tables: profiles, students, student_notes
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- profiles: one row per auth.user (both teacher and students)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id                  uuid          primary key references auth.users(id) on delete cascade,
  role                user_role     not null,
  full_name           text          not null,
  locale              text          not null default 'en',
  avatar_url          text,                          -- signed URL cached; raw path stored in students.avatar_path
  must_change_password boolean      not null default false,
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now()
);
comment on table profiles is 'One row per auth.user. role is the authoritative source for authorization.';

-- trigger to keep updated_at current
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- is_teacher() — stable helper used in RLS policies
-- SECURITY DEFINER so it runs as the defining user (postgres), avoiding
-- infinite recursion in RLS on the profiles table itself.
-- ─────────────────────────────────────────────────────────────────────
create or replace function is_teacher()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────
-- student_code sequence
-- ─────────────────────────────────────────────────────────────────────
create sequence if not exists student_code_seq start 1001 increment 1;

-- ─────────────────────────────────────────────────────────────────────
-- students: extended data for student users
-- ─────────────────────────────────────────────────────────────────────
create table if not exists students (
  id            uuid          primary key references profiles(id) on delete restrict,
  student_code  text          not null unique
                              default ('S' || nextval('student_code_seq')::text),
  phone         text,
  parent_phone  text,
  email         text,                               -- optional real email (not the synthetic auth email)
  avatar_path   text,                               -- storage path in private avatars bucket
  enrolled_on   date          not null default current_date,
  status        student_status not null default 'active',
  created_at    timestamptz   not null default now(),
  archived_at   timestamptz
);
comment on column students.student_code is 'Human-readable login identifier, e.g. S1001';
comment on column students.email is 'Optional real contact email; NOT the Supabase Auth email';

create index if not exists students_status_idx      on students(status);
create index if not exists students_phone_idx       on students(phone) where phone is not null;
create index if not exists students_full_name_trgm  on profiles using gin (full_name gin_trgm_ops);
create index if not exists students_code_trgm       on students using gin (student_code gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────────────
-- student_notes: teacher-only private notes per student
-- ─────────────────────────────────────────────────────────────────────
create table if not exists student_notes (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references students(id) on delete cascade,
  note        text        not null,
  created_by  uuid        references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists student_notes_student_idx on student_notes(student_id, created_at desc);

drop trigger if exists student_notes_updated_at on student_notes;
create trigger student_notes_updated_at
  before update on student_notes
  for each row execute function update_updated_at();


-- ============================================================
-- supabase\migrations\0003_classes.sql
-- ============================================================
-- =====================================================================
-- 0003_classes.sql
-- Classes and enrollments
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- classes
-- ─────────────────────────────────────────────────────────────────────
create table if not exists classes (
  id          uuid      primary key default gen_random_uuid(),
  name        text      not null,
  subject     text,
  level       text,
  description text,
  -- optional weekly schedule: [{dow:1, start:"16:00", end:"17:30"}]
  -- dow: 0=Sunday ... 6=Saturday
  schedule    jsonb     not null default '[]'::jsonb,
  is_active   boolean   not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on column classes.schedule is 'Array of {dow, start, end} objects for optional weekly timetable display';

create index if not exists classes_active_idx on classes(is_active);

drop trigger if exists classes_updated_at on classes;
create trigger classes_updated_at
  before update on classes
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- enrollments: student ↔ class membership with optional fee override
-- ─────────────────────────────────────────────────────────────────────
create table if not exists enrollments (
  id           uuid        primary key default gen_random_uuid(),
  class_id     uuid        not null references classes(id) on delete restrict,
  student_id   uuid        not null references students(id) on delete cascade,
  enrolled_on  date        not null default current_date,
  left_on      date,                                -- null = still enrolled
  fee_override numeric(12,2) check (fee_override >= 0), -- null = use fee_structures
  notes        text,
  created_at   timestamptz not null default now(),
  unique (class_id, student_id)                    -- one enrollment record per student per class
);
comment on column enrollments.fee_override is 'Per-student fee override. NULL means use the class fee_structure.';

create index if not exists enrollments_student_idx on enrollments(student_id);
create index if not exists enrollments_class_active_idx on enrollments(class_id) where left_on is null;


-- ============================================================
-- supabase\migrations\0004_attendance.sql
-- ============================================================
-- =====================================================================
-- 0004_attendance.sql
-- Attendance tracking
-- =====================================================================

create table if not exists attendance (
  id          uuid              primary key default gen_random_uuid(),
  class_id    uuid              not null references classes(id) on delete cascade,
  student_id  uuid              not null references students(id) on delete cascade,
  date        date              not null,
  status      attendance_status not null,
  note        text,
  marked_by   uuid              references profiles(id),
  updated_at  timestamptz       not null default now(),
  created_at  timestamptz       not null default now(),
  -- Prevents duplicates: one attendance record per student per class per day
  unique (class_id, student_id, date)
);
comment on table attendance is 'One row per (class, student, date). Upsert via save_attendance RPC.';

create index if not exists attendance_student_date_idx  on attendance(student_id, date desc);
create index if not exists attendance_class_date_idx    on attendance(class_id, date);
create index if not exists attendance_date_idx          on attendance(date);

drop trigger if exists attendance_updated_at on attendance;
create trigger attendance_updated_at
  before update on attendance
  for each row execute function update_updated_at();


-- ============================================================
-- supabase\migrations\0005_finance.sql
-- ============================================================
-- =====================================================================
-- 0005_finance.sql
-- Fee structures, charges ledger, payments ledger, allocation mapping,
-- and the two authoritative balance views.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- receipt sequence — sequential across all years
-- ─────────────────────────────────────────────────────────────────────
create sequence if not exists receipt_seq start 1 increment 1;

-- ─────────────────────────────────────────────────────────────────────
-- fee_structures: what a class charges (teacher-defined)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists fee_structures (
  id           uuid        primary key default gen_random_uuid(),
  class_id     uuid        not null references classes(id) on delete cascade,
  name         text        not null,
  kind         charge_kind not null default 'monthly',
  amount       numeric(12,2) not null check (amount >= 0),
  active_from  date        not null default current_date,
  active_to    date,
  created_at   timestamptz not null default now()
);
comment on table fee_structures is 'Defines what students in a class are charged. active_to=NULL means still active.';

create index if not exists fee_structures_class_idx on fee_structures(class_id, active_from);

-- ─────────────────────────────────────────────────────────────────────
-- charges: what a student owes (the debit side of the ledger)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists charges (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references students(id) on delete restrict,
  class_id    uuid        references classes(id),
  kind        charge_kind not null,
  period      date,                                -- first day of month for monthly charges
  description text,
  amount      numeric(12,2) not null check (amount > 0),
  due_date    date        not null,
  voided_at   timestamptz,
  created_at  timestamptz not null default now()
);
comment on table charges is 'Append-only debit ledger. Void instead of deleting.';

-- Idempotent monthly charge: prevent duplicate charges for the same student/class/period
create unique index if not exists charges_monthly_uq on charges(student_id, class_id, period, kind)
  where kind = 'monthly' and voided_at is null;

create index if not exists charges_student_due_idx  on charges(student_id, due_date);
create index if not exists charges_student_idx      on charges(student_id) where voided_at is null;

-- ─────────────────────────────────────────────────────────────────────
-- payments: what the student paid (credit side of the ledger)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists payments (
  id           uuid        primary key default gen_random_uuid(),
  receipt_no   text        not null unique
                           default ('R-' || to_char(now(), 'YYYY') || '-' ||
                                    lpad(nextval('receipt_seq')::text, 6, '0')),
  student_id   uuid        not null references students(id) on delete restrict,
  amount       numeric(12,2) not null check (amount > 0),
  method       pay_method  not null,
  paid_at      timestamptz not null default now(),
  reference    text,                               -- bank ref, wallet TXN, etc.
  notes        text,
  recorded_by  uuid        references profiles(id),
  voided_at    timestamptz,
  void_reason  text,
  created_at   timestamptz not null default now()
);
comment on table payments is 'Append-only credit ledger. Void instead of deleting. voided payments are excluded from balances.';

create index if not exists payments_student_paid_idx on payments(student_id, paid_at desc);
create index if not exists payments_paid_at_idx      on payments(paid_at desc);
create index if not exists payments_receipt_idx      on payments(receipt_no);

-- ─────────────────────────────────────────────────────────────────────
-- payment_allocations: which payment pays which charge(s)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists payment_allocations (
  payment_id  uuid        not null references payments(id) on delete cascade,
  charge_id   uuid        not null references charges(id) on delete restrict,
  amount      numeric(12,2) not null check (amount > 0),
  primary key (payment_id, charge_id)
);
create index if not exists payment_allocations_charge_idx on payment_allocations(charge_id);

-- ─────────────────────────────────────────────────────────────────────
-- charge_status VIEW: balance per charge
-- security_invoker = true → runs as the calling user (RLS applies)
-- ─────────────────────────────────────────────────────────────────────
create or replace view charge_status with (security_invoker = true) as
select
  c.*,
  coalesce(
    sum(pa.amount) filter (where p.voided_at is null),
    0
  ) as paid,
  c.amount - coalesce(
    sum(pa.amount) filter (where p.voided_at is null),
    0
  ) as remaining
from charges c
left join payment_allocations pa on pa.charge_id = c.id
left join payments p              on p.id = pa.payment_id
where c.voided_at is null
group by c.id;

comment on view charge_status is 'Per-charge paid/remaining amounts. Excludes voided charges and voided payments.';

-- ─────────────────────────────────────────────────────────────────────
-- student_balances VIEW: aggregated balance per student
-- security_invoker = true → runs as the calling user (RLS applies)
-- ─────────────────────────────────────────────────────────────────────
create or replace view student_balances with (security_invoker = true) as
select
  student_id,
  sum(amount)                                          as total_charged,
  sum(paid)                                            as total_paid,
  sum(remaining)                                       as balance,
  sum(remaining) filter (where due_date < current_date) as overdue
from charge_status
group by student_id;

comment on view student_balances is 'Aggregated balance per student. All amounts computed in SQL — never in the browser.';


-- ============================================================
-- supabase\migrations\0006_exams.sql
-- ============================================================
-- =====================================================================
-- 0006_exams.sql
-- Question bank, exams, attempts, answers, results
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- questions: the question bank (teacher manages; students never read directly)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists questions (
  id            uuid          primary key default gen_random_uuid(),
  type          question_type not null,
  body          text          not null,
  explanation   text,                               -- shown to student in review
  default_marks numeric(6,2)  not null default 1 check (default_marks > 0),
  subject       text,
  tags          text[]        not null default '{}',
  is_locked     boolean       not null default false, -- true when used in a published exam
  created_by    uuid          references profiles(id),
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);
comment on column questions.is_locked is 'Set to true when the question is used in a published exam. Edit = clone.';

create index if not exists questions_subject_idx  on questions(subject) where subject is not null;
create index if not exists questions_type_idx     on questions(type);
create index if not exists questions_tags_idx     on questions using gin(tags);
create index if not exists questions_body_trgm    on questions using gin(body gin_trgm_ops);

drop trigger if exists questions_updated_at on questions;
create trigger questions_updated_at
  before update on questions
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- question_options: visible options for MCQ and True/False questions
-- ─────────────────────────────────────────────────────────────────────
create table if not exists question_options (
  id          uuid  primary key default gen_random_uuid(),
  question_id uuid  not null references questions(id) on delete cascade,
  body        text  not null,
  position    int   not null,
  created_at  timestamptz not null default now()
);
create index if not exists question_options_question_idx on question_options(question_id, position);

-- ─────────────────────────────────────────────────────────────────────
-- option_keys: HIDDEN — which option is correct (students have NO policy here)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists option_keys (
  option_id  uuid    primary key references question_options(id) on delete cascade,
  is_correct boolean not null
);
comment on table option_keys is 'HIDDEN from students. RLS: teacher-only. Stores correct option flags for MCQ/T-F.';

-- ─────────────────────────────────────────────────────────────────────
-- question_keys: HIDDEN — model answers for short_answer / essay
-- ─────────────────────────────────────────────────────────────────────
create table if not exists question_keys (
  question_id      uuid    primary key references questions(id) on delete cascade,
  accepted_answers text[], -- for short_answer auto-matching (case-insensitive)
  model_answer     text    -- for essay: rubric/model shown to teacher when grading
);
comment on table question_keys is 'HIDDEN from students. RLS: teacher-only. Model answers and accepted answer lists.';

-- ─────────────────────────────────────────────────────────────────────
-- exams
-- ─────────────────────────────────────────────────────────────────────
create table if not exists exams (
  id                 uuid        primary key default gen_random_uuid(),
  class_id           uuid        not null references classes(id),
  title              text        not null,
  description        text,
  instructions       text,
  duration_minutes   int         not null check (duration_minutes between 1 and 600),
  start_at           timestamptz not null,
  end_at             timestamptz not null,
  pass_marks         numeric(7,2) not null default 0 check (pass_marks >= 0),
  shuffle_questions  boolean     not null default false,
  shuffle_options    boolean     not null default false,
  status             exam_status not null default 'draft',
  results_published  boolean     not null default false,
  created_by         uuid        references profiles(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (end_at > start_at),
  check (pass_marks >= 0)
);

create index if not exists exams_class_status_idx    on exams(class_id, status, start_at);
create index if not exists exams_start_at_idx        on exams(start_at);

drop trigger if exists exams_updated_at on exams;
create trigger exams_updated_at
  before update on exams
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- exam_questions: questions assigned to an exam (with per-exam marks)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists exam_questions (
  exam_id     uuid        not null references exams(id) on delete cascade,
  question_id uuid        not null references questions(id),
  position    int         not null,
  marks       numeric(6,2) not null check (marks > 0),
  primary key (exam_id, question_id)
);
comment on table exam_questions is 'total_marks = sum(marks) — computed in SQL, never stored or sent from the client.';

create index if not exists exam_questions_exam_idx on exam_questions(exam_id, position);

-- ─────────────────────────────────────────────────────────────────────
-- exam_attempts: one attempt per student per exam (enforced by unique)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists exam_attempts (
  id           uuid           primary key default gen_random_uuid(),
  exam_id      uuid           not null references exams(id) on delete cascade,
  student_id   uuid           not null references students(id) on delete cascade,
  started_at   timestamptz    not null default now(),
  expires_at   timestamptz    not null,              -- set by server: least(started_at+duration, exam.end_at)
  submitted_at timestamptz,
  status       attempt_status not null default 'in_progress',
  shuffle_seed int            not null default (random() * 1000000)::int,
  created_at   timestamptz    not null default now(),
  unique (exam_id, student_id)                       -- ONE attempt per student per exam
);

create index if not exists exam_attempts_student_idx     on exam_attempts(student_id);
create index if not exists exam_attempts_exam_status_idx on exam_attempts(exam_id, status);
create index if not exists exam_attempts_expires_idx     on exam_attempts(expires_at) where status = 'in_progress';

-- ─────────────────────────────────────────────────────────────────────
-- student_answers: the student's submitted answers per question
-- ─────────────────────────────────────────────────────────────────────
create table if not exists student_answers (
  attempt_id         uuid        not null references exam_attempts(id) on delete cascade,
  question_id        uuid        not null references questions(id),
  selected_option_id uuid        references question_options(id),
  text_answer        text,
  marks_awarded      numeric(6,2),
  feedback           text,
  graded_by          uuid        references profiles(id),
  updated_at         timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

create index if not exists student_answers_attempt_idx on student_answers(attempt_id);

-- ─────────────────────────────────────────────────────────────────────
-- exam_results: computed result after submission / grading
-- ─────────────────────────────────────────────────────────────────────
create table if not exists exam_results (
  attempt_id     uuid        primary key references exam_attempts(id) on delete cascade,
  exam_id        uuid        not null references exams(id),
  student_id     uuid        not null references students(id),
  score          numeric(8,2) not null,
  total          numeric(8,2) not null,
  percentage     numeric(5,2) not null,
  passed         boolean     not null,
  fully_graded   boolean     not null default false,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists exam_results_student_idx on exam_results(student_id, published_at desc);
create index if not exists exam_results_exam_idx    on exam_results(exam_id);

drop trigger if exists exam_results_updated_at on exam_results;
create trigger exam_results_updated_at
  before update on exam_results
  for each row execute function update_updated_at();


-- ============================================================
-- supabase\migrations\0007_notifications.sql
-- ============================================================
-- =====================================================================
-- 0007_notifications.sql
-- Notifications, app settings, audit log
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- notifications: in-app notifications with outbox channel for future expansion
-- ─────────────────────────────────────────────────────────────────────
create table if not exists notifications (
  id         uuid                 primary key default gen_random_uuid(),
  user_id    uuid                 not null references profiles(id) on delete cascade,
  type       text                 not null,  -- e.g. 'exam_published', 'payment_reminder', 'results_published'
  title      text                 not null,
  body       text,
  link       text,                            -- deep link within the app
  read_at    timestamptz,
  channel    notification_channel not null default 'in_app',
  metadata   jsonb               not null default '{}'::jsonb,
  created_at timestamptz          not null default now()
);
comment on column notifications.channel is 'Outbox pattern: default in_app. WhatsApp/SMS can be added without schema changes.';

create index if not exists notifications_user_unread_idx on notifications(user_id, read_at, created_at desc);
create index if not exists notifications_user_created_idx on notifications(user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- settings: key/value store for app-wide configuration
-- ─────────────────────────────────────────────────────────────────────
create table if not exists settings (
  key        text  primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
comment on table settings is 'App-wide config: currency, school_name, logo_url, attention_thresholds, etc.';

-- Seed with defaults (will be overridden by seed.sql)
insert into settings (key, value) values
  ('school_name',          '"Amr Academy"'),
  ('currency',             '"EGP"'),
  ('timezone',             '"Africa/Cairo"'),
  ('attention_thresholds', '{"min_attendance_pct": 75, "consecutive_absences": 3}'),
  ('logo_url',             'null')
on conflict (key) do nothing;

-- ─────────────────────────────────────────────────────────────────────
-- audit_log: immutable append-only log of significant actions
-- ─────────────────────────────────────────────────────────────────────
create table if not exists audit_log (
  id         bigserial   primary key,
  actor      uuid        references profiles(id),
  action     text        not null,  -- e.g. 'payment.void', 'student.archive', 'grade.update'
  entity     text        not null,  -- table name
  entity_id  text        not null,  -- row id
  meta       jsonb       not null default '{}'::jsonb,
  at         timestamptz not null default now()
);
comment on table audit_log is 'Immutable audit trail. Never update or delete rows here.';

create index if not exists audit_log_entity_idx on audit_log(entity, entity_id);
create index if not exists audit_log_actor_idx  on audit_log(actor, at desc);
create index if not exists audit_log_at_idx     on audit_log(at desc);


-- ============================================================
-- supabase\migrations\0008_rls.sql
-- ============================================================
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



-- ============================================================
-- supabase\migrations\0009_functions.sql
-- ============================================================
-- =====================================================================
-- 0009_functions.sql
-- All Postgres RPC functions.
-- All are SECURITY DEFINER with explicit set search_path = public.
-- Each verifies the caller's role or ownership explicitly.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- HELPER: assert_teacher() — raises exception if caller is not teacher
-- ─────────────────────────────────────────────────────────────────────
create or replace function assert_teacher()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_teacher() then
    raise exception 'permission_denied: teacher role required'
      using errcode = 'P0001';
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- HELPER: assert_student_owns_attempt(attempt_id)
-- ─────────────────────────────────────────────────────────────────────
create or replace function assert_student_owns_attempt(p_attempt_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from exam_attempts ea
    where ea.id = p_attempt_id and ea.student_id = auth.uid()
  ) then
    raise exception 'permission_denied: attempt not found or not owned by caller'
      using errcode = 'P0001';
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- save_attendance(class_id, date, rows jsonb)
-- rows: [{"student_id": "uuid", "status": "present|absent|late|excused", "note": "..."}]
-- Teacher only. Atomic upsert.
-- ─────────────────────────────────────────────────────────────────────
create or replace function save_attendance(
  p_class_id uuid,
  p_date     date,
  p_rows     jsonb
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  r jsonb;
begin
  perform assert_teacher();

  for r in select * from jsonb_array_elements(p_rows)
  loop
    insert into attendance (class_id, student_id, date, status, note, marked_by)
    values (
      p_class_id,
      (r->>'student_id')::uuid,
      p_date,
      (r->>'status')::attendance_status,
      r->>'note',
      auth.uid()
    )
    on conflict (class_id, student_id, date) do update set
      status     = excluded.status,
      note       = excluded.note,
      marked_by  = excluded.marked_by,
      updated_at = now();
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- record_payment(student_id, amount, method, paid_at, reference, notes, allocations)
-- Teacher only. Single transaction: inserts payment, allocates to charges.
-- Auto-allocates oldest-due-first if allocations is null.
-- Rejects if amount > outstanding (unless allow_credit := true passed).
-- Returns the receipt data as jsonb.
-- ─────────────────────────────────────────────────────────────────────
create or replace function record_payment(
  p_student_id   uuid,
  p_amount       numeric,
  p_method       pay_method,
  p_paid_at      timestamptz default now(),
  p_reference    text        default null,
  p_notes        text        default null,
  p_allocations  jsonb       default null,  -- [{charge_id, amount}] or null for auto
  p_allow_credit boolean     default false
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_payment_id   uuid;
  v_receipt_no   text;
  v_outstanding  numeric;
  v_remaining    numeric;
  v_alloc        jsonb;
  v_charge_id    uuid;
  v_alloc_amount numeric;
  rec            record;
begin
  perform assert_teacher();

  -- Lock the student's open charges for this transaction
  perform 1 from charges
  where student_id = p_student_id and voided_at is null
  for update;

  -- Compute total outstanding
  select coalesce(sum(remaining), 0)
  into v_outstanding
  from charge_status
  where student_id = p_student_id;

  -- Reject overpayment unless credit is explicitly allowed
  if not p_allow_credit and p_amount > v_outstanding + 0.01 then
    raise exception 'overpayment: amount % exceeds outstanding %', p_amount, v_outstanding
      using errcode = 'P0002';
  end if;

  -- Insert payment
  insert into payments (student_id, amount, method, paid_at, reference, notes, recorded_by)
  values (p_student_id, p_amount, p_method, p_paid_at, p_reference, p_notes, auth.uid())
  returning id, receipt_no into v_payment_id, v_receipt_no;

  -- Allocate
  if p_allocations is not null then
    -- Use provided allocations
    for v_alloc in select * from jsonb_array_elements(p_allocations)
    loop
      v_charge_id    := (v_alloc->>'charge_id')::uuid;
      v_alloc_amount := (v_alloc->>'amount')::numeric;
      insert into payment_allocations (payment_id, charge_id, amount)
      values (v_payment_id, v_charge_id, v_alloc_amount);
    end loop;
  else
    -- Auto-allocate: oldest due_date first
    v_remaining := p_amount;
    for rec in
      select id, remaining from charge_status
      where student_id = p_student_id and remaining > 0
      order by due_date asc, created_at asc
    loop
      exit when v_remaining <= 0;
      v_alloc_amount := least(v_remaining, rec.remaining);
      insert into payment_allocations (payment_id, charge_id, amount)
      values (v_payment_id, rec.id, v_alloc_amount);
      v_remaining := v_remaining - v_alloc_amount;
    end loop;
  end if;

  -- Audit
  insert into audit_log (actor, action, entity, entity_id, meta)
  values (auth.uid(), 'payment.record', 'payments', v_payment_id::text,
    jsonb_build_object('student_id', p_student_id, 'amount', p_amount, 'method', p_method));

  return jsonb_build_object('payment_id', v_payment_id, 'receipt_no', v_receipt_no);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- void_payment(payment_id, reason)
-- Teacher only. Sets voided_at, writes audit_log.
-- ─────────────────────────────────────────────────────────────────────
create or replace function void_payment(
  p_payment_id uuid,
  p_reason     text
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_payment payments%rowtype;
begin
  perform assert_teacher();

  select * into v_payment from payments where id = p_payment_id for update;
  if not found then
    raise exception 'not_found: payment % does not exist', p_payment_id using errcode = 'P0004';
  end if;
  if v_payment.voided_at is not null then
    raise exception 'already_voided: payment % is already voided', p_payment_id using errcode = 'P0005';
  end if;

  update payments set voided_at = now(), void_reason = p_reason where id = p_payment_id;

  insert into audit_log (actor, action, entity, entity_id, meta)
  values (auth.uid(), 'payment.void', 'payments', p_payment_id::text,
    jsonb_build_object('reason', p_reason, 'amount', v_payment.amount, 'student_id', v_payment.student_id));
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- generate_monthly_charges(period)
-- Idempotent: safe to run multiple times for the same period.
-- period = first day of the target month.
-- Teacher only (or called from cron as postgres role).
-- ─────────────────────────────────────────────────────────────────────
create or replace function generate_monthly_charges(p_period date)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  rec         record;
  v_amount    numeric;
  v_count     int := 0;
  v_due_date  date;
begin
  -- Allow teacher or postgres (cron) to run this
  if auth.uid() is not null then
    perform assert_teacher();
  end if;

  v_due_date := p_period + interval '14 days'; -- due 14 days after period start

  for rec in
    select
      e.student_id,
      e.class_id,
      coalesce(e.fee_override,
        (select fs.amount
         from fee_structures fs
         where fs.class_id = e.class_id
           and fs.kind = 'monthly'
           and fs.active_from <= p_period
           and (fs.active_to is null or fs.active_to >= p_period)
         order by fs.active_from desc
         limit 1)
      ) as fee_amount
    from enrollments e
    join classes c on c.id = e.class_id
    where e.left_on is null or e.left_on >= p_period
      and c.is_active = true
  loop
    if rec.fee_amount is null or rec.fee_amount = 0 then
      continue;
    end if;

    -- Insert idempotently (unique index prevents duplicates)
    begin
      insert into charges (student_id, class_id, kind, period, description, amount, due_date)
      values (
        rec.student_id,
        rec.class_id,
        'monthly',
        p_period,
        'Monthly fee - ' || to_char(p_period, 'Mon YYYY'),
        rec.fee_amount,
        v_due_date
      );
      v_count := v_count + 1;
    exception when unique_violation then
      -- Already generated; skip
      null;
    end;
  end loop;

  return v_count;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- start_attempt(exam_id) — Student only
-- Verifies enrollment, published status, within window, no prior attempt.
-- Returns existing in-progress attempt if already started.
-- ─────────────────────────────────────────────────────────────────────
create or replace function start_attempt(p_exam_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_exam       exams%rowtype;
  v_attempt    exam_attempts%rowtype;
  v_expires_at timestamptz;
begin
  -- Must be a student
  if is_teacher() then
    raise exception 'permission_denied: students only' using errcode = 'P0001';
  end if;

  -- Load exam
  select * into v_exam from exams where id = p_exam_id;
  if not found then
    raise exception 'not_found: exam does not exist' using errcode = 'P0004';
  end if;

  -- Must be published
  if v_exam.status <> 'published' then
    raise exception 'exam_not_available: exam is not published' using errcode = 'P0006';
  end if;

  -- Must be within the exam window
  if now() < v_exam.start_at then
    raise exception 'exam_not_started: exam has not started yet' using errcode = 'P0007';
  end if;
  if now() > v_exam.end_at then
    raise exception 'exam_ended: exam window has closed' using errcode = 'P0008';
  end if;

  -- Must be enrolled in the class
  if not exists (
    select 1 from enrollments e
    where e.class_id = v_exam.class_id
      and e.student_id = v_student_id
      and e.left_on is null
  ) then
    raise exception 'not_enrolled: student is not enrolled in this class' using errcode = 'P0009';
  end if;

  -- Return existing in-progress attempt (resume after reload)
  select * into v_attempt
  from exam_attempts
  where exam_id = p_exam_id and student_id = v_student_id;

  if found then
    if v_attempt.status = 'in_progress' then
      return jsonb_build_object(
        'attempt_id', v_attempt.id,
        'expires_at', v_attempt.expires_at,
        'status', v_attempt.status,
        'resumed', true
      );
    else
      raise exception 'attempt_already_submitted: this exam has already been submitted' using errcode = 'P0010';
    end if;
  end if;

  -- Compute expires_at: server-enforced
  v_expires_at := least(
    now() + (v_exam.duration_minutes || ' minutes')::interval,
    v_exam.end_at
  );

  -- Create the attempt
  insert into exam_attempts (exam_id, student_id, expires_at)
  values (p_exam_id, v_student_id, v_expires_at)
  returning * into v_attempt;

  return jsonb_build_object(
    'attempt_id', v_attempt.id,
    'expires_at', v_attempt.expires_at,
    'status', v_attempt.status,
    'resumed', false
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- get_attempt_questions(attempt_id)
-- Returns questions + options WITHOUT answer keys.
-- Owner + in_progress/submitted only.
-- Handles shuffle_questions and shuffle_options per shuffle_seed.
-- ─────────────────────────────────────────────────────────────────────
create or replace function get_attempt_questions(p_attempt_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt exam_attempts%rowtype;
  v_exam    exams%rowtype;
begin
  -- Load attempt and verify ownership
  select * into v_attempt from exam_attempts where id = p_attempt_id;
  if not found then
    raise exception 'not_found: attempt does not exist' using errcode = 'P0004';
  end if;

  if v_attempt.student_id <> auth.uid() and not is_teacher() then
    raise exception 'permission_denied' using errcode = 'P0001';
  end if;

  if v_attempt.status not in ('in_progress', 'submitted', 'auto_submitted', 'graded') then
    raise exception 'attempt_not_accessible' using errcode = 'P0011';
  end if;

  -- Load exam config
  select * into v_exam from exams where id = v_attempt.exam_id;

  -- Build questions JSON (no answer keys)
  return (
    select jsonb_agg(
      jsonb_build_object(
        'question_id',  q.id,
        'position',     eq.position,
        'marks',        eq.marks,
        'type',         q.type,
        'body',         q.body,
        'options',      (
          select jsonb_agg(
            jsonb_build_object(
              'id',       qo.id,
              'body',     qo.body,
              'position', qo.position
            )
            order by
              case when v_exam.shuffle_options
                then (hashtext(qo.id::text || v_attempt.shuffle_seed::text) & 2147483647)
                else qo.position
              end
          )
          from question_options qo
          where qo.question_id = q.id
        ),
        'selected_option_id', sa.selected_option_id,
        'text_answer',        sa.text_answer
      )
      order by
        case when v_exam.shuffle_questions
          then (hashtext(q.id::text || v_attempt.shuffle_seed::text) & 2147483647)
          else eq.position
        end
    )
    from exam_questions eq
    join questions q on q.id = eq.question_id
    left join student_answers sa
      on sa.attempt_id = p_attempt_id and sa.question_id = q.id
    where eq.exam_id = v_attempt.exam_id
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- save_answers(attempt_id, answers jsonb)
-- answers: [{"question_id": "uuid", "selected_option_id": "uuid|null", "text_answer": "..."}]
-- Owner only; rejects if past expires_at (+5s grace) or status ≠ in_progress.
-- ─────────────────────────────────────────────────────────────────────
create or replace function save_answers(
  p_attempt_id uuid,
  p_answers    jsonb
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt exam_attempts%rowtype;
  a         jsonb;
begin
  select * into v_attempt from exam_attempts where id = p_attempt_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0004';
  end if;

  -- Ownership check
  if v_attempt.student_id <> auth.uid() then
    raise exception 'permission_denied' using errcode = 'P0001';
  end if;

  -- Status check
  if v_attempt.status <> 'in_progress' then
    raise exception 'attempt_not_in_progress: cannot save answers after submission' using errcode = 'P0012';
  end if;

  -- Time check with 5-second grace period
  if now() > v_attempt.expires_at + interval '5 seconds' then
    raise exception 'attempt_expired: time limit exceeded' using errcode = 'P0013';
  end if;

  -- Batch upsert answers
  for a in select * from jsonb_array_elements(p_answers)
  loop
    insert into student_answers (attempt_id, question_id, selected_option_id, text_answer, updated_at)
    values (
      p_attempt_id,
      (a->>'question_id')::uuid,
      case when a->>'selected_option_id' is null or a->>'selected_option_id' = 'null'
           then null
           else (a->>'selected_option_id')::uuid
      end,
      a->>'text_answer',
      now()
    )
    on conflict (attempt_id, question_id) do update set
      selected_option_id = excluded.selected_option_id,
      text_answer        = excluded.text_answer,
      updated_at         = now();
  end loop;

  return jsonb_build_object(
    'saved',      jsonb_array_length(p_answers),
    'expires_at', v_attempt.expires_at,
    'server_time', now()
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- HELPER: compute_and_save_result(attempt_id)
-- Internal: auto-grades MCQ/T-F/short_answer, writes exam_results.
-- ─────────────────────────────────────────────────────────────────────
create or replace function compute_and_save_result(p_attempt_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt       exam_attempts%rowtype;
  v_exam          exams%rowtype;
  v_total_marks   numeric := 0;
  v_scored        numeric := 0;
  v_has_manual    boolean := false;
  v_fully_graded  boolean;
  rec             record;
  v_correct       boolean;
  v_max_marks     numeric;
  v_awarded       numeric;
begin
  select * into v_attempt from exam_attempts where id = p_attempt_id;
  select * into v_exam    from exams          where id = v_attempt.exam_id;

  for rec in
    select
      eq.marks,
      q.type,
      sa.attempt_id,
      sa.question_id,
      sa.selected_option_id,
      sa.text_answer,
      sa.marks_awarded
    from exam_questions eq
    join questions q on q.id = eq.question_id
    left join student_answers sa
      on sa.attempt_id = p_attempt_id and sa.question_id = q.id
    where eq.exam_id = v_attempt.exam_id
  loop
    v_max_marks   := rec.marks;
    v_total_marks := v_total_marks + v_max_marks;

    if rec.type in ('mcq', 'true_false') then
      -- Auto-grade: check if selected option is correct
      if rec.selected_option_id is not null then
        select is_correct into v_correct
        from option_keys where option_id = rec.selected_option_id;
        v_awarded := case when v_correct then v_max_marks else 0 end;
      else
        v_awarded := 0;
      end if;

      -- Upsert answer with awarded marks
      insert into student_answers (attempt_id, question_id, selected_option_id, marks_awarded, updated_at)
      values (p_attempt_id, rec.question_id, rec.selected_option_id, v_awarded, now())
      on conflict (attempt_id, question_id) do update set
        marks_awarded = excluded.marks_awarded,
        updated_at    = now();

      v_scored := v_scored + v_awarded;

    elsif rec.type = 'short_answer' then
      -- Try auto-match against accepted_answers
      declare
        v_accepted text[];
        v_matched  boolean := false;
      begin
        select accepted_answers into v_accepted
        from question_keys where question_id = rec.question_id;

        if v_accepted is not null and array_length(v_accepted, 1) > 0
           and rec.text_answer is not null then
          select exists (
            select 1 from unnest(v_accepted) aa
            where lower(trim(aa)) = lower(trim(rec.text_answer))
          ) into v_matched;

          if v_matched then
            v_awarded := v_max_marks;
            insert into student_answers (attempt_id, question_id, text_answer, marks_awarded, updated_at)
            values (p_attempt_id, rec.question_id, rec.text_answer, v_awarded, now())
            on conflict (attempt_id, question_id) do update set
              marks_awarded = excluded.marks_awarded,
              updated_at    = now();
            v_scored := v_scored + v_awarded;
          else
            v_has_manual := true; -- needs teacher grading
          end if;
        else
          v_has_manual := true; -- no accepted answers configured
        end if;
      end;

    else
      -- essay: always manual
      if rec.marks_awarded is not null then
        v_scored := v_scored + rec.marks_awarded;
      else
        v_has_manual := true;
      end if;
    end if;
  end loop;

  v_fully_graded := not v_has_manual;

  insert into exam_results (attempt_id, exam_id, student_id, score, total, percentage, passed, fully_graded)
  values (
    p_attempt_id,
    v_attempt.exam_id,
    v_attempt.student_id,
    v_scored,
    v_total_marks,
    case when v_total_marks > 0 then round((v_scored / v_total_marks) * 100, 2) else 0 end,
    v_scored >= v_exam.pass_marks,
    v_fully_graded
  )
  on conflict (attempt_id) do update set
    score        = excluded.score,
    total        = excluded.total,
    percentage   = excluded.percentage,
    passed       = excluded.passed,
    fully_graded = excluded.fully_graded,
    updated_at   = now();
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- submit_attempt(attempt_id)
-- Idempotent. Locks attempt row. Sets submitted/auto_submitted.
-- Auto-grades MCQ/TF. Writes exam_results.
-- ─────────────────────────────────────────────────────────────────────
create or replace function submit_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt exam_attempts%rowtype;
  v_status  attempt_status;
begin
  select * into v_attempt from exam_attempts where id = p_attempt_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0004';
  end if;

  -- Ownership: student owns it, or teacher is force-submitting, or cron (no auth.uid)
  if auth.uid() is not null
     and v_attempt.student_id <> auth.uid()
     and not is_teacher() then
    raise exception 'permission_denied' using errcode = 'P0001';
  end if;

  -- Idempotent: already submitted
  if v_attempt.status not in ('in_progress') then
    return jsonb_build_object('attempt_id', p_attempt_id, 'status', v_attempt.status, 'already_submitted', true);
  end if;

  -- Determine submission type
  v_status := case when now() > v_attempt.expires_at then 'auto_submitted'::attempt_status
                   else 'submitted'::attempt_status
              end;

  update exam_attempts
  set status       = v_status,
      submitted_at = now()
  where id = p_attempt_id;

  -- Grade auto-gradeable questions and write result
  perform compute_and_save_result(p_attempt_id);

  return jsonb_build_object(
    'attempt_id', p_attempt_id,
    'status',     v_status,
    'submitted_at', now()
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- sweep_expired_attempts()
-- Called by pg_cron every minute.
-- Auto-submits any in_progress attempts that have passed expires_at.
-- ─────────────────────────────────────────────────────────────────────
create or replace function sweep_expired_attempts()
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_count int := 0;
  rec     record;
begin
  for rec in
    select id from exam_attempts
    where status = 'in_progress' and expires_at < now()
  loop
    perform submit_attempt(rec.id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- grade_answer(attempt_id, question_id, marks, feedback)
-- Teacher only. Caps at question max marks. Recomputes result.
-- ─────────────────────────────────────────────────────────────────────
create or replace function grade_answer(
  p_attempt_id  uuid,
  p_question_id uuid,
  p_marks       numeric,
  p_feedback    text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_max_marks numeric;
begin
  perform assert_teacher();

  -- Get max marks for this question in this exam
  select eq.marks into v_max_marks
  from exam_attempts ea
  join exam_questions eq on eq.exam_id = ea.exam_id and eq.question_id = p_question_id
  where ea.id = p_attempt_id;

  if not found then
    raise exception 'not_found: question not in this exam' using errcode = 'P0004';
  end if;

  if p_marks < 0 or p_marks > v_max_marks then
    raise exception 'invalid_marks: marks must be between 0 and %', v_max_marks using errcode = 'P0014';
  end if;

  update student_answers set
    marks_awarded = p_marks,
    feedback      = p_feedback,
    graded_by     = auth.uid(),
    updated_at    = now()
  where attempt_id = p_attempt_id and question_id = p_question_id;

  -- Recompute overall result
  perform compute_and_save_result(p_attempt_id);

  insert into audit_log (actor, action, entity, entity_id, meta)
  values (auth.uid(), 'grade.update', 'student_answers',
          p_attempt_id::text || '/' || p_question_id::text,
          jsonb_build_object('marks', p_marks, 'max', v_max_marks));
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- publish_results(exam_id)
-- Teacher only. Sets published_at on all fully-graded results.
-- Creates in-app notifications for each affected student.
-- ─────────────────────────────────────────────────────────────────────
create or replace function publish_results(p_exam_id uuid)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_exam  exams%rowtype;
  rec     record;
  v_count int := 0;
begin
  perform assert_teacher();

  select * into v_exam from exams where id = p_exam_id;

  update exams set results_published = true, updated_at = now() where id = p_exam_id;

  for rec in
    select er.attempt_id, er.student_id, er.score, er.total, er.percentage, er.passed
    from exam_results er
    where er.exam_id = p_exam_id and er.published_at is null
  loop
    update exam_results set published_at = now(), updated_at = now()
    where attempt_id = rec.attempt_id;

    insert into notifications (user_id, type, title, body, link)
    values (
      rec.student_id,
      'results_published',
      'Results Published: ' || v_exam.title,
      'Your result: ' || rec.score || '/' || rec.total || ' (' || rec.percentage || '%) — ' ||
        case when rec.passed then 'Passed ✓' else 'Not Passed' end,
      '/portal/exams/' || p_exam_id || '/result'
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- get_exam_review(attempt_id)
-- Returns questions with correct answers and feedback.
-- Only allowed if: exam.status='closed' OR exam.results_published=true.
-- Owner (student) or teacher.
-- ─────────────────────────────────────────────────────────────────────
create or replace function get_exam_review(p_attempt_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt exam_attempts%rowtype;
  v_exam    exams%rowtype;
begin
  select * into v_attempt from exam_attempts where id = p_attempt_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0004';
  end if;

  -- Ownership check
  if v_attempt.student_id <> auth.uid() and not is_teacher() then
    raise exception 'permission_denied' using errcode = 'P0001';
  end if;

  select * into v_exam from exams where id = v_attempt.exam_id;

  -- Gate: must be closed or results published
  if not is_teacher() then
    if v_exam.status <> 'closed' and not v_exam.results_published then
      raise exception 'review_not_available: results have not been published yet' using errcode = 'P0015';
    end if;
    -- Also check that this student's result is published
    if not exists (
      select 1 from exam_results er
      where er.attempt_id = p_attempt_id and er.published_at is not null
    ) then
      raise exception 'review_not_available: your result has not been published yet' using errcode = 'P0015';
    end if;
  end if;

  return (
    select jsonb_agg(
      jsonb_build_object(
        'question_id',         q.id,
        'type',                q.type,
        'body',                q.body,
        'explanation',         q.explanation,
        'marks',               eq.marks,
        'marks_awarded',       sa.marks_awarded,
        'feedback',            sa.feedback,
        'selected_option_id',  sa.selected_option_id,
        'text_answer',         sa.text_answer,
        'options', (
          select jsonb_agg(
            jsonb_build_object(
              'id',         qo.id,
              'body',       qo.body,
              'position',   qo.position,
              'is_correct', ok.is_correct
            ) order by qo.position
          )
          from question_options qo
          left join option_keys ok on ok.option_id = qo.id
          where qo.question_id = q.id
        ),
        'model_answer', (select qk.model_answer from question_keys qk where qk.question_id = q.id)
      )
      order by eq.position
    )
    from exam_questions eq
    join questions q on q.id = eq.question_id
    left join student_answers sa on sa.attempt_id = p_attempt_id and sa.question_id = q.id
    where eq.exam_id = v_attempt.exam_id
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- dashboard_summary(from_date, to_date, class_id)
-- Teacher only. Returns dashboard card metrics.
-- ─────────────────────────────────────────────────────────────────────
create or replace function dashboard_summary(
  p_from     date default (current_date - interval '30 days')::date,
  p_to       date default current_date,
  p_class_id uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_total_students    int;
  v_active_students   int;
  v_total_classes     int;
  v_today_present     int;
  v_today_total       int;
  v_today_absent      int;
  v_total_revenue     numeric;
  v_this_month        numeric;
  v_pending           numeric;
  v_upcoming_exams    int;
begin
  perform assert_teacher();

  select count(*) into v_total_students  from students;
  select count(*) into v_active_students from students where status = 'active';
  select count(*) into v_total_classes   from classes where is_active = true;

  -- Today's attendance
  select
    count(*) filter (where a.status in ('present','late')),
    count(*),
    count(*) filter (where a.status = 'absent')
  into v_today_present, v_today_total, v_today_absent
  from attendance a
  where a.date = current_date
    and (p_class_id is null or a.class_id = p_class_id);

  -- Finance
  select
    coalesce(sum(p.amount) filter (where p.voided_at is null and p.paid_at::date between p_from and p_to), 0),
    coalesce(sum(p.amount) filter (where p.voided_at is null
      and date_trunc('month', p.paid_at) = date_trunc('month', current_date)), 0)
  into v_total_revenue, v_this_month
  from payments p;

  select coalesce(sum(sb.balance), 0) into v_pending from student_balances sb;

  -- Upcoming exams (next 7 days)
  select count(*) into v_upcoming_exams
  from exams e
  where e.status = 'published'
    and e.start_at between now() and now() + interval '7 days'
    and (p_class_id is null or e.class_id = p_class_id);

  return jsonb_build_object(
    'total_students',   v_total_students,
    'active_students',  v_active_students,
    'total_classes',    v_total_classes,
    'today_attendance_pct', case when v_today_total > 0
                              then round((v_today_present::numeric / v_today_total) * 100, 1)
                              else null end,
    'today_absences',   v_today_absent,
    'total_revenue',    v_total_revenue,
    'collected_this_month', v_this_month,
    'pending_balance',  v_pending,
    'upcoming_exams',   v_upcoming_exams
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- chart_student_growth() — monthly student registration counts
-- ─────────────────────────────────────────────────────────────────────
create or replace function chart_student_growth(p_months int default 12)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  perform assert_teacher();
  return (
    select jsonb_agg(row_to_json(t) order by t.month)
    from (
      select
        to_char(date_trunc('month', p.created_at), 'YYYY-MM') as month,
        count(*) as count
      from profiles p
      where p.role = 'student'
        and p.created_at >= now() - (p_months || ' months')::interval
      group by date_trunc('month', p.created_at)
    ) t
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- chart_monthly_revenue() — monthly collected payments
-- ─────────────────────────────────────────────────────────────────────
create or replace function chart_monthly_revenue(p_months int default 12)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  perform assert_teacher();
  return (
    select jsonb_agg(row_to_json(t) order by t.month)
    from (
      select
        to_char(date_trunc('month', paid_at), 'YYYY-MM') as month,
        sum(amount) as total
      from payments
      where voided_at is null
        and paid_at >= now() - (p_months || ' months')::interval
      group by date_trunc('month', paid_at)
    ) t
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- chart_weekly_attendance() — weekly attendance breakdown
-- ─────────────────────────────────────────────────────────────────────
create or replace function chart_weekly_attendance(
  p_weeks    int  default 8,
  p_class_id uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  perform assert_teacher();
  return (
    select jsonb_agg(row_to_json(t) order by t.week)
    from (
      select
        to_char(date_trunc('week', date), 'YYYY-MM-DD') as week,
        count(*) filter (where status = 'present')  as present,
        count(*) filter (where status = 'absent')   as absent,
        count(*) filter (where status = 'late')     as late,
        count(*) filter (where status = 'excused')  as excused
      from attendance
      where date >= (current_date - (p_weeks * 7 || ' days')::interval)::date
        and (p_class_id is null or class_id = p_class_id)
      group by date_trunc('week', date)
    ) t
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- chart_exam_performance() — average score per class
-- ─────────────────────────────────────────────────────────────────────
create or replace function chart_exam_performance(p_class_id uuid default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  perform assert_teacher();
  return (
    select jsonb_agg(row_to_json(t))
    from (
      select
        c.name  as class_name,
        e.title as exam_title,
        round(avg(er.percentage), 1) as avg_pct,
        min(er.percentage)  as min_pct,
        max(er.percentage)  as max_pct,
        count(er.attempt_id) as attempt_count
      from exam_results er
      join exam_attempts ea on ea.id = er.attempt_id
      join exams e  on e.id = er.exam_id
      join classes c on c.id = e.class_id
      where (p_class_id is null or e.class_id = p_class_id)
        and er.published_at is not null
      group by c.name, e.id, e.title
      order by e.created_at desc
    ) t
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- students_needing_attention()
-- Teacher only. Returns students below thresholds from settings.
-- ─────────────────────────────────────────────────────────────────────
create or replace function students_needing_attention()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_thresholds jsonb;
  v_min_att    numeric;
  v_consec_abs int;
begin
  perform assert_teacher();

  select value into v_thresholds from settings where key = 'attention_thresholds';
  v_min_att    := coalesce((v_thresholds->>'min_attendance_pct')::numeric, 75);
  v_consec_abs := coalesce((v_thresholds->>'consecutive_absences')::int, 3);

  return (
    select jsonb_agg(row_to_json(t))
    from (
      select distinct
        s.id,
        p.full_name,
        s.student_code,
        array_agg(distinct reason) as reasons
      from students s
      join profiles p on p.id = s.id
      cross join lateral (
        select 'low_attendance' as reason
        where (
          select case
            when total_non_excused = 0 then null
            else round((present_count::numeric / total_non_excused) * 100, 1)
          end
          from (
            select
              count(*) filter (where a.status in ('present','late')) as present_count,
              count(*) filter (where a.status != 'excused') as total_non_excused
            from attendance a
            where a.student_id = s.id
              and a.date >= current_date - interval '30 days'
          ) att_sub
        ) < v_min_att
        union all
        select 'overdue_balance' as reason
        where (
          select balance from student_balances sb where sb.student_id = s.id
        ) > 0
          and (
          select overdue from student_balances sb where sb.student_id = s.id
        ) > 0
      ) reasons_lateral(reason)
      where s.status = 'active'
      group by s.id, p.full_name, s.student_code
    ) t
  );
end;
$$;


-- ============================================================
-- supabase\migrations\0010_cron.sql
-- ============================================================
-- =====================================================================
-- 0010_cron.sql
-- pg_cron scheduled jobs.
-- Requires pg_cron extension (enabled in 0001).
-- Run AFTER the extension is available.
-- =====================================================================

-- Sweep expired exam attempts every minute & monthly charges & reminders
do $cron$
begin
  begin perform cron.unschedule('sweep-expired-attempts'); exception when others then null; end;
  perform cron.schedule('sweep-expired-attempts', '* * * * *', 'select sweep_expired_attempts()');

  begin perform cron.unschedule('generate-monthly-charges'); exception when others then null; end;
  perform cron.schedule('generate-monthly-charges', '5 22 28-31 * *', $cmd$
    select generate_monthly_charges(date_trunc('month', current_date + interval '1 day')::date)
    where extract(day from current_date + interval '1 day') = 1;
  $cmd$);

  begin perform cron.unschedule('exam-reminders'); exception when others then null; end;
  perform cron.schedule('exam-reminders', '0 * * * *', $cmd$
    insert into notifications (user_id, type, title, body, link)
    select
      e2.student_id,
      'exam_reminder',
      'Upcoming Exam: ' || ex.title,
      'Your exam starts in less than 24 hours. Prepare yourself!',
      '/portal/exams/' || ex.id
    from exams ex
    join (
      select e.student_id, e.class_id
      from enrollments e
      where e.left_on is null
    ) e2 on e2.class_id = ex.class_id
    where ex.status = 'published'
      and ex.start_at between now() + interval '23 hours' and now() + interval '25 hours'
      and not exists (
        select 1 from notifications n
        where n.user_id = e2.student_id
          and n.type = 'exam_reminder'
          and n.metadata->>'exam_id' = ex.id::text
          and n.created_at > now() - interval '12 hours'
      );
  $cmd$);
exception when others then
  null; -- skip gracefully if pg_cron is managed or not enabled
end $cron$;


-- ============================================================
-- supabase\seed.sql
-- ============================================================
-- =====================================================================
-- seed.sql
-- Development seed data: 1 teacher, 3 classes, 30 students.
-- 100% Idempotent – safe to re-run any number of times.
-- Strategy: DELETE existing test users first (bypasses email conflict),
--           then INSERT fresh with deterministic UUIDs.
-- =====================================================================

do $$
declare
  v_teacher_id    uuid := '00000000-0000-0000-0000-000000000001';
  v_class_math    uuid := '00000000-0000-0000-0000-000000000101';
  v_class_phys    uuid := '00000000-0000-0000-0000-000000000102';
  v_class_chem    uuid := '00000000-0000-0000-0000-000000000103';

  v_students uuid[] := array[
    '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000009'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000013'::uuid,
    '00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0000-000000000015'::uuid,
    '00000000-0000-0000-0000-000000000016'::uuid, '00000000-0000-0000-0000-000000000017'::uuid,
    '00000000-0000-0000-0000-000000000018'::uuid, '00000000-0000-0000-0000-000000000019'::uuid,
    '00000000-0000-0000-0000-000000000020'::uuid, '00000000-0000-0000-0000-000000000021'::uuid,
    '00000000-0000-0000-0000-000000000022'::uuid, '00000000-0000-0000-0000-000000000023'::uuid,
    '00000000-0000-0000-0000-000000000024'::uuid, '00000000-0000-0000-0000-000000000025'::uuid,
    '00000000-0000-0000-0000-000000000026'::uuid, '00000000-0000-0000-0000-000000000027'::uuid,
    '00000000-0000-0000-0000-000000000028'::uuid, '00000000-0000-0000-0000-000000000029'::uuid,
    '00000000-0000-0000-0000-000000000030'::uuid, '00000000-0000-0000-0000-000000000031'::uuid
  ];

  v_names text[] := array[
    'Ahmed Hassan', 'Fatima Ali', 'Mohamed Ibrahim', 'Nour El-Din', 'Sara Mahmoud',
    'Omar Khalid', 'Layla Ahmed', 'Youssef Sami', 'Rana Tarek', 'Kareem Nasser',
    'Dina Fouad', 'Bassem Mostafa', 'Mona Adel', 'Tamer Riad', 'Hana Walid',
    'Adam Sherif', 'Reem Gamal', 'Khaled Osama', 'Salma Hazem', 'Ziad Fathy',
    'Noha Atef', 'Amr Samir', 'Mariam Ehab', 'Hassan Wael', 'Nadia Karim',
    'Sherif Amin', 'Aliaa Hossam', 'Mahmoud Saad', 'Yasmin Reda', 'Tarek Lotfy'
  ];

  i int;
  v_sid uuid;
  v_name text;
  v_code text;
  v_phone text;
  v_enrolled_on date;
  v_auth_ok boolean;

begin

  -- ─────────────────────────────────────────────────────────────────
  -- Step 1: Wipe ALL prior seed data to avoid any constraint conflicts.
  -- Order: attendance/charges/payments first (FK children), then parents.
  -- ─────────────────────────────────────────────────────────────────
  begin
    -- Remove attendance for seed students
    delete from attendance
    where student_id = any(array[
      '00000000-0000-0000-0000-000000000002'::uuid,
      '00000000-0000-0000-0000-000000000003'::uuid,
      '00000000-0000-0000-0000-000000000004'::uuid,
      '00000000-0000-0000-0000-000000000005'::uuid,
      '00000000-0000-0000-0000-000000000006'::uuid,
      '00000000-0000-0000-0000-000000000007'::uuid,
      '00000000-0000-0000-0000-000000000008'::uuid,
      '00000000-0000-0000-0000-000000000009'::uuid,
      '00000000-0000-0000-0000-000000000010'::uuid,
      '00000000-0000-0000-0000-000000000011'::uuid,
      '00000000-0000-0000-0000-000000000012'::uuid,
      '00000000-0000-0000-0000-000000000013'::uuid,
      '00000000-0000-0000-0000-000000000014'::uuid,
      '00000000-0000-0000-0000-000000000015'::uuid,
      '00000000-0000-0000-0000-000000000016'::uuid,
      '00000000-0000-0000-0000-000000000017'::uuid,
      '00000000-0000-0000-0000-000000000018'::uuid,
      '00000000-0000-0000-0000-000000000019'::uuid,
      '00000000-0000-0000-0000-000000000020'::uuid,
      '00000000-0000-0000-0000-000000000021'::uuid,
      '00000000-0000-0000-0000-000000000022'::uuid,
      '00000000-0000-0000-0000-000000000023'::uuid,
      '00000000-0000-0000-0000-000000000024'::uuid,
      '00000000-0000-0000-0000-000000000025'::uuid,
      '00000000-0000-0000-0000-000000000026'::uuid,
      '00000000-0000-0000-0000-000000000027'::uuid,
      '00000000-0000-0000-0000-000000000028'::uuid,
      '00000000-0000-0000-0000-000000000029'::uuid,
      '00000000-0000-0000-0000-000000000030'::uuid,
      '00000000-0000-0000-0000-000000000031'::uuid
    ]);
  exception when others then null;
  end;

  begin
    delete from payment_allocations
    where payment_id in (
      select id from payments where student_id = any(array[
        '00000000-0000-0000-0000-000000000002'::uuid,
        '00000000-0000-0000-0000-000000000003'::uuid,
        '00000000-0000-0000-0000-000000000004'::uuid,
        '00000000-0000-0000-0000-000000000005'::uuid,
        '00000000-0000-0000-0000-000000000006'::uuid,
        '00000000-0000-0000-0000-000000000007'::uuid,
        '00000000-0000-0000-0000-000000000008'::uuid,
        '00000000-0000-0000-0000-000000000009'::uuid,
        '00000000-0000-0000-0000-000000000010'::uuid,
        '00000000-0000-0000-0000-000000000011'::uuid
      ])
    );
  exception when others then null;
  end;

  begin
    delete from payments where student_id = any(array[
      '00000000-0000-0000-0000-000000000002'::uuid,
      '00000000-0000-0000-0000-000000000003'::uuid,
      '00000000-0000-0000-0000-000000000004'::uuid,
      '00000000-0000-0000-0000-000000000005'::uuid,
      '00000000-0000-0000-0000-000000000006'::uuid,
      '00000000-0000-0000-0000-000000000007'::uuid,
      '00000000-0000-0000-0000-000000000008'::uuid,
      '00000000-0000-0000-0000-000000000009'::uuid,
      '00000000-0000-0000-0000-000000000010'::uuid,
      '00000000-0000-0000-0000-000000000011'::uuid
    ]);
  exception when others then null;
  end;

  begin
    delete from charges where student_id = any(array[
      '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000003'::uuid,
      '00000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000005'::uuid,
      '00000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000007'::uuid,
      '00000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000009'::uuid,
      '00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000011'::uuid,
      '00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000013'::uuid,
      '00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0000-000000000015'::uuid,
      '00000000-0000-0000-0000-000000000016'::uuid, '00000000-0000-0000-0000-000000000017'::uuid,
      '00000000-0000-0000-0000-000000000018'::uuid, '00000000-0000-0000-0000-000000000019'::uuid,
      '00000000-0000-0000-0000-000000000020'::uuid, '00000000-0000-0000-0000-000000000021'::uuid,
      '00000000-0000-0000-0000-000000000022'::uuid, '00000000-0000-0000-0000-000000000023'::uuid,
      '00000000-0000-0000-0000-000000000024'::uuid, '00000000-0000-0000-0000-000000000025'::uuid,
      '00000000-0000-0000-0000-000000000026'::uuid, '00000000-0000-0000-0000-000000000027'::uuid,
      '00000000-0000-0000-0000-000000000028'::uuid, '00000000-0000-0000-0000-000000000029'::uuid,
      '00000000-0000-0000-0000-000000000030'::uuid, '00000000-0000-0000-0000-000000000031'::uuid
    ]);
  exception when others then null;
  end;

  begin
    delete from enrollments where student_id = any(array[
      '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000003'::uuid,
      '00000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000005'::uuid,
      '00000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000007'::uuid,
      '00000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000009'::uuid,
      '00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000011'::uuid,
      '00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000013'::uuid,
      '00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0000-000000000015'::uuid,
      '00000000-0000-0000-0000-000000000016'::uuid, '00000000-0000-0000-0000-000000000017'::uuid,
      '00000000-0000-0000-0000-000000000018'::uuid, '00000000-0000-0000-0000-000000000019'::uuid,
      '00000000-0000-0000-0000-000000000020'::uuid, '00000000-0000-0000-0000-000000000021'::uuid,
      '00000000-0000-0000-0000-000000000022'::uuid, '00000000-0000-0000-0000-000000000023'::uuid,
      '00000000-0000-0000-0000-000000000024'::uuid, '00000000-0000-0000-0000-000000000025'::uuid,
      '00000000-0000-0000-0000-000000000026'::uuid, '00000000-0000-0000-0000-000000000027'::uuid,
      '00000000-0000-0000-0000-000000000028'::uuid, '00000000-0000-0000-0000-000000000029'::uuid,
      '00000000-0000-0000-0000-000000000030'::uuid, '00000000-0000-0000-0000-000000000031'::uuid
    ]);
  exception when others then null;
  end;

  begin
    delete from students where id = any(array[
      '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000003'::uuid,
      '00000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000005'::uuid,
      '00000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000007'::uuid,
      '00000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000009'::uuid,
      '00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000011'::uuid,
      '00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000013'::uuid,
      '00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0000-000000000015'::uuid,
      '00000000-0000-0000-0000-000000000016'::uuid, '00000000-0000-0000-0000-000000000017'::uuid,
      '00000000-0000-0000-0000-000000000018'::uuid, '00000000-0000-0000-0000-000000000019'::uuid,
      '00000000-0000-0000-0000-000000000020'::uuid, '00000000-0000-0000-0000-000000000021'::uuid,
      '00000000-0000-0000-0000-000000000022'::uuid, '00000000-0000-0000-0000-000000000023'::uuid,
      '00000000-0000-0000-0000-000000000024'::uuid, '00000000-0000-0000-0000-000000000025'::uuid,
      '00000000-0000-0000-0000-000000000026'::uuid, '00000000-0000-0000-0000-000000000027'::uuid,
      '00000000-0000-0000-0000-000000000028'::uuid, '00000000-0000-0000-0000-000000000029'::uuid,
      '00000000-0000-0000-0000-000000000030'::uuid, '00000000-0000-0000-0000-000000000031'::uuid
    ]);
  exception when others then null;
  end;

  begin
    delete from profiles where id = any(array[
      '00000000-0000-0000-0000-000000000001'::uuid,
      '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000003'::uuid,
      '00000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000005'::uuid,
      '00000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000007'::uuid,
      '00000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000009'::uuid,
      '00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000011'::uuid,
      '00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000013'::uuid,
      '00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0000-000000000015'::uuid,
      '00000000-0000-0000-0000-000000000016'::uuid, '00000000-0000-0000-0000-000000000017'::uuid,
      '00000000-0000-0000-0000-000000000018'::uuid, '00000000-0000-0000-0000-000000000019'::uuid,
      '00000000-0000-0000-0000-000000000020'::uuid, '00000000-0000-0000-0000-000000000021'::uuid,
      '00000000-0000-0000-0000-000000000022'::uuid, '00000000-0000-0000-0000-000000000023'::uuid,
      '00000000-0000-0000-0000-000000000024'::uuid, '00000000-0000-0000-0000-000000000025'::uuid,
      '00000000-0000-0000-0000-000000000026'::uuid, '00000000-0000-0000-0000-000000000027'::uuid,
      '00000000-0000-0000-0000-000000000028'::uuid, '00000000-0000-0000-0000-000000000029'::uuid,
      '00000000-0000-0000-0000-000000000030'::uuid, '00000000-0000-0000-0000-000000000031'::uuid
    ]);
  exception when others then null;
  end;

  -- Delete old auth users (by ID to avoid email constraint issues)
  begin
    delete from auth.users where id = any(array[
      '00000000-0000-0000-0000-000000000001'::uuid,
      '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000003'::uuid,
      '00000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000005'::uuid,
      '00000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000007'::uuid,
      '00000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000009'::uuid,
      '00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000011'::uuid,
      '00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000013'::uuid,
      '00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0000-000000000015'::uuid,
      '00000000-0000-0000-0000-000000000016'::uuid, '00000000-0000-0000-0000-000000000017'::uuid,
      '00000000-0000-0000-0000-000000000018'::uuid, '00000000-0000-0000-0000-000000000019'::uuid,
      '00000000-0000-0000-0000-000000000020'::uuid, '00000000-0000-0000-0000-000000000021'::uuid,
      '00000000-0000-0000-0000-000000000022'::uuid, '00000000-0000-0000-0000-000000000023'::uuid,
      '00000000-0000-0000-0000-000000000024'::uuid, '00000000-0000-0000-0000-000000000025'::uuid,
      '00000000-0000-0000-0000-000000000026'::uuid, '00000000-0000-0000-0000-000000000027'::uuid,
      '00000000-0000-0000-0000-000000000028'::uuid, '00000000-0000-0000-0000-000000000029'::uuid,
      '00000000-0000-0000-0000-000000000030'::uuid, '00000000-0000-0000-0000-000000000031'::uuid
    ]);
  exception when others then null;
  end;

  -- Also clean up by email in case IDs differ from a previous partial run
  begin
    delete from auth.users
    where email like '%@students.local'
       or email = 'teacher@amracademy.com'
       or email = 'teacher@amracademy.local';
  exception when others then null;
  end;

  -- ─────────────────────────────────────────────────────────────────
  -- Step 2: Teacher
  -- ─────────────────────────────────────────────────────────────────
  begin
    insert into auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, role, aud
    ) values (
      v_teacher_id,
      'teacher@amracademy.com',
      crypt('Teacher@123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(), now(), 'authenticated', 'authenticated'
    );
  exception when others then
    raise notice 'Teacher auth.users insert skipped: %', sqlerrm;
  end;

  insert into profiles (id, role, full_name, locale)
  values (v_teacher_id, 'teacher', 'Amr Hassan', 'en')
  on conflict (id) do update set role = 'teacher', full_name = 'Amr Hassan';

  -- ─────────────────────────────────────────────────────────────────
  -- Step 3: Classes
  -- ─────────────────────────────────────────────────────────────────
  insert into classes (id, name, subject, level, schedule)
  values
    (v_class_math, 'Mathematics - Grade 10', 'Mathematics', 'Grade 10',
     '[{"dow":1,"start":"16:00","end":"17:30"},{"dow":4,"start":"16:00","end":"17:30"}]'::jsonb),
    (v_class_phys, 'Physics - Grade 11', 'Physics', 'Grade 11',
     '[{"dow":2,"start":"15:00","end":"16:30"},{"dow":5,"start":"15:00","end":"16:30"}]'::jsonb),
    (v_class_chem, 'Chemistry - Grade 12', 'Chemistry', 'Grade 12',
     '[{"dow":3,"start":"17:00","end":"18:30"},{"dow":6,"start":"17:00","end":"18:30"}]'::jsonb)
  on conflict (id) do nothing;

  -- ─────────────────────────────────────────────────────────────────
  -- Step 4: Fee structures
  -- ─────────────────────────────────────────────────────────────────
  insert into fee_structures (class_id, name, kind, amount, active_from)
  values
    (v_class_math, 'Monthly Fee', 'monthly', 500.00, '2024-01-01'),
    (v_class_phys, 'Monthly Fee', 'monthly', 600.00, '2024-01-01'),
    (v_class_chem, 'Monthly Fee', 'monthly', 550.00, '2024-01-01')
  on conflict do nothing;

  -- ─────────────────────────────────────────────────────────────────
  -- Step 5: Students
  -- ─────────────────────────────────────────────────────────────────
  for i in 1..30 loop
    v_sid  := v_students[i];
    v_code := 'S' || (1000 + i)::text;
    v_name := v_names[i];
    v_phone := '010' || lpad((10000000 + i * 37)::text, 8, '0');
    v_auth_ok := false;

    -- Insert auth user – no conflict clause because we deleted above.
    -- If it still fails (e.g. RLS blocked delete), skip downstream inserts safely.
    begin
      insert into auth.users (
        id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, role, aud
      ) values (
        v_sid,
        v_code || '@students.local',
        crypt('Student@123456', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        now() - ((30 - i) || ' days')::interval,
        now(),
        'authenticated', 'authenticated'
      );
      v_auth_ok := true;
    exception when others then
      raise notice 'Student % auth.users insert skipped: %', v_code, sqlerrm;
      -- Try to confirm the user already exists with this ID
      if exists (select 1 from auth.users where id = v_sid) then
        v_auth_ok := true;
      end if;
    end;

    -- Only create profile + student record if auth user exists
    if v_auth_ok then
      insert into profiles (id, role, full_name, locale, created_at)
      values (v_sid, 'student', v_name, 'en', now() - ((30 - i) || ' days')::interval)
      on conflict (id) do nothing;

      insert into students (id, student_code, phone, enrolled_on)
      values (v_sid, v_code, v_phone, (current_date - ((30 - i) || ' days')::interval)::date)
      on conflict (id) do nothing;

      v_enrolled_on := (current_date - ((30 - i) || ' days')::interval)::date;

      if i <= 20 then
        insert into enrollments (class_id, student_id, enrolled_on)
        values (v_class_math, v_sid, v_enrolled_on)
        on conflict do nothing;
      end if;

      if i >= 1 and i <= 15 then
        insert into enrollments (class_id, student_id, enrolled_on)
        values (v_class_phys, v_sid, v_enrolled_on)
        on conflict do nothing;
      end if;

      if i >= 10 then
        insert into enrollments (class_id, student_id, enrolled_on)
        values (v_class_chem, v_sid, v_enrolled_on)
        on conflict do nothing;
      end if;
    end if;

  end loop;

  -- ─────────────────────────────────────────────────────────────────
  -- Step 6: Attendance (only for students that actually exist)
  -- ─────────────────────────────────────────────────────────────────
  for i in 1..20 loop
    v_sid := v_students[i];
    -- Guard: skip if student row doesn't exist
    if not exists (select 1 from students where id = v_sid) then
      continue;
    end if;

    insert into attendance (class_id, student_id, date, status, marked_by)
    select
      v_class_math, v_sid, d::date,
      (array['present','present','present','late','absent'])[floor(random()*5+1)]::attendance_status,
      v_teacher_id
    from generate_series(current_date - 14, current_date - 1, '1 day'::interval) d
    where extract(dow from d::date) in (1, 4)
    on conflict (class_id, student_id, date) do nothing;

    if i <= 15 then
      insert into attendance (class_id, student_id, date, status, marked_by)
      select
        v_class_phys, v_sid, d::date,
        (array['present','present','absent','present','late'])[floor(random()*5+1)]::attendance_status,
        v_teacher_id
      from generate_series(current_date - 14, current_date - 1, '1 day'::interval) d
      where extract(dow from d::date) in (2, 5)
      on conflict (class_id, student_id, date) do nothing;
    end if;
  end loop;

  -- ─────────────────────────────────────────────────────────────────
  -- Step 7: Charges
  -- ─────────────────────────────────────────────────────────────────
  for i in 1..30 loop
    v_sid := v_students[i];
    if not exists (select 1 from students where id = v_sid) then continue; end if;

    if i <= 20 then
      insert into charges (student_id, class_id, kind, period, description, amount, due_date)
      select v_sid, v_class_math, 'monthly', m, 'Monthly fee - ' || to_char(m, 'Mon YYYY'), 500.00, m + 14
      from (
        select date_trunc('month', current_date - ((n-1) || ' months')::interval)::date as m
        from generate_series(1,3) n
      ) months
      on conflict do nothing;
    end if;

    if i <= 15 then
      insert into charges (student_id, class_id, kind, period, description, amount, due_date)
      select v_sid, v_class_phys, 'monthly', m, 'Monthly fee - ' || to_char(m, 'Mon YYYY'), 600.00, m + 14
      from (
        select date_trunc('month', current_date - ((n-1) || ' months')::interval)::date as m
        from generate_series(1,3) n
      ) months
      on conflict do nothing;
    end if;
  end loop;

  -- ─────────────────────────────────────────────────────────────────
  -- Step 8: Sample Payments (first 10 students only)
  -- ─────────────────────────────────────────────────────────────────
  for i in 1..10 loop
    v_sid := v_students[i];
    if not exists (select 1 from students where id = v_sid) then continue; end if;

    declare
      v_pay_id   uuid := ('00000000-0000-0000-0000-00000000090' || (i-1)::text)::uuid;
      v_charge_id uuid;
    begin
      select id into v_charge_id
      from charges
      where student_id = v_sid and class_id = v_class_math and voided_at is null
      order by due_date desc limit 1;

      if v_charge_id is not null then
        insert into payments (id, student_id, amount, method, paid_at, recorded_by)
        values (v_pay_id, v_sid, 500.00, 'cash', now() - ((30-i) || ' days')::interval, v_teacher_id)
        on conflict do nothing;

        insert into payment_allocations (payment_id, charge_id, amount)
        values (v_pay_id, v_charge_id, 500.00)
        on conflict do nothing;
      end if;
    end;
  end loop;

  -- ─────────────────────────────────────────────────────────────────
  -- Step 9: Settings
  -- ─────────────────────────────────────────────────────────────────
  update settings set value = '"Amr Academy"' where key = 'school_name';
  update settings set value = '"EGP"'          where key = 'currency';
  update settings set value = '"Africa/Cairo"' where key = 'timezone';

end;
$$;

