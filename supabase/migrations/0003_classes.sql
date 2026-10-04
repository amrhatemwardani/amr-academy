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
