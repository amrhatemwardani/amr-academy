-- =====================================================================
-- 0012_assignments.sql
-- Homework / Assignments system
-- =====================================================================

-- assignments: teacher creates tasks per class or individual student
create table if not exists assignments (
  id            uuid        primary key default gen_random_uuid(),
  title         text        not null,
  description   text,
  resource_link text,
  type          text        not null default 'homework',
  -- type values: 'homework' | 'quiz' | 'pdf_upload' | 'written'
  class_id      uuid        references classes(id) on delete cascade,
  student_id    uuid        references students(id) on delete cascade,
  -- student_id IS NULL  → assigned to whole class
  -- student_id NOT NULL → assigned to one specific student
  due_date      timestamptz,
  max_score     integer     not null default 100,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table assignments is 'Teacher-created homework, quizzes, and tasks';
comment on column assignments.student_id is 'NULL = whole class; non-null = individual student only';

create index if not exists assignments_class_idx   on assignments(class_id);
create index if not exists assignments_student_idx on assignments(student_id);
create index if not exists assignments_active_idx  on assignments(is_active) where is_active;

-- assignment_submissions: student submits their work
create table if not exists assignment_submissions (
  id              uuid        primary key default gen_random_uuid(),
  assignment_id   uuid        not null references assignments(id) on delete cascade,
  student_id      uuid        not null references students(id) on delete cascade,
  content         text,           -- written answer text
  file_url        text,           -- uploaded file path (future Supabase storage)
  file_name       text,           -- original file name for display
  score           integer,        -- teacher grades (null = not yet graded)
  teacher_note    text,           -- teacher feedback
  status          text        not null default 'submitted',
  -- status values: 'submitted' | 'graded' | 'late'
  submitted_at    timestamptz not null default now(),
  graded_at       timestamptz,
  unique (assignment_id, student_id)
);

comment on table assignment_submissions is 'Student work submissions for assignments';

create index if not exists submissions_assignment_idx on assignment_submissions(assignment_id);
create index if not exists submissions_student_idx    on assignment_submissions(student_id);

-- RLS: teachers can manage all assignments; students read only their own
alter table assignments            enable row level security;
alter table assignment_submissions enable row level security;

-- Teacher full access
create policy "teachers_manage_assignments" on assignments
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'teacher')
  );

create policy "teachers_manage_submissions" on assignment_submissions
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'teacher')
  );

-- Students can read assignments for their enrolled classes or assigned directly to them
create policy "students_view_assignments" on assignments
  for select using (
    auth.uid() = student_id
    or exists (
      select 1 from enrollments e
      where e.student_id = auth.uid()
        and e.class_id = assignments.class_id
        and e.left_on is null
    )
  );

-- Students can read and insert their own submissions
create policy "students_view_own_submissions" on assignment_submissions
  for select using (auth.uid() = student_id);

create policy "students_insert_own_submissions" on assignment_submissions
  for insert with check (auth.uid() = student_id);
