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
