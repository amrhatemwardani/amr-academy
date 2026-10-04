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
